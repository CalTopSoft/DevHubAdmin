import ApiClient from './client.js';
import Toast from '../ui/components/Toast.js';

export const getUsers = async () => {
  try {
    return await ApiClient.getUsers();
  } catch (error) {
    Toast.show(`Error al cargar usuarios: ${error.message}`, 'error');
    throw error;
  }
};

export const resetUserPassword = async (id, email) => {
  try {
    await ApiClient.request(`/admin/users/${id}/reset-password`, {
      method: 'POST',
      body: email ? JSON.stringify({ email }) : undefined
    });
    Toast.show(`Link de reseteo enviado${email ? ` a ${email}` : ''}`, 'success');
  } catch (error) {
    Toast.show(`Error al resetear contraseña: ${error.message}`, 'error');
    throw error;
  }
};