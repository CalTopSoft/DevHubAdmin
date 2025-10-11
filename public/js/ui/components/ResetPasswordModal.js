import Toast from './Toast.js';
import { resetUserPassword } from '../../api/users.js';

export default function ResetPasswordModal(userId, username, user) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 animate-fade-in';
  modal.innerHTML = `
    <div class="form-container p-8 rounded-lg shadow-xl w-full max-w-md">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
          Resetear Contraseña de ${username}
        </h2>
        <button id="closeModal" class="text-gray-400 hover:text-white">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <form id="resetPasswordForm" class="space-y-6">
        <div>
          <label for="emailSelect" class="block text-sm font-medium">Seleccionar Email</label>
          <select id="emailSelect" class="w-full px-4 py-3 rounded-lg bg-gray-700/50 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 focus:border-transparent">
            <option value="${user.email}">${user.email} (Principal)</option>
            ${user.contacts?.email ? `<option value="${user.contacts.email}">${user.contacts.email} (Personal)</option>` : ''}
            ${user.contacts?.outlook ? `<option value="${user.contacts.outlook}">${user.contacts.outlook} (Outlook)</option>` : ''}
          </select>
        </div>
        <button 
          type="submit" 
          id="resetBtn"
          class="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
        >
          <span id="resetBtnText">Enviar Enlace de Recuperación</span>
          <div id="resetBtnLoading" class="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin hidden"></div>
        </button>
      </form>
      <div id="resetMessage" class="mt-4 p-3 rounded-lg hidden"></div>
    </div>
  `;

  // Función para mostrar mensajes
  function showMessage(message, type = 'info') {
    const messageEl = modal.querySelector('#resetMessage');
    messageEl.textContent = message;
    messageEl.className = `mt-4 p-3 rounded-lg bg-${type === 'success' ? 'green' : type === 'error' ? 'red' : 'blue'}-500 bg-opacity-20 text-${type === 'success' ? 'green' : type === 'error' ? 'red' : 'blue'}-400 border border-${type === 'success' ? 'green' : type === 'error' ? 'red' : 'blue'}-500 border-opacity-30`;
    messageEl.classList.remove('hidden');
    
    setTimeout(() => {
      messageEl.classList.add('hidden');
    }, 5000);
  }

  // Función para toggle loading state
  function toggleLoading(isLoading) {
    const btn = modal.querySelector('#resetBtn');
    const text = modal.querySelector('#resetBtnText');
    const loading = modal.querySelector('#resetBtnLoading');
    
    btn.disabled = isLoading;
    if (isLoading) {
      text.classList.add('hidden');
      loading.classList.remove('hidden');
      btn.classList.add('opacity-75', 'cursor-not-allowed');
    } else {
      text.classList.remove('hidden');
      loading.classList.add('hidden');
      btn.classList.remove('opacity-75', 'cursor-not-allowed');
    }
  }

  // Manejar cierre del modal
  modal.querySelector('#closeModal').addEventListener('click', () => {
    modal.remove();
  });

  // Manejar envío del formulario
  modal.querySelector('#resetPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = modal.querySelector('#emailSelect').value;
    
    if (!email) {
      showMessage('Por favor selecciona un email', 'error');
      return;
    }

    toggleLoading(true);

    try {
      await resetUserPassword(userId, email);
      showMessage(`Enlace de recuperación enviado a ${email}`, 'success');
      setTimeout(() => modal.remove(), 2000);
    } catch (error) {
      showMessage(error.message || 'Error al enviar el enlace', 'error');
    } finally {
      toggleLoading(false);
    }
  });

  return modal;
}