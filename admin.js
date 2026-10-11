const STORAGE = { cart: 'moraCartV2', settings: 'moraSettingsV2', orders: 'moraOrdersV2', adminSession: 'moraAdminSession' };

function loadJSON(key, fallback) { try { const x = JSON.parse(localStorage.getItem(key)); return x ?? fallback; } catch { return fallback; } }
function saveJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function deepCopy(x) { return JSON.parse(JSON.stringify(x)); }
function esc(v) { return String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }

const DEFAULT_INGREDIENTS = [
  { id: 'pan', name: 'Pan', unit: 'u', price: 0 },
  { id: 'carne', name: 'Carne', unit: 'g', price: 0 },
  { id: 'queso', name: 'Queso', unit: 'g', price: 0 },
  { id: 'cebolla', name: 'Cebolla', unit: 'g', price: 0 },
  { id: 'ketchup', name: 'Ketchup', unit: 'g', price: 0 },
  { id: 'papas', name: 'Papas', unit: 'u', price: 0 },
  { id: 'salsa', name: 'Salsa', unit: 'g', price: 0 },
  { id: 'servilleta', name: 'Servilleta', unit: 'u', price: 0 },
  { id: 'bolsa', name: 'Bolsa', unit: 'u', price: 0 }
];

const DEFAULT_FIXED_COSTS = {
  gas: 0, aceite: 0, delivery: 0, empaques: 0, alquiler: 0, otros: 0
};

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
  fixedCosts: deepCopy(DEFAULT_FIXED_COSTS),
  ingredients: deepCopy(DEFAULT_INGREDIENTS),
  products: [
    { id: 1, category: 'Hamburguesas', name: 'Mora Clásica', desc: 'Carne, lechuga, tomate y cebolla', price: 350, emoji: '🍔', image: '', extras: [], recipe: [
      { name: 'Pan', qty: 1, unit: 'u' }, { name: 'Carne', qty: 120, unit: 'g' }, { name: 'Cebolla', qty: 30, unit: 'g' }, { name: 'Ketchup', qty: 15, unit: 'g' }, { name: 'Bolsa', qty: 1, unit: 'u' }
    ] },
    { id: 2, category: 'Hamburguesas', name: 'Mora Cheese', desc: 'Carne, cheddar, lechuga y tomate', price: 400, emoji: '🧀', image: '', extras: [], recipe: [
      { name: 'Pan', qty: 1, unit: 'u' }, { name: 'Carne', qty: 140, unit: 'g' }, { name: 'Queso', qty: 60, unit: 'g' }, { name: 'Cebolla', qty: 30, unit: 'g' }, { name: 'Ketchup', qty: 15, unit: 'g' }, { name: 'Bolsa', qty: 1, unit: 'u' }
    ] },
    { id: 3, category: 'Hamburguesas', name: 'Mora Completa', desc: 'Carne, queso, panceta, huevo y lechuga', price: 450, emoji: '⭐', image: '', extras: [], recipe: [
      { name: 'Pan', qty: 1, unit: 'u' }, { name: 'Carne', qty: 150, unit: 'g' }, { name: 'Queso', qty: 80, unit: 'g' }, { name: 'Cebolla', qty: 30, unit: 'g' }, { name: 'Ketchup', qty: 15, unit: 'g' }, { name: 'Bolsa', qty: 1, unit: 'u' }
    ] },
    { id: 4, category: 'Hamburguesas', name: 'Mora Bacon', desc: 'Carne, panceta crocante, queso y tomate', price: 420, emoji: '🥓', image: '', extras: [], recipe: [
      { name: 'Pan', qty: 1, unit: 'u' }, { name: 'Carne', qty: 130, unit: 'g' }, { name: 'Queso', qty: 40, unit: 'g' }, { name: 'Cebolla', qty: 30, unit: 'g' }, { name: 'Ketchup', qty: 15, unit: 'g' }, { name: 'Bolsa', qty: 1, unit: 'u' }
    ] },
    { id: 5, category: 'Papas', name: 'Papas Mora', desc: 'Porción de papas fritas', price: 150, emoji: '🍟', image: '', extras: [], recipe: [
      { name: 'Papas', qty: 1, unit: 'u' }, { name: 'Bolsa', qty: 1, unit: 'u' }
    ] },
    { id: 6, category: 'Bebidas', name: 'Bebida 500 ml', desc: 'Gaseosa o agua', price: 80, emoji: '🥤', image: '', extras: [], recipe: [
      { name: 'Salsa', qty: 500, unit: 'ml' }, { name: 'Bolsa', qty: 1, unit: 'u' }
    ] }
  ]
};

