import React, { useRef, useEffect, useState } from 'react';
import '../styles/CustomCursor.css';

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setTargetPos({ x: e.clientX, y: e.clientY });

      // Check for hover on interactive elements
      const element = document.elementFromPoint(e.clientX, e.clientY);
      const isInteractive = 
        element?.tagName === 'BUTTON' ||
        element?.tagName === 'A' ||
        element?.classList.contains('interactive') ||
        element?.closest('button') ||
        element?.closest('a') ||
        element?.closest('[role="button"]');
      
      setIsActive(isInteractive);
    };

    const handleMouseEnter = () => {
      if (cursorRef.current) {
        cursorRef.current.style.opacity = '1';
      }
    };

    const handleMouseLeave = () => {
      if (cursorRef.current) {
        cursorRef.current.style.opacity = '0';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Smooth animation loop for cursor trailing
  useEffect(() => {
    const animationFrameId = requestAnimationFrame(function animate() {
      setPosition((prev) => ({
        x: prev.x + (targetPos.x - prev.x) * 0.5,
        y: prev.y + (targetPos.y - prev.y) * 0.5,
      }));
      requestAnimationFrame(animate);
    });

    return () => cancelAnimationFrame(animationFrameId);
  }, [targetPos]);

  // Update cursor position and transform
  useEffect(() => {
    if (cursorRef.current) {
      cursorRef.current.style.transform = `translate(${position.x}px, ${position.y}px)`;
    }
  }, [position]);

  return (
    <>
      {/* Hide default cursor */}
      <style>{`
        * {
          cursor: none !important;
        }
      `}</style>

      {/* Custom cursor container */}
      <div
        ref={cursorRef}
        className={`custom-cursor ${isActive ? 'active' : ''}`}
      >
        {/* Outer glow ring */}
        <div className="cursor-ring"></div>
        
        {/* Inner dot */}
        <div className="cursor-dot"></div>
        
        {/* Magnetic particles (optional for extra effect) */}
        <div className="cursor-particles">
          {isActive && (
            <>
              <div className="particle"></div>
              <div className="particle"></div>
              <div className="particle"></div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
