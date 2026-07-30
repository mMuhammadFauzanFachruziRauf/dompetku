-- Make target_amount optional
ALTER TABLE savings_goals ALTER COLUMN target_amount DROP NOT NULL;

-- Drop the check constraint that requires target_amount to be > 0 (since it can now be null)
ALTER TABLE savings_goals DROP CONSTRAINT IF EXISTS savings_goals_target_amount_check;

-- Add optional target_date column
ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS target_date date;
