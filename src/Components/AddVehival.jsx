import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import styled from "@emotion/styled";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import IconButton from "@mui/material/IconButton";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import { openLoginModal } from "../Store/modalSlice";
import axios from "axios";
import toast from "react-hot-toast";

const VehicleTypeButton = styled(IconButton)(({ selected }) => ({
  border: "2px solid",
  borderColor: selected ? "#1976d2" : "#ddd",
  borderRadius: "12px",
  padding: "15px",
  margin: "10px",
  transition: "all 0.3s ease",
  "&:hover": {
    borderColor: "#1976d2",
  },
}));


function AddVehival() {
  const [formData, setFormData] = useState({
    licensePlate: "",
    vehicleType: "",
    make: "",
    isRegular: false,
  });
  const [error, setError] = useState("");
  const { isAuthenticated, user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const validateLicensePlate = (plate) => {
    // Format: XX 12 X 1234
    const plateRegex = /^[A-Z]{2}\s\d{2}\s[A-Z]\s\d{4}$/;
    return plateRegex.test(plate);
  };

  const handleVehicleTypeSelect = (type) => {
    setFormData((prev) => ({
      ...prev,
      vehicleType: type,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "licensePlate") {
      // Remove all spaces and convert to uppercase
      let formattedValue = value.replace(/\s/g, '').toUpperCase();
      
      // Validate and format each character based on position
      let result = '';
      for (let i = 0; i < formattedValue.length; i++) {
        const char = formattedValue[i];
        
        // First two positions (0,1) - only letters
        if (i < 2) {
          if (/[A-Z]/.test(char)) {
            result += char;
          }
        }
        // Next two positions (2,3) - only numbers
        else if (i < 4) {
          if (/[0-9]/.test(char)) {
            result += char;
          }
        }
        // Next position (4) - only letter
        else if (i < 5) {
          if (/[A-Z]/.test(char)) {
            result += char;
          }
        }
        // Last four positions (5,6,7,8) - only numbers
        else if (i < 9) {
          if (/[0-9]/.test(char)) {
            result += char;
          }
        }
      }
      
      // Add spaces in the correct positions
      if (result.length > 0) {
        let formattedResult = '';
        // First two letters
        formattedResult += result.slice(0, 2);
        if (result.length > 2) {
          formattedResult += ' ' + result.slice(2, 4); // Two digits
          if (result.length > 4) {
            formattedResult += ' ' + result.slice(4, 5); // One letter
            if (result.length > 5) {
              formattedResult += ' ' + result.slice(5, 9); // Four digits
            }
          }
        }
        result = formattedResult;
      }

      setFormData((prev) => ({
        ...prev,
        [name]: result,
      }));
    } else if (name === "make") {
      // Only allow letters and spaces for company name
      const formattedValue = value.replace(/[^A-Za-z\s]/g, '');
      setFormData((prev) => ({
        ...prev,
        [name]: formattedValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isAuthenticated) {
      dispatch(openLoginModal());
      return;
    }

    if (!formData.vehicleType || !formData.licensePlate || !formData.make) {
      setError("Please fill in all required fields");
      return;
    }

    if (!validateLicensePlate(formData.licensePlate)) {
      setError("Invalid license plate format. Please use format: XX 12 X 1234");
      return;
    }

    try {
      const vehicleData = {
        ...formData,
        owner: user.id
      };

      const response = await axios.post(`http://localhost:5000/api/vehicles`, vehicleData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success('Vehicle registered successfully!');
      // Reset form after successful submission
      setFormData({
        licensePlate: "",
        vehicleType: "",
        make: "",
        isRegular: false,
      });
    } catch (error) {
      setError(error.response?.data?.message || "Error registering vehicle");
      console.error('Error registering vehicle:', error);
    }
  };

  return (
    <div className="flex flex-col items-start justify-center h-auto p-4 ">
      <h1 className="text-xl font-semibold text-start">
        Add Your <span className="text-blue-500">Vehicle</span>
      </h1>
      {error && (
        <div className="w-full p-3 my-3 text-sm text-red-500 bg-red-50 rounded-lg">
          {error}
        </div>
      )}
      <div className="flex flex-col gap-4 items-start justify-start">
        <p className="text-sm text-gray-500 mt-4">Select Vehicle Type</p>
        <div className="flex gap-4">
          <VehicleTypeButton
            selected={formData.vehicleType === "motorcycle"}
            onClick={() => handleVehicleTypeSelect("motorcycle")}
          >
            <TwoWheelerIcon sx={{ fontSize: 20 }} />
          </VehicleTypeButton>
          <VehicleTypeButton
            selected={formData.vehicleType === "car"}
            onClick={() => handleVehicleTypeSelect("car")}
          >
            <DirectionsCarIcon sx={{ fontSize: 20 }} />
          </VehicleTypeButton>
          <VehicleTypeButton
            selected={formData.vehicleType === "truck"}
            onClick={() => handleVehicleTypeSelect("truck")}
          >
            <LocalShippingIcon sx={{ fontSize: 20 }} />
          </VehicleTypeButton>
        </div>
        <p className="text-sm text-gray-500 ">Enter Vehicle Details</p>
        <div className="flex gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="licensePlate"
              className="text-sm -my-1 text-gray-500"
            >
              Number Plate
            </label>
            <input
              type="text"
              name="licensePlate"
              value={formData.licensePlate}
              onChange={handleInputChange}
              placeholder="Number Plate"
              className="w-full p-2 bg-transparent focus:outline-blue-500 rounded-lg border border-gray-300"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="make" className="text-sm -my-1 text-gray-500">
              Company Name
            </label>
            <input
              type="text"
              name="make"
              value={formData.make}
              onChange={handleInputChange}
              placeholder="Company Name"
              className="w-full p-2 bg-transparent focus:outline-blue-500 rounded-lg border border-gray-300"
            />
          </div>
        </div>
        <div className="mt-4">
          <FormControlLabel
            control={
              <Switch
                checked={formData.isRegular}
                onChange={(e) => setFormData(prev => ({ ...prev, isRegular: e.target.checked }))}
                color="primary"
              />
            }
            className="text-sm text-gray-500"
            label="Regular Vehicle"
          />
        </div>
        <button
          onClick={handleSubmit}
          className="w-full mt-6 py-3 px-6 rounded-lg text-white font-medium
          bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
          transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
          shadow-md hover:shadow-lg"
        >
          {isAuthenticated ? 'Add Vehicle' : 'Login to Add Vehicle'}
        </button>
      </div>
    </div>
  );
}

export default AddVehival;
