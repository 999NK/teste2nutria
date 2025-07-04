import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

export function usePageTransition() {
  const [isLoading, setIsLoading] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100); // Short loading state for smooth transitions

    return () => clearTimeout(timer);
  }, [location]);

  return isLoading;
}