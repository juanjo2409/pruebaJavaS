import { 
  apiFetchReservations, 
  apiFetchMovies, 
  apiCreateReservation, 
  apiUpdateReservation, 
  apiDeleteReservation,
  apiUpdateMovie
} from '../services/api.js';
import { getCurrentUser } from '../guards/auth.js';
import { showToast } from '../components/Toast.js';
import { formatDate, hasFunctionStarted } from '../utils/helpers.js';
import { getMoviePoster } from './MoviesView.js';

// Variables para mantener los datos en memoria en este archivo
let currentUser = null;
let allReservations = []; 
let moviesList = [];  

/**
 * 1. FUNCIÓN PRINCIPAL: Carga el tablero inicial de reservas.
 */
export async function renderReservations(container) {
  currentUser = getCurrentUser();
  if (!currentUser) return;
  
  await loadReservationsBoard(container);

  // Leer parámetros de película preseleccionada desde la URL (por ejemplo, al venir desde cartelera)
  const hash = window.location.hash;
  const queryString = hash.includes('?') ? hash.split('?')[1] : '';
  const params = new URLSearchParams(queryString);
  const preselectedMovieId = params.get('movieId');
  
  if (preselectedMovieId) {
    // Limpiamos los parámetros para evitar reabrir el modal al refrescar
    window.history.replaceState(null, '', window.location.pathname + window.location.search + '#/reservations');
    openBookingModal(container, Number(preselectedMovieId));
  }
}

/**
 * 2. CARGAR TABLERO: Descarga los datos de reservas y cartelera para dibujarlos.
 */
