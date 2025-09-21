import { ArrowLeft, Sparkles, Zap, Stars } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { EnhancedFoodPhotoAnalyzer } from "@/components/EnhancedFoodPhotoAnalyzer";
import { FoodRecipeBuilder } from "@/components/FoodRecipeBuilder";
import { FoodScannerAssistant } from "@/components/FoodScannerAssistant";
import { motion } from "framer-motion";
import { useState } from "react";

const FoodScanner = () => {
  const [currentTab, setCurrentTab] = useState('analyzer');
  const [assistantState, setAssistantState] = useState<'initial' | 'photos_added' | 'analyzing' | 'results' | 'recipe_mode' | 'ingredient_analysis'>('initial');
  const [photoCount, setPhotoCount] = useState(0);
  const [hasResults, setHasResults] = useState(false);
  const [recipeCount, setRecipeCount] = useState(0);

  // Update assistant state based on tab changes
  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    if (value === 'builder') {
      setAssistantState('recipe_mode');
    } else {
      setAssistantState('initial');
    }
  };

  return (
    <>
      <SEO 
        title="AI Food Scanner & Recipe Builder - TapFit" 
        description="Analyze your food with AI-powered nutritional insights and discover healthy recipes from your ingredients"
        canonicalPath="/food-scanner"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Animated Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8"
          >
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2 hover:bg-primary/10 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex-1">
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent flex items-center gap-3"
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 3,
                    ease: "easeInOut"
                  }}
                >
                  <Zap className="h-10 w-10 text-primary" />
                </motion.div>
                AI Food Hub
                <motion.div
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2,
                    ease: "easeInOut"
                  }}
                >
                  <Stars className="h-8 w-8 text-yellow-500" />
                </motion.div>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg text-muted-foreground mt-2"
              >
                Analyze nutrition, discover recipes, and transform your cooking with AI magic ✨
              </motion.p>
            </div>
          </motion.div>

          {/* Main Content Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 h-14 p-1 bg-gradient-to-r from-muted/50 to-muted rounded-xl">
                <TabsTrigger 
                  value="analyzer" 
                  className="flex items-center gap-2 text-lg py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground transition-all duration-300"
                >
                  <Sparkles className="h-5 w-5" />
                  Food Analyzer
                </TabsTrigger>
                <TabsTrigger 
                  value="builder" 
                  className="flex items-center gap-2 text-lg py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground transition-all duration-300"
                >
                  <Stars className="h-5 w-5" />
                  Recipe Builder
                </TabsTrigger>
              </TabsList>

              <TabsContent value="analyzer" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <EnhancedFoodPhotoAnalyzer 
                    onDataChange={() => {}} 
                    onStateChange={(state, data) => {
                      setAssistantState(state);
                      if (data?.photoCount !== undefined) setPhotoCount(data.photoCount);
                      if (data?.hasResults !== undefined) setHasResults(data.hasResults);
                    }}
                  />
                </motion.div>
              </TabsContent>

              <TabsContent value="builder" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <FoodRecipeBuilder 
                    onStateChange={(state, data) => {
                      setAssistantState(state);
                      if (data?.recipeCount !== undefined) setRecipeCount(data.recipeCount);
                    }}
                  />
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>

        {/* AI Assistant */}
        <FoodScannerAssistant
          currentState={assistantState}
          photoCount={photoCount}
          hasResults={hasResults}
          recipeCount={recipeCount}
        />
      </div>
    </>
  );
};

export default FoodScanner;