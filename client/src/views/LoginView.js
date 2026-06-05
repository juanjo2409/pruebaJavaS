import { apiFetchUserByEmail } from '../services/api.js';
import { setCurrentUser } from '../guards/auth.js';
import { showToast } from '../components/Toast.js';

/**
 * DIBUJAR VISTA DE LOGIN:
 * Renderiza el formulario de inicio de sesión con un diseño cinemático a pantalla dividida (split-screen).
 */
export async function renderLogin(container) {
  // Ajustamos las clases de Tailwind del contenedor padre para pantalla completa
  container.className = "min-h-screen w-full bg-slate-950 flex items-center justify-center p-0";

  // Insertar la estructura visual en el contenedor
  container.innerHTML = `
    <div class="flex min-h-screen w-full bg-slate-950 overflow-hidden text-slate-100">
      
      <!-- LADO IZQUIERDO: Banner Cinematográfico (Sólo visible en pantallas grandes) -->
      <div class="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-slate-950">
        <div class="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&auto=format&fit=crop&q=80" alt="Cinema screen" class="w-full h-full object-cover opacity-35 blur-[2px]" />
          <div class="absolute inset-0 bg-gradient-to-r from-transparent to-slate-950"></div>
          <div class="absolute inset-0 bg-gradient-to-b from-indigo-900/10 via-slate-950/80 to-slate-950"></div>
        </div>
        
        <!-- Contenido promocional decorativo -->
        <div class="relative z-10 p-12 text-left space-y-6 max-w-lg">
          <div class="inline-flex items-center gap-2 bg-indigo-600/15 text-indigo-400 px-4 py-2 rounded-2xl border border-indigo-500/20 text-sm font-extrabold shadow-lg shadow-indigo-600/10">
            🎬 <span class="tracking-widest uppercase text-xs">CineRiwi Barranquilla</span>
          </div>
          <div>
            <h1 class="text-5xl font-black tracking-tight text-white leading-tight">Tu Boleto al <span class="text-indigo-400">Mejor Cine</span></h1>
            <p class="text-slate-400 mt-4 text-base font-medium leading-relaxed">
              La plataforma de taquilla y cartelera exclusiva para la comunidad de **Riwi Sede Barranquilla**. Reserva tus entradas en salas 2D, 3D e IMAX sin salir del campus.
            </p>
          </div>
          <div class="flex gap-6 pt-4 text-xs font-bold uppercase tracking-widest text-indigo-400">
            <span>🍿 CODERS MODE ON</span>
            <span>📍 SEDE BARRANQUILLA</span>
          </div>
        </div>
      </div>

      <!-- LADO DERECHO: Formulario de Autenticación -->
      <div class="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        <!-- Imagen de fondo de cine móvil (Sólo visible en pantallas pequeñas) -->
        <div class="absolute inset-0 z-0 lg:hidden">
          <img src="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80" alt="Cinema background" class="w-full h-full object-cover opacity-20" />
          <div class="absolute inset-0 bg-gradient-to-b from-slate-900/60 to-slate-950"></div>
        </div>

        <!-- Tarjeta de Login Glassmorphic -->
        <div class="relative z-10 w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl space-y-6">
          <div class="text-center lg:text-left">
            <!-- Icono para móvil -->
            <div class="inline-flex lg:hidden items-center gap-2 bg-indigo-600 px-3 py-1.5 rounded-xl text-white shadow-lg shadow-indigo-600/20 mb-3 text-sm font-black">
              🎬 <span>CineRiwi</span>
            </div>
            <h2 class="text-3xl font-black text-white tracking-tight">Iniciar Sesión</h2>
            <p class="text-xs text-slate-400 mt-1.5 font-medium">Ingresa tus credenciales para acceder a la taquilla de **Riwi Barranquilla**</p>
          </div>

          <form id="login-form" class="space-y-4">
            <!-- Campo de Correo Electrónico -->
            <div>
              <label for="email" class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Correo Electrónico</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">📧</span>
                <input id="email" type="email" required class="block w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="ejemplo@cine.com">
              </div>
              <p id="email-error" class="hidden mt-1 text-[11px] text-rose-400 font-semibold"></p>
            </div>

            <!-- Campo de Contraseña -->
            <div>
              <label for="password" class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Contraseña</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔒</span>
                <input id="password" type="password" required class="block w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="••••••••">
              </div>
              <p id="password-error" class="hidden mt-1 text-[11px] text-rose-400 font-semibold"></p>
            </div>

            <!-- Mantener Sesión Iniciada -->
            <div class="flex items-center">
              <input id="remember-me" type="checkbox" checked class="h-4.5 w-4.5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer">
              <label for="remember-me" class="ml-2 text-xs text-slate-400 font-medium cursor-pointer">Mantener sesión iniciada</label>
            </div>

            <!-- Botón Ingresar -->
            <button type="submit" id="login-submit-btn" class="w-full flex items-center justify-center py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all duration-200 cursor-pointer gap-2 mt-2">
              <span id="login-btn-text">Ingresar a la Taquilla</span>
              <span id="login-spinner" class="hidden animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
            </button>
          </form>

          <!-- Credenciales de Demostración (Ayuda para sustentación) -->
          <div class="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-[11px] text-slate-400 space-y-2">
            <p class="font-bold text-slate-300">Cuentas de Acceso Rápido:</p>
            <div class="grid grid-cols-1 gap-1">
              <div>🔑 Admin: <code class="text-indigo-400 font-mono">admin@cine.com</code> / <code class="text-slate-300 font-mono">123456</code></div>
              <div>🔑 Cliente: <code class="text-emerald-400 font-mono">juan@cine.com</code> / <code class="text-slate-300 font-mono">123456</code></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;

  // Referencias a elementos
  const form = container.querySelector('#login-form');
  const submitBtn = container.querySelector('#login-submit-btn');
  const btnText = container.querySelector('#login-btn-text');
  const spinner = container.querySelector('#login-spinner');
  const emailError = container.querySelector('#email-error');
  const passwordError = container.querySelector('#password-error');

  // Procesar Submit del Formulario
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Resetear advertencias
    emailError.classList.add('hidden');
    passwordError.classList.add('hidden');

    const email = container.querySelector('#email').value.trim();
    const password = container.querySelector('#password').value;
    const rememberMe = container.querySelector('#remember-me').checked;

    // Cambiar botón a cargando
    submitBtn.disabled = true;
    btnText.textContent = 'Autenticando...';
    spinner.classList.remove('hidden');

    try {
      // 1. Buscamos el usuario por su correo electrónico en la API
      const user = await apiFetchUserByEmail(email);
      
      if (!user) {
        emailError.textContent = 'El correo electrónico no está registrado';
        emailError.classList.remove('hidden');
        showToast('Credenciales incorrectas', 'error');
        return;
      }

      // 2. Comparamos la contraseña
      if (user.password !== password) {
        passwordError.textContent = 'La contraseña es incorrecta';
        passwordError.classList.remove('hidden');
        showToast('Contraseña incorrecta', 'error');
        return;
      }

      // 3. Registrar sesión
      setCurrentUser(user, rememberMe);
      showToast(`¡Bienvenido de nuevo, ${user.name}!`, 'success');

      // 4. Redireccionar según el rol
      setTimeout(() => {
        if (user.role === 'admin') {
          window.location.hash = '/dashboard';
        } else {
          window.location.hash = '/movies';
        }
      }, 500);

    } catch (err) {
      showToast('Error de conexión con el servidor', 'error');
      console.error(err);
    } finally {
      // Restaurar estado del botón
      submitBtn.disabled = false;
      btnText.textContent = 'Ingresar a la Taquilla';
      spinner.classList.add('hidden');
    }
  });
}