async function loadReservationsBoard(container) {
  container.innerHTML = `
    <div class="flex items-center justify-center min-h-[300px]">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
    </div>
  `;

  try {
    const [resList, movieList] = await Promise.all([
      apiFetchReservations(),
      apiFetchMovies()
    ]);

    allReservations = resList;
    moviesList = movieList;

    const isAdmin = currentUser.role === 'admin';
    // Si es admin ve todas las reservas. Si es usuario común, solo las suyas.
    const visibleReservations = [];
    for (const r of allReservations) {
      if (isAdmin || r.usuario === currentUser.name) {
        visibleReservations.push(r);
      }
    }

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in">
        <!-- Encabezado de la Página -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              ${isAdmin ? 'Gestión de Reservas Globales' : 'Mis Entradas Compradas'}
            </h2>
            <p class="text-sm text-slate-500 font-medium">
              ${isAdmin ? 'Confirme o cancele las solicitudes de taquilla de los clientes' : 'Historial de tus boletos y solicitudes de reserva'}
            </p>
          </div>
          <button id="book-movie-btn" class="inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md transition-all duration-200 cursor-pointer gap-2">
            🎟️ Reservar Boletos
          </button>
        </div>

        <!-- Filtros Reactivos -->
        <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Buscar Película</label>
            <input id="filter-search" type="text" class="block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none" placeholder="e.g. El Padrino">
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sala de Cine</label>
            <select id="filter-sala" class="block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none">
              <option value="All">Todas las Salas</option>
              <option value="Sala Uno">Sala Uno</option>
              <option value="Sala Dos">Sala Dos</option>
              <option value="Sala Tres">Sala Tres</option>
              <option value="Sala Cuatro">Sala Cuatro</option>
            </select>
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Estado de Reserva</label>
            <select id="filter-status" class="block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none">
              <option value="All">Todos los Estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Confirmada">Confirmada</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha de Reserva</label>
            <input id="filter-date" type="date" class="block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none">
          </div>
        </div>

        <!-- Contenedor del Listado (Grid de Tarjetas) -->
        <div id="reservations-list-container" class="grid grid-cols-1 xl:grid-cols-2 gap-5"></div>
      </div>

      <div id="booking-modal-container"></div>
    `;

    const searchInput = container.querySelector('#filter-search');
    const salaSelect = container.querySelector('#filter-sala');
    const statusSelect = container.querySelector('#filter-status');
    const dateInput = container.querySelector('#filter-date');
    const listContainer = container.querySelector('#reservations-list-container');

    // Función que filtra las reservas en tiempo real en la pantalla
    const runFiltering = () => {
      const searchVal = searchInput.value.toLowerCase();
      const salaVal = salaSelect.value;
      const statusVal = statusSelect.value;
      const dateVal = dateInput.value;

      const filtered = [];
      for (const res of visibleReservations) {
        // Filtro por nombre de película
        const movieTitle = res.funcion_seleccionada ? res.funcion_seleccionada.titulo.toLowerCase() : '';
        if (searchVal && !movieTitle.includes(searchVal)) {
          continue;
        }

        // Obtener datos complementarios de la función
        const movieData = moviesList.find(m => m.id === res.funcion_seleccionada?.pelicula_id);
        const salaName = movieData ? movieData.sala : '';
        
        // Filtro por sala
        if (salaVal !== 'All' && salaName !== salaVal) {
          continue;
        }

        // Filtro por estado
        if (statusVal !== 'All' && res.estado !== statusVal) {
          continue;
        }

        // Filtro por fecha de reserva
        if (dateVal && res.fecha_reserva !== dateVal) {
          continue;
        }

        filtered.push(res);
      }

      // Ordenar las reservas de más reciente a más antigua
      filtered.sort((a, b) => b.id - a.id);
      renderCards(filtered, listContainer, container);
    };

    // Asignar los filtros reactivos
    searchInput.addEventListener('input', runFiltering);
    salaSelect.addEventListener('change', runFiltering);
    statusSelect.addEventListener('change', runFiltering);
    dateInput.addEventListener('change', runFiltering);

    container.querySelector('#book-movie-btn').addEventListener('click', () => openBookingModal(container));

    runFiltering();

  } catch (err) {
    showToast('Error al cargar reservas.', 'error');
    console.error(err);
  }
}

/**
 * 3. RENDERIZAR TARJETAS: Genera las tarjetas de cada reserva.
 */
function renderCards(reservations, listContainer, boardContainer) {
  const isAdmin = currentUser.role === 'admin';

  if (reservations.length === 0) {
    listContainer.innerHTML = `
      <div class="col-span-full bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center">
        <h3 class="text-base font-bold text-slate-700">No se encontraron boletos</h3>
        <p class="text-xs text-slate-400 mt-1">Modifica los filtros o procesa una nueva compra.</p>
      </div>
    `;
    return;
  }

  let cardsHtml = '';

  for (const res of reservations) {
    const movieData = moviesList.find(m => m.id === res.funcion_seleccionada?.pelicula_id);
    const badgeColor = res.estado === 'Confirmada' 
      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
      : (res.estado === 'Cancelada' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-amber-50 text-amber-700 border border-amber-100');

    const hasStarted = movieData ? hasFunctionStarted(movieData.fecha, movieData.hora) : false;

    // Generar botones de acción para cada reserva
    let actionButtons = '';
    
    if (isAdmin) {
      // El Administrador tiene controles totales
      let adminActions = '';
      if (res.estado === 'Pendiente') {
        adminActions = `
          <button data-id="${res.id}" data-action="Confirmada" class="btn-status-change bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer">Confirmar</button>
          <button data-id="${res.id}" data-action="Cancelada" class="btn-status-change bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer">Rechazar</button>
        `;
      }
      actionButtons = `
        <div class="flex flex-wrap gap-2 w-full justify-between items-center">
          <div class="flex gap-2">
            ${adminActions}
          </div>
          <div class="flex gap-2 ml-auto">
            <button data-id="${res.id}" class="btn-edit-res bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-all border border-indigo-100 cursor-pointer">Editar</button>
            <button data-id="${res.id}" class="btn-delete-res text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-all text-xs font-semibold cursor-pointer">Eliminar</button>
          </div>
        </div>
      `;
    } else {
      // El Cliente común tiene opciones de cancelar y modificar si la función no ha empezado
      if (res.estado === 'Cancelada') {
        actionButtons = `<span class="text-xs text-rose-500 font-semibold italic self-center">Reserva Cancelada</span>`;
      } else if (hasStarted) {
        actionButtons = `<span class="text-xs text-slate-400 font-semibold italic self-center">Función Finalizada / En curso</span>`;
      } else {
        actionButtons = `
          <div class="flex gap-2">
            <button data-id="${res.id}" class="btn-edit-res bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-all border border-indigo-100 cursor-pointer">Modificar</button>
            <button data-id="${res.id}" class="btn-cancel-user bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer">Cancelar Compra</button>
          </div>
        `;
      }
    }

    const posterUrl = getMoviePoster(res.funcion_seleccionada?.titulo, movieData?.imagen);

    cardsHtml += `
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col sm:flex-row hover:shadow-md transition-all">
        <!-- Poster miniatura a la izquierda -->
        <div class="sm:w-32 h-40 sm:h-auto bg-slate-900 overflow-hidden shrink-0">
          <img src="${posterUrl}" alt="${res.funcion_seleccionada?.titulo || 'Película'}" class="w-full h-full object-cover opacity-90" />
        </div>

        <div class="p-5 flex-grow flex flex-col justify-between space-y-4">
          <div class="flex justify-between items-start gap-4">
            <div>
              <span class="text-[9px] font-mono text-slate-400 block">RESERVA #${res.id}</span>
              <h4 class="text-base font-bold text-slate-900 leading-tight mt-0.5">${res.funcion_seleccionada?.titulo || 'Película'}</h4>
              <p class="text-xs text-slate-500 mt-0.5">Cliente: <strong class="text-slate-800">${res.usuario}</strong></p>
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badgeColor}">
              ${res.estado}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl text-xs font-medium">
            <div>
              <span class="text-slate-400 block text-[9px] uppercase">Sala de Cine</span>
              <span class="text-slate-700 font-bold">${movieData ? `${movieData.sala}` : 'N/A'}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[9px] uppercase">Entradas</span>
              <span class="text-indigo-600 font-extrabold text-sm">${res.cantidad_entradas} Boletos</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[9px] uppercase">Fecha de Reserva</span>
              <span class="text-slate-700">${formatDate(res.fecha_reserva)}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[9px] uppercase">Horario Función</span>
              <span class="text-slate-700 font-semibold">${movieData ? `${movieData.hora} HS - ${formatDate(movieData.fecha)}` : 'N/A'}</span>
            </div>
          </div>

          <div class="flex justify-end gap-2 border-t border-slate-50 pt-3">
            ${actionButtons}
          </div>
        </div>
      </div>
    `;
  }

  listContainer.innerHTML = cardsHtml;
  setupCardEvents(boardContainer);
}

/**
 * 4. EVENTOS DE LAS TARJETAS: Acciones de confirmar, cancelar, eliminar o editar.
 */
function setupCardEvents(boardContainer) {
  // A. Confirmar o rechazar reserva (Sólo Admin)
  boardContainer.querySelectorAll('.btn-status-change').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const resId = Number(e.currentTarget.dataset.id);
      const action = e.currentTarget.dataset.action;
      
      const reservation = allReservations.find(r => r.id === resId);
      if (!reservation) return;

      const movie = moviesList.find(m => m.id === reservation.funcion_seleccionada?.pelicula_id);

      try {
        if (action === 'Cancelada' && movie) {
          // Si el admin la cancela, devolvemos los asientos a la película
          movie.cupos_disponibles += reservation.cantidad_entradas;
          await apiUpdateMovie(movie.id, movie);
        }

        await apiUpdateReservation(resId, {
          ...reservation,
          estado: action
        });

        showToast(`Reserva ${action === 'Confirmada' ? 'confirmada' : 'rechazada'} con éxito`, 'success');
        loadReservationsBoard(boardContainer);
      } catch (err) {
        console.error(err);
        showToast('Error al actualizar el estado', 'error');
      }
    });
  });

  // B. Cancelar compra de boletos (Cliente)
  boardContainer.querySelectorAll('.btn-cancel-user').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const resId = Number(e.currentTarget.dataset.id);
      const reservation = allReservations.find(r => r.id === resId);
      if (!reservation) return;

      const movie = moviesList.find(m => m.id === reservation.funcion_seleccionada?.pelicula_id);

      if (movie && hasFunctionStarted(movie.fecha, movie.hora)) {
        showToast('La función ya comenzó. No es posible cancelar.', 'error');
        return;
      }

      Swal.fire({
        title: '¿Cancelar esta compra/reserva?',
        text: 'Los cupos se liberarán inmediatamente para otros usuarios.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, cancelar compra',
        cancelButtonText: 'Mantener reserva'
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            if (movie) {
              movie.cupos_disponibles += reservation.cantidad_entradas;
              await apiUpdateMovie(movie.id, movie);
            }

            await apiUpdateReservation(resId, {
              ...reservation,
              estado: 'Cancelada'
            });

            showToast('Reserva cancelada correctamente', 'success');
            loadReservationsBoard(boardContainer);
          } catch (err) {
            console.error(err);
            showToast('Error al cancelar', 'error');
          }
        }
      });
    });
  });

  // C. Eliminar registro físico de reserva (Sólo Admin)
  boardContainer.querySelectorAll('.btn-delete-res').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const resId = Number(e.currentTarget.dataset.id);
      const reservation = allReservations.find(r => r.id === resId);
      if (!reservation) return;

      const movie = moviesList.find(m => m.id === reservation.funcion_seleccionada?.pelicula_id);

      Swal.fire({
        title: '¿Eliminar registro de la reserva?',
        text: 'Esta acción borrará de forma permanente el registro del sistema.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, borrar definitivamente',
        cancelButtonText: 'Conservar'
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            // Si la reserva borrada estaba activa, devolvemos los asientos
            if (reservation.estado !== 'Cancelada' && movie) {
              movie.cupos_disponibles += reservation.cantidad_entradas;
              await apiUpdateMovie(movie.id, movie);
            }

            await apiDeleteReservation(resId);
            showToast('Registro eliminado con éxito', 'success');
            loadReservationsBoard(boardContainer);
          } catch (err) {
            console.error(err);
            showToast('Error al eliminar', 'error');
          }
        }
      });
    });
  });

  // D. Modificar/Editar Reserva (Abre el modal de edición)
  boardContainer.querySelectorAll('.btn-edit-res').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const resId = Number(e.currentTarget.dataset.id);
      openEditBookingModal(boardContainer, resId);
    });
  });
}

/**
 * 5. MODAL PARA CREAR RESERVA
 */
function openBookingModal(container, preselectedMovieId = null) {
  const modalContainer = container.querySelector('#booking-modal-container');
  const activeMovies = moviesList.filter(m => m.estado === 'Activa');

  if (activeMovies.length === 0) {
    showToast('No hay películas activas para reservar.', 'warning');
    return;
  }

  modalContainer.innerHTML = `
    <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
        <h3 class="text-xl font-bold text-slate-900">Reservar Entradas</h3>
        <form id="form-create-booking" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Película / Función</label>
            <select id="book-movie" class="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
              ${activeMovies.map(m => `<option value="${m.id}" ${preselectedMovieId === m.id ? 'selected' : ''}>${m.pelicula} (${m.sala} - Hora: ${m.hora} - Disp: ${m.cupos_disponibles})</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Cantidad de Boletos</label>
            <input type="number" id="book-quantity" min="1" value="1" required class="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div class="flex justify-end gap-2 pt-2 border-t">
            <button type="button" id="booking-close-btn" class="px-4 py-2 text-sm font-semibold text-slate-500 cursor-pointer">Cerrar</button>
            <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold cursor-pointer">Confirmar Compra</button>
          </div>
        </form>
      </div>
    </div>
  `;

  modalContainer.querySelector('#booking-close-btn').addEventListener('click', () => modalContainer.innerHTML = '');

  modalContainer.querySelector('#form-create-booking').addEventListener('submit', async (e) => {
    e.preventDefault();
    const movieId = Number(document.getElementById('book-movie').value);
    const quantity = Number(document.getElementById('book-quantity').value);

    const movie = moviesList.find(m => m.id === movieId);
    if (!movie) return;

    if (hasFunctionStarted(movie.fecha, movie.hora)) {
      showToast('La función ya comenzó o finalizó.', 'error');
      return;
    }

    if (quantity > movie.cupos_disponibles) {
      showToast(`No hay suficientes asientos disponibles. Quedan ${movie.cupos_disponibles} cupos.`, 'error');
      return;
    }

    const reservation = {
      usuario: currentUser.name,
      funcion_seleccionada: {
        pelicula_id: movie.id,
        titulo: movie.pelicula
      },
      cantidad_entradas: quantity,
      fecha_reserva: new Date().toISOString().split('T')[0],
      estado: currentUser.role === 'admin' ? 'Confirmada' : 'Pendiente'
    };

    try {
      // Actualizar cupos en la película
      movie.cupos_disponibles -= quantity;
      await apiUpdateMovie(movie.id, movie);

      // Crear reserva
      await apiCreateReservation(reservation);

      showToast('¡Reserva creada con éxito!', 'success');
      modalContainer.innerHTML = '';
      loadReservationsBoard(container);
    } catch (err) {
      console.error(err);
      showToast('Error al guardar la reserva', 'error');
    }
  });
}

/**
 * 6. MODAL PARA MODIFICAR/EDITAR RESERVA EXISTENTE
 */
function openEditBookingModal(container, reservationId) {
  const modalContainer = container.querySelector('#booking-modal-container');
  const reservation = allReservations.find(r => r.id === reservationId);
  if (!reservation) return;

  const movie = moviesList.find(m => m.id === reservation.funcion_seleccionada?.pelicula_id);
  const activeMovies = moviesList.filter(m => m.estado === 'Activa' || m.id === movie?.id);
  const isAdmin = currentUser.role === 'admin';

  modalContainer.innerHTML = `
    <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
        <h3 class="text-xl font-bold text-slate-900">Modificar Reserva</h3>
        <form id="form-edit-booking" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Película / Función</label>
            <select id="edit-book-movie" ${!isAdmin ? 'disabled' : ''} class="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-75">
              ${activeMovies.map(m => `<option value="${m.id}" ${movie?.id === m.id ? 'selected' : ''}>${m.pelicula} (${m.sala} - Disp: ${m.id === movie?.id ? m.cupos_disponibles + reservation.cantidad_entradas : m.cupos_disponibles})</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Cantidad de Boletos</label>
            <input type="number" id="edit-book-quantity" min="1" value="${reservation.cantidad_entradas}" required class="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          ${isAdmin ? `
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Estado de Reserva</label>
              <select id="edit-book-status" class="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                <option value="Pendiente" ${reservation.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                <option value="Confirmada" ${reservation.estado === 'Confirmada' ? 'selected' : ''}>Confirmada</option>
                <option value="Cancelada" ${reservation.estado === 'Cancelada' ? 'selected' : ''}>Cancelada</option>
              </select>
            </div>
          ` : ''}
          <div class="flex justify-end gap-2 pt-2 border-t">
            <button type="button" id="booking-close-btn" class="px-4 py-2 text-sm font-semibold text-slate-500 cursor-pointer">Cerrar</button>
            <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold cursor-pointer">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  `;

  modalContainer.querySelector('#booking-close-btn').addEventListener('click', () => modalContainer.innerHTML = '');

  modalContainer.querySelector('#form-edit-booking').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newMovieId = Number(document.getElementById('edit-book-movie').value);
    const newQuantity = Number(document.getElementById('edit-book-quantity').value);
    const newStatus = isAdmin ? document.getElementById('edit-book-status').value : reservation.estado;

    const newTargetMovie = moviesList.find(m => m.id === newMovieId);
    if (!newTargetMovie) return;

    if (!isAdmin && hasFunctionStarted(newTargetMovie.fecha, newTargetMovie.hora)) {
      showToast('No se puede modificar reservas de funciones ya comenzadas.', 'error');
      return;
    }

    try {
      // 1. Ajuste de cupos según si la película cambió o no
      if (movie && movie.id === newTargetMovie.id) {
        const diff = newQuantity - reservation.cantidad_entradas;
        
        if (newStatus === 'Cancelada' && reservation.estado !== 'Cancelada') {
          newTargetMovie.cupos_disponibles += reservation.cantidad_entradas;
        } else if (newStatus !== 'Cancelada' && reservation.estado === 'Cancelada') {
          if (newQuantity > newTargetMovie.cupos_disponibles) {
            showToast(`No hay suficientes asientos. Quedan ${newTargetMovie.cupos_disponibles} cupos.`, 'error');
            return;
          }
          newTargetMovie.cupos_disponibles -= newQuantity;
        } else if (newStatus !== 'Cancelada') {
          if (diff > newTargetMovie.cupos_disponibles) {
            showToast(`No hay suficientes asientos. Quedan ${newTargetMovie.cupos_disponibles} adicionales.`, 'error');
            return;
          }
          newTargetMovie.cupos_disponibles -= diff;
        }

        await apiUpdateMovie(newTargetMovie.id, newTargetMovie);
      } else if (movie) {
        // Si el admin cambió de película:
        // Devolvemos los asientos a la vieja
        if (reservation.estado !== 'Cancelada') {
          movie.cupos_disponibles += reservation.cantidad_entradas;
          await apiUpdateMovie(movie.id, movie);
        }

        // Restamos asientos de la nueva
        if (newStatus !== 'Cancelada') {
          if (newQuantity > newTargetMovie.cupos_disponibles) {
            showToast(`No hay cupos en la nueva película. Quedan ${newTargetMovie.cupos_disponibles}.`, 'error');
            return;
          }
          newTargetMovie.cupos_disponibles -= newQuantity;
          await apiUpdateMovie(newTargetMovie.id, newTargetMovie);
        }
      }

      // 2. Modificamos el registro de la reserva en el servidor
      const updatedReservation = {
        ...reservation,
        funcion_seleccionada: {
          pelicula_id: newTargetMovie.id,
          titulo: newTargetMovie.pelicula
        },
        cantidad_entradas: newQuantity,
        estado: newStatus
      };

      await apiUpdateReservation(reservationId, updatedReservation);

      showToast('Reserva modificada con éxito', 'success');
      modalContainer.innerHTML = '';
      loadReservationsBoard(container);

    } catch (err) {
      console.error(err);
      showToast('Error al modificar la reserva', 'error');
    }
  });
}