let settings = loadSettings();
let isLoggedIn = loadJSON(STORAGE.adminSession, false);
let currentTab = 'dashboard';

function loadSettings() {
  const saved = loadJSON(STORAGE.settings, null);
  return saved ? { ...deepCopy(DEFAULT_SETTINGS), ...saved, products: saved.products || deepCopy(DEFAULT_SETTINGS.products), ingredients: saved.ingredients || deepCopy(DEFAULT_INGREDIENTS), fixedCosts: saved.fixedCosts || deepCopy(DEFAULT_FIXED_COSTS), deliveryZones: saved.deliveryZones || deepCopy(DEFAULT_SETTINGS.deliveryZones) } : deepCopy(DEFAULT_SETTINGS);
}

function money(n) { return `${settings.currency}${Number(n || 0).toLocaleString('es-AR')}`; }

function login(email, password) {
  if (email.trim().toLowerCase() === 'luca' && password === 'mora 172309') {
    isLoggedIn = true;
    saveJSON(STORAGE.adminSession, true);
    render();
    return true;
  }
  return false;
}

function logout() {
  isLoggedIn = false;
  localStorage.removeItem(STORAGE.adminSession);
  render();
}

function getOrderMetrics() {
  const orders = loadJSON(STORAGE.orders, []);
  const revenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const cost = orders.reduce((sum, o) => sum + (Number(o.cost || 0)), 0);
  const gain = revenue - cost;
  const average = orders.length ? revenue / orders.length : 0;
  return { orders: orders.length, revenue, cost, gain, average, list: orders };
}

function renderLogin() {
  document.getElementById('app').innerHTML = `
    <div class="login-screen">
      <div class="login-box">
        <h1>Mora Admin</h1>
        <p>Ingresá para acceder al panel de administración.</p>
        <div class="field">
          <label>Usuario</label>
          <input id="emailInput" type="text" placeholder="luca" />
        </div>
        <div class="field">
          <label>Contraseña</label>
          <input id="passwordInput" type="password" placeholder="contraseña" />
        </div>
        <button class="primary-btn" id="loginBtn">Iniciar sesión</button>
        <div class="logger" id="logger"></div>
      </div>
    </div>
  `;
  
  document.getElementById('loginBtn').onclick = () => {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    const logger = document.getElementById('logger');
    
    if (!email || !password) {
      logger.textContent = 'Completá usuario y contraseña';
      logger.classList.add('error');
      return;
    }
    
    if (login(email, password)) {
      logger.textContent = '';
    } else {
      logger.textContent = 'Usuario o contraseña incorrectos';
      logger.classList.add('error');
    }
  };
  
  document.getElementById('passwordInput').onkeypress = (e) => {
    if (e.key === 'Enter') document.getElementById('loginBtn').click();
  };
}

