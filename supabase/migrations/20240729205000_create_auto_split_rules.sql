CREATE TABLE IF NOT EXISTS auto_split_rules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  type varchar NOT NULL CHECK (type IN ('fixed', 'percentage')),
  value numeric NOT NULL,
  priority integer NOT NULL,
  target_wallet_id uuid REFERENCES wallets(id),
  target_savings_goal_id text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE auto_split_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own auto split rules" 
ON auto_split_rules FOR ALL 
USING (auth.uid() = user_id);
