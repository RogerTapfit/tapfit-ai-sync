import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Plus, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface ProductNotFoundDialogProps {
  isOpen?: boolean;
  barcode?: string;
  onClose?: () => void;
  onProductAdded?: (product: any) => void;
}

export const ProductNotFoundDialog = ({ isOpen, barcode, onClose, onProductAdded }: ProductNotFoundDialogProps) => {
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [sugars, setSugars] = useState('');
  const [sodium, setSodium] = useState('');
  const [servingSize, setServingSize] = useState('100');
  const [ingredients, setIngredients] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productName.trim()) {
      toast.error('Product name is required');
      return;
    }

    const newProduct = {
      id: barcode || `manual-${Date.now()}`,
      name: productName,
      brand: brand || 'Unknown',
      category: category || 'Other',
      nutrition: {
        calories_100g: parseFloat(calories) || 0,
        proteins_100g: parseFloat(protein) || 0,
        carbohydrates_100g: parseFloat(carbs) || 0,
        fat_100g: parseFloat(fat) || 0,
        fiber_100g: parseFloat(fiber) || 0,
        sugars_100g: parseFloat(sugars) || 0,
        salt_100g: parseFloat(sodium) / 1000 || 0, // Convert mg to g
      },
      ingredients,
      serving_size: `${servingSize}g`,
      data_source: 'Manual Entry',
      confidence: 1.0
    };

    onProductAdded?.(newProduct);
    toast.success('Product added successfully!');
    onClose?.();

    // Reset form
    setProductName('');
    setBrand('');
    setCategory('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setFiber('');
    setSugars('');
    setSodium('');
    setIngredients('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Product Not Found
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {barcode ? `Barcode ${barcode} not found in any database.` : 'Product not found.'} 
              Help us expand our database by adding this product manually.
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product-name">Product Name *</Label>
                  <Input
                    id="product-name"
                    placeholder="e.g., Coca-Cola Classic"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    placeholder="e.g., Coca-Cola"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beverages">Beverages</SelectItem>
                      <SelectItem value="alcoholic-beverages">Alcoholic Beverages</SelectItem>
                      <SelectItem value="snacks">Snacks</SelectItem>
                      <SelectItem value="dairy">Dairy Products</SelectItem>
                      <SelectItem value="meat">Meat & Poultry</SelectItem>
                      <SelectItem value="seafood">Seafood</SelectItem>
                      <SelectItem value="fruits">Fruits</SelectItem>
                      <SelectItem value="vegetables">Vegetables</SelectItem>
                      <SelectItem value="grains">Grains & Cereals</SelectItem>
                      <SelectItem value="condiments">Condiments & Sauces</SelectItem>
                      <SelectItem value="sweets">Sweets & Desserts</SelectItem>
                      <SelectItem value="frozen">Frozen Foods</SelectItem>
                      <SelectItem value="supplements">Supplements</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serving-size">Serving Size (grams)</Label>
                  <Input
                    id="serving-size"
                    type="number"
                    placeholder="100"
                    value={servingSize}
                    onChange={(e) => setServingSize(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">Nutrition Information (per 100g)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="calories" className="text-xs">Calories</Label>
                    <Input
                      id="calories"
                      type="number"
                      step="0.1"
                      placeholder="0"
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="protein" className="text-xs">Protein (g)</Label>
                    <Input
                      id="protein"
                      type="number"
                      step="0.1"
                      placeholder="0"
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="carbs" className="text-xs">Carbs (g)</Label>
                    <Input
                      id="carbs"
                      type="number"
                      step="0.1"
                      placeholder="0"
                      value={carbs}
                      onChange={(e) => setCarbs(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="fat" className="text-xs">Fat (g)</Label>
                    <Input
                      id="fat"
                      type="number"
                      step="0.1"
                      placeholder="0"
                      value={fat}
                      onChange={(e) => setFat(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="fiber" className="text-xs">Fiber (g)</Label>
                    <Input
                      id="fiber"
                      type="number"
                      step="0.1"
                      placeholder="0"
                      value={fiber}
                      onChange={(e) => setFiber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="sugars" className="text-xs">Sugars (g)</Label>
                    <Input
                      id="sugars"
                      type="number"
                      step="0.1"
                      placeholder="0"
                      value={sugars}
                      onChange={(e) => setSugars(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="sodium" className="text-xs">Sodium (mg)</Label>
                    <Input
                      id="sodium"
                      type="number"
                      step="1"
                      placeholder="0"
                      value={sodium}
                      onChange={(e) => setSodium(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ingredients">Ingredients (optional)</Label>
                <Textarea
                  id="ingredients"
                  placeholder="List ingredients separated by commas..."
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};