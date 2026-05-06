-- Add per-month salary records to user profiles.
-- Shape:
-- {
--   "2026-04": { "amount": 2600000, "note": "Potongan telat" },
--   "2026-05": { "amount": 2700000, "note": "Gaji full" }
-- }

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS monthly_salaries JSONB NOT NULL DEFAULT '{}'::jsonb;
