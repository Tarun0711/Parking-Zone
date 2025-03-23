import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { authService } from '../services/authService';
import { loginSuccess, setLoading } from '../Store/authSlice';

export default function EmailVerificationModal({ isOpen, onClose, email, onVerificationSuccess }) {
  const [otp, setOtp] = useState('');
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isOpen) {
      handleResendOTP();
    }
  }, [isOpen]);

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    dispatch(setLoading(true));
    
    try {
      const response = await authService.verifyEmail({
        email,
        otp
      });
      dispatch(loginSuccess(response));
      toast.success('Email verified successfully!');
      setOtp('');
      onVerificationSuccess();
    } catch (error) {
      toast.error(error || 'Verification failed');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleResendOTP = async () => {
    try {
      await authService.resendVerificationOTP({ email });
      toast.success('OTP sent to your email');
    } catch (error) {
      toast.error(error || 'Failed to send OTP');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 pointer-events-none"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-1/4 left-0 right-0 mx-auto w-[90%] max-w-md mb-4 z-50"
          >
            <div className="bg-white/30 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/20">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Verify Email</h2>
                <p className="text-gray-600">Enter the verification code sent to your email</p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="space-y-4">
                  <div className="text-center text-gray-600 mb-4">
                    <p>We've sent a verification code to:</p>
                    <p className="font-semibold text-gray-800">{email}</p>
                  </div>
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    className="relative"
                  >
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter OTP"
                      className="w-full px-4 py-3 bg-white/40 rounded-lg outline-none border border-white/40 focus:border-blue-500 transition-all duration-300 placeholder:text-gray-500"
                      required
                    />
                  </motion.div>
                  
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    className="text-blue-600 hover:underline text-sm w-full text-center"
                  >
                    Resend OTP
                  </button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 