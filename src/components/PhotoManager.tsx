import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Camera, Package, Eye, Grid3X3 } from 'lucide-react';
import { PhotoData } from './EnhancedFoodPhotoAnalyzer';

interface PhotoManagerProps {
  photos: PhotoData[];
  onRemovePhoto: (id: string) => void;
  onSetPhotoType: (id: string, type: PhotoData['type']) => void;
}

const photoTypeConfig = {
  main_dish: { label: 'Main Dish', icon: '🍽️', color: 'bg-primary/10 text-primary' },
  nutrition_label: { label: 'Nutrition Label', icon: '📄', color: 'bg-blue-500/10 text-blue-500' },
  ingredients: { label: 'Ingredients', icon: '📋', color: 'bg-green-500/10 text-green-500' },
  angle_view: { label: 'Different Angle', icon: '📐', color: 'bg-purple-500/10 text-purple-500' }
};

export const PhotoManager: React.FC<PhotoManagerProps> = ({
  photos,
  onRemovePhoto,
  onSetPhotoType
}) => {
  if (photos.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Grid3X3 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{photos.length} Photo{photos.length > 1 ? 's' : ''} Added</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {photos.map((photo) => {
          const typeConfig = photoTypeConfig[photo.type];
          
          return (
            <Card key={photo.id} className="overflow-hidden">
              <div className="relative">
                <img 
                  src={photo.dataUrl} 
                  alt="Food photo" 
                  className="w-full h-32 object-cover"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2 h-6 w-6 p-0"
                  onClick={() => onRemovePhoto(photo.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
                {photo.analyzed && (
                  <Badge className="absolute bottom-2 left-2 bg-green-500/90 text-white">
                    Analyzed
                  </Badge>
                )}
              </div>
              
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{typeConfig.icon}</span>
                    <Badge className={typeConfig.color}>
                      {typeConfig.label}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(photoTypeConfig).map(([type, config]) => (
                      <Button
                        key={type}
                        size="sm"
                        variant={photo.type === type ? "default" : "outline"}
                        onClick={() => onSetPhotoType(photo.id, type as PhotoData['type'])}
                        className="h-7 text-xs"
                      >
                        <span className="mr-1">{config.icon}</span>
                        {config.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};