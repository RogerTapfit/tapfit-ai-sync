import { useState, useRef } from "react";
import { Camera, Upload, Loader2, Send, Sparkles, Heart, Trash2, BookOpen } from "lucide-react";
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

const QUICK_ACTIONS = [
  { label: 'Healthiest option', icon: '🥗', prompt: 'What is the healthiest item on this menu? Consider calories, nutritional balance, and preparation method.' },
  { label: 'Lowest calorie', icon: '🔥', prompt: 'Which menu item has the lowest calories? Show me the top 3 lowest calorie options.' },
  { label: 'Vegan options', icon: '🥑', prompt: 'Show me all vegan or plant-based options on this menu.' },
  { label: 'Gluten-free', icon: '🌾', prompt: 'Which items are gluten-free or can be made gluten-free?' },
  { label: 'High protein', icon: '💪', prompt: 'What are the highest protein options? I\'m looking to maximize protein.' },
  { label: 'Low sugar drinks', icon: '🥤', prompt: 'Show me all beverage options with low or no sugar.' },
  { label: 'Best value', icon: '💰', prompt: 'Considering both health and price, what offers the best value?' },
];

export const MenuAnalyzer = () => {
  const [menuImage, setMenuImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<MenuAnalysisResult | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'favorites'>('menu');
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
      setMenuImage(base64);
    };
    reader.readAsDataURL(file);
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
    if (!menuImage) return;

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyzeMenu', {
        body: { 
          imageBase64: menuImage,
          mode: 'analyze'
        }
      });

      if (error) throw error;

      setAnalysisResult(data);
      toast.success('Menu analyzed successfully!');
    } catch (error) {
      console.error('Error analyzing menu:', error);
      toast.error('Failed to analyze menu. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const sendChatMessage = async (message: string) => {
    if (!menuImage || !message.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: message };
    setChatMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setChatLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyzeMenu', {
        body: { 
          imageBase64: menuImage,
          mode: 'chat',
          message: message,
          conversationHistory: chatMessages
        }
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = { role: 'assistant', content: data.response };
      setChatMessages(prev => [...prev, assistantMessage]);
      
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
        {/* Upload Section */}
        {!menuImage && (
        <Card className="border-dashed border-2 bg-gradient-to-br from-card to-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Menu Scanner
            </CardTitle>
            <CardDescription>
              Take a photo of any restaurant menu, menu board, or drive-thru display
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

      {/* Image Preview & Analysis */}
      {menuImage && !analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle>Menu Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <img 
              src={menuImage} 
              alt="Menu" 
              className="w-full h-auto rounded-lg border"
            />
            <div className="flex gap-3">
              <Button 
                onClick={analyzeMenu} 
                disabled={analyzing}
                className="flex-1 bg-gradient-to-r from-primary to-primary/80"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Analyzing Menu...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze Menu
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setMenuImage(null);
                  setAnalysisResult(null);
                  setChatMessages([]);
                }}
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
                      setMenuImage(null);
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

      <TabsContent value="favorites" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Saved Favorites
            </CardTitle>
            <CardDescription>
              Quick reference to your favorite menu items from different restaurants
            </CardDescription>
          </CardHeader>
          <CardContent>
            {favoritesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : savedItems.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No saved items yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Scan a menu and save your favorites!
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
                              <p className="text-sm text-primary font-medium">{item.restaurant_name}</p>
                            )}
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                            )}
                            {item.notes && (
                              <p className="text-sm italic text-muted-foreground mt-2 border-l-2 border-muted pl-2">
                                "{item.notes}"
                              </p>
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
                            <Badge variant="outline">💰 ${Number(item.price).toFixed(2)}</Badge>
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
    </Tabs>
  );
};
