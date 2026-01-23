import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Image as ImageIcon, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { SparkParticles } from '@/components/ui/SparkParticles';
import { useKioskMode } from '@/hooks/useKioskMode';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { LazyImage } from '@/components/ui/LazyImage';

interface Building {
  id: string;
  name: string;
  description: string | null;
  hero_image_url: string | null;
}

interface BuildingImage {
  id: string;
  url: string;
  title: string | null;
  display_order: number;
}

export default function BuildingDetailPage() {
  useKioskMode();
  const { id } = useParams();
  const navigate = useNavigate();
  const [building, setBuilding] = useState<Building | null>(null);
  const [images, setImages] = useState<BuildingImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      // Fetch building
      const { data: buildingData, error: buildingError } = await supabase
        .from('buildings')
        .select('id, name, description, hero_image_url')
        .eq('id', id)
        .single();

      if (buildingError) throw buildingError;
      setBuilding(buildingData);

      // Fetch images
      const { data: imagesData } = await supabase
        .from('building_images')
        .select('*')
        .eq('building_id', id)
        .order('display_order');

      setImages(imagesData || []);
    } catch (error) {
      console.error('Error fetching building:', error);
      navigate('/buildings');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <div className="container mx-auto max-w-5xl">
          <Skeleton className="h-12 w-48 mb-8" />
          <Skeleton className="aspect-video w-full mb-8 rounded-2xl" />
          <Skeleton className="h-8 w-1/3 mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!building) {
    return null;
  }

  return (
    <div className="min-h-screen relative">
      {/* Spark Particles */}
      <SparkParticles count={20} />

      {/* Header */}
      <header className="relative py-8 px-6 2xl:py-12 z-10">
        <div className="container mx-auto max-w-5xl">
          {/* Back Button */}
          <div className="flex items-center gap-4 mb-8 animate-fade-in">
            <GoldButton
              variant="ghost"
              size="lg"
              onClick={() => navigate('/buildings')}
              className="flex items-center gap-2 cyber-button"
            >
              <ArrowRight className="h-5 w-5" />
              بازگشت به بناها
            </GoldButton>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 pb-12 max-w-5xl relative z-10">
        {/* Hero Image */}
        {building.hero_image_url && (
          <div 
            className="aspect-video rounded-2xl overflow-hidden mb-8 cursor-pointer animate-scale-in cyber-hud"
            onClick={() => setSelectedImage(building.hero_image_url)}
          >
            <LazyImage
              src={building.hero_image_url}
              alt={building.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}

        {/* Title & Description */}
        <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h1 className="text-3xl md:text-4xl xl:text-5xl font-bold mb-6">
            <span className="text-neon neon-glow">{building.name}</span>
          </h1>

          {building.description && (
            <div className="cyber-glass p-8 md:p-10 mb-8 rounded-3xl">
              <p className="text-lg md:text-xl leading-relaxed whitespace-pre-wrap" style={{ lineHeight: '2' }}>
                {building.description}
              </p>
            </div>
          )}
        </div>

        {/* Image Gallery */}
        {images.length > 0 && (
          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
              <ImageIcon className="h-6 w-6 text-primary" />
              گالری تصاویر
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {images.map((image) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(image.url)}
                  className="aspect-square rounded-xl overflow-hidden focus:outline-none group cyber-glass"
                >
                  <LazyImage
                    src={image.url}
                    alt={image.title || building.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative max-w-5xl max-h-[90vh] animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 left-1/2 -translate-x-1/2 text-white/70 hover:text-white transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
            <img
              src={selectedImage}
              alt={building.name}
              className="w-full h-full object-contain rounded-2xl border-2 border-primary/30 shadow-[0_0_60px_hsl(20_100%_50%/0.3)]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
