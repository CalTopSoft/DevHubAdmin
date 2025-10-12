import { auth } from '../utils/auth.js';

const API_BASE_URL = 'https://backend-devhub-hdf7.onrender.com/api';

class ApiClient {
  async request(endpoint, options = {}) {
    console.log(`Haciendo petición a: ${API_BASE_URL}${endpoint}`);
    // AGREGAR ESTE DEBUG:
    if (options.body) {
      console.log('=== FRONTEND DEBUG ===');
      console.log('Request body:', options.body);
      console.log('Request headers:', options.headers);
      console.log('=== END FRONTEND DEBUG ===');
    }
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = auth.getToken();
    if (token) {
      console.log('Añadiendo token al header Authorization');
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      console.log(`Respuesta recibida: ${response.status} ${response.statusText}`);

      // Manejar token expirado o inválido SOLO si hay un token presente
      // No aplicar este manejo a endpoints públicos como login
      if (response.status === 401 && token && !endpoint.includes('/auth/')) {
        console.warn('Token inválido o expirado, cerrando sesión automáticamente');
        auth.logout('Tu sesión ha expirado. Por favor, inicia sesión nuevamente');
        return; // No continúa con el procesamiento
      }

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (jsonError) {
          // si no se puede parsear JSON, se deja el mensaje por defecto
          console.warn('No se pudo parsear el JSON de error');
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      console.error('Error en ApiClient.request:', error.message);
      
      // Si el error es de red y tenemos un token que podría estar expirado
      if (error.message.includes('fetch') && token && !auth.isTokenValid(token)) {
        console.warn('Error de red con token expirado, cerrando sesión');
        auth.logout('Tu sesión ha expirado. Por favor, inicia sesión nuevamente');
        return;
      }
      
      throw error;
    }
  }

  // Método auxiliar para verificar autenticación antes de peticiones protegidas
  checkAuth() {
    return auth.checkAuthBeforeRequest();
  }

  // Método para verificar el estado del servidor
  async pingServer() {
    try {
      const response = await this.request('/admin/ping');
      return response.status === 'online';
    } catch (error) {
      return false;
    }
  }

  // ========================
  // RUTAS PÚBLICAS
  // ========================
  /** 
   * GET /projects - Ver todos los proyectos publicados
   * @param {Object} params - Query parameters (category, platform, sort, search)
   */
  async getPublicProjects(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/projects${query ? '?' + query : ''}`);
  }

  /** 
   * GET /projects/:slug - Ver proyecto específico 
   */
  async getProjectBySlug(slug) {
    return this.request(`/projects/${slug}`);
  }

  /** 
   * GET /companies/:id - Ver empresa específica 
   */
  async getCompany(id) {
    return this.request(`/companies/${id}`);
  }

  // src/api/client.js
  async getPlatforms() {
    const response = await this.request('/platforms');
    // El backend ya devuelve ["Android", "iOS", ...]
    return response; // ✅ Ya es un array de strings
  }

  /** 
   * GET /reviews/:projectId/reviews - Ver reseñas de un proyecto 
   */
  async getReviews(projectId) {
    return this.request(`/reviews/${projectId}/reviews`);
  }

  /** 
   * GET /users/:id - Ver usuario específico 
   */
  async getUser(id) {
    return this.request(`/users/${id}`);
  }

  // ========================
  // RUTAS DE USUARIO (requieren token)
  // ========================
  /** 
   * POST /companies - Crear nueva empresa 
   */
  async createCompany(data) {
    if (!this.checkAuth()) return;
    return this.request('/companies', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /** 
   * POST /companies/:id/invite - Obtener código de invitación 
   */
  async getInviteCode(companyId) {
    if (!this.checkAuth()) return;
    return this.request(`/companies/${companyId}/invite`, {
      method: 'POST'
    });
  }

  /** 
   * POST /companies/join - Unirse a empresa con código 
   */
  async joinCompany(data) {
    if (!this.checkAuth()) return;
    return this.request('/companies/join', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /** 
   * PUT /companies/:id/members/:userId - Actualizar roles de miembro 
   */
  async updateMemberRoles(companyId, userId, data) {
    if (!this.checkAuth()) return;
    return this.request(`/companies/${companyId}/members/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /** 
   * DELETE /companies/:id/members/:userId - Remover miembro de empresa 
   */
  async removeMember(companyId, userId) {
    if (!this.checkAuth()) return;
    return this.request(`/companies/${companyId}/members/${userId}`, {
      method: 'DELETE'
    });
  }

  /** 
   * PUT /companies/:id - Actualizar empresa 
   */
  async updateCompany(id, data) {
    if (!this.checkAuth()) return;
    return this.request(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /** 
   * DELETE /companies/:id - Eliminar empresa 
   */
  async deleteCompany(id) {
    if (!this.checkAuth()) return;
    return this.request(`/companies/${id}`, {
      method: 'DELETE'
    });
  }

  /** 
   * POST /projects - Crear proyecto 
   */
  async createProject(data) {
    if (!this.checkAuth()) return;
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /** 
   * PUT /projects/:id - Actualizar proyecto 
   */
  async updateProject(id, data) {
    if (!this.checkAuth()) return;
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /** 
   * PUT /users/me - Actualizar mi perfil 
   */
  async updateMyProfile(data) {
    if (!this.checkAuth()) return;
    return this.request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /** 
   * POST /reviews/:projectId/review - Crear reseña 
   */
  async createReview(projectId, data) {
    if (!this.checkAuth()) return;
    return this.request(`/reviews/${projectId}/review`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /** 
   * GET /downloads/app/:projectId - Descargar aplicación 
   */
  async downloadApp(projectId) {
    if (!this.checkAuth()) return;
    const token = auth.getToken();
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const response = await fetch(`${API_BASE_URL}/downloads/app/${projectId}`, { headers });
    
    if (response.status === 401) {
      auth.logout('Tu sesión ha expirado. Por favor, inicia sesión nuevamente');
      return;
    }
    
    if (!response.ok) {
      throw new Error('Error al descargar la aplicación');
    }
    return response.blob();
  }

  /** 
   * GET /downloads/code/:projectId - Descargar código fuente 
   */
  async downloadCode(projectId) {
    if (!this.checkAuth()) return;
    const token = auth.getToken();
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const response = await fetch(`${API_BASE_URL}/downloads/code/${projectId}`, { headers });
    
    if (response.status === 401) {
      auth.logout('Tu sesión ha expirado. Por favor, inicia sesión nuevamente');
      return;
    }
    
    if (!response.ok) {
      throw new Error('Error al descargar el código fuente');
    }
    return response.blob();
  }

  /** 
   * GET /downloads/doc/:projectId - Descargar documentación 
   */
  async downloadDoc(projectId) {
    if (!this.checkAuth()) return;
    const token = auth.getToken();
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const response = await fetch(`${API_BASE_URL}/downloads/doc/${projectId}`, { headers });
    
    if (response.status === 401) {
      auth.logout('Tu sesión ha expirado. Por favor, inicia sesión nuevamente');
      return;
    }
    
    if (!response.ok) {
      throw new Error('Error al descargar la documentación');
    }
    return response.blob();
  }

  // ========================
  // CATEGORÍAS Y ROLES
  // ========================
  /** 
   * GET /api/categories - Obtener todas las categorías 
   */
  async getCategories() {
    return this.request('/categories');
  }

  /** 
   * GET /api/categories/with-roles - Obtener categorías con sus roles 
   */
  async getCategoriesWithRoles() {
    return this.request('/categories/with-roles');
  }

  /** 
   * GET /api/categories/:id - Obtener categoría específica 
   */
  async getCategory(id) {
    return this.request(`/categories/${id}`);
  }

  /** 
   * GET /api/roles - Obtener todos los roles 
   */
  async getRoles() {
    return this.request('/roles');
  }

  /** 
   * GET /api/roles/by-category/:categoryId - Obtener roles por categoría 
   */
  async getRolesByCategory(categoryId) {
    return this.request(`/roles/by-category/${categoryId}`);
  }

  /** 
   * GET /api/roles/by-category-code/:categoryCode - Obtener roles por código de categoría 
   */
  async getRolesByCategoryCode(categoryCode) {
    return this.request(`/roles/by-category-code/${categoryCode}`);
  }

  /** 
   * GET /api/roles/:id - Obtener rol específico 
   */
  async getRole(id) {
    return this.request(`/roles/${id}`);
  }

  /** 
   * POST /api/roles/validate - Validar códigos de roles 
   */
  async validateRoles(data) {
    return this.request('/roles/validate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // ========================
  // MÉTODOS ADMIN PARA CATEGORÍAS Y ROLES (requieren role: admin)
  // ========================
  /** 
   * POST /api/categories - Crear nueva categoría 
   */
  async createCategory(data) {
    if (!this.checkAuth()) return;
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /** 
   * PUT /api/categories/:id - Actualizar categoría 
   */
  async updateCategory(id, data) {
    if (!this.checkAuth()) return;
    return this.request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /** 
   * DELETE /api/categories/:id - Eliminar categoría 
   */
  async deleteCategory(id) {
    if (!this.checkAuth()) return;
    return this.request(`/categories/${id}`, {
      method: 'DELETE'
    });
  }

  /** 
   * POST /api/roles - Crear nuevo rol 
   */
  async createRole(data) {
    if (!this.checkAuth()) return;
    return this.request('/roles', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /** 
   * PUT /api/roles/:id - Actualizar rol 
   */
  async updateRole(id, data) {
    if (!this.checkAuth()) return;
    return this.request(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /** 
   * DELETE /api/roles/:id - Eliminar rol 
   */
  async deleteRole(id) {
    if (!this.checkAuth()) return;
    return this.request(`/roles/${id}`, {
      method: 'DELETE'
    });
  }

  /** 
   * POST /api/seed - Inicializar datos de categorías y roles (solo dev/admin) 
   */
  async seedCategoriesData() {
    if (!this.checkAuth()) return;
    return this.request('/seed', {
      method: 'POST'
    });
  }

  // ========================
  // RUTAS ADMIN (requieren role: admin)
  // ========================
  /** 
   * GET /admin/projects - Ver todos los proyectos (admin) 
   */
  async getAdminProjects() {
    if (!this.checkAuth()) return;
    return this.request('/admin/projects');
  }

  /** 
   * PUT /admin/projects/:id - Actualizar proyecto como admin 
   */
  async updateAdminProject(id, data) {
    if (!this.checkAuth()) return;
    return this.request(`/admin/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /** 
   * POST /admin/projects/:id/send-to-author - Enviar proyecto de vuelta al autor 
   */
  async sendProjectToAuthor(id, data) {  // ← Agregar parámetro data
    if (!this.checkAuth()) return;
    return this.request(`/admin/projects/${id}/send-to-author`, {
      method: 'POST',
      body: JSON.stringify(data)  // ← Agregar body
    });
  }

  /** 
   * POST /admin/projects/:id/publish - Publicar proyecto 
   */
  async publishProject(id) {
    if (!this.checkAuth()) return;
    return this.request(`/admin/projects/${id}/publish`, {
      method: 'POST'
    });
  }

  /** 
   * POST /admin/projects/:id/reject - Rechazar proyecto 
   */
  async rejectProject(id, data) {  // ← Agregar parámetro data
    if (!this.checkAuth()) return;
    return this.request(`/admin/projects/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(data)  // ← Agregar body
    });
  }
  

  /** 
   * GET /admin/users - Ver todos los usuarios 
   */
  async getUsers() {
    if (!this.checkAuth()) return;
    return this.request('/admin/users');
  }

  /** 
   * POST /admin/users/:id/reset-password - Reset password de usuario 
   */
  async resetUserPassword(id) {
    if (!this.checkAuth()) return;
    return this.request(`/admin/users/${id}/reset-password`, {
      method: 'POST'
    });
  }

  /** 
   * GET /admin/backup/export - Exportar backup completo 
   */
  async exportBackup() {
    if (!this.checkAuth()) return;
    return this.request('/admin/backup/export');
  }

  /** 
   * POST /admin/projects/:id/warn - Enviar advertencia a proyecto 
   */
  async warnProject(id, data) {
    if (!this.checkAuth()) return;
    return this.request(`/admin/projects/${id}/warn`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /** 
   * DELETE /admin/projects/:id - Eliminar proyecto con notificación 
   */
  async deleteProjectAdmin(id, data) {
    if (!this.checkAuth()) return;
    return this.request(`/admin/projects/${id}`, {
      method: 'DELETE',
      body: JSON.stringify(data)
    });
  }

  /** 
   * GET /admin/feedback-reasons - Obtener motivos predefinidos 
   */
  async getFeedbackReasons() {
    if (!this.checkAuth()) return;
    return this.request('/admin/feedback-reasons');
  }

  /** 
   * GET /admin/projects/with-drafts - Obtener proyectos con borradores pendientes (admin)
   */
  async getProjectsWithDrafts() {
    if (!this.checkAuth()) return [];
    return this.request('/admin/projects/with-drafts');
  }

  /** 
   * POST /admin/projects/:projectId/approve-draft - Aprobar borrador (admin)
   */
  async approveDraft(projectId) {
    if (!this.checkAuth()) return;
    return this.request(`/admin/projects/${projectId}/approve-draft`, {
      method: 'POST'
    });
  }

  /** 
   * POST /admin/projects/:projectId/reject-draft - Rechazar borrador (admin)
   */
  async rejectDraft(projectId, data) {
    if (!this.checkAuth()) return;
    return this.request(`/admin/projects/${projectId}/reject-draft`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /** 
   * DELETE /projects/:projectId/clear-draft - Limpiar borrador rechazado (autor)
   */
  async clearRejectedDraft(projectId) {
    if (!this.checkAuth()) return;
    return this.request(`/projects/${projectId}/clear-draft`, {
      method: 'DELETE'
    });
  }

  // ========================
  // ESTADÍSTICAS
  // ========================
  /** 
   * GET /api/stats - Obtener estadísticas del sistema
   * Devuelve projectsByStatus con los conteos por estado
   */
  async getStats() {
    if (!this.checkAuth()) return;
    return this.request('/stats');
  }

  // ========================
  // MÉTODOS DE CONVENIENCIA
  // ========================
  /** 
   * Obtener todas las empresas reales de la base de datos
   * Como no hay endpoint específico /admin/companies, extraemos de backup o usuarios
   */
  async getAllCompanies() {
    if (!this.checkAuth()) return;
    try {
      // Intentamos obtener el backup completo que incluye todas las empresas
      const backup = await this.exportBackup();
      return backup.companies || [];
    } catch (error) {
      console.warn('No se pudo obtener backup completo, usando método alternativo');
      // Método alternativo: obtener usuarios y luego sus empresas
      const users = await this.getUsers();
      const companiesIds = new Set();
      const companies = [];
      
      // Por cada usuario que tenga empresas, obtenemos sus empresas
      for (const user of users.filter(u => u.companiesCount > 0)) {
        try {
          // Nota: Esto requeriría un endpoint para obtener empresas de un usuario
          // Por ahora retornamos una estructura básica
          // En una implementación completa, necesitarías /users/:id/companies
          console.log(`Usuario ${user.username} tiene ${user.companiesCount} empresas`);
        } catch (err) {
          console.warn(`Error obteniendo empresas del usuario ${user.username}:`, err);
        }
      }
      return companies;
    }
  }

  /** 
   * GET /companies - Obtener todas las empresas
   * @param {Object} params - Query parameters (opcional para futuros filtros)
   */
  async fetchCompanies(params = {}) {
    if (!this.checkAuth()) return [];
    const query = new URLSearchParams(params).toString();
    return this.request(`/companies${query ? '?' + query : ''}`);
  }
  
  /** 
   * GET /admin/backup/size - Obtener tamaño del backup sin descargarlo
   */
  async getBackupSize(collections = []) {
    if (!this.checkAuth()) return;
    const query = collections.length ? `?collections=${collections.join(',')}` : '';
    return this.request(`/admin/backup/size${query}`);
  }

  // ========================
  // MÉTODOS DE NOTIFICACIONES
  // ========================
  /** 
   * GET /notifications - Obtener notificaciones del usuario 
   */
  async getNotifications(params = {}) {
    if (!this.checkAuth()) return;
    const query = new URLSearchParams(params).toString();
    return this.request(`/notifications${query ? '?' + query : ''}`);
  }

  /** 
   * GET /notifications/stats - Obtener estadísticas de notificaciones 
   */
  async getNotificationStats() {
    if (!this.checkAuth()) return;
    return this.request('/notifications/stats');
  }

  /** 
   * PATCH /notifications/:id/read - Marcar notificación como leída 
   */
  async markNotificationAsRead(notificationId) {
    if (!this.checkAuth()) return;
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PATCH'
    });
  }

  /** 
   * PATCH /notifications/mark-all-read - Marcar todas como leídas 
   */
  async markAllNotificationsAsRead() {
    if (!this.checkAuth()) return;
    return this.request('/notifications/mark-all-read', {
      method: 'PATCH'
    });
  }

  /** 
   * DELETE /notifications/:id - Eliminar notificación 
   */
  async deleteNotification(notificationId) {
    if (!this.checkAuth()) return;
    return this.request(`/notifications/${notificationId}`, {
      method: 'DELETE'
    });
  }

  /** 
   * Verificar si el usuario actual es admin 
   */
  isCurrentUserAdmin() {
    return auth.isAdmin();
  }

  /** 
   * Obtener información del usuario actual desde el token 
   */
  getCurrentUser() {
    const token = auth.getToken();
    if (!token) return null;
    return auth.parseToken(token);
  }
    /** 
   * PATCH /admin/companies/:id/verify - Verificar/Desverificar empresa 
   */
  async verifyCompany(id, isVerified) {
    if (!this.checkAuth()) return;
    return this.request(`/admin/companies/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ isVerified })
    });
  }

  /** 
   * GET /admin/companies/rankings - Obtener empresas con ranking 
   */
  async getCompanyRankings() {
    if (!this.checkAuth()) return;
    return this.request('/admin/companies/rankings');
  }
}


export default new ApiClient();
