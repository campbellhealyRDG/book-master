import React, { useState, useEffect } from 'react';

const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  // Show/hide button based on scroll position
  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when user has scrolled down 300px from the top
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Throttle scroll events for performance
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          toggleVisibility();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll to top function
  const scrollToTop = () => {
    setIsScrolling(true);

    const scrollStep = () => {
      if (window.pageYOffset === 0) {
        setIsScrolling(false);
        return;
      }
      window.scrollBy(0, -50); // Scroll up by 50px each step
      requestAnimationFrame(scrollStep);
    };

    requestAnimationFrame(scrollStep);
  };

  // Alternative smooth scroll using built-in behavior (more consistent)
  const scrollToTopSmooth = () => {
    setIsScrolling(true);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    // Reset scrolling state after animation completes
    setTimeout(() => {
      setIsScrolling(false);
    }, 1000);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTopSmooth}
      className={`
        fixed bottom-6 right-6 z-40
        w-12 h-12
        bg-chrome-green-600 hover:bg-chrome-green-700
        text-white
        rounded-full
        shadow-lg hover:shadow-xl
        transition-all duration-300
        flex items-center justify-center
        focus:outline-none focus:ring-2 focus:ring-chrome-green-300 focus:ring-offset-2
        transform hover:scale-110
        ${isScrolling ? 'animate-pulse' : ''}
        group
      `}
      title="Scroll to top"
      aria-label="Scroll to top of page"
    >
      {/* Up Arrow Icon */}
      <svg
        className={`
          w-6 h-6
          transition-transform duration-200
          ${isScrolling ? 'animate-bounce' : 'group-hover:-translate-y-0.5'}
        `}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>

      {/* Ripple effect on click */}
      <div className="absolute inset-0 rounded-full bg-white opacity-0 group-active:opacity-20 transition-opacity duration-150" />
    </button>
  );
};

export default ScrollToTopButton;