import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import parkingRatesReducer from './parkingRatesSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    parkingRates: parkingRatesReducer,
  },
});

export default store; 