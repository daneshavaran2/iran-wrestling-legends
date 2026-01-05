-- Create history_media table for images/videos attached to history sections
CREATE TABLE public.history_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.history_sections(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'image' CHECK (type IN ('image', 'video')),
  url TEXT NOT NULL,
  title TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create about_media table for images/videos in about section
CREATE TABLE public.about_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'image' CHECK (type IN ('image', 'video')),
  url TEXT NOT NULL,
  title TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add type column to building_images to support videos
ALTER TABLE public.building_images 
ADD COLUMN type TEXT NOT NULL DEFAULT 'image' CHECK (type IN ('image', 'video'));

-- Enable RLS on new tables
ALTER TABLE public.history_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_media ENABLE ROW LEVEL SECURITY;

-- RLS policies for history_media
CREATE POLICY "Public can view history_media" ON public.history_media FOR SELECT USING (true);
CREATE POLICY "Admins can insert history_media" ON public.history_media FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update history_media" ON public.history_media FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete history_media" ON public.history_media FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for about_media
CREATE POLICY "Public can view about_media" ON public.about_media FOR SELECT USING (true);
CREATE POLICY "Admins can insert about_media" ON public.about_media FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update about_media" ON public.about_media FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete about_media" ON public.about_media FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));