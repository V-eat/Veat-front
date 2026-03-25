-- Shared arrival time for virtual table host + members
ALTER TABLE public.virtual_tables
  ADD COLUMN IF NOT EXISTS arrival_time TIME;
