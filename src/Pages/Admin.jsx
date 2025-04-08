import React, { useEffect, useState } from 'react'
import axios from 'axios'; // Make sure to import axios
import { useSelector } from 'react-redux';
import { Select, MenuItem, FormControl, InputLabel, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Pagination, Box, Typography, Chip, IconButton, Tooltip, Modal } from '@mui/material';
import { toast } from 'react-hot-toast';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

function Admin() {
    const [totalSessions, setTotalSessions] = useState(0);
    const [totalVehicles, setTotalVehicles] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [parkingSessions, setParkingSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [blockData, setBlockData] = useState({
        blockName: '',
        blockDescription: '',
        floor: '',
        totalSlots: '',
        vehicleTypes: {
            car: 0,
            truck: 0,
            bike: 0
        }
    });
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [monthlyRevenue, setMonthlyRevenue] = useState(0);
    
    // Vehicle management states
    const [vehicles, setVehicles] = useState([]);
    const [vehicleLoading, setVehicleLoading] = useState(false);
    const [vehiclePage, setVehiclePage] = useState(1);
    const [vehicleLimit, setVehicleLimit] = useState(10);
    const [vehicleTotal, setVehicleTotal] = useState(0);
    const [vehicleFilter, setVehicleFilter] = useState({
        vehicleType: '',
        isRegular: '',
        sort: '-createdAt'
    });
    const [actionLoading, setActionLoading] = useState({});
    
    // Add state for parking requests
    const [parkingRequests, setParkingRequests] = useState([]);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [requestActionLoading, setRequestActionLoading] = useState({});
    const [rejectReason, setRejectReason] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    
    const { token } = useSelector((state) => state.auth);

    // Generate months for the filter
    const months = [
        { value: 'all', label: 'All Time' },
        { value: '1', label: 'January' },
        { value: '2', label: 'February' },
        { value: '3', label: 'March' },
        { value: '4', label: 'April' },
        { value: '5', label: 'May' },
        { value: '6', label: 'June' },
        { value: '7', label: 'July' },
        { value: '8', label: 'August' },
        { value: '9', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' }
    ];

    // Fetch parking sessions
    const fetchParkingSessions = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/parking-sessions', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setParkingSessions(response.data.data);
            setTotalSessions(response.data.count);
            
            // Calculate total revenue
            const total = response.data.data.reduce((sum, session) => sum + (session.amount || 0), 0);
            setTotalRevenue(total);
            
            // Calculate monthly revenue if a month is selected
            if (selectedMonth !== 'all') {
                const currentYear = new Date().getFullYear();
                const monthlyTotal = response.data.data
                    .filter(session => {
                        const sessionDate = new Date(session.exitTime || session.entryTime);
                        return sessionDate.getMonth() + 1 === parseInt(selectedMonth) && 
                               sessionDate.getFullYear() === currentYear;
                    })
                    .reduce((sum, session) => sum + (session.amount || 0), 0);
                setMonthlyRevenue(monthlyTotal);
            } else {
                setMonthlyRevenue(total);
            }
        } catch (error) {
            console.error('Error fetching parking sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch vehicles with pagination and filtering
    const fetchVehicles = async () => {
        try {
            setVehicleLoading(true);
            
            // Build query string
            let queryString = `page=${vehiclePage}&limit=${vehicleLimit}&sort=${vehicleFilter.sort}`;
            
            if (vehicleFilter.vehicleType) {
                queryString += `&vehicleType=${vehicleFilter.vehicleType}`;
            }
            
            if (vehicleFilter.isRegular !== '') {
                queryString += `&isRegular=${vehicleFilter.isRegular}`;
            }
            
            const response = await axios.get(`http://localhost:5000/api/vehicles/admin/all?${queryString}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            setVehicles(response.data.data.vehicles);
            setVehicleTotal(response.data.total);
            setTotalVehicles(response.data.total);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            toast.error('Failed to fetch vehicles');
        } finally {
            setVehicleLoading(false);
        }
    };

    // Handle month filter change
    const handleMonthChange = (event) => {
        setSelectedMonth(event.target.value);
    };

    // Handle vehicle filter change
    const handleVehicleFilterChange = (field, value) => {
        setVehicleFilter(prev => ({
            ...prev,
            [field]: value
        }));
        setVehiclePage(1); // Reset to first page when filter changes
    };

    // Handle vehicle page change
    const handleVehiclePageChange = (event, value) => {
        setVehiclePage(value);
    };

    // Handle status change
    const handleStatusChange = async (sessionId, newStatus) => {
        try {
            let endpoint = '';
            switch (newStatus) {
                case 'completed':
                    endpoint = `http://localhost:5000/api/parking-sessions/${sessionId}/complete`;
                    break;
                case 'cancelled':
                    endpoint = `http://localhost:5000/api/parking-sessions/${sessionId}/cancel`;
                    break;
                default:
                    return;
            }

            await axios.post(endpoint, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            fetchParkingSessions(); // Refresh the list
        } catch (error) {
            console.error('Error updating session status:', error);
        }
    };

    // Handle block creation
    const handleCreateBlock = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/blocks/', blockData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            // Show success toast
            toast.success('Parking block created successfully!');
            
            setIsModalOpen(false);
            setBlockData({
                blockName: '',
                blockDescription: '',
                floor: '',
                totalSlots: '',
                vehicleTypes: {
                    car: 0,
                    truck: 0,
                    bike: 0
                }
            });
        } catch (error) {
            console.error('Error creating parking block:', error);
            // Show error toast with the error message if available
            toast.error(error.response?.data?.message || 'Failed to create parking block. Please try again.');
        }
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    // Toggle vehicle active status
    const handleToggleActiveStatus = async (vehicleId, currentStatus) => {
        try {
            setActionLoading(prev => ({ ...prev, [vehicleId]: true }));
            
            const response = await axios.patch(
                `http://localhost:5000/api/vehicles/${vehicleId}`,
                { isActive: !currentStatus },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            // Update the vehicle in the local state
            setVehicles(prevVehicles => 
                prevVehicles.map(vehicle => 
                    vehicle._id === vehicleId 
                        ? { ...vehicle, isActive: !currentStatus } 
                        : vehicle
                )
            );
            
            toast.success(`Vehicle ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        } catch (error) {
            console.error('Error toggling vehicle status:', error);
            toast.error('Failed to update vehicle status');
        } finally {
            setActionLoading(prev => ({ ...prev, [vehicleId]: false }));
        }
    };

    // Delete vehicle
    const handleDeleteVehicle = async (vehicleId) => {
        if (!window.confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
            return;
        }
        
        try {
            setActionLoading(prev => ({ ...prev, [vehicleId]: true }));
            
            await axios.delete(
                `http://localhost:5000/api/vehicles/${vehicleId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            // Remove the vehicle from the local state
            setVehicles(prevVehicles => 
                prevVehicles.filter(vehicle => vehicle._id !== vehicleId)
            );
            
            // Update total count
            setVehicleTotal(prev => prev - 1);
            setTotalVehicles(prev => prev - 1);
            
            toast.success('Vehicle deleted successfully');
        } catch (error) {
            console.error('Error deleting vehicle:', error);
            toast.error('Failed to delete vehicle');
        } finally {
            setActionLoading(prev => ({ ...prev, [vehicleId]: false }));
        }
    };

    // Fetch parking requests
    const fetchParkingRequests = async () => {
        try {
            setRequestsLoading(true);
            const response = await axios.get('http://localhost:5000/api/parking-requests', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setParkingRequests(response.data.data);
        } catch (error) {
            console.error('Error fetching parking requests:', error);
            toast.error('Failed to fetch parking requests');
        } finally {
            setRequestsLoading(false);
        }
    };
    
    // Handle approve request
    const handleApproveRequest = async (requestId) => {
        try {
            setRequestActionLoading(prev => ({ ...prev, [requestId]: true }));
            
            const response = await axios.post(
                `http://localhost:5000/api/parking-requests/${requestId}/approve`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            // Update the request in the local state
            setParkingRequests(prevRequests => 
                prevRequests.map(request => 
                    request._id === requestId 
                        ? { ...request, status: 'approved', parkingSession: response.data.data.parkingSession } 
                        : request
                )
            );
            
            toast.success('Parking request approved successfully');
            
            // Refresh parking sessions
            fetchParkingSessions();
        } catch (error) {
            console.error('Error approving parking request:', error);
            toast.error(error.response?.data?.message || 'Failed to approve request');
        } finally {
            setRequestActionLoading(prev => ({ ...prev, [requestId]: false }));
        }
    };
    
    // Handle reject request
    const handleRejectRequest = async (requestId) => {
        if (!rejectReason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }
        
        try {
            setRequestActionLoading(prev => ({ ...prev, [requestId]: true }));
            
            const response = await axios.post(
                `http://localhost:5000/api/parking-requests/${requestId}/reject`,
                { reason: rejectReason },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            // Update the request in the local state
            setParkingRequests(prevRequests => 
                prevRequests.map(request => 
                    request._id === requestId 
                        ? { ...request, status: 'rejected', reason: rejectReason } 
                        : request
                )
            );
            
            toast.success('Parking request rejected successfully');
            setIsRejectModalOpen(false);
            setRejectReason('');
            setSelectedRequest(null);
        } catch (error) {
            console.error('Error rejecting parking request:', error);
            toast.error(error.response?.data?.message || 'Failed to reject request');
        } finally {
            setRequestActionLoading(prev => ({ ...prev, [requestId]: false }));
        }
    };
    
    // Open reject modal
    const openRejectModal = (request) => {
        setSelectedRequest(request);
        setIsRejectModalOpen(true);
    };
    
    // Close reject modal
    const closeRejectModal = () => {
        setIsRejectModalOpen(false);
        setRejectReason('');
        setSelectedRequest(null);
    };

    useEffect(() => {
        fetchParkingSessions();
    }, [selectedMonth]);

    useEffect(() => {
        fetchVehicles();
    }, [vehiclePage, vehicleFilter]);

    useEffect(() => {
        fetchParkingRequests();
    }, [token]);

    return (
        <div
        className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-24 px-4 sm:px-6 lg:px-8'
        >
            <div className='flex justify-between items-center mb-8'>
                <h1 className='text-4xl font-bold text-gray-900 relative inline-block'>
                    Admin Panel
                </h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className='bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors'
                >
                    Add Parking Slots
                </button>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
                    <div className='bg-white p-6 rounded-lg w-full max-w-md'>
                        <h2 className='text-2xl font-bold mb-4'>Add New Parking Block</h2>
                        <form onSubmit={handleCreateBlock}>
                            <div className='mb-4'>
                                <label className='block text-gray-700 text-sm font-bold mb-2'>
                                    Block Name
                                </label>
                                <input
                                    type='text'
                                    value={blockData.blockName}
                                    onChange={(e) => setBlockData({...blockData, blockName: e.target.value})}
                                    className='w-full px-3 py-2 border rounded-md'
                                    required
                                />
                            </div>
                            <div className='mb-4'>
                                <label className='block text-gray-700 text-sm font-bold mb-2'>
                                    Block Description
                                </label>
                                <input
                                    type='text'
                                    value={blockData.blockDescription}
                                    onChange={(e) => setBlockData({...blockData, blockDescription: e.target.value})}
                                    className='w-full px-3 py-2 border rounded-md'
                                    required
                                />
                            </div>
                            <div className='mb-4'>
                                <label className='block text-gray-700 text-sm font-bold mb-2'>
                                    Floor
                                </label>
                                <input
                                    type='number'
                                    value={blockData.floor}
                                    onChange={(e) => setBlockData({...blockData, floor: e.target.value})}
                                    className='w-full px-3 py-2 border rounded-md'
                                    required
                                />
                            </div>
                            <div className='mb-4'>
                                <label className='block text-gray-700 text-sm font-bold mb-2'>
                                    Total Slots
                                </label>
                                <input
                                    type='number'
                                    value={blockData.totalSlots}
                                    onChange={(e) => setBlockData({...blockData, totalSlots: e.target.value})}
                                    className='w-full px-3 py-2 border rounded-md'
                                    required
                                />
                            </div>
                            <div className='mb-4'>
                                <label className='block text-gray-700 text-sm font-bold mb-2'>
                                    Vehicle Types Distribution
                                </label>
                                <div className='grid grid-cols-3 gap-2'>
                                    <div>
                                        <label className='block text-gray-600 text-xs mb-1'>
                                            Cars
                                        </label>
                                        <input
                                            type='number'
                                            min='0'
                                            value={blockData.vehicleTypes.car}
                                            onChange={(e) => setBlockData({
                                                ...blockData, 
                                                vehicleTypes: {
                                                    ...blockData.vehicleTypes,
                                                    car: parseInt(e.target.value) || 0
                                                }
                                            })}
                                            className='w-full px-3 py-2 border rounded-md'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-gray-600 text-xs mb-1'>
                                            Trucks
                                        </label>
                                        <input
                                            type='number'
                                            min='0'
                                            value={blockData.vehicleTypes.truck}
                                            onChange={(e) => setBlockData({
                                                ...blockData, 
                                                vehicleTypes: {
                                                    ...blockData.vehicleTypes,
                                                    truck: parseInt(e.target.value) || 0
                                                }
                                            })}
                                            className='w-full px-3 py-2 border rounded-md'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-gray-600 text-xs mb-1'>
                                            Bikes
                                        </label>
                                        <input
                                            type='number'
                                            min='0'
                                            value={blockData.vehicleTypes.bike}
                                            onChange={(e) => setBlockData({
                                                ...blockData, 
                                                vehicleTypes: {
                                                    ...blockData.vehicleTypes,
                                                    bike: parseInt(e.target.value) || 0
                                                }
                                            })}
                                            className='w-full px-3 py-2 border rounded-md'
                                        />
                                    </div>
                                </div>
                                <div className='mt-2 text-sm text-gray-500'>
                                    Total: {blockData.vehicleTypes.car + blockData.vehicleTypes.truck + blockData.vehicleTypes.bike} / {blockData.totalSlots || 0}
                                </div>
                            </div>
                            <div className='flex justify-end space-x-2'>
                                <button
                                    type='button'
                                    onClick={() => setIsModalOpen(false)}
                                    className='px-4 py-2 text-gray-600 hover:text-gray-800'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600'
                                >
                                    Create Block
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className='max-w-7xl mx-auto'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='bg-white p-6 rounded-lg shadow-md'>
                        <h2 className='text-xl font-bold text-gray-800 mb-4'>
                            Total Parking Sessions
                            <span className='text-blue-500'>
                                {totalSessions}
                            </span>

                        </h2>
                    </div>
                    <div className='bg-white p-6 rounded-lg shadow-md'>
                        <h2 className='text-xl font-bold text-gray-800 mb-4'>
                            Total Vehicles
                            <span className='text-blue-500'>
                                {totalVehicles}
                            </span>
                        </h2>
                    </div>
                    <div className='bg-white p-6 rounded-lg shadow-md'>
                        <h2 className='text-xl font-bold text-gray-800 mb-4'>
                            Revenue
                            <div className='mt-2'>
                                <FormControl fullWidth size="small">
                                    <InputLabel id="month-filter-label">Filter by Month</InputLabel>
                                    <Select
                                        labelId="month-filter-label"
                                        value={selectedMonth}
                                        onChange={handleMonthChange}
                                        label="Filter by Month"
                                    >
                                        {months.map((month) => (
                                            <MenuItem key={month.value} value={month.value}>
                                                {month.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </div>
                            <div className='mt-4'>
                                <span className='text-blue-500 text-2xl'>
                                    ₹{selectedMonth === 'all' ? totalRevenue : monthlyRevenue}
                                </span>
                                <span className='text-sm text-gray-500 ml-2'>
                                    {selectedMonth !== 'all' ? `(${months.find(m => m.value === selectedMonth)?.label})` : '(All Time)'}
                                </span>
                            </div>
                        </h2>
                    </div>
                    
                </div>
            </div>
            
            {/* Vehicles Management Section */}
            <div className='mt-12 bg-white rounded-lg shadow-md p-6'>
                <div className='flex justify-between items-center mb-6'>
                    <h2 className='text-2xl font-bold text-gray-800'>Vehicle Management</h2>
                    <div className='flex space-x-4'>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel id="vehicle-type-filter">Vehicle Type</InputLabel>
                            <Select
                                labelId="vehicle-type-filter"
                                value={vehicleFilter.vehicleType}
                                onChange={(e) => handleVehicleFilterChange('vehicleType', e.target.value)}
                                label="Vehicle Type"
                            >
                                <MenuItem value="">All Types</MenuItem>
                                <MenuItem value="car">Car</MenuItem>
                                <MenuItem value="motorcycle">Motorcycle</MenuItem>
                                <MenuItem value="truck">Truck</MenuItem>
                            </Select>
                        </FormControl>
                        
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel id="regular-filter">Regular Status</InputLabel>
                            <Select
                                labelId="regular-filter"
                                value={vehicleFilter.isRegular}
                                onChange={(e) => handleVehicleFilterChange('isRegular', e.target.value)}
                                label="Regular Status"
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="true">Regular</MenuItem>
                                <MenuItem value="false">Non-Regular</MenuItem>
                            </Select>
                        </FormControl>
                        
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel id="sort-filter">Sort By</InputLabel>
                            <Select
                                labelId="sort-filter"
                                value={vehicleFilter.sort}
                                onChange={(e) => handleVehicleFilterChange('sort', e.target.value)}
                                label="Sort By"
                            >
                                <MenuItem value="-createdAt">Newest First</MenuItem>
                                <MenuItem value="createdAt">Oldest First</MenuItem>
                                <MenuItem value="licensePlate">License Plate (A-Z)</MenuItem>
                                <MenuItem value="-licensePlate">License Plate (Z-A)</MenuItem>
                            </Select>
                        </FormControl>
                    </div>
                </div>
                
                <TableContainer component={Paper} elevation={0} className="border border-gray-200">
                    <Table sx={{ minWidth: 650 }} aria-label="vehicles table">
                        <TableHead>
                            <TableRow className="bg-gray-50">
                                <TableCell className="font-bold">License Plate</TableCell>
                                <TableCell className="font-bold">Vehicle Type</TableCell>
                                <TableCell className="font-bold">Make</TableCell>
                                <TableCell className="font-bold">Owner</TableCell>
                                <TableCell className="font-bold">Regular</TableCell>
                                <TableCell className="font-bold">Status</TableCell>
                                <TableCell className="font-bold">Created At</TableCell>
                                <TableCell className="font-bold">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {vehicleLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" className="py-8">
                                        <div className="flex justify-center">
                                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : vehicles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" className="py-8 text-gray-500">
                                        No vehicles found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                vehicles.map((vehicle) => (
                                    <TableRow key={vehicle._id} hover className="cursor-pointer">
                                        <TableCell>{vehicle.licensePlate}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={vehicle.vehicleType} 
                                                color={
                                                    vehicle.vehicleType === 'car' ? 'primary' : 
                                                    vehicle.vehicleType === 'motorcycle' ? 'secondary' : 
                                                    'default'
                                                }
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{vehicle.make}</TableCell>
                                        <TableCell>{vehicle.owner?.name || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={vehicle.isRegular ? 'Regular' : 'Non-Regular'} 
                                                color={vehicle.isRegular ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={vehicle.isActive ? 'Active' : 'Inactive'} 
                                                color={vehicle.isActive ? 'success' : 'error'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{formatDate(vehicle.createdAt)}</TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                
                                                
                                                <Tooltip title={vehicle.isActive ? "Deactivate Vehicle" : "Activate Vehicle"}>
                                                    <IconButton 
                                                        size="small" 
                                                        color={vehicle.isActive ? "success" : "error"}
                                                        disabled={actionLoading[vehicle._id]}
                                                        onClick={() => handleToggleActiveStatus(vehicle._id, vehicle.isActive)}
                                                    >
                                                        {vehicle.isActive ? <CheckCircleIcon /> : <BlockIcon />}
                                                    </IconButton>
                                                </Tooltip>
                                                
                                                <Tooltip title="Delete Vehicle">
                                                    <IconButton 
                                                        size="small" 
                                                        color="error"
                                                        disabled={actionLoading[vehicle._id]}
                                                        onClick={() => handleDeleteVehicle(vehicle._id)}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                
                <Box className="flex justify-center mt-6">
                    <Pagination 
                        count={Math.ceil(vehicleTotal / vehicleLimit)} 
                        page={vehiclePage} 
                        onChange={handleVehiclePageChange} 
                        color="primary" 
                    />
                </Box>
            </div>
            
            {/* Parking Requests Section */}
            <div className='mt-12 bg-white rounded-lg shadow-md p-6'>
                <div className='flex justify-between items-center mb-6'>
                    <h2 className='text-2xl font-bold text-gray-800'>Parking Requests</h2>
                </div>
                
                {requestsLoading ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : parkingRequests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No parking requests found
                    </div>
                ) : (
                    <TableContainer component={Paper} elevation={0} className="border border-gray-200">
                        <Table sx={{ minWidth: 650 }} aria-label="parking requests table">
                            <TableHead>
                                <TableRow className="bg-gray-50">
                                    <TableCell className="font-bold">Vehicle</TableCell>
                                    <TableCell className="font-bold">Slot</TableCell>
                                    <TableCell className="font-bold">Requested By</TableCell>
                                    <TableCell className="font-bold">Request Time</TableCell>
                                    <TableCell className="font-bold">Status</TableCell>
                                    <TableCell className="font-bold">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {parkingRequests.map((request) => (
                                    <TableRow key={request._id} hover className="cursor-pointer">
                                        <TableCell>{request.vehicle?.licensePlate}</TableCell>
                                        <TableCell>{request.parkingSlot?.slotNumber}</TableCell>
                                        <TableCell>{request.requestedBy?.name || 'N/A'}</TableCell>
                                        <TableCell>{formatDate(request.requestTime)}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={request.status} 
                                                color={
                                                    request.status === 'pending' ? 'warning' : 
                                                    request.status === 'approved' ? 'success' : 
                                                    request.status === 'rejected' ? 'error' : 
                                                    'default'
                                                }
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {request.status === 'pending' && (
                                                <div className="flex space-x-2">
                                                    <Button 
                                                        variant="contained" 
                                                        size="small" 
                                                        color="success"
                                                        disabled={requestActionLoading[request._id]}
                                                        onClick={() => handleApproveRequest(request._id)}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button 
                                                        variant="outlined" 
                                                        size="small" 
                                                        color="error"
                                                        disabled={requestActionLoading[request._id]}
                                                        onClick={() => openRejectModal(request)}
                                                    >
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}
                                            {request.status === 'approved' && (
                                                <Chip 
                                                    label="Session Created" 
                                                    color="success" 
                                                    size="small"
                                                />
                                            )}
                                            {request.status === 'rejected' && (
                                                <Tooltip title={request.reason || 'No reason provided'}>
                                                    <Chip 
                                                        label="Rejected" 
                                                        color="error" 
                                                        size="small"
                                                    />
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </div>
            
            {/* Reject Modal */}
            <Modal
                open={isRejectModalOpen}
                onClose={closeRejectModal}
                aria-labelledby="reject-modal-title"
                aria-describedby="reject-modal-description"
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                    borderRadius: 2
                }}>
                    <Typography id="reject-modal-title" variant="h6" component="h2" gutterBottom>
                        Reject Parking Request
                    </Typography>
                    <Typography id="reject-modal-description" sx={{ mb: 2 }}>
                        Please provide a reason for rejecting this request:
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Reason"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        sx={{ mb: 3 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button 
                            variant="outlined" 
                            onClick={closeRejectModal}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="contained" 
                            color="error"
                            disabled={!rejectReason.trim() || requestActionLoading[selectedRequest?._id]}
                            onClick={() => handleRejectRequest(selectedRequest?._id)}
                        >
                            Reject Request
                        </Button>
                    </Box>
                </Box>
            </Modal>
            
            {/* Parking Sessions Table */}
            <div className='mt-8 bg-white rounded-lg shadow-md'>
                <div className='px-4 py-5 sm:px-6'>
                    <h3 className='text-lg leading-6 font-medium text-gray-900'>
                        Parking Sessions
                    </h3>
                </div>
                <div className='overflow-x-auto'>
                    <div className='inline-block min-w-full align-middle'>
                        <div className='overflow-hidden border-b border-gray-200 sm:rounded-lg'>
                            <table className='min-w-full divide-y divide-gray-200'>
                                <thead className='bg-gray-50'>
                                    <tr>
                                        <th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                            Vehicle
                                        </th>
                                        <th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                            Slot
                                        </th>
                                        <th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                            Entry Time
                                        </th>
                                        <th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                            Status
                                        </th>
                                        <th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                            Amount
                                        </th>
                                        <th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className='bg-white divide-y divide-gray-200'>
                                    {loading ? (
                                        <tr>
                                            <td colSpan='6' className='px-6 py-4 text-center'>
                                                Loading...
                                            </td>
                                        </tr>
                                    ) : parkingSessions.length === 0 ? (
                                        <tr>
                                            <td colSpan='6' className='px-6 py-4 text-center text-gray-500'>
                                                No parking sessions found
                                            </td>
                                        </tr>
                                    ) : (
                                        parkingSessions.map((session) => (
                                            <tr key={session._id}>
                                                <td className='px-6 py-4 whitespace-nowrap'>
                                                    {session.vehicle?.licensePlate}
                                                </td>
                                                <td className='px-6 py-4 whitespace-nowrap'>
                                                    {session.parkingSlot?.slotNumber}
                                                </td>
                                                <td className='px-6 py-4 whitespace-nowrap'>
                                                    {new Date(session.entryTime).toLocaleString()}
                                                </td>
                                                <td className='px-6 py-4 whitespace-nowrap'>
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                        ${session.status === 'active' ? 'bg-green-100 text-green-800' : 
                                                          session.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                                                          'bg-red-100 text-red-800'}`}>
                                                        {session.status}
                                                    </span>
                                                </td>
                                                <td className='px-6 py-4 whitespace-nowrap'>
                                                    ₹{session.amount || 0}
                                                </td>
                                                <td className='px-6 py-4 whitespace-nowrap'>
                                                    {session.status === 'active' && (
                                                        <div className='space-x-2'>
                                                            <button
                                                                onClick={() => handleStatusChange(session._id, 'completed')}
                                                                className='bg-blue-500 text-white px-3 py-1 rounded-md text-sm'
                                                            >
                                                                Complete
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusChange(session._id, 'cancelled')}
                                                                className='bg-red-500 text-white px-3 py-1 rounded-md text-sm'
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Admin