-- Fix infinite recursion in table_participants policies
DROP POLICY IF EXISTS "Hosts can manage participants" ON public.table_participants;
DROP POLICY IF EXISTS "Participants can view table participants" ON public.table_participants;

-- Create simpler policies without self-reference
CREATE POLICY "Hosts can manage participants" 
ON public.table_participants FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM virtual_tables 
    WHERE virtual_tables.id = table_participants.virtual_table_id 
    AND virtual_tables.host_user_id = auth.uid()
  )
);

CREATE POLICY "Participants can view their participation" 
ON public.table_participants FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can view table participants for tables they belong to" 
ON public.table_participants FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM virtual_tables 
    WHERE virtual_tables.id = table_participants.virtual_table_id 
    AND virtual_tables.host_user_id = auth.uid()
  )
);