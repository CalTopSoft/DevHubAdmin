export default function Sidebar() {
  console.log('Renderizando Sidebar');
  const nav = document.createElement('nav');
  nav.className = 'space-y-2';

  // Indicador de estado del servidor - mejor ubicado
  const serverStatus = document.createElement('div');
  serverStatus.className = 'mb-4 p-3 rounded-lg bg-gray-800/50 border border-gray-600/30';
  serverStatus.innerHTML = `
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium text-gray-300">Estado del Servidor</span>
      <span id="server-status" class="flex items-center">
        <span class="animate-pulse">🟡</span>
        <span class="ml-2 text-sm text-gray-400">Comprobando...</span>
      </span>
    </div>
  `;
  nav.appendChild(serverStatus);

  const links = [
    { href: '#dashboard', text: 'Dashboard' },
    { href: '#users', text: 'Usuarios' },
    { href: '#companies', text: 'Empresas' },
    { href: '#projects', text: 'Proyectos' },
    { href: '#catg-roles', text: 'Categorías y Roles' },
    { href: '#backup', text: 'Backup' }
  ];

  links.forEach(link => {
    console.log(`Creando enlace: ${link.text}`);
    const a = document.createElement('a');
    a.href = link.href;
    a.className = 'block py-2 px-4 rounded bg-gray-700/50 hover:bg-gradient-to-r hover:from-purple-500 hover:to-blue-500 transition-all duration-300';
    a.textContent = link.text;
    nav.appendChild(a);
  });

  // Función simple para verificar estado del servidor
  async function checkServerStatus() {
    try {
      // Usar ApiClient para mantener consistencia con la configuración
      const response = await fetch('https://backend-devhub-hdf7.onrender.com/api', { 
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const isOnline = response.ok;
      const statusElement = document.getElementById('server-status');
      
      if (statusElement) {
        statusElement.innerHTML = isOnline
          ? `<span class="text-green-400">🟢</span><span class="ml-2 text-sm text-green-400 font-medium">Online</span>`
          : `<span class="text-red-400">🔴</span><span class="ml-2 text-sm text-red-400 font-medium">Offline</span>`;
      }
    } catch (error) {
      console.log('Error checking server status:', error);
      const statusElement = document.getElementById('server-status');
      if (statusElement) {
        statusElement.innerHTML = `<span class="text-red-400">🔴</span><span class="ml-2 text-sm text-red-400 font-medium">Offline</span>`;
      }
    }
  }

  // Comprobar estado al cargar y cada 10 segundos
  setTimeout(checkServerStatus, 1000); // Esperar 1 segundo antes del primer check
  setInterval(checkServerStatus, 90000);

  return nav;
}
