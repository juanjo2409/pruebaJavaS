import { getCurrentUser, logout } from '../guards/auth.js';

// Variable para controlar si el menú móvil está abierto o cerrado
let isMobileMenuOpen = false;

/**
 * 1. DIBUJAR SIDEBAR (Barra lateral):
 * Genera el menú de navegación según el rol del usuario (Administrador o Cliente).
 */
export function renderSidebar(container) {
  const user = getCurrentUser();
  if (!user) return;

  const isAdmin = user.role === 'admin';

  // Lista de todas las opciones del menú de navegación
  const menuItems = [
    { path: '/dashboard', label: 'Estadísticas', icon: '📊', adminOnly: true },
    { path: '/movies', label: 'Cartelera', icon: '🎬', adminOnly: false },
    { path: '/rooms', label: 'Salas', icon: '🍿', adminOnly: true },
    { path: '/reservations', label: 'Reservas', icon: '🎟️', adminOnly: false },
    { path: '/users', label: 'Usuarios', icon: '👥', adminOnly: true }
  ];

  // Filtramos las opciones para mostrar solo las que correspondan al rol del usuario
  let navLinksHTML = '';
  for (const item of menuItems) {
    if (!item.adminOnly || isAdmin) {
      navLinksHTML += `
        <a href="#${item.path}" data-path="${item.path}" class="nav-link flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 gap-3 text-slate-300 hover:bg-slate-800 hover:text-white">
          <span class="text-lg">${item.icon}</span>
          <span>${item.label}</span>
        </a>
      `;
    }
  }

  // Insertamos la estructura HTML del Sidebar
  container.innerHTML = `
    <!-- Cabecera para pantallas móviles -->
    <div class="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 md:hidden w-full">
      <div class="flex items-center gap-2">
        <span class="text-xl">🎬</span>
        <span class="font-bold text-white tracking-wide text-lg">CineRiwi</span>
      </div>
      <button id="sidebar-hamburger" class="text-slate-400 hover:text-white focus:outline-none transition-colors text-2xl">
        ☰
      </button>
    </div>

    <!-- Menú principal (se esconde en móviles por defecto, se muestra en pantallas medianas md) -->
    <div id="sidebar-menu" class="hidden md:flex flex-col flex-grow w-full bg-slate-900 overflow-y-auto">
      <!-- Encabezado del menú (pantallas grandes) -->
      <div class="hidden md:flex items-center gap-3 px-6 py-6 border-b border-slate-800">
        <span class="text-2xl bg-indigo-600 p-2 rounded-xl text-white shadow-md">🎬</span>
        <div>
          <h1 class="font-extrabold text-white leading-tight tracking-wider text-base">CINERIWI</h1>
          <p class="text-[10px] font-semibold text-indigo-400 tracking-widest uppercase">Taquilla & Cartelera</p>
        </div>
      </div>

      <!-- Enlaces de navegación -->
      <nav class="flex-grow px-4 py-6 space-y-1">
        ${navLinksHTML}
      </nav>

      <!-- Perfil del usuario activo y botón de salida -->
      <div class="p-4 border-t border-slate-800 bg-slate-950/40 shrink-0">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
            ${user.name.charAt(0).toUpperCase()}
          </div>
          <div class="overflow-hidden">
            <h4 class="text-sm font-semibold text-white truncate">${user.name}</h4>
            <p class="text-xs text-slate-400 truncate">${user.email}</p>
            <span class="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${isAdmin ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'}">
              ${user.role}
            </span>
          </div>
        </div>
        <button id="sidebar-logout" class="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white bg-slate-800/40 hover:bg-slate-800 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer">
          🚪 <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  `;

  const hamburger = container.querySelector('#sidebar-hamburger');
  const menu = container.querySelector('#sidebar-menu');

  // Función para abrir o cerrar el menú hamburguesa en móviles
  const toggleMenu = () => {
    isMobileMenuOpen = !isMobileMenuOpen;
    if (isMobileMenuOpen) {
      menu.classList.remove('hidden');
      menu.classList.add('flex');
      hamburger.textContent = '✕'; // Icono de cerrar
    } else {
      menu.classList.add('hidden');
      menu.classList.remove('flex');
      hamburger.textContent = '☰'; // Icono de hamburguesa
    }
  };

  hamburger.addEventListener('click', toggleMenu);

  // Al hacer clic en un enlace de navegación, si estamos en móvil cerramos el menú
  container.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 768 && isMobileMenuOpen) {
        toggleMenu();
      }
    });
  });

  // Botón cerrar sesión
  container.querySelector('#sidebar-logout').addEventListener('click', () => {
    logout();
  });
}

/**
 * 2. ACTUALIZAR ENLACE ACTIVO:
 * Aplica estilos visuales diferentes al enlace de la ruta en la que nos encontramos.
 */
export function updateActiveSidebarLink(path) {
  const links = document.querySelectorAll('.nav-link');
  for (const link of links) {
    const linkPath = link.getAttribute('data-path');
    if (linkPath === path) {
      // Estilo de enlace activo (fondo índigo)
      link.className = 'nav-link flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 gap-3 bg-indigo-600 text-white shadow-md shadow-indigo-600/10';
    } else {
      // Estilo de enlace inactivo (gris)
      link.className = 'nav-link flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 gap-3 text-slate-300 hover:bg-slate-800 hover:text-white';
    }
  }
}
