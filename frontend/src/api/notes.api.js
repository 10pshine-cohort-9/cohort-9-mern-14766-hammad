import apiClient from './axios';

export const getNotesApi = async () => {
  const response = await apiClient.get('/notes');
  return response.data;
};

export const createNoteApi = async (noteData) => {
  const response = await apiClient.post('/notes', noteData);
  return response.data;
};

export const updateNoteApi = async (id, noteData) => {
  const response = await apiClient.patch(`/notes/${id}`, noteData);
  return response.data;
};

export const deleteNoteApi = async (id) => {
  const response = await apiClient.delete(`/notes/${id}`);
  return response.data;
};
