
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AvatarGallery } from './AvatarGallery';

interface AvatarBuilderProps {
  onClose: () => void;
  isFirstTime?: boolean;
}

export const AvatarBuilder = ({ onClose, isFirstTime = false }: AvatarBuilderProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-2 sm:p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {isFirstTime ? 'Choose Your Avatar' : 'Choose Your Avatar'}
            </h1>
            <p className="text-muted-foreground">
              Pick a robot avatar to represent you across TapFit.
            </p>
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle>Avatar Gallery</CardTitle>
          </CardHeader>
          <CardContent>
            <AvatarGallery />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
