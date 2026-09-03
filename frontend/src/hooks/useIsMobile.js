import { useState, useEffect } from 'react';

const checkMobileSync = () => {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor || window.opera || '';
  const isMobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent.toLowerCase()
  );
  const isMobileScreen = window.innerWidth < 768;
  return isMobileUserAgent || isMobileScreen;
};

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(checkMobileSync);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(checkMobileSync());
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  return isMobile;
};

export default useIsMobile;