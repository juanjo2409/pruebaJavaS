import { apiFetchUsers } from '../services/api.js';
import { showToast } from '../components/Toast.js';

/**
 * Renderiza la tabla de usuarios para visibilidad del administrador.
 */
export async function renderUsers(container) {
  container.innerHTML = `
    <div class="flex items-center justify-center min-h-[300px]">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
    </div>
  `;

  try {
    const users = await apiFetchUsers();
    
    container.innerHTML = `
      <div class="space-y-6 animate-fade-in">
        <!-- Encabezado de la Página -->
        <div>
          <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Directorio de Colaboradores</h2>
          <p class="text-sm text-slate-500 font-medium">Lista de todos los empleados y administradores registrados en el sistema</p>
        </div>

        <!-- Tarjeta de la Tabla de Empleados -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-100">
              <thead>
                <tr class="text-left text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                  <th class="px-6 py-4">ID</th>
                  <th class="px-6 py-4">Nombre del Empleado</th>
                  <th class="px-6 py-4">Correo Electrónico</th>
                  <th class="px-6 py-4">Rol de Acceso</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-sm">
                ${users.length === 0 ? `
                  <tr>
                    <td colspan="4" class="px-6 py-12 text-center text-slate-400">No se encontraron usuarios registrados.</td>
                  </tr>
                ` : users.map(user => `
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
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold tracking-wide border ${user.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}">
                        ${user.role}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

  } catch (err) {
    showToast('Failed to retrieve employees directory.', 'error');
    console.error(err);
  }
}
