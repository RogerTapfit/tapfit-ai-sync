import React, { useState, useEffect, useRef } from 'react';

interface AnimatedNumberProps {
  finalValue: number;
  duration?: number;
  decimals?: number;
  onComplete?: () => void;
  suffix?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  finalValue,
  duration = 3000, // 50% slower (was 2000)
  decimals = 0,
  onComplete,
  suffix = ""
}) => {
  const [currentValue, setCurrentValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isScaling, setIsScaling] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  // Intersection Observer to detect when element is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated && isVisible && finalValue > 0) {
      setHasAnimated(true);
      setCurrentValue(0);

      const startTime = Date.now();

      const updateCounter = () => {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        
        // Easing function for smooth animation (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentVal = finalValue * easeOut;
        
        setCurrentValue(currentVal);

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          setCurrentValue(finalValue);
          // Trigger scale animation
          setIsScaling(true);
          setTimeout(() => setIsScaling(false), 400);
          onComplete?.();
        }
      };

      requestAnimationFrame(updateCounter);
    }
  }, [finalValue, duration, hasAnimated, isVisible, onComplete]);

  const formatValue = (value: number) => {
    if (decimals === 0) {
      return Math.round(value).toString();
    }
    return value.toFixed(decimals);
  };

  return (
    <span 
      ref={elementRef}
      className={`font-bold transition-transform duration-400 ${
        isScaling ? 'scale-130 animate-bounce' : 'scale-100'
      }`}
      style={{
        transform: isScaling ? 'scale(1.3)' : 'scale(1)',
        transition: 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      }}
    >
      {formatValue(currentValue)}{suffix}
    </span>
  );
};