import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Grid, List, Trash2 } from 'lucide-react';
import { useSavedRecipes, SavedRecipe } from '@/hooks/useSavedRecipes';
import { RecipeDetailModal } from './RecipeDetailModal';
import { AddToPlanModal } from './AddToPlanModal';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function RecipeLibrary() {
  const { savedRecipes, loading, deleteRecipe } = useSavedRecipes();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedRecipe, setSelectedRecipe] = useState<SavedRecipe | null>(null);
  const [recipeToAdd, setRecipeToAdd] = useState<SavedRecipe | null>(null);
  const [recipeToDelete, setRecipeToDelete] = useState<SavedRecipe | null>(null);

  const filteredRecipes = savedRecipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (savedRecipes.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-6xl mb-4 block">📚</span>
        <h3 className="text-lg font-semibold mb-2">No Saved Recipes</h3>
        <p className="text-muted-foreground mb-4">
          Browse the Discover tab to find and save recipes to your library.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and view toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card/50 border-border/50"
          />
        </div>
        <div className="flex border rounded-lg bg-card/50">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Recipe count */}
      <p className="text-sm text-muted-foreground">
        {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} saved
      </p>

      {/* Recipes */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filteredRecipes.map((recipe) => (
            <motion.div
              key={recipe.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className="overflow-hidden cursor-pointer group bg-card/80 backdrop-blur-sm border-border/50"
                onClick={() => setSelectedRecipe(recipe)}
              >
                <div className="relative h-32">
                  {recipe.image_url ? (
                    <img
                      src={recipe.image_url}
                      alt={recipe.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <span className="text-3xl">🍽️</span>
                    </div>
                  )}
                  <Badge className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm text-foreground text-xs">
                    {recipe.cuisine}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 bg-background/80 backdrop-blur-sm text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRecipeToDelete(recipe);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="p-3">
                  <h4 className="font-medium text-sm truncate">{recipe.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {recipe.nutrition_per_serving.calories} cal • {recipe.nutrition_per_serving.protein}g protein
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRecipes.map((recipe) => (
            <Card
              key={recipe.id}
              className="p-3 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setSelectedRecipe(recipe)}
            >
              {recipe.image_url ? (
                <img
                  src={recipe.image_url}
                  alt={recipe.name}
                  className="w-14 h-14 rounded-lg object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <span className="text-xl">🍽️</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{recipe.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {recipe.cuisine} • {recipe.nutrition_per_serving.calories} cal
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setRecipeToDelete(recipe);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Recipe detail modal */}
      <RecipeDetailModal
        recipe={selectedRecipe}
        isOpen={!!selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        onAddToPlan={() => {
          if (selectedRecipe) {
            setRecipeToAdd(selectedRecipe);
            setSelectedRecipe(null);
          }
        }}
        isSaved={true}
      />

      {/* Add to plan modal */}
      <AddToPlanModal
        recipe={recipeToAdd}
        isOpen={!!recipeToAdd}
        onClose={() => setRecipeToAdd(null)}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!recipeToDelete} onOpenChange={() => setRecipeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{recipeToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (recipeToDelete) {
                  deleteRecipe(recipeToDelete.id);
                  setRecipeToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
