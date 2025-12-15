import React from 'react';

interface SafeAreaLayoutProps {
  children: React.ReactNode;
}

/**
 * Global wrapper that ensures all pages have proper safe area padding
 * for iPhone notch/Dynamic Island clearance on native apps
 */
export const SafeAreaLayout: React.FC<SafeAreaLayoutProps> = ({ children }) => {
  return (
    <div className="pt-safe pb-safe">
      {children}
    </div>
  );
};

export default SafeAreaLayout;
