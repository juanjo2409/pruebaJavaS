import { 
  apiFetchReservations, 
  apiFetchWorkspaces, 
  apiCreateReservation, 
  apiUpdateReservation, 
  apiPatchReservation, 
  apiDeleteReservation 
} from '../services/api.js';
import { getCurrentUser } from '../guards/auth.js';
import { showToast } from '../components/Toast.js';
import { showModal, showConfirmModal } from '../components/Modal.js';
import { formatDate, isTodayOrFuture } from '../utils/helpers.js';
import { checkReservationOverlap, compareTimes } from '../utils/validation.js';

let currentUser = null;
let allReservations = []; // Cache completo de reservas para validación de traslapes
let workspacesList = [];  // Cache de espacios de trabajo

// Traducciones para la interfaz de usuario
const typeTranslations = {
  'Private Office': 'Oficina Privada',
  'Meeting Room': 'Sala de Reuniones',
  'Coworking Space': 'Espacio Coworking',
  'Auditorium': 'Auditorio'
};

const statusTranslations = {
  'Pending': 'Pendiente',
  'Approved': 'Aprobada',
  'Rejected': 'Rechazada',
  'Cancelled': 'Cancelada'
};

/**
 * Función principal para renderizar el tablero de reservas.
 */
export async function renderReservations(container) {
  currentUser = getCurrentUser();
  await loadReservationsBoard(container);
}

