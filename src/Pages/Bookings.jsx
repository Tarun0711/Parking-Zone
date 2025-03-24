import React, { useState, useEffect } from 'react';
import { parkingSessionService } from '../services/api';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@mui/material';
import axios from 'axios';
import { toast } from 'react-hot-toast';
const BASE_URL = 'https://parking-zone-backend.onrender.com'; 

const SLOT_RATES = {
  'NORMAL': 10,
  'VIP': 20,
  'VVIP': 30
};

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
  
  // New state variable for QR code error
  const [qrCodeError, setQrCodeError] = useState(false);
  
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

  // Helper function to organize slots by block and floor
  const organizeSlots = (slots) => {
    const organized = {};
    slots.forEach(slot => {
      const blockId = slot.block._id;
      const floor = slot.floor;
      
      if (!organized[blockId]) {
        organized[blockId] = {
          blockName: slot.block.blockName,
          floors: {}
        };
      }
      
      if (!organized[blockId].floors[floor]) {
        organized[blockId].floors[floor] = [];
      }
      
      organized[blockId].floors[floor].push(slot);
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

    try {
      // Create booking directly without payment
      const bookingResponse = await parkingSessionService.createSession({
        vehicleId: selectedVehicle,
        parkingSlotId: selectedSlot,
        amount: 0 // Set amount to 0 since we're not charging
      });

      if (!bookingResponse || !bookingResponse.data) {
        throw new Error('Invalid response from server');
      }

      // Refresh bookings list
      await fetchBookings();
      
      // Reset selection
      setSelectedVehicle('');
      setSelectedSlot('');
      
     
      
     toast.success('Booking successful!');
      
      // Refresh available slots
      const slotsResponse = await axios.get(`${BASE_URL}/api/parking-slots`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const slots = slotsResponse.data.data || [];
      setAvailableSlots(slots);
      setOrganizedSlots(organizeSlots(slots));
    } catch (error) {
      console.error('Error creating booking:', error);
      setBookingError(
        error.response?.data?.message || 
        error.message || 
        'Failed to create booking. Please try again.'
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
        {slots.map((slot) => (
          <button
            key={slot._id}
            onClick={() => slot.status === 'available' ? setSelectedSlot(slot._id) : null}
            disabled={slot.status !== 'available'}
            className={`relative p-4 border-2 rounded-lg ${getSlotStatusColor(slot)} 
              ${selectedSlot === slot._id ? 'ring-2 ring-emerald-500 bg-emerald-200' : ''}
              transition-all duration-200 flex flex-col items-center justify-center`}
          >
            <span className="text-sm font-semibold">{slot.slotNumber}</span>
            <span className="text-xs text-gray-500">{slot.rateType}</span>
            <span className="text-xs text-gray-500">₹{SLOT_RATES[slot.rateType] || '-'}</span>
          </button>
        ))}
      </div>
    );
  };

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
        <h1 className="text-4xl font-bold text-gray-900 mb-12 relative inline-block">
          My Bookings
          <div className="absolute -bottom-2 left-0 w-1/3 h-1 bg-blue-400 rounded-full"></div>
        </h1>

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
              
              {/* Building Blocks */}
              <div className="space-y-8">
                {Object.entries(organizedSlots).map(([blockId, block]) => (
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
              </div>

              {/* Legend */}
              <div className="mt-6 flex items-center space-x-6">
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
        
        {bookings.length === 0 ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-blue-100">
            <p className="text-xl text-gray-600 mb-8">
              You haven't booked any parking slots yet.
            </p>
            <button 
              onClick={() => navigate('/book')}
              className="px-8 py-3 bg-blue-500 text-white text-lg font-medium rounded-lg
                hover:bg-blue-600 transform hover:-translate-y-0.5 transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            >
              Book a Slot
            </button>
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
                          src={`${BASE_URL}/uploads/qrcodes/qr-${selectedBooking._id}.png`}
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
      </div>
    </div>
  );
}

export default Bookings;