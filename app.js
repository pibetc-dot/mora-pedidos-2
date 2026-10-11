const STORAGE = { cart: 'moraCartV2', settings: 'moraSettingsV2', orders: 'moraOrdersV2' };

const DEFAULT_SETTINGS = {
  businessName: 'Mora Hamburguesas',
  whatsappNumber: '5491169347203',
  currency: '$',
  pickupLabel: 'Retiro por local',
  deliveryLabel: 'Delivery',
  paymentMethods: ['Transferencia', 'Efectivo', 'Mercado Pago'],
  deliveryZones: [
    { id: 'z1', name: 'Zona 1', price: 0 },
    { id: 'z2', name: 'Zona 2', price: 0 },
    { id: 'z3', name: 'Zona 3', price: 0 }
  ],
  products: [
    { id: 1, category: 'Hamburguesas', name: 'Mora Clásica', desc: 'Carne, lechuga, tomate y cebolla', price: 350, emoji: '🍔', image: '', extras: [] },
    { id: 2, category: 'Hamburguesas', name: 'Mora Cheese', desc: 'Carne, cheddar, lechuga y tomate', price: 400, emoji: '🧀', image: '', extras: [] },
    { id: 3, category: 'Hamburguesas', name: 'Mora Completa', desc: 'Carne, queso, panceta, huevo y lechuga', price: 450, emoji: '⭐', image: '', extras: [] },
    { id: 4, category: 'Hamburguesas', name: 'Mora Bacon', desc: 'Carne, panceta crocante, queso y tomate', price: 420, emoji: '🥓', image: '', extras: [] },
    { id: 5, category: 'Papas', name: 'Papas Mora', desc: 'Porción de papas fritas', price: 150, emoji: '🍟', image: '', extras: [] },
    { id: 6, category: 'Bebidas', name: 'Bebida 500 ml', desc: 'Gaseosa o agua', price: 80, emoji: '🥤', image: '', extras: [] }
  ]
};

let settings = loadSettings();
let cart = loadJSON(STORAGE.cart, []);
let selectedProduct = null;
let activeCategory = 'Todos';
let adminSession = null;
let cloudHydrated = false;

function loadJSON(key, fallback) { try { const x = JSON.parse(localStorage.getItem(key)); return x ?? fallback; } catch { return fallback; } }
function saveJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
async function saveSettingsEverywhere(){ saveJSON(STORAGE.settings,settings); if(window.MoraCloud?.isEnabled()){ try { await MoraCloud.saveSettings(settings); } catch(e){ console.error(e); toast('Error al guardar en la nube',true); } } }
async function hydrateFromCloud(){ if(!window.MoraCloud?.isEnabled()) return; try { const remote=await MoraCloud.getSettings(); if(remote){ settings={...deepCopy(DEFAULT_SETTINGS),...remote,products:remote.products||deepCopy(DEFAULT_SETTINGS.products),deliveryZones:remote.deliveryZones||deepCopy(DEFAULT_SETTINGS.deliveryZones)}; } cloudHydrated=true; } catch(e){ console.error(e); } }
async function cloudOrders(){ if(window.MoraCloud?.isEnabled() && adminSession){ try { return await MoraCloud.listOrders(); } catch(e){ console.error(e); } } return loadJSON(STORAGE.orders,[]).slice(0,50); }
function deepCopy(x) { return JSON.parse(JSON.stringify(x)); }
function loadSettings() {
  const saved = loadJSON(STORAGE.settings, null);
  return saved ? { ...deepCopy(DEFAULT_SETTINGS), ...saved, products: saved.products || deepCopy(DEFAULT_SETTINGS.products), deliveryZones: saved.deliveryZones || deepCopy(DEFAULT_SETTINGS.deliveryZones) } : deepCopy(DEFAULT_SETTINGS);
}
function money(n) { return `${settings.currency}${Number(n || 0).toLocaleString('es-AR')}`; }
function esc(v) { return String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }
function product(id) { return settings.products.find(p => Number(p.id) === Number(id)); }
function categories() { return ['Todos', ...new Set(settings.products.map(p => p.category).filter(Boolean))]; }
function cartCount() { return cart.reduce((s,i)=>s+i.qty,0); }
function cartSubtotal() { return cart.reduce((s,i)=>s+i.unitPrice*i.qty,0); }
function selectedDeliveryPrice() { if (document.getElementById('fulfillment')?.value !== 'delivery') return 0; const z = settings.deliveryZones.find(x=>x.id === document.getElementById('deliveryZone').value); return z?.price ?? 0; }
function total() { return cartSubtotal() + selectedDeliveryPrice(); }

