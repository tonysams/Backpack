-- Run this in the Supabase SQL editor if you already ran schema.sql.
-- Removes foreign key constraints that cause insertion-order failures
-- when writing trip + packing list data in parallel.
-- Data integrity is enforced by RLS (user_id) instead.

ALTER TABLE packing_lists
  DROP CONSTRAINT IF EXISTS packing_lists_trip_id_fkey;

ALTER TABLE packing_list_items
  DROP CONSTRAINT IF EXISTS packing_list_items_packing_list_id_fkey,
  DROP CONSTRAINT IF EXISTS packing_list_items_gear_item_id_fkey;

ALTER TABLE emergency_contacts
  DROP CONSTRAINT IF EXISTS emergency_contacts_trip_id_fkey;
