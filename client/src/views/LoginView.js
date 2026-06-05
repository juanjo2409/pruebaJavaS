import { apiFetchUserByEmail } from '../services/api.js';
import { setCurrentUser } from '../guards/auth.js';
import { showToast } from '../components/Toast.js';

/**
 * Renderiza el formulario de inicio de sesión y gestiona la comprobación de credenciales.
 */
export async function renderLogin(container) {
  container.innerHTML = `
    <div class="max-w-md w-full mx-4">
      <!-- Logotipo del encabezado -->
      <div class="text-center mb-8">
        <div class="inline-flex bg-indigo-600 p-3.5 rounded-2xl text-white shadow-xl shadow-indigo-600/30 mb-4 animate-bounce">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
        </div>
        <h2 class="text-3xl font-extrabold text-white tracking-tight">Iniciar Sesión</h2>
        <p class="mt-2 text-sm text-slate-400">Reserva oficinas y salas de reuniones de forma eficiente</p>
      </div>

      <!-- Tarjeta del Formulario de Ingreso -->
      <div class="bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/60 p-8">
        <form id="login-form" class="space-y-6">
          <!-- Campo de Correo Electrónico -->
          <div>
            <label for="email" class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Correo Electrónico</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <input id="email" type="email" required class="block w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="tu@empresa.com">
            </div>
            <p id="email-error" class="hidden mt-2 text-xs text-rose-400 font-semibold"></p>
          </div>

          <!-- Campo de Contraseña -->
          <div>
            <label for="password" class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Contraseña</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              </div>
              <input id="password" type="password" required class="block w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="••••••••">
            </div>
            <p id="password-error" class="hidden mt-2 text-xs text-rose-400 font-semibold"></p>
          </div>

          <!-- Checkbox de Recordar Sesión -->
          <div class="flex items-center">
            <input id="remember-me" type="checkbox" checked class="h-4.5 w-4.5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer">
            <label for="remember-me" class="ml-2 text-xs text-slate-300 font-medium cursor-pointer">Recordar sesión en este equipo</label>
          </div>

          <!-- Botón de Envío -->
          <button type="submit" id="login-submit-btn" class="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none shadow-lg hover:shadow-indigo-600/40 transition-all duration-200 cursor-pointer">
            <span id="login-btn-text">Ingresar</span>
            <span id="login-spinner" class="hidden animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent ml-2"></span>
          </button>
        </form>
      </div>
      
      <!-- Guía de credenciales demo -->
      <div class="mt-6 text-center bg-slate-800/40 border border-slate-700/30 rounded-xl p-3 text-xs text-slate-400">
        <p class="font-medium text-slate-300 mb-1">Credenciales de prueba:</p>
        <div class="flex justify-center gap-4">
          <span>Admin: <code class="text-indigo-400">admin@empresa.com</code> / <code class="text-indigo-400">123456</code></span>
          <span>Usuario: <code class="text-indigo-400">juan@empresa.com</code> / <code class="text-indigo-400">123456</code></span>
        </div>
      </div>
    </div>
  `;

  // Controladores del envío del Login
  const form = container.querySelector('#login-form');
  const submitBtn = container.querySelector('#login-submit-btn');
  const btnText = container.querySelector('#login-btn-text');
  const spinner = container.querySelector('#login-spinner');
  
  const emailError = container.querySelector('#email-error');
  const passwordError = container.querySelector('#password-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Ocultar mensajes de errores previos
    emailError.classList.add('hidden');
    passwordError.classList.add('hidden');

    const email = container.querySelector('#email').value.trim();
    const password = container.querySelector('#password').value;
    const rememberMe = container.querySelector('#remember-me').checked;

    // Estado cargando
    submitBtn.disabled = true;
    btnText.textContent = 'Autenticando...';
    spinner.classList.remove('hidden');

    try {
      // Buscar usuario en json-server
      const user = await apiFetchUserByEmail(email);
      
      if (!user) {
        emailError.textContent = 'Cuenta de correo no encontrada';
        emailError.classList.remove('hidden');
        showToast('Fallo en la autenticación. Revise sus credenciales.', 'error');
        return;
      }

      // Validar contraseña
      if (user.password !== password) {
        passwordError.textContent = 'Contraseña incorrecta';
        passwordError.classList.remove('hidden');
        showToast('Fallo en la autenticación. Contraseña incorrecta.', 'error');
        return;
      }

      // Sesión exitosa
      setCurrentUser(user, rememberMe);
      showToast(`¡Bienvenido de nuevo, ${user.name}!`);

      // Redirigir según el rol del empleado
      setTimeout(() => {
        window.location.hash = user.role === 'admin' ? '/dashboard' : '/reservations';
      }, 500);

    } catch (err) {
      showToast('Error de red. Asegúrese de que la base de datos REST esté activa.', 'error');
      console.error(err);
    } finally {
      submitBtn.disabled = false;
      btnText.textContent = 'Ingresar';
      spinner.classList.add('hidden');
    }
  });
}
