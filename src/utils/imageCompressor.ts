/**
 * فشرده‌سازی و بهینه‌سازی تصاویر قبل از آپلود
 * شامل تبدیل BMP به WebP و کاهش حجم تا ۷۰٪
 */

/**
 * تبدیل تصویر BMP به WebP برای کاهش چشمگیر حجم
 */
export async function convertToWebP(
  file: File,
  quality: number = 0.85
): Promise<File> {
  // تشخیص BMP
  const isBMP = file.type === 'image/bmp' || 
                file.name.toLowerCase().endsWith('.bmp');
  
  // اگر BMP نیست و تصویر نیست، بدون تغییر برگردان
  if (!isBMP && !file.type.startsWith('image/')) {
    return file;
  }

  // اگر BMP نیست، فقط برای فشرده‌سازی ادامه بده
  if (!isBMP) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          
          // تغییر نام فایل به .webp
          const newName = file.name.replace(/\.[^.]+$/, '.webp');
          const webpFile = new File([blob], newName, {
            type: 'image/webp',
            lastModified: Date.now(),
          });
          
          console.log(`تبدیل BMP به WebP: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) → ${newName} (${(blob.size / 1024 / 1024).toFixed(2)}MB)`);
          
          resolve(webpFile);
        },
        'image/webp',
        quality
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve(file);
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * فشرده‌سازی تصویر با تغییر ابعاد
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<File> {
  // اگر فایل ویدیو است، بدون تغییر برگردان
  if (file.type.startsWith('video/')) {
    return file;
  }

  // اگر فایل تصویر نیست، بدون تغییر برگردان
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // اگر حجم فایل کمتر از 500KB است، نیازی به فشرده‌سازی نیست
  if (file.size < 500 * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      URL.revokeObjectURL(img.src);

      let { width, height } = img;

      // محاسبه ابعاد جدید با حفظ نسبت تصویر
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      if (!ctx) {
        resolve(file);
        return;
      }

      // رسم تصویر با کیفیت بالا
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // تبدیل به Blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          // اگر حجم فشرده بیشتر از اصلی شد، فایل اصلی را برگردان
          if (blob.size >= file.size) {
            resolve(file);
            return;
          }

          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve(file); // در صورت خطا، فایل اصلی را برگردان
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * فشرده‌سازی چند تصویر به صورت موازی
 */
export async function compressImages(
  files: File[],
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<File[]> {
  return Promise.all(
    files.map((file) => compressImage(file, maxWidth, maxHeight, quality))
  );
}
