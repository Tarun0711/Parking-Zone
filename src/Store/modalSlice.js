import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isLoginModalOpen: false,
    isSignUpModalOpen: false
};

const modalSlice = createSlice({
    name: 'modal',
    initialState,
    reducers: {
        openLoginModal: (state) => {
            state.isLoginModalOpen = true;
            state.isSignUpModalOpen = false;
        },
        closeLoginModal: (state) => {
            state.isLoginModalOpen = false;
        },
        openSignUpModal: (state) => {
            state.isSignUpModalOpen = true;
            state.isLoginModalOpen = false;
        },
        closeSignUpModal: (state) => {
            state.isSignUpModalOpen = false;
        }
    }
});

export const { 
    openLoginModal, 
    closeLoginModal, 
    openSignUpModal, 
    closeSignUpModal 
} = modalSlice.actions;

export default modalSlice.reducer; 