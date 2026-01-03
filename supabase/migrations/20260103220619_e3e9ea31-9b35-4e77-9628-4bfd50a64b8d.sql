-- Create app_settings table for admin-controlled settings
CREATE TABLE public.app_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('light', 'dark')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.app_settings (id, theme) VALUES ('main', 'dark');

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Public can read settings
CREATE POLICY "Public can view app_settings"
ON public.app_settings
FOR SELECT
USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update app_settings"
ON public.app_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add is_visible column to wrestlers
ALTER TABLE public.wrestlers 
ADD COLUMN is_visible BOOLEAN NOT NULL DEFAULT true;

-- Enable realtime for app_settings
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;