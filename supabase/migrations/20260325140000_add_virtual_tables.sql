-- Virtual tables for group dining
CREATE TABLE IF NOT EXISTS public.virtual_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  host_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  join_code TEXT NOT NULL UNIQUE,
  table_number INTEGER,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Members of a virtual table
CREATE TABLE IF NOT EXISTS public.table_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES public.virtual_tables(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(table_id, user_id)
);

-- Add table_id to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS table_id UUID REFERENCES public.virtual_tables(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE public.virtual_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read virtual tables"
  ON public.virtual_tables FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create virtual tables"
  ON public.virtual_tables FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Host can close their table"
  ON public.virtual_tables FOR UPDATE TO authenticated
  USING (auth.uid() = host_user_id);

CREATE POLICY "Members can read table members"
  ON public.table_members FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can join tables"
  ON public.table_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can leave tables"
  ON public.table_members FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Index for fast join_code lookup
CREATE INDEX IF NOT EXISTS idx_virtual_tables_join_code ON public.virtual_tables(join_code);
CREATE INDEX IF NOT EXISTS idx_table_members_table_id ON public.table_members(table_id);
