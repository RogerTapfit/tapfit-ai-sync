import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, Star, TrendingUp, Award, Coins } from 'lucide-react';
import { useNutrition } from '@/hooks/useNutrition';
import { toast } from 'sonner';
import { useTapCoins } from '@/hooks/useTapCoins';

interface GradeResult {
  grade: string;
  score: number;
  category: string;
  insight: string;
  recommendation: string;
  healthyStreak?: boolean;
}

interface AnalysisResult {
  food_items: Array<{
    name: string;
    quantity: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    confidence?: number;
  }>;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  suggestions: string[];
  meal_classification: string;
}

const mealTypes = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' }
];

export const FoodGraderAI = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [mealType, setMealType] = useState('lunch');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { analyzeFoodImage, loading } = useNutrition();
  const { awardCoins } = useTapCoins();

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setAnalysisResult(null);
      setGradeResult(null);
      setShowResults(false);
    }
  };

  const calculateHealthGrade = (analysis: AnalysisResult): GradeResult => {
    let score = 0;
    const insights: string[] = [];
    
    // Analyze food items for health factors
    const hasLeanProtein = analysis.food_items.some(item => 
      item.name.toLowerCase().includes('chicken') || 
      item.name.toLowerCase().includes('fish') || 
      item.name.toLowerCase().includes('turkey') ||
      item.name.toLowerCase().includes('tofu') ||
      (item.name.toLowerCase().includes('steak') && item.protein > 20)
    );
    
    const hasVegetables = analysis.food_items.some(item =>
      item.name.toLowerCase().includes('vegetable') ||
      item.name.toLowerCase().includes('broccoli') ||
      item.name.toLowerCase().includes('spinach') ||
      item.name.toLowerCase().includes('pepper') ||
      item.name.toLowerCase().includes('carrot') ||
      item.name.toLowerCase().includes('lettuce') ||
      item.name.toLowerCase().includes('tomato')
    );

    const hasProcessedFood = analysis.food_items.some(item =>
      item.name.toLowerCase().includes('fried') ||
      item.name.toLowerCase().includes('pizza') ||
      item.name.toLowerCase().includes('burger') ||
      item.name.toLowerCase().includes('fries') ||
      item.name.toLowerCase().includes('chips')
    );

    const hasHighFiber = analysis.food_items.some(item =>
      item.name.toLowerCase().includes('bean') ||
      item.name.toLowerCase().includes('quinoa') ||
      item.name.toLowerCase().includes('oats') ||
      item.name.toLowerCase().includes('brown rice')
    );

    // Portion size assessment (rough estimate)
    const reasonablePortions = analysis.total_calories < 800;
    const proteinRatio = analysis.total_protein / Math.max(analysis.total_calories / 4, 1);
    const highProtein = proteinRatio > 0.25;

    // Scoring logic
    if (hasLeanProtein) {
      score += 2;
      insights.push("Contains lean protein");
    }
    if (hasVegetables) {
      score += 2;
      insights.push("Includes vegetables");
    }
    if (reasonablePortions) {
      score += 1;
      insights.push("Reasonable portion size");
    }
    if (analysis.total_fat < analysis.total_calories * 0.35) {
      score += 1;
      insights.push("Moderate fat content");
    }
    if (hasHighFiber) {
      score += 1;
      insights.push("Good fiber sources");
    }
    if (highProtein) {
      score += 1;
      insights.push("High protein content");
    }
    if (!hasProcessedFood) {
      score += 2;
      insights.push("Mostly whole foods");
    } else {
      score -= 2;
      insights.push("Contains processed ingredients");
    }

    // Grade mapping
    let grade: string;
    if (score >= 9) grade = "A+";
    else if (score >= 8) grade = "A";
    else if (score >= 7) grade = "A-";
    else if (score >= 6) grade = "B";
    else if (score >= 5) grade = "C";
    else if (score >= 3) grade = "D";
    else grade = "F";

    // Generate category and recommendations
    const category = analysis.food_items.map(item => item.name).join(" with ");
    const insight = insights.slice(0, 3).join(", ");
    
    let recommendation: string;
    if (score >= 7) {
      recommendation = "Excellent choice! This meal supports your fitness goals.";
    } else if (score >= 5) {
      recommendation = "Good meal! Consider adding more vegetables for extra nutrients.";
    } else if (score >= 3) {
      recommendation = "Okay choice. Try to include more whole foods next time.";
    } else {
      recommendation = "Consider healthier alternatives with more vegetables and lean protein.";
    }

    return {
      grade,
      score,
      category,
      insight,
      recommendation,
      healthyStreak: score >= 7
    };
  };

  const handleAnalyzeFood = async () => {
    if (!imageFile) {
      toast.error('Please select an image first');
      return;
    }

    setIsAnalyzing(true);
    try {
      const base64Image = await convertToBase64(imageFile);
      const result = await analyzeFoodImage(base64Image, mealType);
      
      setAnalysisResult(result);
      const grade = calculateHealthGrade(result);
      setGradeResult(grade);
      setShowResults(true);

      // Award coins for healthy choices
      if (grade.healthyStreak) {
        await awardCoins(10, 'food_grade', `Healthy food choice: ${grade.grade} grade`);
        toast.success(`🎉 +10 Tap Coins for your ${grade.grade} grade meal!`);
      }

    } catch (error) {
      console.error('Error analyzing food:', error);
      toast.error('Failed to analyze food image');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-stats-exercises';
    if (grade.startsWith('B')) return 'text-stats-calories';
    if (grade.startsWith('C')) return 'text-stats-duration';
    return 'text-destructive';
  };

  const getGradeBgColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-stats-exercises/20 border-stats-exercises/30';
    if (grade.startsWith('B')) return 'bg-stats-calories/20 border-stats-calories/30';
    if (grade.startsWith('C')) return 'bg-stats-duration/20 border-stats-duration/30';
    return 'bg-destructive/20 border-destructive/30';
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <Card className="glow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Award className="h-6 w-6 text-primary" />
            Food Grader AI
          </CardTitle>
          <p className="text-muted-foreground">
            Get an instant health grade for your meals and earn Tap Coins for healthy choices!
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Capture Section */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Photo
              </Button>
              <Button
                onClick={() => cameraInputRef.current?.click()}
                variant="outline"
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageCapture}
              accept="image/*"
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              onChange={handleImageCapture}
              accept="image/*"
              capture="environment"
              className="hidden"
            />

            {selectedImage && (
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="Selected food"
                  className="w-full h-64 object-cover rounded-xl border border-border"
                />
              </div>
            )}
          </div>

          {/* Meal Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Meal Type</label>
            <div className="grid grid-cols-4 gap-2">
              {mealTypes.map((type) => (
                <Button
                  key={type.value}
                  onClick={() => setMealType(type.value)}
                  variant={mealType === type.value ? "default" : "outline"}
                  size="sm"
                  className="h-10"
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Analyze Button */}
          <Button
            onClick={handleAnalyzeFood}
            disabled={!selectedImage || isAnalyzing || loading}
            className="w-full glow-button h-12 text-lg font-semibold"
          >
            {isAnalyzing || loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2" />
            ) : (
              <Star className="h-5 w-5 mr-2" />
            )}
            {isAnalyzing || loading ? 'Analyzing Food...' : 'Grade My Food'}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {showResults && gradeResult && analysisResult && (
        <Card className="glow-card animate-slide-up">
          <CardContent className="p-6 space-y-6">
            {/* Grade Display */}
            <div className="text-center space-y-4">
              <div
                className={`inline-flex items-center justify-center w-24 h-24 rounded-full border-2 ${getGradeBgColor(
                  gradeResult.grade
                )} pulse-glow`}
              >
                <span className={`text-3xl font-bold ${getGradeColor(gradeResult.grade)}`}>
                  {gradeResult.grade}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold">{gradeResult.category}</h3>
                <p className="text-muted-foreground">{gradeResult.insight}</p>
              </div>
            </div>

            {/* Nutritional Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-stats-calories">
                  {analysisResult.total_calories}
                </div>
                <div className="text-sm text-muted-foreground">Calories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-stats-exercises">
                  {Math.round(analysisResult.total_protein)}g
                </div>
                <div className="text-sm text-muted-foreground">Protein</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-stats-duration">
                  {Math.round(analysisResult.total_carbs)}g
                </div>
                <div className="text-sm text-muted-foreground">Carbs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-stats-heart">
                  {Math.round(analysisResult.total_fat)}g
                </div>
                <div className="text-sm text-muted-foreground">Fat</div>
              </div>
            </div>

            {/* Recommendation */}
            <div className="ai-feedback">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Recommendation</h4>
                  <p className="text-sm text-muted-foreground">
                    {gradeResult.recommendation}
                  </p>
                </div>
              </div>
            </div>

            {/* Rewards & Streak */}
            {gradeResult.healthyStreak && (
              <div className="bg-stats-exercises/10 border border-stats-exercises/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-stats-exercises">
                  <Coins className="h-5 w-5" />
                  <span className="font-semibold">+10 Tap Coins Earned!</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Great job choosing a healthy meal! Keep up the streak!
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSelectedImage(null);
                  setAnalysisResult(null);
                  setGradeResult(null);
                  setShowResults(false);
                }}
              >
                Grade Another
              </Button>
              <Button className="flex-1 glow-button">
                Log to Nutrition
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};