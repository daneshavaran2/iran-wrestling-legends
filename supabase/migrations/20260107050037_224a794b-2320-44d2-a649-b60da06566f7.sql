-- Create storage bucket for album media
INSERT INTO storage.buckets (id, name, public) VALUES ('album-media', 'album-media', true);

-- Create storage policies for album-media bucket
CREATE POLICY "Anyone can view album media"
ON storage.objects FOR SELECT
USING (bucket_id = 'album-media');

CREATE POLICY "Authenticated users can upload album media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'album-media' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete album media"
ON storage.objects FOR DELETE
USING (bucket_id = 'album-media' AND auth.role() = 'authenticated');