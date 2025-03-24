import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';

function QrVerification() {
  const [showScanner, setShowScanner] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const scannerRef = useRef(null);
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (showScanner) {
      startScanner();
    }
    return () => stopScanner();
  }, [showScanner]);

  const startScanner = () => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner('qr-reader', {
        fps: 10,
        qrbox: 250,
      });

      scannerRef.current.render(
        async (decodedText) => {
          stopScanner();
          await verifyQrCode(decodedText);
        },
        (errorMessage) => {
          console.warn('QR Code scanning error:', errorMessage);
        }
      );
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
  };

  const verifyQrCode = async (qrCode) => {
    try {
      const response = await axios.post(
        'https://parking-zone-backend.onrender.com/api/parking-sessions/verify-qr',
        { qrCode, action: 'entry' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(response.data.message);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error verifying QR code');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <>
      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Scan QR Code</h2>
            <div id="qr-reader" className="w-full"></div>
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
        onClick={() => setShowScanner(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
      >
        Verify QR Code
      </button>
    </>
  );
}

export default QrVerification;
