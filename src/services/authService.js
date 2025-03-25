import { authenticatedFetch } from './api';
import Cookies from 'js-cookie';

const BASE_URL = 'http://localhost:5000/api';

export const authService = {
    login: async (credentials) => {
        try {
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            Cookies.set('token', data.token);
            return data;
        } catch (error) {
            console.log('Login error:', error);
            throw error.message || 'Login failed';
        }
    },

    register: async (userData) => {
        try {
            const response = await fetch(`${BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            throw error.message || 'Registration failed';
        }
    },

    verifyEmail: async ({ email, otp }) => {
        try {
            const response = await fetch(`${BASE_URL}/auth/verify-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, otp })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            Cookies.set('token', data.token);
            return data;
        } catch (error) {
            throw error.message || 'Email verification failed';
        }
    },

    resendVerificationOTP: async ({ email }) => {
        try {
            const response = await fetch(`${BASE_URL}/auth/resend-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            throw error.message || 'Failed to resend OTP';
        }
    },

    logout: () => {
        Cookies.remove('token');
    },

    getProfile: async () => {
        try {
            return await authenticatedFetch('/auth/profile');
        } catch (error) {
            throw error.message || 'Failed to fetch profile';
        }
    },

    updateProfile: async (updates) => {
        try {
            return await authenticatedFetch('/auth/profile', {
                method: 'PATCH',
                body: JSON.stringify(updates)
            });
        } catch (error) {
            throw error.message || 'Failed to update profile';
        }
    }
}; 