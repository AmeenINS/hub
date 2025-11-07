'use client';

import { useEffect } from 'react';

/**
 * Custom hook to prevent body pointer events from being disabled
 * This prevents the page from freezing during theme or language changes
 */
export function usePreventPointerEventsDisable() {
  useEffect(() => {
    let animationFrame: number;
    
    const checkAndFixPointerEvents = () => {
      // Check if pointer events are disabled on body
      if (document.body.style.pointerEvents === 'none') {
        // Re-enable pointer events immediately
        document.body.style.pointerEvents = '';
      }
      
      // Continue checking
      animationFrame = requestAnimationFrame(checkAndFixPointerEvents);
    };
    
    // Start checking
    animationFrame = requestAnimationFrame(checkAndFixPointerEvents);
    
    // Also listen for style changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'style' && 
            mutation.target === document.body) {
          const body = mutation.target as HTMLElement;
          if (body.style.pointerEvents === 'none') {
            body.style.pointerEvents = '';
          }
        }
      });
    });
    
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style']
    });
    
    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      // Ensure pointer events are enabled on cleanup
      document.body.style.pointerEvents = '';
    };
  }, []);
}