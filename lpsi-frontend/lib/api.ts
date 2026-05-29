import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const authPaths = ['/login', '/register', '/aktivasi', '/lupa-password', '/reset-password'];
    const isAuthPage = authPaths.some((p) => window.location.pathname.startsWith(p));
    if (error.response?.status === 401 && typeof window !== 'undefined' && !isAuthPage) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
