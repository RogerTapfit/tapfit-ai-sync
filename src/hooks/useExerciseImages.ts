import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { atHomeExercises } from '@/data/atHomeExercises';
import { toast } from 'sonner';

interface ExerciseImage {
  id: string;
  exercise_id: string;
  exercise_name: string;
  category: string;
  image_url: string | null;
  mini_image_url: string | null;
  generation_status: 'pending' | 'generating' | 'complete' | 'failed';
  generation_error: string | null;
  created_at: string;
  updated_at: string;
}

export function useExerciseImage(exerciseId: string) {
  const [image, setImage] = useState<ExerciseImage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const { data, error } = await supabase
          .from('exercise_images')
          .select('*')
          .eq('exercise_id', exerciseId)
          .maybeSingle();

        if (error) throw error;
        setImage(data as ExerciseImage | null);
      } catch (error) {
        console.error('Error fetching exercise image:', error);
      } finally {
        setLoading(false);
      }
    };

    if (exerciseId) {
      fetchImage();
    }
  }, [exerciseId]);

  return { image, loading };
}

export function useExerciseImageGenerator() {
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [allImages, setAllImages] = useState<ExerciseImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, isRunning: false });

  // Fetch all exercise images
  const fetchAllImages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('exercise_images')
        .select('*')
        .order('exercise_name');

      if (error) throw error;
      setAllImages((data || []) as ExerciseImage[]);
    } catch (error) {
      console.error('Error fetching exercise images:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllImages();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('exercise_images_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'exercise_images' },
        () => {
          fetchAllImages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAllImages]);

  // Generate a single exercise image
  const generateImage = useCallback(async (exerciseId: string) => {
    const exercise = atHomeExercises.find(e => e.id === exerciseId);
    if (!exercise) {
      toast.error('Exercise not found');
      return false;
    }

    setGeneratingIds(prev => new Set(prev).add(exerciseId));

    try {
      const response = await supabase.functions.invoke('generate-exercise-image', {
        body: {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          category: exercise.category,
          instructions: exercise.instructions,
          isHold: exercise.isHold
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success(`Generated image for ${exercise.name}`);
      await fetchAllImages();
      return true;
    } catch (error) {
      console.error('Error generating exercise image:', error);
      toast.error(`Failed to generate image for ${exercise.name}`);
      return false;
    } finally {
      setGeneratingIds(prev => {
        const next = new Set(prev);
        next.delete(exerciseId);
        return next;
      });
    }
  }, [fetchAllImages]);

  // Generate all missing images with rate limiting
  const generateAllMissing = useCallback(async () => {
    const existingIds = new Set(allImages.map(img => img.exercise_id));
    const failedIds = new Set(
      allImages
        .filter(img => img.generation_status === 'failed')
        .map(img => img.exercise_id)
    );
    
    const missingExercises = atHomeExercises.filter(
      e => !existingIds.has(e.id) || failedIds.has(e.id)
    );

    if (missingExercises.length === 0) {
      toast.info('All exercise images are already generated!');
      return;
    }

    setBatchProgress({ current: 0, total: missingExercises.length, isRunning: true });
    toast.info(`Starting generation for ${missingExercises.length} exercises...`);

    for (let i = 0; i < missingExercises.length; i++) {
      const exercise = missingExercises[i];
      setBatchProgress(prev => ({ ...prev, current: i + 1 }));
      
      await generateImage(exercise.id);
      
      // Rate limit: wait 3 seconds between generations
      if (i < missingExercises.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    setBatchProgress({ current: 0, total: 0, isRunning: false });
    toast.success('Batch generation complete!');
  }, [allImages, generateImage]);

  // Stop batch generation
  const stopBatchGeneration = useCallback(() => {
    setBatchProgress({ current: 0, total: 0, isRunning: false });
    toast.info('Batch generation stopped');
  }, []);

  // Get stats
  const stats = {
    total: atHomeExercises.length,
    generated: allImages.filter(img => img.generation_status === 'complete').length,
    pending: allImages.filter(img => img.generation_status === 'pending').length,
    generating: allImages.filter(img => img.generation_status === 'generating').length,
    failed: allImages.filter(img => img.generation_status === 'failed').length,
    notStarted: atHomeExercises.length - allImages.length
  };

  return {
    allImages,
    loading,
    stats,
    generatingIds,
    batchProgress,
    generateImage,
    generateAllMissing,
    stopBatchGeneration,
    refreshImages: fetchAllImages
  };
}
