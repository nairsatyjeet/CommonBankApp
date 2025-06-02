import { supabase, Investment } from '../lib/supabaseClient';
import { toast } from 'react-toastify';

// Get all investments for an account
export async function getInvestments(accountId: string): Promise<Investment[]> {
  try {
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('account_id', accountId)
      .order('purchase_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching investments:', error);
    return [];
  }
}

// Get investment details
export async function getInvestmentById(investmentId: string): Promise<Investment | null> {
  try {
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('id', investmentId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching investment:', error);
    return null;
  }
}

// Purchase new investment
export async function purchaseInvestment(
  accountId: string,
  investmentType: 'stock' | 'bond' | 'mutual_fund' | 'etf',
  symbol: string,
  shares: number,
  purchasePrice: number
): Promise<boolean> {
  try {
    // Calculate total cost
    const totalCost = shares * purchasePrice;
    
    // Check if account has sufficient funds
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', accountId)
      .single();
    
    if (accountError) throw accountError;
    
    if (account.balance < totalCost) {
      toast.error('Insufficient funds to purchase investment');
      return false;
    }
    
    // Deduct from account balance
    const { error: updateError } = await supabase
      .from('accounts')
      .update({ balance: account.balance - totalCost })
      .eq('id', accountId);
    
    if (updateError) throw updateError;
    
    // Record the investment
    const { error: investmentError } = await supabase
      .from('investments')
      .insert({
        account_id: accountId,
        investment_type: investmentType,
        symbol,
        shares,
        purchase_price: purchasePrice,
        current_price: purchasePrice, // Initially same as purchase price
        purchase_date: new Date().toISOString(),
      });
    
    if (investmentError) throw investmentError;
    
    // Record the transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        account_id: accountId,
        transaction_type: 'investment',
        amount: totalCost,
        description: `Purchased ${shares} shares of ${symbol}`,
      });
    
    if (transactionError) throw transactionError;
    
    toast.success(`Successfully purchased ${shares} shares of ${symbol}`);
    return true;
  } catch (error) {
    console.error('Error purchasing investment:', error);
    toast.error('Failed to purchase investment');
    return false;
  }
}

// Sell investment
export async function sellInvestment(
  investmentId: string,
  accountId: string,
  sharesToSell: number,
  sellingPrice: number
): Promise<boolean> {
  try {
    // Get current investment details
    const { data: investment, error: investmentError } = await supabase
      .from('investments')
      .select('*')
      .eq('id', investmentId)
      .single();
    
    if (investmentError || !investment) {
      toast.error('Investment not found');
      return false;
    }
    
    if (investment.shares < sharesToSell) {
      toast.error('Cannot sell more shares than owned');
      return false;
    }
    
    const saleProceeds = sharesToSell * sellingPrice;
    const remainingShares = investment.shares - sharesToSell;
    
    // Update or delete the investment record
    if (remainingShares > 0) {
      const { error: updateError } = await supabase
        .from('investments')
        .update({ shares: remainingShares })
        .eq('id', investmentId);
      
      if (updateError) throw updateError;
    } else {
      const { error: deleteError } = await supabase
        .from('investments')
        .delete()
        .eq('id', investmentId);
      
      if (deleteError) throw deleteError;
    }
    
    // Add proceeds to account balance
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', accountId)
      .single();
    
    if (accountError) throw accountError;
    
    const { error: updateBalanceError } = await supabase
      .from('accounts')
      .update({ balance: account.balance + saleProceeds })
      .eq('id', accountId);
    
    if (updateBalanceError) throw updateBalanceError;
    
    // Record the transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        account_id: accountId,
        transaction_type: 'investment',
        amount: saleProceeds,
        description: `Sold ${sharesToSell} shares of ${investment.symbol}`,
      });
    
    if (transactionError) throw transactionError;
    
    toast.success(`Successfully sold ${sharesToSell} shares of ${investment.symbol}`);
    return true;
  } catch (error) {
    console.error('Error selling investment:', error);
    toast.error('Failed to sell investment');
    return false;
  }
}

// Update investment prices (simulate market changes)
export async function updateInvestmentPrices(): Promise<void> {
  try {
    // In a real app, you'd fetch current prices from a financial API
    // Here we'll just simulate random price changes for demo purposes
    
    const { data: investments, error } = await supabase
      .from('investments')
      .select('id, current_price');
    
    if (error) throw error;
    
    for (const investment of investments) {
      // Random price change between -5% and +5%
      const changePercent = (Math.random() * 10 - 5) / 100;
      const newPrice = investment.current_price * (1 + changePercent);
      
      await supabase
        .from('investments')
        .update({ current_price: newPrice })
        .eq('id', investment.id);
    }
  } catch (error) {
    console.error('Error updating investment prices:', error);
  }
}