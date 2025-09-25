import heic2any from 'heic2any';

export const isHEICFile = (file: File): boolean => {
  return file.type === 'image/heic' || file.type === 'image/heif' || 
         file.name.toLowerCase().endsWith('.heic') || 
         file.name.toLowerCase().endsWith('.heif');
};

export const convertHEICToJPEG = async (file: File): Promise<File> => {
  if (!isHEICFile(file)) {
    return file; // Return original file if not HEIC
  }

  try {
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.8
    }) as Blob;

    // Create a new File object with the converted blob
    const convertedFile = new File(
      [convertedBlob], 
      file.name.replace(/\.(heic|heif)$/i, '.jpg'),
      { type: 'image/jpeg' }
    );

    return convertedFile;
  } catch (error) {
    console.error('Failed to convert HEIC file:', error);
    throw new Error('Failed to convert HEIC image. Please try a different image format.');
  }
};

export const processImageFile = async (file: File): Promise<File> => {
  if (isHEICFile(file)) {
    return await convertHEICToJPEG(file);
  }
  return file;
};