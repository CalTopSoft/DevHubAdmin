import { auth } from './utils/auth.js';
import Sidebar from './ui/components/Sidebar.js';
import Toast from './ui/components/Toast.js';
import Router from './router.js';

console.log('app.js cargado');

// Hacer Toast disponible globalmente para que auth.js pueda usarlo
window.Toast = Toast;

function init() {
  console.log('Iniciando app.js');
  try {
    // Verificar autenticación (ahora incluye validación de expiración)
    console.log('Verificando autenticación');
    if (!auth.isAuthenticated()) {
      console.log('No autenticado o token expirado, redirigiendo a login');
      // Usar el método logout para limpiar y redirigir
      auth.logout('Por favor, inicia sesión para continuar');
      return;
    }

    // Renderizar sidebar
    console.log('Buscando elemento sidebar-content');
    const sidebarContent = document.getElementById('sidebar-content');
    if (sidebarContent) {
      console.log('Renderizando sidebar');
      sidebarContent.appendChild(Sidebar());
    } else {
      console.error('Elemento sidebar-content no encontrado');
      Toast.show('Error: sidebar-content no encontrado', 'error');
      return;
    }

    // Configurar toggle de tema
    console.log('Buscando elemento theme-toggle');
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      console.log('Configurando toggle de tema');
      themeToggle.addEventListener('click', () => {
        console.log('Cambiando tema');
        document.body.classList.toggle('light');
        localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
        Toast.show('Tema cambiado', 'success');
      });
    } else {
      console.error('Elemento theme-toggle no encontrado');
      Toast.show('Error: theme-toggle no encontrado', 'error');
    }

    // Cargar tema guardado
    console.log('Cargando tema desde localStorage');
    if (localStorage.getItem('theme') === 'light') {
      console.log('Aplicando tema claro');
      document.body.classList.add('light');
    }

    // Configurar logout
    console.log('Buscando elemento logout');
    const logoutButton = document.getElementById('logout');
    if (logoutButton) {
      console.log('Configurando logout');
      logoutButton.addEventListener('click', () => {
        console.log('Cerrando sesión manualmente');
        auth.logout('Sesión cerrada correctamente');
      });
    } else {
      console.error('Elemento logout no encontrado');
      Toast.show('Error: logout no encontrado', 'error');
    }

    // Inicializar router
    console.log('Inicializando router');
    Router.init();

    // Verificar token periódicamente (cada 30 minutos)
    setInterval(() => {
      console.log('Verificando estado del token...');
      if (!auth.isAuthenticated()) {
        console.log('Token expirado durante la sesión');
        auth.logout('Tu sesión ha expirado automáticamente');
      }
    }, 30 * 60 * 1000); // 30 minutos

  } catch (error) {
    console.error('Error en init:', error);
    Toast.show(`Error al inicializar: ${error.message}`, 'error');
  }
}

console.log('Añadiendo listener para DOMContentLoaded');
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded disparado');
  init();
});