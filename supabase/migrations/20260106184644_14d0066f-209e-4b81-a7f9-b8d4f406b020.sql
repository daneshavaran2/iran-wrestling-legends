-- Add music settings columns to app_settings table
ALTER TABLE public.app_settings
ADD COLUMN IF NOT EXISTS bg_music_url TEXT,
ADD COLUMN IF NOT EXISTS bg_music_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS bg_music_volume DECIMAL DEFAULT 0.3,
ADD COLUMN IF NOT EXISTS bg_music_autoplay BOOLEAN DEFAULT false;

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('museum-audio', 'museum-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for museum-audio bucket
CREATE POLICY "Public can view audio files"
ON storage.objects FOR SELECT
USING (bucket_id = 'museum-audio');

CREATE POLICY "Authenticated users can upload audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'museum-audio' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update audio"
ON storage.objects FOR UPDATE
USING (bucket_id = 'museum-audio' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete audio"
ON storage.objects FOR DELETE
USING (bucket_id = 'museum-audio' AND auth.role() = 'authenticated');