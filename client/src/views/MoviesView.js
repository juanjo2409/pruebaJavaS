import { apiFetchMovies, apiCreateMovie, apiUpdateMovie, apiDeleteMovie, apiFetchSalas } from '../services/api.js';
import { getCurrentUser } from '../guards/auth.js';
import { showToast } from '../components/Toast.js';
import { formatDate } from '../utils/helpers.js';

/**
 * FUNCIÓN AUXILIAR:
 * Retorna la URL de la imagen de portada de la película.
 * Si ya tiene una URL guardada en la base de datos la usa;
 * si no, busca en un catálogo de portadas por defecto basadas en el título.
 */
export function getMoviePoster(title, storedUrl) {
  if (storedUrl && storedUrl.trim() !== '') {
    return storedUrl;
  }
  
  const cleanTitle = (title || '').toLowerCase();
  
  // Diccionario con imágenes reales de alta resolución para películas comunes
  const DEFAULT_POSTERS = {
    'pablo escobar': 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=500&auto=format&fit=crop&q=60',
    'el padrino': 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=500&auto=format&fit=crop&q=60',
    'inception': 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=60',
    'gladiador': 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&auto=format&fit=crop&q=60',
    'avatar': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=60',
    'interstellar': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=60',
    'riwi': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=60'
  };

  // Buscar coincidencia parcial
  for (const key of Object.keys(DEFAULT_POSTERS)) {
    if (cleanTitle.includes(key)) {
      return DEFAULT_POSTERS[key];
    }
  }

  // Imagen por defecto (Fondo de cine/pantalla)
  return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60';
}

/**
 * 1. FUNCIÓN PRINCIPAL: Carga los datos de las películas y las salas,
 * luego llama a la función renderContent para dibujar la vista.
 */
export async function renderMovies(container) {
  const user = getCurrentUser();
  const isAdmin = user && user.role === 'admin';

  // Mostrar indicador de carga mientras obtenemos la información
  container.innerHTML = `
    <div class="flex items-center justify-center min-h-[300px]">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
    </div>
  `;

  try {
    // Obtenemos las películas y las salas en paralelo desde la API
    const [movies, salas] = await Promise.all([
      apiFetchMovies(),
      apiFetchSalas()
    ]);
    // Dibujamos la vista con los datos obtenidos
    renderContent(container, movies, salas, isAdmin);
  } catch (error) {
    console.error(error);
    showToast('Error al cargar la cartelera de películas', 'error');
  }
}

/**
 * 2. DIBUJAR VISTA: Genera el HTML correspondiente dependiendo de si
 * el usuario es Administrador o un Cliente común.
 */
