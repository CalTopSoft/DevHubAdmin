import ApiClient from './client.js';
import Toast from '../ui/components/Toast.js';

export const getProjects = async () => {
  try {
    return await ApiClient.getProjects();
  } catch (error) {
    Toast.show(`Error al cargar proyectos: ${error.message}`, 'error');
    throw error;
  }
};

export const updateProject = async (id, data) => {
  try {
    await ApiClient.updateProject(id, data);
    Toast.show('Proyecto actualizado', 'success');
  } catch (error) {
    Toast.show(`Error al actualizar proyecto: ${error.message}`, 'error');
    throw error;
  }
};

export const sendProjectToAuthor = async (project, data) => {
  try {
    await ApiClient.sendProjectToAuthor(project._id, data);
    Toast.show('Proyecto enviado al autor con feedback', 'success');
  } catch (error) {
    Toast.show(`Error: ${error.message}`, 'error');
    throw error;
  }
};

export const publishProject = async (project) => {
  try {
    await ApiClient.publishProject(project._id);
    Toast.show('Proyecto publicado correctamente', 'success');
  } catch (error) {
    Toast.show(`Error: ${error.message}`, 'error');
    throw error;
  }
};

export const rejectProject = async (project, data) => {
  try {
    await ApiClient.rejectProject(project._id, data);
    Toast.show('Proyecto rechazado con motivos', 'success');
  } catch (error) {
    Toast.show(`Error: ${error.message}`, 'error');
    throw error;
  }
};

export const warnProject = async (project, data) => {
  try {
    await ApiClient.warnProject(project._id, data);
    Toast.show('Advertencia enviada al autor', 'success');
  } catch (error) {
    Toast.show(`Error: ${error.message}`, 'error');
    throw error;
  }
};

export const deleteProject = async (project, data) => {
  try {
    await ApiClient.deleteProjectAdmin(project._id, data);
    Toast.show('Proyecto eliminado correctamente', 'success');
  } catch (error) {
    Toast.show(`Error: ${error.message}`, 'error');
    throw error;
  }
};

export const getFeedbackReasons = async () => {
  try {
    return await ApiClient.getFeedbackReasons();
  } catch (error) {
    Toast.show(`Error al cargar motivos: ${error.message}`, 'error');
    throw error;
  }
};

// ✅ NUEVAS FUNCIONES EXPORTADAS
export const approveDraft = async (projectId) => {
  try {
    await ApiClient.approveDraft(projectId);
    Toast.show('Borrador aprobado y aplicado exitosamente', 'success');
  } catch (error) {
    Toast.show(`Error al aprobar borrador: ${error.message}`, 'error');
    throw error;
  }
};

export const rejectDraft = async (projectId, data) => {
  try {
    await ApiClient.rejectDraft(projectId, data);
    Toast.show('Borrador rechazado. El autor fue notificado.', 'success');
  } catch (error) {
    Toast.show(`Error al rechazar borrador: ${error.message}`, 'error');
    throw error;
  }
};