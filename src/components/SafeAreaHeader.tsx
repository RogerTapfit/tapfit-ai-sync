import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SafeAreaHeaderProps {
  children: ReactNode;
  className?: string;
}

/**
 * SafeAreaHeader - A header component that respects iOS safe area insets.
 * Use this for sticky headers to ensure they appear below the notch/Dynamic Island.
 */
export function SafeAreaHeader({ children, className }: SafeAreaHeaderProps) {
  return (
    <div 
      className={cn(
        "sticky z-10 bg-background/95 backdrop-blur border-b border-border safe-header",
        className
      )}
    >
      {children}
    </div>
  );
}
