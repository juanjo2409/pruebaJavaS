import { checkRouteAccess, isAuthenticated, getCurrentUser } from '../guards/autenticacion.js';
import { renderSidebar, updateActiveSidebarLink } from '../components/BarraLateral.js';

// Importación de las vistas para renderizar cada pantalla
import { renderLogin } from '../views/VistaLogin.js';
import { renderDashboard } from '../views/VistaDashboard.js';
import { renderMovies } from '../views/VistaPeliculas.js';
import { renderRooms } from '../views/VistaSalas.js';
import { renderReservations } from '../views/VistaReservas.js';
import { renderUsers } from '../views/VistaUsuarios.js';
import { renderAccessDenied } from '../views/VistaAccesoDenegado.js';

// Mapa de rutas de la aplicación: asocia cada ruta a una función de renderizado
const routes = {
  '/login': renderLogin,
  '/dashboard': renderDashboard,
  '/movies': renderMovies,
  '/rooms': renderRooms,
  '/reservations': renderReservations,
  '/users': renderUsers,
  '/access-denied': renderAccessDenied
};

/**
 * RESOLVER RUTA:
 * Se ejecuta cada vez que cambia la URL. Decide qué vista cargar,
 * verifica accesos y dibuja el diseño correspondiente (layout o pantalla completa).
 */
async function resolveRoute() {
  const hash = window.location.hash || '#/';
  
  // Limpiamos la ruta (quitando el '#' y los parámetros query '?' si existen)
  let path = hash.substring(1).split('?')[0] || '/';
  
  // 1. Redirección de la ruta raíz '/'
  if (path === '/') {
    const user = getCurrentUser();
    if (user) {
      // Si ya está logueado, redirigimos según su rol
      path = user.role === 'admin' ? '/dashboard' : '/movies';
      window.location.hash = path;
      return;
    } else {
      // Si no, lo mandamos a loguearse
      path = '/login';
      window.location.hash = path;
      return;
    }
  }

  // 2. Comprobación del Guardián de Rutas (Permisos)
  const guard = checkRouteAccess(path);
  if (!guard.allowed && guard.redirect) {
    window.location.hash = guard.redirect;
    return;
  }

  // 3. Buscar la función de la vista en el mapa de rutas
  const renderView = routes[path];
  if (!renderView) {
    // Si la ruta no existe (404), redirigimos a una por defecto
    const user = getCurrentUser();
    window.location.hash = user ? (user.role === 'admin' ? '/dashboard' : '/movies') : '/login';
    return;
  }

  const appRoot = document.getElementById('app');
  
  // 4. Determinar si la vista requiere el diseño con Barra Lateral (Sidebar)
  const isLayoutRequired = path !== '/login' && path !== '/access-denied' && isAuthenticated();

  if (isLayoutRequired) {
    // Vista con diseño interno (Sidebar + Contenido principal)
    let contentArea = document.getElementById('main-content-area');
    
    // Si la estructura del layout no está creada todavía, la generamos
    if (!contentArea) {
      appRoot.innerHTML = `
        <div class="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-100 w-full">
          <!-- Contenedor de la barra lateral -->
          <aside id="sidebar-container" class="w-full md:w-64 bg-slate-900 text-white shrink-0 border-r border-slate-800 flex flex-col"></aside>
          
          <!-- Contenedor del contenido principal -->
          <main class="flex-grow p-4 md:p-8 overflow-y-auto max-w-full">
            <div id="main-content-area" class="max-w-7xl mx-auto space-y-6"></div>
          </main>
        </div>
      `;
      contentArea = document.getElementById('main-content-area');
    }
    
    // Dibujamos e inyectamos la barra lateral (Sidebar)
    renderSidebar(document.getElementById('sidebar-container'));
    
    // Resaltamos el enlace de la ruta activa en el menú lateral
    updateActiveSidebarLink(path);
    
    // Finalmente, renderizamos la vista seleccionada dentro del área principal
    await renderView(contentArea);
  } else {
    // Vista en pantalla completa (Login, Acceso Denegado)
    appRoot.innerHTML = `<div id="fullscreen-content-area" class="min-h-screen flex items-center justify-center bg-slate-900 p-4"></div>`;
    const fullscreenArea = document.getElementById('fullscreen-content-area');
    await renderView(fullscreenArea);
  }
}

// Inicialización del Enrutador
export const router = {
  init() {
    // Escucha cambios en el hash de la URL (ejemplo: al hacer clic en enlaces o redirecciones)
    window.addEventListener('hashchange', resolveRoute);
    // Escucha la carga inicial del documento DOM
    window.addEventListener('DOMContentLoaded', resolveRoute);
    // Ejecuta la resolución de ruta por primera vez
    resolveRoute();
  }
};
