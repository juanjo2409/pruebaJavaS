import { apiFetchSalas, apiCreateSala, apiUpdateSala, apiDeleteSala } from '../servicios/api.js';
import { getCurrentUser } from '../guards/autenticacion.js';
import { showToast } from '../components/Notificaciones.js';

/**
 * 1. FUNCIÓN PRINCIPAL: Verifica permisos, carga las salas de la API,
 * y llama a renderContent.
 */
export async function renderRooms(container) {
  const user = getCurrentUser();
  const isAdmin = user && user.role === 'admin';

  // Si no es administrador, redirige a acceso denegado
  if (!isAdmin) {
    window.location.hash = '#/access-denied';
    return;
  }

  // Spinner de carga inicial
  container.innerHTML = `
    <div class="flex items-center justify-center min-h-[300px]">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
    </div>
  `;

  try {
    const salas = await apiFetchSalas();
    renderContent(container, salas);
  } catch (error) {
    console.error(error);
    showToast('Error al cargar la lista de salas', 'error');
  }
}

/**
 * 2. DIBUJAR VISTA: Genera el HTML de la rejilla de salas y el contenedor de modals.
 */
function renderContent(container, salas) {
  let listHtml = '';

  // Generamos las tarjetas visuales de las salas con un bucle estándar
  for (const sala of salas) {
    const isActiva = sala.estado === 'Activa';
    const statusClass = isActiva 
      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
      : 'bg-amber-50 text-amber-700 border border-amber-100';

    listHtml += `
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col group hover:shadow-md transition-all">
        <div class="p-6 flex-grow space-y-4">
          <div class="flex justify-between items-start">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusClass}">
              ${sala.estado}
            </span>
            <span class="text-xs font-bold text-slate-400 font-mono">ID: ${sala.id}</span>
          </div>
          <div>
            <h3 class="text-xl font-bold text-slate-900 tracking-tight">${sala.nombre}</h3>
            <p class="text-xs text-slate-400 mt-1">Tipo de Proyección: <strong class="text-indigo-600">${sala.tipo}</strong></p>
          </div>
          <div class="pt-2 text-sm border-t border-slate-50">
            <div class="flex justify-between items-center">
              <span class="text-slate-400 font-medium">Capacidad de Asientos:</span>
              <span class="font-bold text-slate-700">${sala.capacidad} asientos</span>
            </div>
          </div>
        </div>
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button data-id="${sala.id}" class="btn-edit-sala text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-all text-xs font-semibold cursor-pointer">Editar</button>
          <button data-id="${sala.id}" class="btn-delete-sala text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-all text-xs font-semibold cursor-pointer">Eliminar</button>
        </div>
      </div>
    `;
  }

  // Dibujamos la vista completa
  container.innerHTML = `
    <div class="space-y-6 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Gestión de Salas</h2>
          <p class="text-sm text-slate-500 font-medium">Administra las salas físicas de proyección del cine</p>
        </div>
        <button id="btn-add-sala" class="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all text-sm self-start sm:self-center cursor-pointer">
          + Nueva Sala
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${listHtml}
      </div>
      <div id="sala-modal-container"></div>
    </div>
  `;

  // Asignar los eventos interactivos
  setupEventListeners(container, salas);
}

/**
 * 3. CONTROLADORES DE EVENTOS: Escucha las interacciones para crear, editar y eliminar salas.
 */
