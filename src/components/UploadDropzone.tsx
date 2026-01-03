import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon, Film, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GoldButton } from './ui/GoldButton';

interface UploadDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  isUploading?: boolean;
  uploadProgress?: { fileName: string; progress: number }[];
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  className?: string;
}

export function UploadDropzone({
  onFilesSelected,
  isUploading = false,
  uploadProgress = [],
  accept = 'image/jpeg,image/png,image/webp,video/mp4',
  maxSizeMB = 10,
  multiple = true,
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
    const acceptedTypes = accept.split(',').map(t => t.trim());
    
    return files.filter(file => {
      if (file.size > maxSize) {
        console.warn(`File ${file.name} is too large`);
        return false;
      }
      if (!acceptedTypes.some(type => file.type.match(type.replace('*', '.*')))) {
        console.warn(`File ${file.name} has invalid type`);
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
        <p className="text-xs text-muted-foreground mt-3">
          JPG, PNG, WebP, MP4 (حداکثر {maxSizeMB} مگابایت)
        </p>
      </label>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="space-y-2">
          {uploadProgress.map((item, index) => (
            <div key={index} className="glass-card p-3">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="truncate">{item.fileName}</span>
                <span className="text-primary">{item.progress}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
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
