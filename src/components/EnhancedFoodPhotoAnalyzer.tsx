import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Camera, Upload, Loader2, Check, Edit3, Save, X, Award, CheckCircle2, XCircle, 
  Lightbulb, Target, MessageCircle, Package, Sparkles, RefreshCw, Clock, Plus, Minus,
  Ruler, Eye, Scale
} from 'lucide-react';
import { useNutrition, FoodItem } from '@/hooks/useNutrition';
import { toast } from 'sonner';
import { calculateHealthGrade, getGradeColor, getGradeBgColor } from '@/utils/healthGrading';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { PhotoManager } from './PhotoManager';
import { AnimatedCounter } from './AnimatedCounter';
import { FoodChatInterface, ChatMessage } from './FoodChatInterface';
import { PhotoUploadValidator } from './PhotoUploadValidator';
import { PhotoStorageMonitor } from './PhotoStorageMonitor';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { processImageFile } from '../utils/heicConverter';
import { getCurrentLocalDate } from '@/utils/dateUtils';
import { useChatbotContext } from '@/contexts/ChatbotContext';
import foodAnalyzerGuide from '@/assets/food-analyzer-guide.png';

// Enhanced food photo analyzer without barcode functionality

export interface PhotoData {
  id: string;
  dataUrl: string;
  file: File;
  type: 'main_dish' | 'nutrition_label' | 'ingredients' | 'angle_view';
  analyzed: boolean;
}

interface EnhancedFoodPhotoAnalyzerProps {
  onDataChange?: () => void;
  onStateChange?: (state: 'initial' | 'photos_added' | 'analyzing' | 'results', data?: { photoCount?: number; hasResults?: boolean }) => void;
}

