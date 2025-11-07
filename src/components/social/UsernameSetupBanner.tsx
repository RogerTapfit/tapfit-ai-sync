import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

interface UsernameSetupBannerProps {
  onSetup: () => void;
}

export const UsernameSetupBanner = ({ onSetup }: UsernameSetupBannerProps) => {
  return (
    <Alert className="mb-6 border-primary/50 bg-primary/5">
      <UserPlus className="h-5 w-5" />
      <AlertTitle className="text-lg font-semibold">Complete Your Profile!</AlertTitle>
      <AlertDescription className="mt-2 flex items-center justify-between gap-4">
        <p className="text-muted-foreground">
          Set up your username to be discoverable by other users and connect with the community
        </p>
        <Button onClick={onSetup} size="sm" className="shrink-0">
          Set Username
        </Button>
      </AlertDescription>
    </Alert>
  );
};