function renderContent(container, movies, salas, isAdmin) {
  let catalogHtml = '';

  if (isAdmin) {
    // --- VISTA ADMINISTRADOR: Mostrar cada función individualmente para gestionarla ---
    for (const movie of movies) {
      const isActiva = movie.estado === 'Activa';
      const statusClass = isActiva 
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
        : 'bg-rose-50 text-rose-700 border border-rose-100';
      const statusTextClass = isActiva ? 'text-emerald-600' : 'text-rose-600';

      const posterUrl = getMoviePoster(movie.pelicula, movie.imagen);

      catalogHtml += `
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col group hover:shadow-md transition-all">
          <!-- Poster de la película -->
          <div class="relative h-48 bg-slate-900 overflow-hidden">
            <img src="${posterUrl}" alt="${movie.pelicula}" class="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300" />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
            <div class="absolute top-4 left-4">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusClass}">
                ${movie.sala || 'Sala N/A'}
              </span>
            </div>
            <div class="absolute top-4 right-4 text-xs font-bold text-white bg-slate-950/60 px-2 py-0.5 rounded backdrop-blur-sm">
              ID: ${movie.id}
            </div>
          </div>

          <div class="p-6 flex-grow space-y-4">
            <div>
              <h3 class="text-xl font-bold text-slate-900 tracking-tight line-clamp-1">${movie.pelicula}</h3>
              <p class="text-xs text-slate-400 mt-1">Estado: <strong class="${statusTextClass}">${movie.estado}</strong></p>
            </div>
            <div class="grid grid-cols-2 gap-4 pt-2 text-sm border-t border-slate-50">
              <div>
                <span class="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Fecha</span>
                <span class="font-semibold text-slate-700">${formatDate(movie.fecha)}</span>
              </div>
              <div>
                <span class="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Hora</span>
                <span class="font-semibold text-slate-700">${movie.hora} HS</span>
              </div>
              <div>
                <span class="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Aforo Total</span>
                <span class="font-semibold text-slate-700">${movie.capacidad_total}</span>
              </div>
              <div>
                <span class="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Disponibles</span>
                <span class="font-bold ${movie.cupos_disponibles > 0 ? 'text-emerald-600' : 'text-rose-600'}">${movie.cupos_disponibles}</span>
              </div>
            </div>
          </div>
          <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
            <button data-id="${movie.id}" class="btn-edit-movie text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-all text-xs font-semibold cursor-pointer">Editar</button>
            <button data-id="${movie.id}" class="btn-delete-movie text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-all text-xs font-semibold cursor-pointer">Eliminar</button>
          </div>
        </div>
      `;
    }
  } else {
    // --- VISTA CLIENTE: Agrupar las funciones por el nombre de la película ---
    
    // Paso A: Creamos un objeto para agrupar
    const grouped = {};
    for (const movie of movies) {
      if (movie.estado === 'Activa') {
        const title = movie.pelicula;
        if (!grouped[title]) {
          grouped[title] = [];
        }
        grouped[title].push(movie);
      }
    }

    // Paso B: Obtenemos los nombres de las películas agrupadas
    const titles = Object.keys(grouped);

    if (titles.length === 0) {
      catalogHtml = `
        <div class="col-span-full bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center">
          <p class="text-slate-400 text-sm font-semibold">No hay funciones activas programadas en este momento.</p>
        </div>
      `;
    } else {
      // Paso C: Recorremos cada película para dibujar su tarjeta
      for (const title of titles) {
        const functions = grouped[title];

        // Agrupamos las funciones de esta película por fecha
        const functionsByDate = {};
        for (const f of functions) {
          const date = f.fecha;
          if (!functionsByDate[date]) {
            functionsByDate[date] = [];
          }
          functionsByDate[date].push(f);
        }

        // Generamos el HTML para mostrar los horarios agrupados por día
        let datesHtml = '';
        const dates = Object.keys(functionsByDate);
        for (const date of dates) {
          const funcs = functionsByDate[date];
          
          // Ordenamos las funciones por horario de menor a mayor
          funcs.sort((a, b) => a.hora.localeCompare(b.hora));

          // Generamos el botón de reservar para cada horario
          let schedulesHtml = '';
          for (const f of funcs) {
            const isFull = f.cupos_disponibles === 0;
            schedulesHtml += `
              <button data-id="${f.id}" ${isFull ? 'disabled' : ''} class="btn-reserve-movie flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-all text-center group cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed w-full">
                <span class="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">${f.hora} HS</span>
                <span class="text-[10px] text-slate-500 mt-0.5">${f.sala}</span>
                <span class="text-[9px] font-bold mt-1 ${f.cupos_disponibles > 0 ? 'text-emerald-600' : 'text-rose-500'}">
                  ${isFull ? 'Agotado' : `${f.cupos_disponibles} disp.`}
                </span>
              </button>
            `;
          }

          datesHtml += `
            <div class="space-y-2">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">${formatDate(date)}</span>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                ${schedulesHtml}
              </div>
            </div>
          `;
        }

        const posterUrl = getMoviePoster(title, functions[0].imagen);

        // Creamos la estructura principal de la tarjeta de la película
        catalogHtml += `
          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-md transition-all">
            <!-- Poster de la película (Cliente) -->
            <div class="relative h-56 bg-slate-900 overflow-hidden">
              <img src="${posterUrl}" alt="${title}" class="w-full h-full object-cover opacity-80" />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
              <div class="absolute bottom-4 left-6 right-6">
                <h3 class="text-2xl font-black text-white tracking-tight drop-shadow">${title}</h3>
                <span class="text-[10px] font-bold text-indigo-400 tracking-wider uppercase">En Cartelera</span>
              </div>
            </div>

            <div class="p-6 flex-grow space-y-4">
              <div class="pt-4 space-y-4">
                <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Horarios y Salas disponibles:</span>
                <div class="space-y-4">
                  ${datesHtml}
                </div>
              </div>
            </div>
          </div>
        `;
      }
    }
  }

  // Insertar la estructura principal y el catálogo generado
  container.innerHTML = `
    <div class="space-y-6 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Cartelera de Cine</h2>
          <p class="text-sm text-slate-500 font-medium">Consulta las funciones disponibles y reserva tus entradas</p>
        </div>
        ${isAdmin ? `
          <button id="btn-add-movie" class="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all text-sm self-start sm:self-center cursor-pointer">
            + Nueva Función
          </button>
        ` : ''}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${catalogHtml}
      </div>
      <div id="movie-modal-container"></div>
    </div>
  `;

  // Asignar los eventos interactivos
  setupEventListeners(container, movies, salas, isAdmin);
}

