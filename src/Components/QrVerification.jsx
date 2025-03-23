import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import axios from 'axios';

function QrVerification() {
  const [showScanner, setShowScanner] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Check if user is admin (you'll need to implement this based on your auth system)
  const isAdmin = true; // Replace with actual admin check

  const handleScan = async (result, error) => {
    if (error) {
      console.warn(`QR Code scanning failed: ${error}`);
      return;
    }

    if (result) {
      try {
        const response = await axios.post('/api/parking-sessions/verify-qr', {
          qrCode: result.text,
          action: 'entry' // Will be dynamically determined by the backend
        });
        
        setSuccess(response.data.message);
        setShowScanner(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Error verifying QR code');
      }
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Scan QR Code</h2>
            <QrReader
              onResult={handleScan}
              constraints={{ facingMode: 'environment' }}
              className="w-full"
            />
            <button
              onClick={() => setShowScanner(false)}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded">
          {success}
        </div>
      )}

      <button
        onClick={() => {
          setShowScanner(true);
        }}
        className="fixed bottom-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
      >
        Verify QR Code
      </button>
    </>
  );
}

export default QrVerification;