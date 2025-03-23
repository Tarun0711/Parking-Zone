import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { parkingRateService } from '../services/api';

export const fetchParkingRates = createAsyncThunk(
    'parkingRates/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await parkingRateService.getAllParkingRates();
            return response.data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const parkingRatesSlice = createSlice({
    name: 'parkingRates',
    initialState: {
        rates: [],
        loading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchParkingRates.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchParkingRates.fulfilled, (state, action) => {
                state.loading = false;
                state.rates = Array.isArray(action.payload) ? action.payload : [];
            })
            .addCase(fetchParkingRates.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export default parkingRatesSlice.reducer; 