import { getStorageItem, setStorageItem, removeStorageItem } from '../utils/helpers.js';

// Clave utilizada para guardar los datos de sesión en LocalStorage/SessionStorage
const SESSION_KEY = 'cine_reservation_user';

/**
 * 1. OBTENER USUARIO ACTUAL:
 * Busca los datos del usuario logueado en la memoria del navegador.
 */
export function getCurrentUser() {
  return getStorageItem(SESSION_KEY);
}

/**
 * 2. GUARDAR SESIÓN:
 * Almacena los datos básicos del usuario una vez que inicia sesión con éxito.
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
 * 3. CERRAR SESIÓN:
 * Limpia los datos de sesión del navegador y redirige a la pantalla de login.
 */
export function logout() {
  removeStorageItem(SESSION_KEY);
  window.location.hash = '/login';
}

/**
 * 4. VERIFICAR AUTENTICACIÓN:
 * Devuelve true si hay un usuario con sesión activa, o false en caso contrario.
 */
export function isAuthenticated() {
  if (getCurrentUser()) {
    return true;
  }
  return false;
}

/**
 * 5. VERIFICAR ADMINISTRADOR:
 * Devuelve true si el usuario actual tiene el rol de administrador.
 */
export function isAdmin() {
  const user = getCurrentUser();
  if (user && user.role === 'admin') {
    return true;
  }
  return false;
}

/**
 * 6. GUARDIÁN DE RUTAS:
 * Analiza si el usuario tiene permiso de entrar a la ruta solicitada.
 * Retorna { allowed: boolean, redirect: string | null }
 */
export function checkRouteAccess(path) {
  const authActive = isAuthenticated();
  const user = getCurrentUser();
  
  // Limpiamos la ruta (quitando el símbolo '#' y cualquier parámetro query)
  let cleanPath = path;
  if (cleanPath.startsWith('#')) {
    cleanPath = cleanPath.substring(1);
  }
  const route = cleanPath.split('?')[0] || '/';

  // Configuración de reglas de acceso por ruta
  const routeRules = {
    '/': { requiresAuth: true },
    '/login': { guestOnly: true },
    '/dashboard': { requiresAuth: true, role: 'admin' },
    '/movies': { requiresAuth: true },
    '/rooms': { requiresAuth: true, role: 'admin' },
    '/reservations': { requiresAuth: true },
    '/users': { requiresAuth: true, role: 'admin' },
    '/access-denied': { requiresAuth: true }
  };

  const rule = routeRules[route];

  // Si la ruta solicitada no existe, redirigimos a una ruta segura por defecto
  if (!rule) {
    if (!authActive) {
      return { allowed: false, redirect: '/login' };
    }
    // Si ya está logueado, los admins van al dashboard, los clientes a la cartelera
    const defaultRedirect = user.role === 'admin' ? '/dashboard' : '/movies';
    return { allowed: false, redirect: defaultRedirect };
  }

  // Regla A: Si la ruta es solo para invitados (ej: login) y ya está logueado
  if (rule.guestOnly && authActive) {
    const defaultRedirect = user.role === 'admin' ? '/dashboard' : '/movies';
    return { allowed: false, redirect: defaultRedirect };
  }

  // Regla B: Si la ruta requiere autenticación y no ha iniciado sesión
  if (rule.requiresAuth && !authActive) {
    return { allowed: false, redirect: '/login' };
  }

  // Regla C: Si la ruta requiere un rol (ej: admin) y el usuario no lo tiene
  if (rule.role && user && user.role !== rule.role) {
    return { allowed: false, redirect: '/access-denied' };
  }

  // Si pasa todas las comprobaciones, se le permite el acceso
  return { allowed: true, redirect: null };
}
