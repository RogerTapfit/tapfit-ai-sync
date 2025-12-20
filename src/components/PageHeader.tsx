import { ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title?: string;
  showBack?: boolean;
  showDashboard?: boolean;
  sticky?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({ 
  title, 
  showBack = true, 
  showDashboard = true,
  sticky = true,
  className,
  children
}: PageHeaderProps) {
  const navigate = useNavigate();
  
  return (
    <div className={cn(
      "bg-background/95 backdrop-blur border-b border-border pt-safe",
      sticky && "sticky top-0 z-10",
      className
    )}>
      <div className="flex items-center gap-3 p-4">
        <div className="flex gap-2">
          {showBack && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {showDashboard && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/')}
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          )}
        </div>
        {title && <h1 className="text-xl font-semibold">{title}</h1>}
        {children}
      </div>
    </div>
  );
}
