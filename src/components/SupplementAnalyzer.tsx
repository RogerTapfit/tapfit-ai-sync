import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Camera, Upload, Pill, Shield, AlertTriangle, CheckCircle2, XCircle, Beaker, Clock, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SupplementAnalysis {
  productName: string;
  brand: string;
  productType: string;
  dosageForm: string;
  servingSize: string;
  servingsPerContainer: number;
  qualityRating: {
    grade: string;
    score: number;
    reasoning: string;
  };
  certifications: Array<{
    name: string;
    verified: boolean;
    description: string;
  }>;
  activeIngredients: Array<{
    name: string;
    form: string;
    amount: string;
    unit: string;
    dailyValue: string | null;
    bioavailability: string;
    bioavailabilityNotes: string;
    source: string;
    benefits: string[];
  }>;
  inactiveIngredients: Array<{
    name: string;
    category: string;
    concern: string;
    notes: string;
  }>;
  allergenWarnings: string[];
  safetyInfo: {
    maxSafeDose: string;
    overdoseRisk: string;
    overdoseSymptoms: string[];
    fatSoluble: boolean;
    accumulationRisk: string;
    pregnancyCategory: string;
    ageRestrictions: string;
  };
  drugInteractions: Array<{
    medication: string;
    severity: string;
    effect: string;
  }>;
  recommendations: {
    bestTimeToTake: string;
    takeWithFood: boolean;
    foodPairings: string;
    avoidWith: string;
    storageTips: string;
  };
  overallAssessment: {
    pros: string[];
    cons: string[];
    verdict: string;
    alternativeSuggestions: string[];
  };
}

