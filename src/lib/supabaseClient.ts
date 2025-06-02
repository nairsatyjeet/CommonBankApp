import { createClient } from '@supabase/supabase-js';

// These values would normally come from environment variables
// In a real app, you'd use import.meta.env.VITE_SUPABASE_URL and import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseUrl = 'https://cyoxvoxcjrkuvruzullp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5b3h2b3hjanJrdXZydXp1bGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNTExNDcsImV4cCI6MjA2MzgyNzE0N30.S-P-SG67aNkd_645x1VL-uiehQ8MGgZbqWKvFkiOpMk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export type Account = {
  id: string;
  user_id: string;
  account_number: string;
  account_type: 'checking' | 'savings' | 'investment';
  balance: number;
  pin_hash: string;
  created_at: string;
};

export type Transaction = {
  id: string;
  account_id: string;
  transaction_type: 'deposit' | 'withdrawal' | 'transfer' | 'investment';
  amount: number;
  description: string;
  reference_id: string | null;
  created_at: string;
};

export type Investment = {
  id: string;
  account_id: string;
  investment_type: 'stock' | 'bond' | 'mutual_fund' | 'etf';
  symbol: string;
  shares: number;
  purchase_price: number;
  current_price: number;
  purchase_date: string;
};

export type Profile = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  address: string;
  phone: string;
  email: string;
  created_at: string;
};