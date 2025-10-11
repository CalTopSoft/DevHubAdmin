import ApiClient from '../../api/client.js';
import Toast from './Toast.js';

export default function MemberRolesEditor(member, onSubmit) {
  const form = document.createElement('div');
  form.className = 'form-container';

  let availableRoles = [];

  // Cargar roles desde la API
  async function loadRoles() {
    try {
      availableRoles = await ApiClient.getRoles();
      renderForm();
    } catch (error) {
      Toast.show(`Error al cargar roles: ${error.message}`, 'error');
      form.innerHTML = `<p class="text-red-400">Error al cargar roles</p>`;
    }
  }

  function renderForm() {
    const selectedRoles = member.roles || [];

    form.innerHTML = `
      <h3 class="text-xl font-bold mb-4">Editar Roles de ${member.userId?.username || 'Usuario desconocido'}</h3>
      <div class="form-group">
        <label>Roles (máximo 3)</label>
        <div class="space-y-2">
          ${availableRoles.map(role => `
            <label class="flex items-center">
              <input type="checkbox" value="${role.name}" ${selectedRoles.includes(role.name) ? 'checked' : ''} class="mr-2">
              ${role.name}
            </label>
          `).join('')}
        </div>
      </div>
      <div class="flex gap-3 pt-4">
        <button id="submit" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500">Guardar</button>
        <button id="cancel" class="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500">Cancelar</button>
      </div>
    `;

    form.querySelector('#submit').onclick = () => {
      const checkboxes = form.querySelectorAll('input[type="checkbox"]:checked');
      const roles = Array.from(checkboxes).map(cb => cb.value);
      if (roles.length > 3) {
        Toast.show('Máximo 3 roles por miembro', 'error');
        return;
      }
      onSubmit({ roles });
    };

    form.querySelector('#cancel').onclick = () => {
      form.closest('.fixed.inset-0')?.remove();
    };
  }

  // Cargar roles al montar el componente
  loadRoles();

  return form;
}