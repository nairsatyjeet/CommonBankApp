import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  getAccountByUserId, 
  getTransactionsForDateRange 
} from '../services/accountService';
import { Account, Transaction } from '../lib/supabaseClient';
import { formatCurrency, formatDate, formatAccountNumber } from '../utils/formatters';
import TransactionCard from '../components/TransactionCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeft, Download, Printer, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Add the type declaration for jsPDF with autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const StatementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAccountData = async () => {
      if (!currentUser) return;
      
      try {
        const accountData = await getAccountByUserId(currentUser.id);
        setAccount(accountData);
        
        if (accountData) {
          await fetchTransactions(accountData.id);
        }
      } catch (error) {
        console.error('Error fetching account data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAccountData();
  }, [currentUser]);
  
  const fetchTransactions = async (accountId: string) => {
    setLoading(true);
    try {
      const txData = await getTransactionsForDateRange(
        accountId,
        `${dateRange.startDate}T00:00:00`,
        `${dateRange.endDate}T23:59:59`
      );
      setTransactions(txData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDateRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSearch = async () => {
    if (!account) return;
    await fetchTransactions(account.id);
  };

  const generatePDF = () => {
    if (!account) return;
    
    const doc = new jsPDF();
    
    // Add logo and header
    doc.setFontSize(20);
    doc.setTextColor(10, 36, 99); // Primary color
    doc.text('GreatBank', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Account Statement', 105, 30, { align: 'center' });
    
    // Add account info
    doc.setFontSize(10);
    doc.text(`Account Number: ${formatAccountNumber(account.account_number)}`, 20, 45);
    doc.text(`Account Type: ${account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)}`, 20, 52);
    doc.text(`Statement Period: ${new Date(dateRange.startDate).toLocaleDateString()} - ${new Date(dateRange.endDate).toLocaleDateString()}`, 20, 59);
    doc.text(`Current Balance: ${formatCurrency(account.balance)}`, 20, 66);
    doc.text(`Generated On: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, 73);
    
    // Create transactions table
    const tableColumn = ["Date", "Type", "Description", "Amount", "Balance"];
    
    // Calculate running balance
    let runningBalance = account.balance;
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      // Add to running balance for deposits, subtract for withdrawals
      if (tx.transaction_type === 'withdrawal' || 
          (tx.transaction_type === 'transfer' && !tx.description.includes('from'))) {
        runningBalance += tx.amount;
      } else {
        runningBalance -= tx.amount;
      }
    }
    
    // Create table data in reverse chronological order
    const tableRows = transactions.map(tx => {
      const isDebit = tx.transaction_type === 'withdrawal' || 
                      (tx.transaction_type === 'transfer' && !tx.description.includes('from'));
      
      // Update running balance for each transaction
      if (isDebit) {
        runningBalance -= tx.amount;
      } else {
        runningBalance += tx.amount;
      }
      
      return [
        new Date(tx.created_at).toLocaleDateString(),
        tx.transaction_type.charAt(0).toUpperCase() + tx.transaction_type.slice(1),
        tx.description,
        `${isDebit ? '-' : '+'}${formatCurrency(tx.amount)}`,
        formatCurrency(runningBalance)
      ];
    });
    
    // Reverse the array to get chronological order
    tableRows.reverse();
    
    // Add transactions table
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 80,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [10, 36, 99] },
      alternateRowStyles: { fillColor: [240, 240, 240] }
    });
    
    // Add footer
    const finalY = (doc as any).lastAutoTable.finalY || 80;
    doc.setFontSize(8);
    doc.text('This is an official account statement from GreatBank.', 105, finalY + 15, { align: 'center' });
    doc.text('Please contact customer service if you have any questions regarding this statement.', 105, finalY + 20, { align: 'center' });
    
    // Save the PDF
    doc.save(`greatbank_statement_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && !account) {
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
        <h1 className="text-2xl font-bold">Account Statement</h1>
      </div>
      
      {account && (
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-lg font-medium text-gray-900">
                {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)} Account
              </h2>
              <p className="text-gray-500 text-sm">{formatAccountNumber(account.account_number)}</p>
              <p className="font-medium mt-1">Current Balance: {formatCurrency(account.balance)}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={generatePDF}
                className="btn-outline flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </button>
              <button
                onClick={handlePrint}
                className="btn-outline flex items-center"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="card mb-6">
        <h2 className="text-lg font-medium mb-4">Select Date Range</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateRangeChange}
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateRangeChange}
              className="input-field"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleSearch}
            className="btn-primary"
          >
            View Transactions
          </button>
        </div>
      </div>
      
      <div ref={printRef}>
        <div className="print:block hidden mb-6 text-center">
          <h1 className="text-2xl font-bold">GreatBank Account Statement</h1>
          {account && (
            <div className="mt-4">
              <p>Account Number: {formatAccountNumber(account.account_number)}</p>
              <p>Account Type: {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)}</p>
              <p>Statement Period: {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}</p>
              <p>Current Balance: {formatCurrency(account.balance)}</p>
            </div>
          )}
        </div>
        
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Transaction History
          <span className="text-sm font-normal ml-2 text-gray-500">
            ({transactions.length} transactions)
          </span>
        </h2>
        
        {loading ? (
          <LoadingSpinner />
        ) : transactions.length > 0 ? (
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
          </div>
        ) : (
          <div className="card text-center py-8">
            <p className="text-gray-500">No transactions found for the selected date range.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatementPage;