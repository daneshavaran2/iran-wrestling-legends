import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { convertToWebP, compressImage } from '@/utils/imageCompressor';

interface UploadProgress {
  fileName: string;
  progress: number;
  status?: 'processing' | 'uploading' | 'complete';
}

export function useMediaUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File, folderId: string, bucket: string = 'wrestler-media'): Promise<string> => {
    setIsUploading(true);
    setError(null);

    try {
      // نمایش وضعیت پردازش
      setUploadProgress(prev => [...prev, { fileName: file.name, progress: 0, status: 'processing' }]);

      // مرحله ۱: تبدیل BMP به WebP
      let processedFile = await convertToWebP(file);
      
      // مرحله ۲: فشرده‌سازی تصویر
      processedFile = await compressImage(processedFile);

      // بروزرسانی وضعیت به آپلود
      setUploadProgress(prev => 
        prev.map(p => p.fileName === file.name ? { ...p, progress: 10, status: 'uploading' } : p)
      );

      const fileExt = processedFile.name.split('.').pop();
      const fileName = `${folderId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setUploadProgress(prev => 
        prev.map(p => p.fileName === file.name ? { ...p, progress: 100 } : p)
      );

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'خطا در آپلود فایل');
      throw err;
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setUploadProgress([]);
      }, 2000);
    }
  };

  const deleteFile = async (fileUrl: string): Promise<void> => {
    try {
      // Extract path from URL
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/wrestler-media/');
      if (pathParts.length < 2) return;
      
      const filePath = pathParts[1];

      const { error } = await supabase.storage
        .from('wrestler-media')
        .remove([filePath]);

      if (error) throw error;
    } catch (err: any) {
      console.error('Delete error:', err);
      throw err;
    }
  };

  const clearError = () => setError(null);

  return {
    uploadFile,
    deleteFile,
    isUploading,
    uploadProgress,
    error,
    clearError,
  };
}
