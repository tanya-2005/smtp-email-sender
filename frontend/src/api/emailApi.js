import apiClient from './client';

export async function sendEmail({ to, subject, message }) {
  const response = await apiClient.post('/emails/send', {
    to,
    subject,
    text: message,
  });
  return response.data;
}
