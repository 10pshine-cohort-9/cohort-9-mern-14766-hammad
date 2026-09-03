import apiClient from './axios';

export const loginApi = async (credentials) => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data; // { success: true, message, data: { user, token } }
};

export const registerApi = async (userData) => {
  const response = await apiClient.post('/auth/register', userData);
  return response.data; // { success: true, message, data: { user, token } }
};

export const getMeApi = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data; // { success: true, message, data: { user } }
};
