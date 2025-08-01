// ==================== gemini.js ====================
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const generateCaption = async (imageUrl) => {
  try {
    // Validate input
    if (!imageUrl) {
      throw new Error('Image URL is required');
    }

    // Validate API key
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const prompt = `Generate a creative and engaging social media caption for this image. 
    Keep it concise, fun, and suitable for a social media platform like Instagram. 
    Include relevant hashtags at the end. Make it authentic and relatable.
    Maximum 280 characters including hashtags.`;

    // Fetch and convert image to base64
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    
    // Validate image type
    if (!blob.type.startsWith('image/')) {
      throw new Error('Invalid file type. Please provide an image file.');
    }

    // Convert blob to base64
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const result = reader.result.split(',')[1];
          resolve(result);
        } catch (error) {
          reject(new Error('Failed to convert image to base64'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(blob);
    });

    // Create the content array similar to the official docs structure
    const contents = [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: blob.type,
              data: base64,
            },
          },
          {
            text: prompt
          }
        ]
      }
    ];

    const result = await model.generateContent({
      contents: contents,
      generationConfig: {
        maxOutputTokens: 200,
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      },
    });

    const response_text = result.response.text();
    
    if (!response_text || response_text.trim() === '') {
      throw new Error('Empty response from AI model');
    }

    return response_text.trim();
    
  } catch (error) {
    console.error('Error generating caption:', error);
    
    // Return different fallback messages based on error type
    if (error.message.includes('API key') || error.message.includes('401')) {
      return 'Unable to generate caption - API configuration needed. ✨ #visitgram #memories';
    } else if (error.message.includes('fetch')) {
      return 'Couldn\'t process the image, but it looks amazing! 📸 #visitgram #memories';
    } else if (error.message.includes('quota') || error.message.includes('429')) {
      return 'AI caption service busy. This moment looks incredible! 🌟 #visitgram #photooftheday';
    } else {
      return 'Sharing this beautiful moment! ✨ #visitgram #memories #photooftheday';
    }
  }
};

// Alternative function using the newer approach (if the above doesn't work)
export const generateCaptionV2 = async (imageUrl) => {
  try {
    if (!imageUrl || !import.meta.env.VITE_GEMINI_API_KEY) {
      throw new Error('Missing required parameters');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Failed to fetch image');
    
    const blob = await response.blob();
    if (!blob.type.startsWith('image/')) throw new Error('Invalid image type');

    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // Simplified approach matching official docs more closely
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: blob.type,
          data: base64,
        },
      },
      { 
        text: "Generate a creative and engaging social media caption for this image. Keep it under 280 characters with relevant hashtags." 
      }
    ]);

    return result.response.text().trim();

  } catch (error) {
    console.error('Error in generateCaptionV2:', error);
    return 'What a moment! ✨ #visitgram #memories #photooftheday';
  }
};

// ==================== cloudinary.js ====================
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const uploadImage = async (file) => {
  try {
    // Validate input
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Invalid file type. Please select an image file.');
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size too large. Please select an image under 10MB.');
    }

    // Validate environment variables
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      throw new Error('Cloudinary configuration missing');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'vistagram'); // Optional: organize uploads in folders

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `Upload failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    
    if (!data.secure_url) {
      throw new Error('Upload succeeded but no URL returned');
    }

    return {
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
      format: data.format,
      bytes: data.bytes,
    };

  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

// Utility function to generate transformed image URLs
export const getTransformedImageUrl = (publicId, transformations = {}) => {
  if (!publicId || !CLOUDINARY_CLOUD_NAME) {
    return null;
  }

  const {
    width = 'auto',
    height = 'auto',
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
  } = transformations;

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},h_${height},c_${crop},q_${quality},f_${format}/${publicId}`;
};

// ==================== api.js ====================
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management utilities
const TOKEN_KEY = 'authToken';

