import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Box, Container, Typography, Card, CardContent, Grid, CircularProgress } from '@mui/material';
import { fetchParkingRates } from '../Store/parkingRatesSlice';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.8,
      staggerChildren: 0.3,
      ease: "easeOut"
    }
  }
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8, 
    y: 50 
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { 
      duration: 0.6,
      ease: "easeOut"
    }
  },
  hover: {
    scale: 1.03,
    y: -8,
    transition: {
      duration: 0.4,
      ease: "easeInOut"
    }
  }
};

const titleVariants = {
  hidden: { 
    opacity: 0, 
    y: -30 
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut"
    }
  }
};

function Pricing() {
  const dispatch = useDispatch();
  const { rates, loading, error } = useSelector((state) => state.parkingRates);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    dispatch(fetchParkingRates());
  }, [dispatch]);

  console.log('Rates state:', { rates, loading, error });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress sx={{ color: '#2972B6' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography color="error">Error loading parking rates: {error}</Typography>
      </Box>
    );
  }

  const getCardStyle = (type) => {
    switch (type) {
      case 'VVIP':
        return {
          background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
          color: '#831843',
          border: '1px solid rgba(219, 39, 119, 0.1)',
        };
      case 'VIP':
        return {
          background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
          color: '#1E40AF',
          border: '1px solid rgba(59, 130, 246, 0.1)',
        };
      default:
        return {
          background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
          color: '#334155',
          border: '1px solid rgba(148, 163, 184, 0.1)',
        };
    }
  };

  return (
    <Box sx={{ background: 'linear-gradient(180deg, #ffffff 0%, #c2cad6 100%)', minHeight: '100vh' }}>
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)',
          transformOrigin: '0%',
          scaleX,
          zIndex: 1000
        }}
      />
      <Container maxWidth="lg" sx={{ py: 12 }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
        >
          <motion.div variants={titleVariants}>
            <Typography
              component="h1"
              textAlign="center"
              mb={8}
              sx={{
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                fontWeight: '700',
                color: '#1E293B',
                textShadow: '0px 2px 4px rgba(0, 0, 0, 0.06)',
                letterSpacing: '-0.02em'
              }}
            >
              Parking Rates
            </Typography>
          </motion.div>

          <Grid container spacing={4} justifyContent="center">
            {Array.isArray(rates) && rates.map((rate, index) => (
              <Grid item xs={12} sm={6} md={4} key={rate._id}>
                <motion.div 
                  variants={cardVariants}
                  whileHover="hover"
                  custom={index}
                >
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '16px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0px 4px 20px rgba(148, 163, 184, 0.1)',
                      overflow: 'hidden',
                      ...getCardStyle(rate.type)
                    }}
                  >
                    <CardContent sx={{ 
                      flexGrow: 1, 
                      textAlign: 'center',
                      p: 4,
                      position: 'relative'
                    }}>
                      <Typography
                        gutterBottom
                        variant="h5"
                        component="h2"
                        sx={{
                          fontWeight: '600',
                          mb: 3,
                          position: 'relative',
                          display: 'inline-block',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: '-8px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '40px',
                            height: '2px',
                            background: 'currentColor',
                            opacity: 0.3
                          }
                        }}
                      >
                        {rate.type}
                      </Typography>
                      <Typography
                        variant="h3"
                        sx={{
                          my: 4,
                          fontWeight: '700',
                          letterSpacing: '-0.02em'
                        }}
                      >
                        ₹{rate.hourlyRate}
                        <Typography 
                          component="span" 
                          sx={{ 
                            fontSize: '1rem',
                            opacity: 0.7,
                            ml: 1
                          }}
                        >
                          /hr
                        </Typography>
                      </Typography>
                      <Typography
                        sx={{
                          opacity: 0.85,
                          fontSize: '1rem',
                          lineHeight: 1.6
                        }}
                      >
                        {rate.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
}

export default Pricing;