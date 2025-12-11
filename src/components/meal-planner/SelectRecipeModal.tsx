import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import { useRecipeDatabase, RecipeDatabaseItem } from '@/hooks/useRecipeDatabase';
import { useSavedRecipes, SavedRecipe } from '@/hooks/useSavedRecipes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SelectRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (recipe: RecipeDatabaseItem | SavedRecipe) => void;
  selectedDate: string;
  selectedMealType: string;
}

export function SelectRecipeModal({
  isOpen,
  onClose,
  onSelect,
  selectedDate,
  selectedMealType,
}: SelectRecipeModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { recipes: dbRecipes, loading: dbLoading } = useRecipeDatabase();
  const { savedRecipes, loading: savedLoading } = useSavedRecipes();

  const filteredDbRecipes = dbRecipes.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSavedRecipes = savedRecipes.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const RecipeItem = ({ recipe, type }: { recipe: RecipeDatabaseItem | SavedRecipe; type: 'db' | 'saved' }) => (
    <Card
      className="p-3 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onSelect(recipe)}
    >
      {recipe.image_url ? (
        <img
          src={recipe.image_url}
          alt={recipe.name}
          className="w-12 h-12 rounded-lg object-cover"
        />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
          <span className="text-lg">🍽️</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{recipe.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{recipe.nutrition_per_serving.calories} cal</span>
          <span>•</span>
          <span>{recipe.nutrition_per_serving.protein}g protein</span>
        </div>
      </div>
      <Badge variant="outline" className="text-xs">
        {recipe.cuisine}
      </Badge>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            Select Recipe for {selectedMealType}
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs defaultValue="discover" className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="saved">My Recipes ({savedRecipes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {filteredDbRecipes.map((recipe) => (
                  <RecipeItem key={recipe.id} recipe={recipe} type="db" />
                ))}
                {filteredDbRecipes.length === 0 && !dbLoading && (
                  <p className="text-center text-muted-foreground py-8">
                    No recipes found
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="saved" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {filteredSavedRecipes.map((recipe) => (
                  <RecipeItem key={recipe.id} recipe={recipe} type="saved" />
                ))}
                {filteredSavedRecipes.length === 0 && !savedLoading && (
                  <p className="text-center text-muted-foreground py-8">
                    No saved recipes yet. Save recipes from the Discover tab!
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
