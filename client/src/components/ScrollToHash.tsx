import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToHash: React.FC = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const targetId = hash.replace('#', '');
      const executeScroll = () => {
        const el = document.getElementById(targetId);
        if (el) {
          const navbarHeight = 80;
          const rect = el.getBoundingClientRect();
          const targetY = window.pageYOffset + rect.top - navbarHeight;
          window.scrollTo({
            top: targetY > 0 ? targetY : 0,
            behavior: 'smooth',
          });
          return true;
        }
        return false;
      };

      // Try immediately
      if (!executeScroll()) {
        // Retry after short delay for dynamically rendered sections
        const timeout = setTimeout(executeScroll, 150);
        return () => clearTimeout(timeout);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pathname, hash]);

  return null;
};
