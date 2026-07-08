import apiClient from './client';

export async function getWebhookLogs() {
  const response = await apiClient.get('/webhook/logs');
  return response.data;
}