/**
 * 3. CONTROLADORES DE EVENTOS: Escucha los clics del usuario para agregar,
 * editar, eliminar o reservar funciones.
 */
function setupEventListeners(container, movies, salas, isAdmin) {
  if (isAdmin) {
    // === EVENTOS DEL ADMINISTRADOR ===

    // A. Abrir modal para crear una Nueva Función
    container.querySelector('#btn-add-movie')?.addEventListener('click', () => {
      const activeRooms = salas.filter(s => s.estado === 'Activa');
      if (activeRooms.length === 0) {
        showToast('Debe crear al menos una sala activa antes de programar funciones.', 'warning');
        return;
      }

      const modalContainer = container.querySelector('#movie-modal-container');
      modalContainer.innerHTML = `
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 class="text-xl font-bold text-slate-900">Nueva Función de Cine</h3>
            <form id="form-create-movie" class="space-y-3">
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Título de la Película</label>
                <input type="text" id="add-title" required class="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase mb-1">URL de la Imagen (Poster)</label>
                <input type="url" id="add-image" placeholder="https://ejemplo.com/poster.jpg (Opcional)" class="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Sala de Cine</label>
                <select id="add-sala" class="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm">
                  ${activeRooms.map(s => `<option value="${s.id}" data-capacity="${s.capacidad}">${s.nombre} (${s.tipo} - Máx: ${s.capacidad})</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Fecha</label>
                <input type="date" id="add-date" required class="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Horarios de Proyección</label>
                <div id="add-times-container" class="space-y-2">
                  <div class="flex gap-2 items-center">
                    <input type="time" required class="add-time-input w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm" />
                    <button type="button" class="btn-remove-time text-rose-500 hover:bg-rose-50 px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer hidden">Eliminar</button>
                  </div>
                </div>
                <button type="button" id="btn-add-time-slot" class="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer">
                  + Añadir otro horario
                </button>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Capacidad Total de Asientos</label>
                <input type="number" id="add-capacity" min="1" required class="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm" />
              </div>
              <div class="flex justify-end gap-2 pt-2 border-t">
                <button type="button" id="movie-close-btn" class="px-4 py-2 text-sm font-semibold text-slate-500 cursor-pointer">Cerrar</button>
                <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold cursor-pointer">Guardar en Cartelera</button>
              </div>
            </form>
          </div>
        </div>
      `;

      const salaSelect = modalContainer.querySelector('#add-sala');
      const capacityInput = modalContainer.querySelector('#add-capacity');
      const addTimesContainer = modalContainer.querySelector('#add-times-container');
      const btnAddTimeSlot = modalContainer.querySelector('#btn-add-time-slot');

      // Actualizar automáticamente la capacidad límite según la sala elegida
      const updateCapacityLimit = () => {
        const selectedOption = salaSelect.options[salaSelect.selectedIndex];
        const maxCap = Number(selectedOption.getAttribute('data-capacity'));
        capacityInput.value = maxCap;
        capacityInput.max = maxCap;
      };

      salaSelect.addEventListener('change', updateCapacityLimit);
      updateCapacityLimit();

      // Botón para añadir una nueva fila de horario
      btnAddTimeSlot.addEventListener('click', () => {
        const div = document.createElement('div');
        div.className = 'flex gap-2 items-center';
        div.innerHTML = `
          <input type="time" required class="add-time-input w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm" />
          <button type="button" class="btn-remove-time text-rose-500 hover:bg-rose-50 px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer">Eliminar</button>
        `;
        addTimesContainer.appendChild(div);
        
        div.querySelector('.btn-remove-time').addEventListener('click', () => {
          div.remove();
          toggleRemoveButtons();
        });
        toggleRemoveButtons();
      });

      // Muestra o culta los botones de "Eliminar" horario si solo hay uno
      function toggleRemoveButtons() {
        const slots = addTimesContainer.querySelectorAll('.flex');
        slots.forEach(slot => {
          const btn = slot.querySelector('.btn-remove-time');
          if (slots.length > 1) {
            btn.classList.remove('hidden');
          } else {
            btn.classList.add('hidden');
          }
        });
      }

      // Cerrar modal
      modalContainer.querySelector('#movie-close-btn').addEventListener('click', () => modalContainer.innerHTML = '');

      // Guardar formulario de Nueva Película
      modalContainer.querySelector('#form-create-movie').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const selectedOption = salaSelect.options[salaSelect.selectedIndex];
        const salaId = Number(salaSelect.value);
        const salaName = selectedOption.text.split(' (')[0];
        const capacity = Number(capacityInput.value);
        const maxAllowed = Number(capacityInput.max);
        const imageUrl = document.getElementById('add-image').value.trim();

        // Validación de aforo
        if (capacity > maxAllowed) {
          showToast(`La capacidad de la función no puede superar la capacidad de la sala (${maxAllowed} asientos).`, 'error');
          return;
        }

        // Obtener todos los horarios agregados
        const timeInputs = modalContainer.querySelectorAll('.add-time-input');
        const times = [];
        for (const input of timeInputs) {
          if (input.value) {
            times.push(input.value);
          }
        }

        if (times.length === 0) {
          showToast('Debe ingresar al menos un horario.', 'error');
          return;
        }

        // Validar que no haya horarios duplicados en el mismo formulario
        const uniqueTimes = [...new Set(times)];
        if (uniqueTimes.length !== times.length) {
          showToast('No puede ingresar horarios duplicados para la misma función.', 'error');
          return;
        }

        const fecha = document.getElementById('add-date').value;

        // Validar que la sala no esté ya ocupada en esa misma fecha y hora
        for (const time of times) {
          const conflict = movies.find(m => 
            m.estado === 'Activa' &&
            m.salaId === salaId &&
            m.fecha === fecha &&
            m.hora === time
          );

          if (conflict) {
            showToast(`La ${salaName} ya está ocupada el día ${formatDate(fecha)} a las ${time} HS por la película "${conflict.pelicula}".`, 'error');
            return;
          }
        }

        try {
          // Crear las funciones una a una (secuencialmente) para evitar bloqueos en la base de datos db.json
          for (const time of times) {
            const data = {
              pelicula: document.getElementById('add-title').value.trim(),
              salaId: salaId,
              sala: salaName,
              fecha: fecha,
              hora: time,
              capacidad_total: capacity,
              cupos_disponibles: capacity,
              estado: "Activa",
              imagen: imageUrl
            };
            await apiCreateMovie(data);
          }

          showToast('Película y funciones añadidas a la cartelera con éxito', 'success');
          modalContainer.innerHTML = '';
          renderMovies(container);
        } catch (err) {
          console.error(err);
          showToast('Error al guardar las funciones de la película', 'error');
        }
      });
    });

    // B. Abrir modal para editar una función existente
    container.querySelectorAll('.btn-edit-movie').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const movieId = Number(e.currentTarget.dataset.id);
        const movie = movies.find(m => m.id === movieId);
        if (!movie) return;

        const activeRooms = salas.filter(s => s.estado === 'Activa');
        const modalContainer = container.querySelector('#movie-modal-container');
        
        modalContainer.innerHTML = `
          <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
              <h3 class="text-xl font-bold text-slate-900">Editar Función de Cine</h3>
              <form id="form-edit-movie" class="space-y-3">
                <div>
                  <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Título de la Película</label>
                  <input type="text" id="edit-title" value="${movie.pelicula}" required class="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-400 uppercase mb-1">URL de la Imagen (Poster)</label>
                  <input type="url" id="edit-image" value="${movie.imagen || ''}" placeholder="https://ejemplo.com/poster.jpg (Opcional)" class="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Sala de Cine</label>
                  <select id="edit-sala" class="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm">
                    ${activeRooms.map(s => `<option value="${s.id}" data-capacity="${s.capacidad}" ${movie.salaId === s.id ? 'selected' : ''}>${s.nombre} (${s.tipo} - Máx: ${s.capacidad})</option>`).join('')}
                  </select>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Fecha</label>
                    <input type="date" id="edit-date" value="${movie.fecha}" required class="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Hora</label>
                    <input type="time" id="edit-time" value="${movie.hora}" required class="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm" />
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Capacidad Total</label>
                    <input type="number" id="edit-capacity" min="1" value="${movie.capacidad_total}" required class="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Estado de Función</label>
                    <select id="edit-status" class="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm">
                      <option value="Activa" ${movie.estado === 'Activa' ? 'selected' : ''}>Activa</option>
                      <option value="Cancelada" ${movie.estado === 'Cancelada' ? 'selected' : ''}>Cancelada</option>
                    </select>
                  </div>
                </div>
                <div class="flex justify-end gap-2 pt-2 border-t">
                  <button type="button" id="movie-close-btn" class="px-4 py-2 text-sm font-semibold text-slate-500 cursor-pointer">Cerrar</button>
                  <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold cursor-pointer">Actualizar Función</button>
                </div>
              </form>
            </div>
          </div>
        `;

        const salaSelect = modalContainer.querySelector('#edit-sala');
        const capacityInput = modalContainer.querySelector('#edit-capacity');

        const updateCapacityLimit = () => {
          const selectedOption = salaSelect.options[salaSelect.selectedIndex];
          const maxCap = Number(selectedOption.getAttribute('data-capacity'));
          capacityInput.max = maxCap;
        };

        salaSelect.addEventListener('change', updateCapacityLimit);
        updateCapacityLimit();

        modalContainer.querySelector('#movie-close-btn').addEventListener('click', () => modalContainer.innerHTML = '');

        // Guardar cambios al editar una función
        modalContainer.querySelector('#form-edit-movie').addEventListener('submit', async (e) => {
          e.preventDefault();
          const selectedOption = salaSelect.options[salaSelect.selectedIndex];
          const salaId = Number(salaSelect.value);
          const salaName = selectedOption.text.split(' (')[0];
          const capacity = Number(capacityInput.value);
          const maxAllowed = Number(capacityInput.max);
          const status = document.getElementById('edit-status').value;
          const imageUrl = document.getElementById('edit-image').value.trim();

          if (capacity > maxAllowed) {
            showToast(`La capacidad no puede superar el límite de la sala (${maxAllowed} asientos).`, 'error');
            return;
          }

          // Validación para no reducir la capacidad por debajo de las entradas ya vendidas
          const boletosVendidos = movie.capacidad_total - movie.cupos_disponibles;
          if (capacity < boletosVendidos) {
            showToast(`No se puede reducir la capacidad a ${capacity} asientos porque ya hay ${boletosVendidos} boletos reservados.`, 'error');
            return;
          }

          const fecha = document.getElementById('edit-date').value;
          const hora = document.getElementById('edit-time').value;

          // Si la función está activa, verificar que no cause conflicto con otra película en esa misma sala y hora
          if (status === 'Activa') {
            const conflict = movies.find(m => 
              m.id !== movieId &&
              m.estado === 'Activa' &&
              m.salaId === salaId &&
              m.fecha === fecha &&
              m.hora === hora
            );

            if (conflict) {
              showToast(`Conflicto de horario: La ${salaName} ya está ocupada el día ${formatDate(fecha)} a las ${hora} HS por la película "${conflict.pelicula}".`, 'error');
              return;
            }
          }

          const diff = capacity - movie.capacidad_total;
          const updatedCupos = movie.cupos_disponibles + diff;

          const data = {
            ...movie,
            pelicula: document.getElementById('edit-title').value.trim(),
            salaId: salaId,
            sala: salaName,
            fecha: fecha,
            hora: hora,
            capacidad_total: capacity,
            cupos_disponibles: updatedCupos,
            estado: status,
            imagen: imageUrl
          };

          try {
            await apiUpdateMovie(movieId, data);
            showToast('Función actualizada con éxito', 'success');
            modalContainer.innerHTML = '';
            renderMovies(container);
          } catch (err) {
            console.error(err);
            showToast('Error al actualizar la función', 'error');
          }
        });
      });
    });

    // C. Eliminar una función de la cartelera
    container.querySelectorAll('.btn-delete-movie').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const movieId = e.currentTarget.dataset.id;
        Swal.fire({
          title: '¿Eliminar esta función?',
          text: 'Esta acción no se puede deshacer y eliminará la programación de la cartelera.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#ef4444',
          cancelButtonColor: '#64748b',
          confirmButtonText: 'Sí, eliminar',
          cancelButtonText: 'Cancelar'
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              await apiDeleteMovie(movieId);
              showToast('Función eliminada de la cartelera', 'success');
              renderMovies(container);
            } catch (err) {
              console.error(err);
              showToast('Error al eliminar la función', 'error');
            }
          }
        });
      });
    });
  } else {
    // === EVENTOS DEL CLIENTE ===

    // Presionar sobre un botón de horario para ir a la pantalla de reserva
    container.querySelectorAll('.btn-reserve-movie').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const movieId = e.currentTarget.dataset.id;
        window.location.hash = `#/reservations?movieId=${movieId}`;
      });
    });
  }
}
