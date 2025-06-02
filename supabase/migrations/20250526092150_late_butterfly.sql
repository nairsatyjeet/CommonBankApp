/*
  # Initial Schema for GreatBank ATM Application

  1. New Tables
    - `profiles`
      - User profile information
    - `accounts`
      - Bank account information
    - `transactions`
      - Transaction history
    - `investments`
      - Investment portfolio

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  address text,
  phone text,
  email text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_number text UNIQUE NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('checking', 'savings', 'investment')),
  balance decimal(12,2) NOT NULL DEFAULT 0.00,
  pin_hash text NOT NULL, -- In production, this would be properly hashed
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer', 'investment')),
  amount decimal(12,2) NOT NULL,
  description text,
  reference_id uuid REFERENCES transactions(id),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create investments table
CREATE TABLE IF NOT EXISTS investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  investment_type text NOT NULL CHECK (investment_type IN ('stock', 'bond', 'mutual_fund', 'etf')),
  symbol text NOT NULL,
  shares decimal(12,4) NOT NULL,
  purchase_price decimal(12,2) NOT NULL,
  current_price decimal(12,2) NOT NULL,
  purchase_date timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can read their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Accounts RLS Policies
CREATE POLICY "Users can read their own accounts"
  ON accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts"
  ON accounts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Transactions RLS Policies
CREATE POLICY "Users can read transactions for their accounts"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert transactions for their accounts"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    account_id IN (
      SELECT id FROM accounts WHERE user_id = auth.uid()
    )
  );

-- Investments RLS Policies
CREATE POLICY "Users can read investments for their accounts"
  ON investments
  FOR SELECT
  TO authenticated
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert investments for their accounts"
  ON investments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    account_id IN (
      SELECT id FROM accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update investments for their accounts"
  ON investments
  FOR UPDATE
  TO authenticated
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete investments for their accounts"
  ON investments
  FOR DELETE
  TO authenticated
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE user_id = auth.uid()
    )
  );

-- Create functions
-- Function to get account balance
CREATE OR REPLACE FUNCTION get_account_balance(account_id uuid)
RETURNS decimal
LANGUAGE plpgsql
AS $$
DECLARE
  balance decimal;
BEGIN
  SELECT a.balance INTO balance
  FROM accounts a
  WHERE a.id = account_id;
  
  RETURN balance;
END;
$$;

-- Function to update account balance
CREATE OR REPLACE FUNCTION update_account_balance(
  account_id uuid,
  amount decimal,
  is_credit boolean
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  current_balance decimal;
  new_balance decimal;
BEGIN
  -- Get current balance
  SELECT balance INTO current_balance
  FROM accounts
  WHERE id = account_id;
  
  -- Calculate new balance
  IF is_credit THEN
    new_balance := current_balance + amount;
  ELSE
    -- Check for sufficient funds
    IF current_balance < amount THEN
      RETURN false;
    END IF;
    new_balance := current_balance - amount;
  END IF;
  
  -- Update balance
  UPDATE accounts
  SET balance = new_balance
  WHERE id = account_id;
  
  RETURN true;
END;
$$;