function renderDashboard() {
  const metrics = getOrderMetrics();
  const orders = metrics.list.slice().reverse();
  
  document.getElementById('app').innerHTML = `
    <div class="admin-shell">
      <div class="sidebar">
        <div class="brand">
          <div class="brand-mark">M</div>
          <div class="brand-text">
            <strong>MORA</strong>
            <span>ADMIN</span>
          </div>
        </div>
        <nav class="nav">
          <button class="nav-btn active" data-tab="dashboard">📊 Dashboard</button>
          <button class="nav-btn" data-tab="business">🏪 Negocio</button>
          <button class="nav-btn" data-tab="products">🍔 Productos</button>
          <button class="nav-btn" data-tab="costs">💰 Costos</button>
          <button class="nav-btn" data-tab="reports">📈 Reportes</button>
          <button class="nav-btn" data-tab="orders">📦 Pedidos</button>
        </nav>
        <div class="nav-badge">
          <h4>Sesión activa</h4>
          <button class="cta" id="logoutBtn">Cerrar sesión</button>
        </div>
      </div>
      <div class="content">
        <div class="topbar">
          <div class="search-box">
            <span>🔍</span>
            <input type="text" placeholder="Buscar pedidos, productos..." />
          </div>
          <div class="top-right">
            <div class="date-pill" id="datePill"></div>
            <div class="icon-bell">🔔</div>
            <div class="user-chip">
              <div class="avatar">L</div>
              <span>Luca</span>
            </div>
          </div>
        </div>
        <div class="main">
          <div class="page-title">
            <h1>Dashboard</h1>
            <p>Resumen de tu negocio en tiempo real.</p>
          </div>
          <div class="cards">
            <div class="card">
              <div class="card-head">
                <div></div>
                <div class="card-icon">📦</div>
              </div>
              <div class="card-value">${metrics.orders}</div>
              <div class="trend">Pedidos totales</div>
            </div>
            <div class="card">
              <div class="card-head">
                <div></div>
                <div class="card-icon">💵</div>
              </div>
              <div class="card-value">${money(metrics.revenue)}</div>
              <div class="trend">Venta total</div>
            </div>
            <div class="card">
              <div class="card-head">
                <div></div>
                <div class="card-icon">📉</div>
              </div>
              <div class="card-value">${money(metrics.cost)}</div>
              <div class="trend">Costo total</div>
            </div>
            <div class="card">
              <div class="card-head">
                <div></div>
                <div class="card-icon">💚</div>
              </div>
              <div class="card-value">${money(metrics.gain)}</div>
              <div class="trend up">Ganancia</div>
            </div>
          </div>
          <div class="panel">
            <div class="panel-header">
              <h3>Pedidos recientes</h3>
              <div class="panel-actions">
                <button class="pill">📤 Exportar</button>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>ID Pedido</th>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Total</th>
                  <th>Costo</th>
                  <th>Ganancia</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                ${orders.slice(0, 10).map(o => `
                  <tr>
                    <td><strong>${esc(o.id || '—')}</strong></td>
                    <td>${esc(o.customer?.name || '—')}</td>
                    <td>${esc(o.customer?.phone || '—')}</td>
                    <td>${money(o.total || 0)}</td>
                    <td>${money(o.cost || 0)}</td>
                    <td><strong>${money(o.total - (o.cost || 0))}</strong></td>
                    <td>${new Date(o.createdAt).toLocaleDateString('es-AR')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('datePill').textContent = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  document.getElementById('logoutBtn').onclick = logout;
  
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.onclick = () => {
      const tab = btn.dataset.tab;
      currentTab = tab;
      if (tab === 'dashboard') renderDashboard();
      else if (tab === 'business') renderBusiness();
      else if (tab === 'products') renderProducts();
      else if (tab === 'costs') renderCosts();
      else if (tab === 'reports') renderReports();
      else if (tab === 'orders') renderOrdersTab();
    };
  });
}

