import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Heart, Plus, Clock, Flame, Dumbbell, ChefHat, Users } from 'lucide-react';
import { RecipeDatabaseItem } from '@/hooks/useRecipeDatabase';
import { SavedRecipe } from '@/hooks/useSavedRecipes';

interface RecipeDetailModalProps {
  recipe: RecipeDatabaseItem | SavedRecipe | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  onAddToPlan?: () => void;
  isSaved?: boolean;
}

export function RecipeDetailModal({
  recipe,
  isOpen,
  onClose,
  onSave,
  onAddToPlan,
  isSaved
}: RecipeDetailModalProps) {
  if (!recipe) return null;

  const nutrition = recipe.nutrition_per_serving;
  const servings = 'servings' in recipe ? recipe.servings : 1;
  const prepTime = 'prep_time_min' in recipe ? recipe.prep_time_min : null;
  const cookTime = 'cook_time_min' in recipe ? recipe.cook_time_min : null;
  const difficulty = 'difficulty' in recipe ? recipe.difficulty : 'medium';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        {/* Header image */}
        <div className="relative h-56">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <span className="text-6xl">🍽️</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          
          {/* Title overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <Badge className="mb-2">{recipe.cuisine}</Badge>
            <h2 className="text-2xl font-bold text-foreground">{recipe.name}</h2>
          </div>
        </div>

        <ScrollArea className="max-h-[calc(90vh-14rem)]">
          <div className="p-6 space-y-6">
            {/* Quick stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Flame className="h-5 w-5 mx-auto text-orange-500 mb-1" />
                <p className="text-lg font-bold">{nutrition.calories}</p>
                <p className="text-xs text-muted-foreground">Calories</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Dumbbell className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                <p className="text-lg font-bold">{nutrition.protein}g</p>
                <p className="text-xs text-muted-foreground">Protein</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <span className="text-lg">🍚</span>
                <p className="text-lg font-bold">{nutrition.carbs}g</p>
                <p className="text-xs text-muted-foreground">Carbs</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <span className="text-lg">🥑</span>
                <p className="text-lg font-bold">{nutrition.fat}g</p>
                <p className="text-xs text-muted-foreground">Fat</p>
              </div>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{servings} servings</span>
              </div>
              {prepTime && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{prepTime} min prep</span>
                </div>
              )}
              {cookTime && (
                <div className="flex items-center gap-1">
                  <ChefHat className="h-4 w-4" />
                  <span>{cookTime} min cook</span>
                </div>
              )}
              {difficulty && (
                <Badge variant="outline" className="capitalize">
                  {difficulty}
                </Badge>
              )}
            </div>

            {/* Tags */}
            {recipe.tags && recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <Separator />

            {/* Ingredients */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span>🥘</span> Ingredients
              </h3>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-1">•</span>
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            {/* Instructions */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span>📝</span> Instructions
              </h3>
              <ol className="space-y-3">
                {recipe.instructions.map((step, index) => {
                  // Handle both string and object instruction formats
                  const stepText = typeof step === 'string' 
                    ? step 
                    : (step as { text?: string; step?: number; time?: string })?.text || '';
                  const stepTime = typeof step === 'object' 
                    ? (step as { time?: string })?.time 
                    : null;
                  
                  return (
                    <li key={index} className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <span className="text-muted-foreground">{stepText}</span>
                        {stepTime && (
                          <span className="block text-xs text-primary/70 mt-1">⏱️ {stepTime}</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-4">
              {onSave && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onSave}
                >
                  <Heart className={`h-4 w-4 mr-2 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                  {isSaved ? 'Saved' : 'Save Recipe'}
                </Button>
              )}
              {onAddToPlan && (
                <Button className="flex-1" onClick={onAddToPlan}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Plan
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
