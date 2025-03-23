import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import modalReducer from './modalSlice';
import parkingRatesReducer from './parkingRatesSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        modal: modalReducer,
        parkingRates: parkingRatesReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});

export default store; 