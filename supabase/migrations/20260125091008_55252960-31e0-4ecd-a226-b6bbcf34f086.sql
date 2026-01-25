-- Create translations cache table for shared translations across devices
CREATE TABLE public.translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_hash TEXT NOT NULL,
  source_text TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('en', 'ar')),
  translated_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_hash, language)
);

-- Index for fast lookups
CREATE INDEX idx_translations_hash_lang ON public.translations(source_hash, language);

-- Enable RLS
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Public can read translations (for caching)
CREATE POLICY "Public can view translations"
  ON public.translations FOR SELECT
  USING (true);

-- Anyone can insert translations (for caching)
CREATE POLICY "Anyone can insert translations"
  ON public.translations FOR INSERT
  WITH CHECK (true);

-- Admins can manage all translations
CREATE POLICY "Admins can update translations"
  ON public.translations FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete translations"
  ON public.translations FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_translations_updated_at
  BEFORE UPDATE ON public.translations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();