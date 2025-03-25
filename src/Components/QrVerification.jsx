import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import {toast} from 'react-hot-toast';

function QrVerification() {
  const [showScanner, setShowScanner] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAnimation, setShowAnimation] = useState(false);
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
        'http://localhost:5000/api/parking-sessions/verify-qr',
        { qrCode, action: 'entry' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // First close the scanner modal
      setShowScanner(false);
      
      toast.success(response.data.message);
      // Wait a brief moment before showing the success animation
      setTimeout(() => {
        setSuccess(response.data.message);
        setShowAnimation(true);
        
        // Hide the animation after 3 seconds
        setTimeout(() => {
          setSuccess(null);
          setShowAnimation(false);
        }, 3000);
      }, 300); // 300ms delay before showing animation
    } catch (err) {
      // setError(err.response?.data?.message || 'Error verifying QR code');
      setShowScanner(false);
      toast.error(err.response?.data?.message || 'Error verifying QR code');

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

      {showAnimation && (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
          <div className="success-animation">
            <div className="checkmark">
              <svg className="checkmark-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
              </svg>
            </div>
            <div className="success-text">{success}</div>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowScanner(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
      >
        Verify QR Code
      </button>

      <style jsx>{`
        .success-animation {
          text-align: center;
        }

        .checkmark {
          width: 80px;
          height: 80px;
          margin: 0 auto;
          animation: scale-in 0.5s ease-out;
        }

        .checkmark-circle {
          stroke: #4CAF50;
          stroke-width: 2;
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }

        .checkmark-check {
          stroke: #4CAF50;
          stroke-width: 2;
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards;
        }

        .success-text {
          margin-top: 20px;
          color: #4CAF50;
          font-size: 1.2rem;
          font-weight: bold;
          animation: fade-in 0.5s ease-out;
        }

        @keyframes stroke {
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

export default QrVerification;