export const EnhancedFoodPhotoAnalyzer: React.FC<EnhancedFoodPhotoAnalyzerProps> = ({ onDataChange, onStateChange }) => {
  const { analyzeFoodImage, saveFoodEntry, loading } = useNutrition();
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [mealType, setMealType] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  const { setAnalysisContext } = useChatbotContext();
  
  // Register food analysis with AI coach context (uses analysisContext to avoid being overwritten)
  useEffect(() => {
    if (analysisResult && analysisResult.food_items?.length > 0) {
      const totalCalories = analysisResult.food_items.reduce((sum: number, item: FoodItem) => sum + (item.calories || 0), 0);
      const totalProtein = analysisResult.food_items.reduce((sum: number, item: FoodItem) => sum + (item.protein || 0), 0);
      const totalCarbs = analysisResult.food_items.reduce((sum: number, item: FoodItem) => sum + (item.carbs || 0), 0);
      const totalFat = analysisResult.food_items.reduce((sum: number, item: FoodItem) => sum + (item.fat || 0), 0);
      
      const healthGrade = analysisResult.health_analysis?.overall_grade || 'N/A';
      
      let visibleContent = `ANALYZED MEAL (${mealType || 'meal'}):
Food Items Detected:
${analysisResult.food_items.map((item: FoodItem) => `- ${item.name}: ${item.calories} cal, ${item.protein}g protein, ${item.carbs}g carbs, ${item.fat}g fat`).join('\n')}

Total Nutrition:
- Calories: ${totalCalories}
- Protein: ${totalProtein}g
- Carbs: ${totalCarbs}g
- Fat: ${totalFat}g

Health Grade: ${healthGrade}`;

      if (analysisResult.health_analysis?.summary) {
        visibleContent += `\nHealth Summary: ${analysisResult.health_analysis.summary}`;
      }
      
      if (analysisResult.health_analysis?.recommendations?.length) {
        visibleContent += `\nRecommendations: ${analysisResult.health_analysis.recommendations.join(', ')}`;
      }

      setAnalysisContext({
        type: 'food',
        timestamp: Date.now(),
        visibleContent
      });
    } else {
      setAnalysisContext(null);
    }
  }, [analysisResult, mealType, setAnalysisContext]);

  const ANALYSIS_STAGES = [
    { progress: 15, text: 'Processing photos...', duration: 1500 },
    { progress: 35, text: 'Detecting food items...', duration: 2000 },
    { progress: 55, text: 'Analyzing portions...', duration: 2500 },
    { progress: 75, text: 'Calculating nutrition...', duration: 2000 },
    { progress: 90, text: 'Generating insights...', duration: 1500 },
    { progress: 100, text: 'Complete!', duration: 500 }
  ];

  React.useEffect(() => {
    if (analyzing) {
      setAnalysisProgress(0);
      setAnalysisStage(ANALYSIS_STAGES[0].text);
      
      let stageIndex = 0;
      const interval = setInterval(() => {
        if (stageIndex < ANALYSIS_STAGES.length - 1) {
          stageIndex++;
          setAnalysisProgress(ANALYSIS_STAGES[stageIndex].progress);
          setAnalysisStage(ANALYSIS_STAGES[stageIndex].text);
        } else {
          clearInterval(interval);
        }
      }, 2200);
      
      return () => clearInterval(interval);
    }
  }, [analyzing]);
  const [editingItems, setEditingItems] = useState<FoodItem[]>([]);
  const [portionMultipliers, setPortionMultipliers] = useState<{ [key: number]: number }>({});
  const [notes, setNotes] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [storageValidated, setStorageValidated] = useState(false);
  const [showValidation, setShowValidation] = useState(true);
  const [userProfile, setUserProfile] = useState<{ weight_kg: number; gender: string } | null>(null);

  const mealTypes = [
    { value: 'breakfast', label: 'Breakfast', icon: '🌅' },
    { value: 'lunch', label: 'Lunch', icon: '☀️' },
    { value: 'dinner', label: 'Dinner', icon: '🌙' },
    { value: 'snack', label: 'Snack', icon: '🍎' },
    { value: 'beverage', label: 'Beverage', icon: '🥤' }
  ];

  const generateId = () => crypto.randomUUID();

  // Fetch user profile data for running calculation
  React.useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('weight_kg, gender')
          .eq('id', user.id)
          .maybeSingle();
        if (data) setUserProfile(data);
      }
    };
    fetchUserProfile();
  }, []);

  const calculateRunningMiles = (calories: number, weightKg: number, gender: string): { 
    miles: number; 
    weightLbs: number;
    caloriesPerMile: number;
  } => {
    const weightLbs = weightKg * 2.20462; // kg to lbs
    
    // Gender-adjusted calorie burn factor per mile per pound
    // Male: ~0.63 cal/lb/mile, Female: ~0.60 cal/lb/mile
    const calorieBurnFactor = gender === 'male' ? 0.63 : 0.60;
    
    const caloriesPerMile = weightLbs * calorieBurnFactor;
    const miles = calories / caloriesPerMile;
    
    return {
      miles: parseFloat(miles.toFixed(1)),
      weightLbs: Math.round(weightLbs),
      caloriesPerMile: Math.round(caloriesPerMile)
    };
  };

  const handlePhotoCapture = async (source: 'camera' | 'gallery') => {
    try {
      let photoData: string;
      let file: File;

      if (!Capacitor.isNativePlatform()) {
        // Web fallback - Mobile Safari requires user gesture
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = false;
        
        // For mobile camera access, use capture attribute
        if (source === 'camera') {
          input.capture = 'environment';
        }
        
        // Style the input to be invisible but accessible
        input.style.position = 'fixed';
        input.style.top = '-1000px';
        input.style.left = '-1000px';
        input.style.opacity = '0';
        input.style.pointerEvents = 'none';
        
        // Add to DOM temporarily for mobile compatibility
        document.body.appendChild(input);
        
        return new Promise<void>((resolve) => {
          input.onchange = async (e) => {
            const selectedFile = (e.target as HTMLInputElement).files?.[0];
            if (selectedFile) {
              try {
                const processedFile = await processImageFile(selectedFile);
                const reader = new FileReader();
                reader.onload = (event) => {
                  const newPhoto: PhotoData = {
                    id: generateId(),
                    dataUrl: event.target?.result as string,
                    file: processedFile,
                    type: 'main_dish',
                    analyzed: false
                  };
                  setPhotos(prev => [...prev, newPhoto]);
                  onStateChange?.('photos_added', { photoCount: photos.length + 1 });
                };
                reader.readAsDataURL(processedFile);
                resolve();
              } catch (error) {
                console.error('Failed to process image:', error);
                toast.error('Failed to process image. Please try again.');
                resolve();
              }
            } else {
              resolve();
            }
            // Clean up
            document.body.removeChild(input);
          };
          // Trigger click - this must happen synchronously from user gesture
          input.click();
        });
      }

      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos
      });

      if (image.dataUrl) {
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        const newFile = new File([blob], `${source}-photo.jpg`, { type: 'image/jpeg' });
        
        const newPhoto: PhotoData = {
          id: generateId(),
          dataUrl: image.dataUrl,
          file: newFile,
          type: 'main_dish',
          analyzed: false
        };
        
        setPhotos(prev => [...prev, newPhoto]);
        onStateChange?.('photos_added', { photoCount: photos.length + 1 });
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast.error('Failed to capture photo. Please try again.');
    }
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id));
  };

  const setPhotoType = (id: string, type: PhotoData['type']) => {
    setPhotos(prev => 
      prev.map(photo => 
        photo.id === id ? { ...photo, type } : photo
      )
    );
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Return the full data URL for proper handling
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Generate SHA-256 hash of image data for caching
  const hashImage = async (data: string): Promise<string> => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleAnalyzeImages = async (forceRefresh = false) => {
    if (photos.length === 0 || !mealType) {
      toast.error('Please add at least one photo and select meal type');
      return;
    }

    setAnalyzing(true);
    onStateChange?.('analyzing', { photoCount: photos.length });
    try {
      // Convert all photos to base64
      const photoData = await Promise.all(
        photos.map(async (photo) => ({
          base64: await convertToBase64(photo.file),
          type: photo.type
        }))
      );

      // Generate cache key from all photos + meal type
      const combinedData = photoData.map(p => p.base64).join('|') + `|${mealType}`;
      const cacheKey = `food_analysis_${await hashImage(combinedData)}`;
      
      // Check cache unless force refresh
      if (!forceRefresh) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const cachedData = JSON.parse(cached);
            // Cache valid for 24 hours
            if (Date.now() - cachedData.timestamp < 24 * 60 * 60 * 1000) {
              console.log('Using cached analysis result');
              const result = cachedData.result;
              setAnalysisResult(result);
              setEditingItems(result.food_items || []);
              onStateChange?.('results', { photoCount: photos.length, hasResults: true });
              
              // Initialize portion multipliers
              const initialMultipliers: { [key: number]: number } = {};
              (result.food_items || []).forEach((_: any, index: number) => {
                initialMultipliers[index] = 1;
              });
              setPortionMultipliers(initialMultipliers);
              
              setPhotos(prev => prev.map(photo => ({ ...photo, analyzed: true })));
              
              toast.success('📋 Analysis loaded from cache for consistency');
              setAnalyzing(false);
              return;
            }
          } catch (e) {
            console.error('Cache parse error:', e);
            localStorage.removeItem(cacheKey);
          }
        }
      }

      // Enhanced analysis with multiple images
      const result = await analyzeFoodImage(
        JSON.stringify(photoData), 
        mealType
      );
      
      // Check if no food items were detected but allow cute_rating responses
      if (!result.food_items || result.food_items.length === 0) {
        // If there's a cute_rating (person/animal detected), show that instead
        if (result.cute_rating?.detected) {
          setAnalysisResult(result);
          setEditingItems([]);
          onStateChange?.('results', { photoCount: photos.length, hasResults: true });
          setPhotos(prev => prev.map(photo => ({ ...photo, analyzed: true })));
          toast.success('✨ ' + (result.cute_rating.whats_good_message || 'Photo analyzed!'));
          return;
        }
        // Otherwise show error for actual food analysis
        toast.error('No food items detected. Please try taking a clearer photo with better lighting.');
        return;
      }
      
      // Cache the result
      localStorage.setItem(cacheKey, JSON.stringify({
        result,
        timestamp: Date.now()
      }));
      
      setAnalysisResult(result);
      setEditingItems(result.food_items || []);
      onStateChange?.('results', { photoCount: photos.length, hasResults: true });
      
      // Initialize portion multipliers
      const initialMultipliers: { [key: number]: number } = {};
      (result.food_items || []).forEach((_: any, index: number) => {
        initialMultipliers[index] = 1;
      });
      setPortionMultipliers(initialMultipliers);
      
      // Mark photos as analyzed
      setPhotos(prev => 
        prev.map(photo => ({ ...photo, analyzed: true }))
      );

      // Start AI conversation if there are questions
      if (result.clarifying_questions?.length > 0) {
        const aiMessage: ChatMessage = {
          id: generateId(),
          type: 'ai',
          content: "I've analyzed your photos! I have a few questions to make the nutrition data more accurate:",
          timestamp: new Date(),
          suggestions: result.clarifying_questions
        };
        setChatMessages([aiMessage]);
        setChatOpen(true);
      }
      
      toast.success('✨ Fresh analysis complete');
      
    } catch (error) {
      console.error('Error analyzing images:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleChatMessage = async (message: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: generateId(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatLoading(true);

    try {
      // Process the message and update nutrition data using Supabase edge function
      const { data: result, error } = await supabase.functions.invoke('process-chat-message', {
        body: {
          message,
          currentAnalysis: analysisResult,
          foodItems: editingItems
        }
      });

      if (error) {
        throw error;
      }
      
      // Add AI response
      const aiMessage: ChatMessage = {
        id: generateId(),
        type: 'ai',
        content: result.response,
        timestamp: new Date(),
        suggestions: result.followUpQuestions
      };
      
      setChatMessages(prev => [...prev, aiMessage]);
      
      // Update food items if changes were made
      if (result.updatedFoodItems) {
        setEditingItems(result.updatedFoodItems);
      }
      
    } catch (error) {
      console.error('Error processing chat message:', error);
      const errorMessage: ChatMessage = {
        id: generateId(),
        type: 'ai',
        content: "I'm having trouble processing that. Could you try rephrasing your question?",
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const updateFoodItemQuantity = (index: number, multiplier: number) => {
    // Update the multiplier state
    setPortionMultipliers(prev => ({
      ...prev,
      [index]: multiplier
    }));

    // Get the original values (base multiplier = 1)
    const originalMultiplier = portionMultipliers[index] || 1;
    const currentItem = editingItems[index];
    
    // Calculate original values by dividing by current multiplier
    const originalCalories = Math.round(currentItem.calories / originalMultiplier);
    const originalProtein = Math.round((currentItem.protein / originalMultiplier) * 10) / 10;
    const originalCarbs = Math.round((currentItem.carbs / originalMultiplier) * 10) / 10;
    const originalFat = Math.round((currentItem.fat / originalMultiplier) * 10) / 10;
    
    // Apply new multiplier to original values
    const updated = [...editingItems];
    updated[index] = {
      ...currentItem,
      calories: Math.round(originalCalories * multiplier),
      protein: Math.round(originalProtein * multiplier * 10) / 10,
      carbs: Math.round(originalCarbs * multiplier * 10) / 10,
      fat: Math.round(originalFat * multiplier * 10) / 10,
    };
    
    setEditingItems(updated);
  };

  const updateFoodItem = (index: number, field: keyof FoodItem, value: any) => {
    const updated = [...editingItems];
    updated[index] = { ...updated[index], [field]: value };
    setEditingItems(updated);
  };

  const removeFoodItem = (index: number) => {
    setEditingItems(items => items.filter((_, i) => i !== index));
  };

  const addFoodItem = () => {
    setEditingItems([...editingItems, {
      name: '',
      quantity: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      confidence: 1.0
    }]);
  };

  const handleSaveFoodEntry = async () => {
    if (!analysisResult || !mealType) {
      toast.error('Please analyze photos and select a meal type first');
      return;
    }

    if (editingItems.length === 0) {
      toast.error('No food items to save');
      return;
    }

    // MANDATORY PHOTO REQUIREMENT
    if (photos.length === 0) {
      toast.error('Please add at least one photo before saving the food entry');
      return;
    }

    if (isSaving) return; // Prevent multiple submissions

    setIsSaving(true);

    try {
      // Upload multiple photos - THIS IS NOW MANDATORY
      let photoUrls: string[] = [];
      let photoStoragePaths: string[] = [];
      let thumbnailUrls: string[] = [];
      let photoUrl: string | undefined; // Keep for backward compatibility
      let photoStoragePath: string | undefined;
      let thumbnailUrl: string | undefined;

      console.log(`Uploading ${photos.length} photos for food entry (REQUIRED)...`);
      
      const { FoodPhotoUploadService } = await import('../services/foodPhotoUploadService');
      const uploadResults = await FoodPhotoUploadService.uploadMultipleFoodPhotos(
        photos,
        mealType
      );
      
      // STRICT VALIDATION: Food entry cannot be saved without photos
      if (!uploadResults.success || uploadResults.photos.length === 0) {
        console.error('Critical: Photo upload failed completely:', uploadResults.errors);
        toast.error('Failed to upload photos. Food entry cannot be saved without photos. Please try again.');
        setIsSaving(false);
        return;
      }

      photoUrls = uploadResults.photos.map(p => p.photoUrl);
      photoStoragePaths = uploadResults.photos.map(p => p.storagePath);
      thumbnailUrls = uploadResults.photos.map(p => p.thumbnailUrl).filter(Boolean);
      
      // Set first photo for backward compatibility
      photoUrl = photoUrls[0];
      photoStoragePath = photoStoragePaths[0];
      thumbnailUrl = thumbnailUrls[0];
      
      console.log('Photos uploaded successfully:', {
        totalPhotos: uploadResults.photos.length,
        successfulUploads: photoUrls.length,
        errors: uploadResults.errors.length
      });
      
      // Show partial success warning if some photos failed
      if (uploadResults.errors.length > 0) {
        toast.warning(`${photoUrls.length} photos uploaded successfully, ${uploadResults.errors.length} failed: ${uploadResults.errors.join(', ')}`);
      } else {
        toast.success(`All ${photoUrls.length} photos uploaded successfully!`);
      }

      const totalCalories = editingItems.reduce((sum, item) => sum + item.calories, 0);
      const totalProtein = editingItems.reduce((sum, item) => sum + item.protein, 0);
      const totalCarbs = editingItems.reduce((sum, item) => sum + item.carbs, 0);
      const totalFat = editingItems.reduce((sum, item) => sum + item.fat, 0);

      await saveFoodEntry({
        meal_type: mealType as any,
        food_items: editingItems,
        total_calories: totalCalories,
        total_protein: totalProtein,
        total_carbs: totalCarbs,
        total_fat: totalFat,
        photo_url: photoUrl,
        photo_storage_path: photoStoragePath,
        thumbnail_url: thumbnailUrl,
        ...(photoUrls.length > 0 && { 
          photo_urls: photoUrls,
          photo_storage_paths: photoStoragePaths,
          thumbnail_urls: thumbnailUrls.length > 0 ? thumbnailUrls : undefined
        }),
        ai_analyzed: true,
        user_confirmed: true,
        notes: notes,
        logged_date: getCurrentLocalDate()
      });

      // Reset form
      setPhotos([]);
      setMealType('');
      setAnalysisResult(null);
      setEditingItems([]);
      setPortionMultipliers({});
      setNotes('');
      setChatMessages([]);
      setChatOpen(false);
      
      onDataChange?.();
      toast.success('Food entry saved successfully!');
    } catch (error: any) {
      console.error('Error saving food entry:', error);
      
      // Provide specific error messages based on error type
      if (error?.message?.includes('Failed to fetch')) {
        toast.error('Network error - please check your connection and try again');
      } else if (error?.message?.includes('connection termination')) {
        toast.error('Connection lost - please try again in a moment');
      } else if (error?.message?.includes('503')) {
        toast.error('Service temporarily unavailable - please try again');
      } else {
        toast.error('Failed to save food entry - please try again');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiFoodItemsFound = (items: FoodItem[]) => {
    setEditingItems(items);
    const totalCalories = items.reduce((sum, item) => sum + item.calories, 0);
    const totalProtein = items.reduce((sum, item) => sum + item.protein, 0);
    const totalCarbs = items.reduce((sum, item) => sum + item.carbs, 0);
    const totalFat = items.reduce((sum, item) => sum + item.fat, 0);
    
    setAnalysisResult({
      food_items: items,
      total_calories: totalCalories,
      total_protein: totalProtein,
      total_carbs: totalCarbs,
      total_fat: totalFat,
      confidence: items.length > 0 ? items[0].confidence : 1.0,
      clarifying_questions: []
    });
    onStateChange?.('results', { photoCount: 0, hasResults: true });
  };

  return (
    <div className="space-y-8">
      {/* Storage Validation */}
      {showValidation && (
        <PhotoUploadValidator 
          onValidationComplete={(isValid) => {
            setStorageValidated(isValid);
            if (isValid) {
              setTimeout(() => setShowValidation(false), 3000);
            }
          }}
        />
      )}

      <Card className="glow-card border-gradient overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />
          <CardTitle className="flex items-center justify-center gap-3 text-2xl relative z-10">
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { repeat: Infinity, duration: 8, ease: "linear" },
                scale: { repeat: Infinity, duration: 2, ease: "easeInOut" }
              }}
            >
              <Sparkles className="h-8 w-8 text-primary" />
            </motion.div>
            Enhanced AI Food Analyzer
            <motion.div
              animate={{ 
                y: [0, -5, 0],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5,
                ease: "easeInOut"
              }}
            >
              <Award className="h-6 w-6 text-yellow-500" />
            </motion.div>
          </CardTitle>
          <p className="text-center text-muted-foreground relative z-10">
            Powered by advanced AI vision - Get detailed nutritional insights in seconds ⚡
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Photo Capture */}
          <div className="space-y-6">
            {/* Hero Image */}
            <div className="rounded-xl overflow-hidden">
              <img 
                src={foodAnalyzerGuide} 
                alt="How to scan your food for nutritional analysis" 
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold flex items-center justify-center gap-2 mb-2">
                <Camera className="h-6 w-6 text-primary" />
                Capture Your Food
              </h3>
              <p className="text-muted-foreground">
                Take multiple photos for the most accurate nutritional analysis
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handlePhotoCapture('camera')}
                  className="w-full h-16 sm:h-20 flex flex-col items-center gap-2 glow-hover border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 touch-manipulation"
                >
                  <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  <span className="font-semibold text-sm sm:text-base">Take Photo</span>
                  <span className="text-xs text-muted-foreground hidden sm:block">Use camera</span>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handlePhotoCapture('gallery')}
                  className="w-full h-16 sm:h-20 flex flex-col items-center gap-2 glow-hover border-green-500/20 hover:border-green-500/40 hover:bg-green-500/5 transition-all duration-300 touch-manipulation"
                >
                  <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                  <span className="font-semibold text-sm sm:text-base">Upload Photo</span>
                  <span className="text-xs text-muted-foreground hidden sm:block">From gallery</span>
                </Button>
              </motion.div>
            </div>

            <PhotoManager
              photos={photos}
              onRemovePhoto={removePhoto}
              onSetPhotoType={setPhotoType}
            />
          </div>

          {/* Meal Type Selection */}
          <div className="space-y-3">
            <Label>Meal Type</Label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger>
                <SelectValue placeholder="Select meal type" />
              </SelectTrigger>
              <SelectContent>
                {mealTypes.map((meal) => (
                  <SelectItem key={meal.value} value={meal.value}>
                    <span className="flex items-center gap-2">
                      <span>{meal.icon}</span>
                      {meal.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Analysis Tips Card */}
          {photos.length > 0 && mealType && (
            <Card className="bg-info/5 border-info/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-info/10">
                      <Target className="h-5 w-5 text-info" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-info flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Multi-Photo Analysis Tips
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      For best results, take photos of different aspects of your meal:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                      <div className="text-xs space-y-1">
                        <p className="font-medium text-foreground">Photo Types:</p>
                        <p className="text-muted-foreground">• Main dish from above</p>
                        <p className="text-muted-foreground">• Side view for portions</p>
                        <p className="text-muted-foreground">• Nutrition labels on packages</p>
                      </div>
                      <div className="text-xs space-y-1">
                        <p className="font-medium text-foreground">Brand Recognition:</p>
                        <p className="text-muted-foreground">• Package fronts and backs</p>
                        <p className="text-muted-foreground">• Ingredient lists</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analyze Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="space-y-2"
          >
            <Button
              onClick={() => handleAnalyzeImages(false)}
              disabled={photos.length === 0 || !mealType || analyzing || loading}
              className="w-full glow-button bg-gradient-to-r from-primary to-primary/80 border-0 text-lg py-6 shadow-lg hover:shadow-xl transition-all duration-300"
              size="lg"
            >
              {!analyzing && (
                <>
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  >
                    <Sparkles className="h-5 w-5 mr-3" />
                  </motion.div>
                  <span className="flex items-center gap-2">
                    Analyze {photos.length || 0} Photo{photos.length !== 1 ? 's' : ''} with AI Magic
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      ✨
                    </motion.span>
                  </span>
                </>
              )}
            </Button>

            {analyzing && (
              <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="py-5">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <div>
                        <h3 className="font-semibold text-lg">Analyzing Photos</h3>
                        <p className="text-sm text-muted-foreground">{analysisStage}</p>
                      </div>
                    </div>
                    <Progress value={analysisProgress} className="h-2" />
                    <div className="flex justify-between text-sm">
                      <span className="text-primary font-medium">{analysisStage}</span>
                      <span className="text-muted-foreground">{analysisProgress}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {analysisResult && (
              <Button
                onClick={() => handleAnalyzeImages(true)}
                disabled={photos.length === 0 || !mealType || analyzing || loading}
                variant="outline"
                size="sm"
                className="w-full"
                title="Force a fresh analysis, bypassing cache"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-analyze (Fresh)
              </Button>
            )}
          </motion.div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      {analysisResult && (
        <FoodChatInterface
          messages={chatMessages}
          onSendMessage={handleChatMessage}
          onSuggestionClick={handleChatMessage}
          isLoading={chatLoading}
          isOpen={chatOpen}
          onToggle={() => setChatOpen(!chatOpen)}
        />
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cute Rating Display (when no food detected) */}
              {editingItems.length === 0 && analysisResult?.cute_rating?.detected && (
                <Card className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 border-2 border-pink-200 dark:border-pink-900">
                  <CardContent className="p-6 space-y-4">
                    <div className="text-center space-y-3">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="flex justify-center"
                      >
                        <div className="bg-gradient-to-br from-pink-400 to-purple-500 rounded-full p-4">
                          <Sparkles className="h-8 w-8 text-white" />
                        </div>
                      </motion.div>
                      
                      <div>
                        <h3 className="text-2xl font-bold text-pink-700 dark:text-pink-300 mb-2">
                          {analysisResult.cute_rating.rating || "10/10"}
                        </h3>
                        <p className="text-lg font-medium text-pink-600 dark:text-pink-400">
                          {analysisResult.cute_rating.compliment}
                        </p>
                      </div>
                      
                      {analysisResult.suggestions && analysisResult.suggestions.length > 0 && (
                        <div className="mt-4 text-sm text-muted-foreground italic">
                          {analysisResult.suggestions[0]}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Health Grade Analysis */}
              {editingItems.length > 0 && (() => {
                const totalCalories = editingItems.reduce((sum, item) => sum + item.calories, 0);
                const totalProtein = editingItems.reduce((sum, item) => sum + item.protein, 0);
                const totalCarbs = editingItems.reduce((sum, item) => sum + item.carbs, 0);
                const totalFat = editingItems.reduce((sum, item) => sum + item.fat, 0);
                const gradeResult = calculateHealthGrade(editingItems, totalCalories, totalProtein, totalCarbs, totalFat);
                
                return (
                  <Card className="bg-muted/30 border-2">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center gap-3">
                        <Award className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Health Grade</span>
                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full border-2 ${getGradeBgColor(gradeResult.grade)}`}>
                          <span className={`text-lg font-bold ${getGradeColor(gradeResult.grade)}`}>
                            {gradeResult.grade}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground italic ml-auto">
                          {(() => {
                            const grade = gradeResult.grade;
                            const hasProcessed = gradeResult.cons.some(con => 
                              con.toLowerCase().includes('processed')
                            );
                            if (grade === 'D' || grade === 'F') {
                              if (hasProcessed) return "⚠️ Ultra-processed foods";
                              return "⚠️ Highly processed";
                            }
                            if (grade.startsWith('C')) return "Moderately processed";
                            if (grade.startsWith('B')) return "Lightly processed";
                            return "Whole foods";
                          })()}
                        </div>
                      </div>
                      
                      {(gradeResult.pros.length > 0 || analysisResult?.cute_rating?.detected) && (
                        <div>
                          <h5 className="font-medium text-stats-exercises mb-2 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            What's Good
                          </h5>
                          <ul className="space-y-1">
                            {analysisResult?.cute_rating?.detected && (
                              <motion.li
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5 }}
                                className="text-sm font-medium flex items-start gap-2 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 p-2 rounded-md border border-pink-200 dark:border-pink-900"
                              >
                                <Sparkles className="h-3 w-3 text-pink-500 mt-1 flex-shrink-0" />
                                <span className="text-pink-700 dark:text-pink-300">
                                  {analysisResult.cute_rating.whats_good_message || analysisResult.cute_rating.compliment}
                                </span>
                              </motion.li>
                            )}
                            {gradeResult.pros.map((pro, index) => (
                              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                <CheckCircle2 className="h-3 w-3 text-stats-exercises mt-1 flex-shrink-0" />
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {gradeResult.cons.length > 0 && (
                        <div>
                          <h5 className="font-medium text-destructive mb-2 flex items-center gap-1">
                            <XCircle className="h-4 w-4" />
                            Areas for Improvement
                          </h5>
                          <ul className="space-y-1">
                            {gradeResult.cons.map((con, index) => (
                              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                <XCircle className="h-3 w-3 text-destructive mt-1 flex-shrink-0" />
                                {con}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Scale Analysis Display */}
              {analysisResult?.scale_analysis && (
                <Card className="bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-200/50 dark:border-blue-800/50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                        <Ruler className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="font-semibold text-blue-700 dark:text-blue-300">Portion Scale Analysis</span>
                      {analysisResult.scale_analysis.confidence_level && (
                        <Badge 
                          variant="outline" 
                          className={`ml-auto text-xs ${
                            analysisResult.scale_analysis.confidence_level === 'high' 
                              ? 'border-green-500 text-green-600 dark:text-green-400' 
                              : analysisResult.scale_analysis.confidence_level === 'medium'
                              ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400'
                              : 'border-red-500 text-red-600 dark:text-red-400'
                          }`}
                        >
                          {analysisResult.scale_analysis.confidence_level === 'high' && '⭐⭐⭐'}
                          {analysisResult.scale_analysis.confidence_level === 'medium' && '⭐⭐'}
                          {analysisResult.scale_analysis.confidence_level === 'low' && '⭐'}
                          {' '}{analysisResult.scale_analysis.confidence_level} confidence
                        </Badge>
                      )}
                    </div>

                    {/* Reference Objects Detected */}
                    {analysisResult.scale_analysis.reference_objects_detected?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Eye className="h-3 w-3" /> References:
                        </span>
                        {analysisResult.scale_analysis.reference_objects_detected.map((obj: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                            {obj}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Plate Size & Coverage */}
                    {(analysisResult.scale_analysis.plate_size_estimate || analysisResult.scale_analysis.portion_coverage) && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {analysisResult.scale_analysis.plate_size_estimate && (
                          <div className="bg-white/50 dark:bg-black/20 rounded-lg p-2">
                            <span className="text-muted-foreground">Plate:</span>{' '}
                            <span className="font-medium text-foreground">{analysisResult.scale_analysis.plate_size_estimate}</span>
                          </div>
                        )}
                        {analysisResult.scale_analysis.portion_coverage && (
                          <div className="bg-white/50 dark:bg-black/20 rounded-lg p-2">
                            <span className="text-muted-foreground">Coverage:</span>{' '}
                            <span className="font-medium text-foreground">{analysisResult.scale_analysis.portion_coverage}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Piece Counts */}
                    {analysisResult.scale_analysis.piece_counts && Object.keys(analysisResult.scale_analysis.piece_counts).length > 0 && (
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Scale className="h-3 w-3" /> Piece Counts:
                        </span>
                        <div className="grid gap-1">
                          {Object.entries(analysisResult.scale_analysis.piece_counts).map(([item, data]: [string, any]) => (
                            <div key={item} className="text-xs bg-white/50 dark:bg-black/20 rounded-lg p-2 flex justify-between items-center">
                              <span className="font-medium capitalize">{item.replace(/_/g, ' ')}</span>
                              <span className="text-muted-foreground">
                                {data.count} × {data.weight_per_piece} = <span className="font-semibold text-foreground">{data.total_weight}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dimensional Estimates */}
                    {analysisResult.scale_analysis.dimensional_estimates && Object.keys(analysisResult.scale_analysis.dimensional_estimates).length > 0 && (
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Ruler className="h-3 w-3" /> Dimensional Analysis:
                        </span>
                        <div className="grid gap-1">
                          {Object.entries(analysisResult.scale_analysis.dimensional_estimates).map(([item, estimate]: [string, any]) => (
                            <div key={item} className="text-xs bg-white/50 dark:bg-black/20 rounded-lg p-2">
                              <span className="font-medium capitalize">{item.replace(/_/g, ' ')}:</span>{' '}
                              <span className="text-muted-foreground">{estimate}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Confidence Factors */}
                    {analysisResult.scale_analysis.confidence_factors?.length > 0 && (
                      <div className="text-xs text-muted-foreground pt-1 border-t border-blue-200/50 dark:border-blue-800/50">
                        <span className="font-medium">Estimation based on:</span>{' '}
                        {analysisResult.scale_analysis.confidence_factors.join(', ')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Food Items Editor with Animated Counters */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Detected Food Items</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={addFoodItem}
                  >
                    Add Item
                  </Button>
                </div>
                
                <div className="space-y-6">
                  {editingItems.map((item, index) => (
                    <Card key={index} className="overflow-hidden border-muted/40 bg-gradient-to-br from-background to-muted/10 hover:shadow-lg transition-all duration-300">
                      <CardHeader className="pb-4 bg-gradient-to-r from-muted/20 to-muted/10 border-b border-muted/30">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xl text-foreground">{item.name}</h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFoodItem(index)}
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors rounded-full"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="p-6 space-y-6">
                        {/* Quantity Slider Section */}
                         <div className="bg-muted/20 rounded-xl p-5 border border-muted/30">
                           <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 block">Portion Control</Label>
                           <AnimatedCounter
                             value={portionMultipliers[index] || 1}
                             onChange={(multiplier) => updateFoodItemQuantity(index, multiplier)}
                             min={0.25}
                             max={5}
                             step={0.25}
                             label=""
                             unit="×"
                             presets={[
                               { label: "Quarter", value: 0.25 },
                               { label: "Half", value: 0.5 },
                               { label: "Normal", value: 1 },
                               { label: "Large", value: 1.5 },
                               { label: "XL", value: 2 }
                             ]}
                           />
                         </div>
                        
                         {/* Primary Nutrition Display */}
                         <div className="space-y-3">
                           <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Key Nutrition</Label>
                           <div className="grid grid-cols-2 gap-4">
                             <div className="relative overflow-hidden rounded-2xl bg-card border-2 border-border p-5 group hover:scale-105 transition-transform duration-200 hover:shadow-lg">
                               <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full -translate-y-10 translate-x-10"></div>
                               <div className="relative">
                                 <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Calories</p>
                                 <p className="text-4xl font-black text-red-500 leading-none">{item.calories}</p>
                                 <p className="text-xs text-muted-foreground mt-1 font-medium">kcal</p>
                               </div>
                             </div>
                             <div className="relative overflow-hidden rounded-2xl bg-card border-2 border-border p-5 group hover:scale-105 transition-transform duration-200 hover:shadow-lg">
                               <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -translate-y-10 translate-x-10"></div>
                               <div className="relative">
                                 <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Protein</p>
                                 <p className="text-4xl font-black text-emerald-500 leading-none">{item.protein}<span className="text-2xl font-bold text-emerald-400">g</span></p>
                                 <p className="text-xs text-muted-foreground mt-1 font-medium">grams</p>
                               </div>
                             </div>
                           </div>
                         </div>

                         {/* Secondary Nutrition */}
                         <div className="grid grid-cols-2 gap-4">
                           <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow hover:scale-105 duration-200">
                             <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Carbs</p>
                             <p className="text-2xl font-black text-orange-500">{item.carbs}<span className="text-lg font-semibold text-orange-400">g</span></p>
                           </div>
                           <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow hover:scale-105 duration-200">
                             <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Fat</p>
                             <p className="text-2xl font-black text-purple-500">{item.fat}<span className="text-lg font-semibold text-purple-400">g</span></p>
                           </div>
                         </div>
                        
                        {/* Advanced Editing Section */}
                        <div className="bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl p-5 border border-muted/40">
                          <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 block flex items-center gap-2">
                            <Edit3 className="h-4 w-4" />
                            Manual Adjustments
                          </Label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Calories</Label>
                              <Input
                                type="number"
                                value={item.calories}
                                onChange={(e) => updateFoodItem(index, 'calories', parseInt(e.target.value) || 0)}
                                className="h-10 text-sm bg-background/70 border-muted/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Protein</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={item.protein}
                                onChange={(e) => updateFoodItem(index, 'protein', parseFloat(e.target.value) || 0)}
                                className="h-10 text-sm bg-background/70 border-muted/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Carbs</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={item.carbs}
                                onChange={(e) => updateFoodItem(index, 'carbs', parseFloat(e.target.value) || 0)}
                                className="h-10 text-sm bg-background/70 border-muted/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Fat</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={item.fat}
                                onChange={(e) => updateFoodItem(index, 'fat', parseFloat(e.target.value) || 0)}
                                className="h-10 text-sm bg-background/70 border-muted/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Summary Totals */}
              {editingItems.length > 0 && (
                <Card className="bg-muted/30 border-2 border-muted/40">
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-4 text-lg">Meal Totals</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all hover:scale-105 duration-200">
                        <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide mb-2">Calories</p>
                        <p className="text-3xl font-black text-red-500">
                          {editingItems.reduce((sum, item) => sum + item.calories, 0)}
                        </p>
                      </div>
                      <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all hover:scale-105 duration-200">
                        <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide mb-2">Protein</p>
                        <p className="text-3xl font-black text-emerald-500">
                          {editingItems.reduce((sum, item) => sum + item.protein, 0).toFixed(1)}<span className="text-xl font-bold text-emerald-400">g</span>
                        </p>
                      </div>
                      <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all hover:scale-105 duration-200">
                        <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide mb-2">Carbs</p>
                        <p className="text-3xl font-black text-orange-500">
                          {editingItems.reduce((sum, item) => sum + item.carbs, 0).toFixed(1)}<span className="text-xl font-bold text-orange-400">g</span>
                        </p>
                      </div>
                      <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all hover:scale-105 duration-200">
                        <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide mb-2">Fat</p>
                        <p className="text-3xl font-black text-purple-500">
                          {editingItems.reduce((sum, item) => sum + item.fat, 0).toFixed(1)}<span className="text-xl font-bold text-purple-400">g</span>
                        </p>
                      </div>
                    </div>

                    {/* Running Equivalent Section */}
                    {(() => {
                      const totalCalories = editingItems.reduce((sum, item) => sum + item.calories, 0);
                      const effectiveWeight = userProfile?.weight_kg || 70; // 70kg = 154lbs default
                      const effectiveGender = userProfile?.gender || 'other';
                      const usingDefaults = !userProfile?.weight_kg;
                      
                      const runningData = calculateRunningMiles(totalCalories, effectiveWeight, effectiveGender);
                      
                      return (
                        <div className="mt-6 pt-6 border-t border-border">
                          <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <span className="text-2xl">🏃</span>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm mb-1">Running Equivalent</h4>
                                <div className="text-2xl font-bold text-primary">
                                  {runningData.miles} miles
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  To burn off these {Math.round(totalCalories)} calories
                                </p>
                                <div className="mt-2 pt-2 border-t border-primary/20 dark:border-primary/30">
                                  <p className="text-xs text-muted-foreground">
                                    📊 {usingDefaults ? 'Estimated for' : 'Based on your profile:'} {runningData.weightLbs} lbs, {effectiveGender}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    (~{runningData.caloriesPerMile} cal/mile at moderate pace)
                                  </p>
                                </div>
                                {usingDefaults && (
                                  <div className="mt-2 p-2 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 rounded">
                                    <p className="text-xs text-amber-600 dark:text-amber-400">
                                      ⚠️ Using default weight (154 lbs). Complete your profile for personalized calculations.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add specific details to improve accuracy (e.g., 'vegan cheese', 'grilled not fried', 'whole wheat bread', 'plant-based milk')..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  💡 Tip: Specific details about ingredients and preparation methods help the AI provide more accurate nutritional calculations.
                </p>
              </div>

              {/* Suggestions */}
              {analysisResult.suggestions && analysisResult.suggestions.length > 0 && (
                <div className="space-y-2">
                  <Label>AI Suggestions</Label>
                  <Card className="bg-info/5 border-info/20">
                    <CardContent className="p-4">
                      <ul className="space-y-2">
                        {analysisResult.suggestions.map((suggestion: string, index: number) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-info mt-0.5 flex-shrink-0" />
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Save Button */}
              <Button 
                onClick={handleSaveFoodEntry} 
                className="w-full" 
                size="lg"
                disabled={isSaving || !analysisResult || !mealType || editingItems.length === 0}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save to Food Log
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

    </div>
  );
};