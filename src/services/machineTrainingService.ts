import { supabase } from '@/integrations/supabase/client';
import { RecognitionResult } from '@/types/machine';

interface TrainingDataParams {
  photoBlob: Blob;
  aiResult: RecognitionResult;
  userSelectedMachineId: string;
  captureMethod: 'camera' | 'upload' | 'live_scan';
  alternatives?: RecognitionResult[];
}

export const MachineTrainingService = {
  /**
   * Save training data from a machine scan to improve AI recognition over time.
   * This runs in the background and should not block user flow.
   */
  async saveTrainingData({
    photoBlob,
    aiResult,
    userSelectedMachineId,
    captureMethod,
    alternatives = []
  }: TrainingDataParams): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Allow anonymous training data collection for network effect
      const userId = user?.id;
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const folder = userId || 'anonymous';
      const fileName = `${folder}/${timestamp}_${randomSuffix}.jpg`;
      
      // Upload photo to storage bucket
      const { error: uploadError } = await supabase.storage
        .from('machine-scan-photos')
        .upload(fileName, photoBlob, {
          contentType: 'image/jpeg',
          cacheControl: '3600'
        });
      
      if (uploadError) {
        console.error('Training photo upload failed:', uploadError);
        return;
      }
      
      // Get public URL for the uploaded photo
      const { data: { publicUrl } } = supabase.storage
        .from('machine-scan-photos')
        .getPublicUrl(fileName);
      
      // Determine device type
      const deviceType = /mobile|android|iphone|ipad/i.test(navigator.userAgent) 
        ? 'mobile' 
        : 'desktop';
      
      // Insert training record
      const { error: insertError } = await supabase
        .from('machine_scan_training')
        .insert({
          user_id: userId || null,
          photo_url: publicUrl,
          photo_storage_path: fileName,
          ai_detected_machine_id: aiResult.machineId,
          ai_confidence: aiResult.confidence,
          ai_reasoning: aiResult.reasoning || null,
          ai_alternatives: alternatives.length > 0 
            ? alternatives.map(a => ({
                machineId: a.machineId,
                confidence: a.confidence,
                name: a.name
              }))
            : null,
          user_selected_machine_id: userSelectedMachineId,
          device_type: deviceType,
          capture_method: captureMethod
        });
      
      if (insertError) {
        console.error('Training data insert failed:', insertError);
        return;
      }
      
      console.log('Training data saved:', {
        machineId: userSelectedMachineId,
        wasCorrect: aiResult.machineId === userSelectedMachineId,
        confidence: aiResult.confidence
      });
      
    } catch (error) {
      // Silently fail - training data collection should never impact user experience
      console.error('Training data save error:', error);
    }
  },

  /**
   * Get canvas blob from a canvas element for upload
   */
  getCanvasBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        'image/jpeg',
        0.85
      );
    });
  }
};
