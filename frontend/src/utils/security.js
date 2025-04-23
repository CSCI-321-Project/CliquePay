import { z } from 'zod';
import DOMPurify from 'dompurify';
import Cookies from 'js-cookie';
import { renewTokens } from './RenewTokens';
import { set } from 'date-fns';
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/\d/, "Password must contain at least one number")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character");

const emailSchema = z.string().email("Invalid email address");

const usernameSchema = z.string()
  .regex(/^[a-zA-Z0-9_]{3,20}$/, "Username must be 3-20 characters and can only contain letters, numbers, and underscores");

const phoneSchema = z.string()
  .regex(/^\+?1?\d{9,15}$/, "Invalid phone number")
  .optional();

export const SecurityUtils = {

  validatePassword: (password) => {
    try {
      passwordSchema.parse(password);
      return null;
    } catch (error) {  // Add error parameter here
      return error.errors[0].message;
    }
  },

  validateEmail: (email) => {
    try {
      emailSchema.parse(email);
      return true;
    } catch {
      return false;
    }
  },

  validateUsername: (username) => {
    try {
      usernameSchema.parse(username);
      return null;
    } catch (error) {
      return error.errors[0].message;
    }
  },

  validatePhoneNumber: (number) => {
    if (!number) return true;
    try {
      phoneSchema.parse(number);
      return true;
    } catch {
      return false;
    }
  },

  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    try {
      return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [], 
        ALLOWED_ATTR: [],
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
        RETURN_DOM_IMPORT: false,
      });
    } catch (error) {
      console.error('Sanitization failed:', error);
      return '';
    }
  },

  sanitizeHTML: (html) => {
    if (typeof html !== 'string') return '';
    try {
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
        ALLOWED_ATTR: ['href'],
        ALLOW_DATA_ATTR: false,
        SANITIZE_DOM: true
      });
    } catch (error) {
      console.error('HTML sanitization failed:', error);
      return '';
    }
  },

  getCSRFToken: () => {
    try {
      const token = document.querySelector('meta[name="csrf-token"]')?.content;
      if (!token || typeof token !== 'string') {
        console.error('CSRF token not found or invalid');
        return null;
      }
      return token;
    } catch (error) {
      console.error('Error getting CSRF token:', error);
      return null;
    }
  },

  setCookie: (name, value, options = {}) => {
    if (!name || typeof name !== 'string') {
      throw new Error('Invalid cookie name');
    }
    
    if (value === undefined || value === null) {
      throw new Error('Cookie value cannot be null or undefined');
    }

    return Cookies.set(name, value, {
      expires: 365,
      path: '/',
      sameSite: 'Strict', // Changed from Lax to Strict for better security
      secure: window.location.protocol === 'https:',
      ...options
    });
  },

  getCookie: async (name) => {
    if (!name || typeof name !== 'string') {
      throw new Error('Invalid cookie name');
    }
  
    // If requesting auth-related cookies, check if renewal is needed
    if (['accessToken', 'idToken'].includes(name)) {
      const tokenValid = await renewTokens();
      if (!tokenValid) {
        return null;
        
      }
    }
  
    return Cookies.get(name);
  },

  removeCookie: (name) => {
    if (!name || typeof name !== 'string') {
      throw new Error('Invalid cookie name');
    }
    return Cookies.remove(name);
  },

  rateLimitCheck: (lastAttempt, delay = 3000) => {
    try {
      if (typeof lastAttempt !== 'number' || typeof delay !== 'number') {
        throw new Error('Invalid parameters for rateLimitCheck');
      }
      const now = Date.now();
      return now - lastAttempt < delay;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return true; // Fail safe - assume rate limit is exceeded
    }
  },

  // Add this to SecurityUtils object
  csrfConfig: {
    validateCSRF: (token) => {
      try {
        if (!token || typeof token !== 'string') {
          return false;
        }
        const storedToken = SecurityUtils.getCSRFToken();
        return token === storedToken;
      } catch (error) {
        console.error('CSRF validation failed:', error);
        return false;
      }
    },

    setupCSRFProtection: (axiosInstance) => {
      axiosInstance.interceptors.request.use(config => {
        const token = SecurityUtils.getCSRFToken();
        if (token) {
          config.headers['X-CSRF-Token'] = token;
        }
        return config;
      });
    }
  },

  csrf: {
    // Generate a new CSRF token
    generateToken: () => {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    },

    // Set CSRF token in both cookie and meta tag
    initCSRF: () => {
      try {
        const token = SecurityUtils.csrf.generateToken();
        
        // Set CSRF cookie with secure options
        SecurityUtils.setCookie('csrf_token', token, {
          sameSite: 'Strict',
          secure: true,
          httpOnly: true
        });

        // Set meta tag
        let metaTag = document.querySelector('meta[name="csrf-token"]');
        if (!metaTag) {
          metaTag = document.createElement('meta');
          metaTag.name = 'csrf-token';
          document.head.appendChild(metaTag);
        }
        metaTag.content = token;

        return token;
      } catch (error) {
        console.error('Failed to initialize CSRF:', error);
        return null;
      }
    },

    // Verify CSRF token from request against stored token
    verifyToken: (requestToken) => {
      try {
        const storedToken = SecurityUtils.getCookie('csrf_token');
        const metaToken = document.querySelector('meta[name="csrf-token"]')?.content;

        return storedToken && metaToken && 
               requestToken === storedToken && 
               requestToken === metaToken;
      } catch (error) {
        console.error('CSRF verification failed:', error);
        return false;
      }
    },

    // Add CSRF headers to fetch requests
    getFetchHeaders: () => {
      const token = document.querySelector('meta[name="csrf-token"]')?.content;
      return {
        'X-CSRF-Token': token,
        'X-Requested-With': 'XMLHttpRequest'
      };
    },

    // Create a fetch wrapper with CSRF protection
    fetchWithCSRF: async (url, options = {}) => {
      const accessToken = await SecurityUtils.getCookie('accessToken');
      if (!accessToken) {
        throw new Error('No access token available');
      }
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        ...options.headers,
      };
    
      return fetch(url, {
        ...options,
        credentials: 'include',
        headers,
      });
    },
},

  auth: {
    isAuthenticated: async () => {
      try {
        const accessToken = await SecurityUtils.getCookie('accessToken');
        if (!accessToken) {
          return false;
        }
        const response = await SecurityUtils.csrf.fetchWithCSRF(
          'http://127.0.0.1:8000/api/verify-user-access/',  
          { 
            method: 'POST',
            body: JSON.stringify({
              access_token: accessToken
            })
          }
        );
        
        if (!response.ok) {
          console.error('Auth check failed with status:', response.status);
          return false;
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Auth check failed:', error);
        return false;
      }
    }
  }
};

