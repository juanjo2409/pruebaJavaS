import { 
  apiFetchUsers, 
  apiFetchReservations, 
  apiCreateUser, 
  apiUpdateUser, 
  apiDeleteUser 
} from '../services/api.js';
import { getCurrentUser } from '../guards/auth.js';
import { showToast } from '../components/Toast.js';

/**
 * DIBUJAR VISTA DE USUARIOS:
 * Renderiza la lista de usuarios, incluye tarjetas de estadísticas, buscador y
 * funciones administrativas completas (Crear, cambiar rol y eliminar usuarios).
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

    const activeAdmin = getCurrentUser();

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

    // Dibujar estructura inicial de la vista
    container.innerHTML = `
      <div class="space-y-6 animate-fade-in">
        <!-- Encabezado con Botón de Creación -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Directorio de Usuarios</h2>
            <p class="text-xs sm:text-sm text-slate-400 font-medium">Audita las cuentas, asigna roles de administración o remueve accesos</p>
          </div>
          <button id="add-user-btn" class="inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md transition-all duration-200 cursor-pointer gap-2 self-start sm:self-center">
            ➕ Registrar Usuario
          </button>
        </div>

        <!-- Fila de Tarjetas de Estadísticas (Aesthetics Premium) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Tarjeta: Total Usuarios -->
          <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-xl text-indigo-400 shrink-0">👥</div>
            <div>
              <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Usuarios</span>
              <span class="text-2xl font-black text-white">${users.length}</span>
            </div>
          </div>
          
          <!-- Tarjeta: Administradores -->
          <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-xl text-purple-400 shrink-0">🛡️</div>
            <div>
              <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Administradores</span>
              <span class="text-2xl font-black text-white">${totalAdmins}</span>
            </div>
          </div>

          <!-- Tarjeta: Clientes -->
          <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-xl text-emerald-400 shrink-0">🍿</div>
            <div>
              <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clientes</span>
              <span class="text-2xl font-black text-white">${totalClients}</span>
            </div>
          </div>

          <!-- Tarjeta: Entradas Compradas -->
          <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-xl text-amber-400 shrink-0">🎟️</div>
            <div>
              <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Boletos Activos</span>
              <span class="text-2xl font-black text-white">${totalTickets}</span>
            </div>
          </div>
        </div>

        <!-- Filtros Reactivos -->
        <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div class="relative w-full sm:max-w-md">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input id="user-search" type="text" placeholder="Buscar por nombre o correo..." class="w-full pl-10 pr-4 py-2 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div class="w-full sm:w-auto shrink-0 flex items-center gap-2">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Filtrar Rol:</span>
            <select id="user-role-filter" class="bg-white border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
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
                  <th class="px-6 py-4 w-64 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody id="users-table-body" class="divide-y divide-slate-100 text-sm">
                <!-- Se inyecta dinámicamente con JS -->
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Contenedor para el Modal de Crear Usuario -->
      <div id="user-modal-container"></div>
    `;

    const searchInput = container.querySelector('#user-search');
    const roleFilter = container.querySelector('#user-role-filter');
    const tbody = container.querySelector('#users-table-body');
    const modalContainer = container.querySelector('#user-modal-container');

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

        // Filtro por texto
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
              userTickets += r.amount || r.cantidad_entradas || 0;
            }
          }
        }

        const isAdmin = u.role === 'admin';
        const roleClass = isAdmin 
          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';

        const avatarGrad = isAdmin
          ? 'from-purple-500 to-indigo-600'
          : 'from-emerald-400 to-teal-600';

        // Evitar que el admin activo se elimine o cambie rol a sí mismo
        const isSelf = activeAdmin && activeAdmin.id === u.id;

        const actionButtons = isSelf 
          ? `<span class="text-xs text-slate-500 font-bold italic mr-4">Tu Cuenta (Activa)</span>` 
          : `
            <div class="flex justify-end gap-2 pr-4">
              <button data-id="${u.id}" data-action="toggle-role" class="btn-user-action bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all border border-indigo-500/20 cursor-pointer">
                🔄 Cambiar Rol
              </button>
              <button data-id="${u.id}" data-action="delete" class="btn-user-action bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all border border-rose-500/20 cursor-pointer">
                🗑️ Eliminar
              </button>
            </div>
          `;

        rowsHtml += `
          <tr class="hover:bg-slate-50/40 transition-colors">
            <td class="px-6 py-4 font-mono font-bold text-slate-500">#${u.id}</td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-gradient-to-tr ${avatarGrad} text-white font-black flex items-center justify-center text-sm shadow-sm">
                  ${u.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span class="font-bold text-white block">${u.name}</span>
                  <span class="text-[10px] text-slate-400 font-medium">Cuenta Activa</span>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 text-slate-300 font-medium">${u.email}</td>
            <td class="px-6 py-4">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${roleClass}">
                ${u.role}
              </span>
            </td>
            <td class="px-6 py-4">
              ${isAdmin 
                ? '<span class="text-xs text-slate-500 font-semibold italic">N/A (Admin)</span>' 
                : `<span class="font-extrabold text-indigo-400">${userTickets} boletos</span>`
              }
            </td>
            <td class="px-6 py-4">
              ${actionButtons}
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

    // 3. Registrar eventos para las acciones sobre usuarios (Cambiar Rol / Eliminar)
    tbody.addEventListener('click', async (e) => {
      const btn = e.target.closest('.btn-user-action');
      if (!btn) return;

      const userId = Number(btn.dataset.id);
      const action = btn.dataset.action;
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) return;

      if (action === 'toggle-role') {
        const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
        
        const result = await Swal.fire({
          title: '¿Cambiar Rol?',
          text: `¿Seguro que deseas cambiar el rol de ${targetUser.name} a ${newRole}?`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#4f46e5',
          cancelButtonColor: '#6b7280',
          confirmButtonText: 'Sí, cambiar',
          cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
          try {
            await apiUpdateUser(userId, { ...targetUser, role: newRole });
            showToast(`Rol de ${targetUser.name} actualizado con éxito.`, 'success');
            renderUsers(container); // Recargar
          } catch (err) {
            showToast('Error al actualizar rol del usuario.', 'error');
          }
        }
      }

      if (action === 'delete') {
        const result = await Swal.fire({
          title: '¿Eliminar Usuario?',
          text: `Esta acción removerá a ${targetUser.name} permanentemente. ¿Deseas continuar?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#ef4444',
          cancelButtonColor: '#6b7280',
          confirmButtonText: 'Sí, eliminar',
          cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
          try {
            await apiDeleteUser(userId);
            showToast(`El usuario ${targetUser.name} fue eliminado.`, 'success');
            renderUsers(container); // Recargar
          } catch (err) {
            showToast('Error al eliminar usuario.', 'error');
          }
        }
      }
    });

    // 4. Modal para crear un nuevo usuario
    container.querySelector('#add-user-btn').addEventListener('click', () => {
      modalContainer.innerHTML = `
        <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-fade-in text-slate-100">
            <div class="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 class="text-lg font-black text-white">Registrar Nuevo Usuario</h3>
              <button id="close-modal-btn" class="text-slate-400 hover:text-white transition-colors cursor-pointer text-xl">✕</button>
            </div>

            <form id="create-user-form" class="space-y-4">
              <!-- Nombre Completo -->
              <div>
                <label for="new-name" class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nombre Completo</label>
                <input id="new-name" type="text" required class="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none" placeholder="e.g. Maria Delgado">
              </div>

              <!-- Correo -->
              <div>
                <label for="new-email" class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Correo Electrónico</label>
                <input id="new-email" type="email" required class="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none" placeholder="e.g. maria@cine.com">
              </div>

              <!-- Contraseña -->
              <div>
                <label for="new-password" class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contraseña</label>
                <input id="new-password" type="password" required class="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none" placeholder="••••••••">
              </div>

              <!-- Rol -->
              <div>
                <label for="new-role" class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rol de Acceso</label>
                <select id="new-role" class="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none">
                  <option value="user">Cliente (user)</option>
                  <option value="admin">Administrador (admin)</option>
                </select>
              </div>

              <div class="flex justify-end gap-2 pt-2">
                <button type="button" id="cancel-modal-btn" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer">
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      `;

      // Eventos del modal
      const closeModal = () => {
        modalContainer.innerHTML = '';
      };

      modalContainer.querySelector('#close-modal-btn').addEventListener('click', closeModal);
      modalContainer.querySelector('#cancel-modal-btn').addEventListener('click', closeModal);

      modalContainer.querySelector('#create-user-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = modalContainer.querySelector('#new-name').value.trim();
        const email = modalContainer.querySelector('#new-email').value.trim();
        const password = modalContainer.querySelector('#new-password').value;
        const role = modalContainer.querySelector('#new-role').value;

        // Comprobación rápida local para evitar duplicar correos electrónicos
        const mailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
        if (mailExists) {
          showToast('El correo ya se encuentra registrado por otro usuario.', 'error');
          return;
        }

        try {
          await apiCreateUser({ name, email, password, role });
          showToast(`Usuario ${name} registrado con éxito.`, 'success');
          closeModal();
          renderUsers(container); // Recargar
        } catch (err) {
          showToast('Error al registrar nuevo usuario.', 'error');
        }
      });
    });

    // Agregar listeners de filtros
    searchInput.addEventListener('input', filterUsersList);
    roleFilter.addEventListener('change', filterUsersList);

    // Primera carga de la tabla
    filterUsersList();

  } catch (err) {
    showToast('Error al obtener el directorio de usuarios.', 'error');
    console.error(err);
  }
}