function setupEventListeners(container, salas) {
  
  // A. ABRIR MODAL PARA CREAR NUEVA SALA
  container.querySelector('#btn-add-sala').addEventListener('click', () => {
    const modalContainer = container.querySelector('#sala-modal-container');
    modalContainer.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
        <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
          <h3 class="text-xl font-bold text-slate-900">Nueva Sala de Cine</h3>
          <form id="form-create-sala" class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre de la Sala</label>
              <input type="text" id="add-sala-name" required placeholder="e.g. Sala IMAX Premium" class="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Capacidad (Asientos)</label>
                <input type="number" id="add-sala-capacity" min="10" required value="100" class="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Tipo</label>
                <select id="add-sala-type" class="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                  <option value="2D">Standard 2D</option>
                  <option value="3D">RealD 3D</option>
                  <option value="IMAX">IMAX Theater</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Estado inicial</label>
              <select id="add-sala-status" class="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                <option value="Activa">Activa</option>
                <option value="Mantenimiento">Mantenimiento</option>
              </select>
            </div>
            <div class="flex justify-end gap-2 pt-2 border-t">
              <button type="button" id="sala-close-btn" class="px-4 py-2 text-sm font-semibold text-slate-500 cursor-pointer">Cerrar</button>
              <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold cursor-pointer">Crear Sala</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Cerrar modal
    modalContainer.querySelector('#sala-close-btn').addEventListener('click', () => modalContainer.innerHTML = '');

    // Formulario Submit
    modalContainer.querySelector('#form-create-sala').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        nombre: document.getElementById('add-sala-name').value.trim(),
        capacidad: Number(document.getElementById('add-sala-capacity').value),
        tipo: document.getElementById('add-sala-type').value,
        estado: document.getElementById('add-sala-status').value
      };

      try {
        await apiCreateSala(data);
        showToast('Sala de cine creada correctamente', 'success');
        modalContainer.innerHTML = '';
        renderRooms(container);
      } catch (err) {
        console.error(err);
        showToast('Error al crear la sala', 'error');
      }
    });
  });

  // B. ABRIR MODAL PARA EDITAR SALA EXISTENTE
  container.querySelectorAll('.btn-edit-sala').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = Number(e.currentTarget.dataset.id);
      const sala = salas.find(s => s.id === id);
      if (!sala) return;

      const modalContainer = container.querySelector('#sala-modal-container');
      modalContainer.innerHTML = `
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 class="text-xl font-bold text-slate-900">Editar Sala de Cine</h3>
            <form id="form-edit-sala" class="space-y-3">
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre de la Sala</label>
                <input type="text" id="edit-sala-name" value="${sala.nombre}" required class="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Capacidad (Asientos)</label>
                  <input type="number" id="edit-sala-capacity" min="10" value="${sala.capacidad}" required class="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Tipo</label>
                  <select id="edit-sala-type" class="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                    <option value="2D" ${sala.tipo === '2D' ? 'selected' : ''}>Standard 2D</option>
                    <option value="3D" ${sala.tipo === '3D' ? 'selected' : ''}>RealD 3D</option>
                    <option value="IMAX" ${sala.tipo === 'IMAX' ? 'selected' : ''}>IMAX Theater</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Estado de Sala</label>
                <select id="edit-sala-status" class="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                  <option value="Activa" ${sala.estado === 'Activa' ? 'selected' : ''}>Activa</option>
                  <option value="Mantenimiento" ${sala.estado === 'Mantenimiento' ? 'selected' : ''}>Mantenimiento</option>
                </select>
              </div>
              <div class="flex justify-end gap-2 pt-2 border-t">
                <button type="button" id="sala-close-btn" class="px-4 py-2 text-sm font-semibold text-slate-500 cursor-pointer">Cerrar</button>
                <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold cursor-pointer">Actualizar Sala</button>
              </div>
            </form>
          </div>
        </div>
      `;

      // Cerrar modal
      modalContainer.querySelector('#sala-close-btn').addEventListener('click', () => modalContainer.innerHTML = '');

      // Guardar cambios
      modalContainer.querySelector('#form-edit-sala').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
          nombre: document.getElementById('edit-sala-name').value.trim(),
          capacidad: Number(document.getElementById('edit-sala-capacity').value),
          tipo: document.getElementById('edit-sala-type').value,
          estado: document.getElementById('edit-sala-status').value
        };

        try {
          await apiUpdateSala(id, data);
          showToast('Sala de cine actualizada con éxito', 'success');
          modalContainer.innerHTML = '';
          renderRooms(container);
        } catch (err) {
          console.error(err);
          showToast('Error al actualizar la sala', 'error');
        }
      });
    });
  });

  // C. ELIMINAR SALA EXISTENTE
  container.querySelectorAll('.btn-delete-sala').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      Swal.fire({
        title: '¿Eliminar esta sala?',
        text: 'Esta acción podría afectar funciones ya programadas asociadas a esta sala.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            await apiDeleteSala(id);
            showToast('Sala eliminada correctamente', 'success');
            renderRooms(container);
          } catch (err) {
            console.error(err);
            showToast('Error al eliminar la sala', 'error');
          }
        }
      });
    });
  });
}
