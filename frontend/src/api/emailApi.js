import apiClient from './client';

export async function sendEmail({ to, subject, message, attachments = [] }) {
  const formData = new FormData();
  formData.append('to', to);
  formData.append('subject', subject);
  formData.append('text', message);
  attachments.forEach((file) => formData.append('attachments', file));

  const response = await apiClient.post('/emails/send', formData);
  return response.data;
}

export async function sendBulkEmail({ recipients, subject, message, attachments = [] }) {
  const formData = new FormData();
  recipients.forEach((email) => formData.append('recipients', email));
  formData.append('subject', subject);
  formData.append('text', message);
  attachments.forEach((file) => formData.append('attachments', file));

  const response = await apiClient.post('/emails/send-bulk', formData);
  return response.data;
}
