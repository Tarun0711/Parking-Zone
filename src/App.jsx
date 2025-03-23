import React from "react";
import "./App.css";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./Pages/Dashboard";
import Navbar from "./Components/Navbar";
import Bookings from "./Pages/Bookings";
import Transactions from "./Pages/Transactions";
import PrivateRoute from "./Components/PrivateRoute";
import { useSelector } from "react-redux";
import Admin from "./Pages/Admin";
import QrVerification from "./Components/QrVerification";
function App() {
  const user = useSelector((state) => state.auth.user);
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/bookings" element={
          <PrivateRoute>
            <Bookings />
          </PrivateRoute>
        } />
        <Route path="/transactions" element={
          <PrivateRoute>
            <Transactions />
          </PrivateRoute>
        } />
        {
          user?.role === 'admin' && (
            <Route path="/admin-panel" element={
              <PrivateRoute>
                <Admin />
              </PrivateRoute>
            } />
          )
        }

   
      </Routes>
      {
        user?.role === 'admin' && (
          <QrVerification />
        )
      }
    </>
  );
}

export default App;
