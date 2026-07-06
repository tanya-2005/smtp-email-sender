import apiClient from './client';

export async function getSettings() {
  const response = await apiClient.get('/settings');
  return response.data;
}

export async function saveSettings(settings) {
  const response = await apiClient.post('/settings', settings);
  return response.data;
}

export async function testSettingsConnection(settings) {
  const response = await apiClient.post('/settings/test', settings);
  return response.data;
}
