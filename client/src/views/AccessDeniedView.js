import { getCurrentUser } from '../guards/auth.js';

/**
 * Renderiza la pantalla de Acceso Denegado cuando falla la validación de roles de usuario.
 */
export async function renderAccessDenied(container) {
  const user = getCurrentUser();
  const returnPath = user ? (user.role === 'admin' ? '#/dashboard' : '#/reservations') : '#/login';
  const returnText = user ? 'Regresar al Tablero' : 'Iniciar Sesión';

  container.innerHTML = `
    <div class="max-w-md w-full mx-4 text-center">
      <div class="bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/60 p-8 space-y-6">
        <!-- Icono de escudo de alerta -->
        <div class="inline-flex bg-rose-500/10 text-rose-500 p-4 rounded-full border border-rose-500/20 mb-2 animate-pulse">
          <svg class="w-12 h-12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        </div>
        
        <div class="space-y-2">
          <h2 class="text-2xl font-extrabold text-white tracking-tight">Acceso Denegado</h2>
          <p class="text-sm text-slate-400">Su cuenta de usuario no cuenta con los privilegios administrativos necesarios para acceder a este módulo.</p>
        </div>
        
        <div class="pt-4">
          <a href="${returnPath}" class="inline-flex w-full items-center justify-center py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg cursor-pointer">
            ${returnText}
          </a>
        </div>
      </div>
    </div>
  `;
}
