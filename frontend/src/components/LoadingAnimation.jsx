import React from 'react';
import Lottie from 'lottie-react';
import footballAnimation from './football-loader.json';

const LoadingAnimation = ({ message }) => {
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
        {message && (
          <p style={{ marginTop: '10px', color: 'white', fontWeight: 'bold', fontSize: '1.2em' }}>
            {message}
          </p>
        )}
      </div>
    </>
  );
};

export default LoadingAnimation;