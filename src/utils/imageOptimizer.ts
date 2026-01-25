/**
 * Image optimization utilities using Supabase Image Transformation
 * Converts storage URLs to render URLs with size and quality parameters
 */

interface OptimizeOptions {
  width?: number;
  height?: number;
  quality?: number;
}

/**
 * Convert Supabase storage URL to optimized render URL
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  options: OptimizeOptions = {}
): string {
  if (!url) return '/placeholder.svg';
  
  // Only transform Supabase storage URLs
  if (!url.includes('supabase.co/storage/v1/object/public/')) {
    return url;
  }
  
  const { width = 400, height, quality = 75 } = options;
  
  // Convert to render URL format
  const transformUrl = url.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  );
  
  const params = new URLSearchParams();
  params.set('width', width.toString());
  if (height) params.set('height', height.toString());
  params.set('quality', quality.toString());
  
  return `${transformUrl}?${params.toString()}`;
}

/**
 * Get tiny thumbnail (for strips, previews)
 * ~10-20KB
 */
export function getTinyThumbnailUrl(url: string | null | undefined): string {
  return getOptimizedImageUrl(url, { width: 150, quality: 50 });
}

/**
 * Get thumbnail for lists and grids
 * ~20-50KB
 */
export function getThumbnailUrl(url: string | null | undefined): string {
  return getOptimizedImageUrl(url, { width: 400, quality: 60 });
}

/**
 * Get medium size for gallery grids
 * ~100-200KB
 */
export function getMediumUrl(url: string | null | undefined): string {
  return getOptimizedImageUrl(url, { width: 800, quality: 75 });
}

/**
 * Get full size for full-screen viewing
 * ~300-500KB
 */
export function getFullUrl(url: string | null | undefined): string {
  return getOptimizedImageUrl(url, { width: 1920, quality: 85 });
}

/**
 * Preload an image in the background
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Preload multiple images
 */
export function preloadImages(urls: string[]): void {
  urls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
}
