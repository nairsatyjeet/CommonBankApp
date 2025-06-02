import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DepositPage from './pages/DepositPage';
import WithdrawPage from './pages/WithdrawPage';
import ChangePinPage from './pages/ChangePinPage';
import StatementPage from './pages/StatementPage';
import InvestmentPage from './pages/InvestmentPage';
import TransferPage from './pages/TransferPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import './index.css';

function App() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background-light">
      <Routes>
        <Route path="/login" element={!currentUser ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/" element={<Navigate to={currentUser ? "/dashboard" : "/login"} />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/deposit" element={<DepositPage />} />
          <Route path="/withdraw" element={<WithdrawPage />} />
          <Route path="/change-pin" element={<ChangePinPage />} />
          <Route path="/statement" element={<StatementPage />} />
          <Route path="/investments" element={<InvestmentPage />} />
          <Route path="/transfer" element={<TransferPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;