import React from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';

interface TransactionCardProps {
  type: 'deposit' | 'withdrawal' | 'transfer' | 'investment';
  amount: number;
  date: string;
  description: string;
}

const TransactionCard: React.FC<TransactionCardProps> = ({
  type,
  amount,
  date,
  description,
}) => {
  const isCredit = type === 'deposit' || (type === 'transfer' && description.includes('from'));
  const colorClass = isCredit ? 'text-success-500' : 'text-error-500';
  const amountPrefix = isCredit ? '+' : '-';
  
  // Get icon based on transaction type
  const getIcon = () => {
    switch (type) {
      case 'deposit':
        return '⬆️';
      case 'withdrawal':
        return '⬇️';
      case 'transfer':
        return '↔️';
      case 'investment':
        return '📈';
      default:
        return '💰';
    }
  };

  return (
    <div className="card mb-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="rounded-full bg-gray-100 p-3 mr-4">
            <span className="text-xl">{getIcon()}</span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 capitalize">{type}</h3>
            <p className="text-sm text-gray-500">{description}</p>
            <p className="text-xs text-gray-400">{formatDate(date)}</p>
          </div>
        </div>
        <div className={`font-medium ${colorClass}`}>
          {amountPrefix}{formatCurrency(amount)}
        </div>
      </div>
    </div>
  );
};

export default TransactionCard;