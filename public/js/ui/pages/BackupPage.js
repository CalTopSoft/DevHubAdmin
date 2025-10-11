import { exportBackup, importBackup } from '../../api/backup.js';
import Toast from '../components/Toast.js';
import ApiClient from '../../api/client.js';

export default function BackupPage() {
  const container = document.createElement('div');
  container.className = 'space-y-6';

  const title = document.createElement('h2');
  title.className = 'text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400';
  title.textContent = 'Gestión de Backup';
  container.appendChild(title);

  // Información del sistema
  const infoSection = document.createElement('div');
  infoSection.className = 'grid grid-cols-1 md:grid-cols-2 gap-6 mb-6';
  
  const systemInfo = document.createElement('div');
  systemInfo.className = 'card p-6 rounded-lg';
  systemInfo.innerHTML = `
    <h3 class="text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
      💾 Información del Sistema
    </h3>
    <div class="space-y-3">
      <div class="flex justify-between">
        <span class="text-gray-400">Último backup:</span>
        <span id="last-backup">Nunca</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-400">Tamaño estimado:</span>
        <span id="db-size">Calculando...</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-400">Estado de la base de datos:</span>
        <span id="db-status" class="flex items-center">
          <span class="animate-pulse">🟡</span>
          <span class="ml-1">Comprobando...</span>
        </span>
      </div>
    </div>
  `;

  const backupHistory = document.createElement('div');
  backupHistory.className = 'card p-6 rounded-lg';
  backupHistory.innerHTML = `
    <h3 class="text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
      📋 Historial de Backups
    </h3>
    <div class="space-y-2" id="backup-history-list">
      <div class="text-sm text-gray-400">No hay backups anteriores</div>
    </div>
  `;

  infoSection.appendChild(systemInfo);
  infoSection.appendChild(backupHistory);
  container.appendChild(infoSection);

  // Opciones de backup
  const backupOptions = document.createElement('div');
  backupOptions.className = 'card p-6 rounded-lg';
  backupOptions.innerHTML = `
    <h3 class="text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
      ⚙️ Opciones de Backup
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <h4 class="font-medium text-gray-300">Seleccionar datos:</h4>
          <button id="select-all" class="text-sm text-purple-400 hover:text-purple-300">Seleccionar todo</button>
        </div>
        <label class="flex items-center">
          <input type="checkbox" id="backup-users" checked class="mr-3 text-purple-600">
          <span>👤 Usuarios (recomendado)</span>
        </label>
        <label class="flex items-center">
          <input type="checkbox" id="backup-companies" checked class="mr-3 text-purple-600">
          <span>🏢 Empresas (recomendado)</span>
        </label>
        <label class="flex items-center">
          <input type="checkbox" id="backup-projects" checked class="mr-3 text-purple-600">
          <span>📁 Proyectos (recomendado)</span>
        </label>
        <label class="flex items-center">
          <input type="checkbox" id="backup-projectcategories" checked class="mr-3 text-purple-600">
          <span>📋 Categorías de Proyectos</span>
        </label>
        <label class="flex items-center">
          <input type="checkbox" id="backup-roles" checked class="mr-3 text-purple-600">
          <span>👥 Roles</span>
        </label>
        <label class="flex items-center">
          <input type="checkbox" id="backup-reviews" checked class="mr-3 text-purple-600">
          <span>⭐ Reviews</span>
        </label>
        <label class="flex items-center">
          <input type="checkbox" id="backup-audits" class="mr-3 text-purple-600">
          <span>📊 Auditorías</span>
        </label>
        <label class="flex items-center">
          <input type="checkbox" id="backup-notifications" class="mr-3 text-purple-600">
          <span>🔔 Notificaciones</span>
        </label>
      </div>
      <div class="space-y-4">
        <h4 class="font-medium text-gray-300">Formato:</h4>
        <label class="flex items-center">
          <input type="radio" name="format" value="json" checked class="mr-3 text-purple-600">
          <span>JSON (recomendado)</span>
        </label>
        <label class="flex items-center">
          <input type="radio" name="format" value="csv" class="mr-3 text-purple-600">
          <span>CSV (para análisis)</span>
        </label>
        <div class="mt-4">
          <h4 class="font-medium text-gray-300 mb-2">Compresión:</h4>
          <label class="flex items-center">
            <input type="checkbox" id="compress-backup" class="mr-3 text-purple-600">
            <span>Comprimir archivo (reduce tamaño)</span>
          </label>
        </div>
      </div>
    </div>
  `;
  container.appendChild(backupOptions);

  // Acciones de backup
  const actionsSection = document.createElement('div');
  actionsSection.className = 'grid grid-cols-1 md:grid-cols-3 gap-4';
  
  actionsSection.innerHTML = `
    <button id="export-backup" class="card p-6 rounded-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center">
      <div class="text-4xl mb-3">💾</div>
      <h3 class="text-lg font-semibold mb-2">Exportar Backup</h3>
      <p class="text-sm text-gray-400">Descargar copia de seguridad completa</p>
    </button>
    
    <button id="quick-backup" class="card p-6 rounded-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center">
      <div class="text-4xl mb-3">⚡</div>
      <h3 class="text-lg font-semibold mb-2">Backup Rápido</h3>
      <p class="text-sm text-gray-400">Solo datos esenciales (usuarios, proyectos)</p>
    </button>
    
    <button id="schedule-backup" class="card p-6 rounded-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center">
      <div class="text-4xl mb-3">⏰</div>
      <h3 class="text-lg font-semibold mb-2">Programar</h3>
      <p class="text-sm text-gray-400">Configurar backups automáticos</p>
    </button>
  `;
  container.appendChild(actionsSection);

  // Sección de restauración
  const restoreSection = document.createElement('div');
  restoreSection.className = 'card p-6 rounded-lg';
  restoreSection.innerHTML = `
    <h3 class="text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
      🔄 Restaurar Backup
    </h3>
    <div class="space-y-4">
      <p class="text-sm text-gray-400">Sube un archivo JSON de backup para restaurar los datos.</p>
      <input type="file" id="restore-file" accept=".json" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg">
      <button id="restore-backup" class="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors">
        Restaurar
      </button>
      <p class="text-sm text-yellow-400">⚠️ Esto sobrescribirá los datos actuales. Asegúrate de tener un backup reciente.</p>
    </div>
  `;
  container.appendChild(restoreSection);

  // Información adicional
  const infoCard = document.createElement('div');
  infoCard.className = 'card p-6 rounded-lg';
  infoCard.innerHTML = `
    <h3 class="text-lg font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
      ℹ️ Información Importante
    </h3>
    <div class="space-y-3 text-sm text-gray-400">
      <div class="flex items-start">
        <span class="text-green-400 mr-2">•</span>
        <span>Los backups incluyen toda la información de la base de datos en formato JSON</span>
      </div>
      <div class="flex items-start">
        <span class="text-green-400 mr-2">•</span>
        <span>Se recomienda realizar backups regularmente, especialmente antes de actualizaciones</span>
      </div>
      <div class="flex items-start">
        <span class="text-yellow-400 mr-2">•</span>
        <span>Los archivos pueden ser grandes dependiendo del volumen de datos</span>
      </div>
      <div class="flex items-start">
        <span class="text-red-400 mr-2">•</span>
        <span>Almacena los backups en un lugar seguro y verifica su integridad regularmente</span>
      </div>
    </div>
  `;
  container.appendChild(infoCard);

  // === FUNCIONES AUXILIARES ===

  // Función para mostrar/ocultar loading overlay
  function showLoadingOverlay(message = 'Procesando...') {
    // Verificar si ya existe un overlay
    if (document.getElementById('loading-overlay')) {
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    // Usar z-index numérico muy alto y posición fixed
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
    `;
    
    overlay.innerHTML = `
      <div style="
        background-color: #1f2937;
        padding: 2rem;
        border-radius: 1rem;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        text-align: center;
        max-width: 20rem;
        width: 100%;
        margin: 0 1rem;
      ">
        <!-- Spinner animado -->
        <div style="display: flex; justify-content: center; margin-bottom: 1.5rem;">
          <div style="position: relative;">
            <div style="
              width: 4rem;
              height: 4rem;
              border: 4px solid #4b5563;
              border-radius: 50%;
            "></div>
            <div style="
              width: 4rem;
              height: 4rem;
              border: 4px solid #8b5cf6;
              border-top: 4px solid transparent;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              position: absolute;
              top: 0;
              left: 0;
            "></div>
          </div>
        </div>
        
        <!-- Mensaje -->
        <h3 style="
          font-size: 1.125rem;
          font-weight: 600;
          color: white;
          margin-bottom: 0.5rem;
        ">${message}</h3>
        <p style="
          font-size: 0.875rem;
          color: #9ca3af;
          margin-bottom: 1rem;
        ">Por favor espera, no cierres la página...</p>
        
        <!-- Barra de progreso -->
        <div style="
          background-color: #374151;
          border-radius: 9999px;
          height: 0.5rem;
        ">
          <div style="
            background: linear-gradient(to right, #8b5cf6, #3b82f6);
            height: 0.5rem;
            border-radius: 9999px;
            width: 60%;
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          "></div>
        </div>
      </div>
      
      <!-- Estilos CSS para animaciones -->
      <style>
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      </style>
    `;
    
    // Prevenir clics en el overlay
    overlay.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    // Añadir al final del body para asegurar que esté encima
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden'; // Prevenir scroll
  }

  function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.remove();
      document.body.style.overflow = ''; // Restaurar scroll
    }
  }

  // Funciones de backup
  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  function updateBackupHistory() {
    const historyList = document.getElementById('backup-history-list');
    const lastBackups = JSON.parse(localStorage.getItem('backup-history') || '[]');
    
    if (lastBackups.length === 0) {
      historyList.innerHTML = '<div class="text-sm text-gray-400">No hay backups anteriores</div>';
      return;
    }

    historyList.innerHTML = lastBackups.slice(0, 3).map(backup => `
      <div class="flex justify-between items-center py-2 border-b border-gray-700/50">
        <span class="text-sm">${backup.date}</span>
        <span class="text-xs text-gray-500">${backup.size}</span>
      </div>
    `).join('');
  }

  function addToHistory(size) {
    const history = JSON.parse(localStorage.getItem('backup-history') || '[]');
    const newBackup = {
      date: new Date().toLocaleString('es-ES'),
      size: formatSize(size)
    };
    
    history.unshift(newBackup);
    if (history.length > 10) history.pop();
    
    localStorage.setItem('backup-history', JSON.stringify(history));
    localStorage.setItem('last-backup', newBackup.date);
    
    updateBackupHistory();
    document.getElementById('last-backup').textContent = newBackup.date;
  }

  function getSelectedData() {
    const selected = [];
    if (document.getElementById('backup-users').checked) selected.push('users');
    if (document.getElementById('backup-companies').checked) selected.push('companies');
    if (document.getElementById('backup-projects').checked) selected.push('projects');
    if (document.getElementById('backup-projectcategories').checked) selected.push('projectcategories');
    if (document.getElementById('backup-roles').checked) selected.push('roles');
    if (document.getElementById('backup-reviews').checked) selected.push('reviews');
    if (document.getElementById('backup-audits').checked) selected.push('audits');
    if (document.getElementById('backup-notifications').checked) selected.push('notifications');
    return selected;
  }

  async function checkDatabaseStatus() {
    const isOnline = await ApiClient.pingServer();
    const statusElement = document.getElementById('db-status');
    statusElement.innerHTML = isOnline
      ? `<span class="text-green-400">🟢</span><span class="ml-1">Online</span>`
      : `<span class="text-red-400">🔴</span><span class="ml-1">Offline</span>`;
  }

  // Event listeners
  setTimeout(() => {
    // Botón Seleccionar todo
    document.getElementById('select-all').addEventListener('click', () => {
      const checkboxes = [
        'backup-users', 'backup-companies', 'backup-projects',
        'backup-projectcategories', 'backup-roles', 'backup-reviews',
        'backup-audits', 'backup-notifications'
      ];
      const allChecked = checkboxes.every(id => document.getElementById(id).checked);
      checkboxes.forEach(id => {
        document.getElementById(id).checked = !allChecked;
      });
      document.getElementById('select-all').textContent = allChecked ? 'Seleccionar todo' : 'Deseleccionar todo';
    });

    // Backup completo
    document.getElementById('export-backup').addEventListener('click', async () => {
      const button = document.getElementById('export-backup');
      const originalText = button.innerHTML;
      
      try {
        button.innerHTML = `
          <div class="text-4xl mb-3">⏳</div>
          <h3 class="text-lg font-semibold mb-2">Exportando...</h3>
          <p class="text-sm text-gray-400">Por favor espera</p>
        `;
        button.disabled = true;

        const selectedData = getSelectedData();
        const { size } = await exportBackup(selectedData);
        addToHistory(size);
      } catch (error) {
        Toast.show(`Error al exportar backup: ${error.message}`, 'error');
      } finally {
        button.innerHTML = originalText;
        button.disabled = false;
      }
    });

    // Backup rápido
    document.getElementById('quick-backup').addEventListener('click', async () => {
      const button = document.getElementById('quick-backup');
      const originalText = button.innerHTML;
      
      try {
        button.innerHTML = `
          <div class="text-4xl mb-3">⏳</div>
          <h3 class="text-lg font-semibold mb-2">Procesando...</h3>
          <p class="text-sm text-gray-400">Backup rápido</p>
        `;
        button.disabled = true;

        const selectedData = ['users', 'projects'];
        const { size } = await exportBackup(selectedData);
        addToHistory(size);
      } catch (error) {
        Toast.show(`Error en backup rápido: ${error.message}`, 'error');
      } finally {
        button.innerHTML = originalText;
        button.disabled = false;
      }
    });

    // Programar backup
    document.getElementById('schedule-backup').addEventListener('click', () => {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold">Programar Backup</h3>
            <button data-action="close-modal" class="text-gray-400 hover:text-white">✕</button>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Frecuencia:</label>
              <select class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg">
                <option>Diario</option>
                <option>Semanal</option>
                <option>Mensual</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Hora:</label>
              <input type="time" value="02:00" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg">
            </div>
            <div class="text-sm text-yellow-400 bg-yellow-900/20 p-3 rounded">
              ⚠️ Funcionalidad en desarrollo. Los backups automáticos requieren configuración del servidor.
            </div>
            <div class="flex gap-3">
              <button data-action="close-modal" class="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500">
                Cancelar
              </button>
              <button onclick="Toast.show('Funcionalidad próximamente', 'info'); this.closest('.fixed').remove();" class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500">
                Programar
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    });

    // === RESTAURAR BACKUP CON LOADING OVERLAY ===
    document.getElementById('restore-backup').addEventListener('click', async () => {
      const fileInput = document.getElementById('restore-file');
      if (!fileInput.files.length) {
        Toast.show('Por favor selecciona un archivo JSON', 'error');
        return;
      }

      const restoreButton = document.getElementById('restore-backup');
      
      try {
        // Mostrar overlay de carga
        showLoadingOverlay('Restaurando backup...');
        
        // Deshabilitar botón para evitar múltiples clics
        restoreButton.disabled = true;
        restoreButton.textContent = 'Restaurando...';
        
        // Realizar la restauración
        await importBackup(fileInput.files[0]);
        
        // Limpiar el input del archivo
        fileInput.value = '';
        
        // Mostrar mensaje de éxito
        Toast.show('Backup restaurado exitosamente', 'success');
        
      } catch (error) {
        // El error ya es manejado en importBackup, pero podemos agregar logging adicional
        console.error('Error en restauración:', error);
        
        // Mostrar toast de error si no se mostró antes
        if (!error.message.includes('ya manejado')) {
          Toast.show(`Error al restaurar backup: ${error.message}`, 'error');
        }
        
      } finally {
        // Ocultar overlay y restaurar botón
        hideLoadingOverlay();
        restoreButton.disabled = false;
        restoreButton.textContent = 'Restaurar';
      }
    });

    // Actualizar información inicial
    const lastBackup = localStorage.getItem('last-backup');
    if (lastBackup) {
      document.getElementById('last-backup').textContent = lastBackup;
    }

    async function updateDbSize() {
      try {
        // Obtener tamaño exacto desde el servidor
        const { size } = await ApiClient.getBackupSize();
    
        // Mostrar tamaño exacto en formato legible
        document.getElementById('db-size').textContent = formatSize(size);
      } catch (error) {
        console.error('Error obteniendo tamaño de DB:', error);
        document.getElementById('db-size').textContent = 'No disponible';
      }
    }

    updateDbSize();
    checkDatabaseStatus();
    setInterval(checkDatabaseStatus, 90000);
    updateBackupHistory();

    // Event delegation para cerrar modales
    document.addEventListener('click', (e) => {
      if (e.target.dataset.action === 'close-modal') {
        const modal = e.target.closest('.fixed');
        if (modal) modal.remove();
      }
    });

  }, 100);

  return container;
}