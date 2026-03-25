-- Hold table orders until all table members paid, then release together
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS released_to_restaurant BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_orders_table_released
  ON public.orders(table_id, released_to_restaurant);

-- Existing grouped orders should stay visible by default
UPDATE public.orders
SET released_to_restaurant = true
WHERE released_to_restaurant IS NULL;