const SupplementAnalyzer = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<SupplementAnalysis | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    active: true,
    inactive: false,
    safety: true,
    interactions: false,
    recommendations: true
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-500';
    if (grade.startsWith('B')) return 'text-blue-500';
    if (grade.startsWith('C')) return 'text-yellow-500';
    if (grade.startsWith('D')) return 'text-orange-500';
    return 'text-red-500';
  };

  const getGradeBgColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-500/20 border-green-500/50';
    if (grade.startsWith('B')) return 'bg-blue-500/20 border-blue-500/50';
    if (grade.startsWith('C')) return 'bg-yellow-500/20 border-yellow-500/50';
    if (grade.startsWith('D')) return 'bg-orange-500/20 border-orange-500/50';
    return 'bg-red-500/20 border-red-500/50';
  };

  const getBioavailabilityColor = (level: string) => {
    switch (level) {
      case 'very_high': return 'bg-green-500';
      case 'high': return 'bg-emerald-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  const getConcernColor = (concern: string) => {
    switch (concern) {
      case 'none': return 'text-green-500';
      case 'low': return 'text-blue-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'bg-blue-500/20 text-blue-400';
      case 'moderate': return 'bg-yellow-500/20 text-yellow-400';
      case 'severe': return 'bg-red-500/20 text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const analyzeImage = async (imageBase64: string) => {
    setIsAnalyzing(true);
    setProgress(0);
    setProgressStage('Initializing analysis...');

    try {
      // Simulate progress stages
      const stages = [
        { progress: 20, stage: 'Reading product label...' },
        { progress: 40, stage: 'Analyzing active ingredients...' },
        { progress: 60, stage: 'Evaluating quality markers...' },
        { progress: 75, stage: 'Checking safety information...' },
        { progress: 90, stage: 'Generating recommendations...' },
      ];

      for (const s of stages) {
        setProgress(s.progress);
        setProgressStage(s.stage);
        await new Promise(r => setTimeout(r, 400));
      }

      const { data, error } = await supabase.functions.invoke('analyzeSupplement', {
        body: { imageBase64 }
      });

      if (error) throw error;

      setProgress(100);
      setProgressStage('Analysis complete!');
      setAnalysis(data);
      toast.success('Supplement analyzed successfully!');

    } catch (error) {
      console.error('Error analyzing supplement:', error);
      toast.error('Failed to analyze supplement. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setPreviewImage(base64);
      await analyzeImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.capture = 'environment';
      fileInputRef.current.click();
    }
  };

  const handleGalleryUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.click();
    }
  };

  const resetAnalysis = () => {
    setAnalysis(null);
    setPreviewImage(null);
    setProgress(0);
    setProgressStage('');
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Upload Section */}
      {!analysis && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-primary" />
              Smart Supplement Analyzer
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              AI-powered vitamin, supplement & medication analysis with quality ratings
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {previewImage && (
              <div className="relative rounded-lg overflow-hidden">
                <img src={previewImage} alt="Preview" className="w-full h-48 object-contain bg-black/50" />
              </div>
            )}

            {isAnalyzing ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm">{progressStage}</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">{progress}%</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleCameraCapture} variant="outline" className="h-20 flex-col gap-2">
                  <Camera className="w-6 h-6" />
                  <span className="text-xs">Take Photo</span>
                </Button>
                <Button onClick={handleGalleryUpload} variant="outline" className="h-20 flex-col gap-2">
                  <Upload className="w-6 h-6" />
                  <span className="text-xs">Upload Photo</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          {/* Header with Grade */}
          <Card className="border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{analysis.productName}</h3>
                  <p className="text-sm text-muted-foreground">{analysis.brand}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary">{analysis.productType}</Badge>
                    <Badge variant="outline">{analysis.dosageForm}</Badge>
                    <Badge variant="outline">{analysis.servingSize}</Badge>
                  </div>
                </div>
                <div className={`flex flex-col items-center p-3 rounded-lg border-2 ${getGradeBgColor(analysis.qualityRating.grade)}`}>
                  <span className={`text-3xl font-bold ${getGradeColor(analysis.qualityRating.grade)}`}>
                    {analysis.qualityRating.grade}
                  </span>
                  <span className="text-xs text-muted-foreground">{analysis.qualityRating.score}/100</span>
                </div>
              </div>
              <p className="text-sm mt-3 text-muted-foreground">{analysis.qualityRating.reasoning}</p>
            </CardContent>
          </Card>

          {/* Certifications */}
          {analysis.certifications && analysis.certifications.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Quality Certifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.certifications.map((cert, idx) => (
                    <Badge 
                      key={idx} 
                      variant={cert.verified ? "default" : "secondary"}
                      className="flex items-center gap-1"
                    >
                      {cert.verified ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {cert.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Ingredients */}
          <Collapsible open={expandedSections.active} onOpenChange={() => toggleSection('active')}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Beaker className="w-4 h-4 text-green-500" />
                      Active Ingredients ({analysis.activeIngredients?.length || 0})
                    </span>
                    {expandedSections.active ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-3">
                  {analysis.activeIngredients?.map((ingredient, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-muted/50 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{ingredient.name}</p>
                          <p className="text-xs text-muted-foreground">{ingredient.form}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{ingredient.amount} {ingredient.unit}</p>
                          {ingredient.dailyValue && (
                            <p className="text-xs text-muted-foreground">{ingredient.dailyValue} DV</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">Bioavailability:</span>
                        <Badge className={`${getBioavailabilityColor(ingredient.bioavailability)} text-white text-xs`}>
                          {ingredient.bioavailability.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{ingredient.bioavailabilityNotes}</p>
                      {ingredient.benefits && ingredient.benefits.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {ingredient.benefits.slice(0, 3).map((benefit, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{benefit}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Inactive Ingredients */}
          <Collapsible open={expandedSections.inactive} onOpenChange={() => toggleSection('inactive')}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      🧪 Inactive Ingredients ({analysis.inactiveIngredients?.length || 0})
                    </span>
                    {expandedSections.inactive ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.inactiveIngredients?.map((ingredient, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                        <div>
                          <p className="text-sm">{ingredient.name}</p>
                          <p className="text-xs text-muted-foreground">{ingredient.category}</p>
                        </div>
                        <span className={`text-xs ${getConcernColor(ingredient.concern)}`}>
                          {ingredient.concern === 'none' ? '✓ Safe' : ingredient.concern}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Allergen Warnings */}
          {analysis.allergenWarnings && analysis.allergenWarnings.length > 0 && (
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-yellow-500">
                  <AlertTriangle className="w-4 h-4" />
                  Allergen Warnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.allergenWarnings.map((allergen, idx) => (
                    <Badge key={idx} variant="destructive" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">
                      {allergen}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Safety Information */}
          <Collapsible open={expandedSections.safety} onOpenChange={() => toggleSection('safety')}>
            <Card className="border-blue-500/20">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-500" />
                      Safety Information
                    </span>
                    {expandedSections.safety ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground">Max Safe Dose</p>
                      <p className="font-medium">{analysis.safetyInfo?.maxSafeDose || 'N/A'}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground">Overdose Risk</p>
                      <p className={`font-medium ${analysis.safetyInfo?.overdoseRisk === 'high' ? 'text-red-500' : analysis.safetyInfo?.overdoseRisk === 'medium' ? 'text-yellow-500' : 'text-green-500'}`}>
                        {analysis.safetyInfo?.overdoseRisk || 'N/A'}
                      </p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground">Pregnancy</p>
                      <p className="font-medium">{analysis.safetyInfo?.pregnancyCategory || 'Consult Doctor'}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground">Fat Soluble</p>
                      <p className="font-medium">{analysis.safetyInfo?.fatSoluble ? 'Yes ⚠️' : 'No'}</p>
                    </div>
                  </div>
                  {analysis.safetyInfo?.accumulationRisk && (
                    <p className="text-xs text-muted-foreground">{analysis.safetyInfo.accumulationRisk}</p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Drug Interactions */}
          {analysis.drugInteractions && analysis.drugInteractions.length > 0 && (
            <Collapsible open={expandedSections.interactions} onOpenChange={() => toggleSection('interactions')}>
              <Card className="border-red-500/20">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        Drug Interactions ({analysis.drugInteractions.length})
                      </span>
                      {expandedSections.interactions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-2">
                    {analysis.drugInteractions.map((interaction, idx) => (
                      <div key={idx} className="p-2 rounded bg-muted/50">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{interaction.medication}</p>
                          <Badge className={getSeverityColor(interaction.severity)}>
                            {interaction.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{interaction.effect}</p>
                      </div>
                    ))}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Recommendations */}
          <Collapsible open={expandedSections.recommendations} onOpenChange={() => toggleSection('recommendations')}>
            <Card className="border-primary/20">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      How to Take
                    </span>
                    {expandedSections.recommendations ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Best time:</span>
                    <span>{analysis.recommendations?.bestTimeToTake || 'Any time'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">With food:</span>
                    <span>{analysis.recommendations?.takeWithFood ? 'Yes, recommended' : 'Not required'}</span>
                  </div>
                  {analysis.recommendations?.foodPairings && (
                    <div>
                      <span className="text-muted-foreground">Pair with: </span>
                      <span>{analysis.recommendations.foodPairings}</span>
                    </div>
                  )}
                  {analysis.recommendations?.avoidWith && (
                    <div className="text-yellow-500">
                      <span className="text-muted-foreground">Avoid with: </span>
                      <span>{analysis.recommendations.avoidWith}</span>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Overall Assessment */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">💡 Overall Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{analysis.overallAssessment?.verdict}</p>
              
              {analysis.overallAssessment?.pros && analysis.overallAssessment.pros.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Pros:</p>
                  <div className="flex flex-wrap gap-1">
                    {analysis.overallAssessment.pros.map((pro, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs text-green-500 border-green-500/50">
                        ✓ {pro}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {analysis.overallAssessment?.cons && analysis.overallAssessment.cons.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Cons:</p>
                  <div className="flex flex-wrap gap-1">
                    {analysis.overallAssessment.cons.map((con, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs text-red-500 border-red-500/50">
                        ✗ {con}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scan Another Button */}
          <Button onClick={resetAnalysis} className="w-full" variant="outline">
            <Camera className="w-4 h-4 mr-2" />
            Scan Another Supplement
          </Button>
        </div>
      )}
    </div>
  );
};

export default SupplementAnalyzer;
