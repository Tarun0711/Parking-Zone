import React, { useState, useEffect } from 'react';
import { parkingSessionService, parkingRateService } from '../services/api';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Modal, TextField, Button, Select, MenuItem, FormControl, InputLabel, Tooltip } from '@mui/material';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { fetchParkingRates } from '../Store/parkingRatesSlice';
const BASE_URL = 'http://localhost:5000'; 

const styles = `
  @keyframes glow {
    0% {
      box-shadow: 0 0 0 0 rgba(147, 197, 253, 0.5);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(147, 197, 253, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(147, 197, 253, 0);
    }
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .step-active {
    animation: glow 2s infinite;
  }

  .progress-line {
    transition: width 0.5s ease-in-out;
  }

  .modal-animation {
    animation: modalFade 0.3s ease-out;
  }

  @keyframes modalFade {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .slot-card {
    transition: all 0.3s ease;
    background: linear-gradient(145deg, #ffffff, #f8fafc);
  }

  .slot-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .booking-card {
    transition: all 0.3s ease;
    background: linear-gradient(145deg, #ffffff, #f8fafc);
  }

  .booking-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }
`;

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // New state variables for booking section
  const [vehicles, setVehicles] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // New state variables for organized slots
  const [organizedSlots, setOrganizedSlots] = useState({});
  const [selectedVehicleType, setSelectedVehicleType] = useState('car'); // Default to car
  
  // New state variable for QR code error
  const [qrCodeError, setQrCodeError] = useState(false);
  
  // New state variables for pricing modal
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [newRate, setNewRate] = useState({
    type: '',
    vehicleType: '', // Default to empty to create a base rate
    hourlyRate: '',
    description: ''
  });
  const dispatch = useDispatch();
  const isAdmin = user?.role === 'admin';

  // Get parking rates from Redux store
  const { rates: parkingRates, loading: ratesLoading } = useSelector((state) => state.parkingRates);

  // Create a map of rates for easy access
  const ratesMap = React.useMemo(() => {
    const map = {};
    if (parkingRates && parkingRates.length > 0) {
      parkingRates.forEach(rate => {
        // Create a key that includes both type and vehicleType
        const key = `${rate.type}_${rate.vehicleType || 'car'}`;
        
        // Apply tiered pricing based on vehicle type
        let hourlyRate = rate.hourlyRate;
        
        // If the rate doesn't specify a vehicle type, apply the tiered pricing
        if (!rate.vehicleType) {
          // For trucks, use the base rate (100%)
          map[`${rate.type}_truck`] = hourlyRate;
          
          // For cars, use 90% of the truck rate (10% less than truck)
          map[`${rate.type}_car`] = hourlyRate * 0.9;
          
          // For bikes, use 80% of the truck rate (20% less than truck)
          map[`${rate.type}_bike`] = hourlyRate * 0.8;
        } else {
          // If the rate already has a vehicle type, use it as is
          map[key] = hourlyRate;
        }
      });
    }
    return map;
  }, [parkingRates]);

  // Add useEffect to fetch bookings on component mount
  useEffect(() => {
    fetchBookings();
  }, [user.id]);

  // Load Razorpay script
 
  // Fetch user's vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/vehicles/owner/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setVehicles(response.data.data.vehicles || []);
      } catch (error) {
        console.error('Error fetching vehicles:', error);
        setBookingError('Failed to load vehicles');
      }
    };

    fetchVehicles();
  }, [user.id, token]);

  // Helper function to organize slots by block, floor, and vehicle type
  const organizeSlots = (slots) => {
    const organized = {
      car: {},
      bike: {},
      truck: {}
    };
    
    slots.forEach(slot => {
      const blockId = slot.block._id;
      const floor = slot.floor;
      
      // Use the vehicleType from the slot directly
      const vehicleType = slot.vehicleType || 'car';
      
      if (!organized[vehicleType][blockId]) {
        organized[vehicleType][blockId] = {
          blockName: slot.block.blockName,
          floors: {}
        };
      }
      
      if (!organized[vehicleType][blockId].floors[floor]) {
        organized[vehicleType][blockId].floors[floor] = [];
      }
      
      organized[vehicleType][blockId].floors[floor].push(slot);
    });
    return organized;
  };

  // Modify the fetchAvailableSlots function
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/parking-slots`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const slots = response.data.data || [];
        setAvailableSlots(slots);
        setOrganizedSlots(organizeSlots(slots));
      } catch (error) {
        console.error('Error fetching available slots:', error);
        setBookingError('Failed to load available parking slots');
      }
    };

    fetchAvailableSlots();
  }, [token]);

  // Handle booking submission
  const handleBooking = async (e) => {
    e.preventDefault();
    setBookingError('');
    setBookingLoading(true);

    if (!selectedVehicle || !selectedSlot) {
      setBookingError('Please select both vehicle and parking slot');
      setBookingLoading(false);
      return;
    }

    // Check if the selected vehicle type matches the slot type
    const selectedVehicleObj = vehicles.find(v => v._id === selectedVehicle);
    const selectedSlotObj = availableSlots.find(s => s._id === selectedSlot);
    
    // Use the vehicleType from the slot directly
    const slotVehicleType = selectedSlotObj.vehicleType || 'car';
    
    if (selectedVehicleObj.vehicleType !== slotVehicleType) {
      setBookingError(`This slot is for ${slotVehicleType}s, but you selected a ${selectedVehicleObj.vehicleType}`);
      setBookingLoading(false);
      return;
    }

    try {
      // Send parking request instead of creating session directly
      const response = await axios.post(
        `${BASE_URL}/api/parking-requests`,
        {
          vehicleId: selectedVehicle,
          parkingSlotId: selectedSlot
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.data || !response.data.success) {
        throw new Error('Invalid response from server');
      }

      // Refresh requests list
      await fetchParkingRequests();
      
      // Reset selection
      setSelectedVehicle('');
      setSelectedSlot('');
      
      toast.success('Parking request sent successfully! Waiting for admin approval.');
      
      const slotsResponse = await axios.get(`${BASE_URL}/api/parking-slots`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const slots = slotsResponse.data.data || [];
      setAvailableSlots(slots);
      setOrganizedSlots(organizeSlots(slots));
    } catch (error) {
      console.error('Error sending parking request:', error);
      setBookingError(
        error.response?.data?.message || 
        error.message || 
        'Failed to send parking request. Please try again.'
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setError(null);
      const data = await parkingSessionService.getUserSessions(user.id);
      setBookings(data.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to load bookings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getBookingProgress = (booking) => {
    const now = new Date();
    const bookingTime = new Date(booking.bookingTime);
    const entryTime = booking.entryTime ? new Date(booking.entryTime) : null;
    const exitTime = booking.exitTime ? new Date(booking.exitTime) : null;

    if (exitTime) {
      return { step: 3, status: 'completed' };
    } else if (entryTime) {
      return { step: 2, status: 'active' };
    } else if (bookingTime) {
      // If booking is more than 24 hours old without entry, consider it expired
      if (now - bookingTime > 24 * 60 * 60 * 1000 && !entryTime) {
        return { step: 1, status: 'expired' };
      }
      return { step: 1, status: 'active' };
    }
    return { step: 0, status: 'pending' };
  };

  const getStepStatus = (stepNumber, currentStep, status) => {
    if (status === 'expired') return 'expired';
    if (stepNumber === currentStep) return 'active';
    if (stepNumber < currentStep) return 'completed';
    return 'pending';
  };

  const handleCardClick = (booking) => {
    setSelectedBooking(booking);
  };

  const handleCloseModal = () => {
    setSelectedBooking(null);
  };

  // Helper function to get slot status color
  const getSlotStatusColor = (slot) => {
    if (slot.status === 'available') {
      return 'border-emerald-400 hover:border-emerald-500';
    } else if (slot.status === 'occupied') {
      return 'border-rose-400 cursor-not-allowed opacity-50';
    } else if (slot.status === 'reserved') {
      return 'border-amber-400 cursor-not-allowed opacity-50';
    } else {
      return 'border-gray-300 cursor-not-allowed opacity-50';
    }
  };

  // Helper function to render slots grid
  const renderSlotsGrid = (slots) => {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
        {slots.map((slot) => {
          // Use the vehicleType from the slot directly
          const slotVehicleType = slot.vehicleType || 'car';
          
          // Create the rate key
          const rateKey = `${slot.rateType}_${slotVehicleType}`;
          
          return (
            <Tooltip
              key={slot._id}
              title={slot.status === 'available' ? 'Available' : 'This slot is already booked'}
              placement="top"
              arrow
            >
              <button
                onClick={() => slot.status === 'available' ? setSelectedSlot(slot._id) : null}
                disabled={slot.status !== 'available'}
                className={`relative p-4 border-2 rounded-lg ${getSlotStatusColor(slot)} 
                  ${selectedSlot === slot._id ? 'ring-2 ring-emerald-500 bg-emerald-200' : ''}
                  transition-all duration-200 flex flex-col items-center justify-center`}
              >
                <span className="text-sm font-semibold">{slot.slotNumber}</span>
                <span className="text-xs text-gray-500">{slot.rateType}</span>
                <span className="text-xs text-gray-500">₹{ratesMap[rateKey] || '-'}/hour</span>
                <span className="text-xs mt-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {slotVehicleType === 'bike' ? 'Bike' : 
                   slotVehicleType === 'truck' ? 'Truck' : 'Car'}
                </span>
              </button>
            </Tooltip>
          );
        })}
      </div>
    );
  };

  // Update the useEffect for fetching rates
  useEffect(() => {
    if (isAdmin) {
      dispatch(fetchParkingRates());
    }
  }, [dispatch, isAdmin]);

  // Update vehicle type when a vehicle is selected
  useEffect(() => {
    if (selectedVehicle) {
      const vehicle = vehicles.find(v => v._id === selectedVehicle);
      if (vehicle) {
        setSelectedVehicleType(vehicle.vehicleType);
      }
    }
  }, [selectedVehicle, vehicles]);

  // Add handler for pricing modal
  const handlePricingModalOpen = () => {
    setIsPricingModalOpen(true);
    setEditingRate(null);
    setNewRate({
      type: '',
      vehicleType: '', // Default to empty to create a base rate
      hourlyRate: '',
      description: ''
    });
  };

  const handlePricingModalClose = () => {
    setIsPricingModalOpen(false);
    setEditingRate(null);
    setNewRate({
      type: '',
      vehicleType: '', // Default to empty to create a base rate
      hourlyRate: '',
      description: ''
    });
  };

  // Add handler for creating/updating parking rate
  const handleSaveParkingRate = async (e) => {
    e.preventDefault();
    try {
      // Include vehicleType in the rate data
      const rateData = {
        ...newRate,
        vehicleType: newRate.vehicleType || null // Use null for base rates
      };
      
      await parkingRateService.updateParkingRate(editingRate._id, rateData);
      toast.success('Parking rate updated successfully');
      dispatch(fetchParkingRates());
      handlePricingModalClose();
    } catch (error) {
      console.error('Error saving parking rate:', error);
      toast.error(error.response?.data?.message || 'Failed to save parking rate');
    }
  };

  // Add handler for editing parking rate
  const handleEditRate = (rate) => {
    setEditingRate(rate);
    setNewRate({
      type: rate.type,
      vehicleType: rate.vehicleType || '', // Default to empty for base rates
      hourlyRate: rate.hourlyRate,
      description: rate.description
    });
  };

  // Add handler for deleting parking rate
  const handleDeleteRate = async (rateId) => {
    if (window.confirm('Are you sure you want to delete this parking rate?')) {
      try {
        await parkingRateService.deleteParkingRate(rateId);
        toast.success('Parking rate deleted successfully');
        dispatch(fetchParkingRates());
      } catch (error) {
        console.error('Error deleting parking rate:', error);
        toast.error(error.response?.data?.message || 'Failed to delete parking rate');
      }
    }
  };

  // Add state for parking requests
  const [parkingRequests, setParkingRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState(null);

  // Fetch parking requests
  const fetchParkingRequests = async () => {
    try {
      setRequestsError(null);
      setRequestsLoading(true);
      const response = await axios.get(`${BASE_URL}/api/parking-requests/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setParkingRequests(response.data.data || []);
    } catch (error) {
      console.error('Error fetching parking requests:', error);
      setRequestsError('Failed to load parking requests. Please try again later.');
    } finally {
      setRequestsLoading(false);
    }
  };

  // Add useEffect to fetch parking requests
  useEffect(() => {
    fetchParkingRequests();
  }, [user.id, token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-24 px-4 sm:px-6 lg:px-8">
      <style>{styles}</style>
      
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 relative inline-block">
            My Bookings
            <div className="absolute -bottom-2 left-0 w-1/3 h-1 bg-blue-400 rounded-full"></div>
          </h1>
          
          {isAdmin && (
            <button
              onClick={handlePricingModalOpen}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Manage Pricing</span>
            </button>
          )}
        </div>

        {/* New Booking Section */}
        <div className="mb-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-blue-100">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Book a Parking Slot</h2>
          
          {bookingError && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-lg">
              {bookingError}
            </div>
          )}

          <form onSubmit={handleBooking} className="space-y-8">
            {/* Vehicle Selection */}
            <div>
              <label htmlFor="vehicle" className="block text-lg font-medium text-gray-700 mb-2">
                Select Vehicle
              </label>
              <select
                id="vehicle"
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full p-3 border border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white/50 backdrop-blur-sm"
              >
                <option value="">Choose a vehicle</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle._id} value={vehicle._id}>
                    {vehicle.licensePlate} - {vehicle.make} ({vehicle.vehicleType})
                  </option>
                ))}
              </select>
            </div>

            {/* Parking Building Structure */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Select Parking Slot</h3>
              
              {/* Vehicle Type Tabs */}
              <div className="mb-6 border-b border-gray-200">
                <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
                  <li className="mr-2">
                    <button
                      type="button"
                      onClick={() => setSelectedVehicleType('car')}
                      className={`inline-block p-4 rounded-t-lg ${
                        selectedVehicleType === 'car'
                          ? 'text-blue-600 border-b-2 border-blue-600 active'
                          : 'hover:text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      Car Slots
                    </button>
                  </li>
                  <li className="mr-2">
                    <button
                      type="button"
                      onClick={() => setSelectedVehicleType('bike')}
                      className={`inline-block p-4 rounded-t-lg ${
                        selectedVehicleType === 'bike'
                          ? 'text-blue-600 border-b-2 border-blue-600 active'
                          : 'hover:text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      Motorcycle Slots
                    </button>
                  </li>
                  <li className="mr-2">
                    <button
                      type="button"
                      onClick={() => setSelectedVehicleType('truck')}
                      className={`inline-block p-4 rounded-t-lg ${
                        selectedVehicleType === 'truck'
                          ? 'text-blue-600 border-b-2 border-blue-600 active'
                          : 'hover:text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      Truck Slots
                    </button>
                  </li>
                </ul>
              </div>
              
              {/* Building Blocks */}
              <div className="space-y-8">
                {Object.entries(organizedSlots[selectedVehicleType] || {}).map(([blockId, block]) => (
                  <div key={blockId} className="border border-blue-100 rounded-lg p-4 bg-white/50 backdrop-blur-sm">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">
                      Block {block.blockName}
                    </h4>
                    
                    {/* Floors */}
                    <div className="space-y-6">
                      {Object.entries(block.floors)
                        .sort(([a], [b]) => b - a)
                        .map(([floor, slots]) => (
                          <div key={floor} className="bg-blue-50/50 rounded-lg p-4">
                            <h5 className="text-md font-medium text-gray-700 mb-3">
                              Floor {floor}
                            </h5>
                            {renderSlotsGrid(slots)}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
                
                {Object.keys(organizedSlots[selectedVehicleType] || {}).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No {selectedVehicleType} parking slots available.
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-emerald-400 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">Available</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-rose-400 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">Occupied</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-amber-400 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">Reserved</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-100 rounded mr-2 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-800">C</span>
                  </div>
                  <span className="text-sm text-gray-600">Car Slot</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-100 rounded mr-2 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-800">M</span>
                  </div>
                  <span className="text-sm text-gray-600">Motorcycle Slot</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-100 rounded mr-2 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-800">T</span>
                  </div>
                  <span className="text-sm text-gray-600">Truck Slot</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={bookingLoading || !selectedVehicle || !selectedSlot}
                className={`px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                  transition-all duration-200 flex items-center space-x-2
                  ${(bookingLoading || !selectedVehicle || !selectedSlot) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {bookingLoading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Booking...</span>
                  </>
                ) : (
                  'Book Now'
                )}
              </button>
            </div>
          </form>
        </div>
        
        {error && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {/* Parking Requests Section */}
        <div className="mt-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-blue-100">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">My Parking Requests</h2>
          
          {requestsError && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-lg">
              {requestsError}
            </div>
          )}

          {requestsLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : parkingRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              You haven't sent any parking requests yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {parkingRequests.map((request) => (
                <div 
                  key={request._id}
                  className="booking-card bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-blue-100"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-gray-900">
                        Slot {request.parkingSlot?.slotNumber}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        request.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        request.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        request.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {request.status}
                      </span>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-gray-600">
                        <span className="font-medium mr-2">Vehicle:</span>
                        {request.vehicle?.licensePlate}
                      </div>
                      <div className="text-sm text-gray-500">
                        Requested: {formatDate(request.requestTime)}
                      </div>
                      {request.responseTime && (
                        <div className="text-sm text-gray-500">
                          Responded: {formatDate(request.responseTime)}
                        </div>
                      )}
                      {request.reason && (
                        <div className="text-sm text-gray-500">
                          Reason: {request.reason}
                        </div>
                      )}
                    </div>

                    {request.status === 'approved' && request.parkingSession && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="text-sm font-medium text-emerald-600 mb-2">
                          Parking Session Created
                        </div>
                        <div className="text-sm text-gray-500">
                          Session ID: {request.parkingSession._id}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {bookings.length === 0 ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-blue-100">
            <p className="text-xl text-gray-600 mb-8">
              You haven't booked any parking slots yet.
            </p>
            
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking) => {
              const progress = getBookingProgress(booking);
              return (
                <div 
                  key={booking._id}
                  onClick={() => handleCardClick(booking)}
                  className="booking-card bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer border border-blue-100"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-gray-900">
                        Slot {booking.parkingSlot?.slotNumber}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        booking.status.toLowerCase() === 'active' ? 'bg-blue-100 text-blue-700' :
                        booking.status.toLowerCase() === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-gray-600">
                        <span className="font-medium mr-2">Vehicle:</span>
                        {booking.vehicle?.licensePlate}
                      </div>
                      <div className="text-sm text-gray-500">
                        Booked: {formatDate(booking.bookingTime)}
                      </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="relative pt-4">
                      <div className="flex justify-between items-center">
                        {['Booked', 'Entered', 'Exited'].map((step, index) => {
                          const stepNumber = index + 1;
                          const status = getStepStatus(stepNumber, progress.step, progress.status);
                          return (
                            <div key={step} className="flex flex-col items-center relative z-10">
                              <div className={`w-4 h-4 rounded-full ${
                                status === 'completed' ? 'bg-emerald-400' :
                                status === 'active' ? 'bg-blue-400 step-active' :
                                status === 'expired' ? 'bg-rose-400' :
                                'bg-gray-300'
                              }`}></div>
                              <span className={`mt-2 text-xs font-medium ${
                                status === 'active' ? 'text-blue-600' :
                                status === 'completed' ? 'text-emerald-600' :
                                status === 'expired' ? 'text-rose-600' :
                                'text-gray-500'
                              }`}>
                                {step}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {/* Progress Line */}
                      <div className="absolute top-[1.5rem] left-0 w-[94%] ml-4 h-0.5 bg-gray-200">
                        <div 
                          className="h-full bg-emerald-400 progress-line"
                          style={{ 
                            width: progress.step === 1 ? '0%' :
                                   progress.step === 2 ? '50%' :
                                   '100%'
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        <Modal
          open={Boolean(selectedBooking)}
          onClose={handleCloseModal}
          aria-labelledby="booking-details-modal"
          className="flex items-center justify-center p-4"
        >
          <div className="modal-animation bg-white/90 backdrop-blur-sm rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto relative border border-blue-100">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b border-blue-100" id="booking-details-modal">
              Booking Details
            </h2>

            {selectedBooking && (
              <div className="space-y-4">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700">Slot Number:</span>
                    <span className="text-gray-900">{selectedBooking.parkingSlot?.slotNumber}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700">Vehicle:</span>
                    <span className="text-gray-900">{selectedBooking.vehicle?.licensePlate}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedBooking.status.toLowerCase() === 'active' ? 'bg-blue-100 text-blue-700' :
                      selectedBooking.status.toLowerCase() === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {selectedBooking.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700">Booking Time:</span>
                    <span className="text-gray-900">{formatDate(selectedBooking.bookingTime)}</span>
                  </div>

                  {selectedBooking.entryTime && (
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-700">Entry Time:</span>
                      <span className="text-gray-900">{formatDate(selectedBooking.entryTime)}</span>
                    </div>
                  )}

                  {selectedBooking.exitTime && (
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-700">Exit Time:</span>
                      <span className="text-gray-900">{formatDate(selectedBooking.exitTime)}</span>
                    </div>
                  )}

                  {selectedBooking.amount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-700">Amount:</span>
                      <span className="text-gray-900">₹{selectedBooking.amount}</span>
                    </div>
                  )}
                </div>

                {selectedBooking.qrCode && (
                  <div className="mt-6 flex flex-col items-center">
                    <span className="font-semibold text-gray-700 mb-3">QR Code</span>
                    <div className="p-4 bg-white rounded-lg border border-blue-100 shadow-sm">
                      {qrCodeError ? (
                        <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-50 rounded-lg">
                          <span className="text-gray-500">QR Code not available</span>
                        </div>
                      ) : (
                        <img
                          src={selectedBooking.qrCodeUrl}
                          alt="Parking QR Code"
                          crossOrigin='anonymous'
                          className="max-w-[200px]"
                          onError={() => setQrCodeError(true)}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>

        {/* Pricing Management Modal */}
        <Modal
          open={isPricingModalOpen}
          onClose={handlePricingModalClose}
          className="flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Edit Parking Rate
              </h2>
              <button
                onClick={handlePricingModalClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {editingRate ? (
              <form onSubmit={handleSaveParkingRate} className="space-y-6">
                <FormControl fullWidth>
                  <InputLabel>Vehicle Type</InputLabel>
                  <Select
                    value={newRate.vehicleType}
                    onChange={(e) => setNewRate({ ...newRate, vehicleType: e.target.value })}
                    label="Vehicle Type"
                    required
                  >
                    <MenuItem value="car">Car</MenuItem>
                    <MenuItem value="bike">Bike</MenuItem>
                    <MenuItem value="truck">Truck</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Rate Type</InputLabel>
                  <Select
                    value={newRate.type}
                    onChange={(e) => setNewRate({ ...newRate, type: e.target.value })}
                    label="Rate Type"
                    required
                  >
                    <MenuItem value="NORMAL">Normal</MenuItem>
                    <MenuItem value="VIP">VIP</MenuItem>
                    <MenuItem value="VVIP">VVIP</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Hourly Rate"
                  type="number"
                  value={newRate.hourlyRate}
                  onChange={(e) => setNewRate({ ...newRate, hourlyRate: e.target.value })}
                  required
                  inputProps={{ min: 0 }}
                />

                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={newRate.description}
                  onChange={(e) => setNewRate({ ...newRate, description: e.target.value })}
                />

                <div className="flex justify-end space-x-4">
                  <Button
                    variant="outlined"
                    onClick={handlePricingModalClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={!newRate.hourlyRate}
                  >
                    Update Rate
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Select a rate to edit from the list below
              </div>
            )}

            {/* List of existing rates */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Rates</h3>
              {ratesLoading ? (
                <div className="flex justify-center items-center py-4">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : parkingRates && parkingRates.length > 0 ? (
                <div className="space-y-6">
                  {/* Car Rates */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3 pb-2 border-b border-gray-200">
                      Car Rates
                    </h4>
                    <div className="space-y-4">
                      {parkingRates
                        .filter(rate => rate.vehicleType === 'car' || !rate.vehicleType)
                        .map((rate) => (
                          <div
                            key={rate._id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <h4 className="font-medium text-gray-900">{rate.type}</h4>
                              <p className="text-sm text-gray-500">₹{rate.hourlyRate}/hour</p>
                              {rate.description && (
                                <p className="text-sm text-gray-600 mt-1">{rate.description}</p>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleEditRate(rate)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={() => handleDeleteRate(rate._id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      {parkingRates.filter(rate => rate.vehicleType === 'car' || !rate.vehicleType).length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          No car rates found.
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Bike Rates */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3 pb-2 border-b border-gray-200">
                      Motorcycle Rates
                    </h4>
                    <div className="space-y-4">
                      {parkingRates
                        .filter(rate => rate.vehicleType === 'bike')
                        .map((rate) => (
                          <div
                            key={rate._id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <h4 className="font-medium text-gray-900">{rate.type}</h4>
                              <p className="text-sm text-gray-500">₹{rate.hourlyRate}/hour</p>
                              {rate.description && (
                                <p className="text-sm text-gray-600 mt-1">{rate.description}</p>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleEditRate(rate)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={() => handleDeleteRate(rate._id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      {parkingRates.filter(rate => rate.vehicleType === 'bike').length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          No motorcycle rates found.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Truck Rates */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3 pb-2 border-b border-gray-200">
                      Truck Rates
                    </h4>
                    <div className="space-y-4">
                      {parkingRates
                        .filter(rate => rate.vehicleType === 'truck')
                        .map((rate) => (
                          <div
                            key={rate._id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <h4 className="font-medium text-gray-900">{rate.type}</h4>
                              <p className="text-sm text-gray-500">₹{rate.hourlyRate}/hour</p>
                              {rate.description && (
                                <p className="text-sm text-gray-600 mt-1">{rate.description}</p>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleEditRate(rate)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={() => handleDeleteRate(rate._id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      {parkingRates.filter(rate => rate.vehicleType === 'truck').length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          No truck rates found.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No parking rates found.
                </div>
              )}
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default Bookings;