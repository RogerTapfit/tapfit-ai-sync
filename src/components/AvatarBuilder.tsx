
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AvatarDropInGrid } from './AvatarDropInGrid';

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
              {isFirstTime ? 'Choose Your Coach' : 'Manage Coaches'}
            </h1>
            <p className="text-muted-foreground">
              Drag-and-drop images into the grid to create or update avatars. Reorder by dragging tiles.
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
            <AvatarDropInGrid />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
