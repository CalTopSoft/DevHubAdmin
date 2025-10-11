// admin/pages/ProjectsPage.js
import ApiClient from '../../api/client.js';
import { updateProject, sendProjectToAuthor, publishProject, rejectProject, warnProject, deleteProject } from '../../api/projects.js';
import FeedbackModal from '../components/FeedbackModal.js';
import EditProjectForm from '../components/EditProjectForm.js';
import Toast from '../components/Toast.js';

export default async function ProjectsPage() {
  const container = document.createElement('div');
  container.className = 'space-y-6';

  const title = document.createElement('h2');
  title.className = 'text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400';
  title.textContent = 'Gestión de Proyectos';
  container.appendChild(title);

  const draftsNotice = document.createElement('div');
  draftsNotice.id = 'drafts-notice';
  draftsNotice.className = 'hidden';
  container.appendChild(draftsNotice);

  // Estadísticas de proyectos
  const statsSection = document.createElement('div');
  statsSection.className = 'grid grid-cols-2 md:grid-cols-4 gap-4 mb-6';
  statsSection.id = 'projects-stats';
  container.appendChild(statsSection);

  // Tabs de estado
  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'flex flex-wrap gap-2 mb-6';

  const statuses = [
    { key: 'pending', label: 'Pendientes', color: 'bg-yellow-600', emoji: '⏳' },
    { key: 'needs_author_review', label: 'Necesita Autor', color: 'bg-orange-600', emoji: '✏️' },
    { key: 'published', label: 'Publicados', color: 'bg-green-600', emoji: '✅' },
    { key: 'rejected', label: 'Rechazados', color: 'bg-red-600', emoji: '❌' },
    { key: 'with_drafts', label: 'Con Borradores', color: 'bg-blue-600', emoji: '📝' }
  ];

  statuses.forEach(status => {
    const tab = document.createElement('button');
    tab.className = `px-4 py-2 rounded-lg transition-all duration-300 ${status.color} hover:opacity-80 text-white font-medium`;
    tab.innerHTML = `${status.emoji} ${status.label} <span id="count-${status.key}" class="ml-2 px-2 py-1 bg-black/20 rounded-full text-xs">0</span>`;
    tab.dataset.key = status.key;

    tab.addEventListener('click', async () => {
      tabsContainer.querySelectorAll('button').forEach(btn => {
        btn.classList.remove('ring-2', 'ring-white');
      });
      tab.classList.add('ring-2', 'ring-white');
      await loadProjects(status.key);
    });

    tabsContainer.appendChild(tab);
  });
  container.appendChild(tabsContainer);

  // Filtros
  const filtersSection = document.createElement('div');
  filtersSection.className = 'card p-4 rounded-lg mb-6';
  filtersSection.innerHTML = `
    <div class="flex flex-wrap gap-4 items-center">
      <div class="flex items-center space-x-2">
        <label class="text-sm font-medium">Buscar:</label>
        <input type="text" id="project-search" placeholder="Título, descripción..." class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none">
      </div>
      <div class="flex items-center space-x-2">
        <label class="text-sm font-medium">Categoría:</label>
        <select id="category-filter" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none">
          <option value="">Todas</option>
        </select>
      </div>
      <div class="flex items-center space-x-2">
        <label class="text-sm font-medium">Plataforma:</label>
        <select id="platform-filter" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none">
          <option value="">Todas</option>
          <option value="Web">Web</option>
          <option value="Android">Android</option>
          <option value="iOS">iOS</option>
          <option value="Desktop">Desktop</option>
        </select>
      </div>
    </div>
  `;
  container.appendChild(filtersSection);

  // Grid de proyectos
  const projectsGrid = document.createElement('div');
  projectsGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
  projectsGrid.id = 'projects-grid';
  container.appendChild(projectsGrid);

  let allProjects = [];
  let categories = [];
  let currentStatus = 'pending';

  // ✅ FUNCIÓN MEJORADA: Cargar proyectos con borradores
  async function loadProjectsWithDrafts() {
    try {
      projectsGrid.innerHTML = `
        <div class="col-span-full flex items-center justify-center p-8">
          <div class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Cargando proyectos con borradores...</p>
          </div>
        </div>
      `;

      const projects = await ApiClient.getProjectsWithDrafts();
      allProjects = projects;
      renderProjectsWithDrafts(projects);
      
      Toast.show(`${projects.length} proyectos con borradores pendientes`, 'info');
    } catch (error) {
      console.error('Error al cargar proyectos con borradores:', error);
      projectsGrid.innerHTML = `
        <div class="col-span-full p-8 text-center text-red-400">
          <h3 class="text-lg font-semibold mb-2">Error al cargar proyectos</h3>
          <p class="mb-4">${error.message}</p>
        </div>
      `;
    }
  }
  
  // ✅ FUNCIÓN MEJORADA: Renderizar proyectos con borradores mostrando TODOS los cambios
  function renderProjectsWithDrafts(projects) {
    if (projects.length === 0) {
      projectsGrid.innerHTML = `
        <div class="col-span-full p-8 text-center text-gray-400">
          <div class="text-6xl mb-4">📝</div>
          <h3 class="text-lg font-semibold mb-2">No hay borradores pendientes</h3>
          <p>Todos los proyectos están al día</p>
        </div>
      `;
      return;
    }

    projectsGrid.innerHTML = projects.map(project => {
      const categoryNames = project.categories?.map(catCode =>
        categories.find(cat => cat.code === catCode)?.name || catCode
      ).join(', ') || 'Sin categoría';

      const submittedDate = project.draftSubmittedAt ? 
        new Date(project.draftSubmittedAt).toLocaleDateString('es-ES') : 
        'Desconocida';

      // ✅ Contar cambios reales
      const changesCount = countDraftChanges(project);

      return `
        <div class="card p-6 rounded-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-500/50">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-3">
              ${project.iconUrl
                ? `<img src="${project.iconUrl}" alt="${project.title}" class="w-12 h-12 rounded-lg object-cover">`
                : `<div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                    ${project.title.charAt(0).toUpperCase()}
                  </div>`
              }
              <div>
                <h3 class="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                  ${project.title}
                </h3>
                <span class="text-xs text-blue-400">📝 ${changesCount} cambio(s) pendiente(s)</span>
              </div>
            </div>
            <span class="px-2 py-1 text-xs bg-blue-600 text-white rounded-full whitespace-nowrap">
              Actualización
            </span>
          </div>
          
          <div class="space-y-2 mb-4 text-sm">
            <div class="flex items-center text-gray-400">
              <span class="w-4 h-4 mr-2">📅</span>
              <span>Enviado: ${submittedDate}</span>
            </div>
            <div class="flex items-center text-gray-400">
              <span class="w-4 h-4 mr-2">📋</span>
              <span>${categoryNames}</span>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-2 text-xs">
            <button 
              data-action="review-draft" 
              data-slug="${project.slug}"
              class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
            >
              👁️ Revisar Cambios
            </button>
            <button 
              data-action="approve-draft" 
              data-id="${project._id}"
              class="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition-colors"
            >
              ✅ Aprobar
            </button>
            <button 
              data-action="reject-draft" 
              data-id="${project._id}"
              data-title="${project.title}"
              class="col-span-2 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-500 transition-colors"
            >
              ❌ Rechazar Borrador
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // ✅ NUEVA FUNCIÓN: Contar cambios en el borrador
  function countDraftChanges(project) {
    if (!project.draft) return 0;
    
    let count = 0;
    const draft = project.draft;
    
    if (draft.title && draft.title !== project.title) count++;
    if (draft.shortDesc && draft.shortDesc !== project.shortDesc) count++;
    if (draft.longDesc && draft.longDesc !== project.longDesc) count++;
    if (draft.iconUrl && draft.iconUrl !== project.iconUrl) count++;
    if (draft.imageUrls && JSON.stringify(draft.imageUrls) !== JSON.stringify(project.imageUrls)) count++;
    if (draft.files?.app) count++;
    if (draft.files?.code) count++;
    if (draft.files?.docPdf) count++;
    
    return count;
  }

  async function loadCategories() {
    try {
      categories = await ApiClient.getCategories();
      const categoryFilter = document.getElementById('category-filter');
      if (categoryFilter) {
        categoryFilter.innerHTML = `<option value="">Todas</option>` +
          categories.map(category => `
            <option value="${category.name}">${category.name}</option>
          `).join('');
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      Toast.show(`Error al cargar categorías: ${error.message}`, 'error');
    }
  }

  async function loadStats() {
    try {
      const stats = await ApiClient.getStats();
      const draftsCount = await ApiClient.getProjectsWithDrafts();
      
      statsSection.innerHTML = `
        <div class="card p-4 rounded-lg text-center">
          <div class="text-2xl font-bold text-yellow-400">${stats.projectsByStatus?.pending || 0}</div>
          <p class="text-sm text-gray-400">Pendientes</p>
        </div>
        <div class="card p-4 rounded-lg text-center">
          <div class="text-2xl font-bold text-orange-400">${stats.projectsByStatus?.needs_author_review || 0}</div>
          <p class="text-sm text-gray-400">Necesita Autor</p>
        </div>
        <div class="card p-4 rounded-lg text-center">
          <div class="text-2xl font-bold text-green-400">${stats.projectsByStatus?.published || 0}</div>
          <p class="text-sm text-gray-400">Publicados</p>
        </div>
        <div class="card p-4 rounded-lg text-center">
          <div class="text-2xl font-bold text-red-400">${stats.projectsByStatus?.rejected || 0}</div>
          <p class="text-sm text-gray-400">Rechazados</p>
        </div>
      `;
      
      statuses.forEach(status => {
        const countElement = document.getElementById(`count-${status.key}`);
        if (countElement) {
          if (status.key === 'with_drafts') {
            countElement.textContent = draftsCount.length || 0;
          } else {
            countElement.textContent = stats.projectsByStatus?.[status.key] || 0;
          }
        }
      });

      if (draftsCount.length > 0) {
        draftsNotice.className = 'bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 mb-6';
        draftsNotice.innerHTML = `
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <span class="text-2xl">📝</span>
              <div>
                <h3 class="font-semibold text-blue-300">Hay ${draftsCount.length} proyecto(s) con actualizaciones pendientes</h3>
                <p class="text-sm text-blue-200">Revisa los cambios propuestos por los autores</p>
              </div>
            </div>
            <button 
              onclick="document.querySelector('button[data-key=\\"with_drafts\\"]')?.click()" 
              class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm"
            >
              Ver Borradores
            </button>
          </div>
        `;
      } else {
        draftsNotice.className = 'hidden';
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      Toast.show(`Error al cargar estadísticas: ${error.message}`, 'error');
    }
  }

  async function loadProjects(status = currentStatus) {
    currentStatus = status;
    
    if (status === 'with_drafts') {
      await loadProjectsWithDrafts();
      return;
    }
    
    try {
      projectsGrid.innerHTML = `
        <div class="col-span-full flex items-center justify-center p-8">
          <div class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p>Cargando proyectos...</p>
          </div>
        </div>
      `;

      allProjects = await ApiClient.getAdminProjects({ status });
      filterProjects();
      Toast.show(`${allProjects.length} proyectos cargados`, 'success');
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
      projectsGrid.innerHTML = `
        <div class="col-span-full p-8 text-center text-red-400">
          <h3 class="text-lg font-semibold mb-2">Error al cargar proyectos</h3>
          <p class="mb-4">${error.message}</p>
          <button data-action="refresh" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors">
            Reintentar
          </button>
        </div>
      `;
    }
  }

  function filterProjects() {
    const searchTerm = document.getElementById('project-search')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('category-filter')?.value || '';
    const platformFilter = document.getElementById('platform-filter')?.value || '';

    const filtered = allProjects.filter(project => {
      if (project.status !== currentStatus && currentStatus !== 'with_drafts') return false;

      const matchesSearch =
        !searchTerm ||
        project.title.toLowerCase().includes(searchTerm) ||
        (project.shortDesc || '').toLowerCase().includes(searchTerm) ||
        (project.longDesc || '').toLowerCase().includes(searchTerm);

      const matchesCategory =
        !categoryFilter || project.categories?.includes(categoryFilter);

      const matchesPlatform =
        !platformFilter || project.platforms?.includes(platformFilter);

      return matchesSearch && matchesCategory && matchesPlatform;
    });

    renderProjectsGrid(filtered);
  }

  function renderProjectsGrid(projects) {
    if (projects.length === 0) {
      projectsGrid.innerHTML = `
        <div class="col-span-full p-8 text-center text-gray-400">
          <div class="text-6xl mb-4">📂</div>
          <h3 class="text-lg font-semibold mb-2">No hay proyectos</h3>
          <p>No se encontraron proyectos con los filtros aplicados</p>
        </div>
      `;
      return;
    }

    projectsGrid.innerHTML = projects.map(project => {
      const categoryNames = project.categories?.map(catCode =>
        categories.find(cat => cat.code === catCode)?.name || catCode
      ).join(', ') || 'Sin categoría';

      const createdDate = new Date(project.createdAt).toLocaleDateString('es-ES');
      const statusColors = {
        pending: 'bg-yellow-600',
        needs_author_review: 'bg-orange-600',
        published: 'bg-green-600',
        rejected: 'bg-red-600'
      };

      const hasIcon = project.iconUrl;

      return `
        <div class="card p-6 rounded-lg hover:shadow-xl transition-all duration-300">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-3">
              ${hasIcon
          ? `<img src="${project.iconUrl}" alt="${project.title}" class="w-12 h-12 rounded-lg object-cover">`
          : `<div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                    ${project.title.charAt(0).toUpperCase()}
                  </div>`
        }
              <div>
                <h3 class="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                  ${project.title}
                </h3>
                <span class="text-xs text-gray-500">${project.slug}</span>
              </div>
            </div>
            <span class="px-2 py-1 text-xs ${statusColors[project.status] || 'bg-gray-600'} text-white rounded-full whitespace-nowrap">
              ${project.status}
            </span>
          </div>
          
          <div class="space-y-2 mb-4 text-sm">
            <div class="flex items-center text-gray-400">
              <span class="w-4 h-4 mr-2">📋</span>
              <span>${categoryNames}</span>
            </div>
            <div class="flex items-center text-gray-400">
              <span class="w-4 h-4 mr-2">📱</span>
              <span>${project.platforms?.join(', ') || 'N/A'}</span>
            </div>
            <div class="flex items-center text-gray-400">
              <span class="w-4 h-4 mr-2">📅</span>
              <span>${createdDate}</span>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-1 text-xs">
            <button 
              data-action="view-details" 
              data-slug="${project.slug}" 
              class="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
            >
              👁️ Ver
            </button>
            <button 
              data-action="edit-project" 
              data-slug="${project.slug}"
              class="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-500 transition-colors"
            >
              ✏️ Editar
            </button>
            ${project.status === 'published' ? `
              <button 
                data-action="warn-project" 
                data-slug="${project.slug}"
                class="px-2 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-500 transition-colors"
              >
                ⚠️ Advertir
              </button>
            ` : ''}
            <button 
              data-action="delete-project" 
              data-slug="${project.slug}"
              class="px-2 py-1 bg-red-700 text-white rounded hover:bg-red-600 transition-colors"
            >
              🗑️ Eliminar
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // ✅ FUNCIÓN MEJORADA: Modal de comparación de borradores con TODOS los cambios
  function showDraftComparisonModal(project) {
    if (!project.draft) {
      Toast.show('No hay borrador para este proyecto', 'error');
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4';

    const changedFields = [];
    const draft = project.draft;

    // Detectar TODOS los cambios
    if (draft.title && draft.title !== project.title) {
      changedFields.push({
        field: 'Título',
        original: project.title,
        proposed: draft.title
      });
    }
    if (draft.shortDesc && draft.shortDesc !== project.shortDesc) {
      changedFields.push({
        field: 'Descripción corta',
        original: project.shortDesc,
        proposed: draft.shortDesc
      });
    }
    if (draft.longDesc && draft.longDesc !== project.longDesc) {
      changedFields.push({
        field: 'Descripción detallada',
        original: project.longDesc,
        proposed: draft.longDesc
      });
    }
    if (draft.iconUrl && draft.iconUrl !== project.iconUrl) {
      changedFields.push({
        field: 'Icono',
        original: project.iconUrl,
        proposed: draft.iconUrl,
        isImage: true
      });
    }
    if (draft.imageUrls && JSON.stringify(draft.imageUrls) !== JSON.stringify(project.imageUrls)) {
      changedFields.push({
        field: 'Imágenes',
        original: project.imageUrls,
        proposed: draft.imageUrls,
        isImageArray: true
      });
    }
    
    // ✅ Detectar cambios en archivos
    if (draft.files?.app) {
      const currentApp = project.files?.app;
      const draftApp = draft.files.app;
      
      const currentInfo = currentApp 
        ? (currentApp.type === 'external' ? currentApp.url : currentApp.fileName)
        : 'Sin archivo';
      const draftInfo = draftApp.type === 'external' 
        ? draftApp.url 
        : draftApp.fileName || 'Nuevo archivo';
        
      changedFields.push({
        field: 'App',
        original: currentInfo,
        proposed: draftInfo,
        isFile: true,
        fileType: 'app',
        virusScan: draftApp.virusScan
      });
    }
    if (draft.files?.code) {
      changedFields.push({
        field: 'Código fuente',
        original: project.files?.code?.fileName || 'Sin archivo',
        proposed: draft.files.code.fileName || 'Nuevo archivo',
        isFile: true,
        fileType: 'code',
        virusScan: draft.files.code.virusScan
      });
    }
    if (draft.files?.docPdf) {
      changedFields.push({
        field: 'Documentación',
        original: project.files?.docPdf?.fileName || 'Sin archivo',
        proposed: draft.files.docPdf.fileName || 'Nuevo archivo',
        isFile: true,
        fileType: 'doc',
        virusScan: draft.files.docPdf.virusScan
      });
    }

    modal.innerHTML = `
      <div class="bg-gray-900 rounded-xl w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div class="flex justify-between items-center p-4 border-b border-blue-500/30 bg-gradient-to-r from-blue-800 to-purple-800">
          <div>
            <h3 class="text-xl font-bold text-white">Revisión de Borrador</h3>
            <p class="text-sm text-blue-200">${project.title}</p>
          </div>
          <button data-action="close-modal" class="text-white hover:text-gray-300 text-2xl">×</button>
        </div>
        
        <div class="overflow-y-auto p-6 bg-gray-800 flex-1">
          <div class="mb-6">
            <h4 class="text-lg font-semibold text-blue-300 mb-3">Cambios Propuestos (${changedFields.length})</h4>
            
            ${changedFields.length === 0 ? `
              <p class="text-gray-400">No se detectaron cambios</p>
            ` : changedFields.map(change => `
              <div class="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <h5 class="font-semibold text-white mb-3">${change.field}</h5>
                
                ${change.isImage ? `
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <p class="text-xs text-gray-400 mb-2">Actual:</p>
                      <img src="${change.original}" alt="Original" class="w-20 h-20 rounded-lg object-cover border border-gray-600">
                    </div>
                    <div>
                      <p class="text-xs text-green-400 mb-2">Propuesto:</p>
                      <img src="${change.proposed}" alt="Propuesto" class="w-20 h-20 rounded-lg object-cover border border-green-500">
                    </div>
                  </div>
                ` : change.isImageArray ? `
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <p class="text-xs text-gray-400 mb-2">Actual (${change.original?.length || 0}):</p>
                      <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                        ${change.original?.length > 0 ? change.original.map((url, i) => `
                          <img src="${url}" alt="Actual ${i+1}" class="w-16 h-16 rounded-lg object-cover border border-gray-600">
                        `).join('') : '<p class="text-xs text-gray-500">Sin imágenes</p>'}
                      </div>
                    </div>
                    <div>
                      <p class="text-xs text-green-400 mb-2">Propuesto (${change.proposed?.length || 0}):</p>
                      <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                        ${change.proposed?.length > 0 ? change.proposed.map((url, i) => `
                          <img src="${url}" alt="Propuesto ${i+1}" class="w-16 h-16 rounded-lg object-cover border border-green-500">
                        `).join('') : '<p class="text-xs text-gray-500">Sin imágenes</p>'}
                      </div>
                    </div>
                  </div>
                ` : change.isFile ? `
                  <div class="grid grid-cols-2 gap-4">
                    <div class="p-3 bg-gray-800 rounded border border-gray-600">
                      <p class="text-xs text-gray-400 mb-2">Actual:</p>
                      <p class="text-sm text-gray-300 break-all">${change.original}</p>
                    </div>
                    <div class="p-3 bg-green-900/30 rounded border border-green-600">
                      <p class="text-xs text-green-400 mb-2">Propuesto:</p>
                      <p class="text-sm text-green-100 break-all">${change.proposed}</p>
                      ${change.virusScan ? `
                        <div class="mt-2 flex items-center text-xs ${change.virusScan.isSafe ? 'text-green-400' : 'text-red-400'}">
                          <span class="mr-1">${change.virusScan.isSafe ? '🟢' : '🔴'}</span>
                          ${change.virusScan.isSafe ? 'Seguro' : 'Amenazas: ' + (change.virusScan.threats?.join(', ') || 'Desconocidas')}
                        </div>
                      ` : '<div class="mt-2 text-xs text-yellow-400">🟡 Sin escaneo</div>'}
                    </div>
                  </div>
                ` : `
                  <div class="grid grid-cols-2 gap-4">
                    <div class="p-3 bg-gray-800 rounded border border-gray-600">
                      <p class="text-xs text-gray-400 mb-2">Actual:</p>
                      <p class="text-sm text-gray-300 break-words">${change.original || 'Sin valor'}</p>
                    </div>
                    <div class="p-3 bg-green-900/30 rounded border border-green-600">
                      <p class="text-xs text-green-400 mb-2">Propuesto:</p>
                      <p class="text-sm text-green-100 break-words">${change.proposed || 'Sin valor'}</p>
                    </div>
                  </div>
                `}
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="flex gap-2 p-4 border-t border-blue-500/30 bg-gray-900">
          <button 
            data-action="close-modal"
            class="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    
    modal.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
      btn.addEventListener('click', () => modal.remove());
    });
  }

  function showDraftRejectionModal(projectId, projectTitle) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

    modal.innerHTML = `
      <div class="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
        <h3 class="text-lg font-bold mb-4 text-white">Rechazar Actualización</h3>
        <p class="text-sm text-gray-300 mb-4">Proyecto: <strong>${projectTitle}</strong></p>
        
        <form id="reject-draft-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Motivo del rechazo *</label>
            <textarea 
              name="feedback" 
              placeholder="Explica por qué rechazas estos cambios..."
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:border-red-500 focus:outline-none h-24 resize-none"
              required
            ></textarea>
            <p class="text-xs text-gray-400 mt-1">El autor recibirá este mensaje</p>
          </div>
          
          <div class="flex gap-3 pt-4">
            <button 
              type="submit"
              class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
            >
              Rechazar
            </button>
            <button 
              type="button"
              data-action="close-modal"
              class="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#reject-draft-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const feedback = formData.get('feedback');

      try {
        await ApiClient.rejectDraft(projectId, { feedback });
        Toast.show('Borrador rechazado. El autor fue notificado.', 'success');
        modal.remove();
        await loadProjects(currentStatus);
        await loadStats();
      } catch (error) {
        Toast.show(`Error: ${error.message}`, 'error');
      }
    });

    modal.querySelector('[data-action="close-modal"]').addEventListener('click', () => {
      modal.remove();
    });
  }

  function showProjectDetails(project) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-2 transition-opacity duration-300 ease-out opacity-0';
    modal.style.animation = 'fadeIn 0.3s ease-out forwards';

    const categoryNames = project.categories?.map(catCode =>
      categories.find(cat => cat.code === catCode)?.name || catCode
    ).join(', ') || 'Sin categoría';

    const ownerName = project.companyId?.ownerId?.username || 'Desconocido';
    const companyName = project.companyId?.name || 'Sin empresa';
    const participants = project.participants?.map(p => p.username || p).join(', ') || 'Ninguno';

    const statusStyles = {
      pending: 'bg-amber-300 text-amber-900',
      needs_author_review: 'bg-orange-300 text-orange-900',
      published: 'bg-teal-300 text-teal-900',
      rejected: 'bg-rose-300 text-rose-900'
    };

    modal.innerHTML = `
      <style>
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .modal-content {
          animation: slideUp 0.3s ease-out forwards;
        }
      </style>
      <div class="bg-gray-900 rounded-xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-xl modal-content overflow-hidden">
        <div class="flex justify-between items-center p-3 border-b border-indigo-500/20 bg-gradient-to-r from-indigo-800 to-purple-800">
          <div class="flex items-center space-x-2">
            ${project.iconUrl
              ? `<img src="${project.iconUrl}" alt="${project.title}" class="w-10 h-10 rounded-lg object-cover">`
              : `<div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-lg font-bold">
                  ${project.title.charAt(0).toUpperCase()}
                </div>`
            }
            <div>
              <h3 class="text-base font-bold text-white">${project.title}</h3>
              <p class="text-indigo-200 text-xs">${project.slug}</p>
            </div>
          </div>
          <button data-action="close-modal" class="text-white hover:text-gray-300 text-2xl">×</button>
        </div>
        
        <div class="overflow-y-auto p-4 flex-1 bg-gradient-to-b from-gray-900 to-gray-800">
          ${project.imageUrls?.length > 0 ? `
            <div class="mb-4 p-3 bg-gray-800 rounded-lg">
              <h4 class="font-semibold text-sm text-indigo-300 mb-2">Galería</h4>
              <div class="grid grid-cols-3 md:grid-cols-4 gap-2">
                ${project.imageUrls.map(url => `
                  <img src="${url}" alt="Screenshot" class="w-full h-16 object-cover rounded-md cursor-pointer border border-gray-700" onclick="window.open('${url}', '_blank')">
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <div class="grid md:grid-cols-3 gap-4 mb-4">
            <div class="p-3 bg-gray-800 rounded-lg space-y-2 text-xs">
              <h4 class="font-semibold text-sm text-indigo-300 border-b border-indigo-500/20 pb-1">Información General</h4>
              <p><strong>Estado:</strong> <span class="px-2 py-0.5 text-[10px] ${statusStyles[project.status] || 'bg-gray-600 text-white'} rounded-full">${project.status}</span></p>
              <p><strong>Categorías:</strong> <span class="text-gray-200">${categoryNames}</span></p>
              <p><strong>Plataformas:</strong> <span class="text-gray-200">${project.platforms?.join(', ') || 'N/A'}</span></p>
              <p><strong>Creado:</strong> <span class="text-gray-200 text-[10px]">${new Date(project.createdAt).toLocaleDateString('es-ES')}</span></p>
            </div>
            
            <div class="p-3 bg-gray-800 rounded-lg space-y-2 text-xs">
              <h4 class="font-semibold text-sm text-indigo-300 border-b border-indigo-500/20 pb-1">Empresa</h4>
              <p><strong>Empresa:</strong> <span class="text-gray-200">${companyName}</span></p>
              <p><strong>Propietario:</strong> <span class="text-gray-200">${ownerName}</span></p>
              <p><strong>Participantes:</strong> <span class="text-gray-200 text-[10px]">${participants}</span></p>
            </div>
            
            <div class="p-3 bg-gray-800 rounded-lg space-y-2 text-xs">
              <h4 class="font-semibold text-sm text-indigo-300 border-b border-indigo-500/20 pb-1">Descripciones</h4>
              <div>
                <p class="font-semibold mb-1 text-gray-200 text-[11px]">Corta:</p>
                <p class="text-gray-200 bg-gray-700 p-2 rounded-md text-[10px] max-h-16 overflow-y-auto">${project.shortDesc || 'Sin descripción'}</p>
              </div>
            </div>
          </div>
          
          ${project.files ? `
            <div class="p-3 bg-gray-800 rounded-lg space-y-2">
              <h4 class="font-semibold text-sm text-indigo-300 border-b border-indigo-500/20 pb-1">Archivos</h4>
              <div class="grid md:grid-cols-3 gap-3">
                ${project.files.app ? `
                  <div class="bg-gray-700 p-2 rounded-md text-xs">
                    <p class="font-semibold text-[10px] text-gray-200">Aplicación</p>
                    <p class="text-[10px] text-gray-300">Tipo: ${project.files.app.type}</p>
                    ${project.files.app.type === 'external'
                      ? `<a href="${project.files.app.url}" target="_blank" class="text-indigo-300 hover:text-indigo-200 text-[10px] break-all">${project.files.app.url}</a>`
                      : `<p class="text-[10px] text-gray-300">${project.files.app.fileName}</p>`
                    }
                  </div>
                ` : ''}
                ${project.files.code ? `
                  <div class="bg-gray-700 p-2 rounded-md text-xs">
                    <p class="font-semibold text-[10px] text-gray-200">Código Fuente</p>
                    <p class="text-[10px] text-gray-300">${project.files.code.fileName}</p>
                    ${project.files.code.virusScan ? `
                      <p class="text-[10px] ${project.files.code.virusScan.isSafe ? 'text-green-300' : 'text-red-300'}">
                        ${project.files.code.virusScan.isSafe ? '🟢 Seguro' : '🔴 Amenazas'}
                      </p>
                    ` : ''}
                  </div>
                ` : ''}
                ${project.files.docPdf ? `
                  <div class="bg-gray-700 p-2 rounded-md text-xs">
                    <p class="font-semibold text-[10px] text-gray-200">Documentación</p>
                    <p class="text-[10px] text-gray-300">${project.files.docPdf.fileName}</p>
                    ${project.files.docPdf.virusScan ? `
                      <p class="text-[10px] ${project.files.docPdf.virusScan.isSafe ? 'text-green-300' : 'text-red-300'}">
                        ${project.files.docPdf.virusScan.isSafe ? '🟢 Seguro' : '🔴 Amenazas'}
                      </p>
                    ` : ''}
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}
        </div>
        
        <div class="flex gap-2 flex-wrap p-3 border-t border-indigo-500/20 bg-gradient-to-r from-indigo-800 to-purple-800">
          ${project.status === 'pending' ? `
            <button 
              data-action="publish-project" 
              data-slug="${project.slug}"
              class="px-3 py-1 bg-green-500 text-green-900 text-xs rounded-md"
            >
              ✅ Publicar
            </button>
            <button 
              data-action="send-to-author" 
              data-slug="${project.slug}"
              class="px-3 py-1 bg-yellow-500 text-yellow-900 text-xs rounded-md"
            >
              ✏️ Solicitar Edición
            </button>
            <button 
              data-action="reject-project" 
              data-slug="${project.slug}"
              class="px-3 py-1 bg-red-500 text-red-900 text-xs rounded-md"
            >
              ❌ Rechazar
            </button>
          ` : ''}
          <button 
            data-action="close-modal"
            class="px-3 py-1 bg-gray-500 text-gray-100 text-xs rounded-md ml-auto"
          >
            Cerrar
          </button>
        </div>
      </div>
    `;

    modal.querySelectorAll('[data-action="close-modal"]').forEach(button => {
      button.addEventListener('click', () => modal.remove());
    });
    
    document.body.appendChild(modal);
  }

  function setupEventListeners() {
    document.body.addEventListener('click', async (e) => {
      const action = e.target.dataset.action;
      const slug = e.target.dataset.slug;
      const id = e.target.dataset.id;
      const title = e.target.dataset.title;

      if (action) {
        switch (action) {
          case 'refresh':
            await loadProjects(currentStatus);
            await loadStats();
            break;

          case 'review-draft':
            if (slug) {
              try {
                const project = await ApiClient.getProjectBySlug(slug);
                showDraftComparisonModal(project);
              } catch (error) {
                Toast.show(`Error: ${error.message}`, 'error');
              }
            }
            break;

          case 'approve-draft':
            if (id) {
              try {
                const confirmApprove = confirm('¿Aprobar estos cambios? Se aplicarán al proyecto publicado.');
                if (confirmApprove) {
                  await ApiClient.approveDraft(id);
                  Toast.show('Borrador aprobado y aplicado exitosamente', 'success');
                  await loadProjects(currentStatus);
                  await loadStats();
                }
              } catch (error) {
                Toast.show(`Error: ${error.message}`, 'error');
              }
            }
            break;

          case 'reject-draft':
            if (id && title) {
              showDraftRejectionModal(id, title);
            }
            break;

          case 'view-details':
            if (slug) {
              try {
                const project = await ApiClient.getProjectBySlug(slug);
                showProjectDetails(project);
              } catch (error) {
                Toast.show(`Error: ${error.message}`, 'error');
              }
            }
            break;

          case 'edit-project':
            if (slug) {
              try {
                const project = await ApiClient.getProjectBySlug(slug);
                const modal = document.createElement('div');
                modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
                modal.innerHTML = `
                  <div class="bg-gray-800 p-6 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <div id="edit-project-form"></div>
                  </div>
                `;
                document.body.appendChild(modal);
                
                const formContainer = modal.querySelector('#edit-project-form');
                const form = EditProjectForm(project, categories, async (data) => {
                  try {
                    await updateProject(project._id, data);
                    Toast.show('Proyecto actualizado correctamente', 'success');
                    modal.remove();
                    await loadProjects(currentStatus);
                    await loadStats();
                  } catch (error) {
                    Toast.show(`Error: ${error.message}`, 'error');
                  }
                });
                formContainer.appendChild(form);
              } catch (error) {
                Toast.show(`Error: ${error.message}`, 'error');
              }
            }
            break;

          case 'publish-project':
            if (slug) {
              try {
                const project = await ApiClient.getProjectBySlug(slug);
                await publishProject(project);
                await loadProjects(currentStatus);
                await loadStats();
              } catch (error) {
                Toast.show(`Error: ${error.message}`, 'error');
              }
            }
            break;

          case 'send-to-author':
            if (slug) {
              try {
                const project = await ApiClient.getProjectBySlug(slug);
                const modal = FeedbackModal('edit', project.title, async (data) => {
                  await sendProjectToAuthor(project, data);
                  await loadProjects(currentStatus);
                  await loadStats();
                });
                document.body.appendChild(modal);
              } catch (error) {
                Toast.show(`Error: ${error.message}`, 'error');
              }
            }
            break;

          case 'reject-project':
            if (slug) {
              try {
                const project = await ApiClient.getProjectBySlug(slug);
                const modal = FeedbackModal('reject', project.title, async (data) => {
                  await rejectProject(project, data);
                  await loadProjects(currentStatus);
                  await loadStats();
                });
                document.body.appendChild(modal);
              } catch (error) {
                Toast.show(`Error: ${error.message}`, 'error');
              }
            }
            break;

          case 'warn-project':
            if (slug) {
              try {
                const project = await ApiClient.getProjectBySlug(slug);
                const modal = FeedbackModal('warn', project.title, async (data) => {
                  await warnProject(project, data);
                  await loadProjects(currentStatus);
                  await loadStats();
                });
                document.body.appendChild(modal);
              } catch (error) {
                Toast.show(`Error: ${error.message}`, 'error');
              }
            }
            break;

          case 'delete-project':
            if (slug) {
              const confirmDelete = confirm('¿Estás seguro de que quieres eliminar este proyecto?');
              if (confirmDelete) {
                try {
                  const project = await ApiClient.getProjectBySlug(slug);
                  const modal = FeedbackModal('delete', project.title, async (data) => {
                    await deleteProject(project, data);
                    await loadProjects(currentStatus);
                    await loadStats();
                  });
                  document.body.appendChild(modal);
                } catch (error) {
                  Toast.show(`Error: ${error.message}`, 'error');
                }
              }
            }
            break;

          case 'close-modal':
            const modal = e.target.closest('.fixed.inset-0');
            if (modal) modal.remove();
            break;
        }
      }
    });

    const searchInput = document.getElementById('project-search');
    const categoryFilter = document.getElementById('category-filter');
    const platformFilter = document.getElementById('platform-filter');

    if (searchInput) searchInput.addEventListener('input', filterProjects);
    if (categoryFilter) categoryFilter.addEventListener('change', filterProjects);
    if (platformFilter) platformFilter.addEventListener('change', filterProjects);
  }

  setTimeout(async () => {
    await loadCategories();
    await loadStats();  
    await loadProjects();
    setupEventListeners();

    const firstTab = tabsContainer.querySelector('button');
    if (firstTab) {
      firstTab.classList.add('ring-2', 'ring-white');
    }
  }, 0);

  return container;
}