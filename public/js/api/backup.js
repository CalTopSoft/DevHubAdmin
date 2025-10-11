import ApiClient from './client.js';
import Toast from '../ui/components/Toast.js';

export async function exportBackup(collections = []) {
  try {
    const response = await ApiClient.request(`/admin/backup/export?collections=${collections.join(',')}`);
    const { data, size } = response;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.show('Backup exportado exitosamente', 'success');
    return { data, size };
  } catch (error) {
    Toast.show(`Error al exportar backup: ${error.message}`, 'error');
    throw error;
  }
}

export async function importBackup(file) {
  try {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const backupData = JSON.parse(reader.result);
          const response = await ApiClient.request('/admin/backup/import', {
            method: 'POST',
            body: JSON.stringify(backupData),
          });
          Toast.show('Backup restaurado exitosamente', 'success');

          // 🔑 Forzar logout tras restaurar
          localStorage.removeItem('token');
          window.location.href = '/public/login.html';

          resolve(response);
        } catch (error) {
          Toast.show(`Error al restaurar backup: ${error.message}`, 'error');
          reject(error);
        }
      };
      reader.onerror = () => {
        Toast.show('Error al leer el archivo', 'error');
        reject(new Error('Error al leer el archivo'));
      };
      reader.readAsText(file);
    });
  } catch (error) {
    Toast.show(`Error al restaurar backup: ${error.message}`, 'error');
    throw error;
  }
}