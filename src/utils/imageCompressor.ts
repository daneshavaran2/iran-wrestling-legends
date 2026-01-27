/**
 * فشرده‌سازی و بهینه‌سازی تصاویر قبل از آپلود
 * شامل تبدیل همه فرمت‌ها به WebP و کاهش حجم تا ۹۰٪
 */

export interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputFormat?: 'webp' | 'jpeg';
}

/**
 * فشرده‌سازی و بهینه‌سازی تصویر
 * تبدیل همه فرمت‌ها (JPEG, PNG, BMP, etc.) به WebP با کاهش حجم قابل توجه
 */
export async function optimizeImage(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.82,
    outputFormat = 'webp'
  } = options;

  // اگر فایل ویدیو است، بدون تغییر برگردان
  if (file.type.startsWith('video/')) {
    return file;
  }

  // اگر فایل تصویر نیست، بدون تغییر برگردان
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // برای فایل‌های خیلی کوچک (زیر 100KB) نیازی به فشرده‌سازی نیست
  if (file.size < 100 * 1024) {
    console.log(`⏭️ فایل ${file.name} کوچک است (${(file.size / 1024).toFixed(0)}KB) - بدون فشرده‌سازی`);
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    
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
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.warn('❌ خطا در ایجاد canvas context');
        resolve(file);
        return;
      }
      
      // رسم تصویر با کیفیت بالا
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      const mimeType = outputFormat === 'webp' ? 'image/webp' : 'image/jpeg';
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.warn('❌ خطا در ایجاد blob');
            resolve(file);
            return;
          }
          
          // اگر حجم فشرده بیشتر یا مساوی اصلی شد، فایل اصلی را برگردان
          if (blob.size >= file.size) {
            console.log(`⏭️ فشرده‌سازی ${file.name} بهبودی نداشت - استفاده از اصلی`);
            resolve(file);
            return;
          }
          
          // تغییر پسوند فایل
          const newExt = outputFormat === 'webp' ? '.webp' : '.jpg';
          const newName = file.name.replace(/\.[^.]+$/, newExt);
          
          const optimizedFile = new File([blob], newName, {
            type: mimeType,
            lastModified: Date.now(),
          });
          
          const reduction = Math.round((1 - blob.size / file.size) * 100);
          console.log(`✅ فشرده‌سازی: ${file.name} (${(file.size / 1024).toFixed(0)}KB) → ${newName} (${(blob.size / 1024).toFixed(0)}KB) | کاهش ${reduction}%`);
          
          resolve(optimizedFile);
        },
        mimeType,
        quality
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      console.warn(`❌ خطا در بارگذاری تصویر: ${file.name}`);
      resolve(file);
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * تبدیل تصویر BMP به WebP برای کاهش چشمگیر حجم
 * @deprecated از optimizeImage استفاده کنید
 */
export async function convertToWebP(
  file: File,
  quality: number = 0.85
): Promise<File> {
  return optimizeImage(file, { quality, outputFormat: 'webp' });
}

/**
 * فشرده‌سازی تصویر با تغییر ابعاد
 * @deprecated از optimizeImage استفاده کنید
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<File> {
  return optimizeImage(file, { maxWidth, maxHeight, quality });
}

/**
 * فشرده‌سازی چند تصویر به صورت موازی
 */
export async function compressImages(
  files: File[],
  options: OptimizeImageOptions = {}
): Promise<File[]> {
  return Promise.all(
    files.map((file) => optimizeImage(file, options))
  );
}
