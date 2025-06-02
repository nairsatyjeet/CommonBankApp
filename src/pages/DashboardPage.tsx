import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  getAccountByUserId, 
  getRecentTransactions 
} from '../services/accountService';
import { Account, Transaction } from '../lib/supabaseClient';
import { formatCurrency, formatAccountNumber } from '../utils/formatters';
import TransactionCard from '../components/TransactionCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { DollarSign, CreditCard, Wallet, Send, FileText, BarChart } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccountData = async () => {
      if (!currentUser) return;
      
      try {
        const accountData = await getAccountByUserId(currentUser.id);
        setAccount(accountData);
        
        if (accountData) {
          const recentTransactions = await getRecentTransactions(accountData.id);
          setTransactions(recentTransactions);
        }
      } catch (error) {
        console.error('Error fetching account data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAccountData();
  }, [currentUser]);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!account) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-error-500">Account Not Found</h2>
        <p className="mt-2">There was an error retrieving your account information.</p>
      </div>
    );
  }

  const features = [
    { 
      name: 'Deposit', 
      path: '/deposit', 
      icon: <Wallet className="h-8 w-8 text-primary-600 mb-2" />,
      description: 'Add funds to your account'
    },
    { 
      name: 'Withdraw', 
      path: '/withdraw', 
      icon: <DollarSign className="h-8 w-8 text-primary-600 mb-2" />,
      description: 'Get cash from your account'
    },
    { 
      name: 'Transfer', 
      path: '/transfer', 
      icon: <Send className="h-8 w-8 text-primary-600 mb-2" />,
      description: 'Send money to another account'
    },
    { 
      name: 'Statement', 
      path: '/statement', 
      icon: <FileText className="h-8 w-8 text-primary-600 mb-2" />,
      description: 'View and print account statements'
    },
    { 
      name: 'Investments', 
      path: '/investments', 
      icon: <BarChart className="h-8 w-8 text-primary-600 mb-2" />,
      description: 'Manage your investment portfolio'
    },
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Welcome to GreatBank</h1>
      
      {/* Account Summary Card */}
      <div className="card mb-8 bg-gradient-to-r from-primary-900 to-primary-700 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-medium mb-1 text-secondary-400">
              {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)} Account
            </h2>
            <p className="text-sm text-gray-300 mb-3">{formatAccountNumber(account.account_number)}</p>
            <div className="text-3xl font-bold">{formatCurrency(account.balance)}</div>
            <p className="text-sm mt-2 text-gray-300">Available Balance</p>
          </div>
          <CreditCard className="h-12 w-12 text-secondary-500" />
        </div>
      </div>
      
      {/* Banking Features */}
      <h2 className="text-xl font-semibold mb-4">Banking Services</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {features.map((feature) => (
          <Link 
            key={feature.name} 
            to={feature.path}
            className="banking-feature"
          >
            {feature.icon}
            <h3 className="font-medium mt-2">{feature.name}</h3>
            <p className="text-sm text-gray-600 text-center mt-1">{feature.description}</p>
          </Link>
        ))}
      </div>
      
      {/* Recent Transactions */}
      <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
      {transactions.length > 0 ? (
        <div>
          {transactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              type={transaction.transaction_type}
              amount={transaction.amount}
              date={transaction.created_at}
              description={transaction.description}
            />
          ))}
          <Link 
            to="/statement"
            className="block text-center text-primary-600 hover:text-primary-800 mt-4"
          >
            View All Transactions
          </Link>
        </div>
      ) : (
        <div className="card text-center py-8">
          <p className="text-gray-500">No recent transactions found.</p>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;