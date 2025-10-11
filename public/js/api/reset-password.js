import ApiClient from './client.js';
import Toast from '../ui/components/Toast.js';

export async function resetPassword(email) {
  try {
    const response = await ApiClient.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    Toast.show('Enlace de recuperación enviado', 'success');
    return response;
  } catch (error) {
    Toast.show(`Error al enviar el enlace: ${error.message}`, 'error');
    throw error;
  }
}

export async function confirmResetPassword(token, newPassword) {
  try {
    const response = await ApiClient.request('/auth/confirm-reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    });
    Toast.show('Contraseña actualizada exitosamente', 'success');
    return response;
  } catch (error) {
    Toast.show(`Error al actualizar la contraseña: ${error.message}`, 'error');
    throw error;
  }
}