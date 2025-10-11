import ApiClient from '../../api/client.js';
import Toast from './Toast.js';

export default function NotificationDropdown() {
  const container = document.createElement('div');
  container.className = 'relative';
  
  container.innerHTML = `
    <button id="notification-button" class="relative p-2 text-gray-300 hover:text-white transition-colors">
      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
      </svg>
      <span id="notification-badge" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1 hidden">0</span>
    </button>
    
    <div id="notification-dropdown" class="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 hidden">
      <div class="p-4 border-b border-gray-700">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold">Notificaciones</h3>
          <button id="mark-all-read" class="text-sm text-blue-400 hover:text-blue-300">
            Marcar todas como leídas
          </button>
        </div>
      </div>
      
      <div id="notifications-list" class="max-h-96 overflow-y-auto">
        <div class="p-4 text-center text-gray-400">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto mb-2"></div>
          <p>Cargando notificaciones...</p>
        </div>
      </div>
      
      <div class="p-3 border-t border-gray-700 text-center">
        <button id="see-all-notifications" class="text-blue-400 hover:text-blue-300 text-sm">
          Ver todas las notificaciones
        </button>
      </div>
    </div>
  `;

  const button = container.querySelector('#notification-button');
  const dropdown = container.querySelector('#notification-dropdown');
  const badge = container.querySelector('#notification-badge');
  const notificationsList = container.querySelector('#notifications-list');
  
  let isOpen = false;
  let notifications = [];

  // Alternar dropdown
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    isOpen = !isOpen;
    dropdown.classList.toggle('hidden', !isOpen);
    
    if (isOpen) {
      loadNotifications();
    }
  });

  // Cerrar al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target) && isOpen) {
      isOpen = false;
      dropdown.classList.add('hidden');
    }
  });

  // Marcar todas como leídas
  container.querySelector('#mark-all-read').addEventListener('click', async () => {
    try {
      await ApiClient.markAllNotificationsAsRead();
      notifications = notifications.map(n => ({ ...n, read: true }));
      renderNotifications();
      updateBadge();
      Toast.show('Todas las notificaciones marcadas como leídas', 'success');
    } catch (error) {
      Toast.show(`Error: ${error.message}`, 'error');
    }
  });

  // Cargar notificaciones
  async function loadNotifications() {
    try {
      notifications = await ApiClient.getNotifications({ limit: 10 });
      renderNotifications();
    } catch (error) {
      notificationsList.innerHTML = `
        <div class="p-4 text-center text-red-400">
          Error al cargar notificaciones
        </div>
      `;
    }
  }

  // Renderizar notificaciones
  function renderNotifications() {
    if (notifications.length === 0) {
      notificationsList.innerHTML = `
        <div class="p-4 text-center text-gray-400">
          <div class="text-4xl mb-2">🔔</div>
          <p>No tienes notificaciones</p>
        </div>
      `;
      return;
    }

    notificationsList.innerHTML = notifications.map(notification => `
      <div class="p-3 border-b border-gray-700 hover:bg-gray-700 ${notification.read ? '' : 'bg-blue-900/20'}" 
           data-notification-id="${notification._id}">
        <div class="flex items-start justify-between mb-1">
          <div class="flex-1">
            <h4 class="text-sm font-medium ${notification.read ? 'text-gray-300' : 'text-white'}">
              ${notification.title}
            </h4>
            <p class="text-xs text-gray-400 mt-1 line-clamp-2">
              ${notification.message}
            </p>
            <div class="flex items-center justify-between mt-2">
              <span class="text-xs text-gray-500">
                ${new Date(notification.createdAt).toLocaleDateString('es-ES')}
              </span>
              ${!notification.read ? `
                <button 
                  class="text-xs text-blue-400 hover:text-blue-300"
                  onclick="markAsRead('${notification._id}')"
                >
                  Marcar leída
                </button>
              ` : ''}
            </div>
          </div>
          ${!notification.read ? '<div class="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>' : ''}
        </div>
      </div>
    `).join('');
  }

  // Actualizar badge
  async function updateBadge() {
    try {
      const stats = await ApiClient.getNotificationStats();
      const unreadCount = stats.unread || 0;
      
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    } catch (error) {
      console.error('Error updating notification badge:', error);
    }
  }

  // Marcar como leída (función global para el onclick)
  window.markAsRead = async (notificationId) => {
    try {
      await ApiClient.markNotificationAsRead(notificationId);
      notifications = notifications.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      );
      renderNotifications();
      updateBadge();
    } catch (error) {
      Toast.show(`Error: ${error.message}`, 'error');
    }
  };

  // Inicializar badge
  updateBadge();
  
  // Actualizar badge cada 30 segundos
  setInterval(updateBadge, 30000);

  return container;
}