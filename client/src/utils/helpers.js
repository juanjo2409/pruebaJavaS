/**
 * Helpers para almacenamiento genérico y de sesión
 */

export const getStorageItem = (key, fallback = null) => {
  const item = localStorage.getItem(key) || sessionStorage.getItem(key);
  if (!item) return fallback;
  try {
    return JSON.parse(item);
  } catch (e) {
    return item;
  }
};

export const setStorageItem = (key, value, persist = true) => {
  const stringified = typeof value === 'object' ? JSON.stringify(value) : value;
  if (persist) {
    localStorage.setItem(key, stringified);
  } else {
    sessionStorage.setItem(key, stringified);
  }
};

export const removeStorageItem = (key) => {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
};

/**
 * Formatea una cadena de fecha (AAAA-MM-DD) en una fecha local amigable para el usuario.
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Valida si una cadena de fecha es hoy o en el futuro
 */
export const isTodayOrFuture = (dateString) => {
  if (!dateString) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = dateString.split('-');
  const targetDate = new Date(year, month - 1, day);
  return targetDate >= today;
};
