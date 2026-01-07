import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, RotateCcw, Check, X, Loader2 } from 'lucide-react';
import { GoldButton } from '@/components/ui/GoldButton';

interface ImageRotatorProps {
  file: File;
  onSave: (rotatedFile: File) => void;
  onCancel: () => void;
}

export function ImageRotator({ file, onSave, onCancel }: ImageRotatorProps) {
  const [rotation, setRotation] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    const img = new Image();
    img.src = url;
    img.onload = () => {
      imageRef.current = img;
    };
    
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const rotateLeft = () => setRotation(prev => (prev - 90 + 360) % 360);
  const rotateRight = () => setRotation(prev => (prev + 90) % 360);

  const handleSave = async () => {
    if (!imageRef.current || !canvasRef.current) return;
    
    setIsProcessing(true);
    
    try {
      const img = imageRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;
      
      // Calculate new dimensions based on rotation
      const isRotated90or270 = rotation === 90 || rotation === 270;
      const newWidth = isRotated90or270 ? img.height : img.width;
      const newHeight = isRotated90or270 ? img.width : img.height;
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Move to center, rotate, and draw
      ctx.translate(newWidth / 2, newHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      
      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const rotatedFile = new File([blob], file.name, {
              type: file.type || 'image/jpeg',
              lastModified: Date.now(),
            });
            onSave(rotatedFile);
          }
        },
        file.type || 'image/jpeg',
        0.95
      );
    } catch (error) {
      console.error('Error rotating image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="text-white text-sm mb-4">چرخش تصویر - {file.name}</div>
      
      {/* Preview */}
      <div className="relative max-w-full max-h-[60vh] overflow-hidden rounded-lg bg-black/50">
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-full max-h-[60vh] object-contain transition-transform duration-300"
            style={{ transform: `rotate(${rotation}deg)` }}
          />
        )}
      </div>
      
      {/* Controls */}
      <div className="flex items-center gap-4 mt-6">
        <GoldButton
          variant="outline"
          size="lg"
          onClick={rotateLeft}
          disabled={isProcessing}
        >
          <RotateCcw className="h-6 w-6" />
        </GoldButton>
        
        <div className="text-white text-lg font-bold min-w-[60px] text-center">
          {rotation}°
        </div>
        
        <GoldButton
          variant="outline"
          size="lg"
          onClick={rotateRight}
          disabled={isProcessing}
        >
          <RotateCw className="h-6 w-6" />
        </GoldButton>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-4 mt-8">
        <GoldButton
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
        >
          <X className="h-5 w-5 ml-2" />
          انصراف
        </GoldButton>
        <GoldButton
          onClick={handleSave}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin ml-2" />
          ) : (
            <Check className="h-5 w-5 ml-2" />
          )}
          ذخیره و آپلود
        </GoldButton>
      </div>
    </div>
  );
}