function renderCategories() {
  document.getElementById('categoryTabs').innerHTML = categories().map(c=>`<button class="category-tab ${c===activeCategory?'active':''}" data-category="${esc(c)}" type="button">${esc(c)}</button>`).join('');
}
function renderMenu() {
  const list = settings.products.filter(p=>activeCategory==='Todos' || p.category===activeCategory);
  document.getElementById('menu').innerHTML = list.length ? list.map(p=>`
    <article class="product-card">
      <button class="product-open" data-product="${p.id}" type="button">
        <div class="product-image">${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">` : `<span>${esc(p.emoji || '🍔')}</span>`}</div>
        <div class="product-info"><div class="product-top"><span class="product-category">${esc(p.category)}</span><strong>${money(p.price)}</strong></div><h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p></div>
      </button>
      <button class="quick-add" data-quick-add="${p.id}" type="button">+ Agregar</button>
    </article>`).join('') : '<div class="empty-state">Todavía no hay productos en esta categoría.</div>';
}
function renderFormOptions() {
  const fulfillment = document.getElementById('fulfillment');
  fulfillment.innerHTML = `<option value="pickup">${esc(settings.pickupLabel)}</option><option value="delivery">${esc(settings.deliveryLabel)}</option>`;
  const payment = document.getElementById('payment'); payment.innerHTML = settings.paymentMethods.map(p=>`<option>${esc(p)}</option>`).join('');
  const zones = document.getElementById('deliveryZone'); zones.innerHTML = settings.deliveryZones.map(z=>`<option value="${esc(z.id)}">${esc(z.name)}${z.price ? ` — ${money(z.price)}` : ''}</option>`).join('');
  updateDeliveryVisibility();
}
function renderCart() {
  document.getElementById('cartCount').textContent = cartCount();
  const box = document.getElementById('cart');
  if (!cart.length) box.innerHTML = '<div class="empty-cart">Tu carrito está vacío.<br><span>Elegí algo del menú y aparece acá 🍔</span></div>';
  else box.innerHTML = cart.map(i=>`<div class="cart-row"><div class="cart-main"><strong>${esc(i.name)}</strong><small>${money(i.unitPrice)} c/u${i.extras?.length ? ` · ${esc(i.extras.map(x=>x.name).join(', '))}` : ''}</small></div><div class="cart-qty"><button data-change="-1" data-key="${esc(i.key)}" type="button">−</button><span>${i.qty}</span><button data-change="1" data-key="${esc(i.key)}" type="button">+</button></div><button data-remove="${esc(i.key)}" type="button">🗑</button></div>`).join('');
  document.getElementById('summary').innerHTML = `<div><span>Productos</span><strong>${money(cartSubtotal())}</strong></div>${document.getElementById('fulfillment').value==='delivery'?`<div><span>Envío</span><strong>${selectedDeliveryPrice()?money(selectedDeliveryPrice()):'Gratis'}</strong></div>`:''}<div class="summary-total"><span>Total</span><strong>${money(total())}</strong></div>`;
  document.getElementById('whatsapp').disabled = !cart.length;
  document.getElementById('clearCartBtn').hidden = !cart.length;
}
function updateDeliveryVisibility() { document.getElementById('deliveryFields').hidden = document.getElementById('fulfillment').value !== 'delivery'; renderCart(); }

function openProduct(id) {
  selectedProduct = product(id); if (!selectedProduct) return;
  document.getElementById('modalCategory').textContent = selectedProduct.category || 'MORA';
  document.getElementById('modalTitle').textContent = selectedProduct.name;
  document.getElementById('modalDesc').textContent = selectedProduct.desc;
  document.getElementById('modalImage').innerHTML = selectedProduct.image ? `<img src="${esc(selectedProduct.image)}" alt="${esc(selectedProduct.name)}">` : esc(selectedProduct.emoji || '🍔');
  document.getElementById('modalPrice').textContent = money(selectedProduct.price);
  const options = selectedProduct.extras || [];
  document.getElementById('modalOptions').innerHTML = options.length ? `<div class="option-title">Extras</div>${options.map((x,i)=>`<label class="check-option"><input type="checkbox" data-extra-index="${i}"><span>${esc(x.name)}</span><small>+${money(x.price)}</small></label>`).join('')}` : '';
  setModal('productModal', true);
}
function setModal(id, open) { const m=document.getElementById(id); m.classList.toggle('open',open); m.setAttribute('aria-hidden',String(!open)); document.body.classList.toggle('modal-open',open); }
function addProduct(id, extras=[]) {
  const p=product(id); if(!p) return;
  const extraTotal=extras.reduce((s,x)=>s+Number(x.price||0),0); const key=`${p.id}|${extras.map(x=>x.name).sort().join(',')}`;
  const existing=cart.find(x=>x.key===key);
  if(existing) existing.qty++; else cart.push({key,id:p.id,name:p.name,unitPrice:Number(p.price)+extraTotal,qty:1,extras});
  saveJSON(STORAGE.cart,cart); renderCart(); toast('Agregado al pedido ✓');
}
function buildMessage() {
  const name=document.getElementById('name').value.trim(), phone=document.getElementById('phone').value.trim();
  const delivery=document.getElementById('fulfillment').value==='delivery'; const address=document.getElementById('address').value.trim();
  const zone=settings.deliveryZones.find(z=>z.id===document.getElementById('deliveryZone').value); const payment=document.getElementById('payment').value; const notes=document.getElementById('notes').value.trim();
  const orderId=`MORA-${String(Date.now()).slice(-6)}`;
  let m=`🍔 *${settings.businessName.toUpperCase()}*\n*PEDIDO ${orderId}*\n\n`;
  m+=`*Cliente:* ${name}\n*WhatsApp:* ${phone}\n*Entrega:* ${delivery ? `Delivery — ${zone?.name || ''}` : settings.pickupLabel}\n`;
  if(delivery) m+=`*Dirección:* ${address}\n`;
  m+=`*Pago:* ${payment}\n\n*PRODUCTOS:*\n`;
  cart.forEach(i=>{m+=`• ${i.name} x${i.qty} — ${money(i.unitPrice*i.qty)}\n`; if(i.extras?.length)m+=`  Extras: ${i.extras.map(x=>x.name).join(', ')}\n`;});
  m+=`\n*Subtotal:* ${money(cartSubtotal())}\n*Delivery:* ${delivery?(selectedDeliveryPrice()?money(selectedDeliveryPrice()):'Gratis'):'—'}\n*TOTAL: ${money(total())}*`;
  if(notes)m+=`\n\n*Notas:* ${notes}`;
  return {message:m,orderId};
}
function validate() {
  if(!cart.length) return 'Agregá al menos un producto.';
  if(!document.getElementById('name').value.trim()) return 'Completá tu nombre.';
  const ph=document.getElementById('phone').value.replace(/\D/g,''); if(ph.length<8) return 'Revisá tu número de WhatsApp.';
  if(document.getElementById('fulfillment').value==='delivery' && !document.getElementById('address').value.trim()) return 'Completá la dirección de entrega.';
  const wa=String(settings.whatsappNumber).replace(/\D/g,''); if(wa.length<10) return 'Falta configurar el WhatsApp de Mora.';
  return '';
}
async function sendOrder() {
  const error=validate(); if(error){toast(error,true); return;}
  const {message,orderId}=buildMessage();
  const order={id:orderId,createdAt:new Date().toISOString(),message,total:total(),products:deepCopy(cart),customer:{name:document.getElementById('name').value.trim(),phone:document.getElementById('phone').value.trim(),address:document.getElementById('address').value.trim(),fulfillment:document.getElementById('fulfillment').value}};
  const orders=loadJSON(STORAGE.orders,[]); orders.push(order); saveJSON(STORAGE.orders,orders);
  if(window.MoraCloud?.isEnabled()){ try { await MoraCloud.createOrder(order); } catch(e){ console.error(e); toast('Pedido guardado localmente; no se pudo sincronizar.',true); } }
  window.open(`https://wa.me/${String(settings.whatsappNumber).replace(/\D/g,'')}?text=${encodeURIComponent(message)}`,'_blank','noopener,noreferrer');
  toast('Pedido preparado en WhatsApp ✓');
}
function toast(msg,error=false){const t=document.getElementById('toast'); t.textContent=msg; t.className=`toast show ${error?'error':''}`; clearTimeout(window.__toast); window.__toast=setTimeout(()=>t.className='',3500); }

