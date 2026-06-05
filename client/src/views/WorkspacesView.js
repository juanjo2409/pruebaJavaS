import { apiFetchWorkspaces, apiCreateWorkspace, apiUpdateWorkspace, apiDeleteWorkspace } from '../services/api.js';
import { showToast } from '../components/Toast.js';
import { showModal, showConfirmModal } from '../components/Modal.js';

// Traducciones para la interfaz de usuario
const typeTranslations = {
  'Private Office': 'Oficina Privada',
  'Meeting Room': 'Sala de Reuniones',
  'Coworking Space': 'Espacio Coworking',
  'Auditorium': 'Auditorio'
};

/**
 * Renderiza el módulo de administración de espacios de trabajo.
 */
export async function renderWorkspaces(container) {
  await loadWorkspacesTable(container);
}

async function loadWorkspacesTable(container) {
  container.innerHTML = `
    <div class="flex items-center justify-center min-h-[300px]">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
    </div>
  `;

  try {
    const workspaces = await apiFetchWorkspaces();

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in">
        <!-- Encabezado de la página -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Espacios de Trabajo</h2>
            <p class="text-sm text-slate-500 font-medium">Gestione salas de reuniones, oficinas privadas, áreas de coworking y auditorios</p>
          </div>
          <button id="add-workspace-btn" class="inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md transition-all duration-200 cursor-pointer gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path></svg>
            <span>Agregar Espacio</span>
          </button>
        </div>

        <!-- Tarjeta de la Tabla de Espacios -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-100">
              <thead>
                <tr class="text-left text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                  <th class="px-6 py-4">Nombre</th>
                  <th class="px-6 py-4">Tipo</th>
                  <th class="px-6 py-4">Capacidad</th>
                  <th class="px-6 py-4">Ubicación</th>
                  <th class="px-6 py-4">Estado</th>
                  <th class="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-sm">
                ${workspaces.length === 0 ? `
                  <tr>
                    <td colspan="6" class="px-6 py-12 text-center text-slate-400">
                      <div class="flex flex-col items-center justify-center">
                        <svg class="w-12 h-12 mb-3 text-slate-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                        <p class="font-semibold text-slate-600 mb-1">No se encontraron espacios</p>
                        <p class="text-xs text-slate-500">Comience creando un nuevo espacio de trabajo.</p>
                      </div>
                    </td>
                  </tr>
                ` : workspaces.map(ws => `
                  <tr class="hover:bg-slate-50/40 transition-colors">
                    <td class="px-6 py-4 font-bold text-slate-800">${ws.name}</td>
                    <td class="px-6 py-4 text-slate-600">
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        ${typeTranslations[ws.type] || ws.type}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-slate-600 font-semibold">${ws.capacity} personas</td>
                    <td class="px-6 py-4 text-slate-500 font-medium">${ws.location}</td>
                    <td class="px-6 py-4">
                      <button data-id="${ws.id}" data-action="toggle-status" class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wide cursor-pointer border hover:shadow-sm transition-all duration-200 ${ws.status === 'Available' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200/50' : 'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200/50'}">
                        <span class="w-1.5 h-1.5 rounded-full mr-1.5 ${ws.status === 'Available' ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
                        <span>${ws.status === 'Available' ? 'Disponible' : 'No Disponible'}</span>
                      </button>
                    </td>
                    <td class="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                      <button data-id="${ws.id}" data-action="edit" class="inline-flex items-center justify-center p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer" title="Editar Espacio">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                      </button>
                      <button data-id="${ws.id}" data-action="delete" class="inline-flex items-center justify-center p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Eliminar Espacio">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Evento clic para agregar espacio
    container.querySelector('#add-workspace-btn').addEventListener('click', () => openFormModal(null, container));

    // Manejo delegado de las acciones de la tabla
    container.querySelector('tbody').addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const id = Number(btn.getAttribute('data-id'));
      const action = btn.getAttribute('data-action');
      const ws = workspaces.find(w => Number(w.id) === id);

      if (!ws) return;

      if (action === 'toggle-status') {
        const nextStatus = ws.status === 'Available' ? 'Unavailable' : 'Available';
        try {
          await apiUpdateWorkspace(ws.id, { ...ws, status: nextStatus });
          showToast(`Estado del espacio modificado a ${nextStatus === 'Available' ? 'Disponible' : 'No Disponible'}`);
          loadWorkspacesTable(container);
        } catch (err) {
          showToast('No se pudo modificar la disponibilidad.', 'error');
        }
      } else if (action === 'edit') {
        openFormModal(ws, container);
      } else if (action === 'delete') {
        showConfirmModal({
          title: 'Eliminar Espacio de Trabajo',
          message: `¿Está seguro de que desea eliminar <strong>${ws.name}</strong>? Esta acción borrará el registro de forma permanente.`,
          confirmText: 'Eliminar Registro',
          onConfirm: async (modalEl, closeFn) => {
            try {
              await apiDeleteWorkspace(ws.id);
              showToast('Espacio eliminado correctamente.');
              closeFn();
              loadWorkspacesTable(container);
            } catch (err) {
              showToast('Error al intentar eliminar el espacio.', 'error');
            }
          }
        });
      }
    });

  } catch (err) {
    showToast('Error al cargar la lista de espacios.', 'error');
    console.error(err);
  }
}

function openFormModal(ws = null, container) {
  const isEdit = !!ws;
  const title = isEdit ? 'Editar Espacio' : 'Agregar Espacio';

  const bodyHTML = `
    <form id="workspace-form" class="space-y-4">
      <div>
        <label for="ws-name" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre del Espacio</label>
        <input id="ws-name" type="text" required class="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none" placeholder="e.g. Sala de Juntas Ejecutiva" value="${isEdit ? ws.name : ''}">
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="ws-type" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Espacio</label>
          <select id="ws-type" required class="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none">
            <option value="Private Office" ${isEdit && ws.type === 'Private Office' ? 'selected' : ''}>Oficina Privada</option>
            <option value="Meeting Room" ${isEdit && ws.type === 'Meeting Room' ? 'selected' : ''}>Sala de Reuniones</option>
            <option value="Coworking Space" ${isEdit && ws.type === 'Coworking Space' ? 'selected' : ''}>Espacio Coworking</option>
            <option value="Auditorium" ${isEdit && ws.type === 'Auditorium' ? 'selected' : ''}>Auditorio</option>
          </select>
        </div>
        <div>
          <label for="ws-capacity" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Capacidad Máxima</label>
          <input id="ws-capacity" type="number" required min="1" class="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none" placeholder="e.g. 10" value="${isEdit ? ws.capacity : ''}">
        </div>
      </div>

      <div>
        <label for="ws-location" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ubicación / Ala</label>
        <input id="ws-location" type="text" required class="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none" placeholder="e.g. Piso 2, Ala Oeste" value="${isEdit ? ws.location : ''}">
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Disponibilidad Inicial</label>
        <div class="flex items-center gap-4">
          <label class="inline-flex items-center text-sm font-medium text-slate-700 cursor-pointer">
            <input type="radio" name="ws-status" value="Available" ${!isEdit || ws.status === 'Available' ? 'checked' : ''} class="h-4 w-4 text-indigo-600 mr-2 cursor-pointer">
            Disponible
          </label>
          <label class="inline-flex items-center text-sm font-medium text-slate-700 cursor-pointer">
            <input type="radio" name="ws-status" value="Unavailable" ${isEdit && ws.status === 'Unavailable' ? 'checked' : ''} class="h-4 w-4 text-indigo-600 mr-2 cursor-pointer">
            No Disponible
          </label>
        </div>
      </div>
    </form>
  `;

  showModal({
    title,
    bodyHTML,
    confirmText: isEdit ? 'Actualizar' : 'Crear',
    onConfirm: async (modalEl, closeFn) => {
      const name = modalEl.querySelector('#ws-name').value.trim();
      const type = modalEl.querySelector('#ws-type').value;
      const capacity = Number(modalEl.querySelector('#ws-capacity').value);
      const location = modalEl.querySelector('#ws-location').value.trim();
      const status = modalEl.querySelector('input[name="ws-status"]:checked').value;

      if (!name || !capacity || !location) {
        showToast('Complete todos los campos del formulario.', 'warning');
        return;
      }

      const workspaceData = { name, type, capacity, location, status };

      try {
        if (isEdit) {
          await apiUpdateWorkspace(ws.id, workspaceData);
          showToast('Espacio de trabajo actualizado.');
        } else {
          await apiCreateWorkspace(workspaceData);
          showToast('Espacio de trabajo creado.');
        }
        
        closeFn();
        loadWorkspacesTable(container);
      } catch (err) {
        showToast('Error al guardar el espacio.', 'error');
      }
    }
  });
}
