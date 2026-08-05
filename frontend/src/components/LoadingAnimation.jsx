import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import footballAnimation from './football-loader.json';

const LoadingAnimation = () => {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d === 3 ? 0 : d + 1);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="modal-backdrop" style={{ zIndex: 1000 }} />
      <div className="loading-spinner-overlay" style={{ zIndex: 1001 }}>
        <div style={{ width: 200, height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Lottie 
            animationData={footballAnimation} 
            loop={true} 
            autoplay={true}
            style={{ width: 200, height: 200, display: 'block' }}
          />
        </div>
        <p style={{ marginTop: '10px', color: 'white', fontWeight: 'bold', fontSize: '1.2em' }}>
          {'Loading' + '.'.repeat(dots)}
        </p>
      </div>
    </>
  );
};

export default LoadingAnimation;