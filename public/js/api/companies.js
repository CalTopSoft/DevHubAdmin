import ApiClient from './client.js';
import Toast from '../ui/components/Toast.js';

export const fetchCompanies = async () => {
  try {
    return await ApiClient.fetchCompanies();
  } catch (error) {
    Toast.show(`Error al cargar empresas: ${error.message}`, 'error');
    throw error;
  }
};
export const verifyCompany = async (id, isVerified) => {
  try {
    const result = await ApiClient.verifyCompany(id, isVerified);
    Toast.show(isVerified ? 'Empresa verificada ✓' : 'Verificación removida', 'success');
    return result;
  } catch (error) {
    Toast.show(`Error: ${error.message}`, 'error');
    throw error;
  }
};

export const getCompanyRankings = async () => {
  try {
    return await ApiClient.getCompanyRankings();
  } catch (error) {
    Toast.show(`Error al cargar rankings: ${error.message}`, 'error');
    throw error;
  }
};