
-- Create albums table
CREATE TABLE public.albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create album_photos table
CREATE TABLE public.album_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add about fields to app_settings
ALTER TABLE public.app_settings 
ADD COLUMN about_title TEXT DEFAULT 'درباره موزه کشتی ایران',
ADD COLUMN about_content TEXT,
ADD COLUMN about_image_url TEXT;

-- Enable RLS
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_photos ENABLE ROW LEVEL SECURITY;

-- Albums policies
CREATE POLICY "Public can view albums" ON public.albums FOR SELECT USING (true);
CREATE POLICY "Admins can insert albums" ON public.albums FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update albums" ON public.albums FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete albums" ON public.albums FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Album photos policies
CREATE POLICY "Public can view album_photos" ON public.album_photos FOR SELECT USING (true);
CREATE POLICY "Admins can insert album_photos" ON public.album_photos FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update album_photos" ON public.album_photos FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete album_photos" ON public.album_photos FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_albums_updated_at
BEFORE UPDATE ON public.albums
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
