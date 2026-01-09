// public/js/ui/pages/UsersPage.js

import apiClient from '../../api/client.js';
import { getUsers } from '../../api/users.js';
import Toast from '../components/Toast.js';
import ResetPasswordModal from '../components/ResetPasswordModal.js';
import { createProfileModal } from '../components/ProfileCard.js';
import { Icons } from '../components/icons.js';
  
export default function UsersPage() {
  const container = document.createElement('div');
  container.className = 'space-y-6 pb-6';

  // Título
  const title = document.createElement('h2');
  title.className = 'text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-1';
  title.textContent = 'Gestión de Usuarios';
  container.appendChild(title);

  const subtitle = document.createElement('p');
  subtitle.className = 'text-gray-400 text-sm md:text-base mb-6';
  subtitle.textContent = 'Administra los usuarios del sistema';
  container.appendChild(subtitle);

  // Estado de paginación
  let allUsers = [];
  let currentPage = 1;
  const usersPerPage = 7;

  // Estadísticas y acciones (responsive)
  const statsAndActions = document.createElement('div');
  statsAndActions.className = 'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6';
  statsAndActions.innerHTML = `
    <div class="grid grid-cols-2 sm:flex sm:items-center sm:space-x-4 gap-3 w-full sm:w-auto">
      <div class="px-3 py-2 bg-gray-800 rounded-lg">
        <div class="text-xs text-gray-400">Total</div>
        <div id="total-users" class="text-lg sm:text-xl font-bold text-white">0</div>
      </div>
      <div class="px-3 py-2 bg-gray-800 rounded-lg">
        <div class="text-xs text-gray-400">Admins</div>
        <div id="admin-count" class="text-lg sm:text-xl font-bold text-purple-400">0</div>
      </div>
      <div class="col-span-2 sm:col-span-1 px-3 py-2 bg-gray-800 rounded-lg">
        <div class="text-xs text-gray-400">Mostrando</div>
        <div id="showing-count" class="text-lg sm:text-xl font-bold text-blue-400">0-0 de 0</div>
      </div>
    </div>
    <div class="flex gap-2 w-full sm:w-auto">
      <button data-action="refresh" class="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all font-medium text-sm w-full sm:w-auto">
        <span class="w-4 h-4 flex-shrink-0 leading-none [&>svg]:w-full [&>svg]:h-full">${Icons.refresh}</span>
        <span class="hidden sm:inline">Recargar</span>
      </button>
    </div>
  `;
  container.appendChild(statsAndActions);

  // Filtros (responsive)
  const filtersSection = document.createElement('div');
  filtersSection.className = 'card p-4 rounded-xl mb-6 bg-gray-800 border border-gray-700';
  filtersSection.innerHTML = `
    <div class="flex flex-col lg:flex-row gap-4">
      <div class="flex-1">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span class="text-gray-400 w-4 h-4 flex-shrink-0 leading-none [&>svg]:w-full [&>svg]:h-full">${Icons.search}</span>
          </div>
          <input type="text" id="user-search" placeholder="Buscar usuario..." 
            class="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-white placeholder-gray-400 text-sm">
        </div>
      </div>
      <div class="flex gap-2">
        <div class="relative flex-1">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span class="text-gray-400 w-4 h-4 flex-shrink-0 leading-none [&>svg]:w-full [&>svg]:h-full">${Icons.filter}</span>
          </div>
          <select id="role-filter" 
            class="w-full pl-10 pr-8 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-white text-sm appearance-none">
            <option value="">Todos los roles</option>
            <option value="admin">Administradores</option>
            <option value="user">Usuarios</option>
          </select>
        </div>
      </div>
    </div>
  `;
  container.appendChild(filtersSection);

  // Contenedor de tabla (responsive)
  const tableContainer = document.createElement('div');
  tableContainer.className = 'card overflow-hidden rounded-xl border border-gray-700 bg-gray-800';
  
  const tableWrapper = document.createElement('div');
  tableWrapper.className = 'overflow-x-auto -mx-4 sm:mx-0';
  
  const usersTable = document.createElement('table');
  usersTable.className = 'min-w-full divide-y divide-gray-700 text-sm md:text-base';
  usersTable.innerHTML = `
    <thead class="bg-gray-900/50">
      <tr>
        <th scope="col" class="px-4 py-3 text-left font-semibold text-gray-300 uppercase tracking-wider text-xs">Usuario</th>
        <th scope="col" class="px-4 py-3 text-left font-semibold text-gray-300 uppercase tracking-wider text-xs hidden md:table-cell">Rol</th>
        <th scope="col" class="px-4 py-3 text-left font-semibold text-gray-300 uppercase tracking-wider text-xs">Proyectos</th>
        <th scope="col" class="px-4 py-3 text-left font-semibold text-gray-300 uppercase tracking-wider text-xs hidden sm:table-cell">Empresas</th>
        <th scope="col" class="px-4 py-3 text-left font-semibold text-gray-300 uppercase tracking-wider text-xs">Acciones</th>
      </tr>
    </thead>
    <tbody id="users-table-body" class="divide-y divide-gray-700">
      <!-- Los usuarios se cargarán aquí -->
    </tbody>
  `;
  
  tableWrapper.appendChild(usersTable);
  tableContainer.appendChild(tableWrapper);
  container.appendChild(tableContainer);

  // Controles de paginación
  const paginationContainer = document.createElement('div');
  paginationContainer.className = 'flex flex-col sm:flex-row items-center justify-between gap-4 mt-6';
  paginationContainer.innerHTML = `
    <div class="text-sm text-gray-400" id="pagination-info">
      Mostrando 0-0 de 0 usuarios
    </div>
    <div class="flex items-center space-x-2">
      <button id="prev-page" class="flex items-center justify-center p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
        <span class="w-5 h-5 flex-shrink-0 leading-none [&>svg]:w-full [&>svg]:h-full">${Icons.chevronLeft}</span>
      </button>
      <div class="flex items-center space-x-1">
        <span id="current-page" class="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm">1</span>
        <span class="text-gray-400">de</span>
        <span id="total-pages" class="px-3 py-1 bg-gray-800 text-gray-300 rounded-lg text-sm">1</span>
      </div>
      <button id="next-page" class="flex items-center justify-center p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
        <span class="w-5 h-5 flex-shrink-0 leading-none [&>svg]:w-full [&>svg]:h-full">${Icons.chevronRight}</span>
      </button>
    </div>
  `;
  container.appendChild(paginationContainer);

  function updateStats(users, filteredUsers, currentPage) {
    const totalUsers = users.length;
    const adminCount = users.filter(user => user.role === 'admin').length;
    
    // Calcular índices para mostrar
    const startIndex = (currentPage - 1) * usersPerPage + 1;
    const endIndex = Math.min(currentPage * usersPerPage, filteredUsers.length);
    
    document.getElementById('total-users').textContent = totalUsers;
    document.getElementById('admin-count').textContent = adminCount;
    document.getElementById('showing-count').textContent = `${startIndex}-${endIndex} de ${filteredUsers.length}`;
    
    // Actualizar info de paginación
    document.getElementById('pagination-info').textContent = 
      `Mostrando ${startIndex}-${endIndex} de ${filteredUsers.length} usuarios`;
    document.getElementById('current-page').textContent = currentPage;
    document.getElementById('total-pages').textContent = Math.ceil(filteredUsers.length / usersPerPage);
    
    // Habilitar/deshabilitar botones
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = endIndex >= filteredUsers.length;
  }

  async function loadUsers() {
    const tableBody = document.getElementById('users-table-body');
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-8 text-center">
          <div class="flex flex-col items-center justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p class="text-gray-300">Cargando usuarios...</p>
          </div>
        </td>
      </tr>
    `;
    
    try {
      allUsers = await getUsers();
      currentPage = 1;
      filterAndRenderUsers();
      Toast.show(`${allUsers.length} usuarios cargados`, 'success');
    } catch (error) {
      console.error('Error:', error);
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="px-6 py-8 text-center">
            <div class="flex flex-col items-center justify-center">
              <div class="text-red-500 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-red-400 mb-2">Error al cargar</h3>
              <p class="text-gray-400 mb-4">${error.message || 'Error desconocido'}</p>
              <button data-action="refresh" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                Reintentar
              </button>
            </div>
          </td>
        </tr>
      `;
    }
  }

  function filterAndRenderUsers() {
    const search = document.getElementById('user-search')?.value.toLowerCase() || '';
    const role = document.getElementById('role-filter')?.value || '';

    const filtered = allUsers.filter(user => {
      const matchSearch = !search || 
        user.username?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        (user._id && user._id.toLowerCase().includes(search));
      const matchRole = !role || user.role === role;
      return matchSearch && matchRole;
    });

    renderUsersTable(filtered, currentPage);
    updateStats(allUsers, filtered, currentPage);
  }

  function renderUsersTable(users, page) {
    const tableBody = document.getElementById('users-table-body');
    
    if (users.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="px-6 py-12 text-center">
            <div class="flex flex-col items-center justify-center">
              <div class="w-16 h-16 text-gray-500 mb-4 flex-shrink-0 leading-none [&>svg]:w-full [&>svg]:h-full">
                ${Icons.user}
              </div>
              <h3 class="text-lg font-semibold text-gray-300 mb-2">No hay usuarios</h3>
              <p class="text-gray-400">No se encontraron usuarios con los filtros aplicados.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    // Calcular usuarios para la página actual
    const startIndex = (page - 1) * usersPerPage;
    const endIndex = Math.min(startIndex + usersPerPage, users.length);
    const pageUsers = users.slice(startIndex, endIndex);

    tableBody.innerHTML = pageUsers.map(user => {
      const projectCount = user.projectsCount || 0;
      const companyCount = user.companiesCount || 0;
      const userIdShort = user._id ? user._id.slice(-6) : 'N/A';
      
      return `
        <tr class="hover:bg-gray-700/30 transition-colors duration-150">
          <!-- Usuario (mobile first) -->
          <td class="px-4 py-3">
            <div class="flex items-center">
              <div class="flex-shrink-0 h-8 w-8 md:h-10 md:w-10">
                ${user.photo ? `
                  <img class="h-8 w-8 md:h-10 md:w-10 rounded-lg object-cover" src="${user.photo}" alt="${user.username}">
                ` : `
                  <div class="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs md:text-sm">
                    ${user.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                `}
              </div>
              <div class="ml-3">
                <div class="font-medium text-white text-sm md:text-base truncate max-w-[150px]">
                  ${user.username || '—'}
                </div>
                <div class="flex items-center gap-2.5 mt-0.5 text-xs text-gray-400">
                  <span class="w-3 h-3 flex-shrink-0 leading-none [&>svg]:w-full [&>svg]:h-full opacity-70">
                    ${Icons.email}
                  </span>
                  <span class="truncate max-w-[120px] md:max-w-[180px]">${user.email || '—'}</span>
                </div>
                <div class="md:hidden text-xs text-gray-500 mt-1">ID: ${userIdShort}</div>
              </div>
            </div>
          </td>
          
          <!-- Rol (oculto en móvil) -->
          <td class="px-4 py-3 hidden md:table-cell">
            <div class="flex items-center gap-2">
              <span class="w-4 h-4 flex-shrink-0 leading-none [&>svg]:w-full [&>svg]:h-full ${user.role === 'admin' ? 'text-purple-400' : 'text-blue-400'}">
                ${user.role === 'admin' ? Icons.admin : Icons.regularUser}
              </span>
              <span class="text-sm ${user.role === 'admin' ? 'text-purple-300' : 'text-blue-300'}">
                ${user.role === 'admin' ? 'Admin' : 'Usuario'}
              </span>
            </div>
          </td>
          
          <!-- Proyectos -->
          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
              <span class="w-4 h-4 flex-shrink-0 leading-none [&>svg]:w-full [&>svg]:h-full text-yellow-400">${Icons.projects}</span>
              <span class="font-medium text-white">${projectCount}</span>
            </div>
          </td>
          
          <!-- Empresas (oculto en móvil pequeño) -->
          <td class="px-4 py-3 hidden sm:table-cell">
            <div class="flex items-center gap-2">
              <span class="w-4 h-4 flex-shrink-0 leading-none [&>svg]:w-full [&>svg]:h-full text-cyan-400">${Icons.company}</span>
              <span class="font-medium text-white">${companyCount}</span>
            </div>
          </td>
                    
          <!-- Acciones -->
          <td class="px-4 py-3">
            <div class="flex items-center gap-1">
              <button 
                data-action="view-details" 
                data-id="${user._id}"
                class="inline-flex items-center justify-center p-1.5 md:p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 border border-blue-700 hover:border-blue-500 transition-colors"
                title="Ver perfil"
              >
                <span class="w-4 h-4 flex-shrink-0 leading-none [&>svg]:w-full [&>svg]:h-full">
                  ${Icons.view}
                </span>
              </button>
              <button 
                data-action="reset-password" 
                data-id="${user._id}"
                data-username="${user.username}"
                data-email="${user.email}"
                class="inline-flex items-center justify-center p-1.5 md:p-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 border border-purple-700 hover:border-purple-500 transition-colors"
                title="Restablecer contraseña"
              >
                <span class="w-4 h-4 flex-shrink-0 leading-none [&>svg]:w-full [&>svg]:h-full">
                  ${Icons.resetPassword}
                </span>
              </button>
              <button 
                data-action="delete-user" 
                data-id="${user._id}"
                data-username="${user.username}"
                class="inline-flex items-center justify-center p-1.5 md:p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 border border-red-700 hover:border-red-500 transition-colors"
                title="Eliminar usuario"
              >
                <span class="w-4 h-4 flex-shrink-0 leading-none [&>svg]:w-full [&>svg]:h-full">
                  ${Icons.trash || '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>'}
                </span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function goToPage(page) {
    currentPage = page;
    filterAndRenderUsers();
    // Scroll suave hacia arriba en móvil
    if (window.innerWidth < 768) {
      tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  function showDeleteUserModal(userId, username) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm';
    modal.innerHTML = `
      <div class="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-red-500/30 animate-scale-in">
        <!-- Header -->
        <div class="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-t-xl">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-white">Eliminar Usuario</h3>
              <p class="text-red-100 text-sm">Esta acción es irreversible</p>
            </div>
          </div>
        </div>
  
        <!-- Content -->
        <div class="p-6 space-y-4">
          <p class="text-gray-300">
            ¿Estás seguro de eliminar al usuario <strong class="text-white">"${username}"</strong>?
          </p>
          
          <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div class="flex gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <div class="text-sm text-yellow-200">
                <p class="font-semibold mb-1">Consecuencias:</p>
                <ul class="space-y-1 text-yellow-300/90">
                  <li>• Si es dueño de empresas, se transferirán al primer miembro</li>
                  <li>• Será removido de todas las empresas</li>
                  <li>• Sus comentarios serán eliminados</li>
                  <li>• Sus proyectos quedarán como huérfanos</li>
                </ul>
              </div>
            </div>
          </div>
  
          <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p class="text-red-300 text-sm font-medium flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              Esta acción NO se puede deshacer
            </p>
          </div>
        </div>
  
        <!-- Actions -->
        <div class="flex gap-3 p-6 bg-gray-900/50 rounded-b-xl">
          <button 
            data-action="cancel-delete"
            class="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button 
            data-action="confirm-delete"
            data-user-id="${userId}"
            class="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-red-500/20"
          >
            Eliminar Usuario
          </button>
        </div>
      </div>
    `;
  
    // Eventos del modal
    modal.querySelector('[data-action="cancel-delete"]').addEventListener('click', () => {
      modal.remove();
    });
  
    modal.querySelector('[data-action="confirm-delete"]').addEventListener('click', async (e) => {
      const btn = e.target;
      const originalText = btn.textContent;
      
      try {
        btn.disabled = true;
        btn.textContent = 'Eliminando...';
        
        await apiClient.deleteUser(userId);
        Toast.show('Usuario eliminado exitosamente', 'success');
        modal.remove();
        await loadUsers();
      } catch (err) {
        Toast.show(err.message || 'Error al eliminar usuario', 'error');
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });
  
    // Cerrar al hacer clic fuera
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  
    document.body.appendChild(modal);
  }
  // Configurar eventos
  function setupEventListeners() {
    // Evento global para acciones
    document.body.addEventListener('click', async (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      const id = e.target.closest('[data-action]')?.dataset.id;
      const username = e.target.closest('[data-action]')?.dataset.username;
      const email = e.target.closest('[data-action]')?.dataset.email;
      
      if (!action) return;

      switch (action) {
        case 'refresh':
          await loadUsers();
          break;
        case 'view-details':
          if (id) {
            try {
              const user = await apiClient.getUser(id);
              const modal = createProfileModal(user);
              document.body.appendChild(modal);
            } catch (err) {
              Toast.show('Error al cargar perfil', 'error');
            }
          }
          break;
        case 'reset-password':
          if (id) {
            const modal = ResetPasswordModal(id, username, { email, contacts: {} });
            document.body.appendChild(modal);
          }
          break;
        case 'close-modal':
          // Busca el ancestro más cercano con las clases fijas que sabes que están
          const modalOverlay = e.target.closest('.fixed.inset-0.z-50');
          if (modalOverlay) modalOverlay.remove();
          break;
        case 'delete-user':
          if (id) {
            const username = e.target.closest('[data-action]')?.dataset.username;
            showDeleteUserModal(id, username);
          }
          break;
      }
    });

    // Paginación
    document.getElementById('prev-page')?.addEventListener('click', () => {
      if (currentPage > 1) goToPage(currentPage - 1);
    });

    document.getElementById('next-page')?.addEventListener('click', () => {
      const totalFiltered = allUsers.filter(user => {
        const search = document.getElementById('user-search')?.value.toLowerCase() || '';
        const role = document.getElementById('role-filter')?.value || '';
        
        const matchSearch = !search || 
          user.username?.toLowerCase().includes(search) ||
          user.email?.toLowerCase().includes(search);
        const matchRole = !role || user.role === role;
        return matchSearch && matchRole;
      }).length;
      
      const totalPages = Math.ceil(totalFiltered / usersPerPage);
      if (currentPage < totalPages) goToPage(currentPage + 1);
    });

    // Filtros
    const searchInput = document.getElementById('user-search');
    const roleFilter = document.getElementById('role-filter');
    
    let filterTimeout;
    searchInput?.addEventListener('input', () => {
      clearTimeout(filterTimeout);
      filterTimeout = setTimeout(() => {
        currentPage = 1;
        filterAndRenderUsers();
      }, 300);
    });
    
    roleFilter?.addEventListener('change', () => {
      currentPage = 1;
      filterAndRenderUsers();
    });
  }

  // Inicializar
  setTimeout(() => {
    setupEventListeners();
    loadUsers();
  }, 0);

  return container;
}