async function loadReservationsBoard(container) {
  container.innerHTML = `
    <div class="flex items-center justify-center min-h-[300px]">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
    </div>
  `;

  try {
    // Carga inicial paralela
    const [resList, wsList] = await Promise.all([
      apiFetchReservations(),
      apiFetchWorkspaces()
    ]);

    allReservations = resList;
    workspacesList = wsList;

    const isAdmin = currentUser.role === 'admin';
    // Filtrar reservas según el rol del usuario (empleados solo ven las suyas)
    const visibleReservations = isAdmin
      ? allReservations
      : allReservations.filter(r => Number(r.userId) === Number(currentUser.id));

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in">
        <!-- Encabezado de la Página -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Tablero de Reservas</h2>
            <p class="text-sm text-slate-500 font-medium">
              ${isAdmin ? 'Apruebe, rechace o gestione todas las reservas de espacios de los empleados' : 'Reserve espacios y gestione sus solicitudes de reserva'}
            </p>
          </div>
          <button id="book-workspace-btn" class="inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md transition-all duration-200 cursor-pointer gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path></svg>
            <span>Reservar Espacio</span>
          </button>
        </div>

        <!-- Barra de Filtros -->
        <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Buscar Espacio</label>
            <input id="filter-search" type="text" class="block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none" placeholder="e.g. Sala A">
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tipo de Espacio</label>
            <select id="filter-type" class="block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none">
              <option value="All">Todos los Tipos</option>
              <option value="Private Office">Oficina Privada</option>
              <option value="Meeting Room">Sala de Reuniones</option>
              <option value="Coworking Space">Espacio Coworking</option>
              <option value="Auditorium">Auditorio</option>
            </select>
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Estado de Reserva</label>
            <select id="filter-status" class="block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none">
              <option value="All">Todos los Estados</option>
              <option value="Pending">Pendiente</option>
              <option value="Approved">Aprobada</option>
              <option value="Rejected">Rechazada</option>
              <option value="Cancelled">Cancelada</option>
            </select>
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha</label>
            <input id="filter-date" type="date" class="block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none">
          </div>
        </div>

        <!-- Contenedor del Listado -->
        <div id="reservations-list-container" class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Populado dinámicamente por la función de filtros -->
        </div>
      </div>
    `;

    // Referencias de controles de filtros
    const searchInput = container.querySelector('#filter-search');
    const typeSelect = container.querySelector('#filter-type');
    const statusSelect = container.querySelector('#filter-status');
    const dateInput = container.querySelector('#filter-date');
    const listContainer = container.querySelector('#reservations-list-container');

    const runFiltering = () => {
      const filters = {
        search: searchInput.value,
        type: typeSelect.value,
        status: statusSelect.value,
        date: dateInput.value
      };
      
      const filtered = visibleReservations.filter(res => {
        const wsName = res.workspace ? res.workspace.name.toLowerCase() : '';
        if (filters.search && !wsName.includes(filters.search.toLowerCase())) return false;
        
        const wsType = res.workspace ? res.workspace.type : '';
        if (filters.type !== 'All' && wsType !== filters.type) return false;
        
        if (filters.status !== 'All' && res.status !== filters.status) return false;
        if (filters.date && res.date !== filters.date) return false;
        
        return true;
      });

      renderCards(filtered, listContainer, container);
    };

    searchInput.addEventListener('input', runFiltering);
    typeSelect.addEventListener('change', runFiltering);
    statusSelect.addEventListener('change', runFiltering);
    dateInput.addEventListener('change', runFiltering);

    container.querySelector('#book-workspace-btn').addEventListener('click', () => openBookingModal(null, container));

    // Ejecutar filtrado inicial
    runFiltering();

  } catch (err) {
    showToast('Error al cargar reservas.', 'error');
    console.error(err);
  }
}

function renderCards(reservations, listContainer, boardContainer) {
  const isAdmin = currentUser.role === 'admin';

  if (reservations.length === 0) {
    listContainer.innerHTML = `
      <div class="col-span-full bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center">
        <svg class="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"></path></svg>
        <h3 class="text-base font-bold text-slate-700">No se encontraron reservas</h3>
        <p class="text-xs text-slate-400 mt-1">Intente cambiar los filtros o cree una solicitud de reserva nueva.</p>
      </div>
    `;
    return;
  }

  // Ordenar cronológicamente (más recientes primero)
  const sorted = [...reservations].sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));

  listContainer.innerHTML = sorted.map(res => {
    const ws = res.workspace || { name: 'Espacio Desconocido', type: 'Desconocido', location: 'Desconocido', capacity: 0 };
    const userObj = res.user || { name: 'Colaborador Desconocido', email: '' };
    
    const badgeColor = getStatusBadgeColor(res.status);
    const isPending = res.status === 'Pending';
    const isApproved = res.status === 'Approved';

    let actionsHTML = '';
    
    // Reglas de accesos para acciones en la tarjeta
    if (isAdmin) {
      actionsHTML = `
        <div class="flex items-center gap-1.5 pt-3 border-t border-slate-100 mt-4">
          ${isPending ? `
            <button data-id="${res.id}" data-action="approve" class="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"></path></svg>
              <span>Aprobar</span>
            </button>
            <button data-id="${res.id}" data-action="reject" class="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
              <span>Rechazar</span>
            </button>
          ` : ''}
          <button data-id="${res.id}" data-action="edit" class="ml-auto p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer" title="Editar Reserva">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"></path></svg>
          </button>
          <button data-id="${res.id}" data-action="delete" class="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Eliminar Registro">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"></path></svg>
          </button>
        </div>
      `;
    } else {
      const canEdit = isPending;
      const canCancel = isPending || isApproved;
      
      if (canEdit || canCancel) {
        actionsHTML = `
          <div class="flex items-center gap-1.5 pt-3 border-t border-slate-100 mt-4 justify-end">
            ${canEdit ? `
              <button data-id="${res.id}" data-action="edit" class="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"></path></svg>
                <span>Editar</span>
              </button>
            ` : ''}
            ${canCancel ? `
              <button data-id="${res.id}" data-action="cancel" class="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                <span>Cancelar</span>
              </button>
            ` : ''}
          </div>
        `;
      }
    }

    return `
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
        <div class="space-y-3">
          <div class="flex items-start justify-between gap-2">
            <div>
              <span class="inline-block text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest">
                ${typeTranslations[ws.type] || ws.type}
              </span>
              <h4 class="text-base font-bold text-slate-800 truncate" title="${ws.name}">${ws.name}</h4>
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${badgeColor}">
              ${statusTranslations[res.status] || res.status}
            </span>
          </div>

          <!-- Métricas del Espacio -->
          <div class="grid grid-cols-2 gap-2 text-xs text-slate-500 bg-slate-50 rounded-xl p-3">
            <div>
              <span class="block text-[9px] font-bold text-slate-400 uppercase">Ubicación</span>
              <span class="font-medium text-slate-700 truncate block">${ws.location}</span>
            </div>
            <div>
              <span class="block text-[9px] font-bold text-slate-400 uppercase">Capacidad</span>
              <span class="font-medium text-slate-700 block">${ws.capacity} personas</span>
            </div>
          </div>

          <!-- Fecha y Horario -->
          <div class="flex items-center gap-2.5 text-xs font-semibold text-slate-600">
            <svg class="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            <span>${formatDate(res.date)}</span>
            <span class="text-slate-300">|</span>
            <span class="font-mono text-slate-500">${res.startTime} - ${res.endTime}</span>
          </div>

          <!-- Motivo de la Reserva -->
          <div class="text-xs text-slate-500 italic bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
            "${res.reason || 'No se ingresó motivo de reserva'}"
          </div>

          <!-- Colaborador vinculado (solo visible para Administradores) -->
          ${isAdmin ? `
            <div class="pt-3 border-t border-slate-100 flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                ${userObj.name.charAt(0).toUpperCase()}
              </div>
              <div class="text-[10px] font-semibold text-slate-600">
                <span class="text-slate-400">Reservado por:</span> ${userObj.name} (${userObj.email})
              </div>
            </div>
          ` : ''}
        </div>

        ${actionsHTML}
      </div>
    `;
  }).join('');

  // Vincular controladores de eventos a los botones de las tarjetas
  listContainer.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = Number(btn.getAttribute('data-id'));
      const action = btn.getAttribute('data-action');
      const res = allReservations.find(r => Number(r.id) === id);

      if (!res) return;

      if (action === 'approve') {
        await patchStatus(res.id, 'Approved', boardContainer);
      } else if (action === 'reject') {
        await patchStatus(res.id, 'Rejected', boardContainer);
      } else if (action === 'cancel') {
        await patchStatus(res.id, 'Cancelled', boardContainer);
      } else if (action === 'edit') {
        openBookingModal(res, boardContainer);
      } else if (action === 'delete') {
        showConfirmModal({
          title: 'Eliminar Reserva',
          message: '¿Está seguro de que desea borrar este registro de reserva? Se eliminará de las bitácoras permanentemente.',
          confirmText: 'Eliminar Registro',
          onConfirm: async (modalEl, closeFn) => {
            try {
              await apiDeleteReservation(res.id);
              showToast('Registro de reserva eliminado.');
              closeFn();
              loadReservationsBoard(boardContainer);
            } catch (err) {
              showToast('Error al eliminar la reserva.', 'error');
            }
          }
        });
      }
    });
  });
}

async function patchStatus(id, nextStatus, container) {
  try {
    await apiPatchReservation(id, { status: nextStatus });
    showToast(`El estado de la reserva ha cambiado a ${nextStatus === 'Approved' ? 'Aprobada' : nextStatus === 'Rejected' ? 'Rechazada' : 'Cancelada'}`);
    await loadReservationsBoard(container);
  } catch (err) {
    showToast(`Error al cambiar el estado a ${nextStatus}`, 'error');
  }
}

function openBookingModal(res = null, boardContainer) {
  const isEdit = !!res;
  const title = isEdit ? 'Editar Reserva' : 'Solicitar Reserva de Espacio';

  // Mostrar espacios de trabajo (solo disponibles, o el que tiene seleccionado si se está editando)
  const eligible = workspacesList.filter(w => {
    if (w.status === 'Available') return true;
    if (isEdit && Number(w.id) === Number(res.workspaceId)) return true;
    return false;
  });

  if (eligible.length === 0) {
    showToast('No hay espacios de trabajo disponibles para reservas en este momento.', 'warning');
    return;
  }

  const bodyHTML = `
    <form id="reservation-form" class="space-y-4">
      <div>
        <label for="res-workspace" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Seleccionar Espacio</label>
        <select id="res-workspace" required class="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none">
          ${eligible.map(w => `
            <option value="${w.id}" ${isEdit && Number(res.workspaceId) === Number(w.id) ? 'selected' : ''}>
              ${w.name} (${typeTranslations[w.type] || w.type} - Cap: ${w.capacity} - ${w.location})
            </option>
          `).join('')}
        </select>
      </div>

      <div>
        <label for="res-date" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha de Reserva</label>
        <input id="res-date" type="date" required class="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none" value="${isEdit ? res.date : ''}">
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="res-start" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hora de Inicio</label>
          <input id="res-start" type="time" required class="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none" value="${isEdit ? res.startTime : '09:00'}">
        </div>
        <div>
          <label for="res-end" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hora de Finalización</label>
          <input id="res-end" type="time" required class="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none" value="${isEdit ? res.endTime : '17:00'}">
        </div>
      </div>

      <div>
        <label for="res-reason" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Motivo / Uso del Espacio</label>
        <textarea id="res-reason" required rows="3" class="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none" placeholder="e.g. Reunión de planeación sprint">${isEdit ? res.reason : ''}</textarea>
      </div>
    </form>
  `;

  showModal({
    title,
    bodyHTML,
    confirmText: isEdit ? 'Guardar Cambios' : 'Reservar Ahora',
    onConfirm: async (modalEl, closeFn) => {
      const workspaceId = Number(modalEl.querySelector('#res-workspace').value);
      const date = modalEl.querySelector('#res-date').value;
      const startTime = modalEl.querySelector('#res-start').value;
      const endTime = modalEl.querySelector('#res-end').value;
      const reason = modalEl.querySelector('#res-reason').value.trim();

      if (!workspaceId || !date || !startTime || !endTime || !reason) {
        showToast('Complete todos los campos del formulario.', 'warning');
        return;
      }

      // Regla 1: Validar fecha (hoy o en el futuro)
      if (!isTodayOrFuture(date)) {
        showToast('La fecha debe ser actual o en el futuro.', 'warning');
        return;
      }

      // Regla 2: Validar horario (inicio antes del fin)
      if (compareTimes(startTime, endTime) >= 0) {
        showToast('La hora de inicio debe ser anterior a la de finalización.', 'warning');
        return;
      }

      const candidate = {
        id: isEdit ? res.id : undefined,
        workspaceId,
        date,
        startTime,
        endTime
      };

      // Regla 3: Verificar cruces de horarios
      const conflict = checkReservationOverlap(candidate, allReservations);
      if (conflict) {
        showToast('Cruce de Horarios: El espacio ya está reservado en ese periodo.', 'error');
        return;
      }

      const reservationData = {
        userId: isEdit ? res.userId : Number(currentUser.id),
        workspaceId,
        date,
        startTime,
        endTime,
        reason,
        status: isEdit ? res.status : 'Pending'
      };

      try {
        if (isEdit) {
          await apiUpdateReservation(res.id, reservationData);
          showToast('Reserva actualizada correctamente.');
        } else {
          await apiCreateReservation(reservationData);
          showToast('Reserva creada con éxito.');
        }

        closeFn();
        await loadReservationsBoard(boardContainer);
      } catch (err) {
        showToast('Error al intentar guardar la reserva.', 'error');
      }
    }
  });
}

function getStatusBadgeColor(status) {
  switch (status) {
    case 'Approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Rejected': return 'bg-rose-100 text-rose-800 border-rose-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}
