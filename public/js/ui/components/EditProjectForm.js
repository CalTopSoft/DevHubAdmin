import Toast from './Toast.js';
import ApiClient from '../../api/client.js';

export default function EditProjectForm(project, categories, onSubmit) {
  const form = document.createElement('form');
  form.className = 'space-y-4';

  form.innerHTML = `
    <h3 class="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Editar Proyecto</h3>
    <input type="hidden" name="companyId" value="${project.companyId?._id || project.companyId || ''}">
    
    <!-- Título -->
    <div class="form-group">
      <label for="title" class="block text-sm font-medium mb-1">Título</label>
      <input type="text" id="title" name="title" value="${project.title || ''}" 
             class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none" required>
    </div>
    
    <!-- Descripción Corta -->
    <div class="form-group">
      <label for="shortDesc" class="block text-sm font-medium mb-1">Descripción Corta</label>
      <textarea id="shortDesc" name="shortDesc" 
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none h-20 resize-none" 
                required>${project.shortDesc || ''}</textarea>
    </div>
    
    <!-- Descripción Larga -->
    <div class="form-group">
      <label for="longDesc" class="block text-sm font-medium mb-1">Descripción Larga</label>
      <textarea id="longDesc" name="longDesc" 
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none h-32 resize-none">${project.longDesc || ''}</textarea>
    </div>
    
    <!-- Categorías -->
    <div class="form-group">
      <label class="block text-sm font-medium mb-2">Categorías</label>
      <div id="categories-container" class="flex flex-wrap gap-2 p-3 bg-gray-700/30 rounded-lg border border-gray-600 min-h-[3rem] max-h-40 overflow-y-auto custom-scrollbar">
        <!-- Se cargarán dinámicamente -->
      </div>
      <p class="text-xs text-gray-400 mt-1">Selecciona hasta 5 categorías</p>
    </div>
    
    <!-- Plataformas -->
    <div class="form-group">
      <label class="block text-sm font-medium mb-2">Plataformas</label>
      <div id="platforms-container" class="flex flex-wrap gap-2 p-3 bg-gray-700/30 rounded-lg border border-gray-600">
        <!-- Se cargarán dinámicamente -->
      </div>
    </div>
    
    <!-- Participantes -->
    <div class="form-group">
      <label class="block text-sm font-medium mb-2">Participantes</label>
      <div id="participants-container" class="space-y-2 p-3 bg-gray-700/30 rounded-lg border border-gray-600 max-h-48 overflow-y-auto custom-scrollbar">
        <div class="flex items-center justify-center py-4">
          <div class="animate-spin rounded-full h-6 w-6 border-2 border-gray-600 border-t-purple-500"></div>
          <span class="ml-2 text-gray-400 text-sm">Cargando miembros...</span>
        </div>
      </div>
      <p class="text-xs text-gray-400 mt-1">Miembros de la empresa disponibles</p>
    </div>
    
    <!-- Botones -->
    <div class="flex gap-3 pt-4">
      <button type="submit" class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors">
        Guardar Cambios
      </button>
      <button type="button" data-action="close-modal" class="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors">
        Cancelar
      </button>
    </div>
  `;

  // Configurar categorías
  setupCategoriesSelection(form, categories, project.categories || []);
  
  // Configurar plataformas
  setupPlatformsSelection(form, project.platforms || []).catch(err => {
    console.error('Failed to load platforms:', err);
  });
  
  // Cargar participantes
  loadCompanyMembers(form, project);

  // Manejar submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
      title: formData.get('title'),
      shortDesc: formData.get('shortDesc'),
      longDesc: formData.get('longDesc'),
      categories: getSelectedCategories(form),
      platforms: getSelectedPlatforms(form),
      participants: getSelectedParticipants(form),
      companyId: formData.get('companyId')
    };

    try {
      await onSubmit(data);
    } catch (error) {
      Toast.show(`Error al guardar proyecto: ${error.message}`, 'error');
    }
  });

  return form;
}

// ==================== FUNCIONES AUXILIARES ====================

function setupCategoriesSelection(form, categories, selectedCategories) {
  const container = form.querySelector('#categories-container');
  let selectedCount = selectedCategories.length;
  
  categories.forEach(cat => {
    // ✅ COMPARA CON EL NOMBRE, NO CON EL CÓDIGO
    const isSelected = selectedCategories.includes(cat.name);
    
    const tag = document.createElement('span');
    tag.className = isSelected 
      ? 'category-tag inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full text-sm font-medium cursor-pointer shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 ring-2 ring-purple-400/60'
      : 'category-tag inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800/80 text-gray-200 rounded-full text-sm font-medium cursor-pointer hover:bg-gray-700 transition-all duration-200';
    
    tag.dataset.code = cat.code; // ← sigue usando code para el valor final
    tag.innerHTML = `
      <span>${cat.name}</span>
      <span class="text-xs font-bold">${isSelected ? '✓' : '+'}</span>
    `;
    
    tag.addEventListener('click', () => {
      const isCurrentlySelected = tag.classList.contains('bg-gradient-to-r');
      
      if (!isCurrentlySelected && selectedCount >= 5) {
        Toast.show('Máximo 5 categorías permitidas', 'warning');
        return;
      }
      
      if (isCurrentlySelected) {
        tag.classList.remove('bg-gradient-to-r', 'from-purple-500', 'to-blue-500', 'text-white', 'ring-2', 'ring-purple-400/60');
        tag.classList.add('bg-gray-800/80', 'text-gray-200');
        tag.querySelector('span:last-child').textContent = '+';
        selectedCount--;
      } else {
        tag.classList.remove('bg-gray-800/80', 'text-gray-200');
        tag.classList.add('bg-gradient-to-r', 'from-purple-500', 'to-blue-500', 'text-white', 'ring-2', 'ring-purple-400/60');
        tag.querySelector('span:last-child').textContent = '✓';
        selectedCount++;
      }
    });
    
    container.appendChild(tag);
  });
}

