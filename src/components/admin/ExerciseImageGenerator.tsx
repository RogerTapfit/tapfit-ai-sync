import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Image, 
  Play, 
  Square, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2,
  Search,
  Zap
} from 'lucide-react';
import { useExerciseImageGenerator } from '@/hooks/useExerciseImages';
import { atHomeExercises, exerciseCategories } from '@/data/atHomeExercises';

export function ExerciseImageGenerator() {
  const {
    allImages,
    loading,
    stats,
    generatingIds,
    batchProgress,
    generateImage,
    generateAllMissing,
    stopBatchGeneration,
    refreshImages
  } = useExerciseImageGenerator();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Create a map of exercise images by ID
  const imageMap = new Map(allImages.map(img => [img.exercise_id, img]));

  // Filter exercises
  const filteredExercises = atHomeExercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || exercise.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusIcon = (exerciseId: string) => {
    if (generatingIds.has(exerciseId)) {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    }
    
    const image = imageMap.get(exerciseId);
    if (!image) {
      return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
    
    switch (image.generation_status) {
      case 'complete':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'generating':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return <Badge variant="outline">Not Started</Badge>;
    
    switch (status) {
      case 'complete':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Complete</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Failed</Badge>;
      case 'generating':
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Generating</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <Card className="bg-card/50 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-6 h-6 text-primary" />
            Exercise Image Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center p-3 rounded-lg bg-background/50">
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-500/10">
              <div className="text-2xl font-bold text-green-500">{stats.generated}</div>
              <div className="text-xs text-muted-foreground">Generated</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-500/10">
              <div className="text-2xl font-bold text-blue-500">{stats.generating}</div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-500/10">
              <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-muted-foreground">{stats.notStarted}</div>
              <div className="text-xs text-muted-foreground">Not Started</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-primary/10">
              <div className="text-2xl font-bold text-primary">
                {Math.round((stats.generated / stats.total) * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
          </div>

          {/* Progress bar */}
          <Progress value={(stats.generated / stats.total) * 100} className="h-2" />

          {/* Batch progress */}
          {batchProgress.isRunning && (
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Generating images...</span>
                <span className="text-sm text-muted-foreground">
                  {batchProgress.current} / {batchProgress.total}
                </span>
              </div>
              <Progress 
                value={(batchProgress.current / batchProgress.total) * 100} 
                className="h-2" 
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {!batchProgress.isRunning ? (
              <Button 
                onClick={generateAllMissing}
                className="gap-2"
                disabled={stats.notStarted + stats.failed === 0}
              >
                <Zap className="w-4 h-4" />
                Generate All Missing ({stats.notStarted + stats.failed})
              </Button>
            ) : (
              <Button 
                onClick={stopBatchGeneration}
                variant="destructive"
                className="gap-2"
              >
                <Square className="w-4 h-4" />
                Stop Generation
              </Button>
            )}
            <Button 
              onClick={refreshImages}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {exerciseCategories.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.emoji} {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Exercise List */}
      <Card className="bg-card/50">
        <ScrollArea className="h-[600px]">
          <div className="p-4 space-y-2">
            {filteredExercises.map(exercise => {
              const image = imageMap.get(exercise.id);
              const isGenerating = generatingIds.has(exercise.id);
              
              return (
                <div 
                  key={exercise.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                >
                  {/* Thumbnail or placeholder */}
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {image?.image_url ? (
                      <img 
                        src={image.image_url} 
                        alt={exercise.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">{exercise.emoji}</span>
                    )}
                  </div>

                  {/* Exercise info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(exercise.id)}
                      <span className="font-medium truncate">{exercise.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground capitalize">
                        {exercise.category.replace('-', ' ')}
                      </span>
                      {getStatusBadge(image?.generation_status)}
                    </div>
                    {image?.generation_error && (
                      <p className="text-xs text-red-500 mt-1 truncate">
                        {image.generation_error}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <Button
                    size="sm"
                    variant={image?.generation_status === 'complete' ? 'outline' : 'default'}
                    onClick={() => generateImage(exercise.id)}
                    disabled={isGenerating || batchProgress.isRunning}
                    className="shrink-0 gap-1"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : image?.generation_status === 'complete' ? (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Regenerate
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
