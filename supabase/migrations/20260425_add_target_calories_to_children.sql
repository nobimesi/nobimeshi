-- Add target_calories column to children table
ALTER TABLE children ADD COLUMN IF NOT EXISTS target_calories INTEGER;
