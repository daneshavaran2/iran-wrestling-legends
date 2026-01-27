import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon, Film, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GoldButton } from './ui/GoldButton';

interface UploadProgressItem {
  fileName: string;
  progress: number;
  status?: 'compressing' | 'uploading' | 'complete';
  originalSize?: number;
  compressedSize?: number;
}

interface UploadDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  isUploading?: boolean;
  uploadProgress?: UploadProgressItem[];
  accept?: string;
  minSizeMB?: number;
  maxSizeMB?: number;
  maxFiles?: number;
  multiple?: boolean;
  showLimits?: boolean;
  className?: string;
}

export function UploadDropzone({
  onFilesSelected,
  isUploading = false,
  uploadProgress = [],
  accept = 'image/jpeg,image/png,image/webp,video/mp4',
  minSizeMB = 0.01,
  maxSizeMB = 10,
  maxFiles = 20,
  multiple = true,
  showLimits = false,
  className,
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState<{ file: File; url: string; type: string }[]>([]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const validateFiles = (files: File[]): File[] => {
    const maxSize = maxSizeMB * 1024 * 1024;
    const minSize = minSizeMB * 1024 * 1024;
    const acceptedTypes = accept.split(',').map(t => t.trim());
    
    // Limit number of files
    const limitedFiles = files.slice(0, maxFiles);
    
    return limitedFiles.filter(file => {
      if (file.size > maxSize) {
        console.warn(`فایل ${file.name} بزرگتر از ${maxSizeMB} مگابایت است`);
        return false;
      }
      if (file.size < minSize) {
        console.warn(`فایل ${file.name} کوچکتر از ${minSizeMB * 1024} کیلوبایت است`);
        return false;
      }
      if (!acceptedTypes.some(type => file.type.match(type.replace('*', '.*')))) {
        console.warn(`فایل ${file.name} فرمت نامعتبر دارد`);
        return false;
      }
      return true;
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = validateFiles(files);
    
    if (validFiles.length > 0) {
      addPreviews(validFiles);
      onFilesSelected(validFiles);
    }
  }, [onFilesSelected, maxSizeMB, accept]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = validateFiles(files);
    
    if (validFiles.length > 0) {
      addPreviews(validFiles);
      onFilesSelected(validFiles);
    }
    
    // Reset input
    e.target.value = '';
  };

  const addPreviews = (files: File[]) => {
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      setPreviews(prev => [...prev, { file, url, type }]);
    });
  };

  const removePreview = (index: number) => {
    setPreviews(prev => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index].url);
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Area */}
      <label
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center',
          'border-2 border-dashed rounded-2xl p-8 cursor-pointer',
          'transition-all duration-200',
          isDragging 
            ? 'border-primary bg-primary/5 scale-[1.02]' 
            : 'border-border hover:border-primary/50 hover:bg-muted/30',
          isUploading && 'pointer-events-none opacity-60'
        )}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        
        {isUploading ? (
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        ) : (
          <Upload className={cn(
            'h-12 w-12 mb-4 transition-colors',
            isDragging ? 'text-primary' : 'text-muted-foreground'
          )} />
        )}
        
        <p className="text-lg font-medium mb-1">
          {isDragging ? 'رها کنید' : 'فایل‌ها را اینجا رها کنید'}
        </p>
        <p className="text-sm text-muted-foreground">
          یا کلیک کنید تا فایل انتخاب شود
        </p>
        
        {/* Upload Limits Display */}
        {showLimits && (
          <div className="mt-4 p-4 rounded-xl bg-muted/30 text-sm text-right w-full max-w-sm">
            <h5 className="font-medium mb-2 text-foreground">📋 محدودیت‌های آپلود:</h5>
            <ul className="space-y-1 text-muted-foreground">
              <li>• حداقل سایز: {minSizeMB >= 1 ? `${minSizeMB} مگابایت` : `${Math.round(minSizeMB * 1024)} کیلوبایت`}</li>
              <li>• حداکثر سایز: {maxSizeMB} مگابایت</li>
              <li>• حداکثر تعداد فایل: {maxFiles} عدد</li>
              <li>• فرمت‌های مجاز: JPG, PNG, WebP, MP4</li>
            </ul>
          </div>
        )}
        
        {!showLimits && (
          <p className="text-xs text-muted-foreground mt-3">
            JPG, PNG, WebP, MP4 (حداکثر {maxSizeMB} مگابایت)
          </p>
        )}
      </label>

      {/* Upload Progress with Compression Info */}
      {uploadProgress.length > 0 && (
        <div className="space-y-2">
          {uploadProgress.map((item, index) => (
            <div key={index} className="glass-card p-3">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="truncate max-w-[50%]">{item.fileName}</span>
                <div className="flex items-center gap-2">
                  {item.status === 'compressing' && (
                    <span className="text-yellow-500 text-xs flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      فشرده‌سازی...
                    </span>
                  )}
                  {item.status === 'uploading' && (
                    <span className="text-blue-500 text-xs">آپلود...</span>
                  )}
                  {item.status === 'complete' && item.compressedSize && item.originalSize && (
                    <span className="text-green-500 text-xs">
                      ✓ {Math.round((1 - item.compressedSize / item.originalSize) * 100)}% کاهش
                    </span>
                  )}
                  <span className="text-primary font-medium">{item.progress}%</span>
                </div>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    item.status === 'compressing' 
                      ? 'bg-yellow-500' 
                      : item.status === 'complete' 
                        ? 'bg-green-500' 
                        : 'bg-primary'
                  )}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              {/* نمایش جزئیات حجم */}
              {item.originalSize && item.compressedSize && item.status === 'complete' && (
                <div className="text-xs text-muted-foreground mt-1 text-left">
                  {(item.originalSize / 1024).toFixed(0)}KB → {(item.compressedSize / 1024).toFixed(0)}KB
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {previews.map((preview, index) => (
            <div key={index} className="relative group aspect-square">
              {preview.type === 'image' ? (
                <img
                  src={preview.url}
                  alt="پیش‌نمایش"
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="w-full h-full bg-muted rounded-xl flex items-center justify-center">
                  <Film className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <button
                onClick={() => removePreview(index)}
                className="absolute top-1 left-1 p-1 rounded-full bg-destructive/90 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-1 right-1 p-1 rounded-full bg-black/50">
                {preview.type === 'image' ? (
                  <ImageIcon className="h-3 w-3 text-white" />
                ) : (
                  <Film className="h-3 w-3 text-white" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
