import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Container } from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import QrCodeIcon from '@mui/icons-material/QrCode';
import { useInView } from 'react-intersection-observer';

function HowItWorks() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const steps = [
    {
      icon: <DirectionsCarIcon sx={{ fontSize: 40 }} />,
      title: 'Add Vehicle',
      description: 'Register your vehicle details in our secure system'
    },
    {
      icon: <LocalParkingIcon sx={{ fontSize: 40 }} />,
      title: 'Choose Parking Slot',
      description: 'Select from available parking spots in real-time'
    },
    {
      icon: <QrCodeIcon sx={{ fontSize: 40 }} />,
      title: 'Get QR Code',
      description: 'Receive your unique QR code for seamless parking access'
    }
  ];

  return (
    <Container ref={ref} maxWidth="lg" sx={{ py: 8 }}>
      <Typography
        variant="h2"
        component="h2"
        textAlign="center"
        mb={6}
        sx={{
          fontSize: { xs: '2rem', md: '3rem' },
          fontWeight: 'bold',
          color: '#1a237e'
        }}
      >
        How It Works
      </Typography>

      <Box
        ref={ref}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          px: 4,
          '&::after': {
            content: '""',
            position: 'absolute',
            width: '100%',
            height: '2px',
            background: 'repeating-linear-gradient(90deg, #1a237e 0, #1a237e 6px, transparent 6px, transparent 12px)',
            top: '25%',
            left: 0,
            zIndex: 0
          }
        }}
      >
        <motion.div
          className="progress-bar"
          initial={{ width: 0 }}
          animate={inView ? { width: '100%' } : { width: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          style={{
            position: 'absolute',
            height: '2px',
            background: '#1a237e',
            top: '25%',
            left: 0,
            zIndex: 0
          }}
        />
        
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: index * 0.5 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '200px',
              zIndex: 1
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={inView ? { scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.5 }}
              style={{
                background: '#1a237e',
                borderRadius: '50%',
                width: '80px',
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                color: 'white',
                position: 'relative',
                zIndex: 2
              }}
            >
              {step.icon}
            </motion.div>
            <Typography
              variant="h6"
              component="h3"
              textAlign="center"
              sx={{ fontWeight: 'bold', mb: 1 }}
            >
              {step.title}
            </Typography>
            <Typography
              variant="body1"
              textAlign="center"
              sx={{ color: 'text.secondary' }}
            >
              {step.description}
            </Typography>
          </motion.div>
        ))}
      </Box>
    </Container>
  );
}

export default HowItWorks;