async function adminOpen(tab='business'){
  setModal('adminModal',true);
  if(window.MoraCloud?.isEnabled()){
    adminSession=await MoraCloud.session();
    renderAdminAuth();
    if(!adminSession){ renderAdmin('login'); return; }
  }
  renderAdmin(tab);
}
function renderAdminAuth(){
  const a=document.getElementById('adminAuth');
  if(!window.MoraCloud?.isEnabled()){ 
    a.innerHTML='<div class="admin-hint">Modo local: los cambios solo afectan este navegador.</div>';
    return;
  }
  if(adminSession){ a.innerHTML='<div class="admin-auth-bar"><span>☁️ Panel online conectado</span><button class="mini" id="adminLogout">Cerrar sesión</button></div>'; }
  else { a.innerHTML='<div class="admin-form"><label>Email<input id="adminEmail" type="email" autocomplete="username" placeholder="tu@email.com"></label><label>Contraseña<input id="adminPassword" type="password" autocomplete="current-password" placeholder="contraseña"></label><button class="btn btn-primary" id="adminLogin" type="button">Iniciar sesión</button></div>'; }
}
function renderAdmin(tab='business') {
  renderAdminAuth();
  if(window.MoraCloud?.isEnabled() && !adminSession) { if(tab!=='login') return; return; }
  document.querySelectorAll('[data-admin-tab]').forEach(b=>b.classList.toggle('active',b.dataset.adminTab===tab)); const c=document.getElementById('adminContent');
  if(tab==='business') c.innerHTML=`<div class="admin-form"><label>Nombre del negocio<input id="aName" value="${esc(settings.businessName)}"></label><label>WhatsApp de pedidos<input id="aWhatsApp" value="${esc(settings.whatsappNumber)}" placeholder="54 9 11 1234 5678"></label><button class="btn btn-primary" id="saveBusiness" type="button">Guardar cambios</button></div>`;
  if(tab==='products') c.innerHTML=`<div class="admin-toolbar"><button class="btn btn-outline" id="addProduct">+ Nuevo producto</button><button class="btn btn-outline" id="exportConfig">Exportar config</button></div>${settings.products.map(p=>`<div class="admin-product"><div><strong>${esc(p.name)}</strong><small>${esc(p.category)} · ${money(p.price)}</small></div><div><button class="mini" data-edit-product="${p.id}">✏️</button><button class="mini" data-delete-product="${p.id}">🗑</button></div></div>`).join('')}`;
  if(tab==='zones') c.innerHTML=`<div class="admin-form"><p class="admin-hint">Configurá el costo de cada zona. Si el precio es 0, aparecerá como gratis.</p>${settings.deliveryZones.map((z,i)=>`<div class="admin-zone"><label>${esc(z.name)}<input type="number" data-zone-name="${i}" value="${z.price}" min="0" step="50"></label></div>`).join('')}<button class="btn btn-outline" id="addZone">+ Nueva zona</button><button class="btn btn-primary" id="saveZones" type="button">Guardar</button></div>`;
  if(tab==='orders'){ c.innerHTML='<div class="empty-state">Cargando pedidos…</div>'; cloudOrders().then(orders=>{ const rows=orders.map(o=>'<div class="admin-order"><strong>'+esc(o.order_number||o.id)+'</strong><small>'+new Date(o.created_at).toLocaleString('es-AR')+'</small><div>'+esc(o.customer?.name||'Cliente')+' · '+money(o.total)+'</div></div>').join(''); c.innerHTML=rows || '<div class="empty-state">Sin pedidos aún.</div>'; }); }
}
function editProduct(id){const p=product(id); if(!p)return; const name=prompt('Nombre del producto',p.name); if(name===null)return; const price=Number(prompt('Precio',p.price)); if(!Number.isFinite(price))return; const desc=prompt('Descripción',p.desc); if(desc===null)return; const emoji=prompt('Emoji o URL',p.image||p.emoji); p.name=name; p.price=price; p.desc=desc; p.emoji=emoji; p.image=''; saveSettingsEverywhere(); renderCategories(); renderMenu(); renderAdmin('products'); }
function addNewProduct(){const name=prompt('Nombre del producto');if(!name)return;const price=Number(prompt('Precio',0));if(!Number.isFinite(price))return;const category=prompt('Categoría','Hamburguesas');if(!category)return;const desc=prompt('Descripción');if(!desc)return;const emoji=prompt('Emoji');settings.products.push({id:Date.now(),category,name,desc,price,emoji,image:'',extras:[]});saveSettingsEverywhere();renderCategories();renderMenu();renderAdmin('products');}
function exportConfig(){const blob=new Blob([JSON.stringify(settings,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mora-config.json';a.click();}

function wire(){
  document.getElementById('menuCta').onclick=()=>document.getElementById('menuSection').scrollIntoView({behavior:'smooth'});
  document.getElementById('cartBtn').onclick=()=>document.getElementById('checkout').scrollIntoView({behavior:'smooth'});
  document.getElementById('adminBtn').onclick=()=>adminOpen();
  document.getElementById('whatsapp').onclick=sendOrder;
  document.getElementById('clearCartBtn').onclick=()=>{if(confirm('¿Vaciar el carrito?')){cart=[];saveJSON(STORAGE.cart,cart);renderCart();}};
  document.getElementById('fulfillment').onchange=updateDeliveryVisibility;
  document.getElementById('deliveryZone').onchange=renderCart;
  document.getElementById('categoryTabs').onclick=e=>{const b=e.target.closest('[data-category]');if(b){activeCategory=b.dataset.category;renderCategories();renderMenu();}};
  document.getElementById('menu').onclick=e=>{const q=e.target.closest('[data-quick-add]'), p=e.target.closest('[data-product]');if(q){addProduct(Number(q.dataset.quickAdd));}else if(p){openProduct(Number(p.dataset.product));}};
  document.getElementById('cart').onclick=e=>{const c=e.target.closest('[data-change]'),r=e.target.closest('[data-remove]');if(c){const i=cart.find(x=>x.key===c.dataset.key);if(i){i.qty+=Number(c.dataset.change);if(i.qty<=0)cart=cart.filter(x=>x.key!==c.dataset.key);saveJSON(STORAGE.cart,cart);renderCart();}}if(r){cart=cart.filter(x=>x.key!==r.dataset.remove);saveJSON(STORAGE.cart,cart);renderCart();}};
  document.getElementById('modalAdd').onclick=()=>{const extras=[...document.querySelectorAll('#modalOptions input:checked')].map(x=>selectedProduct.extras[Number(x.dataset.extraIndex)]);addProduct(selectedProduct.id,extras);setModal('productModal',false);};
  document.querySelectorAll('[data-close-modal]').forEach(x=>x.onclick=()=>setModal('productModal',false)); document.querySelectorAll('[data-close-admin]').forEach(x=>x.onclick=()=>setModal('adminModal',false));
  document.querySelector('.admin-tabs').onclick=e=>{const b=e.target.closest('[data-admin-tab]');if(b)renderAdmin(b.dataset.adminTab);};
  document.getElementById('adminContent').onclick=async e=>{
    if(e.target.id==='adminLogin'){ try { adminSession=await MoraCloud.signIn(document.getElementById('adminEmail').value.trim(),document.getElementById('adminPassword').value); renderAdminAuth(); renderAdmin('business'); } catch(e){ toast(String(e?.message||e),true); } return; }
    if(e.target.id==='adminLogout'){ await MoraCloud.signOut(); adminSession=null; renderAdminAuth(); renderAdmin('login'); toast('Sesión cerrada'); return; }
    if(e.target.id==='refreshOrders'){ renderAdmin('orders'); return; }
    if(e.target.id==='saveBusiness'){settings.businessName=document.getElementById('aName').value.trim()||settings.businessName;settings.whatsappNumber=document.getElementById('aWhatsApp').value.trim()||settings.whatsappNumber;saveSettingsEverywhere();toast('Negocio actualizado ✓');renderAdmin('business');}
    if(e.target.id==='addProduct')addNewProduct(); if(e.target.id==='exportConfig')exportConfig();
    if(e.target.dataset.editProduct)editProduct(Number(e.target.dataset.editProduct));
    if(e.target.dataset.deleteProduct){settings.products=settings.products.filter(p=>p.id!==Number(e.target.dataset.deleteProduct));saveSettingsEverywhere();renderCategories();renderMenu();renderAdmin('products');}
    if(e.target.id==='addZone'){settings.deliveryZones.push({id:'z'+Date.now(),name:'Nueva zona',price:0});renderAdmin('zones');}
    if(e.target.id==='saveZones'){settings.deliveryZones=settings.deliveryZones.map((z,i)=>({...z,name:document.querySelector(`[data-zone-name="${i}"]`).value.trim()||z.name,price:Number(document.querySelector(`[data-zone-name="${i}"]`).value)||0}));saveSettingsEverywhere();renderAdmin('zones');}
    if(e.target.dataset.deleteZone){settings.deliveryZones.splice(Number(e.target.dataset.deleteZone),1);renderAdmin('zones');}
    if(e.target.id==='clearOrders'){if(confirm('¿Borrar todo el historial local?')){localStorage.removeItem(STORAGE.orders);renderAdmin('orders');}}
  };
}

document.addEventListener('DOMContentLoaded',async()=>{document.title=`${settings.businessName} — Pedidos Online`;wire();renderCategories();renderMenu();renderFormOptions();renderCart(); await hydrateFromCloud(); });
