// URL base donde se ejecuta json-server
const BASE_URL = 'http://localhost:3000';

/**
 * FUNCIÓN DE PETICIÓN COMÚN:
 * Realiza solicitudes HTTP (GET, POST, PUT, DELETE) usando fetch.
 * Convierte el cuerpo a JSON y maneja errores del servidor de forma centralizada.
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  // Definimos las cabeceras por defecto (Content-Type JSON)
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Realizamos la llamada fetch
  const response = await fetch(url, { ...options, headers });
  
  // Si la respuesta no es exitosa (código de estado diferente de 2xx), lanzamos error
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Error ${response.status}`);
  }
  
  // Código 204 significa "No Content" (usado al eliminar), devolvemos true
  if (response.status === 204) {
    return true;
  }
  
  // Retornamos la respuesta ya convertida en objeto de JS
  return await response.json();
}

/* ==========================================================================
   SERVICIOS PARA USUARIOS
   ========================================================================== */

// Obtener todos los usuarios del sistema
export async function apiFetchUsers() {
  return await request('/users');
}

// Buscar un usuario específico por su correo electrónico (usado en login)
export async function apiFetchUserByEmail(email) {
  const users = await request(`/users?email=${encodeURIComponent(email)}`);
  // Devolvemos el primer usuario que coincida o null si no se encuentra
  return users[0] || null;
}

// Crear un nuevo usuario en el sistema
export async function apiCreateUser(data) {
  return await request('/users', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// Modificar datos de un usuario (como cambiar su rol)
export async function apiUpdateUser(id, data) {
  return await request(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

// Eliminar un usuario del sistema
export async function apiDeleteUser(id) {
  return await request(`/users/${id}`, {
    method: 'DELETE'
  });
}

/* ==========================================================================
   SERVICIOS PARA SALAS (Salas de Cine)
   ========================================================================== */

// Obtener la lista completa de salas
export async function apiFetchSalas() {
  return await request('/salas');
}

// Crear una nueva sala
export async function apiCreateSala(data) {
  return await request('/salas', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// Actualizar los datos de una sala existente
export async function apiUpdateSala(id, data) {
  return await request(`/salas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

// Eliminar físicamente una sala
export async function apiDeleteSala(id) {
  return await request(`/salas/${id}`, {
    method: 'DELETE'
  });
}

/* ==========================================================================
   SERVICIOS PARA PELÍCULAS (Cartelera)
   ========================================================================== */

// Obtener todas las películas y funciones programadas
export async function apiFetchMovies() {
  return await request('/movies');
}

// Crear una función/película en la cartelera
export async function apiCreateMovie(data) {
  return await request('/movies', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// Actualizar los datos de una función (por ejemplo, al reservar asientos)
export async function apiUpdateMovie(id, data) {
  return await request(`/movies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

// Eliminar una función de la cartelera
export async function apiDeleteMovie(id) {
  return await request(`/movies/${id}`, {
    method: 'DELETE'
  });
}

/* ==========================================================================
   SERVICIOS PARA RESERVAS DE ENTRADAS
   ========================================================================== */

// Obtener la lista completa de reservas realizadas
export async function apiFetchReservations() {
  return await request('/reservations');
}

// Obtener las reservas asociadas a un nombre de usuario particular
export async function apiFetchUserReservations(usuarioNombre) {
  return await request(`/reservations?usuario=${encodeURIComponent(usuarioNombre)}`);
}

// Crear un registro de reserva
export async function apiCreateReservation(data) {
  return await request('/reservations', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// Modificar/Actualizar una reserva existente (cambiar cantidad o estado)
export async function apiUpdateReservation(id, data) {
  return await request(`/reservations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

// Eliminar un registro de reserva del sistema
export async function apiDeleteReservation(id) {
  return await request(`/reservations/${id}`, {
    method: 'DELETE'
  });
}
