import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-supabase-project-url.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'your-supabase-service-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    req.user = user;
    next();
  });
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Account endpoints
app.get('/api/accounts', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', req.user.id);
    
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Transaction endpoints
app.get('/api/transactions/:accountId', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { startDate, endDate, limit } = req.query;
    
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });
    
    if (startDate && endDate) {
      query = query
        .gte('created_at', startDate)
        .lte('created_at', endDate);
    }
    
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Deposit money
app.post('/api/transactions/deposit', authenticateToken, async (req, res) => {
  try {
    const { accountId, amount, description } = req.body;
    
    if (!accountId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }
    
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
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        account_id: accountId,
        transaction_type: 'deposit',
        amount,
        description: description || 'Deposit',
      })
      .select()
      .single();
    
    if (transactionError) throw transactionError;
    
    res.status(201).json({
      success: true,
      transaction,
      newBalance,
    });
  } catch (error) {
    console.error('Error processing deposit:', error);
    res.status(500).json({ error: 'Failed to process deposit' });
  }
});

// Withdraw money
app.post('/api/transactions/withdraw', authenticateToken, async (req, res) => {
  try {
    const { accountId, amount, description } = req.body;
    
    if (!accountId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }
    
    // Check current balance
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', accountId)
      .single();
    
    if (accountError) throw accountError;
    
    // Ensure sufficient funds
    if (account.balance < amount) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }
    
    const newBalance = account.balance - amount;
    
    // Update account balance
    const { error: updateError } = await supabase
      .from('accounts')
      .update({ balance: newBalance })
      .eq('id', accountId);
    
    if (updateError) throw updateError;
    
    // Record the transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        account_id: accountId,
        transaction_type: 'withdrawal',
        amount,
        description: description || 'Withdrawal',
      })
      .select()
      .single();
    
    if (transactionError) throw transactionError;
    
    res.status(201).json({
      success: true,
      transaction,
      newBalance,
    });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({ error: 'Failed to process withdrawal' });
  }
});

// Transfer money
app.post('/api/transactions/transfer', authenticateToken, async (req, res) => {
  try {
    const { fromAccountId, toAccountNumber, amount, description } = req.body;
    
    if (!fromAccountId || !toAccountNumber || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }
    
    // Validate sender's balance
    const { data: fromAccount, error: fromAccountError } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', fromAccountId)
      .single();
    
    if (fromAccountError) throw fromAccountError;
    
    if (fromAccount.balance < amount) {
      return res.status(400).json({ error: 'Insufficient funds for transfer' });
    }
    
    // Find recipient account
    const { data: toAccount, error: toAccountError } = await supabase
      .from('accounts')
      .select('id, balance')
      .eq('account_number', toAccountNumber)
      .single();
    
    if (toAccountError || !toAccount) {
      return res.status(404).json({ error: 'Recipient account not found' });
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
        description: `${description || 'Transfer'} to ${toAccountNumber}`,
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
        description: `${description || 'Transfer'} from ${fromAccountId}`,
        reference_id: txData.id,
      });
    
    if (recipientTxError) throw recipientTxError;
    
    res.status(201).json({
      success: true,
      newBalance: fromAccount.balance - amount,
    });
  } catch (error) {
    console.error('Error processing transfer:', error);
    res.status(500).json({ error: 'Failed to complete transfer' });
  }
});

// Investments endpoints
app.get('/api/investments/:accountId', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('account_id', accountId)
      .order('purchase_date', { ascending: false });
    
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching investments:', error);
    res.status(500).json({ error: 'Failed to fetch investments' });
  }
});

// Purchase investment
app.post('/api/investments/purchase', authenticateToken, async (req, res) => {
  try {
    const { accountId, investmentType, symbol, shares, purchasePrice } = req.body;
    
    if (!accountId || !investmentType || !symbol || !shares || !purchasePrice) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }
    
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
      return res.status(400).json({ error: 'Insufficient funds to purchase investment' });
    }
    
    // Deduct from account balance
    const { error: updateError } = await supabase
      .from('accounts')
      .update({ balance: account.balance - totalCost })
      .eq('id', accountId);
    
    if (updateError) throw updateError;
    
    // Record the investment
    const { data: investment, error: investmentError } = await supabase
      .from('investments')
      .insert({
        account_id: accountId,
        investment_type: investmentType,
        symbol,
        shares,
        purchase_price: purchasePrice,
        current_price: purchasePrice, // Initially same as purchase price
      })
      .select()
      .single();
    
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
    
    res.status(201).json({
      success: true,
      investment,
      newBalance: account.balance - totalCost,
    });
  } catch (error) {
    console.error('Error purchasing investment:', error);
    res.status(500).json({ error: 'Failed to purchase investment' });
  }
});

// Sell investment
app.post('/api/investments/sell', authenticateToken, async (req, res) => {
  try {
    const { investmentId, accountId, sharesToSell, sellingPrice } = req.body;
    
    if (!investmentId || !accountId || !sharesToSell || !sellingPrice) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }
    
    // Get current investment details
    const { data: investment, error: investmentError } = await supabase
      .from('investments')
      .select('*')
      .eq('id', investmentId)
      .single();
    
    if (investmentError || !investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }
    
    if (investment.shares < sharesToSell) {
      return res.status(400).json({ error: 'Cannot sell more shares than owned' });
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
    
    res.status(200).json({
      success: true,
      saleProceeds,
      newBalance: account.balance + saleProceeds,
    });
  } catch (error) {
    console.error('Error selling investment:', error);
    res.status(500).json({ error: 'Failed to sell investment' });
  }
});

// PIN management
app.post('/api/pin/change', authenticateToken, async (req, res) => {
  try {
    const { accountId, currentPin, newPin } = req.body;
    
    if (!accountId || !currentPin || !newPin) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // In a real app, you'd properly hash the PIN
    // For this demo, we're using a simple approach
    
    // Verify current PIN
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('pin_hash')
      .eq('id', accountId)
      .single();
    
    if (accountError) throw accountError;
    
    if (account.pin_hash !== currentPin) {
      return res.status(400).json({ error: 'Current PIN is incorrect' });
    }
    
    // Update PIN
    const { error: updateError } = await supabase
      .from('accounts')
      .update({ pin_hash: newPin })
      .eq('id', accountId);
    
    if (updateError) throw updateError;
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error changing PIN:', error);
    res.status(500).json({ error: 'Failed to change PIN' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;