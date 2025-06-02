import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DollarSign } from 'lucide-react';
import NumericKeypad from '../components/NumericKeypad';
import LoadingSpinner from '../components/LoadingSpinner';

const LoginPage: React.FC = () => {
  const [accountNumber, setAccountNumber] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState<'account' | 'pin'>('account');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleAccountKeyPress = (key: string) => {
    if (accountNumber.length < 16) {
      setAccountNumber(accountNumber + key);
    }
  };

  const handlePinKeyPress = (key: string) => {
    if (pin.length < 4) {
      setPin(pin + key);
    }
  };

  const handleAccountSubmit = () => {
    if (accountNumber.length === 16) {
      setStep('pin');
      setError('');
    } else {
      setError('Please enter a valid 16-digit account number');
    }
  };

  const handlePinSubmit = async () => {
    if (pin.length === 4) {
      setError('');
      setLoading(true);
      try {
        await login(accountNumber, pin);
        navigate('/dashboard');
      } catch (error) {
        setError('Invalid account number or PIN');
        setPin('');
      } finally {
        setLoading(false);
      }
    } else {
      setError('Please enter a valid 4-digit PIN');
    }
  };

  const handleClearAccount = () => {
    setAccountNumber('');
  };

  const handleClearPin = () => {
    setPin('');
  };

  const formatDisplayAccount = () => {
    return accountNumber.replace(/(.{4})/g, '$1-').replace(/-$/, '');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-900 to-primary-700 flex items-center justify-center p-4">
      <div className="atm-screen max-w-md w-full animate-fade-in">
        <div className="bg-primary-900 p-4 flex items-center justify-center border-b-4 border-secondary-500">
          <DollarSign className="h-8 w-8 text-secondary-500" />
          <h1 className="text-2xl font-bold text-white ml-2">GreatBank ATM</h1>
        </div>
        
        <div className="bg-white p-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-primary-900">
              {step === 'account' ? 'Enter Your Account Number' : 'Enter Your PIN'}
            </h2>
            {error && <p className="text-error-500 mt-2">{error}</p>}
          </div>

          {loading && <LoadingSpinner />}
          
          {!loading && (
            <>
              <div className="bg-gray-100 p-4 rounded-md text-center mb-6">
                {step === 'account' ? (
                  <p className="text-xl font-mono tracking-wider">
                    {formatDisplayAccount() || 'XXXX-XXXX-XXXX-XXXX'}
                  </p>
                ) : (
                  <p className="text-xl font-mono tracking-wider">
                    {pin.replace(/./g, '•') || '••••'}
                  </p>
                )}
              </div>

              <NumericKeypad
                onKeyPress={step === 'account' ? handleAccountKeyPress : handlePinKeyPress}
                onClear={step === 'account' ? handleClearAccount : handleClearPin}
                onSubmit={step === 'account' ? handleAccountSubmit : handlePinSubmit}
              />
              
              {step === 'pin' && (
                <button
                  onClick={() => setStep('account')}
                  className="mt-4 text-primary-600 hover:text-primary-800 text-center w-full"
                >
                  Back to Account Number
                </button>
              )}
              
              <div className="mt-8 text-center text-sm text-gray-500">
                <p>For demo purposes, use:</p>
                <p>Account: 1234567890123456</p>
                <p>PIN: 1234</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;