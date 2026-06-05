import { apiFetchReservations, apiFetchMovies, apiFetchUsers } from '../services/api.js';
import { showToast } from '../components/Toast.js';
import { formatDate } from '../utils/helpers.js';

/**
 * DIBUJAR PANEL DE CONTROL (DASHBOARD):
 * Muestra métricas clave sobre ventas de boletos, estados de reserva y la película más popular.
 */
export async function renderDashboard(container) {
  // Spinner de carga inicial
  container.innerHTML = `
    <div class="flex items-center justify-center min-h-[300px]">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
    </div>
  `;

  try {
    // 1. Obtenemos reservas, películas y usuarios en paralelo
    const [reservations, movies, users] = await Promise.all([
      apiFetchReservations(),
      apiFetchMovies(),
      apiFetchUsers()
    ]);

    // 2. Calculamos estadísticas básicas con bucles sencillos
    let totalTickets = 0;
    let confirmedCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;

    for (const res of reservations) {
      if (res.estado === 'Confirmada') {
        confirmedCount++;
        totalTickets += Number(res.cantidad_entradas) || 0;
      } else if (res.estado === 'Pendiente') {
        pendingCount++;
        totalTickets += Number(res.cantidad_entradas) || 0;
      } else if (res.estado === 'Cancelada') {
        cancelledCount++;
      }
    }

    // 3. Calculamos cuál es la película más vendida (taquillera)
    const movieCounter = {}; // Guardará pares de { pelicula_id: cantidad_boletos }
    for (const res of reservations) {
      // Solo contamos reservas confirmadas o pendientes (las canceladas no suman)
      if (res.estado !== 'Cancelada' && res.funcion_seleccionada) {
        const movieId = res.funcion_seleccionada.pelicula_id;
        const quantity = Number(res.cantidad_entradas) || 0;

        if (!movieCounter[movieId]) {
          movieCounter[movieId] = 0;
        }
        movieCounter[movieId] += quantity;
      }
    }

    // Buscamos cuál ID de película acumuló la mayor cantidad de boletos
    let mostPopularMovie = null;
    let maxTicketsSold = 0;
    const movieIds = Object.keys(movieCounter);

    for (const mId of movieIds) {
      const ticketsSold = movieCounter[mId];
      if (ticketsSold > maxTicketsSold) {
        maxTicketsSold = ticketsSold;
        // Buscamos la información de la película correspondiente en la lista de películas
        mostPopularMovie = movies.find(m => Number(m.id) === Number(mId));
      }
    }

    // 4. Dibujamos la interfaz del panel
    container.innerHTML = `
      <div class="space-y-6 animate-fade-in">
        <!-- Encabezado -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Panel de Control de Taquilla</h2>
            <p class="text-sm text-slate-500 font-medium">Estadísticas en tiempo real de funciones, salas y venta de boletos</p>
          </div>
          <div class="text-xs text-slate-400 font-mono bg-white border border-slate-100 rounded-lg px-3 py-2 shadow-sm self-start">
            Actualizado: ${new Date().toLocaleTimeString()}
          </div>
        </div>

        <!-- Tarjetas de Métricas -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <!-- Total Boletos Vendidos -->
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
            <div class="bg-indigo-50 text-indigo-600 p-4 rounded-xl text-xl">
              🎟️
            </div>
            <div>
              <span class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Entradas Vendidas</span>
              <span class="text-2xl font-bold text-slate-900">${totalTickets}</span>
            </div>
          </div>

          <!-- Reservas Confirmadas -->
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
            <div class="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-xl">
              ✅
            </div>
            <div>
              <span class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Confirmadas</span>
              <span class="text-2xl font-bold text-emerald-600">${confirmedCount}</span>
            </div>
          </div>

          <!-- Reservas Pendientes -->
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
            <div class="bg-amber-50 text-amber-600 p-4 rounded-xl text-xl">
              ⏳
            </div>
            <div>
              <span class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Pendientes</span>
              <span class="text-2xl font-bold text-amber-600">${pendingCount}</span>
            </div>
          </div>

          <!-- Películas Activas en Cartelera -->
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
            <div class="bg-sky-50 text-sky-600 p-4 rounded-xl text-xl">
              🎬
            </div>
            <div>
              <span class="block text-xs font-semibold uppercase tracking-wider text-slate-400">En Cartelera</span>
              <span class="text-2xl font-bold text-sky-600">${movies.length} película(s)</span>
            </div>
          </div>
        </div>

        <!-- Fila de Información de Películas -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Mostrar Película Más Vendida -->
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between lg:col-span-1">
            <div>
              <h3 class="text-lg font-bold text-slate-800 mb-2">Película Más Taquillera</h3>
              <p class="text-xs text-slate-400 mb-6">Filme con la mayor cantidad de entradas reservadas en el sistema</p>
              
              ${mostPopularMovie ? `
                <div class="space-y-4">
                  <div class="bg-gradient-to-tr from-indigo-500 to-indigo-700 rounded-xl p-5 text-white shadow-lg">
                    <div class="text-[10px] font-extrabold uppercase tracking-widest text-indigo-200 mb-1">
                      Sala: ${mostPopularMovie.sala}
                    </div>
                    <h4 class="text-xl font-bold mb-3 truncate">${mostPopularMovie.pelicula}</h4>
                    
                    <div class="flex flex-col gap-2 text-xs text-indigo-100">
                      <div>
                        📅 Próxima Función: ${formatDate(mostPopularMovie.fecha)} - ${mostPopularMovie.hora} HS
                      </div>
                      <div>
                        🎟️ Boletos vendidos: ${maxTicketsSold} entradas
                      </div>
                    </div>
                  </div>
                </div>
              ` : `
                <p class="text-sm text-slate-500 italic">No hay suficientes datos de reservas activas.</p>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error(error);
    showToast('Error al cargar la información del panel de control', 'error');
    container.innerHTML = `
      <div class="p-6 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-center font-medium">
        No se pudieron procesar las estadísticas de taquilla. Verifique la conexión con el servidor.
      </div>
    `;
  }
}
