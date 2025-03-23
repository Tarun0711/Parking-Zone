import { createSlice } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

const COOKIE_EXPIRY = 5; // 5 days

const getUserFromCookie = () => {
    const userStr = Cookies.get('user');
    return userStr ? JSON.parse(userStr) : null;
};

const getTokenFromCookie = () => {
    return Cookies.get('token') || null;
};

const initialState = {
    user: getUserFromCookie(),
    token: getTokenFromCookie(),
    isAuthenticated: !!getTokenFromCookie(),
    loading: false
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        loginSuccess: (state, action) => {
            state.isAuthenticated = true;
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.loading = false;
            
            // Set cookies with 5-day expiry
            Cookies.set('token', action.payload.token, { expires: COOKIE_EXPIRY });
            Cookies.set('user', JSON.stringify(action.payload.user), { expires: COOKIE_EXPIRY });
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.loading = false;
            
            // Remove cookies
            Cookies.remove('token');
            Cookies.remove('user');
        },
        setUser: (state, action) => {
            state.user = action.payload;
            // Update user cookie
            Cookies.set('user', JSON.stringify(action.payload), { expires: COOKIE_EXPIRY });
        },
        updateUserSuccess: (state, action) => {
            state.user = action.payload;
            state.loading = false;
            // Update user cookie
            Cookies.set('user', JSON.stringify(action.payload), { expires: COOKIE_EXPIRY });
        }
    }
});

export const { 
    setLoading, 
    loginSuccess, 
    logout, 
    setUser, 
    updateUserSuccess 
} = authSlice.actions;

export default authSlice.reducer; 