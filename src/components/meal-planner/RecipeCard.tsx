import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Plus, Clock, Flame, Dumbbell } from 'lucide-react';
import { motion } from 'framer-motion';
import { RecipeDatabaseItem } from '@/hooks/useRecipeDatabase';

interface RecipeCardProps {
  recipe: RecipeDatabaseItem;
  onSave?: () => void;
  onAddToPlan?: () => void;
  onViewDetails?: () => void;
  isSaved?: boolean;
}

export function RecipeCard({ recipe, onSave, onAddToPlan, onViewDetails, isSaved }: RecipeCardProps) {
  const { nutrition_per_serving } = recipe;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="overflow-hidden bg-card/80 backdrop-blur-sm border-border/50 cursor-pointer group"
        onClick={onViewDetails}
      >
        {/* Image */}
        <div className="relative h-40 overflow-hidden">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <span className="text-4xl">🍽️</span>
            </div>
          )}
          
          {/* Cuisine badge */}
          <Badge className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm text-foreground">
            {recipe.cuisine}
          </Badge>
          
          {/* Save button */}
          {onSave && (
            <Button
              size="icon"
              variant="ghost"
              className={`absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm ${
                isSaved ? 'text-red-500' : 'text-muted-foreground'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onSave();
              }}
            >
              <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <h3 className="font-semibold text-foreground truncate">{recipe.name}</h3>
          
          {/* Nutrition info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              <span>{nutrition_per_serving.calories} cal</span>
            </div>
            <div className="flex items-center gap-1">
              <Dumbbell className="h-3.5 w-3.5 text-blue-500" />
              <span>{nutrition_per_serving.protein}g</span>
            </div>
          </div>

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {recipe.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs px-2 py-0">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Add to plan button */}
          {onAddToPlan && (
            <Button
              size="sm"
              className="w-full mt-2"
              onClick={(e) => {
                e.stopPropagation();
                onAddToPlan();
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add to Plan
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
