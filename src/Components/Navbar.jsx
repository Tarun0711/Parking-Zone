import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout, setUser } from "../Store/authSlice";
import {
  openLoginModal,
  openSignUpModal,
  closeLoginModal,
  closeSignUpModal,
} from "../Store/modalSlice";
import { authService } from "../services/authService";
import Login from "./Login";
import LogoutIcon from '@mui/icons-material/Logout';  
import SignUp from "./SignUp";
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const links = [
  {
    name: "Home",
    path: "/",
  },
  {
    name: "About",
    path: "#about",
  },
  {
    name: "Pricing",
    path: "#pricing",
  },
];

function Navbar({ onAboutClick, onPricingClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { isLoginModalOpen, isSignUpModalOpen } = useSelector(
    (state) => state.modal
  );
  const dispatch = useDispatch();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLinkClick = (linkName) => {
    setIsOpen(false);
    if (linkName === "About") {
      const aboutSection = document.getElementById('about');
      aboutSection?.scrollIntoView({ behavior: 'smooth' });
    } else if (linkName === "Pricing") {
      const pricingSection = document.getElementById('pricing');
      pricingSection?.scrollIntoView({ behavior: 'smooth' });
    } else if (linkName === "Home") {
      const homeSection = document.getElementById('home');
      homeSection?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openSignUp = () => {
    dispatch(openSignUpModal());
    setIsOpen(false);
  };

  const openLogin = () => {
    dispatch(openLoginModal());
    setIsOpen(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("token");
  };

  return (
    <>
      <div className="flex justify-between min-h-16 items-center p-4 fixed top-4 border rounded-full left-0 right-0 z-10 md:w-[80%] w-[90%] navbar md:mx-auto mx-auto bg-white">
        <Link to="/" className="text-2xl font-bold font-serif">
          Parking Zone
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-4 items-center">
          {links.map((link, index) => (
            <button
              key={index}
              onClick={() => handleLinkClick(link.name)}
              className="hover:text-blue-500 transition-all duration-300 hover:scale-105"
            >
              {link.name}
            </button>
          ))}
          {isAuthenticated && (
            <>
            <Link
              to="/bookings"
              className="hover:text-blue-500 transition-all duration-300 hover:scale-105"
            >
              <span className="mr-2">🎫</span>
              Your Bookings
            </Link>
            {
              user?.role === 'admin' && (
                <Link
                to='/admin-panel'
                className="hover:text-blue-500 transition-all duration-300 hover:scale-105"
                >
                Admin Panel <AdminPanelSettingsIcon />
                </Link>
              )
            }
            </>
          )}
          {!isAuthenticated ? (
            <>
              <button
                onClick={openLogin}
                className="bg-blue-500 text-white px-4 py-2 rounded-3xl hover:bg-blue-600 transition-all duration-300"
              >
                Login
              </button>
              <button
                onClick={openSignUp}
                className="text-blue-600 border border-blue-600 px-4 py-2 rounded-3xl hover:scale-105 transition-all duration-300"
              >
                Register
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4">
            
        <button
          onClick={() => {
            handleLogout();
          }}
          className="text-xl text-red-600 shadow-sm bg-gray-200 rounded-xl p-1 hover:text-red-700 transition-all duration-300"
        >
           <LogoutIcon />
        </button>
     
             
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            className="flex flex-col gap-1.5 p-2 z-20"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span
              className={`block w-6 h-0.5 bg-black transition-all duration-300 ${
                isOpen ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-black transition-all duration-300 ${
                isOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-black transition-all duration-300 ${
                isOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 left-0 w-full h-screen bg-white z-[5] transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-y-0" : "-translate-y-full"
        } md:hidden`}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {links.map((link, index) => (
            <button
              key={index}
              onClick={() => handleLinkClick(link.name)}
              className="text-xl hover:text-blue-500 transition-all duration-300"
            >
              {link.name}
            </button>
          ))}
          {isAuthenticated && (
            <>
            <Link
              to="/bookings"
              className="text-xl hover:text-blue-500 transition-all duration-300"
              onClick={() => setIsOpen(false)}
            >
              <span className="mr-2">🎫</span>
              Your Bookings
            </Link>
            {
              user?.role === 'admin' && (
                <Link
                to='/admin-panel'
                className="text-xl hover:text-blue-500 transition-all duration-300"
                onClick={() => setIsOpen(false)}
                >
                  Admin Panel <AdminPanelSettingsIcon />
                </Link>
              )
            }

            </>
          )}
          {!isAuthenticated ? (
            <div className="flex flex-col gap-4 mt-8">
              <button
                onClick={openLogin}
                className="bg-blue-500 text-white px-8 py-2 rounded-3xl hover:bg-blue-600 transition-all duration-300"
              >
                Login
              </button>
              <button
                onClick={openSignUp}
                className="text-blue-600 border border-blue-600 px-8 py-2 rounded-3xl hover:scale-105 transition-all duration-300"
              >
                Register
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 mt-8">
              <span className="text-xl text-blue-600">
                {user?.name || "User"}
              </span>
            </div>
          )}
        </div>
        
      </div>

      
      
      {/* Login Modal */}
      <Login
        isOpen={isLoginModalOpen}
        onClose={() => dispatch(closeLoginModal())}
      />

      {/* SignUp Modal */}
      <SignUp
        isOpen={isSignUpModalOpen}
        onClose={() => dispatch(closeSignUpModal())}
      />
    </>
  );
}

export default Navbar;
