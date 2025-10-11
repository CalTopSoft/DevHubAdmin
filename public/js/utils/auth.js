export const auth = {
  setToken(token) {
    console.log('Guardando token en localStorage');
    localStorage.setItem('token', token);
  },
  
  getToken() {
    console.log('Obteniendo token de localStorage');
    return localStorage.getItem('token');
  },
  
  removeToken() {
    console.log('Eliminando token de localStorage');
    localStorage.removeItem('token');
  },
  
  isAuthenticated() {
    console.log('Verificando si está autenticado');
    const token = this.getToken();
    if (!token) return false;
    
    // Verificar si el token ha expirado
    return this.isTokenValid(token);
  },
  
  isTokenValid(token) {
    try {
      const payload = this.parseToken(token);
      if (!payload || !payload.exp) return false;
      
      // Verificar si el token ha expirado
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Error validando token:', error);
      return false;
    }
  },
  
  parseToken(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (e) {
      console.error('Error parseando token:', e);
      return null;
    }
  },
  
  isAdmin() {
    const token = this.getToken();
    if (!token || !this.isTokenValid(token)) return false;
    
    const payload = this.parseToken(token);
    return payload?.role === 'admin';
  },
  
  // Método para limpiar sesión y redirigir al login
  logout(reason = 'Sesión cerrada') {
    console.log('Cerrando sesión:', reason);
    this.removeToken();
    
    // Mostrar mensaje si Toast está disponible
    if (window.Toast) {
      window.Toast.show(reason, 'info');
    }
    
    // Determinar la ruta correcta del login basado en la ubicación actual
    const currentPath = window.location.pathname;
    let loginPath = 'login.html';
    
    // Si estamos en el admin (que está en la raíz), ir a public/login.html
    // Si estamos en public/, ir a login.html
    if (currentPath.includes('/public/') || currentPath.endsWith('login.html')) {
      loginPath = 'login.html';
    } else {
      loginPath = './public/login.html';
    }
    
    // Redirigir al login sin delay innecesario
    window.location.href = loginPath;
  },
  
  // Método para verificar token antes de hacer peticiones
  checkAuthBeforeRequest() {
    const token = this.getToken();
    if (!token) {
      this.logout('No hay sesión activa');
      return false;
    }
    
    if (!this.isTokenValid(token)) {
      this.logout('Tu sesión ha expirado');
      return false;
    }
    
    return true;
  }
};