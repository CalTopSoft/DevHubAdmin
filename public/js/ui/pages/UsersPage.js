import { getUsers, resetUserPassword } from '../../api/users.js';
import Toast from '../components/Toast.js';
import ResetPasswordModal from '../components/ResetPasswordModal.js';

export default function UsersPage() {
  const container = document.createElement('div');
  container.className = 'space-y-6';

  const title = document.createElement('h2');
  title.className = 'text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400';
  title.textContent = 'Gestión de Usuarios';
  container.appendChild(title);

  // Filtros
  const filtersSection = document.createElement('div');
  filtersSection.className = 'card p-4 rounded-lg mb-6';
  filtersSection.innerHTML = `
    <div class="flex flex-wrap gap-4 items-center">
      <div class="flex items-center space-x-2">
        <label class="text-sm font-medium">Buscar:</label>
        <input type="text" id="user-search" placeholder="Usuario, email..." class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none">
      </div>
      <div class="flex items-center space-x-2">
        <label class="text-sm font-medium">Rol:</label>
        <select id="role-filter" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none">
          <option value="">Todos</option>
          <option value="user">Usuario</option>
          <option value="admin">Administrador</option>
        </select>
      </div>
      <button id="refresh-users" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors">
        🔄 Actualizar
      </button>
    </div>
  `;
  container.appendChild(filtersSection);

  // Tabla de usuarios
  const tableContainer = document.createElement('div');
  tableContainer.className = 'table-container bg-gray-800/50 rounded-lg overflow-hidden';
  container.appendChild(tableContainer);

  let allUsers = [];

  async function loadUsers() {
    try {
      tableContainer.innerHTML = '<div class="p-8 text-center">Cargando usuarios...</div>';
      
      allUsers = await getUsers();
      renderUsersTable(allUsers);
      
      Toast.show(`${allUsers.length} usuarios cargados`, 'success');
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      tableContainer.innerHTML = `
        <div class="p-8 text-center text-red-400">
          <h3 class="text-lg font-semibold mb-2">Error al cargar usuarios</h3>
          <p class="mb-4">${error.message}</p>
          <button onclick="loadUsers()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors">
            Reintentar
          </button>
        </div>
      `;
    }
  }

  function renderUsersTable(users) {
    if (users.length === 0) {
      tableContainer.innerHTML = '<div class="p-8 text-center text-gray-400">No hay usuarios para mostrar</div>';
      return;
    }
    const table = document.createElement('table');
    table.className = 'w-full';
    
    // Crear el tbody
    const tbody = document.createElement('tbody');
    tbody.className = 'divide-y divide-gray-600';
    
    users.forEach((user, index) => {
      console.log('Usuario:', user);
      
      const row = document.createElement('tr');
      row.className = 'hover:bg-gray-700/50 transition-colors';
      
      row.innerHTML = `
        <td class="px-6 py-4">
          <div class="flex items-center">
            <div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
              ${user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="text-sm font-medium">${user.username}</div>
              <div class="text-xs text-gray-400">${user._id}</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 text-sm">${user.email}</td>
        <td class="px-6 py-4">
          <span class="px-2 py-1 text-xs font-semibold rounded-full ${
            user.role === 'admin' 
              ? 'bg-red-900/50 text-red-400 border border-red-500/30' 
              : 'bg-blue-900/50 text-blue-400 border border-blue-500/30'
          }">
            ${user.role === 'admin' ? '👑 Admin' : '👤 Usuario'}
          </span>
        </td>
        <td class="px-6 py-4 text-sm">
          <span class="px-2 py-1 bg-gray-700 rounded-full">
            ${user.companiesCount || 0} empresa${(user.companiesCount || 0) !== 1 ? 's' : ''}
          </span>
        </td>
        <td class="px-6 py-4">
          <button 
            class="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 transition-colors reset-password-btn"
            title="Resetear contraseña"
            data-user-id="${user._id}"
            data-username="${user.username}"
            data-user-data="${btoa(JSON.stringify({email: user.email, contacts: user.contacts || {}}))}"
          >
            🔐 Reset Password
          </button>
        </td>
      `;
      
      tbody.appendChild(row);
    });
    
    table.innerHTML = `
      <thead class="bg-gray-700">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Usuario</th>
          <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
          <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Rol</th>
          <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Empresas</th>
          <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Acciones</th>
        </tr>
      </thead>
    `;
    
    table.appendChild(tbody);
    tableContainer.innerHTML = '';
    tableContainer.appendChild(table);
    
    // Agregar event listeners a los botones
    const resetButtons = table.querySelectorAll('.reset-password-btn');
    resetButtons.forEach(button => {
      button.addEventListener('click', () => {
        const userId = button.getAttribute('data-user-id');
        const username = button.getAttribute('data-username');
        const userData = JSON.parse(atob(button.getAttribute('data-user-data')));
        
        showResetPasswordModal(userId, username, userData);
      });
    });
  }

  function filterUsers() {
    const searchTerm = document.getElementById('user-search').value.toLowerCase();
    const roleFilter = document.getElementById('role-filter').value;

    const filtered = allUsers.filter(user => {
      const matchesSearch = !searchTerm || 
        user.username.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm);
      
      const matchesRole = !roleFilter || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });

    renderUsersTable(filtered);
  }

  // Configurar eventos
  setTimeout(() => {
    const searchInput = document.getElementById('user-search');
    const roleSelect = document.getElementById('role-filter');
    const refreshButton = document.getElementById('refresh-users');

    if (searchInput) {
      searchInput.addEventListener('input', filterUsers);
    }
    if (roleSelect) {
      roleSelect.addEventListener('change', filterUsers);
    }
    if (refreshButton) {
      refreshButton.addEventListener('click', loadUsers);
    }
  }, 100);

  // Función global para mostrar el modal
  function showResetPasswordModal(userId, username, user) {
    const modal = ResetPasswordModal(userId, username, user);
    document.body.appendChild(modal);
  }

  // Hacer la función disponible globalmente si es necesario
  window.showResetPasswordModal = showResetPasswordModal;

  // Cargar usuarios inicial
  loadUsers();

  return container;
}