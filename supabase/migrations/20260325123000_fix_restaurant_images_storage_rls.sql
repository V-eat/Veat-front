-- Fix Storage RLS for restaurant image uploads
-- Root cause: storage policy subquery on public.restaurants can fail under restaurants RLS.
-- This patch uses a SECURITY DEFINER helper to check ownership safely.

-- 1) Helper function to validate ownership of a restaurant id
CREATE OR REPLACE FUNCTION public.is_restaurant_owner(_restaurant_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.restaurants r
    WHERE r.id::text = _restaurant_id
      AND r.owner_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_restaurant_owner(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_restaurant_owner(text) TO authenticated;

-- 2) Recreate storage policies with the helper
DROP POLICY IF EXISTS "Owners can upload their restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can update their restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete their restaurant images" ON storage.objects;

CREATE POLICY "Owners can upload their restaurant images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'restaurant-images'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND public.is_restaurant_owner((storage.foldername(name))[1])
);

CREATE POLICY "Owners can update their restaurant images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'restaurant-images'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND public.is_restaurant_owner((storage.foldername(name))[1])
)
WITH CHECK (
  bucket_id = 'restaurant-images'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND public.is_restaurant_owner((storage.foldername(name))[1])
);

CREATE POLICY "Owners can delete their restaurant images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'restaurant-images'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND public.is_restaurant_owner((storage.foldername(name))[1])
);

-- 3) Optional but useful: let owners read their own restaurants even if inactive
DROP POLICY IF EXISTS "Owners can view their own restaurants" ON public.restaurants;
CREATE POLICY "Owners can view their own restaurants"
ON public.restaurants
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());
