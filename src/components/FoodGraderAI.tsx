import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, Star, TrendingUp, Award, Coins } from 'lucide-react';
import { useNutrition } from '@/hooks/useNutrition';
import { toast } from 'sonner';
import { useTapCoins } from '@/hooks/useTapCoins';
import { calculateHealthGrade, getGradeColor, getGradeBgColor, GradeResult } from '@/utils/healthGrading';


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

  const { analyzeFoodImage, saveFoodEntry, loading } = useNutrition();
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
      const grade = calculateHealthGrade(
        result.food_items,
        result.total_calories,
        result.total_protein,
        result.total_carbs,
        result.total_fat
      );
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

  const handleLogToNutrition = async () => {
    if (!analysisResult || !gradeResult) return;

    try {
      await saveFoodEntry({
        meal_type: mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        food_items: analysisResult.food_items,
        total_calories: analysisResult.total_calories,
        total_protein: analysisResult.total_protein,
        total_carbs: analysisResult.total_carbs,
        total_fat: analysisResult.total_fat,
        ai_analyzed: true,
        user_confirmed: true,
        logged_date: new Date().toISOString().split('T')[0],
        health_grade: gradeResult.grade,
        grade_score: gradeResult.score,
        notes: `AI Analysis: ${gradeResult.insight}. ${gradeResult.recommendation}`
      });
      
      toast.success('Food entry logged successfully!');
      
      // Reset form
      setSelectedImage(null);
      setAnalysisResult(null);
      setGradeResult(null);
      setShowResults(false);
      setImageFile(null);
      
    } catch (error) {
      console.error('Error logging food entry:', error);
      toast.error('Failed to log food entry');
    }
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
              <Button className="flex-1 glow-button" onClick={handleLogToNutrition}>
                Log to Nutrition
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};