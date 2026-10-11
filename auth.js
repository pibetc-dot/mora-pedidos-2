(() => {
  const ADMIN_USERNAME = 'luca';
  const ADMIN_PASSWORD = 'mora 172309';
  const SESSION_KEY = 'moraLocalAdminSession';

  function readSession() {
    try {
      return localStorage.getItem(SESSION_KEY) === 'true';
    } catch (error) {
      return false;
    }
  }

  function setSession(value) {
    try {
      localStorage.setItem(SESSION_KEY, String(Boolean(value)));
    } catch (error) {
      console.error('No se pudo guardar la sesión del admin:', error);
    }
  }

  function updateAdminButton() {
    const button = document.getElementById('adminBtn');
    if (!button) return;
    const isLogged = readSession();
    button.hidden = !isLogged;
    button.style.display = isLogged ? '' : 'none';
  }

  function renderLocalLoginForm() {
    const auth = document.getElementById('adminAuth');
    if (!auth) return;

    auth.innerHTML = `
      <div class="admin-form">
        <label>Usuario
          <input id="adminEmail" type="text" autocomplete="username" value="${ADMIN_USERNAME}" placeholder="usuario">
        </label>
        <label>Contraseña
          <input id="adminPassword" type="password" autocomplete="current-password" placeholder="contraseña">
        </label>
        <button class="btn btn-primary" id="adminLogin" type="button">Entrar al panel</button>
      </div>
    `;
  }

  function loginLocalAdmin() {
    const user = document.getElementById('adminEmail')?.value ?? '';
    const pass = document.getElementById('adminPassword')?.value ?? '';

    if (user.trim().toLowerCase() === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {
      setSession(true);
      updateAdminButton();

      if (typeof window.renderAdmin === 'function') {
        window.renderAdmin('business');
      }

      if (typeof window.setModal === 'function') {
        window.setModal('adminModal', false);
      }

      if (typeof window.toast === 'function') {
        window.toast('Sesión de admin activada ✓');
      }

      return true;
    }

    if (typeof window.toast === 'function') {
      window.toast('Credenciales inválidas', true);
    } else {
      alert('Credenciales inválidas');
    }

    return false;
  }

  function logoutLocalAdmin() {
    setSession(false);
    updateAdminButton();
    renderLocalLoginForm();

    const adminContent = document.getElementById('adminContent');
    if (adminContent) {
      adminContent.innerHTML = '<div class="empty-state">Sesión cerrada. Volvé a iniciar sesión para editar.</div>';
    }

    if (typeof window.toast === 'function') {
      window.toast('Sesión cerrada');
    }
  }

  function openAdminLogin() {
    if (typeof window.setModal === 'function') {
      window.setModal('adminModal', true);
    }

    if (!readSession()) {
      renderLocalLoginForm();
      const adminContent = document.getElementById('adminContent');
      if (adminContent) {
        adminContent.innerHTML = '<div class="empty-state">Iniciá sesión para administrar Mora.</div>';
      }
    }
  }

  function installHooks() {
    const originalAdminOpen = window.adminOpen;
    window.adminOpen = function(tab = 'business') {
      if (!window.MoraCloud?.isEnabled() && !readSession()) {
        openAdminLogin();
        return;
      }
      if (typeof originalAdminOpen === 'function') {
        return originalAdminOpen.call(this, tab);
      }
      if (typeof window.setModal === 'function') {
        window.setModal('adminModal', true);
      }
    };

    const originalRenderAdminAuth = window.renderAdminAuth;
    window.renderAdminAuth = function() {
      if (!window.MoraCloud?.isEnabled()) {
        if (readSession()) {
          const auth = document.getElementById('adminAuth');
          if (auth) {
            auth.innerHTML = '<div class="admin-auth-bar"><span>🔒 Panel local activo</span><button class="mini" id="adminLogout">Cerrar sesión</button></div>';
          }
        } else {
          renderLocalLoginForm();
        }
        return;
      }
      if (typeof originalRenderAdminAuth === 'function') {
        return originalRenderAdminAuth.call(this);
      }
    };

    const originalRenderAdmin = window.renderAdmin;
    window.renderAdmin = function(tab = 'business') {
      if (!window.MoraCloud?.isEnabled() && !readSession()) {
        renderLocalLoginForm();
        const adminContent = document.getElementById('adminContent');
        if (adminContent) {
          adminContent.innerHTML = '<div class="empty-state">Iniciá sesión para administrar Mora.</div>';
        }
        return;
      }
      if (typeof originalRenderAdmin === 'function') {
        return originalRenderAdmin.call(this, tab);
      }
    };

    document.addEventListener('click', (event) => {
      const loginButton = event.target.closest('#adminLogin');
      const logoutButton = event.target.closest('#adminLogout');

      if (loginButton) {
        event.preventDefault();
        loginLocalAdmin();
        return;
      }

      if (logoutButton) {
        event.preventDefault();
        logoutLocalAdmin();
        return;
      }
    });

    const button = document.getElementById('adminBtn');
    if (button) {
      button.hidden = true;
      button.style.display = 'none';
      button.onclick = () => {
        if (readSession()) {
          if (typeof window.adminOpen === 'function') {
            window.adminOpen('business');
          }
        } else {
          openAdminLogin();
        }
      };
    }

    const brand = document.querySelector('.brand');
    if (brand) {
      brand.addEventListener('dblclick', (event) => {
        event.preventDefault();
        openAdminLogin();
      });
    }

    document.addEventListener('keydown', (event) => {
      const key = event.key ? event.key.toLowerCase() : '';
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && key === 'l') {
        event.preventDefault();
        openAdminLogin();
      }
    });

    updateAdminButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installHooks, { once: true });
  } else {
    installHooks();
  }
})();
