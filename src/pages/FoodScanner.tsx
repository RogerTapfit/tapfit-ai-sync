import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { EnhancedFoodPhotoAnalyzer } from "@/components/EnhancedFoodPhotoAnalyzer";

const FoodScanner = () => {
  return (
    <>
      <SEO 
        title="AI Food Scanner - TapFit" 
        description="Analyze your food with AI-powered nutritional insights and health grading"
        canonicalPath="/food-scanner"
      />
      
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">AI Food Scanner</h1>
            <p className="text-muted-foreground">Analyze your food with AI-powered nutritional insights</p>
          </div>
        </div>

        {/* Food Photo Analyzer */}
        <div className="w-full">
          <EnhancedFoodPhotoAnalyzer onDataChange={() => {}} />
        </div>
      </div>
    </>
  );
};

export default FoodScanner;