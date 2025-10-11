import ApiClient from '../../api/client.js';
import Toast from '../components/Toast.js';
import { fetchCompanies, verifyCompany, getCompanyRankings } from '../../api/companies.js';
import MemberRolesEditor from '../components/MemberRolesEditor.js';

export default function CompaniesPage() {
  const container = document.createElement('div');
  container.className = 'space-y-6';

  const title = document.createElement('h2');
  title.className = 'text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400';
  title.textContent = 'Gestión de Empresas';
  container.appendChild(title);

  // ✅ AGREGAR TABS AQUÍ (ANTES DE actionsSection)
  const tabsSection = document.createElement('div');
  tabsSection.className = 'flex gap-2 border-b border-gray-700 mb-6';
  tabsSection.innerHTML = `
    <button 
      data-tab="companies" 
      class="tab-btn px-6 py-3 text-sm font-semibold transition-all duration-200 border-b-2 border-purple-500 text-purple-400"
    >
      📋 Empresas
    </button>
    <button 
      data-tab="rankings" 
      class="tab-btn px-6 py-3 text-sm font-semibold transition-all duration-200 border-b-2 border-transparent text-gray-400 hover:text-white"
    >
      🏆 Rankings Top 30
    </button>
  `;
  container.appendChild(tabsSection);

  // Botones de acción
  const actionsSection = document.createElement('div');
  actionsSection.className = 'flex gap-4 mb-6';
  actionsSection.innerHTML = `
    <button data-action="new-company" class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors font-medium">
      + Nueva Empresa
    </button>
    <button data-action="refresh" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium">
      ↻ Recargar
    </button>
  `;
  container.appendChild(actionsSection);

  // Filtros y búsqueda
  const filtersSection = document.createElement('div');
  filtersSection.className = 'card p-4 rounded-lg mb-6';
  filtersSection.innerHTML = `
    <div class="flex flex-wrap gap-4 items-center">
      <div class="flex items-center space-x-2">
        <label class="text-sm font-medium">Buscar:</label>
        <input type="text" id="company-search" placeholder="Nombre de empresa..." class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none">
      </div>
      <div class="flex items-center space-x-2">
        <label class="text-sm font-medium">Miembros:</label>
        <select id="members-filter" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none">
          <option value="">Todas</option>
          <option value="1">1 miembro</option>
          <option value="2-5">2-5 miembros</option>
          <option value="6+">6+ miembros</option>
        </select>
      </div>
    </div>
  `;
  container.appendChild(filtersSection);

  // Grid de empresas
  const companiesGrid = document.createElement('div');
  companiesGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
  container.appendChild(companiesGrid);
  let currentView = 'companies';
  let rankedCompanies = [];
  let allCompanies = [];

  async function loadCompanies() {
    try {
      companiesGrid.innerHTML = `
        <div class="col-span-full flex items-center justify-center p-8">
          <div class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p>Cargando empresas...</p>
          </div>
        </div>
      `;
      allCompanies = await fetchCompanies(); // Cambiar a fetchCompanies
      console.log('Empresas obtenidas:', allCompanies); // Debug
      renderCompaniesGrid(allCompanies);
      Toast.show(`${allCompanies.length} empresas cargadas`, 'success');
    } catch (error) {
      console.error('Error al cargar empresas:', error.message, error.stack); // Debug detallado
      companiesGrid.innerHTML = `
        <div class="col-span-full p-8 text-center text-red-400">
          <h3 class="text-lg font-semibold mb-2">Error al cargar empresas</h3>
          <p class="mb-4">${error.message}</p>
          <button data-action="refresh" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors">
            Reintentar
          </button>
        </div>
      `;
    }
  }

  function renderCompaniesGrid(companies) {
    if (companies.length === 0) {
      companiesGrid.innerHTML = `
        <div class="col-span-full p-8 text-center text-gray-400">
          <div class="text-6xl mb-4">🏢</div>
          <h3 class="text-lg font-semibold mb-2">No hay empresas</h3>
          <p>No se encontraron empresas con los filtros aplicados</p>
        </div>
      `;
      return;
    }

    companiesGrid.innerHTML = companies.map(company => {
      const ownerName = company.ownerId?.username || 'Propietario desconocido';
      const memberCount = company.members?.length || 0;
      const projectCount = company.projects?.length || 0;
      const createdDate = new Date(company.createdAt).toLocaleDateString('es-ES');
      const isVerified = company.isVerified || false;
      const ranking = company.ranking || null;
    
      return `
        <div class="card p-6 rounded-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 relative ${isVerified ? 'ring-2 ring-green-500/30' : ''}">
          
          <!-- Badge de Ranking en esquina superior derecha -->
          ${ranking ? `
            <div class="absolute top-3 right-3 px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
              🏆 Top ${ranking}
            </div>
          ` : ''}
    
          <div class="flex items-center justify-between mb-4">
            ${company.photo ? `
              <img src="${company.photo}" alt="${company.name}" class="w-12 h-12 rounded-lg object-cover">
            ` : `
              <div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                ${company.name.charAt(0).toUpperCase()}
              </div>
            `}
            <div class="text-right flex flex-col gap-1">
              ${isVerified ? '<span class="text-green-400 text-xl" title="Empresa Verificada">✓</span>' : ''}
              <span class="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded-full">
                ID: ${company._id.slice(-6)}
              </span>
              ${company.code ? `
                <span class="px-2 py-1 text-xs bg-green-700 text-green-300 rounded-full">
                  ${company.code}
                </span>
              ` : ''}
            </div>
          </div>
          
          <h3 class="text-lg font-semibold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            ${company.name}
          </h3>
          
          <div class="space-y-2 mb-4">
            <div class="flex items-center text-sm text-gray-400">
              <span class="w-4 h-4 mr-2">👤</span>
              <span>Owner: ${ownerName}</span>
            </div>
            <div class="flex items-center text-sm text-gray-400">
              <span class="w-4 h-4 mr-2">👥</span>
              <span>${memberCount} miembro${memberCount !== 1 ? 's' : ''}</span>
            </div>
            <div class="flex items-center text-sm text-gray-400">
              <span class="w-4 h-4 mr-2">📁</span>
              <span>${projectCount} proyecto${projectCount !== 1 ? 's' : ''}</span>
            </div>
            <div class="flex items-center text-sm text-gray-400">
              <span class="w-4 h-4 mr-2">📅</span>
              <span>Creada: ${createdDate}</span>
            </div>
          </div>
          
          <div class="flex gap-2 mb-3">
            <button 
              data-action="view-details" 
              data-id="${company._id}"
              class="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 transition-colors"
            >
              👁️ Detalles
            </button>
            <button 
              data-action="manage-members" 
              data-id="${company._id}"
              class="flex-1 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-500 transition-colors"
            >
              👥 Miembros
            </button>
            <button 
              data-action="delete-company" 
              data-id="${company._id}"
              data-name="${company.name}"
              class="px-2 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-500 transition-colors"
              title="Eliminar empresa"
            >
              🗑️
            </button>
          </div>
    
          <!-- Botón Verificar/Quitar Verificación -->
          <button 
            data-action="toggle-verify" 
            data-id="${company._id}"
            data-verified="${isVerified}"
            class="w-full px-3 py-2 ${isVerified ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-green-600 hover:bg-green-500'} text-white text-sm font-semibold rounded-lg transition-all duration-200"
          >
            ${isVerified ? '❌ Quitar Verificación' : '✓ Verificar Empresa'}
          </button>
        </div>
      `;
    }).join('');
  }

  function filterCompanies() {
    const searchTerm = document.getElementById('company-search').value.toLowerCase();
    const membersFilter = document.getElementById('members-filter').value;

    const filtered = allCompanies.filter(company => {
      const matchesSearch = !searchTerm || 
        company.name.toLowerCase().includes(searchTerm) ||
        (company.ownerId?.username || '').toLowerCase().includes(searchTerm);
      
      let matchesMembers = true;
      const memberCount = company.members?.length || 0;
      if (membersFilter) {
        if (membersFilter === '1') {
          matchesMembers = memberCount === 1;
        } else if (membersFilter === '2-5') {
          matchesMembers = memberCount >= 2 && memberCount <= 5;
        } else if (membersFilter === '6+') {
          matchesMembers = memberCount >= 6;
        }
      }

      return matchesSearch && matchesMembers;
    });

    renderCompaniesGrid(filtered);
  }
  async function loadRankings() {
    try {
      companiesGrid.innerHTML = `
        <div class="col-span-full flex items-center justify-center p-8">
          <div class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p>Cargando rankings...</p>
          </div>
        </div>
      `;
      rankedCompanies = await getCompanyRankings();
      renderRankingsGrid(rankedCompanies);
    } catch (error) {
      companiesGrid.innerHTML = `
        <div class="col-span-full p-8 text-center text-red-400">
          <h3 class="text-lg font-semibold mb-2">Error al cargar rankings</h3>
          <p>${error.message}</p>
        </div>
      `;
    }
  }
  
  function renderRankingsGrid(companies) {
    if (companies.length === 0) {
      companiesGrid.innerHTML = `
        <div class="col-span-full p-8 text-center text-gray-400">
          <div class="text-6xl mb-4">🏆</div>
          <h3 class="text-lg font-semibold mb-2">No hay empresas en el ranking</h3>
          <p>El sistema calculará los rankings automáticamente cada 24 horas</p>
        </div>
      `;
      return;
    }
  
    companiesGrid.className = 'space-y-4'; // Cambiar a lista vertical
  
    companiesGrid.innerHTML = companies.map((company, index) => `
      <div class="card p-6 rounded-lg flex items-center gap-6 hover:shadow-xl transition-all">
        <!-- Medalla/Posición -->
        <div class="flex-shrink-0">
          <div class="w-16 h-16 rounded-full ${
            index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 
            index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' : 
            index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800' : 
            'bg-gradient-to-br from-gray-700 to-gray-900'
          } flex items-center justify-center font-bold text-2xl text-white shadow-lg">
            ${index < 3 ? (index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉') : company.ranking}
          </div>
        </div>
  
        <!-- Foto -->
        ${company.photo ? `
          <img src="${company.photo}" alt="${company.name}" class="w-16 h-16 rounded-lg object-cover shadow-md">
        ` : `
          <div class="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white text-2xl font-bold shadow-md">
            ${company.name.charAt(0).toUpperCase()}
          </div>
        `}
  
        <!-- Info -->
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <h3 class="text-xl font-bold text-white">${company.name}</h3>
            ${company.isVerified ? '<span class="text-green-400 text-xl">✓</span>' : ''}
          </div>
          ${company.description ? `
            <p class="text-sm text-gray-400 mb-2">${company.description}</p>
          ` : ''}
          <div class="flex items-center gap-4 text-xs text-gray-500">
            <span>📊 Score: ${company.rankingScore?.toFixed(2) || 0}</span>
            <span>👤 Owner: ${company.ownerId?.username || 'N/A'}</span>
          </div>
        </div>
  
        <!-- Acciones -->
        <div class="flex gap-2">
          <button 
            data-action="view-details" 
            data-id="${company._id}"
            class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500"
          >
            👁️ Ver
          </button>
        </div>
      </div>
    `).join('');
  }
  function showCompanyModal(company = null) {
    const isEdit = !!company;
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    modal.innerHTML = `
      <div class="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
        <h3 class="text-lg font-bold mb-4">${isEdit ? 'Editar' : 'Nueva'} Empresa</h3>
        
        <form id="company-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Nombre</label>
            <input 
              type="text" 
              name="name" 
              value="${company?.name || ''}"
              placeholder="Ej: TechCorp"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:border-purple-500 focus:outline-none"
              required
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Foto (PNG/JPG, máx. 50KB)</label>
            <input 
              type="file" 
              name="photo" 
              accept="image/png,image/jpeg"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:border-purple-500 focus:outline-none"
            >
            ${isEdit && company?.photo ? `
              <div class="mt-2">
                <img src="${company.photo}" alt="Current photo" class="w-24 h-24 object-cover rounded">
                <button type="button" data-action="remove-photo" class="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-500">
                  Eliminar Foto
                </button>
              </div>
            ` : ''}
          </div>

          ${isEdit && company?.members?.length > 1 ? `
            <div>
              <label class="block text-sm font-medium mb-1">Transferir Propietario</label>
              <select name="newOwnerId" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:border-purple-500 focus:outline-none">
                <option value="">No cambiar propietario</option>
                ${company.members
                  .filter(member => !member.roles.includes('Owner'))
                  .map(member => `
                    <option value="${member.userId?._id || member.userId}">
                      ${member.userId?.username || 'Usuario desconocido'}
                    </option>
                  `).join('')}
              </select>
            </div>
          ` : ''}

          <div class="flex gap-3 pt-4">
            <button 
              type="submit"
              class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500"
            >
              ${isEdit ? 'Actualizar' : 'Crear'}
            </button>
            <button 
              type="button"
              data-action="close-modal"
              class="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);

    const form = modal.querySelector('#company-form');
    const photoInput = modal.querySelector('input[name="photo"]');
    let removePhoto = false;

    // Validar la foto al seleccionar
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (!['image/png', 'image/jpeg'].includes(file.type)) {
          Toast.show('La foto debe ser PNG o JPG', 'error');
          e.target.value = '';
          return;
        }
        if (file.size > 50 * 1024) {
          Toast.show('La foto no debe exceder 50KB', 'error');
          e.target.value = '';
          return;
        }
      }
    });

    // Manejar eliminación de foto
    const removePhotoButton = modal.querySelector('[data-action="remove-photo"]');
    if (removePhotoButton) {
      removePhotoButton.addEventListener('click', () => {
        removePhoto = true;
        photoInput.value = ''; // Limpiar el input de archivo
        removePhotoButton.disabled = true; // Deshabilitar el botón para evitar clics repetidos
        Toast.show('Foto marcada para eliminación', 'info');
      });
    }

    // Manejar envío del formulario
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);

      try {
        // Si hay una foto seleccionada, convertirla a Base64
        if (photoInput.files[0]) {
          await new Promise((resolve, reject) => {
            const file = photoInput.files[0];
            const reader = new FileReader();
            reader.onload = () => {
              data.photo = reader.result; // Añadir la foto en Base64
              resolve();
            };
            reader.onerror = () => {
              reject(new Error('Error al leer la foto'));
            };
            reader.readAsDataURL(file);
          });
        } else if (isEdit && removePhoto) {
          data.photo = ''; // Enviar cadena vacía para eliminar la foto
        } else {
          delete data.photo; // No incluir photo si no se cambió
        }

        // Enviar la solicitud
        if (isEdit) {
          console.log('Enviando actualización:', data); // Debug
          await ApiClient.updateCompany(company._id, data);
          Toast.show('Empresa actualizada correctamente', 'success');
        } else {
          console.log('Enviando creación:', data); // Debug
          await ApiClient.createCompany(data);
          Toast.show('Empresa creada correctamente', 'success');
        }
        modal.remove();
        await loadCompanies();
      } catch (error) {
        console.error('Error al procesar el formulario:', error.message); // Debug
        Toast.show(`Error: ${error.message}`, 'error');
      }
    });
  }

  function showCompanyDetailsModal(company) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    const ownerName = company.ownerId?.username || 'N/A';
    
    modal.innerHTML = `
      <div class="bg-gray-800 p-6 rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            Detalles de ${company.name}
          </h3>
          <button data-action="close-modal" class="text-gray-400 hover:text-white">✕</button>
        </div>
        
        <div class="space-y-3">
          ${company.photo ? `
            <div>
              <strong>Foto:</strong>
              <img src="${company.photo}" alt="${company.name}" class="w-32 h-32 object-cover rounded mt-2">
            </div>
          ` : ''}
          <p><strong>ID:</strong> ${company._id}</p>
          <p><strong>Nombre:</strong> ${company.name}</p>
          <p><strong>Propietario:</strong> ${ownerName}</p>
          <p><strong>Código de invitación:</strong> ${company.code || 'N/A'}</p>
          <p><strong>Miembros:</strong> ${company.members?.length || 0}</p>
          <p><strong>Creada:</strong> ${new Date(company.createdAt).toLocaleDateString('es-ES')}</p>
          
          ${company.members?.length > 0 ? `
            <div>
              <strong>Lista de miembros:</strong>
              <ul class="mt-2 space-y-1">
                ${company.members.map(member => `
                  <li class="text-sm bg-gray-700 p-2 rounded">
                    ${member.userId?.username || 'Usuario desconocido'} - Roles: ${member.roles.join(', ') || 'Ninguno'}
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
        <div class="flex gap-3 mt-4">
          <button 
            data-action="edit-company" 
            data-id="${company._id}"
            class="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500"
          >
            Editar
          </button>
          <button 
            data-action="delete-company" 
            data-id="${company._id}"
            data-name="${company.name}"
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500"
          >
            Eliminar
          </button>
          <button 
            data-action="close-modal"
            class="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
          >
            Cerrar
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  function showMembersModal(company) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-gray-800 p-6 rounded-lg max-w-lg w-full mx-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            Miembros de ${company.name}
          </h3>
          <button data-action="close-modal" class="text-gray-400 hover:text-white">✕</button>
        </div>
        
        <div class="space-y-3">
          ${company.members?.length > 0 ? `
            <div class="max-h-64 overflow-y-auto space-y-2">
              ${company.members.map(member => {
                const memberName = member.userId?.username || 'Usuario desconocido';
                const memberId = member.userId?._id || member.userId;
                
                return `
                  <div class="bg-gray-700 p-3 rounded-lg flex justify-between items-center">
                    <div>
                      <p class="font-semibold">${memberName}</p>
                      <p class="text-sm text-gray-400">Roles: ${member.roles.join(', ') || 'Ninguno'}</p>
                    </div>
                    <div class="flex gap-2">
                      <button 
                        data-action="edit-member" 
                        data-id="${company._id}"
                        data-member-id="${memberId}"
                        class="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500"
                      >
                        Editar
                      </button>
                      ${!member.roles.includes('Owner') ? `
                        <button 
                          data-action="remove-member" 
                          data-id="${company._id}"
                          data-member-id="${memberId}"
                          class="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-500"
                        >
                          Eliminar
                        </button>
                      ` : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <p class="text-gray-400">No hay miembros en esta empresa</p>
          `}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Configurar eventos
  function setupEventListeners() {
    document.body.addEventListener('click', async (e) => {
      const action = e.target.dataset.action;
      const id = e.target.dataset.id;
      const memberId = e.target.dataset.memberId;

      if (!action) return;

      switch (action) {
        case 'new-company':
          showCompanyModal();
          break;
        case 'refresh':
          await loadCompanies();
          break;
        case 'view-details':
          if (id) {
            try {
              const company = await ApiClient.getCompany(id); // Usar getCompany en lugar de getProjectBySlug
              showCompanyDetailsModal(company);
            } catch (error) {
              Toast.show(`Error: ${error.message}`, 'error');
            }
          }
          break;
        case 'manage-members':
          if (id) {
            try {
              const company = await ApiClient.getCompany(id);
              showMembersModal(company);
            } catch (error) {
              Toast.show(`Error: ${error.message}`, 'error');
            }
          }
          break;
        case 'edit-company':
          if (id) {
            try {
              const company = await ApiClient.getCompany(id);
              showCompanyModal(company);
            } catch (error) {
              Toast.show(`Error: ${error.message}`, 'error');
            }
          }
          break;
        case 'delete-company':
          if (id) {
            const companyName = e.target.dataset.name;
            const confirmModal = document.createElement('div');
            confirmModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            confirmModal.innerHTML = `
              <div class="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
                <div class="text-center">
                  <div class="text-red-400 text-4xl mb-4">⚠️</div>
                  <h3 class="text-lg font-bold mb-2">Confirmar Eliminación</h3>
                  <p class="text-gray-300 mb-4">
                    ¿Estás seguro de que quieres eliminar la empresa <strong>"${companyName}"</strong>?
                  </p>
                  <p class="text-sm text-gray-400 mb-6">
                    Esta acción no se puede deshacer. Se eliminarán todos los proyectos asociados y se actualizarán los contadores de todos los miembros.
                  </p>
                  
                  <div class="flex gap-3">
                    <button 
                      data-action="confirm-delete-company" 
                      data-id="${id}"
                      class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500"
                    >
                      Sí, Eliminar
                    </button>
                    <button 
                      data-action="close-modal"
                      class="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            `;
            document.body.appendChild(confirmModal);
          }
          break;
        case 'confirm-delete-company':
          if (id) {
            try {
              const result = await ApiClient.deleteCompany(id);
              Toast.show('Empresa eliminada correctamente', 'success');
              const modal = e.target.closest('.fixed.inset-0');
              if (modal) modal.remove();
              await loadCompanies(); // Recargar la lista
            } catch (error) {
              Toast.show(`Error al eliminar: ${error.message}`, 'error');
            }
          }
          break;
        case 'edit-member':
          if (id && memberId) {
            try {
              const company = await ApiClient.getCompany(id);
              const member = company.members.find(m => (m.userId?._id || m.userId) === memberId);
              if (!member) {
                Toast.show('Miembro no encontrado', 'error');
                return;
              }
              const modal = document.createElement('div');
              modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
              modal.innerHTML = `
                <div class="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
                  <div id="member-roles-editor"></div>
                </div>
              `;
              document.body.appendChild(modal);
              const editorContainer = modal.querySelector('#member-roles-editor');
              const editor = MemberRolesEditor(member, async (data) => {
                try {
                  await ApiClient.updateMemberRoles(id, memberId, data);
                  Toast.show('Roles actualizados correctamente', 'success');
                  modal.remove();
                  await loadCompanies();
                } catch (error) {
                  Toast.show(`Error: ${error.message}`, 'error');
                }
              });
              editorContainer.appendChild(editor);
            } catch (error) {
              Toast.show(`Error: ${error.message}`, 'error');
            }
          }
          break;
        case 'remove-member':
          if (id && memberId) {
            try {
              const company = await ApiClient.getCompany(id);
              const member = company.members.find(m => (m.userId?._id || m.userId) === memberId);
              if (!member) {
                Toast.show('Miembro no encontrado', 'error');
                return;
              }
              const memberName = member.userId?.username || 'Usuario desconocido';
              const confirmModal = document.createElement('div');
              confirmModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
              confirmModal.innerHTML = `
                <div class="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
                  <div class="text-center">
                    <div class="text-red-400 text-4xl mb-4">⚠️</div>
                    <h3 class="text-lg font-bold mb-2">Confirmar Eliminación</h3>
                    <p class="text-gray-300 mb-4">
                      ¿Estás seguro de que quieres eliminar a <strong>${memberName}</strong> de la empresa?
                    </p>
                    <p class="text-sm text-gray-400 mb-6">Esta acción no se puede deshacer.</p>
                    
                    <div class="flex gap-3">
                      <button 
                        data-action="confirm-remove-member" 
                        data-id="${id}"
                        data-member-id="${memberId}"
                        class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500"
                      >
                        Sí, Eliminar
                      </button>
                      <button 
                        data-action="close-modal"
                        class="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              `;
              document.body.appendChild(confirmModal);
            } catch (error) {
              Toast.show(`Error: ${error.message}`, 'error');
            }
          }
          break;
        case 'confirm-remove-member':
          if (id && memberId) {
            try {
              await ApiClient.removeMember(id, memberId);
              Toast.show('Miembro eliminado correctamente', 'success');
              const modal = e.target.closest('.fixed.inset-0');
              if (modal) modal.remove();
              await loadCompanies();
            } catch (error) {
              Toast.show(`Error: ${error.message}`, 'error');
            }
          }
          break;
        case 'close-modal':
          const modal = e.target.closest('.fixed.inset-0');
          if (modal) modal.remove();
          break;
        case 'toggle-verify':
          if (id) {
            const isCurrentlyVerified = e.target.dataset.verified === 'true';
            try {
              await verifyCompany(id, !isCurrentlyVerified);
              await loadCompanies();
            } catch (error) {
              console.error('Error al verificar empresa:', error);
            }
          }
          break;
      }
    });

    const searchInput = document.getElementById('company-search');
    const membersSelect = document.getElementById('members-filter');

    if (searchInput) {
      searchInput.addEventListener('input', filterCompanies);
    }
    if (membersSelect) {
      membersSelect.addEventListener('change', filterCompanies);
    }
    // Manejar tabs
    tabsSection.addEventListener('click', (e) => {
      const tab = e.target.dataset.tab;
      if (!tab) return;

      // Actualizar estilos de tabs
      tabsSection.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.dataset.tab === tab) {
          btn.className = 'tab-btn px-6 py-3 text-sm font-semibold transition-all duration-200 border-b-2 border-purple-500 text-purple-400';
        } else {
          btn.className = 'tab-btn px-6 py-3 text-sm font-semibold transition-all duration-200 border-b-2 border-transparent text-gray-400 hover:text-white';
        }
      });

      currentView = tab;

      if (tab === 'companies') {
        companiesGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
        filtersSection.style.display = 'block';
        actionsSection.style.display = 'flex';
        loadCompanies();
      } else if (tab === 'rankings') {
        filtersSection.style.display = 'none';
        actionsSection.style.display = 'none';
        loadRankings();
      }
    });
  }

  // Inicializar después de montar el componente
  setTimeout(() => {
    setupEventListeners();
    loadCompanies();
  }, 0);

  return container;
}