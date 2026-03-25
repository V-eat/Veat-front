-- Update RLS policies to allow admins full access to key tables

-- Profiles: Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Profiles: Admins can update all profiles
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- Restaurants: Admins can view all restaurants (including inactive)
CREATE POLICY "Admins can view all restaurants" 
ON public.restaurants 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Restaurants: Admins can update all restaurants
CREATE POLICY "Admins can update all restaurants" 
ON public.restaurants 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- Restaurants: Admins can delete any restaurant
CREATE POLICY "Admins can delete any restaurant" 
ON public.restaurants 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Orders: Admins can view all orders
CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Orders: Admins can update all orders
CREATE POLICY "Admins can update all orders" 
ON public.orders 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- Reviews: Admins can update all reviews (for moderation)
CREATE POLICY "Admins can update all reviews" 
ON public.reviews 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- Reviews: Admins can delete any review
CREATE POLICY "Admins can delete any review" 
ON public.reviews 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Menu items: Admins can view all menu items
CREATE POLICY "Admins can view all menu items" 
ON public.menu_items 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Menu items: Admins can update all menu items
CREATE POLICY "Admins can update all menu items" 
ON public.menu_items 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- User roles: Admins can view all roles
CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- User roles: Admins can manage roles
CREATE POLICY "Admins can manage roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Favorites: Admins can view all favorites (for analytics)
CREATE POLICY "Admins can view all favorites" 
ON public.favorites 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));