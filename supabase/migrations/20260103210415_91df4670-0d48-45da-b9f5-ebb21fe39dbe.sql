-- Create enum types
CREATE TYPE public.wrestling_style AS ENUM ('freestyle', 'greco-roman');
CREATE TYPE public.medal_type AS ENUM ('gold', 'silver', 'bronze');
CREATE TYPE public.media_type AS ENUM ('image', 'video');
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create wrestlers table
CREATE TABLE public.wrestlers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  style wrestling_style NOT NULL DEFAULT 'freestyle',
  weight_class TEXT,
  province TEXT,
  image_url TEXT,
  bio TEXT,
  full_story TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create achievements table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wrestler_id UUID NOT NULL REFERENCES public.wrestlers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event TEXT NOT NULL,
  year INTEGER NOT NULL,
  medal_type medal_type NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wrestler_media table
CREATE TABLE public.wrestler_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wrestler_id UUID NOT NULL REFERENCES public.wrestlers(id) ON DELETE CASCADE,
  type media_type NOT NULL DEFAULT 'image',
  url TEXT NOT NULL,
  thumbnail TEXT,
  title TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create indexes for better performance
CREATE INDEX idx_wrestlers_style ON public.wrestlers(style);
CREATE INDEX idx_wrestlers_province ON public.wrestlers(province);
CREATE INDEX idx_achievements_wrestler_id ON public.achievements(wrestler_id);
CREATE INDEX idx_wrestler_media_wrestler_id ON public.wrestler_media(wrestler_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- Enable Row Level Security
ALTER TABLE public.wrestlers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wrestler_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if any admin exists
CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'admin'
  )
$$;

-- RLS Policies for wrestlers table
-- Public can view all wrestlers
CREATE POLICY "Public can view wrestlers"
ON public.wrestlers
FOR SELECT
USING (true);

-- Only admins can insert wrestlers
CREATE POLICY "Admins can insert wrestlers"
ON public.wrestlers
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update wrestlers
CREATE POLICY "Admins can update wrestlers"
ON public.wrestlers
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete wrestlers
CREATE POLICY "Admins can delete wrestlers"
ON public.wrestlers
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for achievements table
CREATE POLICY "Public can view achievements"
ON public.achievements
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert achievements"
ON public.achievements
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update achievements"
ON public.achievements
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete achievements"
ON public.achievements
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for wrestler_media table
CREATE POLICY "Public can view wrestler_media"
ON public.wrestler_media
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert wrestler_media"
ON public.wrestler_media
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update wrestler_media"
ON public.wrestler_media
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete wrestler_media"
ON public.wrestler_media
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles table
-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- First user can insert admin role if no admin exists (bootstrap)
CREATE POLICY "First user can become admin"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  role = 'admin' 
  AND auth.uid() = user_id 
  AND NOT public.admin_exists()
);

-- Admins can insert other roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can delete roles
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for wrestlers
CREATE TRIGGER update_wrestlers_updated_at
BEFORE UPDATE ON public.wrestlers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for wrestler media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('wrestler-media', 'wrestler-media', true);

-- Storage policies for wrestler-media bucket
CREATE POLICY "Public can view wrestler media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'wrestler-media');

CREATE POLICY "Admins can upload wrestler media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'wrestler-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update wrestler media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'wrestler-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete wrestler media"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'wrestler-media' AND public.has_role(auth.uid(), 'admin'));