import React, { useRef } from 'react'
import Navbar from '../Components/Navbar'
import Home from '../Components/Home'
import HowItWorks from '../Components/HowItWorks'
import Pricing from '../Components/Pricing'

function Dashboard() {
  const howItWorksRef = useRef(null);
  const pricingRef = useRef(null);

  const scrollToSection = (sectionRef) => {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className='w-full h-auto overflow-auto bg-white'>
        <Navbar onAboutClick={() => scrollToSection(howItWorksRef)} onPricingClick={() => scrollToSection(pricingRef)} />
        <Home />
        <div id="about" ref={howItWorksRef}>
          <HowItWorks />
        </div>
        <div id="pricing" ref={pricingRef}>
          <Pricing />
        </div>
    </div>
  )
}

export default Dashboard