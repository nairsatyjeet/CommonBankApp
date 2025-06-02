import { supabase, Account } from '../lib/supabaseClient';
import { toast } from 'react-toastify';

// Get account by user ID
export async function getAccountByUserId(userId: string): Promise<Account | null> {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching account:', error);
    return null;
  }
}

// Get account balance
export async function getAccountBalance(accountId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', accountId)
      .single();

    if (error) throw error;
    return data.balance;
  } catch (error) {
    console.error('Error fetching balance:', error);
    return 0;
  }
}

// Deposit money
export async function depositMoney(
  accountId: string, 
  amount: number, 
  description: string = 'Deposit'
): Promise<boolean> {
  try {
    // Start a transaction
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', accountId)
      .single();

    if (accountError) throw accountError;

    const newBalance = account.balance + amount;

    // Update account balance
    const { error: updateError } = await supabase
      .from('accounts')
      .update({ balance: newBalance })
      .eq('id', accountId);

    if (updateError) throw updateError;

    // Record the transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        account_id: accountId,
        transaction_type: 'deposit',
        amount,
        description,
      });

    if (transactionError) throw transactionError;

    toast.success(`Successfully deposited $${amount.toFixed(2)}`);
    return true;
  } catch (error) {
    console.error('Error depositing money:', error);
    toast.error('Failed to deposit money');
    return false;
  }
}

// Withdraw money
export async function withdrawMoney(
  accountId: string, 
  amount: number, 
  description: string = 'Withdrawal'
): Promise<boolean> {
  try {
    // Check current balance
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', accountId)
      .single();

    if (accountError) throw accountError;

    // Ensure sufficient funds
    if (account.balance < amount) {
      toast.error('Insufficient funds');
      return false;
    }

    const newBalance = account.balance - amount;

    // Update account balance
    const { error: updateError } = await supabase
      .from('accounts')
      .update({ balance: newBalance })
      .eq('id', accountId);

    if (updateError) throw updateError;

    // Record the transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        account_id: accountId,
        transaction_type: 'withdrawal',
        amount,
        description,
      });

    if (transactionError) throw transactionError;

    toast.success(`Successfully withdrew $${amount.toFixed(2)}`);
    return true;
  } catch (error) {
    console.error('Error withdrawing money:', error);
    toast.error('Failed to withdraw money');
    return false;
  }
}

// Transfer money
export async function transferMoney(
  fromAccountId: string,
  toAccountNumber: string,
  amount: number,
  description: string = 'Transfer'
): Promise<boolean> {
  try {
    // Validate sender's balance
    const { data: fromAccount, error: fromAccountError } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', fromAccountId)
      .single();

    if (fromAccountError) throw fromAccountError;

    if (fromAccount.balance < amount) {
      toast.error('Insufficient funds for transfer');
      return false;
    }

    // Find recipient account
    const { data: toAccount, error: toAccountError } = await supabase
      .from('accounts')
      .select('id, balance')
      .eq('account_number', toAccountNumber)
      .single();

    if (toAccountError || !toAccount) {
      toast.error('Recipient account not found');
      return false;
    }

    // Update sender's balance
    const { error: updateFromError } = await supabase
      .from('accounts')
      .update({ balance: fromAccount.balance - amount })
      .eq('id', fromAccountId);

    if (updateFromError) throw updateFromError;

    // Update recipient's balance
    const { error: updateToError } = await supabase
      .from('accounts')
      .update({ balance: toAccount.balance + amount })
      .eq('id', toAccount.id);

    if (updateToError) throw updateToError;

    // Record the transaction for sender
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .insert({
        account_id: fromAccountId,
        transaction_type: 'transfer',
        amount,
        description: `${description} to ${toAccountNumber}`,
      })
      .select('id')
      .single();

    if (txError) throw txError;

    // Record the transaction for recipient
    const { error: recipientTxError } = await supabase
      .from('transactions')
      .insert({
        account_id: toAccount.id,
        transaction_type: 'transfer',
        amount,
        description: `${description} from ${fromAccountId}`,
        reference_id: txData.id,
      });

    if (recipientTxError) throw recipientTxError;

    toast.success(`Successfully transferred $${amount.toFixed(2)}`);
    return true;
  } catch (error) {
    console.error('Error transferring money:', error);
    toast.error('Failed to complete transfer');
    return false;
  }
}

// Get recent transactions
export async function getRecentTransactions(accountId: string, limit: number = 5) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

// Get transactions for a date range
export async function getTransactionsForDateRange(
  accountId: string,
  startDate: string,
  endDate: string
) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching transactions for date range:', error);
    return [];
  }
}