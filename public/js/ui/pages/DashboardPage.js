import ApiClient from '../../api/client.js';
import StatsCards from '../components/StatsCards.js';
import Toast from '../components/Toast.js';

export default async function DashboardPage() {
  console.log('Renderizando DashboardPage');
  const container = document.createElement('div');
  container.className = 'space-y-6';

  const title = document.createElement('h2');
  title.className = 'text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400';
  title.textContent = 'Dashboard';
  container.appendChild(title);

  // Loading inicial
  const loadingStats = StatsCards();
  container.appendChild(loadingStats);

  try {
    console.log('Cargando estadísticas...');
    const stats = await ApiClient.getStats();
    console.log('Estadísticas recibidas:', stats);
    
    // Reemplazar con datos reales
    container.removeChild(loadingStats);
    const realStats = StatsCards(stats);
    container.appendChild(realStats);

    // Añadir información adicional
    const infoSection = document.createElement('div');
    infoSection.className = 'grid grid-cols-1 md:grid-cols-2 gap-6 mt-8';
    
    // Actividad reciente
    const activityCard = document.createElement('div');
    activityCard.className = 'card p-6 rounded-lg';
    activityCard.innerHTML = `
      <h3 class="text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">Actividad Reciente</h3>
      <div class="space-y-3">
        <div class="flex items-center text-sm">
          <span class="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
          <span>Sistema funcionando correctamente</span>
        </div>
        <div class="flex items-center text-sm">
          <span class="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
          <span>${stats.users} usuarios registrados</span>
        </div>
        <div class="flex items-center text-sm">
          <span class="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
          <span>${stats.projects} proyectos en el sistema</span>
        </div>
      </div>
    `;
    
    // Accesos rápidos
    const quickActions = document.createElement('div');
    quickActions.className = 'card p-6 rounded-lg';
    quickActions.innerHTML = `
      <h3 class="text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">Accesos Rápidos</h3>
      <div class="grid grid-cols-2 gap-3">
        <a href="#users" class="block p-3 bg-gray-700/50 rounded-lg hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-blue-500/20 transition-all duration-300">
          <div class="text-2xl mb-2">👥</div>
          <div class="text-sm font-medium">Gestionar Usuarios</div>
        </a>
        <a href="#projects" class="block p-3 bg-gray-700/50 rounded-lg hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-blue-500/20 transition-all duration-300">
          <div class="text-2xl mb-2">📁</div>
          <div class="text-sm font-medium">Revisar Proyectos</div>
        </a>
        <a href="#companies" class="block p-3 bg-gray-700/50 rounded-lg hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-blue-500/20 transition-all duration-300">
          <div class="text-2xl mb-2">🏢</div>
          <div class="text-sm font-medium">Ver Empresas</div>
        </a>
        <a href="#backup" class="block p-3 bg-gray-700/50 rounded-lg hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-blue-500/20 transition-all duration-300">
          <div class="text-2xl mb-2">💾</div>
          <div class="text-sm font-medium">Backup</div>
        </a>
      </div>
    `;

    infoSection.appendChild(activityCard);
    infoSection.appendChild(quickActions);
    container.appendChild(infoSection);

  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
    Toast.show(`Error al cargar datos: ${error.message}`, 'error');
    container.removeChild(loadingStats);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'text-red-400 p-4 bg-red-900/20 rounded-lg border border-red-500/30';
    errorDiv.innerHTML = `
      <h3 class="font-semibold mb-2">Error al cargar datos</h3>
      <p class="text-sm">${error.message}</p>
      <button onclick="window.location.reload()" class="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 transition-colors">
        Reintentar
      </button>
    `;
    container.appendChild(errorDiv);
  }

  return container;
}