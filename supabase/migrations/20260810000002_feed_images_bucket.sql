-- Create storage bucket for feed images

INSERT INTO storage.buckets (id, name, public)
VALUES ('feed-images', 'feed-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for feed-images bucket
CREATE POLICY "Feed images publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'feed-images');

CREATE POLICY "Authenticated users can upload feed images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'feed-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own feed images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'feed-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own feed images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'feed-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
