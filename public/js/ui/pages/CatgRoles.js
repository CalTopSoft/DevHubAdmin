import ApiClient from '../../api/client.js';
import Toast from '../components/Toast.js';

export default function CategoriesAdminPage() {
  const container = document.createElement('div');
  container.className = 'space-y-6';

  const title = document.createElement('h2');
  title.className = 'text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400';
  title.textContent = 'Gestión de Categorías y Roles';
  container.appendChild(title);

  // Botones de acción
  const actionsSection = document.createElement('div');
  actionsSection.className = 'flex flex-wrap gap-4 mb-6';
  actionsSection.innerHTML = `
    <button data-action="new-category" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors">
      ➕ Nueva Categoría
    </button>
    <button data-action="seed-data" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors">
      🌱 Inicializar Datos
    </button>
    <button data-action="refresh" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors">
      🔄 Actualizar
    </button>
  `;
  container.appendChild(actionsSection);

  // Contenedor principal
  const mainContent = document.createElement('div');
  mainContent.className = 'grid grid-cols-1 lg:grid-cols-2 gap-6';
  container.appendChild(mainContent);

  // Panel de categorías
  const categoriesPanel = document.createElement('div');
  categoriesPanel.className = 'card p-6 rounded-lg';
  categoriesPanel.innerHTML = `
    <h3 class="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
      Categorías
    </h3>
    <div id="categories-list" class="space-y-3">
      <div class="text-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p>Cargando categorías...</p>
      </div>
    </div>
  `;
  mainContent.appendChild(categoriesPanel);

  // Panel de roles
  const rolesPanel = document.createElement('div');
  rolesPanel.className = 'card p-6 rounded-lg';
  rolesPanel.innerHTML = `
    <h3 class="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
      Roles por Categoría
    </h3>
    <div id="roles-list" class="space-y-4">
      <p class="text-gray-400 text-center py-8">Selecciona una categoría para ver sus roles</p>
    </div>
  `;
  mainContent.appendChild(rolesPanel);

  let categories = [];
  let selectedCategory = null;

  // Cargar categorías
  async function loadCategories() {
    const categoriesContainer = document.getElementById('categories-list');
    if (!categoriesContainer) {
      console.error('No se encontró el elemento #categories-list');
      return;
    }

    try {
      categoriesContainer.innerHTML = `
        <div class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p>Cargando categorías...</p>
        </div>
      `;

      categories = await ApiClient.getCategories();
      renderCategories();
      Toast.show(`${categories.length} categorías cargadas`, 'success');
    } catch (error) {
      console.error('Error cargando categorías:', error);
      categoriesContainer.innerHTML = `
        <div class="text-center py-8 text-red-400">
          <p>Error: ${error.message}</p>
          <button data-action="retry-categories" class="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500">
            Reintentar
          </button>
        </div>
      `;
    }
  }

  // Renderizar categorías
  function renderCategories() {
    const categoriesContainer = document.getElementById('categories-list');
    if (!categoriesContainer) {
      console.error('No se encontró el elemento #categories-list');
      return;
    }

    if (categories.length === 0) {
      categoriesContainer.innerHTML = `
        <div class="text-center py-8 text-gray-400">
          <div class="text-4xl mb-4">📁</div>
          <p>No hay categorías</p>
          <button data-action="create-category" class="mt-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500">
            Crear Primera Categoría
          </button>
        </div>
      `;
      return;
    }

    categoriesContainer.innerHTML = categories.map(category => `
      <div class="bg-gray-700 p-4 rounded-lg ${selectedCategory?._id === category._id ? 'ring-2 ring-purple-500' : ''}">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center space-x-2">
            <span class="text-2xl">${category.icon || '📁'}</span>
            <div>
              <h4 class="font-semibold">${category.name}</h4>
              <p class="text-sm text-gray-400">Código: ${category.code}</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button 
              data-action="select-category" 
              data-id="${category._id}"
              class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500"
            >
              Ver Roles
            </button>
            <button 
              data-action="edit-category" 
              data-id="${category._id}"
              class="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-500"
            >
              Editar
            </button>
            <button 
              data-action="delete-category" 
              data-id="${category._id}"
              class="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-500"
            >
              Eliminar
            </button>
          </div>
        </div>
        <p class="text-sm text-gray-300">${category.description}</p>
      </div>
    `).join('');
  }

  // Cargar roles de una categoría
  async function loadRoles(categoryId) {
    const rolesContainer = document.getElementById('roles-list');
    if (!rolesContainer) {
      console.error('No se encontró el elemento #roles-list');
      return;
    }

    try {
      rolesContainer.innerHTML = `
        <div class="text-center py-8">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Cargando roles...</p>
        </div>
      `;

      const roles = await ApiClient.getRolesByCategory(categoryId);
      selectedCategory = categories.find(c => c._id === categoryId);
      renderRoles(roles);
    } catch (error) {
      console.error('Error cargando roles:', error);
      rolesContainer.innerHTML = `
        <div class="text-center py-8 text-red-400">
          <p>Error: ${error.message}</p>
        </div>
      `;
    }
  }

  // Renderizar roles
  function renderRoles(roles) {
    const rolesContainer = document.getElementById('roles-list');
    if (!rolesContainer) {
      console.error('No se encontró el elemento #roles-list');
      return;
    }

    const headerHTML = selectedCategory ? `
      <div class="mb-4 pb-4 border-b border-gray-600">
        <div class="flex justify-between items-center">
          <h4 class="font-semibold flex items-center">
            <span class="mr-2">${selectedCategory.icon || '📁'}</span>
            Roles de ${selectedCategory.name}
          </h4>
          <button 
            data-action="create-role" 
            data-id="${selectedCategory._id}"
            class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-500"
          >
            ➕ Nuevo Rol
          </button>
        </div>
      </div>
    ` : '';

    if (roles.length === 0) {
      rolesContainer.innerHTML = headerHTML + `
        <div class="text-center py-8 text-gray-400">
          <div class="text-4xl mb-4">👥</div>
          <p>No hay roles en esta categoría</p>
        </div>
      `;
      return;
    }

    rolesContainer.innerHTML = headerHTML + `
      <div class="space-y-3">
        ${roles.map(role => `
          <div class="bg-gray-700 p-4 rounded-lg">
            <div class="flex justify-between items-start mb-2">
              <div class="flex-1">
                <h5 class="font-semibold">${role.name}</h5>
                <p class="text-sm text-gray-400">Código: ${role.code}</p>
                <p class="text-sm text-gray-300 mt-1">${role.description}</p>
              </div>
              <div class="flex gap-2 ml-4">
                <button 
                  data-action="edit-role" 
                  data-id="${role._id}"
                  class="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-500"
                >
                  Editar
                </button>
                <button 
                  data-action="delete-role" 
                  data-id="${role._id}"
                  class="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-500"
                >
                  Eliminar
                </button>
              </div>
            </div>
            ${role.skills && role.skills.length > 0 ? `
              <div class="mt-2">
                <p class="text-xs text-gray-400 mb-1">Habilidades:</p>
                <div class="flex flex-wrap gap-1">
                  ${role.skills.map(skill => `
                    <span class="px-2 py-1 text-xs bg-blue-700 text-blue-200 rounded">${skill}</span>
                  `).join('')}
                </div>
              </div>
            ` : ''}
            ${role.responsibilities && role.responsibilities.length > 0 ? `
              <div class="mt-2">
                <p class="text-xs text-gray-400 mb-1">Responsabilidades:</p>
                <ul class="text-xs text-gray-300 ml-4">
                  ${role.responsibilities.map(resp => `<li class="list-disc">${resp}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Modal para crear/editar categoría
  function showCategoryModal(category = null) {
    const isEdit = !!category;
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    modal.innerHTML = `
      <div class="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
        <h3 class="text-lg font-bold mb-4">${isEdit ? 'Editar' : 'Nueva'} Categoría</h3>
        
        <form id="category-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Nombre</label>
            <input 
              type="text" 
              name="name" 
              value="${category?.name || ''}"
              placeholder="Ej: Desarrollo Web"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:border-purple-500 focus:outline-none"
              required
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Código</label>
            <input 
              type="text" 
              name="code" 
              value="${category?.code || ''}"
              placeholder="Ej: web"
              pattern="[a-z_]+"
              title="Solo letras minúsculas y guiones bajos"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:border-purple-500 focus:outline-none"
              required
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Icono</label>
            <input 
              type="text" 
              name="icon" 
              value="${category?.icon || ''}"
              placeholder="Ej: 🌐"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:border-purple-500 focus:outline-none"
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Descripción</label>
            <textarea 
              name="description" 
              placeholder="Descripción de la categoría"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:border-purple-500 focus:outline-none h-20 resize-none"
              required
            >${category?.description || ''}</textarea>
          </div>
          
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
    
    // Manejar envío del formulario
    modal.querySelector('#category-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      
      try {
        if (isEdit) {
          await ApiClient.updateCategory(category._id, data);
          Toast.show('Categoría actualizada correctamente', 'success');
        } else {
          await ApiClient.createCategory(data);
          Toast.show('Categoría creada correctamente', 'success');
        }
        
        modal.remove();
        await loadCategories();
        
      } catch (error) {
        Toast.show(`Error: ${error.message}`, 'error');
      }
    });
  }

  // Modal para crear/editar rol
  function showRoleModal(role = null, categoryId = null) {
    const isEdit = !!role;
    const targetCategoryId = role?.categoryId?._id || role?.categoryId || categoryId;
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    const categoryOptions = categories.map(cat => 
      `<option value="${cat._id}" ${cat._id === targetCategoryId ? 'selected' : ''}>${cat.name}</option>`
    ).join('');
    
    modal.innerHTML = `
      <div class="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 max-h-96 overflow-y-auto">
        <h3 class="text-lg font-bold mb-4">${isEdit ? 'Editar' : 'Nuevo'} Rol</h3>
        
        <form id="role-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Categoría</label>
            <select 
              name="categoryId" 
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:border-purple-500 focus:outline-none"
              required
            >
              ${categoryOptions}
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Nombre</label>
            <input 
              type="text" 
              name="name" 
              value="${role?.name || ''}"
              placeholder="Ej: Frontend Developer"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:border-purple-500 focus:outline-none"
              required
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Código</label>
            <input 
              type="text" 
              name="code" 
              value="${role?.code || ''}"
              placeholder="Ej: frontend_dev"
              pattern="[a-z_]+"
              title="Solo letras minúsculas y guiones bajos"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:border-purple-500 focus:outline-none"
              required
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Descripción</label>
            <textarea 
              name="description" 
              placeholder="Descripción del rol"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:border-purple-500 focus:outline-none h-20 resize-none"
              required
            >${role?.description || ''}</textarea>
          </div>
          
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
    
    modal.querySelector('#role-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      
      try {
        if (isEdit) {
          await ApiClient.updateRole(role._id, data);
          Toast.show('Rol actualizado correctamente', 'success');
        } else {
          await ApiClient.createRole(data);
          Toast.show('Rol creado correctamente', 'success');
        }
        
        modal.remove();
        await loadCategories();
        if (selectedCategory) {
          await loadRoles(selectedCategory._id);
        }
        
      } catch (error) {
        Toast.show(`Error: ${error.message}`, 'error');
      }
    });
  }

  // Confirmación de eliminación de categoría
  function confirmDeleteCategory(categoryId) {
    const category = categories.find(c => c._id === categoryId);
    if (!category) return;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
        <div class="text-center">
          <div class="text-red-400 text-4xl mb-4">⚠️</div>
          <h3 class="text-lg font-bold mb-2">Confirmar Eliminación</h3>
          <p class="text-gray-300 mb-4">
            ¿Eliminar la categoría <strong>"${category.name}"</strong>?
          </p>
          <p class="text-sm text-gray-400 mb-6">Esto también eliminará todos los roles asociados.</p>
          
          <div class="flex gap-3">
            <button 
              data-action="confirm-delete-category" 
              data-id="${categoryId}"
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
    document.body.appendChild(modal);
  }

  // Función para inicializar datos
  async function seedData() {
    try {
      const result = await ApiClient.seedCategoriesData();
      Toast.show(result.message || 'Datos inicializados correctamente', 'success');
      await loadCategories();
    } catch (error) {
      Toast.show(error.message || 'Error al inicializar datos', 'error');
    }
  }

  // Manejo de eventos con delegación
  function setupEventListeners() {
    document.body.addEventListener('click', async (e) => {
      const action = e.target.dataset.action;
      const id = e.target.dataset.id;
  
      if (!action) return;
  
      switch (action) {
        case 'new-category':
          showCategoryModal();
          break;
        case 'seed-data':
          await seedData();
          break;
        case 'refresh':
          await loadCategories();
          break;
        case 'retry-categories':
          await loadCategories();
          break;
        case 'create-category':
          showCategoryModal();
          break;
        case 'select-category':
          if (id) {
            await loadRoles(id);
            renderCategories();
          }
          break;
        case 'edit-category':
          if (id) {
            try {
              const category = await ApiClient.getCategory(id);
              showCategoryModal(category);
            } catch (error) {
              Toast.show(`Error: ${error.message}`, 'error');
            }
          }
          break;
        case 'delete-category':
          if (id) {
            confirmDeleteCategory(id);
          }
          break;
        case 'confirm-delete-category':
          if (id) {
            try {
              await ApiClient.deleteCategory(id);
              Toast.show('Categoría eliminada correctamente', 'success');
              
              const modal = e.target.closest('.fixed.inset-0');
              if (modal) modal.remove();
              
              if (selectedCategory?._id === id) {
                selectedCategory = null;
                const rolesContainer = document.getElementById('roles-list');
                if (rolesContainer) {
                  rolesContainer.innerHTML = `
                    <p class="text-gray-400 text-center py-8">Selecciona una categoría para ver sus roles</p>
                  `;
                }
              }
              await loadCategories();
            } catch (error) {
              Toast.show(`Error: ${error.message}`, 'error');
            }
          }
          break;
        case 'create-role':
          if (id) {
            showRoleModal(null, id);
          }
          break;
        case 'edit-role':
          if (id) {
            try {
              const role = await ApiClient.getRole(id);
              showRoleModal(role);
            } catch (error) {
              Toast.show(`Error: ${error.message}`, 'error');
            }
          }
          break;
        case 'delete-role':
          if (id) {
            try {
              await ApiClient.deleteRole(id);
              Toast.show('Rol eliminado correctamente', 'success');
              if (selectedCategory) {
                await loadRoles(selectedCategory._id);
              }
            } catch (error) {
              Toast.show(`Error: ${error.message}`, 'error');
            }
          }
          break;
        case 'close-modal':
          const modal = e.target.closest('.fixed.inset-0');
          if (modal) modal.remove();
          break;
      }
    });
  }

  // Inicializar después de montar el componente
  setTimeout(() => {
    setupEventListeners();
    loadCategories();
  }, 0);

  return container;
}