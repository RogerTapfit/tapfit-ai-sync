import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WeightStackData {
  id: string;
  machine_name: string;
  weight_stack: number[];
  photo_url: string;
  verification_count: number;
  contributed_by: string;
}

export const useWeightStack = (machineName: string) => {
  const [weightStack, setWeightStack] = useState<number[] | null>(null);
  const [stackData, setStackData] = useState<WeightStackData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (machineName) {
      fetchWeightStack();
    } else {
      setLoading(false);
    }
  }, [machineName]);

  const fetchWeightStack = async () => {
    try {
      setLoading(true);
      
      // First try exact match
      let { data, error } = await supabase
        .from('machine_weight_stacks')
        .select('*')
        .eq('machine_name', machineName)
        .maybeSingle();

      // If no exact match, try fuzzy match
      if (!data && !error) {
        const { data: fuzzyData } = await supabase
          .from('machine_weight_stacks')
          .select('*')
          .ilike('machine_name', `%${machineName.split(' ')[0]}%`)
          .limit(1)
          .maybeSingle();
        
        data = fuzzyData;
      }

      if (error) {
        console.error('Error fetching weight stack:', error);
      } else if (data) {
        const stack = data.weight_stack as number[];
        setWeightStack(stack);
        setStackData({
          id: data.id,
          machine_name: data.machine_name,
          weight_stack: stack,
          photo_url: data.photo_url,
          verification_count: data.verification_count || 1,
          contributed_by: data.contributed_by || ''
        });
      }
    } catch (err) {
      console.error('Error in useWeightStack:', err);
    } finally {
      setLoading(false);
    }
  };

  const contributeWeightStack = async (
    weightStackValues: number[],
    photoBlob: Blob,
    gymId?: string
  ): Promise<{ success: boolean; coinsAwarded: number }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Upload photo to storage
      const fileName = `${user.id}/${machineName.replace(/\s+/g, '-')}_${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('weight-stack-photos')
        .upload(fileName, photoBlob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading photo:', uploadError);
        throw new Error('Failed to upload photo');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('weight-stack-photos')
        .getPublicUrl(fileName);

      // Check if stack already exists for this machine
      const { data: existingStack } = await supabase
        .from('machine_weight_stacks')
        .select('id, contributed_by')
        .eq('machine_name', machineName)
        .maybeSingle();

      let coinsAwarded = 25; // Default for new contribution

      if (existingStack) {
        // Update existing (only if user is the contributor)
        if (existingStack.contributed_by === user.id) {
          const { error: updateError } = await supabase
            .from('machine_weight_stacks')
            .update({
              weight_stack: weightStackValues,
              photo_url: publicUrl,
              photo_storage_path: fileName,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingStack.id);

          if (updateError) throw updateError;
          coinsAwarded = 10; // Less coins for updating own contribution
        } else {
          // Different user - could be verification or correction
          // For now, we'll just update the verification count
          const { error: verifyError } = await supabase
            .from('machine_weight_stacks')
            .update({
              verification_count: (stackData?.verification_count || 1) + 1,
              verified_by: [...((stackData as any)?.verified_by || []), user.id]
            })
            .eq('id', existingStack.id);

          if (verifyError) throw verifyError;
          coinsAwarded = 10; // Verification bonus
        }
      } else {
        // Insert new weight stack
        const { error: insertError } = await supabase
          .from('machine_weight_stacks')
          .insert({
            machine_name: machineName,
            gym_id: gymId || null,
            weight_stack: weightStackValues,
            photo_url: publicUrl,
            photo_storage_path: fileName,
            contributed_by: user.id
          });

        if (insertError) throw insertError;
      }

      // Award Tap Coins
      const { error: coinError } = await supabase.rpc('add_tap_coins', {
        _user_id: user.id,
        _amount: coinsAwarded,
        _description: 'Weight stack contribution',
        _transaction_type: 'contribution',
        _reference_id: machineName
      });

      if (coinError) {
        console.warn('Failed to award coins:', coinError);
        // Don't throw - contribution was still successful
      }

      // Update local state
      setWeightStack(weightStackValues);
      await fetchWeightStack();

      return { success: true, coinsAwarded };
    } catch (err) {
      console.error('Error contributing weight stack:', err);
      throw err;
    }
  };

  const extractWeightStackFromPhoto = async (imageBase64: string): Promise<number[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('extract-weight-stack', {
        body: { imageBase64 }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to extract weights');

      return data.weightStack;
    } catch (err) {
      console.error('Error extracting weight stack:', err);
      throw err;
    }
  };

  return {
    weightStack,
    stackData,
    loading,
    contributeWeightStack,
    extractWeightStackFromPhoto,
    refetch: fetchWeightStack
  };
};

/**
 * Snap a recommended weight to the nearest available weight in the stack
 */
export function snapToAvailableWeight(recommendedWeight: number, weightStack: number[] | null): number {
  if (!weightStack || weightStack.length === 0) {
    // Fallback to nearest 5 lbs
    return Math.round(recommendedWeight / 5) * 5;
  }

  // Find the closest weight in the stack
  return weightStack.reduce((closest, weight) => {
    return Math.abs(weight - recommendedWeight) < Math.abs(closest - recommendedWeight)
      ? weight
      : closest;
  }, weightStack[0]);
}

/**
 * Get the next weight up in the stack (for progression)
 */
export function getNextWeightUp(currentWeight: number, weightStack: number[] | null): number | null {
  if (!weightStack || weightStack.length === 0) {
    return currentWeight + 5; // Default 5lb increment
  }

  const sorted = [...weightStack].sort((a, b) => a - b);
  const currentIndex = sorted.findIndex(w => w >= currentWeight);
  
  if (currentIndex === -1) return null; // Already at max
  if (currentIndex === sorted.length - 1) return null; // Already at max
  
  return sorted[currentIndex + 1];
}

/**
 * Get the next weight down in the stack (for deload)
 */
export function getNextWeightDown(currentWeight: number, weightStack: number[] | null): number | null {
  if (!weightStack || weightStack.length === 0) {
    return Math.max(5, currentWeight - 5); // Default 5lb decrement
  }

  const sorted = [...weightStack].sort((a, b) => a - b);
  const currentIndex = sorted.findIndex(w => w >= currentWeight);
  
  if (currentIndex <= 0) return null; // Already at min
  
  return sorted[currentIndex - 1];
}
