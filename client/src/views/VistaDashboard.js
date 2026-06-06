import { apiFetchReservations, apiFetchMovies, apiFetchUsers, apiFetchSalas } from '../servicios/api.js';
import { showToast } from '../components/Notificaciones.js';
import { formatDate } from '../utils/utilidades.js';
import { getMoviePoster } from './VistaPeliculas.js';

/**
 * DIBUJAR PANEL DE CONTROL (DASHBOARD):
 * Muestra estadísticas en tiempo real sobre ventas, ranking de películas, aforo de salas y registro de transacciones.
 */
export async function renderDashboard(container) {
  // Spinner de carga inicial
  container.innerHTML = `
    <div class="flex items-center justify-center min-h-[300px]">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
    </div>
  `;

  try {
    // 1. Obtenemos reservas, películas, usuarios y salas en paralelo
    const [reservations, movies, users, salas] = await Promise.all([
      apiFetchReservations(),
      apiFetchMovies(),
      apiFetchUsers(),
      apiFetchSalas()
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

    // 3. Agrupar ventas por película para el ranking (agrupando por título de película)
    const movieCounter = {};
    
    // Inicializar películas activas en cartelera con 0 ventas para tener un top completo
    for (const m of movies) {
      if (m.estado !== 'Cancelada') {
        movieCounter[m.pelicula] = 0;
      }
    }

    // Acumular las ventas de las reservas que no estén canceladas
    for (const res of reservations) {
      if (res.estado !== 'Cancelada' && res.funcion_seleccionada) {
        const title = res.funcion_seleccionada.titulo;
        const quantity = Number(res.cantidad_entradas) || 0;

        if (movieCounter[title] === undefined) {
          movieCounter[title] = 0;
        }
        movieCounter[title] += quantity;
      }
    }

    // Convertir el contador a un arreglo para ordenar y hacer el ranking
    const rankingArray = [];
    for (const title of Object.keys(movieCounter)) {
      // Buscamos una función activa para obtener la imagen y la sala asociadas
      const movieObj = movies.find(m => m.pelicula === title && m.estado !== 'Cancelada') || movies.find(m => m.pelicula === title);
      rankingArray.push({
        title: title,
        tickets: movieCounter[title],
        poster: getMoviePoster(title, movieObj ? movieObj.imagen : undefined),
        sala: movieObj ? movieObj.sala : 'N/A'
      });
    }

    // Ordenar de mayor a menor ventas
    rankingArray.sort((a, b) => b.tickets - a.tickets);

    // Obtener la película más popular (Mejor vendida, requiere al menos 1 venta)
    const bestSeller = rankingArray[0] && rankingArray[0].tickets > 0 ? rankingArray[0] : null;

    // 4. Calcular ocupación de aforo por Sala (Sala uno, Sala dos...)
    const occupancyBySala = [];
    for (const s of salas) {
      let seatsBooked = 0;
      // Contamos boletos de funciones programadas en esta sala (excluyendo canceladas)
      for (const m of movies) {
        if (Number(m.salaId) === Number(s.id) && m.estado !== 'Cancelada') {
          const sold = s.capacidad - m.cupos_disponibles;
          if (sold > 0) {
            seatsBooked += sold;
          }
        }
      }
      
      const percentage = s.capacidad > 0 ? Math.min(100, Math.round((seatsBooked / s.capacidad) * 100)) : 0;
      
      occupancyBySala.push({
        name: s.nombre,
        tipo: s.tipo,
        capacity: s.capacidad,
        booked: seatsBooked,
        percentage
      });
    }

    // 5. Historial reciente de reservas (últimas 5 creadas)
    const sortedReservations = [...reservations];
    // Ordenar por ID descendente
    sortedReservations.sort((a, b) => Number(b.id) - Number(a.id));
    const recentReservations = sortedReservations.slice(0, 5);

    // 6. Dibujamos la interfaz del panel
    container.innerHTML = `
      <div class="space-y-6 animate-fade-in text-slate-100">
        
        <!-- Encabezado -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl md:text-3xl font-extrabold tracking-tight text-white">Panel de Control & Estadísticas</h2>
            <p class="text-xs sm:text-sm text-slate-400 font-medium">Monitorea la taquilla, aforo de salas y ranking de películas de CineRiwi</p>
          </div>
          <div class="text-[11px] text-indigo-300 font-bold font-mono bg-indigo-950/60 border border-indigo-900/50 rounded-xl px-4 py-2 shadow-lg self-start">
            ⚡ EN VIVO - REFRESH: ${new Date().toLocaleTimeString()}
          </div>
        </div>

        <!-- Tarjetas de Métricas Principales (Grid 4 col) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Total Boletos Vendidos -->
          <div class="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 shadow-2xl backdrop-blur-md flex items-center gap-4">
            <div class="bg-indigo-500/10 text-indigo-400 p-3.5 rounded-xl text-xl shrink-0">🎟️</div>
            <div>
              <span class="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Entradas Vendidas</span>
              <span class="text-2xl font-black text-white">${totalTickets} boletos</span>
            </div>
          </div>

          <!-- Películas Activas en Cartelera -->
          <div class="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 shadow-2xl backdrop-blur-md flex items-center gap-4">
            <div class="bg-sky-500/10 text-sky-400 p-3.5 rounded-xl text-xl shrink-0">🎬</div>
            <div>
              <span class="block text-[10px] font-bold uppercase tracking-widest text-slate-400">En Cartelera</span>
              <span class="text-2xl font-black text-white">${movies.length} funciones</span>
            </div>
          </div>

          <!-- Total Usuarios Registrados -->
          <div class="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 shadow-2xl backdrop-blur-md flex items-center gap-4">
            <div class="bg-purple-500/10 text-purple-400 p-3.5 rounded-xl text-xl shrink-0">👥</div>
            <div>
              <span class="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Usuarios Activos</span>
              <span class="text-2xl font-black text-white">${users.length} cuentas</span>
            </div>
          </div>

          <!-- Relación Confirmadas vs Pendientes -->
          <div class="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 shadow-2xl backdrop-blur-md flex items-center gap-4">
            <div class="bg-emerald-500/10 text-emerald-400 p-3.5 rounded-xl text-xl shrink-0">✅</div>
            <div>
              <span class="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Confirmadas / Pend.</span>
              <span class="text-2xl font-black text-white">${confirmedCount} <span class="text-xs text-slate-400 font-medium">/ ${pendingCount}</span></span>
            </div>
          </div>
        </div>

        <!-- Fila de Detalles: Ranking, Ocupación y Actividad -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- LADO IZQUIERDO: Película Más Taquillera (Mejor Vendida) -->
          <div class="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 shadow-2xl backdrop-blur-md flex flex-col justify-between lg:col-span-1">
            <div>
              <h3 class="text-base font-bold text-white mb-1">Película Más Vendida</h3>
              <p class="text-[11px] text-slate-400 mb-4">Filme líder en reserva de boletos de CineRiwi</p>
              
              ${bestSeller ? `
                <div class="relative rounded-2xl overflow-hidden group border border-slate-800 shadow-xl bg-slate-950">
                  <!-- Imagen de portada de película -->
                  <div class="h-64 overflow-hidden relative">
                    <img src="${bestSeller.poster}" alt="${bestSeller.title}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                    
                    <span class="absolute top-3 right-3 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg">
                      🔥 TOP 1 TAQUILLA
                    </span>
                  </div>

                  <!-- Datos de la película -->
                  <div class="p-4 space-y-3 relative z-10 -mt-10">
                    <div>
                      <span class="text-[9px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-950/60 border border-indigo-900/40 px-2 py-0.5 rounded-md">
                        ${bestSeller.sala}
                      </span>
                      <h4 class="text-lg font-bold text-white mt-1 truncate">${bestSeller.title}</h4>
                    </div>

                    <div class="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-slate-800/60">
                      <span>Boletos Vendidos:</span>
                      <span class="font-bold text-indigo-400">${bestSeller.tickets} entradas</span>
                    </div>
                  </div>
                </div>
              ` : `
                <div class="text-center py-12 text-slate-500 italic text-sm">No hay suficientes datos de reservas para calcular el ranking.</div>
              `}
            </div>
          </div>

          <!-- LADO DERECHO: Ranking de Películas & Aforo de Salas -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Bloque: Ranking de Películas (Cartelera Taquillera) -->
            <div class="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 shadow-2xl backdrop-blur-md space-y-4">
              <div>
                <h3 class="text-base font-bold text-white mb-1">Cartelera Taquillera</h3>
                <p class="text-[11px] text-slate-400">Venta acumulada de boletos en las películas activas</p>
              </div>

              <div class="space-y-4">
                ${rankingArray.length > 0 ? rankingArray.slice(0, 3).map((item, index) => {
                  const maxTickets = bestSeller && bestSeller.tickets > 0 ? bestSeller.tickets : 1;
                  const percentage = Math.round((item.tickets / maxTickets) * 100);
                  
                  // Colores de barras
                  const colors = ['bg-indigo-500', 'bg-sky-500', 'bg-purple-500'];
                  const barColor = colors[index] || 'bg-slate-500';

                  return `
                    <div class="space-y-1.5">
                      <div class="flex justify-between items-center text-xs">
                        <div class="flex items-center gap-2 font-semibold">
                          <span class="text-indigo-400">#${index + 1}</span>
                          <span class="text-slate-200 truncate max-w-[200px]">${item.title}</span>
                          <span class="text-[9px] text-slate-500 italic">(${item.sala})</span>
                        </div>
                        <span class="font-bold text-slate-300">${item.tickets} entradas</span>
                      </div>
                      <div class="w-full bg-slate-900 rounded-full h-2">
                        <div class="${barColor} h-2 rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
                      </div>
                    </div>
                  `;
                }).join('') : `
                  <div class="text-center py-4 text-slate-500 italic text-xs">No hay películas registradas en taquilla.</div>
                `}
              </div>
            </div>

            <!-- Bloque: Aforo de Salas -->
            <div class="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 shadow-2xl backdrop-blur-md space-y-4">
              <div>
                <h3 class="text-base font-bold text-white mb-1">Ocupación por Salas</h3>
                <p class="text-[11px] text-slate-400">Monitoreo de asientos reservados respecto a la capacidad de cada sala</p>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                ${occupancyBySala.length > 0 ? occupancyBySala.map(sala => {
                  const isFull = sala.percentage >= 80;
                  const percentColor = isFull ? 'text-rose-400' : 'text-emerald-400';
                  const progressColor = isFull ? 'bg-rose-500' : 'bg-emerald-500';

                  return `
                    <div class="bg-slate-950/40 p-4 rounded-xl border border-slate-800/40 flex flex-col justify-between gap-2">
                      <div class="flex justify-between items-start">
                        <div>
                          <span class="font-bold text-slate-200 block text-xs">${sala.name}</span>
                          <span class="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">${sala.tipo}</span>
                        </div>
                        <span class="text-xs font-extrabold ${percentColor}">${sala.percentage}% ocupado</span>
                      </div>
                      
                      <div class="space-y-1">
                        <div class="w-full bg-slate-900 rounded-full h-1.5">
                          <div class="${progressColor} h-1.5 rounded-full" style="width: ${sala.percentage}%"></div>
                        </div>
                        <span class="text-[9px] text-slate-500 block font-medium">Asientos: ${sala.booked} de ${sala.capacity}</span>
                      </div>
                    </div>
                  `;
                }).join('') : `
                  <div class="text-center py-4 text-slate-500 italic text-xs">No hay salas de cine registradas.</div>
                `}
              </div>
            </div>
          </div>
        </div>

        <!-- SECCIÓN: Historial de Reservas Recientes -->
        <div class="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 shadow-2xl backdrop-blur-md space-y-4">
          <div>
            <h3 class="text-base font-bold text-white mb-1">Últimas Reservas en Sistema</h3>
            <p class="text-[11px] text-slate-400">Lista detallada de las transacciones procesadas recientemente en taquilla</p>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-800">
              <thead>
                <tr class="text-left text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-950/30">
                  <th class="px-4 py-3">Transacción</th>
                  <th class="px-4 py-3">Cliente</th>
                  <th class="px-4 py-3">Película</th>
                  <th class="px-4 py-3">Entradas</th>
                  <th class="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800 text-xs text-slate-300">
                ${recentReservations.length > 0 ? recentReservations.map(res => {
                  let badgeClass = '';
                  if (res.estado === 'Confirmada') {
                    badgeClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                  } else if (res.estado === 'Pendiente') {
                    badgeClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                  } else {
                    badgeClass = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
                  }

                  return `
                    <tr class="hover:bg-slate-800/10 transition-colors">
                      <td class="px-4 py-3 font-mono font-bold text-slate-500">#${res.id}</td>
                      <td class="px-4 py-3 font-semibold text-slate-200">${res.usuario}</td>
                      <td class="px-4 py-3">${res.funcion_seleccionada ? res.funcion_seleccionada.titulo : 'N/A'}</td>
                      <td class="px-4 py-3 font-extrabold text-indigo-400">${res.cantidad_entradas} boletos</td>
                      <td class="px-4 py-3">
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${badgeClass}">
                          ${res.estado}
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('') : `
                  <tr>
                    <td colspan="5" class="px-4 py-8 text-center text-slate-500 italic">No hay registros de reservas recientes.</td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;

  } catch (error) {
    console.error(error);
    showToast('Error al cargar la información del panel de control', 'error');
    container.innerHTML = `
      <div class="p-6 bg-rose-950/40 border border-rose-900/50 text-rose-400 rounded-2xl text-center font-semibold text-sm">
        No se pudieron procesar las estadísticas de taquilla. Verifique la conexión con el servidor.
      </div>
    `;
  }
}