async function setupPlatformsSelection(form, selectedPlatforms) {
  const container = form.querySelector('#platforms-container');
  
  // Mostrar loading
  container.innerHTML = `
    <div class="flex items-center justify-center w-full py-2">
      <div class="animate-spin rounded-full h-5 w-5 border-2 border-gray-600 border-t-purple-500"></div>
      <span class="ml-2 text-gray-400 text-sm">Cargando plataformas...</span>
    </div>
  `;

  try {
    // ✅ Cargar desde la API
    const platforms = await ApiClient.getPlatforms(); // ["Android", "iOS", ...]
    
    container.innerHTML = ''; // Limpiar loading

    if (platforms.length === 0) {
      container.innerHTML = '<p class="text-gray-400 text-sm">No hay plataformas disponibles</p>';
      return;
    }

    platforms.forEach(platform => {
      const isSelected = selectedPlatforms.includes(platform);
      const tag = document.createElement('span');
      tag.className = isSelected
        ? 'platform-tag inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-full text-sm font-medium cursor-pointer shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5'
        : 'platform-tag inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800/80 text-gray-200 rounded-full text-sm font-medium cursor-pointer hover:bg-gray-700 transition-all duration-200';
      
      tag.dataset.platform = platform;
      tag.innerHTML = `
        <span>${platform}</span>
        <span class="text-xs font-bold">${isSelected ? '✓' : '+'}</span>
      `;
      
      tag.addEventListener('click', () => {
        const isCurrentlySelected = tag.classList.contains('bg-gradient-to-r');
        
        if (isCurrentlySelected) {
          tag.classList.remove('bg-gradient-to-r', 'from-green-500', 'to-teal-500', 'text-white');
          tag.classList.add('bg-gray-800/80', 'text-gray-200');
          tag.querySelector('span:last-child').textContent = '+';
        } else {
          tag.classList.remove('bg-gray-800/80', 'text-gray-200');
          tag.classList.add('bg-gradient-to-r', 'from-green-500', 'to-teal-500', 'text-white');
          tag.querySelector('span:last-child').textContent = '✓';
        }
      });
      
      container.appendChild(tag);
    });
  } catch (error) {
    console.error('Error loading platforms:', error);
    container.innerHTML = '<p class="text-red-400 text-sm">Error al cargar plataformas</p>';
    Toast.show(`Error al cargar plataformas: ${error.message}`, 'error');
  }
}

async function loadCompanyMembers(form, project) {
  const container = form.querySelector('#participants-container');
  
  try {
    const companyId = project.companyId?._id || project.companyId;
    if (!companyId) {
      container.innerHTML = '<p class="text-gray-400 text-sm">No se pudo cargar la empresa</p>';
      return;
    }

    const company = await ApiClient.getCompany(companyId);
    const currentParticipants = project.participants?.map(p => p._id || p) || [];
    
    if (!company.members || company.members.length === 0) {
      container.innerHTML = '<p class="text-gray-400 text-sm">No hay miembros disponibles</p>';
      return;
    }
    
    container.innerHTML = '';
    
    company.members.forEach(member => {
      const userId = member.userId?._id || member.userId;
      const username = member.userId?.username || 'Usuario';
      const photo = member.userId?.photo;
      const isSelected = currentParticipants.includes(userId);
      
      const memberCard = document.createElement('label');
      memberCard.className = `flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-all duration-200 ${
        isSelected ? 'bg-purple-500/20 border border-purple-500/50' : 'hover:bg-gray-600/30'
      }`;
      
      memberCard.innerHTML = `
        <input 
          type="checkbox" 
          class="participant-checkbox w-4 h-4 text-purple-500 rounded focus:ring-purple-500"
          data-user-id="${userId}"
          ${isSelected ? 'checked' : ''}
        >
        <div class="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          ${photo 
            ? `<img src="${photo}" alt="${username}" class="w-full h-full object-cover">` 
            : username.charAt(0).toUpperCase()
          }
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-white text-sm font-medium truncate">${username}</p>
          <p class="text-gray-400 text-xs truncate">${member.roles?.join(', ') || 'Miembro'}</p>
        </div>
      `;
      
      container.appendChild(memberCard);
    });
  } catch (error) {
    console.error('Error loading company members:', error);
    container.innerHTML = '<p class="text-red-400 text-sm">Error al cargar miembros</p>';
    Toast.show(`Error al cargar miembros: ${error.message}`, 'error');
  }
}

function getSelectedCategories(form) {
  return Array.from(form.querySelectorAll('.category-tag.bg-gradient-to-r'))
    .map(tag => {
      // Extrae el NOMBRE visible (el primer <span>)
      const nameSpan = tag.querySelector('span');
      return nameSpan ? nameSpan.textContent.trim() : '';
    })
    .filter(name => name);
}

function getSelectedPlatforms(form) {
  return Array.from(form.querySelectorAll('.platform-tag.bg-gradient-to-r'))
    .map(tag => tag.dataset.platform);
}

function getSelectedParticipants(form) {
  return Array.from(form.querySelectorAll('.participant-checkbox:checked'))
    .map(checkbox => checkbox.dataset.userId);
}