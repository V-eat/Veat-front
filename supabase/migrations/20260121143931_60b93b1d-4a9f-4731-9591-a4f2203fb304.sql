-- Drop existing restrictive policies for admin access
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;

DROP POLICY IF EXISTS "Admins can view all restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Admins can update all restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Admins can delete any restaurant" ON public.restaurants;

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

DROP POLICY IF EXISTS "Admins can view all menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can update all menu items" ON public.menu_items;

DROP POLICY IF EXISTS "Admins can view all favorites" ON public.favorites;

-- Create PERMISSIVE policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- Create PERMISSIVE policies for user_roles
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

CREATE POLICY "Users can view their own role" 
ON public.user_roles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Create PERMISSIVE policies for orders
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own pending orders" ON public.orders;
DROP POLICY IF EXISTS "Restaurateurs can view orders for their restaurants" ON public.orders;
DROP POLICY IF EXISTS "Restaurateurs can update orders for their restaurants" ON public.orders;

CREATE POLICY "Users can view their own orders" 
ON public.orders FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" 
ON public.orders FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending orders" 
ON public.orders FOR UPDATE 
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Restaurateurs can view orders for their restaurants" 
ON public.orders FOR SELECT 
USING (EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = orders.restaurant_id AND restaurants.owner_id = auth.uid()));

CREATE POLICY "Restaurateurs can update orders for their restaurants" 
ON public.orders FOR UPDATE 
USING (EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = orders.restaurant_id AND restaurants.owner_id = auth.uid()));

CREATE POLICY "Admins can view all orders" 
ON public.orders FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all orders" 
ON public.orders FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- Create PERMISSIVE policies for restaurants
DROP POLICY IF EXISTS "Anyone can view active restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Restaurateurs can insert their restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Restaurateurs can update their own restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Restaurateurs can delete their own restaurants" ON public.restaurants;

CREATE POLICY "Anyone can view active restaurants" 
ON public.restaurants FOR SELECT 
USING (is_active = true);

CREATE POLICY "Restaurateurs can insert their restaurants" 
ON public.restaurants FOR INSERT 
WITH CHECK (auth.uid() = owner_id AND public.has_role(auth.uid(), 'restaurateur'));

CREATE POLICY "Restaurateurs can update their own restaurants" 
ON public.restaurants FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Restaurateurs can delete their own restaurants" 
ON public.restaurants FOR DELETE 
USING (auth.uid() = owner_id);

CREATE POLICY "Admins can view all restaurants" 
ON public.restaurants FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all restaurants" 
ON public.restaurants FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any restaurant" 
ON public.restaurants FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));