function renderBusiness() {
  document.getElementById('app').innerHTML = `
    <div class="admin-shell">
      <div class="sidebar">
        <div class="brand">
          <div class="brand-mark">M</div>
          <div class="brand-text"><strong>MORA</strong><span>ADMIN</span></div>
        </div>
        <nav class="nav">
          <button class="nav-btn" data-tab="dashboard">📊 Dashboard</button>
          <button class="nav-btn active" data-tab="business">🏪 Negocio</button>
          <button class="nav-btn" data-tab="products">🍔 Productos</button>
          <button class="nav-btn" data-tab="costs">💰 Costos</button>
          <button class="nav-btn" data-tab="reports">📈 Reportes</button>
          <button class="nav-btn" data-tab="orders">📦 Pedidos</button>
        </nav>
        <div class="nav-badge">
          <h4>Sesión activa</h4>
          <button class="cta" id="logoutBtn">Cerrar sesión</button>
        </div>
      </div>
      <div class="content">
        <div class="topbar">
          <div class="search-box">
            <span>🔍</span>
            <input type="text" placeholder="Buscar..." />
          </div>
          <div class="top-right">
            <div class="date-pill" id="datePill"></div>
            <div class="icon-bell">🔔</div>
            <div class="user-chip">
              <div class="avatar">L</div>
              <span>Luca</span>
            </div>
          </div>
        </div>
        <div class="main">
          <div class="page-title">
            <h1>Configuración del negocio</h1>
            <p>Actualiza los datos principales de Mora.</p>
          </div>
          <div class="panel">
            <div class="panel-header">
              <h3>Datos generales</h3>
            </div>
            <div style="padding: 20px;">
              <div class="field">
                <label>Nombre del negocio</label>
                <input id="businessName" type="text" value="${esc(settings.businessName)}" />
              </div>
              <div class="field">
                <label>Número de WhatsApp</label>
                <input id="businessWhatsapp" type="text" value="${esc(settings.whatsappNumber)}" />
              </div>
              <button class="primary-btn" id="saveBusiness" style="margin-top: 16px;">Guardar cambios</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('datePill').textContent = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  document.getElementById('logoutBtn').onclick = logout;
  document.getElementById('saveBusiness').onclick = () => {
    settings.businessName = document.getElementById('businessName').value.trim() || settings.businessName;
    settings.whatsappNumber = document.getElementById('businessWhatsapp').value.trim() || settings.whatsappNumber;
    saveJSON(STORAGE.settings, settings);
    alert('Cambios guardados ✓');
  };
  
  setupNavigation();
}

function renderProducts() {
  document.getElementById('app').innerHTML = `
    <div class="admin-shell">
      <div class="sidebar">
        <div class="brand">
          <div class="brand-mark">M</div>
          <div class="brand-text"><strong>MORA</strong><span>ADMIN</span></div>
        </div>
        <nav class="nav">
          <button class="nav-btn" data-tab="dashboard">📊 Dashboard</button>
          <button class="nav-btn" data-tab="business">🏪 Negocio</button>
          <button class="nav-btn active" data-tab="products">🍔 Productos</button>
          <button class="nav-btn" data-tab="costs">💰 Costos</button>
          <button class="nav-btn" data-tab="reports">📈 Reportes</button>
          <button class="nav-btn" data-tab="orders">📦 Pedidos</button>
        </nav>
        <div class="nav-badge">
          <h4>Sesión activa</h4>
          <button class="cta" id="logoutBtn">Cerrar sesión</button>
        </div>
      </div>
      <div class="content">
        <div class="topbar">
          <div class="search-box">
            <span>🔍</span>
            <input type="text" placeholder="Buscar..." />
          </div>
          <div class="top-right">
            <div class="date-pill" id="datePill"></div>
            <div class="icon-bell">🔔</div>
            <div class="user-chip">
              <div class="avatar">L</div>
              <span>Luca</span>
            </div>
          </div>
        </div>
        <div class="main">
          <div class="page-title">
            <h1>Productos</h1>
            <p>Gestiona el menú de Mora.</p>
          </div>
          <div class="panel">
            <div class="panel-header">
              <h3>Lista de productos</h3>
              <div class="panel-actions">
                <button class="pill" id="addProduct">+ Agregar producto</button>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Descripción</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${settings.products.map(p => `
                  <tr>
                    <td><strong>${esc(p.name)}</strong></td>
                    <td>${esc(p.category)}</td>
                    <td>${money(p.price)}</td>
                    <td>${esc(p.desc)}</td>
                    <td>
                      <div class="row-actions">
                        <button data-edit-product="${p.id}">✏️ Editar</button>
                        <button data-delete-product="${p.id}">🗑 Borrar</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('datePill').textContent = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  document.getElementById('logoutBtn').onclick = logout;
  document.getElementById('addProduct').onclick = () => {
    const name = prompt('Nombre del producto');
    if (!name) return;
    const price = Number(prompt('Precio', '0'));
    const category = prompt('Categoría', 'Hamburguesas');
    const desc = prompt('Descripción', '');
    
    settings.products.push({
      id: Date.now(),
      category, name, desc, price,
      emoji: '🍔',
      image: '',
      extras: [],
      recipe: []
    });
    saveJSON(STORAGE.settings, settings);
    renderProducts();
  };
  
  document.querySelectorAll('[data-edit-product]').forEach(btn => {
    btn.onclick = () => {
      const p = settings.products.find(x => x.id === Number(btn.dataset.editProduct));
      if (!p) return;
      const name = prompt('Nombre', p.name);
      if (name === null) return;
      const price = Number(prompt('Precio', p.price));
      const category = prompt('Categoría', p.category);
      const desc = prompt('Descripción', p.desc);
      
      p.name = name;
      p.price = price;
      p.category = category;
      p.desc = desc;
      saveJSON(STORAGE.settings, settings);
      renderProducts();
    };
  });
  
  document.querySelectorAll('[data-delete-product]').forEach(btn => {
    btn.onclick = () => {
      if (confirm('¿Borrar este producto?')) {
        settings.products = settings.products.filter(p => p.id !== Number(btn.dataset.deleteProduct));
        saveJSON(STORAGE.settings, settings);
        renderProducts();
      }
    };
  });
  
  setupNavigation();
}

function renderCosts() {
  document.getElementById('app').innerHTML = `
    <div class="admin-shell">
      <div class="sidebar">
        <div class="brand">
          <div class="brand-mark">M</div>
          <div class="brand-text"><strong>MORA</strong><span>ADMIN</span></div>
        </div>
        <nav class="nav">
          <button class="nav-btn" data-tab="dashboard">📊 Dashboard</button>
          <button class="nav-btn" data-tab="business">🏪 Negocio</button>
          <button class="nav-btn" data-tab="products">🍔 Productos</button>
          <button class="nav-btn active" data-tab="costs">💰 Costos</button>
          <button class="nav-btn" data-tab="reports">📈 Reportes</button>
          <button class="nav-btn" data-tab="orders">📦 Pedidos</button>
        </nav>
        <div class="nav-badge">
          <h4>Sesión activa</h4>
          <button class="cta" id="logoutBtn">Cerrar sesión</button>
        </div>
      </div>
      <div class="content">
        <div class="topbar">
          <div class="search-box">
            <span>🔍</span>
            <input type="text" placeholder="Buscar..." />
          </div>
          <div class="top-right">
            <div class="date-pill" id="datePill"></div>
            <div class="icon-bell">🔔</div>
            <div class="user-chip">
              <div class="avatar">L</div>
              <span>Luca</span>
            </div>
          </div>
        </div>
        <div class="main">
          <div class="page-title">
            <h1>Costos e insumos</h1>
            <p>Configura el costo de cada insumo y gastos fijos.</p>
          </div>
          <div class="panel">
            <div class="panel-header">
              <h3>Insumos</h3>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th>Unidad</th>
                  <th>Costo unitario</th>
                </tr>
              </thead>
              <tbody>
                ${(settings.ingredients || []).map((ing, idx) => `
                  <tr>
                    <td><input type="text" data-ing-name="${idx}" value="${esc(ing.name)}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;" /></td>
                    <td><input type="text" data-ing-unit="${idx}" value="${esc(ing.unit)}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;" /></td>
                    <td><input type="number" data-ing-price="${idx}" value="${Number(ing.price || 0)}" min="0" step="0.01" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;" /></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="panel" style="margin-top: 20px;">
            <div class="panel-header">
              <h3>Gastos fijos mensuales</h3>
            </div>
            <div style="padding: 20px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
              ${Object.entries(settings.fixedCosts || {}).map(([key, value]) => `
                <div>
                  <label>${key}</label>
                  <input type="number" data-fixed-key="${key}" value="${Number(value || 0)}" min="0" step="0.01" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; margin-top: 6px;" />
                </div>
              `).join('')}
            </div>
          </div>
          <button class="primary-btn" id="saveCosts" style="margin-top: 20px;">Guardar costos</button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('datePill').textContent = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  document.getElementById('logoutBtn').onclick = logout;
  document.getElementById('saveCosts').onclick = () => {
    settings.ingredients = (settings.ingredients || []).map((ing, idx) => ({
      ...ing,
      name: document.querySelector(`[data-ing-name="${idx}"]`)?.value || ing.name,
      unit: document.querySelector(`[data-ing-unit="${idx}"]`)?.value || ing.unit,
      price: Number(document.querySelector(`[data-ing-price="${idx}"]`)?.value || 0)
    }));
    
    const newFixed = {};
    document.querySelectorAll('[data-fixed-key]').forEach(inp => {
      newFixed[inp.dataset.fixedKey] = Number(inp.value || 0);
    });
    settings.fixedCosts = newFixed;
    
    saveJSON(STORAGE.settings, settings);
    alert('Costos guardados ✓');
  };
  
  setupNavigation();
}

function renderReports() {
  const metrics = getOrderMetrics();
  
  document.getElementById('app').innerHTML = `
    <div class="admin-shell">
      <div class="sidebar">
        <div class="brand">
          <div class="brand-mark">M</div>
          <div class="brand-text"><strong>MORA</strong><span>ADMIN</span></div>
        </div>
        <nav class="nav">
          <button class="nav-btn" data-tab="dashboard">📊 Dashboard</button>
          <button class="nav-btn" data-tab="business">🏪 Negocio</button>
          <button class="nav-btn" data-tab="products">🍔 Productos</button>
          <button class="nav-btn" data-tab="costs">💰 Costos</button>
          <button class="nav-btn active" data-tab="reports">📈 Reportes</button>
          <button class="nav-btn" data-tab="orders">📦 Pedidos</button>
        </nav>
        <div class="nav-badge">
          <h4>Sesión activa</h4>
          <button class="cta" id="logoutBtn">Cerrar sesión</button>
        </div>
      </div>
      <div class="content">
        <div class="topbar">
          <div class="search-box">
            <span>🔍</span>
            <input type="text" placeholder="Buscar..." />
          </div>
          <div class="top-right">
            <div class="date-pill" id="datePill"></div>
            <div class="icon-bell">🔔</div>
            <div class="user-chip">
              <div class="avatar">L</div>
              <span>Luca</span>
            </div>
          </div>
        </div>
        <div class="main">
          <div class="page-title">
            <h1>Reportes</h1>
            <p>Análisis completo de tu negocio.</p>
          </div>
          <div class="cards">
            <div class="card">
              <div class="card-icon">📦</div>
              <div class="card-value">${metrics.orders}</div>
              <div class="trend">Pedidos totales</div>
            </div>
            <div class="card">
              <div class="card-icon">💵</div>
              <div class="card-value">${money(metrics.revenue)}</div>
              <div class="trend">Venta total</div>
            </div>
            <div class="card">
              <div class="card-icon">📉</div>
              <div class="card-value">${money(metrics.cost)}</div>
              <div class="trend">Costo total</div>
            </div>
            <div class="card">
              <div class="card-icon">💚</div>
              <div class="card-value">${money(metrics.gain)}</div>
              <div class="trend up">Ganancia neta</div>
            </div>
          </div>
          <div class="panel" style="margin-top: 20px;">
            <div class="panel-header">
              <h3>Exportar datos</h3>
              <button class="pill" id="exportCsv">📤 Exportar CSV</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('datePill').textContent = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  document.getElementById('logoutBtn').onclick = logout;
  document.getElementById('exportCsv').onclick = () => {
    const orders = metrics.list;
    const rows = [['Fecha', 'Cliente', 'WhatsApp', 'Dirección', 'Tipo', 'Productos', 'Venta', 'Costo', 'Ganancia', 'Notas']];
    
    orders.forEach(order => {
      const customer = order.customer || {};
      const products = (order.products || []).map(p => `${p.name} x${p.qty}`).join(' | ');
      rows.push([
        new Date(order.createdAt).toLocaleDateString('es-AR'),
        customer.name || '',
        customer.phone || '',
        customer.address || '',
        customer.fulfillment || '',
        products,
        Number(order.total || 0),
        Number(order.cost || 0),
        Number(order.total || 0) - Number(order.cost || 0),
        customer.notes || ''
      ]);
    });
    
    const csv = rows.map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mora-pedidos.csv';
    a.click();
    alert('CSV exportado ✓');
  };
  
  setupNavigation();
}

function renderOrdersTab() {
  const metrics = getOrderMetrics();
  const orders = metrics.list.slice().reverse();
  
  document.getElementById('app').innerHTML = `
    <div class="admin-shell">
      <div class="sidebar">
        <div class="brand">
          <div class="brand-mark">M</div>
          <div class="brand-text"><strong>MORA</strong><span>ADMIN</span></div>
        </div>
        <nav class="nav">
          <button class="nav-btn" data-tab="dashboard">📊 Dashboard</button>
          <button class="nav-btn" data-tab="business">🏪 Negocio</button>
          <button class="nav-btn" data-tab="products">🍔 Productos</button>
          <button class="nav-btn" data-tab="costs">💰 Costos</button>
          <button class="nav-btn" data-tab="reports">📈 Reportes</button>
          <button class="nav-btn active" data-tab="orders">📦 Pedidos</button>
        </nav>
        <div class="nav-badge">
          <h4>Sesión activa</h4>
          <button class="cta" id="logoutBtn">Cerrar sesión</button>
        </div>
      </div>
      <div class="content">
        <div class="topbar">
          <div class="search-box">
            <span>🔍</span>
            <input type="text" placeholder="Buscar pedidos..." />
          </div>
          <div class="top-right">
            <div class="date-pill" id="datePill"></div>
            <div class="icon-bell">🔔</div>
            <div class="user-chip">
              <div class="avatar">L</div>
              <span>Luca</span>
            </div>
          </div>
        </div>
        <div class="main">
          <div class="page-title">
            <h1>Historial de pedidos</h1>
            <p>Todos los pedidos registrados en el sistema.</p>
          </div>
          <div class="panel">
            <table>
              <thead>
                <tr>
                  <th>ID Pedido</th>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Dirección</th>
                  <th>Total</th>
                  <th>Costo</th>
                  <th>Ganancia</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                ${orders.map(o => `
                  <tr>
                    <td><strong>${esc(o.id || '—')}</strong></td>
                    <td>${esc(o.customer?.name || '—')}</td>
                    <td>${esc(o.customer?.phone || '—')}</td>
                    <td>${esc(o.customer?.address || '—')}</td>
                    <td>${money(o.total || 0)}</td>
                    <td>${money(o.cost || 0)}</td>
                    <td><strong>${money((o.total || 0) - (o.cost || 0))}</strong></td>
                    <td>${new Date(o.createdAt).toLocaleDateString('es-AR')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('datePill').textContent = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  document.getElementById('logoutBtn').onclick = logout;
  setupNavigation();
}

function setupNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.onclick = () => {
      const tab = btn.dataset.tab;
      currentTab = tab;
      if (tab === 'dashboard') renderDashboard();
      else if (tab === 'business') renderBusiness();
      else if (tab === 'products') renderProducts();
      else if (tab === 'costs') renderCosts();
      else if (tab === 'reports') renderReports();
      else if (tab === 'orders') renderOrdersTab();
    };
  });
}

function render() {
  if (!isLoggedIn) {
    renderLogin();
  } else {
    renderDashboard();
  }
}

document.addEventListener('DOMContentLoaded', render);
