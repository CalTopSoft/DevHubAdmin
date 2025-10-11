import DashboardPage from './ui/pages/DashboardPage.js';
import UsersPage from './ui/pages/UsersPage.js';
import CompaniesPage from './ui/pages/CompaniesPage.js';
import ProjectsPage from './ui/pages/ProjectsPage.js';
import BackupPage from './ui/pages/BackupPage.js';
import CategoriesAdminPage from './ui/pages/CatgRoles.js';

const routes = {
  '': DashboardPage,
  'dashboard': DashboardPage,
  'users': UsersPage,
  'companies': CompaniesPage,
  'projects': ProjectsPage,
  'catg-roles': CategoriesAdminPage,
  'backup': BackupPage
};

export default {
  init() {
    console.log('Iniciando router');
    window.addEventListener('hashchange', this.render.bind(this));
    this.render();
  },

  async render() {
    console.log('Renderizando ruta');
    const hash = window.location.hash.replace('#', '');
    const PageComponent = routes[hash] || DashboardPage;
    const content = document.getElementById('page-content');
    
    if (content) {
      content.innerHTML = '<div class="flex items-center justify-center p-8"><div class="text-lg">Cargando...</div></div>';
      
      try {
        const pageElement = await PageComponent();
        content.innerHTML = '';
        content.appendChild(pageElement);
      } catch (error) {
        console.error('Error al cargar página:', error);
        content.innerHTML = `<div class="text-red-400 p-4">Error al cargar la página: ${error.message}</div>`;
      }
    } else {
      console.error('Elemento page-content no encontrado');
    }
  }
};