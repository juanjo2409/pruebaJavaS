import { apiFetchUsers, apiFetchReservations } from '../services/api.js';
import { showToast } from '../components/Toast.js';

/**
 * DIBUJAR VISTA DE USUARIOS:
 * Renderiza la lista de usuarios, incluye tarjetas de estadísticas y buscador reactivo.
 */
export async function renderUsers(container) {
  // Spinner de carga inicial
  container.innerHTML = `
    <div class="flex items-center justify-center min-h-[300px]">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
    </div>
  `;

  try {
    // 1. Obtenemos los usuarios y las reservas desde el servidor en paralelo
    const [users, reservations] = await Promise.all([
      apiFetchUsers(),
      apiFetchReservations()
    ]);

    // 2. Calcular estadísticas generales
    let totalAdmins = 0;
    let totalClients = 0;
    let totalTickets = 0;

    for (const u of users) {
      if (u.role === 'admin') {
        totalAdmins++;
      } else {
        totalClients++;
      }
    }

    for (const r of reservations) {
      if (r.estado !== 'Cancelada') {
        totalTickets += r.cantidad_entradas;
      }
    }

    // Dibujar estructura inicial de la vista con estadísticas e inputs de filtros
    container.innerHTML = `
      <div class="space-y-6 animate-fade-in">
        <!-- Encabezado -->
        <div>
          <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Directorio de Usuarios y Clientes</h2>
          <p class="text-sm text-slate-500 font-medium">Audita las cuentas de acceso del sistema y sus compras de boletos</p>
        </div>

        <!-- Fila de Tarjetas de Estadísticas (Aesthetics Premium) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Tarjeta: Total Usuarios -->
          <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-xl text-indigo-600 shrink-0">👥</div>
            <div>
              <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Total Usuarios</span>
              <span class="text-2xl font-black text-slate-900">${users.length}</span>
            </div>
          </div>
          
          <!-- Tarjeta: Administradores -->
          <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-xl text-purple-600 shrink-0">🛡️</div>
            <div>
              <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Administradores</span>
              <span class="text-2xl font-black text-slate-900">${totalAdmins}</span>
            </div>
          </div>

          <!-- Tarjeta: Clientes -->
          <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-xl text-emerald-600 shrink-0">🍿</div>
            <div>
              <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Clientes</span>
              <span class="text-2xl font-black text-slate-900">${totalClients}</span>
            </div>
          </div>

          <!-- Tarjeta: Entradas Compradas -->
          <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-xl text-amber-600 shrink-0">🎟️</div>
            <div>
              <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Boletos Activos</span>
              <span class="text-2xl font-black text-slate-900">${totalTickets}</span>
            </div>
          </div>
        </div>

        <!-- Filtros Reactivos -->
        <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div class="relative w-full sm:max-w-md">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input id="user-search" type="text" placeholder="Buscar por nombre o correo..." class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div class="w-full sm:w-auto shrink-0 flex items-center gap-2">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Filtrar Rol:</span>
            <select id="user-role-filter" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="all">Todos los roles</option>
              <option value="admin">Administrador</option>
              <option value="user">Cliente</option>
            </select>
          </div>
        </div>

        <!-- Tabla de Usuarios -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-100">
              <thead>
                <tr class="text-left text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                  <th class="px-6 py-4 w-20">ID</th>
                  <th class="px-6 py-4">Usuario</th>
                  <th class="px-6 py-4">Correo Electrónico</th>
                  <th class="px-6 py-4">Rol de Acceso</th>
                  <th class="px-6 py-4">Boletos Comprados</th>
                  <th class="px-6 py-4 w-32">Estado</th>
                </tr>
              </thead>
              <tbody id="users-table-body" class="divide-y divide-slate-100 text-sm">
                <!-- Se inyecta dinámicamente con JS -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    const searchInput = container.querySelector('#user-search');
    const roleFilter = container.querySelector('#user-role-filter');
    const tbody = container.querySelector('#users-table-body');

    // Función de filtrado interactivo (Reactivo)
    const filterUsersList = () => {
      const query = searchInput.value.trim().toLowerCase();
      const selectedRole = roleFilter.value;

      let rowsHtml = '';
      let matchCount = 0;

      for (const u of users) {
        const name = u.name.toLowerCase();
        const email = u.email.toLowerCase();
        const role = u.role;

        // Filtro por texto (nombre o correo)
        if (query && !name.includes(query) && !email.includes(query)) {
          continue;
        }

        // Filtro por rol
        if (selectedRole !== 'all' && role !== selectedRole) {
          continue;
        }

        matchCount++;

        // Calcular cuántos boletos activos/pendientes tiene el usuario
        let userTickets = 0;
        if (u.role === 'user') {
          for (const r of reservations) {
            if (r.usuario === u.name && r.estado !== 'Cancelada') {
              userTickets += r.cantidad_entradas;
            }
          }
        }

        const isAdmin = u.role === 'admin';
        const roleClass = isAdmin 
          ? 'bg-purple-50 text-purple-700 border border-purple-100' 
          : 'bg-emerald-50 text-emerald-700 border border-emerald-100';

        const avatarGrad = isAdmin
          ? 'from-purple-500 to-indigo-600'
          : 'from-emerald-400 to-teal-600';

        rowsHtml += `
          <tr class="hover:bg-slate-50/40 transition-colors">
            <td class="px-6 py-4 font-mono font-bold text-slate-400">#${u.id}</td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-gradient-to-tr ${avatarGrad} text-white font-black flex items-center justify-center text-sm shadow-sm">
                  ${u.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span class="font-bold text-slate-800 block">${u.name}</span>
                  <span class="text-[10px] text-slate-400 font-medium">Cuenta Activa</span>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 text-slate-600 font-medium">${u.email}</td>
            <td class="px-6 py-4">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${roleClass}">
                ${u.role}
              </span>
            </td>
            <td class="px-6 py-4">
              ${isAdmin 
                ? '<span class="text-xs text-slate-400 font-medium italic">N/A (Admin)</span>' 
                : `<span class="font-extrabold text-indigo-600">${userTickets} boletos</span>`
              }
            </td>
            <td class="px-6 py-4">
              <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Conectado
              </span>
            </td>
          </tr>
        `;
      }

      if (matchCount === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="px-6 py-12 text-center text-slate-400 font-semibold">No se encontraron usuarios que coincidan con los filtros.</td>
          </tr>
        `;
      } else {
        tbody.innerHTML = rowsHtml;
      }
    };

    // Agregar listeners
    searchInput.addEventListener('input', filterUsersList);
    roleFilter.addEventListener('change', filterUsersList);

    // Primera carga
    filterUsersList();

  } catch (err) {
    showToast('Error al obtener el directorio de usuarios.', 'error');
    console.error(err);
  }
}
