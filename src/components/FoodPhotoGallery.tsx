import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Camera, Search, Calendar, Filter, Eye, Trash2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useNutrition } from '@/hooks/useNutrition';
import { toast } from 'sonner';

interface PhotoData {
  id: string;
  photo_url: string;
  thumbnail_url?: string;
  meal_type: string;
  logged_date: string;
  created_at: string;
  total_calories: number;
  food_items: Array<{ name: string }>;
  notes?: string;
}

interface FoodPhotoGalleryProps {
  className?: string;
}

export const FoodPhotoGallery: React.FC<FoodPhotoGalleryProps> = ({ className }) => {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<PhotoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<string>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  
  const { foodEntries } = useNutrition();

  // Load photos from food entries
  useEffect(() => {
    const loadPhotos = () => {
      try {
        const photoEntries: PhotoData[] = [];
        
        foodEntries.forEach(entry => {
          // Handle both new multiple photo format and legacy single photo format
          const urls = entry.photo_urls || (entry.photo_url ? [entry.photo_url] : []);
          const thumbnails = entry.thumbnail_urls || (entry.thumbnail_url ? [entry.thumbnail_url] : []);
          
          urls.forEach((url, index) => {
            if (url && !url.startsWith('data:')) { // Skip base64 data URLs
              photoEntries.push({
                id: `${entry.id}-${index}`,
                photo_url: url,
                thumbnail_url: thumbnails[index] || url,
                meal_type: entry.meal_type,
                logged_date: entry.logged_date,
                created_at: entry.created_at,
                total_calories: entry.total_calories,
                food_items: entry.food_items || [],
                notes: entry.notes
              });
            }
          });
        });
        
        setPhotos(photoEntries);
        setFilteredPhotos(photoEntries);
      } catch (error) {
        console.error('Error loading photos:', error);
        toast.error('Failed to load photos');
      } finally {
        setLoading(false);
      }
    };

    loadPhotos();
  }, [foodEntries]);

  // Filter photos based on search and filters
  useEffect(() => {
    let filtered = photos;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(photo =>
        photo.food_items.some(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        ) || 
        photo.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Meal type filter
    if (selectedMealType !== 'all') {
      filtered = filtered.filter(photo => photo.meal_type === selectedMealType);
    }

    // Month filter
    if (selectedMonth !== 'all') {
      filtered = filtered.filter(photo => 
        format(new Date(photo.logged_date), 'yyyy-MM') === selectedMonth
      );
    }

    setFilteredPhotos(filtered);
  }, [photos, searchTerm, selectedMealType, selectedMonth]);

  const getMealTypeEmoji = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return '🌅';
      case 'lunch': return '🌞';
      case 'dinner': return '🌙';
      case 'snack': return '🍎';
      default: return '🍽️';
    }
  };

  const getUniqueMonths = () => {
    const months = [...new Set(photos.map(photo => 
      format(new Date(photo.logged_date), 'yyyy-MM')
    ))].sort().reverse();
    return months;
  };

  const handleDownloadPhoto = (photoUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = photoUrl;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">Loading photos...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Food Photo Gallery
            <Badge variant="secondary">{photos.length} photos</Badge>
          </CardTitle>
        </CardHeader>
        
        {/* Filters */}
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search food items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedMealType} onValueChange={setSelectedMealType}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Meal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All meals</SelectItem>
                <SelectItem value="breakfast">🌅 Breakfast</SelectItem>
                <SelectItem value="lunch">🌞 Lunch</SelectItem>
                <SelectItem value="dinner">🌙 Dinner</SelectItem>
                <SelectItem value="snack">🍎 Snack</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All months</SelectItem>
                {getUniqueMonths().map(month => (
                  <SelectItem key={month} value={month}>
                    {format(new Date(month + '-01'), 'MMMM yyyy')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground flex items-center">
              {filteredPhotos.length} of {photos.length} photos
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photo Grid */}
      {filteredPhotos.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {photos.length === 0 
                ? "No food photos found. Start taking photos of your meals!"
                : "No photos match your current filters."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredPhotos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
              <Dialog>
                <DialogTrigger asChild>
                  <div 
                    className="relative"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <img
                      src={photo.thumbnail_url || photo.photo_url}
                      alt="Food photo"
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute bottom-2 left-2">
                      <Badge className="text-xs bg-black/70 text-white">
                        {getMealTypeEmoji(photo.meal_type)} {photo.meal_type}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </DialogTrigger>

                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      {getMealTypeEmoji(photo.meal_type)} {photo.meal_type} - {format(new Date(photo.logged_date), 'MMM d, yyyy')}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <img
                      src={photo.photo_url}
                      alt="Food photo"
                      className="w-full max-h-96 object-contain rounded-lg"
                    />
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Calories:</strong> {photo.total_calories}
                      </div>
                      <div>
                        <strong>Time:</strong> {format(new Date(photo.created_at), 'h:mm a')}
                      </div>
                    </div>
                    
                    {photo.food_items.length > 0 && (
                      <div>
                        <strong className="text-sm">Food Items:</strong>
                        <p className="text-sm text-muted-foreground">
                          {photo.food_items.map(item => item.name).join(', ')}
                        </p>
                      </div>
                    )}
                    
                    {photo.notes && (
                      <div>
                        <strong className="text-sm">Notes:</strong>
                        <p className="text-sm text-muted-foreground italic">"{photo.notes}"</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadPhoto(
                          photo.photo_url,
                          `food-photo-${format(new Date(photo.logged_date), 'yyyy-MM-dd')}.jpg`
                        )}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};