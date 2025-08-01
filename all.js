import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.GEMINI_API_KEY);

export const generateCaption = async (imageUrl) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Generate a creative and engaging social media caption for this image. 
    Keep it concise, fun, and suitable for a social media platform like Instagram. 
    Include relevant hashtags at the end.`;

    // Convert image URL to base64 for Gemini
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(blob);
    });

    const imagePart = {
      inlineData: {
        data: base64,
        mimeType: blob.type,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const caption = result.response.text();
    return caption;
  } catch (error) {
    console.error('Error generating caption:', error);
    return 'Check out this amazing moment! ✨ #vistagram #memories';
  }
};
import { Cloudinary } from 'cloudinary-core';

const cloudinary = new Cloudinary({
  cloud_name: import.meta.env.CLOUDINARY_CLOUD_NAME,
  secure: true,
});

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', import.meta.env.CLOUDINARY_UPLOAD_PRESET);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export default cloudinary;
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
