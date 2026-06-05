const BASE_URL = 'http://localhost:3000';

/**
 * Manejador común para realizar peticiones fetch y procesar respuestas/errores
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Error ${response.status}`);
  }
  
  if (response.status === 204) {
    return true;
  }
  
  return await response.json();
}

/* Funciones para obtener información de Usuarios */
export async function apiFetchUsers() {
  return await request('/users');
}

export async function apiFetchUserByEmail(email) {
  const users = await request(`/users?email=${encodeURIComponent(email)}`);
  return users[0] || null;
}

/* Funciones CRUD para Espacios de Trabajo */
export async function apiFetchWorkspaces() {
  return await request('/workspaces');
}

export async function apiCreateWorkspace(data) {
  return await request('/workspaces', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function apiUpdateWorkspace(id, data) {
  return await request(`/workspaces/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function apiDeleteWorkspace(id) {
  return await request(`/workspaces/${id}`, {
    method: 'DELETE'
  });
}

/* Funciones CRUD para Reservas */
export async function apiFetchReservations() {
  return await request('/reservations?_expand=workspace&_expand=user');
}

export async function apiFetchUserReservations(userId) {
  return await request(`/reservations?userId=${userId}&_expand=workspace&_expand=user`);
}

export async function apiCreateReservation(data) {
  return await request('/reservations', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function apiUpdateReservation(id, data) {
  return await request(`/reservations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function apiPatchReservation(id, data) {
  return await request(`/reservations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function apiDeleteReservation(id) {
  return await request(`/reservations/${id}`, {
    method: 'DELETE'
  });
}
