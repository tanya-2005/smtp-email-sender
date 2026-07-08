import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:3000/api' : undefined);

if (!baseURL) {
  throw new Error(
    'VITE_API_BASE_URL is not set. Configure it in your deployment platform (e.g. Vercel project ' +
      'settings) to point at the deployed backend API, then redeploy.',
  );
}

const apiClient = axios.create({ baseURL });

export default apiClient;
