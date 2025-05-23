import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { authService } from '../services/authService';
import { loginSuccess, setLoading } from '../Store/authSlice';
import EmailVerificationModal from './EmailVerificationModal';

export default function Login({ isOpen, onClose }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showVerification, setShowVerification] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); // <-- Error message state

  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  const resetForm = () => {
    setFormData({ email: '', password: '' });
    setErrorMessage(''); // Clear error on reset
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(setLoading(true));
    setErrorMessage(''); // Reset error before making request

    try {
      const response = await authService.login(formData);
      dispatch(loginSuccess(response));
      toast.success('Successfully logged in!');
      resetForm();
      onClose();
    } catch (error) {
      const errorMsg = error.error || error.message;
      if (errorMsg.includes('Please verify your email')) {
        setShowVerification(true);
      } else if (errorMsg.includes('Invalid credentials')) {
        setErrorMessage('Invalid email or password.');
        toast.error('Invalid email or password');
      } else if (errorMsg.includes('User not found')) {
        setErrorMessage('User not found.');
        toast.error('User not found');
      } else {
        setErrorMessage(errorMsg || 'Login failed.');
        toast.error(errorMsg || 'Login failed');
      }
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
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
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
                    <p className="text-gray-600">Please sign in to continue</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 p-2"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <motion.div whileTap={{ scale: 0.98 }} className="relative">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        autoComplete="off"
                        placeholder="Email"
                        className="w-full px-4 py-3 bg-white/40 rounded-lg outline-none border border-white/40 focus:border-blue-500 transition-all duration-300 placeholder:text-gray-500"
                        required
                      />
                    </motion.div>
                  </div>

                  <div className="space-y-2">
                    <motion.div whileTap={{ scale: 0.98 }} className="relative">
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        autoComplete="off"
                        placeholder="Password"
                        className="w-full px-4 py-3 bg-white/40 rounded-lg outline-none border border-white/40 focus:border-blue-500 transition-all duration-300 placeholder:text-gray-500"
                        required
                      />
                    </motion.div>
                  </div>

                  

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 disabled:opacity-50"
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </motion.button>

                  <div className="text-center text-sm">
                    {/* Error Message */}
                  {errorMessage && (
                    <div
                      className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm"
                    >
                      {errorMessage}
                    </div>
                  )}
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={showVerification}
        onClose={() => setShowVerification(false)}
        email={formData.email}
        onVerificationSuccess={async () => {
          setShowVerification(false);
          dispatch(setLoading(true));
          setErrorMessage(''); // Clear error before retry

          try {
            const response = await authService.login(formData);
            dispatch(loginSuccess(response));
            toast.success('Successfully logged in!');
            resetForm();
            onClose();
          } catch (error) {
            const errorMsg = error.error || error.message;
            setErrorMessage(errorMsg || 'Login failed.');
            toast.error(errorMsg || 'Login failed');
          } finally {
            dispatch(setLoading(false));
          }
        }}
      />
    </>
  );
}
