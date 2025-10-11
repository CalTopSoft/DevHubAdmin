import ApiClient from '../../api/client.js';

export default function FeedbackModal(type, projectTitle, onSubmit) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  
    const config = {
      reject: {
        title: 'Rechazar Proyecto',
        buttonText: 'Rechazar',
        buttonClass: 'bg-red-600 hover:bg-red-500',
        placeholder: 'Explica las razones del rechazo...',
        showExpiration: false
      },
      edit: {
        title: 'Solicitar Edición',
        buttonText: 'Enviar al Autor',
        buttonClass: 'bg-orange-600 hover:bg-orange-500',
        placeholder: 'Describe las mejoras necesarias...',
        showExpiration: false
      },
      warn: {
        title: 'Enviar Advertencia',
        buttonText: 'Enviar Advertencia',
        buttonClass: 'bg-yellow-600 hover:bg-yellow-500',
        placeholder: 'Describe los problemas detectados...',
        showExpiration: true
      },
      delete: {
        title: 'Eliminar Proyecto',
        buttonText: 'Eliminar',
        buttonClass: 'bg-red-700 hover:bg-red-600',
        placeholder: 'Explica los motivos de eliminación...',
        showExpiration: false
      }
    };
  
    const currentConfig = config[type];
  
    modal.innerHTML = `
      <div class="bg-gray-800 p-6 rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            ${currentConfig.title}
          </h3>
          <button data-action="close-modal" class="text-gray-400 hover:text-white">✕</button>
        </div>
  
        <div class="mb-4 text-gray-300">
          <strong>Proyecto:</strong> ${projectTitle}
        </div>
  
        <form id="feedback-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Motivos (selecciona uno o más):</label>
            <div id="reasons-checkboxes" class="space-y-2 max-h-32 overflow-y-auto border border-gray-600 rounded p-3">
              <!-- Los checkboxes se cargarán dinámicamente -->
            </div>
          </div>
  
          <div>
            <label class="block text-sm font-medium mb-1">Mensaje personalizado (opcional):</label>
            <textarea 
              name="customMessage" 
              placeholder="${currentConfig.placeholder}"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:border-purple-500 focus:outline-none h-24 resize-none"
            ></textarea>
          </div>
  
          ${currentConfig.showExpiration ? `
          <div>
            <label class="block text-sm font-medium mb-1">Días para resolver (opcional):</label>
            <input 
              type="number" 
              name="expiresInDays" 
              min="1" 
              max="30" 
              placeholder="Ej: 7"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:border-purple-500 focus:outline-none"
            >
            <small class="text-gray-400">Si no se especifica, la advertencia no tendrá fecha límite</small>
          </div>
          ` : ''}
  
          <div class="flex gap-3 pt-4">
            <button 
              type="submit"
              class="flex-1 px-4 py-2 ${currentConfig.buttonClass} text-white rounded-lg transition-colors"
            >
              ${currentConfig.buttonText}
            </button>
            <button 
              type="button"
              data-action="close-modal"
              class="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    `;
  
    // Cargar motivos desde el backend
    async function loadReasons() {
        try {
        const reasons = await ApiClient.getFeedbackReasons();
        const reasonsContainer = modal.querySelector('#reasons-checkboxes');
        
        const reasonsMap = {
            reject: reasons.rejection,
            edit: reasons.edit,
            warn: reasons.warning,
            delete: reasons.deletion
        };
    
        const currentReasons = reasonsMap[type];
        
        reasonsContainer.innerHTML = Object.entries(currentReasons).map(([key, value]) => `
            <label class="flex items-center space-x-2 cursor-pointer hover:bg-gray-700 p-2 rounded">
            <input type="checkbox" name="reasons" value="${value}" class="text-purple-600">
            <span class="text-sm">${value}</span>
            </label>
        `).join('');
    
        } catch (error) {
        console.error('Error loading reasons:', error);
        modal.querySelector('#reasons-checkboxes').innerHTML = `
            <p class="text-red-400 text-sm">Error al cargar motivos predefinidos</p>
        `;
        }
    }
  
    // Event listeners
    modal.addEventListener('click', (e) => {
      if (e.target.dataset.action === 'close-modal' || e.target === modal) {
        modal.remove();
      }
    });
  
    modal.querySelector('#feedback-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        // DEBUG: Vamos a ver qué está pasando
        console.log('=== DEBUG FEEDBACK FORM ===');
        console.log('Form target:', e.target);
        
        const checkboxes = e.target.querySelectorAll('input[name="reasons"]');
        console.log('Todos los checkboxes encontrados:', checkboxes.length);
        
        const checkedBoxes = e.target.querySelectorAll('input[name="reasons"]:checked');
        console.log('Checkboxes marcados:', checkedBoxes.length);
        
        checkedBoxes.forEach((checkbox, index) => {
          console.log(`Checkbox ${index}:`, checkbox.value);
        });
        
        const selectedReasons = Array.from(checkedBoxes).map(checkbox => checkbox.value);
        console.log('Selected reasons array:', selectedReasons);
        console.log('Selected reasons length:', selectedReasons.length);
        
        if (selectedReasons.length === 0) {
          alert('Debes seleccionar al menos un motivo');
          return;
        }
      
        const data = {
          reasons: selectedReasons,
          customMessage: formData.get('customMessage') || undefined
        };
        
        console.log('Data being sent:', data);
        console.log('=== END DEBUG ===');
      
        if (type === 'warn' && formData.get('expiresInDays')) {
          data.expiresInDays = parseInt(formData.get('expiresInDays'));
        }
      
        try {
          await onSubmit(data);
          modal.remove();
        } catch (error) {
          console.error('Error in onSubmit:', error);
        }
      });
  
    // Cargar motivos después de insertar el modal
    setTimeout(loadReasons, 0);
  
    return modal;
  }