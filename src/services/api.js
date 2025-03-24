import Cookies from 'js-cookie';

const BASE_URL = 'https://parking-zone-backend.onrender.com/api';

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
    getAllParkingRates: async () => {
        return authenticatedFetch('/parking-rates');
    },

    getParkingRateById: async (id) => {
        return authenticatedFetch(`/parking-rates/${id}`);
    },

    createParkingRate: async (rateData) => {
        return authenticatedFetch('/parking-rates', {
            method: 'POST',
            body: JSON.stringify(rateData)
        });
    },

    updateParkingRate: async (id, rateData) => {
        return authenticatedFetch(`/parking-rates/${id}`, {
            method: 'PUT',
            body: JSON.stringify(rateData)
        });
    },

    deleteParkingRate: async (id) => {
        return authenticatedFetch(`/parking-rates/${id}`, {
            method: 'DELETE'
        });
    }
};

// Export all services
export default {
    parkingSessionService,
    parkingRateService,
    authenticatedFetch
}; 