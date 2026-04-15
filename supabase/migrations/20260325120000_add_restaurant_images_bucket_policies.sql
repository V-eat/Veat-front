-- Bucket + minimal Storage policies for restaurant images
-- Convention used by the frontend uploader:
--   object path = <restaurant_id>/<timestamp>-<filename>

-- 1) Create (or update) the public bucket used for restaurant photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'restaurant-images',
  'restaurant-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2) Reset policies to keep this migration idempotent
DROP POLICY IF EXISTS "Public can read restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can upload their restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can update their restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete their restaurant images" ON storage.objects;

-- 3) Read access: public images (for website rendering)
CREATE POLICY "Public can read restaurant images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'restaurant-images');

-- 4) Write access: only authenticated owner of the restaurant folder
CREATE POLICY "Owners can upload their restaurant images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'restaurant-images'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.restaurants r
    WHERE r.id = ((storage.foldername(name))[1])::uuid
      AND r.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can update their restaurant images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'restaurant-images'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.restaurants r
    WHERE r.id = ((storage.foldername(name))[1])::uuid
      AND r.owner_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'restaurant-images'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.restaurants r
    WHERE r.id = ((storage.foldername(name))[1])::uuid
      AND r.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can delete their restaurant images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'restaurant-images'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.restaurants r
    WHERE r.id = ((storage.foldername(name))[1])::uuid
      AND r.owner_id = auth.uid()
  )
);
