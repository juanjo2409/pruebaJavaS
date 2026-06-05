import { getCurrentUser } from '../guards/auth.js';

/**
 * DIBUJAR PANTALLA DE ACCESO DENEGADO:
 * Se muestra si un usuario común intenta acceder a rutas de administración.
 */
export async function renderAccessDenied(container) {
  const user = getCurrentUser();
  
  // Decidir a dónde regresar al usuario según su rol de acceso
  const returnPath = user ? (user.role === 'admin' ? '#/dashboard' : '#/movies') : '#/login';
  const returnText = user ? 'Regresar a la Cartelera' : 'Iniciar Sesión';

  container.innerHTML = `
    <div class="max-w-md w-full mx-4 text-center">
      <div class="bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/60 p-8 space-y-6">
        <!-- Icono de Advertencia -->
        <div class="inline-flex bg-rose-500/10 text-rose-500 p-4 rounded-full border border-rose-500/20 mb-2 animate-pulse text-3xl">
          ⚠️
        </div>
        
        <div class="space-y-2">
          <h2 class="text-2xl font-extrabold text-white tracking-tight">Acceso Denegado</h2>
          <p class="text-sm text-slate-400">Su cuenta de usuario no cuenta con los permisos necesarios para acceder a este módulo.</p>
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
