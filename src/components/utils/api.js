import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: (userData) => api.post('/signup', userData),
  login: (userData) => api.post('/login', userData),
};

export const postsAPI = {
  getPosts: (filter = 'recent') => api.get(`/posts?filter=${filter}`),
  createPost: (postData) => api.post('/create', postData),
  updatePost: (id, title, content) => api.post(`/update?id=${id}&title=${encodeURIComponent(title)}&content=${encodeURIComponent(content)}`),
  deletePost: (id) => api.delete(`/delete?id=${id}`),
  likePost: (id) => api.post(`/like?id=${id}`),
  dislikePost: (id) => api.post(`/dislike?id=${id}`),
  sharePost: (id) => api.post(`/share?id=${id}`),
};

export default api;
