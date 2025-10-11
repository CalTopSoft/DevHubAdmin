import ApiClient from './api/client.js';
import { auth } from './utils/auth.js';
import Toast from './ui/components/Toast.js';

console.log('login.js cargado');

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded disparado en login.js');
  console.log('Buscando elementos login y error');
  const loginButton = document.getElementById('login');
  const errorEl = document.getElementById('error');

  if (!loginButton || !errorEl) {
    console.error('Elementos login o error no encontrados');
    Toast.show('Error: elementos de login no encontrados', 'error');
    return;
  }

  console.log('Configurando listener para botón de login');
  loginButton.addEventListener('click', async () => {
    console.log('Click en botón de login');
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;

    console.log('Validando campos email y password');
    if (!email || !password) {
      console.log('Campos vacíos');
      errorEl.textContent = 'Por favor, completa todos los campos';
      errorEl.classList.remove('hidden');
      Toast.show('Campos incompletos', 'error');
      return;
    }

    try {
      console.log('Enviando solicitud de login a /api/auth/login');
      const response = await ApiClient.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      console.log('Respuesta recibida:', response);
      auth.setToken(response.token);
      console.log('Token guardado, redirigiendo a index.html');
      window.location.href = '../index.html';
      Toast.show('Inicio de sesión exitoso', 'success');
    } catch (error) {
      console.error('Error en login:', error.message);
      let errorMessage = error.message;
      if (errorMessage.includes('Failed to fetch')) {
        errorMessage = 'No se pudo conectar con el servidor. Revisa el backend o el puerto.';
      }
      errorEl.textContent = errorMessage;
      errorEl.classList.remove('hidden');
      Toast.show(`Error: ${errorMessage}`, 'error');
    }
  });
});