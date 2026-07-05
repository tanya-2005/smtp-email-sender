export function extractErrorMessage(error) {
  const data = error?.response?.data;

  if (data?.errors?.length) {
    return data.errors.join(' ');
  }

  if (data?.error) {
    return data.error;
  }

  return 'Something went wrong while sending the email. Please try again.';
}
