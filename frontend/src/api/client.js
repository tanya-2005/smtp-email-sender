import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  throw new Error(
    'VITE_API_BASE_URL is not set. Set it to your backend API URL in .env (see .env.example), ' +
      'or in your deployment platform (e.g. Vercel project settings), then rebuild.',
  );
}

const apiClient = axios.create({ baseURL });

export default apiClient;
