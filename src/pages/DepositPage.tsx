import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAccountByUserId, depositMoney } from '../services/accountService';
import { Account } from '../lib/supabaseClient';
import { formatCurrency } from '../utils/formatters';
import NumericKeypad from '../components/NumericKeypad';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeft, Wallet, CheckCircle } from 'lucide-react';

const DepositPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchAccount = async () => {
      if (!currentUser) return;
      
      try {
        const accountData = await getAccountByUserId(currentUser.id);
        setAccount(accountData);
      } catch (error) {
        console.error('Error fetching account:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAccount();
  }, [currentUser]);

  const handleKeyPress = (key: string) => {
    // Allow only valid currency input
    const newAmount = amount + key;
    
    // Only allow one decimal point
    if (key === '.' && amount.includes('.')) {
      return;
    }
    
    // Only allow two decimal places
    if (amount.includes('.') && amount.split('.')[1]?.length >= 2 && key !== '.') {
      return;
    }
    
    setAmount(newAmount);
  };

  const handleClear = () => {
    setAmount('');
  };

  const handleSubmit = async () => {
    if (!account || !amount || parseFloat(amount) <= 0) return;
    
    setProcessing(true);
    
    try {
      const success = await depositMoney(
        account.id,
        parseFloat(amount),
        description || 'ATM Deposit'
      );
      
      if (success) {
        setSuccess(true);
        
        // Update account balance
        const updatedAccount = await getAccountByUserId(currentUser!.id);
        setAccount(updatedAccount);
        
        // Reset form
        setTimeout(() => {
          setAmount('');
          setDescription('');
          setSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error processing deposit:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">Deposit Money</h1>
      </div>
      
      {account && (
        <div className="card mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Current Balance</h2>
              <p className="text-gray-500 text-sm">
                {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)} Account
              </p>
            </div>
            <div className="text-xl font-bold">{formatCurrency(account.balance)}</div>
          </div>
        </div>
      )}
      
      <div className="card">
        <h2 className="text-lg font-medium mb-4">Enter Deposit Amount</h2>
        
        {success ? (
          <div className="text-center py-8 animate-fade-in">
            <CheckCircle className="h-16 w-16 text-success-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-success-500 mb-2">Deposit Successful!</h3>
            <p className="text-gray-600 mb-4">
              {formatCurrency(parseFloat(amount))} has been added to your account.
            </p>
            <p className="text-lg font-medium">
              New Balance: {account && formatCurrency(account.balance)}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center mb-6">
              <Wallet className="h-10 w-10 text-primary-600 mr-4" />
              <div className="text-4xl font-bold">
                ${amount || '0.00'}
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                id="description"
                className="input-field"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ATM Deposit"
                disabled={processing}
              />
            </div>
            
            <NumericKeypad
              onKeyPress={handleKeyPress}
              onClear={handleClear}
              onSubmit={handleSubmit}
              showEnter={true}
            />
            
            <div className="mt-6">
              <button
                onClick={handleSubmit}
                disabled={!amount || parseFloat(amount) <= 0 || processing}
                className={`btn-primary w-full ${
                  (!amount || parseFloat(amount) <= 0 || processing) 
                    ? 'opacity-50 cursor-not-allowed' 
                    : ''
                }`}
              >
                {processing ? 'Processing...' : 'Deposit Funds'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DepositPage;