-- Create the savings_goals table
CREATE TABLE savings_goals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    target_amount numeric NOT NULL CHECK (target_amount > 0),
    current_amount numeric NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
    icon text,
    color text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

-- Create policies for savings_goals
CREATE POLICY "User can view their own savings goals" ON savings_goals
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "User can create their own savings goals" ON savings_goals
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can update their own savings goals" ON savings_goals
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "User can delete their own savings goals" ON savings_goals
FOR DELETE USING (auth.uid() = user_id);

-- Create a table for transactions related to savings goals
CREATE TABLE savings_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id uuid NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount numeric NOT NULL CHECK (amount > 0),
    transaction_date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security for savings_transactions
ALTER TABLE savings_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for savings_transactions
CREATE POLICY "User can view their own savings transactions" ON savings_transactions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "User can create their own savings transactions" ON savings_transactions
FOR INSERT WITH CHECK (auth.uid() = user_id);
