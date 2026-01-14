import React from 'react';

interface SafeAreaLayoutProps {
  children: React.ReactNode;
}

/**
 * Global wrapper that ensures all pages have proper safe area padding
 * for iPhone notch/Dynamic Island clearance on native apps.
 * Also enforces strict horizontal containment for mobile.
 */
export const SafeAreaLayout: React.FC<SafeAreaLayoutProps> = ({ children }) => {
  return (
    <div 
      className="pt-safe pb-safe w-full overflow-x-hidden"
      style={{ 
        maxWidth: '100vw', 
        overflowX: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {children}
    </div>
  );
};

export default SafeAreaLayout;