export const tokenManager = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),
  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and other common issues
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    
    if (response?.status === 401) {
      // Handle unauthorized access
      tokenManager.removeToken();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else if (response?.status >= 500) {
      // Handle server errors
      console.error('Server error:', response.status, response.statusText);
    } else if (!response) {
      // Handle network errors
      console.error('Network error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  signup: async (userData) => {
    try {
      const response = await api.post('/auth/signup', userData);
      
      // Automatically set token if returned
      if (response.data.token) {
        tokenManager.setToken(response.data.token);
      }
      
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Signup failed. Please try again.'
      );
    }
  },

  login: async (userData) => {
    try {
      const response = await api.post('/auth/login', userData);
      
      // Automatically set token if returned
      if (response.data.token) {
        tokenManager.setToken(response.data.token);
      }
      
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Login failed. Please check your credentials.'
      );
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      tokenManager.removeToken();
    }
  },

  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh');
      if (response.data.token) {
        tokenManager.setToken(response.data.token);
      }
      return response.data;
    } catch (error) {
      tokenManager.removeToken();
      throw error;
    }
  },
};

// Posts API endpoints
export const postsAPI = {
  getPosts: async (params = {}) => {
    try {
      const {
        filter = 'recent',
        page = 1,
        limit = 20,
        userId = null,
      } = params;

      const queryParams = new URLSearchParams({
        filter,
        page: page.toString(),
        limit: limit.toString(),
        ...(userId && { userId }),
      });

      const response = await api.get(`/posts?${queryParams}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch posts'
      );
    }
  },

  getPost: async (id) => {
    try {
      const response = await api.get(`/posts/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch post'
      );
    }
  },

  createPost: async (postData) => {
    try {
      // Validate required fields
      if (!postData.imageUrl && !postData.content) {
        throw new Error('Post must have either an image or content');
      }

      const response = await api.post('/posts', postData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to create post'
      );
    }
  },

  updatePost: async (id, updateData) => {
    try {
      if (!id) {
        throw new Error('Post ID is required');
      }

      const response = await api.put(`/posts/${id}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to update post'
      );
    }
  },

  deletePost: async (id) => {
    try {
      if (!id) {
        throw new Error('Post ID is required');
      }

      const response = await api.delete(`/posts/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to delete post'
      );
    }
  },

  likePost: async (id) => {
    try {
      if (!id) {
        throw new Error('Post ID is required');
      }

      const response = await api.post(`/posts/${id}/like`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to like post'
      );
    }
  },

  unlikePost: async (id) => {
    try {
      if (!id) {
        throw new Error('Post ID is required');
      }

      const response = await api.delete(`/posts/${id}/like`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to unlike post'
      );
    }
  },

  sharePost: async (id) => {
    try {
      if (!id) {
        throw new Error('Post ID is required');
      }

      const response = await api.post(`/posts/${id}/share`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to share post'
      );
    }
  },

  getComments: async (postId) => {
    try {
      const response = await api.get(`/posts/${postId}/comments`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch comments'
      );
    }
  },

  addComment: async (postId, content) => {
    try {
      if (!content || content.trim() === '') {
        throw new Error('Comment content is required');
      }

      const response = await api.post(`/posts/${postId}/comments`, { content });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to add comment'
      );
    }
  },
};

// User API endpoints
export const userAPI = {
  getProfile: async (userId = 'me') => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch profile'
      );
    }
  },

  updateProfile: async (updateData) => {
    try {
      const response = await api.put('/users/me', updateData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to update profile'
      );
    }
  },

  followUser: async (userId) => {
    try {
      const response = await api.post(`/users/${userId}/follow`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to follow user'
      );
    }
  },

  unfollowUser: async (userId) => {
    try {
      const response = await api.delete(`/users/${userId}/follow`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to unfollow user'
      );
    }
  },
};

// Generic error handler for API calls
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.message || 'An error occurred';
    const status = error.response.status;
    return { message, status, type: 'server_error' };
  } else if (error.request) {
    // Request made but no response received
    return {
      message: 'Network error. Please check your connection.',
      type: 'network_error'
    };
  } else {
    // Something else happened
    return {
      message: error.message || 'An unexpected error occurred',
      type: 'unknown_error'
    };
  }
};

// Utility function to check API health
export const checkApiHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw new Error('API is not responding');
  }
};

export default api;