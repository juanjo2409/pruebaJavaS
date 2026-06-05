import { getStorageItem, setStorageItem, removeStorageItem } from '../utils/helpers.js';

const SESSION_KEY = 'workspace_reservation_user';

/**
 * Recupera el usuario actualmente autenticado desde el almacenamiento local o de sesión.
 */
export function getCurrentUser() {
  return getStorageItem(SESSION_KEY);
}

/**
 * Guarda la sesión del usuario.
 */
export function setCurrentUser(user, rememberMe = true) {
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  setStorageItem(SESSION_KEY, safeUser, rememberMe);
}

/**
 * Cierra la sesión del usuario y limpia los datos.
 */
export function logout() {
  removeStorageItem(SESSION_KEY);
  window.location.hash = '/login';
}

/**
 * Verifica si hay una sesión activa.
 */
export function isAuthenticated() {
  return !!getCurrentUser();
}

/**
 * Verifica si el usuario activo tiene rol de administrador.
 */
export function isAdmin() {
  const user = getCurrentUser();
  return user && user.role === 'admin';
}

/**
 * Evalúa las guardias de enrutamiento para una ruta de destino.
 * Retorna un objeto { allowed: boolean, redirect: string | null }
 */
export function checkRouteAccess(path) {
  const authActive = isAuthenticated();
  const user = getCurrentUser();
  
  // Normalizar ruta quitando hash inicial
  const hashPath = path.startsWith('#') ? path.substring(1) : path;
  const route = hashPath.split('?')[0] || '/';

  // Configuración de permisos por ruta
  const routeRules = {
    '/': { requiresAuth: true },
    '/login': { guestOnly: true },
    '/dashboard': { requiresAuth: true, role: 'admin' },
    '/workspaces': { requiresAuth: true, role: 'admin' },
    '/reservations': { requiresAuth: true },
    '/users': { requiresAuth: true, role: 'admin' },
    '/access-denied': { requiresAuth: true }
  };

  const rule = routeRules[route];

  if (!rule) {
    // Si la ruta no existe, redirige según el estado de sesión
    if (!authActive) return { allowed: false, redirect: '/login' };
    return { allowed: false, redirect: user.role === 'admin' ? '/dashboard' : '/reservations' };
  }

  // Si es solo para invitados y ya está logueado
  if (rule.guestOnly && authActive) {
    return { allowed: false, redirect: user.role === 'admin' ? '/dashboard' : '/reservations' };
  }

  // Si requiere autenticación y no está logueado
  if (rule.requiresAuth && !authActive) {
    return { allowed: false, redirect: '/login' };
  }

  // Si requiere un rol específico y el usuario no lo cumple
  if (rule.role && user && user.role !== rule.role) {
    return { allowed: false, redirect: '/access-denied' };
  }

  return { allowed: true, redirect: null };
}
