-- Convert target_savings_goal_id from text to uuid
-- Safe cast using regex to check for valid UUID format. If invalid (like 'sg_1'), it becomes NULL.
ALTER TABLE auto_split_rules 
  ALTER COLUMN target_savings_goal_id TYPE uuid 
  USING (
    CASE 
      WHEN target_savings_goal_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN target_savings_goal_id::uuid
      ELSE NULL 
    END
  );

-- Add foreign key constraint to savings_goals
ALTER TABLE auto_split_rules 
  ADD CONSTRAINT fk_auto_split_savings_goal 
  FOREIGN KEY (target_savings_goal_id) REFERENCES savings_goals(id) ON DELETE SET NULL;
