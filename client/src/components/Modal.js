/**
 * Gestor sencillo de diálogos modales y ventanas emergentes
 */

export function showModal({
  title,
  bodyHTML,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
  onConfirm = null,
  onCancel = null
}) {
  // Cerrar cualquier modal activo anterior para evitar duplicidad
  closeModal();

  const modalEl = document.createElement('div');
  modalEl.id = 'dynamic-modal';
  modalEl.className = 'fixed inset-0 z-45 overflow-y-auto flex items-center justify-center p-4 transition-opacity duration-300 opacity-0 pointer-events-none';
  modalEl.setAttribute('role', 'dialog');
  modalEl.setAttribute('aria-modal', 'true');

  modalEl.innerHTML = `
    <!-- Capa de fondo oscura (backdrop) -->
    <div class="fixed inset-0 bg-slate-900/60 transition-opacity duration-300 ease-out" aria-hidden="true"></div>
    
    <!-- Tarjeta del Modal -->
    <div class="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full z-10 overflow-hidden transform scale-95 opacity-0 transition-all duration-300 ease-out flex flex-col max-h-[90vh]">
      <!-- Encabezado -->
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <h3 class="text-lg font-semibold text-slate-900">${title}</h3>
        <button id="modal-close-x" class="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      
      <!-- Cuerpo -->
      <div class="px-6 py-6 overflow-y-auto flex-grow text-slate-600 text-sm">
        ${bodyHTML}
      </div>
      
      <!-- Acciones de pie de página -->
      <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
        <button id="modal-cancel-btn" class="px-4 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 rounded-lg text-sm font-medium transition-colors cursor-pointer">
          ${cancelText}
        </button>
        <button id="modal-confirm-btn" class="px-4 py-2 text-white ${confirmColor} focus:outline-none focus:ring-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer">
          <span id="modal-confirm-text">${confirmText}</span>
          <span id="modal-spinner" class="hidden animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);

  const backdrop = modalEl.querySelector('.bg-slate-900\\/60');
  const card = modalEl.querySelector('.bg-white');
  const closeX = modalEl.querySelector('#modal-close-x');
  const cancelBtn = modalEl.querySelector('#modal-cancel-btn');
  const confirmBtn = modalEl.querySelector('#modal-confirm-btn');

  // Activar la animación de entrada
  setTimeout(() => {
    modalEl.classList.remove('pointer-events-none', 'opacity-0');
    card.classList.remove('scale-95', 'opacity-0');
  }, 50);

  const handleClose = () => {
    modalEl.classList.add('opacity-0');
    card.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
      closeModal();
      if (onCancel) onCancel();
    }, 300);
  };

  closeX.addEventListener('click', handleClose);
  cancelBtn.addEventListener('click', handleClose);
  backdrop.addEventListener('click', handleClose);

  // Cerrar al presionar la tecla Escape
  const escListener = (e) => {
    if (e.key === 'Escape') handleClose();
  };
  document.addEventListener('keydown', escListener);
  modalEl._escListener = escListener;

  // Acción de confirmación del formulario
  confirmBtn.addEventListener('click', async () => {
    if (onConfirm) {
      const spinner = modalEl.querySelector('#modal-spinner');
      
      confirmBtn.disabled = true;
      cancelBtn.disabled = true;
      if (spinner) spinner.classList.remove('hidden');

      try {
        // Ejecutar callback de confirmación
        await onConfirm(modalEl, () => {
          document.removeEventListener('keydown', modalEl._escListener);
          modalEl.classList.add('opacity-0');
          card.classList.add('scale-95', 'opacity-0');
          setTimeout(() => closeModal(), 300);
        });
      } catch (e) {
        console.error(e);
      } finally {
        if (document.getElementById('dynamic-modal')) {
          confirmBtn.disabled = false;
          cancelBtn.disabled = false;
          if (spinner) spinner.classList.add('hidden');
        }
      }
    } else {
      handleClose();
    }
  });
}

/**
 * Elimina directamente los elementos del modal del DOM
 */
export function closeModal() {
  const modalEl = document.getElementById('dynamic-modal');
  if (modalEl) {
    if (modalEl._escListener) {
      document.removeEventListener('keydown', modalEl._escListener);
    }
    modalEl.remove();
  }
}

/**
 * Muestra diálogos estándar de confirmación utilizando SweetAlert2 (objeto global Swal)
 */
export function showConfirmModal({ title, message, confirmText = 'Confirmar', confirmColor = '#ef4444', onConfirm }) {
  Swal.fire({
    title: title,
    html: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: confirmColor,
    cancelButtonColor: '#64748b',
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancelar',
    background: '#ffffff',
    customClass: {
      popup: 'rounded-2xl border border-slate-100 shadow-xl'
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      // Ejecutar acción enviando mock elements para coincidir con la firma del controlador original
      const dummyModal = document.createElement('div');
      const dummyClose = () => {};
      await onConfirm(dummyModal, dummyClose);
    }
  });
}
