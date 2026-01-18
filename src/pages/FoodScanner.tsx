import { Camera, Zap, ChefHat, Barcode, Brain, FileText, MapPin, UtensilsCrossed, Calendar, Stars } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";
import { EnhancedFoodPhotoAnalyzer } from "@/components/EnhancedFoodPhotoAnalyzer";
import { FoodRecipeBuilder } from "@/components/FoodRecipeBuilder";
import { SmartProductAnalyzer } from "@/components/SmartProductAnalyzer";
import { CoachsChoiceAnalyzer } from "@/components/CoachsChoiceAnalyzer";
import { MenuAnalyzer } from "@/components/MenuAnalyzer";
import { RestaurantDiscovery } from "@/components/RestaurantDiscovery";
import { MealPlannerEmbed } from "@/components/meal-planner/MealPlannerEmbed";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { usePageContext } from "@/hooks/usePageContext";
import { PageHeader } from "@/components/PageHeader";

// Tab descriptions for AI coach context
const TAB_DESCRIPTIONS: Record<string, { name: string; description: string; defaultContent: string }> = {
  analyzer: {
    name: "Enhanced AI Food Analyzer",
    description: "User can take photos of their meals to get AI-powered nutrition analysis with calorie, macro, and health grade calculations",
    defaultContent: "Ready to analyze food photos for nutrition data"
  },
  product: {
    name: "Universal Product Scanner",
    description: "User can scan any food product, supplement, or medication to get detailed nutrition facts, ingredient analysis, and health scores",
    defaultContent: "Ready to scan product barcodes or nutrition labels"
  },
  coach: {
    name: "Coach's Choice Analyzer",
    description: "AI-powered food selection assistant that helps users make healthier choices based on their goals",
    defaultContent: "Ready to provide personalized food recommendations"
  },
  menu: {
    name: "Restaurant Menu Analyzer",
    description: "User can photograph restaurant menus to get nutrition estimates, health scores, and recommendations for each item",
    defaultContent: "Ready to analyze restaurant menu photos"
  },
  builder: {
    name: "AI Recipe Builder",
    description: "User can input ingredients they have and get AI-generated healthy recipes with nutrition info",
    defaultContent: "Ready to build recipes from available ingredients"
  },
  restaurants: {
    name: "Restaurant Discovery",
    description: "Shows popular meals and restaurants from the user's social network with health grades and nutrition data",
    defaultContent: "Showing restaurant recommendations from user's network"
  },
  planner: {
    name: "Meal Planner",
    description: "Plan your meals, discover recipes by cuisine, save favorites, and schedule meals on a calendar",
    defaultContent: "Browse recipes, save favorites, and plan your weekly meals"
  }
};

const FoodScanner = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'analyzer';
  const [currentTab, setCurrentTab] = useState(initialTab);

  // Update tab when URL query parameter changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && TAB_DESCRIPTIONS[tabParam]) {
      setCurrentTab(tabParam);
    }
  }, [searchParams]);

  // Register page context for AI coach awareness
  const tabInfo = TAB_DESCRIPTIONS[currentTab] || TAB_DESCRIPTIONS.analyzer;
  usePageContext({
    pageName: `AI Food Hub - ${tabInfo.name}`,
    pageDescription: tabInfo.description,
    visibleContent: tabInfo.defaultContent
  });

  return (
    <>
      <SEO 
        title="AI Food Scanner & Recipe Builder - TapFit" 
        description="Analyze your food with AI-powered nutritional insights and discover healthy recipes from your ingredients"
        canonicalPath="/food-scanner"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <PageHeader title="AI Food Hub" />
        
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
          {/* Animated Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8"
          >
            <div className="flex-1 w-full">
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3"
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
                  <Zap className="h-6 w-6 sm:h-8 lg:h-10 sm:w-8 lg:w-10 text-primary" />
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
                  <Stars className="h-5 w-5 sm:h-6 lg:h-8 sm:w-6 lg:w-8 text-yellow-500" />
                </motion.div>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-1 sm:mt-2"
              >
                Analyze nutrition, discover recipes, and transform your cooking with AI magic ✨
              </motion.p>
            </div>
          </motion.div>

          {/* Meal Feed CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-6"
          >
            <div 
              onClick={() => navigate('/meal-feed')}
              className="bg-gradient-to-r from-primary/10 via-purple-500/5 to-primary/10 border border-primary/20 rounded-xl p-4 cursor-pointer hover:border-primary/40 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                    <UtensilsCrossed className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Meal Feed</h3>
                    <p className="text-sm text-muted-foreground">See what your network is eating</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="group-hover:bg-primary/10">
                  View Feed →
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Main Content Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid grid-cols-4 sm:flex sm:flex-wrap w-full gap-1.5 mb-6 sm:mb-8 h-auto p-2 bg-gradient-to-r from-muted/50 to-muted rounded-xl">
                <TabsTrigger 
                  value="analyzer" 
                  className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 text-[11px] sm:text-xs font-medium border-2 border-primary/50 data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground transition-all duration-300 rounded-lg"
                >
                  <Camera className="h-5 w-5" />
                  <span>Food</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="product" 
                  className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 text-[11px] sm:text-xs font-medium border-2 border-primary/50 data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground transition-all duration-300 rounded-lg"
                >
                  <Barcode className="h-5 w-5" />
                  <span>Scan</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="coach" 
                  className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 text-[11px] sm:text-xs font-medium border-2 border-primary/50 data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground transition-all duration-300 rounded-lg"
                >
                  <Brain className="h-5 w-5" />
                  <span>Pick</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="menu" 
                  className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 text-[11px] sm:text-xs font-medium border-2 border-primary/50 data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground transition-all duration-300 rounded-lg"
                >
                  <FileText className="h-5 w-5" />
                  <span>Menu</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="builder" 
                  className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 text-[11px] sm:text-xs font-medium border-2 border-primary/50 data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground transition-all duration-300 rounded-lg"
                >
                  <ChefHat className="h-5 w-5" />
                  <span>Recipe</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="restaurants" 
                  className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 text-[11px] sm:text-xs font-medium border-2 border-primary/50 data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground transition-all duration-300 rounded-lg"
                >
                  <MapPin className="h-5 w-5" />
                  <span>Spots</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="planner" 
                  className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 text-[11px] sm:text-xs font-medium border-2 border-primary/50 data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white transition-all duration-300 rounded-lg"
                >
                  <Calendar className="h-5 w-5" />
                  <span>Plan</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="analyzer" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <EnhancedFoodPhotoAnalyzer onDataChange={() => {}} />
                </motion.div>
              </TabsContent>

              <TabsContent value="product" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <SmartProductAnalyzer 
                    embedded={true}
                    onProductFound={(foodItem) => {
                      console.log('Product found:', foodItem);
                    }}
                  />
                </motion.div>
              </TabsContent>

              <TabsContent value="coach" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <CoachsChoiceAnalyzer />
                </motion.div>
              </TabsContent>

              <TabsContent value="menu" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <MenuAnalyzer />
                </motion.div>
              </TabsContent>

              <TabsContent value="builder" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <FoodRecipeBuilder />
                </motion.div>
              </TabsContent>

              <TabsContent value="restaurants" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <RestaurantDiscovery />
                </motion.div>
              </TabsContent>

              <TabsContent value="planner" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <MealPlannerEmbed />
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default FoodScanner;
