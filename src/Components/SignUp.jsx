import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { authService } from '../services/authService';
import { loginSuccess, setLoading } from '../Store/authSlice';

export default function SignUp({ isOpen, onClose }) {
  const [step, setStep] = useState('signup'); // 'signup' or 'verify'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: ''
  });
  
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  const handleClose = (e) => {
    // Prevent modal closing during verification
    if (step === 'verify') {
      e?.preventDefault();
      e?.stopPropagation();
      toast.error('Please complete email verification first');
      return;
    }
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      otp: ''
    });
    setStep('signup');
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    dispatch(setLoading(true));
    
    try {
      await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      toast.success('Registration successful! Please verify your email.');
      setStep('verify');
    } catch (error) {
      toast.error(error || 'Registration failed');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    dispatch(setLoading(true));
    
    try {
      const response = await authService.verifyEmail({
        email: formData.email,
        otp: formData.otp
      });
      dispatch(loginSuccess(response));
      toast.success('Email verified successfully!');
      resetForm();
      onClose();
    } catch (error) {
      toast.error(error || 'Verification failed');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleResendOTP = async () => {
    try {
      await authService.resendVerificationOTP({ email: formData.email });
      toast.success('OTP resent successfully!');
    } catch (error) {
      toast.error(error || 'Failed to resend OTP');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
            onClick={handleClose}
            className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 ${step === 'verify' ? 'pointer-events-none' : ''}`}
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
              <div className="flex justify-between items-center mb-8">
                <div className="text-center flex-1">
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">
                    {step === 'signup' ? 'Create Account' : 'Verify Email'}
                  </h2>
                  <p className="text-gray-600">
                    {step === 'signup' 
                      ? 'Please fill in your details' 
                      : 'Enter the verification code sent to your email'}
                  </p>
                </div>
                {step === 'signup' && (
                  <button
                    onClick={handleClose}
                    className="text-gray-500 hover:text-gray-700 p-2"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <form onSubmit={step === 'signup' ? handleSignUp : handleVerifyOTP} className="space-y-6">
                {step === 'signup' ? (
                  <>
                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      className="relative"
                    >
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Full Name"
                        className="w-full px-4 py-3 bg-white/40 rounded-lg outline-none border border-white/40 focus:border-blue-500 transition-all duration-300 placeholder:text-gray-500"
                        required
                      />
                    </motion.div>

                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      className="relative"
                    >
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email"
                        className="w-full px-4 py-3 bg-white/40 rounded-lg outline-none border border-white/40 focus:border-blue-500 transition-all duration-300 placeholder:text-gray-500"
                        required
                      />
                    </motion.div>

                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      className="relative"
                    >
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Password"
                        className="w-full px-4 py-3 bg-white/40 rounded-lg outline-none border border-white/40 focus:border-blue-500 transition-all duration-300 placeholder:text-gray-500"
                        required
                      />
                    </motion.div>

                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      className="relative"
                    >
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm Password"
                        className="w-full px-4 py-3 bg-white/40 rounded-lg outline-none border border-white/40 focus:border-blue-500 transition-all duration-300 placeholder:text-gray-500"
                        required
                      />
                    </motion.div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center text-gray-600 mb-4">
                      <p>We've sent a verification code to:</p>
                      <p className="font-semibold text-gray-800">{formData.email}</p>
                    </div>
                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      className="relative"
                    >
                      <input
                        type="text"
                        name="otp"
                        value={formData.otp}
                        onChange={handleChange}
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
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 disabled:opacity-50"
                >
                  {loading 
                    ? (step === 'signup' ? 'Creating Account...' : 'Verifying...') 
                    : (step === 'signup' ? 'Sign Up' : 'Verify Email')}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 