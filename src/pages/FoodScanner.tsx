import { ArrowLeft, Sparkles, Zap, Stars, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { EnhancedFoodPhotoAnalyzer } from "@/components/EnhancedFoodPhotoAnalyzer";
import { FoodRecipeBuilder } from "@/components/FoodRecipeBuilder";
import { SmartProductAnalyzer } from "@/components/SmartProductAnalyzer";
import { motion } from "framer-motion";
import { useState } from "react";

const FoodScanner = () => {
  const [currentTab, setCurrentTab] = useState('analyzer');

  return (
    <>
      <SEO 
        title="AI Food Scanner & Recipe Builder - TapFit" 
        description="Analyze your food with AI-powered nutritional insights and discover healthy recipes from your ingredients"
        canonicalPath="/food-scanner"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
          {/* Animated Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8"
          >
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2 hover:bg-primary/10 transition-colors mb-2 sm:mb-0">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
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

          {/* Main Content Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 sm:mb-8 h-12 sm:h-14 p-1 bg-gradient-to-r from-muted/50 to-muted rounded-xl">
                <TabsTrigger 
                  value="analyzer" 
                  className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base lg:text-lg py-2 sm:py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground transition-all duration-300"
                >
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden xs:inline">Food Analyzer</span>
                  <span className="xs:hidden">Analyzer</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="product" 
                  className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base lg:text-lg py-2 sm:py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground transition-all duration-300"
                >
                  <Scan className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden xs:inline">Product Scanner</span>
                  <span className="xs:hidden">Products</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="builder" 
                  className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base lg:text-lg py-2 sm:py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground transition-all duration-300"
                >
                  <Stars className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden xs:inline">Recipe Builder</span>
                  <span className="xs:hidden">Builder</span>
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

              <TabsContent value="builder" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <FoodRecipeBuilder />
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