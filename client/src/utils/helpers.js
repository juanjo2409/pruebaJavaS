/**
1. OBTENER ELEMENTO DE ALMACENAMIENTO:
Recupera información desde localStorage o sessionStorage.
*/
export function getStorageItem(key, fallback = null) {
  const item = localStorage.getItem(key) || sessionStorage.getItem(key);
  if (!item) {
    return fallback;
  }
  try {
    // Si la información está en formato JSON, la convertimos a objeto JS
    return JSON.parse(item);
  } catch (e) {
    return item;
  }
}

/**
2. GUARDAR ELEMENTO EN ALMACENAMIENTO:
Guarda información en localStorage (si persist es true) o sessionStorage (si es false).
*/
export function setStorageItem(key, value, persist = true) {
  const stringified = typeof value === 'object' ? JSON.stringify(value) : value;
  if (persist) {
    localStorage.setItem(key, stringified);
  } else {
    sessionStorage.setItem(key, stringified);
  }
}

/**
3. ELIMINAR ELEMENTO DE ALMACENAMIENTO:
Limpia una clave de localStorage y sessionStorage (usado al cerrar sesión).
*/
export function removeStorageItem(key) {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
}

/**
4. FORMATEAR FECHA:
Convierte una fecha formato "2026-06-10" en una fecha amigable en español.
*/
export function formatDate(dateString) {
  if (!dateString) return '';
  const parts = dateString.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  
  // Creamos el objeto fecha (restando 1 al mes porque en JS van de 0 a 11)
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
5. VALIDAR FECHA ACTUAL O FUTURA:
Comprueba si una fecha es igual a hoy o en el futuro.
*/
export function isTodayOrFuture(dateString) {
  if (!dateString) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Ponemos a las 00:00:00 para comparar solo el día

  const parts = dateString.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  
  const targetDate = new Date(year, month - 1, day);
  return targetDate >= today;
}

/**
6. COMPROBAR SI LA FUNCIÓN YA EMPEZÓ:
Compara la fecha y hora de la función de cine contra la fecha y hora actual.
*/
export function hasFunctionStarted(dateString, timeString) {
  if (!dateString || !timeString) return true;
  
  const dateParts = dateString.split('-').map(Number);
  const timeParts = timeString.split(':').map(Number);
  
  const year = dateParts[0];
  const month = dateParts[1];
  const day = dateParts[2];
  
  const hours = timeParts[0];
  const minutes = timeParts[1];
  
  const functionDate = new Date(year, month - 1, day, hours, minutes);
  const currentDate = new Date();
  
  return functionDate < currentDate;
}
