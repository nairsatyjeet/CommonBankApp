import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAccountByUserId } from '../services/accountService';
import { getInvestments, purchaseInvestment, sellInvestment } from '../services/investmentService';
import { Account, Investment } from '../lib/supabaseClient';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeft, TrendingUp, DollarSign, AlertCircle, ChevronDown, ChevronUp, BarChart } from 'lucide-react';
import { toast } from 'react-toastify';

const InvestmentPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  
  // Purchase form state
  const [purchaseForm, setPurchaseForm] = useState({
    investmentType: 'stock',
    symbol: '',
    shares: '',
    price: '',
  });
  
  // Sell form state
  const [sellForm, setShowSellForm] = useState({
    show: false,
    shares: '',
    price: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      try {
        const accountData = await getAccountByUserId(currentUser.id);
        setAccount(accountData);
        
        if (accountData) {
          const investmentsData = await getInvestments(accountData.id);
          setInvestments(investmentsData);
        }
      } catch (error) {
        console.error('Error fetching investment data:', error);
        toast.error('Failed to load investment data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser]);

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    
    const shares = parseFloat(purchaseForm.shares);
    const price = parseFloat(purchaseForm.price);
    
    if (isNaN(shares) || isNaN(price) || shares <= 0 || price <= 0) {
      toast.error('Please enter valid shares and price');
      return;
    }
    
    const totalCost = shares * price;
    if (totalCost > account.balance) {
      toast.error('Insufficient funds for this purchase');
      return;
    }
    
    setLoading(true);
    try {
      const success = await purchaseInvestment(
        account.id,
        purchaseForm.investmentType as 'stock' | 'bond' | 'mutual_fund' | 'etf',
        purchaseForm.symbol.toUpperCase(),
        shares,
        price
      );
      
      if (success) {
        // Refresh data
        const [newAccount, newInvestments] = await Promise.all([
          getAccountByUserId(currentUser!.id),
          getInvestments(account.id),
        ]);
        
        setAccount(newAccount);
        setInvestments(newInvestments);
        setShowPurchaseForm(false);
        setPurchaseForm({
          investmentType: 'stock',
          symbol: '',
          shares: '',
          price: '',
        });
      }
    } catch (error) {
      console.error('Error purchasing investment:', error);
      toast.error('Failed to complete purchase');
    } finally {
      setLoading(false);
    }
  };

  const handleSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !selectedInvestment) return;
    
    const sharesToSell = parseFloat(sellForm.shares);
    const sellingPrice = parseFloat(sellForm.price);
    
    if (isNaN(sharesToSell) || isNaN(sellingPrice) || sharesToSell <= 0 || sellingPrice <= 0) {
      toast.error('Please enter valid shares and price');
      return;
    }
    
    if (sharesToSell > selectedInvestment.shares) {
      toast.error('Cannot sell more shares than owned');
      return;
    }
    
    setLoading(true);
    try {
      const success = await sellInvestment(
        selectedInvestment.id,
        account.id,
        sharesToSell,
        sellingPrice
      );
      
      if (success) {
        // Refresh data
        const [newAccount, newInvestments] = await Promise.all([
          getAccountByUserId(currentUser!.id),
          getInvestments(account.id),
        ]);
        
        setAccount(newAccount);
        setInvestments(newInvestments);
        setShowSellForm({ show: false, shares: '', price: '' });
        setSelectedInvestment(null);
      }
    } catch (error) {
      console.error('Error selling investment:', error);
      toast.error('Failed to complete sale');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalValue = (investment: Investment) => {
    return investment.shares * investment.current_price;
  };

  const calculateGainLoss = (investment: Investment) => {
    const currentValue = calculateTotalValue(investment);
    const costBasis = investment.shares * investment.purchase_price;
    return currentValue - costBasis;
  };

  const calculateGainLossPercentage = (investment: Investment) => {
    const gainLoss = calculateGainLoss(investment);
    const costBasis = investment.shares * investment.purchase_price;
    return (gainLoss / costBasis) * 100;
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
        <h1 className="text-2xl font-bold">Investment Portfolio</h1>
      </div>
      
      {account && (
        <div className="card mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Available Balance</h2>
              <p className="text-gray-500 text-sm">Investment Account</p>
            </div>
            <div className="text-xl font-bold">{formatCurrency(account.balance)}</div>
          </div>
        </div>
      )}
      
      {/* Portfolio Summary */}
      {investments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card bg-success-500 text-white">
            <h3 className="text-sm font-medium mb-2">Total Investments</h3>
            <p className="text-2xl font-bold">
              {formatCurrency(
                investments.reduce((sum, inv) => sum + calculateTotalValue(inv), 0)
              )}
            </p>
          </div>
          
          <div className="card bg-primary-600 text-white">
            <h3 className="text-sm font-medium mb-2">Total Gain/Loss</h3>
            <p className="text-2xl font-bold">
              {formatCurrency(
                investments.reduce((sum, inv) => sum + calculateGainLoss(inv), 0)
              )}
            </p>
          </div>
          
          <div className="card bg-secondary-500 text-primary-900">
            <h3 className="text-sm font-medium mb-2">Number of Holdings</h3>
            <p className="text-2xl font-bold">{investments.length}</p>
          </div>
        </div>
      )}
      
      {/* Investment Actions */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Your Investments</h2>
        <button
          onClick={() => setShowPurchaseForm(true)}
          className="btn-primary flex items-center"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          New Investment
        </button>
      </div>
      
      {/* Purchase Form */}
      {showPurchaseForm && (
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Purchase Investment</h3>
            <button
              onClick={() => setShowPurchaseForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handlePurchaseSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Investment Type
                </label>
                <select
                  value={purchaseForm.investmentType}
                  onChange={(e) => setPurchaseForm({
                    ...purchaseForm,
                    investmentType: e.target.value
                  })}
                  className="input-field"
                  required
                >
                  <option value="stock">Stock</option>
                  <option value="bond">Bond</option>
                  <option value="mutual_fund">Mutual Fund</option>
                  <option value="etf">ETF</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Symbol
                </label>
                <input
                  type="text"
                  value={purchaseForm.symbol}
                  onChange={(e) => setPurchaseForm({
                    ...purchaseForm,
                    symbol: e.target.value.toUpperCase()
                  })}
                  className="input-field"
                  placeholder="e.g., AAPL"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Shares
                </label>
                <input
                  type="number"
                  value={purchaseForm.shares}
                  onChange={(e) => setPurchaseForm({
                    ...purchaseForm,
                    shares: e.target.value
                  })}
                  className="input-field"
                  placeholder="0"
                  step="0.0001"
                  min="0.0001"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Share
                </label>
                <input
                  type="number"
                  value={purchaseForm.price}
                  onChange={(e) => setPurchaseForm({
                    ...purchaseForm,
                    price: e.target.value
                  })}
                  className="input-field"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
            </div>
            
            {account && purchaseForm.shares && purchaseForm.price && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">
                  Total Cost: {formatCurrency(
                    parseFloat(purchaseForm.shares) * parseFloat(purchaseForm.price)
                  )}
                </p>
                {parseFloat(purchaseForm.shares) * parseFloat(purchaseForm.price) > account.balance && (
                  <p className="text-sm text-error-500 mt-1">
                    Insufficient funds for this purchase
                  </p>
                )}
              </div>
            )}
            
            <div className="mt-4">
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Purchase Investment'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Investments List */}
      {investments.length > 0 ? (
        <div className="space-y-4">
          {investments.map((investment) => (
            <div key={investment.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center">
                    <BarChart className="h-5 w-5 text-primary-600 mr-2" />
                    <h3 className="text-lg font-medium">{investment.symbol}</h3>
                    <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-gray-100">
                      {investment.investment_type.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Shares</p>
                      <p className="font-medium">{investment.shares.toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Current Price</p>
                      <p className="font-medium">{formatCurrency(investment.current_price)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Value</p>
                      <p className="font-medium">{formatCurrency(calculateTotalValue(investment))}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Gain/Loss</p>
                      <p className={`font-medium ${
                        calculateGainLoss(investment) >= 0 
                          ? 'text-success-500' 
                          : 'text-error-500'
                      }`}>
                        {formatCurrency(calculateGainLoss(investment))}
                        <span className="text-sm ml-1">
                          ({formatPercentage(calculateGainLossPercentage(investment) / 100)})
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setSelectedInvestment(investment);
                    setShowSellForm({ show: true, shares: '', price: '' });
                  }}
                  className="btn-outline"
                >
                  Sell
                </button>
              </div>
              
              {selectedInvestment?.id === investment.id && sellForm.show && (
                <div className="mt-4 pt-4 border-t">
                  <form onSubmit={handleSellSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Shares to Sell
                        </label>
                        <input
                          type="number"
                          value={sellForm.shares}
                          onChange={(e) => setShowSellForm({
                            ...sellForm,
                            shares: e.target.value
                          })}
                          className="input-field"
                          placeholder={`Max: ${investment.shares}`}
                          step="0.0001"
                          min="0.0001"
                          max={investment.shares}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Selling Price
                        </label>
                        <input
                          type="number"
                          value={sellForm.price}
                          onChange={(e) => setShowSellForm({
                            ...sellForm,
                            price: e.target.value
                          })}
                          className="input-field"
                          placeholder="0.00"
                          step="0.01"
                          min="0.01"
                          required
                        />
                      </div>
                    </div>
                    
                    {sellForm.shares && sellForm.price && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-600">
                          Sale Proceeds: {formatCurrency(
                            parseFloat(sellForm.shares) * parseFloat(sellForm.price)
                          )}
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-4 flex space-x-2">
                      <button
                        type="submit"
                        className="btn-primary flex-1"
                        disabled={loading}
                      >
                        {loading ? 'Processing...' : 'Confirm Sale'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSellForm({ show: false, shares: '', price: '' });
                          setSelectedInvestment(null);
                        }}
                        className="btn-outline"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-8">
          <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Investments Yet
          </h3>
          <p className="text-gray-500 mb-4">
            Start building your portfolio by making your first investment.
          </p>
          <button
            onClick={() => setShowPurchaseForm(true)}
            className="btn-primary"
          >
            Make Your First Investment
          </button>
        </div>
      )}
    </div>
  );
};

export default InvestmentPage;