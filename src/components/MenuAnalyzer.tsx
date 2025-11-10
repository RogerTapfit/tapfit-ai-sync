import { useState, useRef } from "react";
import { Camera, Upload, Loader2, Send, Sparkles, Heart, Trash2, BookOpen, Plus, X, ChevronLeft, ChevronRight, Scale } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSavedMenuItems } from "@/hooks/useSavedMenuItems";

interface MenuItem {
  name: string;
  calories?: number;
  price?: number;
  description?: string;
  dietaryTags?: string[];
  healthScore?: number;
  confidence?: string;
  macros?: {
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

interface MenuAnalysisResult {
  restaurantName?: string;
  menuItems: MenuItem[];
  recommendations: {
    healthiest: MenuItem[];
    bestValue: MenuItem[];
  };
  insights: string[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface RecommendationCard {
  itemName: string;
  calories?: number;
  price?: number;
  reason: string;
  emoji?: string;
  macros?: {
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  dietaryTags?: string[];
}

const QUICK_ACTIONS = [
  { id: 'healthiest', label: 'Healthiest option', icon: '🥗', emoji: '💚', prompt: 'Show me the top 3 healthiest items on this menu.' },
  { id: 'low-calorie', label: 'Lowest calorie', icon: '🔥', emoji: '🔥', prompt: 'What are the 3 lowest calorie options?' },
  { id: 'vegan', label: 'Vegan options', icon: '🥑', emoji: '🌱', prompt: 'Show me all the vegan options available.' },
  { id: 'gluten-free', label: 'Gluten-free', icon: '🌾', emoji: '✨', prompt: 'Which items are gluten-free?' },
  { id: 'high-protein', label: 'High protein', icon: '💪', emoji: '💪', prompt: 'What are the highest protein items?' },
  { id: 'low-sugar', label: 'Low sugar', icon: '🥤', emoji: '🎯', prompt: 'Show me low sugar options.' },
  { id: 'best-value', label: 'Best value', icon: '💰', emoji: '💰', prompt: 'What items give the best value for money?' }
];

export const MenuAnalyzer = () => {
  const [menuImages, setMenuImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<MenuAnalysisResult | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationCard[]>([]);
  const [recommendationType, setRecommendationType] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'menu' | 'favorites'>('menu');
  const [comparisonItems, setComparisonItems] = useState<MenuItem[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    savedItems, 
    loading: favoritesLoading,
    savingItemId,
    isItemSaved, 
    saveMenuItem, 
    deleteSavedMenuItem 
  } = useSavedMenuItems();

  const handleImageCapture = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setMenuImages(prev => [...prev, base64]);
      setCurrentImageIndex(menuImages.length);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (index: number) => {
    setMenuImages(prev => prev.filter((_, i) => i !== index));
    if (currentImageIndex >= menuImages.length - 1) {
      setCurrentImageIndex(Math.max(0, menuImages.length - 2));
    }
  };

  const handleCameraClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleImageCapture(file);
    };
    input.click();
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const analyzeMenu = async () => {
    if (menuImages.length === 0) return;

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyzeMenu', {
        body: { 
          imageBase64: menuImages.length === 1 ? menuImages[0] : menuImages,
          mode: 'analyze'
        }
      });

      if (error) throw error;

      setAnalysisResult(data);
      toast.success(`Menu analyzed successfully! Found ${data.menuItems?.length || 0} items.`);
    } catch (error) {
      console.error('Error analyzing menu:', error);
      toast.error('Failed to analyze menu. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const sendChatMessage = async (message: string) => {
    if (menuImages.length === 0 || !message.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: message };
    setChatMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setChatLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyzeMenu', {
        body: { 
          imageBase64: menuImages.length === 1 ? menuImages[0] : menuImages,
          mode: 'chat',
          message: message,
          conversationHistory: chatMessages
        }
      });

      if (error) throw error;

      // Check if response is structured recommendation
      if (data.type === 'recommendation') {
        setRecommendations(data.cards || []);
        setRecommendationType(data.recommendationType || 'Recommendations');
      } else {
        // Regular chat response
        const assistantMessage: ChatMessage = { role: 'assistant', content: data.response };
        setChatMessages(prev => [...prev, assistantMessage]);
      }
      
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to get response. Please try again.');
    } finally {
      setChatLoading(false);
    }
  };

  const handleQuickAction = (prompt: string) => {
    sendChatMessage(prompt);
  };

  const getHealthScoreColor = (score?: number) => {
    if (!score) return 'bg-muted text-muted-foreground';
    if (score >= 80) return 'bg-green-500 text-white';
    if (score >= 60) return 'bg-yellow-500 text-white';
    return 'bg-orange-500 text-white';
  };

  const handleSaveItem = async (item: MenuItem) => {
    await saveMenuItem(
      item,
      analysisResult?.restaurantName,
      undefined
    );
  };

  const handleAddToCompare = (item: MenuItem) => {
    if (comparisonItems.length >= 2) {
      toast.error('You can only compare 2 items at a time');
      return;
    }
    if (comparisonItems.find(i => i.name === item.name)) {
      toast.error('This item is already selected for comparison');
      return;
    }
    setComparisonItems(prev => [...prev, item]);
    toast.success(`Added ${item.name} to comparison`);
    
    if (comparisonItems.length === 1) {
      setShowComparison(true);
    }
  };

  const handleRemoveFromCompare = (itemName: string) => {
    setComparisonItems(prev => prev.filter(i => i.name !== itemName));
  };

  const handleClearComparison = () => {
    setComparisonItems([]);
    setShowComparison(false);
  };

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'menu' | 'favorites')} className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="menu" className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Menu Scanner
        </TabsTrigger>
        <TabsTrigger value="favorites" className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Saved Favorites ({savedItems.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="menu" className="space-y-6">
        {/* Comparison Bar */}
        {comparisonItems.length > 0 && (
          <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <Scale className="h-5 w-5 text-primary" />
                  <div className="flex gap-2 flex-1 flex-wrap">
                    {comparisonItems.map((item) => (
                      <Badge key={item.name} variant="secondary" className="text-sm py-1.5 px-3">
                        {item.name}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-4 w-4 ml-2 p-0"
                          onClick={() => handleRemoveFromCompare(item.name)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                    {comparisonItems.length === 1 && (
                      <Badge variant="outline" className="text-sm py-1.5 px-3 border-dashed">
                        Select 1 more item
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {comparisonItems.length === 2 && (
                    <Button onClick={() => setShowComparison(true)} size="sm">
                      Compare
                    </Button>
                  )}
                  <Button onClick={handleClearComparison} variant="ghost" size="sm">
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Section */}
        {menuImages.length === 0 && (
        <Card className="border-dashed border-2 bg-gradient-to-br from-card to-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Menu Scanner
            </CardTitle>
            <CardDescription>
              Take photos of any restaurant menu, menu board, or drive-thru display
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button 
                onClick={handleCameraClick} 
                size="lg"
                className="h-24 flex flex-col gap-2 bg-gradient-to-r from-primary to-primary/80"
              >
                <Camera className="h-8 w-8" />
                Take Photo
              </Button>
              <Button 
                onClick={handleFileSelect} 
                size="lg"
                variant="outline"
                className="h-24 flex flex-col gap-2"
              >
                <Upload className="h-8 w-8" />
                Upload Menu
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageCapture(file);
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Image Gallery & Preview */}
      {menuImages.length > 0 && !analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle>Menu Images ({menuImages.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main image display */}
            <div className="relative">
              <img 
                src={menuImages[currentImageIndex]} 
                alt={`Menu photo ${currentImageIndex + 1}`}
                className="w-full h-auto rounded-lg border"
              />
              {menuImages.length > 1 && (
                <>
                  <div className="absolute bottom-3 right-3 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                    Photo {currentImageIndex + 1} of {menuImages.length}
                  </div>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                    disabled={currentImageIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setCurrentImageIndex(Math.min(menuImages.length - 1, currentImageIndex + 1))}
                    disabled={currentImageIndex === menuImages.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            
            {/* Thumbnail strip */}
            {menuImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {menuImages.map((img, idx) => (
                  <div key={idx} className="relative flex-shrink-0">
                    <img 
                      src={img} 
                      alt={`Thumbnail ${idx + 1}`}
                      className={`h-16 w-16 object-cover rounded cursor-pointer border-2 transition-all ${
                        idx === currentImageIndex ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setCurrentImageIndex(idx)}
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0"
                      onClick={() => handleRemoveImage(idx)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-3">
              <Button 
                onClick={analyzeMenu} 
                disabled={analyzing}
                className="flex-1 bg-gradient-to-r from-primary to-primary/80"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Analyzing {menuImages.length > 1 ? `${menuImages.length} photos` : 'menu'}...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze {menuImages.length > 1 ? 'All Photos' : 'Menu'}
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleFileSelect}
                disabled={analyzing}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Photo
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setMenuImages([]);
                  setCurrentImageIndex(0);
                  setAnalysisResult(null);
                  setChatMessages([]);
                }}
                disabled={analyzing}
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Items */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{analysisResult.restaurantName || 'Menu Items'}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setMenuImages([]);
                      setCurrentImageIndex(0);
                      setAnalysisResult(null);
                      setChatMessages([]);
                    }}
                  >
                    New Menu
                  </Button>
                </CardTitle>
                <CardDescription>
                  {analysisResult.menuItems.length} items found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {analysisResult.menuItems.map((item, idx) => (
                      <Card key={idx} className="border-l-4 border-l-primary/50">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start gap-3 mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-base">{item.name}</h3>
                              {item.description && (
                                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {item.healthScore && (
                                <Badge className={getHealthScoreColor(item.healthScore)}>
                                  {item.healthScore}/100
                                </Badge>
                              )}
                              <Button
                                size="icon"
                                variant={comparisonItems.find(i => i.name === item.name) ? "default" : "outline"}
                                onClick={() => handleAddToCompare(item)}
                                disabled={comparisonItems.length >= 2 && !comparisonItems.find(i => i.name === item.name)}
                                className="h-8 w-8"
                                title="Add to compare"
                              >
                                <Scale className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant={isItemSaved(item.name, analysisResult?.restaurantName) ? "default" : "ghost"}
                                onClick={() => handleSaveItem(item)}
                                disabled={savingItemId === item.name || isItemSaved(item.name, analysisResult?.restaurantName)}
                                className="h-8 w-8"
                              >
                                <Heart className={`h-4 w-4 ${isItemSaved(item.name, analysisResult?.restaurantName) ? 'fill-current' : ''}`} />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-3">
                            {item.calories && (
                              <Badge variant="outline">🔥 {item.calories} cal</Badge>
                            )}
                            {item.price && (
                              <Badge variant="outline">💰 ${item.price.toFixed(2)}</Badge>
                            )}
                            {item.macros?.protein && (
                              <Badge variant="outline">💪 {item.macros.protein}g protein</Badge>
                            )}
                            {item.confidence && (
                              <Badge variant="secondary" className="text-xs">{item.confidence}</Badge>
                            )}
                            {item.dietaryTags?.map((tag, i) => (
                              <Badge key={i} variant="secondary">{tag}</Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Chatbot Panel */}
          <div className="space-y-4">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-base">Ask About Menu</CardTitle>
                <CardDescription className="text-xs">
                  Get personalized recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map((action, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction(action.prompt)}
                      disabled={chatLoading}
                      className="h-auto py-3 flex flex-col items-center gap-1 text-xs"
                    >
                      <span className="text-lg">{action.icon}</span>
                      <span className="text-center leading-tight">{action.label}</span>
                    </Button>
                  ))}
                </div>

                {/* Recommendation Cards */}
                {recommendations.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-muted-foreground">
                        {recommendationType}
                      </h3>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setRecommendations([])}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {recommendations.map((rec, idx) => (
                        <Card key={idx} className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-2xl">{rec.emoji || '✨'}</span>
                                <h4 className="text-base font-bold leading-tight">{rec.itemName}</h4>
                              </div>
                              <Button 
                                size="icon" 
                                variant="ghost"
                                className="h-8 w-8 flex-shrink-0"
                                onClick={() => handleSaveItem({
                                  name: rec.itemName,
                                  calories: rec.calories,
                                  price: rec.price,
                                  dietaryTags: rec.dietaryTags
                                })}
                              >
                                <Heart className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            {rec.calories && (
                              <Badge className="mb-3 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                                🔥 {rec.calories} cal
                              </Badge>
                            )}
                            
                            <p className="text-sm text-foreground/80 leading-relaxed mb-3 font-medium">
                              {rec.reason}
                            </p>
                            
                            <div className="flex flex-wrap gap-2">
                              {rec.macros?.protein && (
                                <Badge variant="outline" className="text-xs">
                                  💪 {rec.macros.protein}g protein
                                </Badge>
                              )}
                              {rec.price && (
                                <Badge variant="outline" className="text-xs">
                                  💰 ${rec.price.toFixed(2)}
                                </Badge>
                              )}
                              {rec.dietaryTags?.map((tag, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chat Messages */}
                <ScrollArea className="h-[250px] border rounded-lg p-3 bg-muted/20">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      Click a button above or type your question
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                              msg.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-card border'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-card border rounded-lg px-3 py-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask about the menu..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !chatLoading) {
                        sendChatMessage(userInput);
                      }
                    }}
                    disabled={chatLoading}
                  />
                  <Button
                    size="icon"
                    onClick={() => sendChatMessage(userInput)}
                    disabled={chatLoading || !userInput.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Insights */}
            {analysisResult.insights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {analysisResult.insights.map((insight, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
      </TabsContent>

      {/* Saved Favorites Tab */}
      <TabsContent value="favorites" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Saved Menu Favorites</CardTitle>
            <CardDescription>
              Your collection of favorite menu items from various restaurants
            </CardDescription>
          </CardHeader>
          <CardContent>
            {favoritesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : savedItems.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No saved items yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start scanning menus and save your favorites!
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {savedItems.map((item) => (
                    <Card key={item.id} className="border-l-4 border-l-primary/50">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start gap-3 mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-base">{item.item_name}</h3>
                            {item.restaurant_name && (
                              <p className="text-sm text-muted-foreground">{item.restaurant_name}</p>
                            )}
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {item.health_score && (
                              <Badge className={getHealthScoreColor(item.health_score)}>
                                {item.health_score}/100
                              </Badge>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteSavedMenuItem(item.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          {item.calories && (
                            <Badge variant="outline">🔥 {item.calories} cal</Badge>
                          )}
                          {item.price && (
                            <Badge variant="outline">💰 ${item.price.toFixed(2)}</Badge>
                          )}
                          {item.macros?.protein && (
                            <Badge variant="outline">💪 {item.macros.protein}g protein</Badge>
                          )}
                          {item.dietary_tags?.map((tag, i) => (
                            <Badge key={i} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Comparison Dialog */}
      <Dialog open={showComparison} onOpenChange={setShowComparison}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Nutrition Comparison
            </DialogTitle>
            <DialogDescription>
              Side-by-side comparison of nutritional values and health metrics
            </DialogDescription>
          </DialogHeader>

          {comparisonItems.length === 2 && (
            <div className="space-y-6 mt-4">
              {/* Item Names */}
              <div className="grid grid-cols-2 gap-4">
                {comparisonItems.map((item, idx) => (
                  <Card key={idx} className="border-2 border-primary/20">
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Calories Comparison */}
              {comparisonItems.every(i => i.calories) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Calorie Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={comparisonItems.map(item => ({
                        name: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
                        calories: item.calories || 0
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="calories" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {comparisonItems.map((item, idx) => (
                        <div key={idx} className="text-center">
                          <Badge className="text-lg px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white">
                            {item.calories} cal
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Health Score Comparison */}
              {comparisonItems.every(i => i.healthScore) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Health Score Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      {comparisonItems.map((item, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="text-center">
                            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-2xl font-bold ${getHealthScoreColor(item.healthScore)}`}>
                              {item.healthScore}
                            </div>
                          </div>
                          <div className="w-full bg-muted rounded-full h-3">
                            <div 
                              className={`h-3 rounded-full transition-all ${item.healthScore && item.healthScore >= 80 ? 'bg-green-500' : item.healthScore && item.healthScore >= 60 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                              style={{ width: `${item.healthScore}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Macros Comparison */}
              {comparisonItems.every(i => i.macros?.protein && i.macros?.carbs && i.macros?.fat) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Macronutrients Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      {comparisonItems.map((item, idx) => {
                        const macroData = [
                          { name: 'Protein', value: item.macros?.protein || 0, color: '#10b981' },
                          { name: 'Carbs', value: item.macros?.carbs || 0, color: '#f59e0b' },
                          { name: 'Fat', value: item.macros?.fat || 0, color: '#ef4444' }
                        ];
                        
                        return (
                          <div key={idx} className="space-y-3">
                            <h4 className="font-semibold text-center text-sm">{item.name.length > 25 ? item.name.substring(0, 25) + '...' : item.name}</h4>
                            <ResponsiveContainer width="100%" height={180}>
                              <PieChart>
                                <Pie
                                  data={macroData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={40}
                                  outerRadius={70}
                                  paddingAngle={2}
                                  dataKey="value"
                                  label={(entry) => `${entry.name}: ${entry.value}g`}
                                >
                                  {macroData.map((entry, i) => (
                                    <Cell key={`cell-${i}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="flex items-center gap-1">
                                  <div className="w-3 h-3 rounded-full bg-green-500" />
                                  Protein
                                </span>
                                <span className="font-semibold">{item.macros?.protein}g</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="flex items-center gap-1">
                                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                                  Carbs
                                </span>
                                <span className="font-semibold">{item.macros?.carbs}g</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="flex items-center gap-1">
                                  <div className="w-3 h-3 rounded-full bg-red-500" />
                                  Fat
                                </span>
                                <span className="font-semibold">{item.macros?.fat}g</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Price Comparison */}
              {comparisonItems.every(i => i.price) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Price Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {comparisonItems.map((item, idx) => (
                        <div key={idx} className="text-center p-4 bg-muted/50 rounded-lg">
                          <Badge variant="outline" className="text-lg px-4 py-2">
                            💰 ${item.price?.toFixed(2)}
                          </Badge>
                          {item.calories && item.price && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {(item.calories / item.price).toFixed(0)} cal/$
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Dietary Tags Comparison */}
              {comparisonItems.some(i => i.dietaryTags && i.dietaryTags.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Dietary Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {comparisonItems.map((item, idx) => (
                        <div key={idx} className="space-y-2">
                          <h4 className="font-semibold text-sm">{item.name.length > 25 ? item.name.substring(0, 25) + '...' : item.name}</h4>
                          <div className="flex flex-wrap gap-2">
                            {item.dietaryTags && item.dietaryTags.length > 0 ? (
                              item.dietaryTags.map((tag, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">No dietary tags</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleClearComparison}>
                  Clear Comparison
                </Button>
                <Button onClick={() => setShowComparison(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Tabs>
  );
};

export default MenuAnalyzer;
