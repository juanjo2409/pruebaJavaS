import { apiFetchUserByEmail } from '../services/api.js';
import { setCurrentUser } from '../guards/auth.js';
import { showToast } from '../components/Toast.js';

/**
 * DIBUJAR VISTA DE LOGIN:
 * Renderiza el formulario de inicio de sesión y gestiona el submit.
 */
export async function renderLogin(container) {
  // Insertar el formulario en el contenedor principal
  container.innerHTML = `
    <div class="max-w-md w-full mx-4">
      <div class="text-center mb-8">
        <div class="inline-flex bg-indigo-600 p-3.5 rounded-2xl text-white shadow-xl shadow-indigo-600/30 mb-4 animate-bounce">
          🎬
        </div>
        <h2 class="text-3xl font-extrabold text-white tracking-tight">Iniciar Sesión</h2>
        <p class="mt-2 text-sm text-slate-400">Reserva tus boletos y gestiona las funciones del cine</p>
      </div>

      <div class="bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/60 p-8">
        <form id="login-form" class="space-y-6">
          <!-- Correo Electrónico -->
          <div>
            <label for="email" class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Correo Electrónico</label>
            <input id="email" type="email" required class="block w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="tu@cine.com">
            <p id="email-error" class="hidden mt-2 text-xs text-rose-400 font-semibold"></p>
          </div>

          <!-- Contraseña -->
          <div>
            <label for="password" class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Contraseña</label>
            <input id="password" type="password" required class="block w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="••••••••">
            <p id="password-error" class="hidden mt-2 text-xs text-rose-400 font-semibold"></p>
          </div>

          <!-- Recordar Sesión -->
          <div class="flex items-center">
            <input id="remember-me" type="checkbox" checked class="h-4.5 w-4.5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer">
            <label for="remember-me" class="ml-2 text-xs text-slate-300 font-medium cursor-pointer">Recordar sesión en este equipo</label>
          </div>

          <!-- Botón de ingresar -->
          <button type="submit" id="login-submit-btn" class="w-full flex items-center justify-center py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 cursor-pointer">
            <span id="login-btn-text">Ingresar</span>
            <span id="login-spinner" class="hidden animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent ml-2"></span>
          </button>
        </form>
      </div>
      
      <!-- Credenciales de demostración -->
      <div class="mt-6 text-center bg-slate-800/40 border border-slate-700/30 rounded-xl p-3 text-xs text-slate-400">
        <p class="font-medium text-slate-300 mb-1">Credenciales de prueba:</p>
        <div class="flex justify-center gap-4">
          <span>Admin: <code class="text-indigo-400 font-mono">admin@cine.com</code> / <code class="text-indigo-400 font-mono">123456</code></span>
          <span>Usuario: <code class="text-indigo-400 font-mono">juan@cine.com</code> / <code class="text-indigo-400 font-mono">123456</code></span>
        </div>
      </div>
    </div>
  `;

  // Obtener referencias de los elementos del formulario
  const form = container.querySelector('#login-form');
  const submitBtn = container.querySelector('#login-submit-btn');
  const btnText = container.querySelector('#login-btn-text');
  const spinner = container.querySelector('#login-spinner');
  const emailError = container.querySelector('#email-error');
  const passwordError = container.querySelector('#password-error');

  // Evento de envío del formulario
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Resetear mensajes de error
    emailError.classList.add('hidden');
    passwordError.classList.add('hidden');

    const email = container.querySelector('#email').value.trim();
    const password = container.querySelector('#password').value;
    const rememberMe = container.querySelector('#remember-me').checked;

    // Cambiar estado del botón a "Cargando..."
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

      // 2. Comparamos la contraseña ingresada con la guardada
      if (user.password !== password) {
        passwordError.textContent = 'La contraseña es incorrecta';
        passwordError.classList.remove('hidden');
        showToast('Contraseña incorrecta', 'error');
        return;
      }

      // 3. Si es correcto, marcamos la sesión activa en el navegador
      setCurrentUser(user, rememberMe);
      showToast(`¡Bienvenido, ${user.name}!`);

      // 4. Redirigimos según el rol (Administrador al Dashboard, Cliente a la Cartelera)
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
      // Restaurar el estado del botón
      submitBtn.disabled = false;
      btnText.textContent = 'Ingresar';
      spinner.classList.add('hidden');
    }
  });
}
