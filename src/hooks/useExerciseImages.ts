import { useState, useEffect, useCallback, useRef } from 'react';
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
    let mounted = true;

    const fetchImage = async () => {
      try {
        const { data, error } = await supabase
          .from('exercise_images')
          .select('*')
          .eq('exercise_id', exerciseId)
          .maybeSingle();

        if (error) throw error;
        if (mounted) setImage(data as ExerciseImage | null);
      } catch (error) {
        console.error('Error fetching exercise image:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (!exerciseId) {
      setImage(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchImage();

    // Keep thumbnails in-sync while images regenerate
    const channel = supabase
      .channel(`exercise_image_${exerciseId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exercise_images',
          filter: `exercise_id=eq.${exerciseId}`,
        },
        () => {
          fetchImage();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [exerciseId]);

  return { image, loading };
}

export function useExerciseImageGenerator() {
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [allImages, setAllImages] = useState<ExerciseImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, isRunning: false });

  // Used to cancel long-running batch jobs
  const stopRequestedRef = useRef(false);

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
  const generateImage = useCallback(
    async (exerciseId: string) => {
      const exercise = atHomeExercises.find((e) => e.id === exerciseId);
      if (!exercise) {
        toast.error('Exercise not found');
        return false;
      }

      setGeneratingIds((prev) => new Set(prev).add(exerciseId));

      try {
        const response = await supabase.functions.invoke('generate-exercise-image', {
          body: {
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            category: exercise.category,
            instructions: exercise.instructions,
            isHold: exercise.isHold,
          },
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
        setGeneratingIds((prev) => {
          const next = new Set(prev);
          next.delete(exerciseId);
          return next;
        });
      }
    },
    [fetchAllImages]
  );

  const runBatch = useCallback(
    async (exerciseIds: string[], label: string) => {
      if (exerciseIds.length === 0) {
        toast.info('Nothing to generate.');
        return;
      }

      stopRequestedRef.current = false;
      setBatchProgress({ current: 0, total: exerciseIds.length, isRunning: true });
      toast.info(`${label}: ${exerciseIds.length} exercises...`);

      for (let i = 0; i < exerciseIds.length; i++) {
        if (stopRequestedRef.current) break;

        const id = exerciseIds[i];
        setBatchProgress((prev) => ({ ...prev, current: i + 1 }));

        await generateImage(id);

        // Rate limit: wait 3 seconds between generations
        if (i < exerciseIds.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }

      const stopped = stopRequestedRef.current;
      stopRequestedRef.current = false;
      setBatchProgress({ current: 0, total: 0, isRunning: false });

      if (stopped) toast.info('Batch generation stopped.');
      else toast.success('Batch generation complete!');
    },
    [generateImage]
  );

  // Generate all missing images (and failed) with rate limiting
  const generateAllMissing = useCallback(async () => {
    const existingIds = new Set(allImages.map((img) => img.exercise_id));
    const failedIds = new Set(
      allImages.filter((img) => img.generation_status === 'failed').map((img) => img.exercise_id)
    );

    const missingExercises = atHomeExercises
      .filter((e) => !existingIds.has(e.id) || failedIds.has(e.id))
      .map((e) => e.id);

    if (missingExercises.length === 0) {
      toast.info('All exercise images are already generated!');
      return;
    }

    await runBatch(missingExercises, 'Generating missing images');
  }, [allImages, runBatch]);

  // Regenerate ALL images (even those already complete)
  const regenerateAll = useCallback(async () => {
    await runBatch(
      atHomeExercises.map((e) => e.id),
      'Regenerating ALL images'
    );
  }, [runBatch]);

  // Stop batch generation
  const stopBatchGeneration = useCallback(() => {
    stopRequestedRef.current = true;
    setBatchProgress({ current: 0, total: 0, isRunning: false });
  }, []);

  // Get stats
  const stats = {
    total: atHomeExercises.length,
    generated: allImages.filter((img) => img.generation_status === 'complete').length,
    pending: allImages.filter((img) => img.generation_status === 'pending').length,
    generating: allImages.filter((img) => img.generation_status === 'generating').length,
    failed: allImages.filter((img) => img.generation_status === 'failed').length,
    notStarted: atHomeExercises.length - allImages.length,
  };

  return {
    allImages,
    loading,
    stats,
    generatingIds,
    batchProgress,
    generateImage,
    generateAllMissing,
    regenerateAll,
    stopBatchGeneration,
    refreshImages: fetchAllImages,
  };
}

