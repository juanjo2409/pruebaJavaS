import { getCurrentUser, logout } from '../guards/auth.js';

let isMobileMenuOpen = false;

/**
 * Renderiza la barra lateral de la aplicación en el contenedor indicado.
 */
export function renderSidebar(container) {
  const user = getCurrentUser();
  if (!user) return;

  const isAdmin = user.role === 'admin';

  // Definir los elementos de navegación de la barra lateral
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: getDashboardIcon(), adminOnly: true },
    { path: '/workspaces', label: 'Espacios', icon: getWorkspacesIcon(), adminOnly: true },
    { path: '/reservations', label: 'Reservas', icon: getReservationsIcon(), adminOnly: false },
    { path: '/users', label: 'Empleados', icon: getUsersIcon(), adminOnly: true }
  ];

  // Filtrar los elementos según el rol del usuario
  const visibleItems = menuItems.filter(item => !item.adminOnly || isAdmin);

  const navLinksHTML = visibleItems.map(item => `
    <a href="#${item.path}" data-path="${item.path}" class="nav-link flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 gap-3 text-slate-300 hover:bg-slate-800 hover:text-white">
      ${item.icon}
      <span>${item.label}</span>
    </a>
  `).join('');

  container.innerHTML = `
    <!-- Encabezado de navegación móvil -->
    <div class="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 md:hidden w-full">
      <div class="flex items-center gap-2">
        <div class="bg-indigo-600 p-2 rounded-lg text-white">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
        </div>
        <span class="font-bold text-white tracking-wide text-lg">WorkSpace</span>
      </div>
      <button id="sidebar-hamburger" class="text-slate-400 hover:text-white focus:outline-none transition-colors">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" id="hamburger-icon-path" d="M4 6h16M4 12h16M4 18h16"></path></svg>
      </button>
    </div>

    <!-- Caja principal de la barra lateral (oculta en móvil por defecto) -->
    <div id="sidebar-menu" class="hidden md:flex flex-col flex-grow w-full bg-slate-900 overflow-y-auto">
      <!-- Banner de logotipo (solo en escritorio) -->
      <div class="hidden md:flex items-center gap-3 px-6 py-6 border-b border-slate-800">
        <div class="bg-indigo-600 p-2 rounded-xl text-white shadow-md shadow-indigo-900/30">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
        </div>
        <div>
          <h1 class="font-extrabold text-white leading-tight tracking-wider text-base">WORKSPACE</h1>
          <p class="text-[10px] font-semibold text-indigo-400 tracking-widest uppercase">Gestor de Reservas</p>
        </div>
      </div>

      <!-- Lista de enlaces de navegación -->
      <nav class="flex-grow px-4 py-6 space-y-1">
        ${navLinksHTML}
      </nav>

      <!-- Información del perfil y botón de salida -->
      <div class="p-4 border-t border-slate-800 bg-slate-950/40 shrink-0">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            ${user.name.charAt(0).toUpperCase()}
          </div>
          <div class="overflow-hidden">
            <h4 class="text-sm font-semibold text-white truncate">${user.name}</h4>
            <p class="text-xs text-slate-400 truncate">${user.email}</p>
            <span class="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${user.role === 'admin' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'}">
              ${user.role}
            </span>
          </div>
        </div>
        <button id="sidebar-logout" class="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white bg-slate-800/40 hover:bg-slate-800 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  `;

  // Lógica del botón de menú hamburguesa móvil
  const hamburger = container.querySelector('#sidebar-hamburger');
  const menu = container.querySelector('#sidebar-menu');
  const iconPath = container.querySelector('#hamburger-icon-path');

  const toggleMenu = () => {
    isMobileMenuOpen = !isMobileMenuOpen;
    if (isMobileMenuOpen) {
      menu.classList.remove('hidden');
      menu.classList.add('flex');
      iconPath.setAttribute('d', 'M6 18L18 6M6 6l12 12');
    } else {
      menu.classList.add('hidden');
      menu.classList.remove('flex');
      iconPath.setAttribute('d', 'M4 6h16M4 12h16M4 18h16');
    }
  };

  hamburger.addEventListener('click', toggleMenu);

  container.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 768 && isMobileMenuOpen) {
        toggleMenu();
      }
    });
  });

  // Acción de cerrar sesión
  container.querySelector('#sidebar-logout').addEventListener('click', () => {
    logout();
  });
}

/**
 * Actualiza las clases visuales del enlace activo de navegación.
 */
export function updateActiveSidebarLink(path) {
  const links = document.querySelectorAll('.nav-link');
  links.forEach(link => {
    const linkPath = link.getAttribute('data-path');
    if (linkPath === path) {
      link.className = 'nav-link flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 gap-3 bg-indigo-600 text-white shadow-md shadow-indigo-600/10';
    } else {
      link.className = 'nav-link flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 gap-3 text-slate-300 hover:bg-slate-800 hover:text-white';
    }
  });
}

// Iconos SVG en funciones auxiliares
function getDashboardIcon() {
  return `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"></path></svg>`;
}

function getWorkspacesIcon() {
  return `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>`;
}

function getReservationsIcon() {
  return `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`;
}

function getUsersIcon() {
  return `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>`;
}
