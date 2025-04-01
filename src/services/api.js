import Cookies from 'js-cookie';
import axios from 'axios';

// const BASE_URL = 'http://localhost:5000/api';
const BASE_URL = 'http://localhost:5000/api'; 


// Helper function to get auth token
const getAuthToken = () => {
    return Cookies.get('token');
};

// Helper function to create headers with auth token
const createHeaders = () => {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

// Generic fetch function with authentication
export const authenticatedFetch = async (endpoint, options = {}) => {
    const headers = createHeaders();
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            ...headers,
            ...options.headers
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
};

// Parking session related API calls
export const parkingSessionService = {
    getAllSessions: async () => {
        return authenticatedFetch('/parking-sessions');
    },

    getSessionById: async (id) => {
        return authenticatedFetch(`/parking-sessions/${id}`);
    },

    getUserSessions: async (userId) => {
        return authenticatedFetch(`/parking-sessions/user/${userId}`);
    },

    createSession: async (sessionData) => {
        return authenticatedFetch('/parking-sessions', {
            method: 'POST',
            body: JSON.stringify(sessionData)
        });
    },

    completeSession: async (id) => {
        return authenticatedFetch(`/parking-sessions/${id}/complete`, {
            method: 'POST'
        });
    },

    cancelSession: async (id) => {
        return authenticatedFetch(`/parking-sessions/${id}/cancel`, {
            method: 'POST'
        });
    }
};

// Parking rate related API calls
export const parkingRateService = {
    getAllParkingRates: () => {
        return axios.get(`${BASE_URL}/parking-rates`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
    },
    createParkingRate: (data) => {
        return axios.post(`${BASE_URL}/parking-rates`, data, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
    },
    updateParkingRate: (id, data) => {
        return axios.put(`${BASE_URL}/parking-rates/${id}`, data, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
    },
    deleteParkingRate: (id) => {
        return axios.delete(`${BASE_URL}/parking-rates/${id}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
    }
};

// Export all services
export default {
    parkingSessionService,
    parkingRateService,
    authenticatedFetch
}; 