import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Eye, ArrowLeft } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { useNavigate } from "react-router-dom";

interface MenuItem {
  name: string;
  calories?: number;
  price?: number;
  description?: string;
  dietaryTags?: string[];
  healthScore?: number;
  macros?: {
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

export default function SharedMenuItem() {
  const { type, token } = useParams<{ type: 'item' | 'comparison'; token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSharedData = async () => {
      try {
        const { data: shareData, error: shareError } = await supabase.functions.invoke('shareMenuItem', {
          body: {
            action: 'get',
            type,
            shareToken: token
          }
        });

        if (shareError) throw shareError;

        if (!shareData.success) {
          throw new Error(shareData.error || 'Failed to load shared content');
        }

        setData(shareData.data);
      } catch (err: any) {
        console.error('Error fetching shared data:', err);
        setError(err.message || 'Failed to load shared content');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedData();
  }, [type, token]);

  const getHealthScoreColor = (score?: number) => {
    if (!score) return 'bg-muted text-muted-foreground';
    if (score >= 80) return 'bg-green-500 text-white';
    if (score >= 60) return 'bg-yellow-500 text-white';
    return 'bg-orange-500 text-white';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pt-safe">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading shared content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 pt-safe">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unable to Load Share</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/food-scanner')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to Food Scanner
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (type === 'item') {
    const item = data?.itemData as MenuItem;
    
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 pt-safe">
        <SEO 
          title={`${item?.name} - Shared Menu Item`}
          description={`View nutrition information for ${item?.name} ${data?.restaurantName ? `from ${data.restaurantName}` : ''}`}
        />
        
        <div className="max-w-2xl mx-auto space-y-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/food-scanner')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Scanner
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{item?.name}</CardTitle>
                  {data?.restaurantName && (
                    <CardDescription className="text-base mt-1">
                      {data.restaurantName}
                    </CardDescription>
                  )}
                </div>
                {item?.healthScore && (
                  <Badge className={getHealthScoreColor(item.healthScore)}>
                    {item.healthScore}/100
                  </Badge>
                )}
              </div>
              {item?.description && (
                <p className="text-muted-foreground mt-2">{item.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Nutrition Facts */}
              {item?.calories && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Nutrition Facts</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Calories</span>
                        <span className="font-bold text-lg">{item.calories}</span>
                      </div>
                      {item.macros?.protein && (
                        <div className="flex justify-between">
                          <span className="text-sm">Protein</span>
                          <span className="font-medium">{item.macros.protein}g</span>
                        </div>
                      )}
                      {item.macros?.carbs && (
                        <div className="flex justify-between">
                          <span className="text-sm">Carbs</span>
                          <span className="font-medium">{item.macros.carbs}g</span>
                        </div>
                      )}
                      {item.macros?.fat && (
                        <div className="flex justify-between">
                          <span className="text-sm">Fat</span>
                          <span className="font-medium">{item.macros.fat}g</span>
                        </div>
                      )}
                    </div>
                    
                    {item.macros && (
                      <div className="flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={120}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Protein', value: item.macros.protein || 0 },
                                { name: 'Carbs', value: item.macros.carbs || 0 },
                                { name: 'Fat', value: item.macros.fat || 0 }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={30}
                              outerRadius={50}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              <Cell fill="#10b981" />
                              <Cell fill="#f59e0b" />
                              <Cell fill="#ef4444" />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Dietary Tags */}
              {item?.dietaryTags && item.dietaryTags.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Dietary Information</h4>
                  <div className="flex flex-wrap gap-2">
                    {item.dietaryTags.map((tag, i) => (
                      <Badge key={i} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Price */}
              {item?.price && (
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="font-semibold">Price</span>
                  <span className="text-2xl font-bold text-primary">
                    ${item.price.toFixed(2)}
                  </span>
                </div>
              )}

              {/* View Count */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>{data?.viewCount || 0} views</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Comparison view
  const comparisonItems = data?.comparisonData as MenuItem[];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pt-safe">
      <SEO 
        title="Menu Comparison - Shared"
        description={`Compare nutrition information for menu items ${data?.restaurantName ? `from ${data.restaurantName}` : ''}`}
      />
      
      <div className="max-w-4xl mx-auto space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/food-scanner')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Scanner
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Menu Item Comparison</CardTitle>
            {data?.restaurantName && (
              <CardDescription>{data.restaurantName}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Item Names */}
            <div className="grid grid-cols-2 gap-4">
              {comparisonItems?.map((item, idx) => (
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
            {comparisonItems?.every(i => i.calories) && (
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
                </CardContent>
              </Card>
            )}

            {/* Macros Comparison */}
            {comparisonItems?.every(i => i.macros?.protein && i.macros?.carbs && i.macros?.fat) && (
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
                              >
                                {macroData.map((entry, i) => (
                                  <Cell key={`cell-${i}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* View Count */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>{data?.viewCount || 0} views</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}