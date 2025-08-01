// src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://server-production-19a9.up.railway.app',
});

api.interceptors.request.use(config => {
  // Get the token from localStorage
  const token = localStorage.getItem('token');
  if (token) {
    // If a token exists, add it to the 'Authorization' header
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

export default api;