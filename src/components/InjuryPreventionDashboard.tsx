import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ChevronLeft,
  Activity,
  Target,
  Zap,
  ArrowLeft,
  ArrowRight,
  Check
} from 'lucide-react';
import { useInjuryPrevention, type MuscleImbalance, type CorrectiveExercise } from '@/hooks/useInjuryPrevention';
import LoadingSpinner from './LoadingSpinner';

interface InjuryPreventionDashboardProps {
  onBack?: () => void;
}

export default function InjuryPreventionDashboard({ onBack }: InjuryPreventionDashboardProps) {
  const { loading, riskAssessment, muscleImbalances, correctiveExercises, formHistory } = useInjuryPrevention();
  const [selectedExercise, setSelectedExercise] = useState<CorrectiveExercise | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Analyzing your form data..." />
      </div>
    );
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-green-500';
    }
  };

  const getRiskBgColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-500/20 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/30';
      default: return 'bg-green-500/20 border-green-500/30';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingDown className="h-4 w-4 text-green-500" />;
      case 'worsening': return <TrendingUp className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 60) return 'from-red-500 to-red-600';
    if (score >= 30) return 'from-yellow-500 to-orange-500';
    return 'from-green-500 to-emerald-500';
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Injury Prevention
          </h1>
          <p className="text-muted-foreground text-sm">Smart form analysis & muscle balance tracking</p>
        </div>
      </div>

      {/* Risk Score Card */}
      <Card className={`glow-card p-6 border ${getRiskBgColor(riskAssessment?.overallRisk || 'low')}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Overall Injury Risk</p>
            <div className="flex items-center gap-3">
              <span className={`text-4xl font-bold ${getRiskColor(riskAssessment?.overallRisk || 'low')}`}>
                {riskAssessment?.riskScore || 0}
              </span>
              <Badge 
                variant="outline" 
                className={`${getRiskColor(riskAssessment?.overallRisk || 'low')} border-current uppercase`}
              >
                {riskAssessment?.overallRisk || 'low'} risk
              </Badge>
            </div>
          </div>
          <div className="relative w-24 h-24">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted/30"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="url(#riskGradient)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(riskAssessment?.riskScore || 0) * 2.51} 251`}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" className={`${getRiskScoreColor(riskAssessment?.riskScore || 0).split(' ')[0].replace('from-', 'stop-')}`} style={{ stopColor: riskAssessment?.riskScore! >= 60 ? '#ef4444' : riskAssessment?.riskScore! >= 30 ? '#eab308' : '#22c55e' }} />
                  <stop offset="100%" style={{ stopColor: riskAssessment?.riskScore! >= 60 ? '#dc2626' : riskAssessment?.riskScore! >= 30 ? '#f97316' : '#10b981' }} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold">/100</span>
            </div>
          </div>
        </div>

        {/* Pre-workout Warnings */}
        {riskAssessment?.preWorkoutWarnings && riskAssessment.preWorkoutWarnings.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Pre-Workout Warnings
            </p>
            <ul className="space-y-1">
              {riskAssessment.preWorkoutWarnings.map((warning, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Tabs defaultValue="imbalances" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="imbalances" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            Imbalances
          </TabsTrigger>
          <TabsTrigger value="corrective" className="flex items-center gap-1">
            <Target className="h-4 w-4" />
            Corrective
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1">
            <Zap className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Muscle Imbalances Tab */}
        <TabsContent value="imbalances" className="space-y-4">
          {muscleImbalances.length === 0 ? (
            <Card className="glow-card p-8 text-center">
              <Shield className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No Significant Imbalances</h3>
              <p className="text-sm text-muted-foreground">
                Complete more workouts with AI tracking to build your imbalance profile.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {muscleImbalances.map((imbalance) => (
                <ImbalanceCard key={imbalance.id} imbalance={imbalance} />
              ))}
            </div>
          )}

          {/* Body Diagram Placeholder */}
          <Card className="glow-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Muscle Balance Overview
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <BalanceBar label="Shoulders" left={muscleImbalances.find(i => i.muscleGroup.includes('shoulder'))?.avgLeftStrength || 50} right={muscleImbalances.find(i => i.muscleGroup.includes('shoulder'))?.avgRightStrength || 50} />
                <BalanceBar label="Arms" left={muscleImbalances.find(i => i.muscleGroup.includes('arm'))?.avgLeftStrength || 50} right={muscleImbalances.find(i => i.muscleGroup.includes('arm'))?.avgRightStrength || 50} />
                <BalanceBar label="Chest" left={muscleImbalances.find(i => i.muscleGroup.includes('chest'))?.avgLeftStrength || 50} right={muscleImbalances.find(i => i.muscleGroup.includes('chest'))?.avgRightStrength || 50} />
              </div>
              <div className="space-y-3">
                <BalanceBar label="Hips" left={muscleImbalances.find(i => i.muscleGroup.includes('hip'))?.avgLeftStrength || 50} right={muscleImbalances.find(i => i.muscleGroup.includes('hip'))?.avgRightStrength || 50} />
                <BalanceBar label="Legs" left={muscleImbalances.find(i => i.muscleGroup.includes('leg'))?.avgLeftStrength || 50} right={muscleImbalances.find(i => i.muscleGroup.includes('leg'))?.avgRightStrength || 50} />
                <BalanceBar label="Core" left={muscleImbalances.find(i => i.muscleGroup.includes('core'))?.avgLeftStrength || 50} right={muscleImbalances.find(i => i.muscleGroup.includes('core'))?.avgRightStrength || 50} />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Corrective Exercises Tab */}
        <TabsContent value="corrective" className="space-y-4">
          {selectedExercise ? (
            <Card className="glow-card p-6">
              <Button 
                variant="ghost" 
                size="sm" 
                className="mb-4"
                onClick={() => setSelectedExercise(null)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to exercises
              </Button>
              <h3 className="text-xl font-bold mb-2">{selectedExercise.exerciseName}</h3>
              <Badge variant="outline" className="mb-4">{selectedExercise.difficulty}</Badge>
              <p className="text-muted-foreground mb-4">{selectedExercise.description}</p>
              
              <div className="bg-muted/30 rounded-lg p-4 mb-4">
                <h4 className="font-semibold mb-2">Instructions</h4>
                <p className="text-sm">{selectedExercise.instructions}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/10 rounded-lg p-3 text-center">
                  <span className="text-2xl font-bold text-primary">{selectedExercise.sets}</span>
                  <p className="text-xs text-muted-foreground">Sets</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-3 text-center">
                  <span className="text-2xl font-bold text-primary">{selectedExercise.reps}</span>
                  <p className="text-xs text-muted-foreground">Reps</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {selectedExercise.muscleGroups.map((mg, idx) => (
                  <Badge key={idx} variant="secondary">{mg.replace('_', ' ')}</Badge>
                ))}
              </div>
            </Card>
          ) : (
            <>
              {riskAssessment?.correctiveRecommendations && riskAssessment.correctiveRecommendations.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Based on your form analysis, here are recommended corrective exercises:
                  </p>
                  <div className="grid gap-3">
                    {riskAssessment.correctiveRecommendations.map((exercise) => (
                      <Card 
                        key={exercise.id} 
                        className="glow-card p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => setSelectedExercise(exercise)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{exercise.exerciseName}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-1">{exercise.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">{exercise.targetIssue.replace('_', ' ')}</Badge>
                              <span className="text-xs text-muted-foreground">{exercise.sets}×{exercise.reps}</span>
                            </div>
                          </div>
                          <ChevronLeft className="h-5 w-5 text-muted-foreground rotate-180" />
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <Card className="glow-card p-8 text-center">
                  <Check className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">No Corrective Exercises Needed</h3>
                  <p className="text-sm text-muted-foreground">
                    Your form looks great! Keep up the good work.
                  </p>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {formHistory.length === 0 ? (
            <Card className="glow-card p-8 text-center">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No Form History Yet</h3>
              <p className="text-sm text-muted-foreground">
                Complete workouts with AI form tracking to see your history here.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {formHistory.slice(0, 10).map((log) => (
                <Card key={log.id} className="glow-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{log.exerciseName}</h4>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleDateString()} • {log.muscleGroup || 'General'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        log.avgFormScore >= 80 ? 'text-green-500' :
                        log.avgFormScore >= 60 ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {log.avgFormScore}%
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          log.injuryRiskLevel === 'high' ? 'text-red-500 border-red-500' :
                          log.injuryRiskLevel === 'medium' ? 'text-yellow-500 border-yellow-500' :
                          'text-green-500 border-green-500'
                        }`}
                      >
                        {log.injuryRiskLevel} risk
                      </Badge>
                    </div>
                  </div>
                  {log.imbalancePercentage && log.imbalancePercentage > 10 && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <span className="text-xs text-yellow-500">
                        {log.imbalancePercentage.toFixed(0)}% imbalance ({log.imbalanceDirection?.replace('_', ' ')})
                      </span>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Imbalance Card Component
function ImbalanceCard({ imbalance }: { imbalance: MuscleImbalance }) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingDown className="h-4 w-4 text-green-500" />;
      case 'worsening': return <TrendingUp className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="glow-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold capitalize">{imbalance.muscleGroup.replace('_', ' ')}</h4>
          <div className="flex items-center gap-2 mt-1">
            {getTrendIcon(imbalance.trend)}
            <span className="text-xs text-muted-foreground capitalize">{imbalance.trend}</span>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-2xl font-bold ${
            imbalance.imbalancePercentage > 20 ? 'text-red-500' :
            imbalance.imbalancePercentage > 15 ? 'text-yellow-500' : 'text-green-500'
          }`}>
            {imbalance.imbalancePercentage.toFixed(0)}%
          </span>
          <p className="text-xs text-muted-foreground">imbalance</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ArrowLeft className="h-3 w-3 text-muted-foreground" />
          <div className="flex-1">
            <Progress value={imbalance.avgLeftStrength} className="h-2" />
          </div>
          <span className="text-xs w-8">{imbalance.avgLeftStrength}</span>
        </div>
        <div className="flex items-center gap-2">
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <div className="flex-1">
            <Progress value={imbalance.avgRightStrength} className="h-2" />
          </div>
          <span className="text-xs w-8">{imbalance.avgRightStrength}</span>
        </div>
      </div>

      {imbalance.dominantSide !== 'balanced' && (
        <p className="text-xs text-muted-foreground mt-2">
          <span className="capitalize">{imbalance.dominantSide}</span> side is dominant • {imbalance.dataPointsCount} data points
        </p>
      )}
    </Card>
  );
}

// Balance Bar Component
function BalanceBar({ label, left, right }: { label: string; left: number; right: number }) {
  const total = left + right || 100;
  const leftPct = (left / total) * 100;
  const rightPct = (right / total) * 100;
  const isBalanced = Math.abs(leftPct - 50) < 5;

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">L</span>
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">R</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-muted/30">
        <div 
          className={`${isBalanced ? 'bg-green-500' : leftPct > 55 ? 'bg-blue-500' : 'bg-muted'}`}
          style={{ width: `${leftPct}%` }}
        />
        <div 
          className={`${isBalanced ? 'bg-green-500' : rightPct > 55 ? 'bg-blue-500' : 'bg-muted'}`}
          style={{ width: `${rightPct}%` }}
        />
      </div>
    </div>
  );
}
