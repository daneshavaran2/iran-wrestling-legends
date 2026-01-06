-- Create storage bucket for building media
INSERT INTO storage.buckets (id, name, public) VALUES ('building-media', 'building-media', true);

-- Create storage policies for building-media bucket
CREATE POLICY "Anyone can view building media"
ON storage.objects FOR SELECT
USING (bucket_id = 'building-media');

CREATE POLICY "Authenticated users can upload building media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'building-media' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete building media"
ON storage.objects FOR DELETE
USING (bucket_id = 'building-media' AND auth.role() = 'authenticated');