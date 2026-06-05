import { apiFetchReservations, apiFetchWorkspaces, apiFetchUsers } from '../services/api.js';
import { showToast } from '../components/Toast.js';
import { formatDate } from '../utils/helpers.js';

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
 * Renderiza el panel de control del administrador con estadísticas y bitácoras recientes.
 */
export async function renderDashboard(container) {
  container.innerHTML = `
    <div class="flex items-center justify-center min-h-[300px]">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
    </div>
  `;

  try {
    // Carga de recursos paralela
    const [reservations, workspaces, users] = await Promise.all([
      apiFetchReservations(),
      apiFetchWorkspaces(),
      apiFetchUsers()
    ]);

    // Contar estadísticas de reservas
    const total = reservations.length;
    const approved = reservations.filter(r => r.status === 'Approved').length;
    const pending = reservations.filter(r => r.status === 'Pending').length;
    const rejected = reservations.filter(r => r.status === 'Rejected').length;
    const cancelled = reservations.filter(r => r.status === 'Cancelled').length;

    // Calcular el espacio de trabajo más utilizado (excluyendo canceladas o rechazadas)
    const workspaceCounter = {};
    reservations.forEach(res => {
      if (res.status !== 'Cancelled' && res.status !== 'Rejected') {
        workspaceCounter[res.workspaceId] = (workspaceCounter[res.workspaceId] || 0) + 1;
      }
    });

    let mostUsedWs = null;
    let maxBookings = 0;

    Object.entries(workspaceCounter).forEach(([wsId, count]) => {
      if (count > maxBookings) {
        maxBookings = count;
        mostUsedWs = workspaces.find(w => Number(w.id) === Number(wsId));
      }
    });

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in">
        <!-- Encabezado -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Panel de Control</h2>
            <p class="text-sm text-slate-500 font-medium">Estadísticas en tiempo real del uso de oficinas y salas de la empresa</p>
          </div>
          <div class="text-xs text-slate-400 font-mono bg-white border border-slate-100 rounded-lg px-3 py-2 shadow-sm self-start">
            Actualizado: ${new Date().toLocaleTimeString()}
          </div>
        </div>

        <!-- Cuadrícula de Tarjetas Métricas -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <!-- Total -->
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
            <div class="bg-indigo-50 text-indigo-600 p-4 rounded-xl">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <div>
              <span class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Total Reservas</span>
              <span class="text-2xl font-bold text-slate-900">${total}</span>
            </div>
          </div>

          <!-- Aprobados -->
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
            <div class="bg-emerald-50 text-emerald-600 p-4 rounded-xl">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <span class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Aprobadas</span>
              <span class="text-2xl font-bold text-emerald-600">${approved}</span>
            </div>
          </div>

          <!-- Pendientes -->
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
            <div class="bg-amber-50 text-amber-600 p-4 rounded-xl">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <div>
              <span class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Pendientes</span>
              <span class="text-2xl font-bold text-amber-600">${pending}</span>
            </div>
          </div>

          <!-- Rechazados -->
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
            <div class="bg-rose-50 text-rose-600 p-4 rounded-xl">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <span class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Rechazadas</span>
              <span class="text-2xl font-bold text-rose-600">${rejected}</span>
            </div>
          </div>
        </div>

        <!-- Panel de Distribución e Información de Espacios -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Espacio Más Utilizado -->
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between lg:col-span-1">
            <div>
              <h3 class="text-lg font-bold text-slate-800 mb-2">Espacio Más Solicitado</h3>
              <p class="text-xs text-slate-400 mb-6">Oficina o sala con mayor número de reservas activas</p>
              
              ${mostUsedWs ? `
                <div class="space-y-4">
                  <div class="bg-gradient-to-tr from-indigo-500 to-indigo-700 rounded-xl p-5 text-white shadow-lg">
                    <div class="text-[10px] font-extrabold uppercase tracking-widest text-indigo-200 mb-1">
                      ${typeTranslations[mostUsedWs.type] || mostUsedWs.type}
                    </div>
                    <h4 class="text-xl font-bold mb-3 truncate">${mostUsedWs.name}</h4>
                    
                    <div class="flex flex-col gap-2 text-xs text-indigo-100">
                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-indigo-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        <span>${mostUsedWs.location}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-indigo-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        <span>Capacidad: ${mostUsedWs.capacity} personas</span>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center justify-between pt-4 border-t border-slate-100 text-sm font-medium">
                    <span class="text-slate-500">Reservas registradas</span>
                    <span class="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold">${maxBookings} reservas</span>
                  </div>
                </div>
              ` : `
                <div class="flex flex-col items-center justify-center p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400">
                  <svg class="w-10 h-10 mb-2" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path></svg>
                  <span class="text-xs">No hay datos de reservas aún</span>
                </div>
              `}
            </div>

            <!-- Resumen de Totales -->
            <div class="border-t border-slate-100 pt-6 mt-6 grid grid-cols-2 gap-4 text-center">
              <div class="p-3 bg-slate-50 rounded-xl">
                <span class="block text-[10px] font-bold text-slate-400 uppercase">Espacios Totales</span>
                <span class="text-xl font-extrabold text-slate-800">${workspaces.length}</span>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl">
                <span class="block text-[10px] font-bold text-slate-400 uppercase">Empleados</span>
                <span class="text-xl font-extrabold text-slate-800">${users.length}</span>
              </div>
            </div>
          </div>

          <!-- Distribución por Categorías de Espacios -->
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 flex flex-col justify-between">
            <div>
              <h3 class="text-lg font-bold text-slate-800 mb-2">Distribución de Espacios</h3>
              <p class="text-xs text-slate-400 mb-6">Porcentaje de uso según la tipología del espacio</p>
              
              <div class="space-y-4">
                ${['Private Office', 'Meeting Room', 'Coworking Space', 'Auditorium'].map(type => {
                  const count = reservations.filter(r => {
                    if (r.status === 'Cancelled' || r.status === 'Rejected') return false;
                    return r.workspace && r.workspace.type === type;
                  }).length;
                  
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  
                  return `
                    <div class="space-y-1">
                      <div class="flex items-center justify-between text-xs font-semibold">
                        <span class="text-slate-700">${typeTranslations[type] || type}</span>
                        <span class="text-slate-500">${count} (${pct}%)</span>
                      </div>
                      <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div class="bg-indigo-600 h-full rounded-full transition-all duration-500" style="width: ${pct}%"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Ratios de Estados -->
            <div class="border-t border-slate-100 pt-6 mt-6">
              <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Relación de Estados de Reserva</h4>
              <div class="w-full flex h-5 rounded-full overflow-hidden text-[10px] text-white font-bold">
                ${approved > 0 ? `<div class="bg-emerald-500 flex items-center justify-center" style="width: ${(approved / total) * 100}%" title="Approved">${Math.round((approved / total) * 100)}%</div>` : ''}
                ${pending > 0 ? `<div class="bg-amber-500 flex items-center justify-center" style="width: ${(pending / total) * 100}%" title="Pending">${Math.round((pending / total) * 100)}%</div>` : ''}
                ${rejected > 0 ? `<div class="bg-rose-500 flex items-center justify-center" style="width: ${(rejected / total) * 100}%" title="Rejected">${Math.round((rejected / total) * 100)}%</div>` : ''}
                ${cancelled > 0 ? `<div class="bg-slate-400 flex items-center justify-center" style="width: ${(cancelled / total) * 100}%" title="Cancelled">${Math.round((cancelled / total) * 100)}%</div>` : ''}
              </div>
              <div class="flex flex-wrap gap-4 mt-3 text-[10px] font-semibold text-slate-500 justify-center">
                <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500"></span>Aprobadas</span>
                <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-amber-500"></span>Pendientes</span>
                <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-rose-500"></span>Rechazadas</span>
                <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-slate-400"></span>Canceladas</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Listado de Reservas Recientes -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-bold text-slate-800">Bitácora de Actividad Reciente</h3>
              <p class="text-xs text-slate-400">Últimas solicitudes de reserva recibidas</p>
            </div>
            <a href="#/reservations" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline">Ver Todo &rarr;</a>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-100">
              <thead>
                <tr class="text-left text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                  <th class="px-4 py-3 rounded-l-lg">Colaborador</th>
                  <th class="px-4 py-3">Espacio</th>
                  <th class="px-4 py-3">Fecha y Horario</th>
                  <th class="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-sm">
                ${reservations.length === 0 ? `
                  <tr>
                    <td colspan="4" class="px-4 py-8 text-center text-slate-400">No hay reservas registradas.</td>
                  </tr>
                ` : reservations.slice(-5).reverse().map(res => `
                  <tr class="hover:bg-slate-50/40 transition-colors">
                    <td class="px-4 py-3 font-semibold text-slate-800">${res.user ? res.user.name : `ID Usuario: ${res.userId}`}</td>
                    <td class="px-4 py-3 text-slate-600">
                      <span class="font-medium">${res.workspace ? res.workspace.name : `ID Espacio: ${res.workspaceId}`}</span>
                      <span class="block text-[10px] text-slate-400">${res.workspace ? (typeTranslations[res.workspace.type] || res.workspace.type) : ''}</span>
                    </td>
                    <td class="px-4 py-3 text-slate-500 font-medium">
                      <div>${formatDate(res.date)}</div>
                      <div class="text-xs font-mono text-slate-400">${res.startTime} - ${res.endTime}</div>
                    </td>
                    <td class="px-4 py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadgeClasses(res.status)}">
                        ${statusTranslations[res.status] || res.status}
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
    showToast('Error al cargar estadísticas.', 'error');
    console.error(err);
    container.innerHTML = `
      <div class="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <svg class="w-12 h-12 text-rose-500 mx-auto mb-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        <h3 class="text-lg font-bold text-slate-800 mb-1">Error al cargar estadísticas</h3>
        <p class="text-sm text-slate-500 mb-4">Asegúrese de que el servidor API json-server esté corriendo en el puerto 3000.</p>
        <button id="retry-dashboard" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer">Reintentar</button>
      </div>
    `;
    container.querySelector('#retry-dashboard').addEventListener('click', () => renderDashboard(container));
  }
}

function getStatusBadgeClasses(status) {
  switch (status) {
    case 'Approved': return 'bg-emerald-100 text-emerald-800';
    case 'Pending': return 'bg-amber-100 text-amber-800';
    case 'Rejected': return 'bg-rose-100 text-rose-800';
    default: return 'bg-slate-100 text-slate-800';
  }
}
