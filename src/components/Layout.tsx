import React, { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, DollarSign, User, AlertCircle } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-primary-700' : '';
  };

  return (
    <div className="flex h-screen bg-background-light">
      {/* Sidebar */}
      <div className="w-64 bg-primary-900 text-white hidden md:block">
        <div className="p-4 flex items-center space-x-2">
          <DollarSign className="h-8 w-8 text-secondary-500" />
          <h1 className="text-xl font-bold">GreatBank ATM</h1>
        </div>
        
        <nav className="mt-8">
          <ul className="space-y-2">
            <li>
              <Link 
                to="/dashboard" 
                className={`flex items-center px-4 py-3 hover:bg-primary-800 transition-colors ${isActive('/dashboard')}`}
              >
                <span className="mr-3">🏠</span>
                Dashboard
              </Link>
            </li>
            <li>
              <Link 
                to="/deposit" 
                className={`flex items-center px-4 py-3 hover:bg-primary-800 transition-colors ${isActive('/deposit')}`}
              >
                <span className="mr-3">💰</span>
                Deposit
              </Link>
            </li>
            <li>
              <Link 
                to="/withdraw" 
                className={`flex items-center px-4 py-3 hover:bg-primary-800 transition-colors ${isActive('/withdraw')}`}
              >
                <span className="mr-3">💸</span>
                Withdraw
              </Link>
            </li>
            <li>
              <Link 
                to="/transfer" 
                className={`flex items-center px-4 py-3 hover:bg-primary-800 transition-colors ${isActive('/transfer')}`}
              >
                <span className="mr-3">↔️</span>
                Transfer
              </Link>
            </li>
            <li>
              <Link 
                to="/statement" 
                className={`flex items-center px-4 py-3 hover:bg-primary-800 transition-colors ${isActive('/statement')}`}
              >
                <span className="mr-3">📄</span>
                Statement
              </Link>
            </li>
            <li>
              <Link 
                to="/investments" 
                className={`flex items-center px-4 py-3 hover:bg-primary-800 transition-colors ${isActive('/investments')}`}
              >
                <span className="mr-3">📈</span>
                Investments
              </Link>
            </li>
            <li>
              <Link 
                to="/change-pin" 
                className={`flex items-center px-4 py-3 hover:bg-primary-800 transition-colors ${isActive('/change-pin')}`}
              >
                <span className="mr-3">🔒</span>
                Change PIN
              </Link>
            </li>
            <li>
              <Link 
                to="/profile" 
                className={`flex items-center px-4 py-3 hover:bg-primary-800 transition-colors ${isActive('/profile')}`}
              >
                <span className="mr-3">👤</span>
                Profile
              </Link>
            </li>
          </ul>
        </nav>
        
        <div className="absolute bottom-0 w-64 p-4">
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center w-full px-4 py-2 bg-primary-800 hover:bg-primary-700 rounded transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </div>
      </div>
      
      {/* Mobile Header */}
      <div className="md:hidden w-full bg-primary-900 text-white p-4 flex justify-between items-center fixed top-0 z-10">
        <div className="flex items-center">
          <DollarSign className="h-6 w-6 text-secondary-500 mr-2" />
          <h1 className="text-lg font-bold">GreatBank ATM</h1>
        </div>
        
        <div className="flex space-x-4">
          <Link to="/profile">
            <User className="h-6 w-6" />
          </Link>
          <button onClick={handleLogout}>
            <LogOut className="h-6 w-6" />
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="md:p-8 p-4 md:pt-8 pt-20 h-full">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;