import { useState, useEffect } from 'react';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      // Check user agent
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent.toLowerCase()
      );

      // Check screen width (common breakpoint for mobile is 768px)
      const isMobileScreen = window.innerWidth < 768;

      setIsMobile(isMobileUserAgent || isMobileScreen);
    };

    // Check on mount
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  return isMobile;
};

export default useIsMobile;