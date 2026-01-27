import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { optimizeImage } from '@/utils/imageCompressor';

interface UploadProgress {
  fileName: string;
  progress: number;
  status?: 'compressing' | 'uploading' | 'complete';
  originalSize?: number;
  compressedSize?: number;
}

export function useMediaUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File, folderId: string, bucket: string = 'wrestler-media'): Promise<string> => {
    setIsUploading(true);
    setError(null);

    try {
      const originalSize = file.size;
      
      // نمایش وضعیت فشرده‌سازی
      setUploadProgress(prev => [...prev, { 
        fileName: file.name, 
        progress: 0, 
        status: 'compressing',
        originalSize 
      }]);

      // فشرده‌سازی و بهینه‌سازی تصویر (تبدیل به WebP با کاهش حجم)
      const processedFile = await optimizeImage(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.82,
        outputFormat: 'webp'
      });
      
      const compressedSize = processedFile.size;
      const compressionRatio = originalSize > 0 ? Math.round((1 - compressedSize / originalSize) * 100) : 0;

      // بروزرسانی وضعیت به آپلود
      setUploadProgress(prev => 
        prev.map(p => p.fileName === file.name ? { 
          ...p, 
          progress: 30, 
          status: 'uploading',
          compressedSize 
        } : p)
      );

      const fileExt = processedFile.name.split('.').pop();
      const fileName = `${folderId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // ✅ آپلود فایل فشرده شده (نه فایل اصلی!)
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, processedFile, {
          cacheControl: '31536000', // 1 year cache
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setUploadProgress(prev => 
        prev.map(p => p.fileName === file.name ? { 
          ...p, 
          progress: 100, 
          status: 'complete' 
        } : p)
      );

      // نمایش نتیجه در کنسول
      console.log(`✅ آپلود موفق: ${file.name} | کاهش ${compressionRatio}% (${(originalSize / 1024).toFixed(0)}KB → ${(compressedSize / 1024).toFixed(0)}KB)`);

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در آپلود فایل';
      console.error('Upload error:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setUploadProgress([]);
      }, 3000);
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
