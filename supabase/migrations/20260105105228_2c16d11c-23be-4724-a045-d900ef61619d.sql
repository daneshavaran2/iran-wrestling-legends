-- Create history_sections table for hierarchical history content
CREATE TABLE public.history_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.history_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  highlighted_quote TEXT,
  content TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create buildings table
CREATE TABLE public.buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  hero_image_url TEXT,
  map_link TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create building_images table for gallery
CREATE TABLE public.building_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create books table
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  cover_image_url TEXT,
  summary TEXT,
  related_wrestler_id UUID REFERENCES public.wrestlers(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add new fields to wrestlers table
ALTER TABLE public.wrestlers 
ADD COLUMN IF NOT EXISTS intro_video_url TEXT,
ADD COLUMN IF NOT EXISTS success_path TEXT,
ADD COLUMN IF NOT EXISTS social_activities TEXT;

-- Enable RLS on all new tables
ALTER TABLE public.history_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.building_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- RLS Policies for history_sections
CREATE POLICY "Public can view history_sections" ON public.history_sections
FOR SELECT USING (true);

CREATE POLICY "Admins can insert history_sections" ON public.history_sections
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update history_sections" ON public.history_sections
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete history_sections" ON public.history_sections
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for buildings
CREATE POLICY "Public can view buildings" ON public.buildings
FOR SELECT USING (true);

CREATE POLICY "Admins can insert buildings" ON public.buildings
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update buildings" ON public.buildings
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete buildings" ON public.buildings
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for building_images
CREATE POLICY "Public can view building_images" ON public.building_images
FOR SELECT USING (true);

CREATE POLICY "Admins can insert building_images" ON public.building_images
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update building_images" ON public.building_images
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete building_images" ON public.building_images
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for books
CREATE POLICY "Public can view books" ON public.books
FOR SELECT USING (true);

CREATE POLICY "Admins can insert books" ON public.books
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update books" ON public.books
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete books" ON public.books
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_history_sections_updated_at
BEFORE UPDATE ON public.history_sections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_buildings_updated_at
BEFORE UPDATE ON public.buildings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_books_updated_at
BEFORE UPDATE ON public.books
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();