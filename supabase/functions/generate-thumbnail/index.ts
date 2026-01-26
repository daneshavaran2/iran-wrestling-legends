import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ThumbnailRequest {
  imageUrl: string;
  sizes?: {
    tiny?: number;
    thumbnail?: number;
    medium?: number;
    full?: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, sizes = {} }: ThumbnailRequest = await req.json();
    
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "imageUrl is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // تنظیمات پیش‌فرض سایزها
    const defaultSizes = {
      tiny: sizes.tiny || 150,
      thumbnail: sizes.thumbnail || 400,
      medium: sizes.medium || 800,
      full: sizes.full || 1920,
    };

    // تابع تبدیل URL به فرمت Supabase Image Transform
    const transformUrl = (url: string, width: number, quality: number): string => {
      if (!url.includes('supabase.co/storage/v1/object/public/')) {
        return url;
      }
      const renderUrl = url.replace(
        '/storage/v1/object/public/',
        '/storage/v1/render/image/public/'
      );
      return `${renderUrl}?width=${width}&quality=${quality}`;
    };

    // تولید URLهای بهینه‌سازی شده
    const result = {
      original: imageUrl,
      tiny: transformUrl(imageUrl, defaultSizes.tiny, 50),
      thumbnail: transformUrl(imageUrl, defaultSizes.thumbnail, 60),
      medium: transformUrl(imageUrl, defaultSizes.medium, 75),
      full: transformUrl(imageUrl, defaultSizes.full, 85),
    };

    console.log(`Generated thumbnails for: ${imageUrl}`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error("Thumbnail generation error:", err);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
