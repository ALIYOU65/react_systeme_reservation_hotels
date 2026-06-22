import axios from 'axios';

// Création d'une instance Axios
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000, // 10 secondes
});

// Intercepteur pour ajouter le token automatiquement
api.interceptors.request.use(
  (config) => {
    // On récupère le token depuis localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

