// public/js/ui/components/ProfileCard.js

import { Icons } from './icons.js';

export function createProfileModal(user) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';

  const modal = document.createElement('div');
  modal.className = 'bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto';

  const card = renderProfileCard(user);

  const header = document.createElement('div');
  header.className = 'flex items-center justify-between p-4 border-b border-gray-800';
  header.innerHTML = `
    <h3 class="text-lg font-semibold text-white">Perfil de ${user.username || 'Usuario'}</h3>
<button
  data-action="close-modal"
  class="text-gray-400 hover:text-white transition-colors"
>
  <span class="w-5 h-5 flex items-center justify-center
               [&>svg]:w-full [&>svg]:h-full">
    ${Icons.close}
  </span>
</button>

  `;

  modal.appendChild(header);
  modal.appendChild(card);
  overlay.appendChild(modal);

  return overlay;
}

export function renderProfileCard(user) {
  const card = document.createElement('div');
  card.className = 'p-4 space-y-6';

  user = user || {};
  user.contacts = user.contacts || {};

  const isVerified = user.isVerified !== false;

  // Header
  const headerHtml = `
    <div class="flex items-center gap-4">
      ${user.photo ? `
        <img src="${user.photo}" alt="${user.username}" class="w-16 h-16 rounded-full object-cover border-2 border-gray-700">
      ` : `
        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
          ${(user.username || 'U').charAt(0).toUpperCase()}
        </div>
      `}
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <h3 class="text-xl font-bold text-white truncate">${user.username || '—'}</h3>
          ${isVerified ? `<span class="w-5 h-5 text-green-500 flex-shrink-0" title="Verificado">${Icons.check}</span>` : ''}
        </div>
        <p class="text-sm text-gray-400 truncate">${user.email || '—'}</p>
        <span class="inline-flex items-center gap-1 mt-2 px-2 py-1 text-xs font-medium rounded-full ${
          user.role === 'admin' ? 'bg-purple-900/50 text-purple-300' : 'bg-blue-900/50 text-blue-300'
        }">
          <span class="w-4 h-4 flex-shrink-0 leading-none [&>svg]:w-full [&>svg]:h-full">${user.role === 'admin' ? Icons.admin : Icons.user}</span>
          ${user.role === 'admin' ? 'Admin' : 'Usuario'}
        </span>
      </div>
    </div>
  `;

  // Personal Info
  const personalInfo = `
    <div class="space-y-3">
      <h4 class="text-sm font-semibold text-gray-300 flex items-center gap-2">
        <span class="w-4 h-4 flex-shrink-0 leading-none [&>svg]:w-full [&>svg]:h-full">${Icons.info}</span> Información Personal
      </h4>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="bg-gray-800 p-3 rounded-lg">
          <p class="text-xs text-gray-500 mb-1">ID</p>
          <p class="text-sm text-white font-mono truncate">${user._id || '—'}</p>
        </div>
        <div class="bg-gray-800 p-3 rounded-lg">
          <p class="text-xs text-gray-500 mb-1">Email</p>
          <p class="text-sm text-white truncate">${user.email || '—'}</p>
        </div>
        ${user.career ? `
          <div class="bg-gray-800 p-3 rounded-lg sm:col-span-2">
            <p class="text-xs text-gray-500 mb-1">Carrera</p>
            <p class="text-sm text-white">${user.career}</p>
          </div>
        ` : ''}
        ${user.semester ? `
          <div class="bg-gray-800 p-3 rounded-lg">
            <p class="text-xs text-gray-500 mb-1">Semestre</p>
            <p class="text-sm text-white">${user.semester}</p>
          </div>
        ` : ''}
        ${user.age ? `
          <div class="bg-gray-800 p-3 rounded-lg">
            <p class="text-xs text-gray-500 mb-1">Edad</p>
            <p class="text-sm text-white">${user.age} años</p>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  // Stats
  const stats = `
    <div class="space-y-3">
      <h4 class="text-sm font-semibold text-gray-300 flex items-center gap-2">
        <span class="w-4 h-4 flex-shrink-0 leading-none [&>svg]:w-full [&>svg]:h-full">${Icons.stats}</span> Estadísticas
      </h4>
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-gray-800 p-4 rounded-lg text-center">
          <div class="text-2xl font-bold text-blue-400 mb-1">${user.projectsCount || 0}</div>
          <div class="text-xs text-gray-400 flex items-center justify-center gap-1">
            <span class="w-4 h-4 flex-shrink-0 leading-none [&>svg]:w-full [&>svg]:h-full">${Icons.projects}</span> Proyectos
          </div>
        </div>
        <div class="bg-gray-800 p-4 rounded-lg text-center">
          <div class="text-2xl font-bold text-purple-400 mb-1">${user.companiesCount || 0}</div>
          <div class="text-xs text-gray-400 flex items-center justify-center gap-1">
            <span class="w-4 h-4 flex-shrink-0 leading-none [&>svg]:w-full [&>svg]:h-full">${Icons.company}</span> Empresas
          </div>
        </div>
      </div>
    </div>
  `;

  // Contacts
  let contactsHtml = '';
  if (Object.keys(user.contacts).length > 0) {
    contactsHtml = `
      <div class="space-y-3">
        <h4 class="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <span class="w-4 h-4 flex-shrink-0 leading-none [&>svg]:w-full [&>svg]:h-full">${Icons.contact}</span> Contactos
        </h4>
        <div class="space-y-2">
          ${user.contacts.whatsapp ? `
            <a href="https://wa.me/${user.contacts.whatsapp.replace(/\D/g, '')}" target="_blank" class="flex items-center justify-between bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition-colors">
              <div class="flex items-center gap-2">
                <span class="text-green-500 w-4 h-4 flex-shrink-0 leading-none [&>svg]:w-full [&>svg]:h-full">${Icons.whatsapp}</span>
                <span class="text-xs text-gray-400">WhatsApp</span>
              </div>
              <span class="text-sm text-white font-mono">${user.contacts.whatsapp}</span>
            </a>
          ` : ''}
          ${user.contacts.email ? `
            <a href="mailto:${user.contacts.email}" class="flex items-center justify-between bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition-colors">
              <div class="flex items-center gap-2">
                <span class="text-red-500 w-4 h-4 flex-shrink-0 leading-none [&>svg]:w-full [&>svg]:h-full">${Icons.gmail}</span>
                <span class="text-xs text-gray-400">Gmail</span>
              </div>
              <span class="text-sm text-white truncate max-w-[60%]">${user.contacts.email}</span>
            </a>
          ` : ''}
          ${user.contacts.outlook ? `
            <a href="mailto:${user.contacts.outlook}" class="flex items-center justify-between bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition-colors">
              <div class="flex items-center gap-2">
                <span class="text-blue-500 w-4 h-4 flex-shrink-0 leading-none [&>svg]:w-full [&>svg]:h-full">${Icons.outlook}</span>
                <span class="text-xs text-gray-400">Outlook</span>
              </div>
              <span class="text-sm text-white truncate max-w-[60%]">${user.contacts.outlook}</span>
            </a>
          ` : ''}
          ${user.contacts.discord ? `
            <div class="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
              <div class="flex items-center gap-2">
                <span class="text-indigo-500 w-4 h-4 flex-shrink-0 leading-none [&>svg]:w-full [&>svg]:h-full">${Icons.discord}</span>
                <span class="text-xs text-gray-400">Discord</span>
              </div>
              <span class="text-sm text-white font-mono">${user.contacts.discord}</span>
            </div>
          ` : ''}
          ${user.contacts.linkedin ? `
            <a href="${user.contacts.linkedin}" target="_blank" class="flex items-center justify-between bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition-colors">
              <div class="flex items-center gap-2">
                <span class="text-blue-600 w-4 h-4 flex-shrink-0 leading-none [&>svg]:w-full [&>svg]:h-full">${Icons.linkedin}</span>
                <span class="text-xs text-gray-400">LinkedIn</span>
              </div>
              <span class="text-sm text-blue-400 truncate max-w-[60%]">${user.contacts.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\//, '')}</span>
            </a>
          ` : ''}
        </div>
      </div>
    `;
  }

  card.innerHTML = headerHtml + personalInfo + stats + contactsHtml;

  return card;
}