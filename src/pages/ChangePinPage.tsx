import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NumericKeypad from '../components/NumericKeypad';
import { ArrowLeft, LockKeyhole, Eye, EyeOff, CheckCircle } from 'lucide-react';

const ChangePinPage: React.FC = () => {
  const { verifyPin, changePin } = useAuth();
  const navigate = useNavigate();
  
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'current' | 'new' | 'confirm' | 'success'>('current');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleKeyPress = (key: string) => {
    if (step === 'current' && currentPin.length < 4) {
      setCurrentPin(currentPin + key);
    } else if (step === 'new' && newPin.length < 4) {
      setNewPin(newPin + key);
    } else if (step === 'confirm' && confirmPin.length < 4) {
      setConfirmPin(confirmPin + key);
    }
  };

  const handleClear = () => {
    if (step === 'current') {
      setCurrentPin('');
    } else if (step === 'new') {
      setNewPin('');
    } else if (step === 'confirm') {
      setConfirmPin('');
    }
  };

  const handleBack = () => {
    if (step === 'new') {
      setStep('current');
      setNewPin('');
    } else if (step === 'confirm') {
      setStep('new');
      setConfirmPin('');
    } else {
      navigate('/dashboard');
    }
  };

  const validateCurrentPin = async () => {
    if (currentPin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }

    setLoading(true);
    try {
      const isValid = await verifyPin(currentPin);
      if (isValid) {
        setStep('new');
        setError('');
      } else {
        setError('Current PIN is incorrect');
      }
    } catch (error) {
      setError('Failed to verify PIN');
    } finally {
      setLoading(false);
    }
  };

  const validateNewPin = () => {
    if (newPin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }

    if (newPin === currentPin) {
      setError('New PIN must be different from current PIN');
      return;
    }

    setStep('confirm');
    setError('');
  };

  const handleConfirmPin = async () => {
    if (confirmPin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }

    if (newPin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setLoading(true);
    try {
      const success = await changePin(currentPin, newPin);
      if (success) {
        setStep('success');
        setError('');
      } else {
        setError('Failed to change PIN');
      }
    } catch (error) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (step === 'current') {
      validateCurrentPin();
    } else if (step === 'new') {
      validateNewPin();
    } else if (step === 'confirm') {
      handleConfirmPin();
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center mb-6">
        <button
          onClick={handleBack}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">Change PIN</h1>
      </div>

      <div className="card">
        {step === 'success' ? (
          <div className="text-center py-8 animate-fade-in">
            <CheckCircle className="h-16 w-16 text-success-500 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-success-500 mb-2">PIN Changed Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Your PIN has been updated. Please use your new PIN for future transactions.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary"
            >
              Return to Dashboard
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center mb-6">
              <LockKeyhole className="h-10 w-10 text-primary-600 mr-4" />
              <h2 className="text-xl font-medium">
                {step === 'current' && 'Enter Current PIN'}
                {step === 'new' && 'Enter New PIN'}
                {step === 'confirm' && 'Confirm New PIN'}
              </h2>
            </div>

            {error && (
              <div className="bg-error-500 bg-opacity-10 p-3 rounded-md mb-4">
                <p className="text-error-500 text-sm">{error}</p>
              </div>
            )}

            <div className="mb-6">
              {step === 'current' && (
                <div className="relative">
                  <div className="bg-gray-100 p-4 rounded-md text-center">
                    <p className="text-xl font-mono tracking-wider">
                      {showCurrentPin ? currentPin.padEnd(4, '_') : currentPin.replace(/./g, '•').padEnd(4, '•')}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowCurrentPin(!showCurrentPin)}
                  >
                    {showCurrentPin ? (
                      <EyeOff className="h-5 w-5 text-gray-500" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                </div>
              )}

              {step === 'new' && (
                <div className="relative">
                  <div className="bg-gray-100 p-4 rounded-md text-center">
                    <p className="text-xl font-mono tracking-wider">
                      {showNewPin ? newPin.padEnd(4, '_') : newPin.replace(/./g, '•').padEnd(4, '•')}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowNewPin(!showNewPin)}
                  >
                    {showNewPin ? (
                      <EyeOff className="h-5 w-5 text-gray-500" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                </div>
              )}

              {step === 'confirm' && (
                <div className="relative">
                  <div className="bg-gray-100 p-4 rounded-md text-center">
                    <p className="text-xl font-mono tracking-wider">
                      {showConfirmPin ? confirmPin.padEnd(4, '_') : confirmPin.replace(/./g, '•').padEnd(4, '•')}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                  >
                    {showConfirmPin ? (
                      <EyeOff className="h-5 w-5 text-gray-500" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                </div>
              )}
            </div>

            <NumericKeypad
              onKeyPress={handleKeyPress}
              onClear={handleClear}
              onSubmit={handleSubmit}
            />

            <div className="mt-6">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`btn-primary w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Processing...' : 'Continue'}
              </button>
            </div>

            {step === 'new' && (
              <div className="mt-4 text-sm text-gray-600">
                <p className="mb-1">Your PIN should:</p>
                <ul className="list-disc list-inside">
                  <li>Be 4 digits long</li>
                  <li>Be different from your current PIN</li>
                  <li>Not be easily guessable (like 1234 or 0000)</li>
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChangePinPage;