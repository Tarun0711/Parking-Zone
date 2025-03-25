import React, { useEffect, useState } from 'react'
import axios from 'axios'; // Make sure to import axios
import { useSelector } from 'react-redux';

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
        totalSlots: ''
    });
    const { token } = useSelector((state) => state.auth);

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
        } catch (error) {
            console.error('Error fetching parking sessions:', error);
        } finally {
            setLoading(false);
        }
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
            await axios.post('http://localhost:5000/api/blocks/', blockData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setIsModalOpen(false);
            setBlockData({
                blockName: '',
                blockDescription: '',
                floor: '',
                totalSlots: ''
            });
        } catch (error) {
            console.error('Error creating parking block:', error);
        }
    };

    useEffect(() => {
        fetchParkingSessions();
    }, []);

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
                            Total Revenue
                            
                        </h2>
                    </div>
                    
                </div>
            </div>
            
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
                                                    ${session.amount}
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