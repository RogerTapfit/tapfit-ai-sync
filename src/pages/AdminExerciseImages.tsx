import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ExerciseImageGenerator } from '@/components/admin/ExerciseImageGenerator';
import SafeAreaLayout from '@/components/SafeAreaLayout';

export default function AdminExerciseImages() {
  const navigate = useNavigate();

  return (
    <SafeAreaLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/50 p-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Exercise Image Generator</h1>
              <p className="text-sm text-muted-foreground">
                AI-powered workout form illustrations
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <ExerciseImageGenerator />
      </div>
    </SafeAreaLayout>
  );
}
