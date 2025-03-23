import React from "react";
import AddVehival from "./AddVehival";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";

function Home() {
  const [heroRef, heroInView] = useInView({
    triggerOnce: true,
    threshold: 0.2
  });

  const [formRef, formInView] = useInView({
    triggerOnce: true,
    threshold: 0.2
  });

  return (
    <div className="relative min-h-screen bg-gradient-to-br overflow-hidden from-gray-50 to-gray-100">
      {/* Background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-400/20 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-15%] right-[-15%] w-[600px] h-[600px] rounded-full bg-pink-400/20 blur-3xl animate-pulse"></div>
      <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] rounded-full bg-purple-400/20 blur-3xl animate-pulse"></div>

      {/* Content wrapper */}
      <div className="relative w-full min-h-screen flex items-center justify-center backdrop-blur-sm">
        <main className="container mx-auto px-4 py-20 md:py-12">
          <div className="flex flex-col md:flex-row items-center justify-center gap-12 max-w-7xl mx-auto">
            {/* Hero Content */}
            <motion.div
              ref={heroRef}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: heroInView ? 1 : 0, x: heroInView ? 0 : -50 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col items-center md:items-start justify-center w-full md:w-1/2 space-y-8"
            >
              <h1 className="text-4xl md:text-6xl font-bold text-gray-800 leading-tight text-center md:text-left">
                Welcome to{" "}
                <span className="text-blue-600 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-700">
                  Parking Zone
                </span>
              </h1>
              <p className="text-lg md:text-2xl text-gray-600 leading-relaxed text-center md:text-left">
                Parking Zone is a platform that allows you to park your car in a
                safe and secure way. We provide a QR code for you to scan and
                park your car.
              </p>
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Get Started
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200"
                >
                  Learn More
                </motion.button>
              </div>
            </motion.div>

            {/* Form Section */}
            <motion.div
              ref={formRef}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: formInView ? 1 : 0, x: formInView ? 0 : 50 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="w-full md:w-1/2 max-w-xl"
            >
              <div className="navbar mx-auto backdrop-blur-md bg-white/70 rounded-2xl shadow-xl p-4 hover:shadow-2xl transition-all duration-200 transform">
                <AddVehival />
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Home;
