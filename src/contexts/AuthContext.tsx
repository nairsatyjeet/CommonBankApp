import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { toast } from 'react-toastify';

interface AuthContextType {
  currentUser: User | null;
  session: Session | null;
  loading: boolean;
  login: (accountNumber: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  changePin: (currentPin: string, newPin: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setCurrentUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function login(accountNumber: string, pin: string) {
    try {
      setLoading(true);
      
      // For this demo, we'll use email auth with accountNumber@greatbank.com format
      // In a real app, you'd have a separate auth flow for account/pin
      const email = `${accountNumber}@greatbank.com`;
      const password = `${pin}_${accountNumber}`; // Simple concatenation for demo
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      toast.success('Login successful');
    } catch (error) {
      console.error('Error logging in:', error);
      toast.error('Invalid account number or PIN');
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.info('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    } finally {
      setLoading(false);
    }
  }

  async function verifyPin(pin: string) {
    try {
      // In a real app, you'd verify the PIN through a secure API
      // This is a simplified example
      if (!currentUser) return false;
      
      const { data, error } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('pin_hash', pin) // In reality, you'd never store plaintext PINs
        .single();
      
      if (error || !data) return false;
      return true;
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return false;
    }
  }

  async function changePin(currentPin: string, newPin: string) {
    try {
      if (!currentUser) return false;
      
      // Verify current PIN first
      const isValid = await verifyPin(currentPin);
      if (!isValid) {
        toast.error('Current PIN is incorrect');
        return false;
      }
      
      // Update PIN in the database
      const { error } = await supabase
        .from('accounts')
        .update({ pin_hash: newPin }) // In reality, you'd hash the PIN
        .eq('user_id', currentUser.id);
      
      if (error) {
        toast.error('Failed to update PIN');
        return false;
      }
      
      toast.success('PIN updated successfully');
      return true;
    } catch (error) {
      console.error('Error changing PIN:', error);
      toast.error('An error occurred while changing PIN');
      return false;
    }
  }

  const value = {
    currentUser,
    session,
    loading,
    login,
    logout,
    verifyPin,
    changePin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}