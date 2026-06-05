import { apiFetchUsers } from '../services/api.js';
import { showToast } from '../components/Toast.js';

/**
 * DIBUJAR VISTA DE USUARIOS:
 * Renderiza la tabla de usuarios registrados en el sistema para administración.
 */
export async function renderUsers(container) {
  // Spinner de carga inicial
  container.innerHTML = `
    <div class="flex items-center justify-center min-h-[300px]">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
    </div>
  `;

  try {
    // 1. Obtenemos los usuarios desde el servidor
    const users = await apiFetchUsers();
    
    // 2. Generamos el HTML de las filas de la tabla usando un bucle estándar
    let rowsHtml = '';
    
    if (users.length === 0) {
      rowsHtml = `
        <tr>
          <td colspan="4" class="px-6 py-12 text-center text-slate-400">No se encontraron usuarios registrados.</td>
        </tr>
      `;
    } else {
      for (const user of users) {
        const isAdmin = user.role === 'admin';
        const roleClass = isAdmin 
          ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
          : 'bg-emerald-50 text-emerald-700 border border-emerald-100';

        rowsHtml += `
          <tr class="hover:bg-slate-50/40 transition-colors">
            <td class="px-6 py-4 font-mono font-medium text-slate-400">${user.id}</td>
            <td class="px-6 py-4 font-bold text-slate-800">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-semibold flex items-center justify-center text-xs">
                  ${user.name.charAt(0).toUpperCase()}
                </div>
                <span>${user.name}</span>
              </div>
            </td>
            <td class="px-6 py-4 text-slate-600 font-medium">${user.email}</td>
            <td class="px-6 py-4">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold tracking-wide border ${roleClass}">
                ${user.role}
              </span>
            </td>
          </tr>
        `;
      }
    }

    // 3. Insertamos la tabla completa en el contenedor
    container.innerHTML = `
      <div class="space-y-6 animate-fade-in">
        <div>
          <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Directorio de Usuarios y Clientes</h2>
          <p class="text-sm text-slate-500 font-medium">Lista de todos los usuarios registrados en el sistema</p>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-100">
              <thead>
                <tr class="text-left text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                  <th class="px-6 py-4">ID</th>
                  <th class="px-6 py-4">Nombre Completo</th>
                  <th class="px-6 py-4">Correo Electrónico</th>
                  <th class="px-6 py-4">Rol de Acceso</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-sm">
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

  } catch (err) {
    showToast('Error al obtener el directorio de usuarios.', 'error');
    console.error(err);
  }
}
