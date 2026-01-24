import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wallet, TrendingUp, TrendingDown, Calendar, Download, RefreshCw, Plus, Search } from 'lucide-react';
import { API_BASE_URL } from '../../config/api.config';

interface WalletData {
  id: number;
  balance: number;
  currency: string;
  is_active: number;
  user?: { first_name: string; last_name: string; email: string };
}

interface Transaction {
  id: number;
  transaction_type: 'credit' | 'debit' | 'refund';
  amount: number;
  description: string;
  reference_type: string;
  balance_before: number;
  balance_after: number;
  created_at: string;
}

export const AdminWallet: React.FC = () => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchWalletData();
    fetchTransactions();
  }, []);

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/wallet?wallet_type=admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setWallet(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/wallet/transactions?wallet_type=admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setTransactions(response.data.data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async () => {
    if (!targetUserId || !amount) {
      setMessage({ type: 'error', text: 'User ID and amount are required' });
      return;
    }
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${API_BASE_URL}/wallet/add-funds`, {
        user_id: parseInt(targetUserId),
        amount: parseFloat(amount),
        description: description || 'Admin deposit',
        wallet_type: 'partner'
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage({ type: 'success', text: 'Funds added successfully' });
      setShowAddFundsModal(false);
      setTargetUserId('');
      setAmount('');
      setDescription('');
      fetchWalletData();
      fetchTransactions();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to add funds' });
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  const exportCSV = () => {
    const headers = ['Date', 'Type', 'Description', 'Amount', 'Balance After'];
    const rows = transactions.map(t => [
      new Date(t.created_at).toLocaleDateString(),
      t.transaction_type,
      t.description,
      t.amount.toFixed(2),
      t.balance_after.toFixed(2)
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin_wallet_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Wallet</h1>
        <div className="flex gap-2">
          <button onClick={() => { fetchWalletData(); fetchTransactions(); }} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => setShowAddFundsModal(true)} className="flex items-center gap-2 px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700">
            <Plus className="w-4 h-4" /> Add Funds to User
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Wallet Balance Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Admin Wallet Balance</p>
              <p className="text-3xl font-bold mt-1">{wallet ? formatCurrency(wallet.balance) : '₹0.00'}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-full">
              <Wallet className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Transaction History</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No transactions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((txn, idx) => (
                  <tr key={txn.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{new Date(txn.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        txn.transaction_type === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {txn.transaction_type === 'credit' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {txn.transaction_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{txn.description}</td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${txn.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {txn.transaction_type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(txn.balance_after)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Funds Modal */}
      {showAddFundsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Add Funds to User Wallet</h2>
            <div className="space-y-4">
              <input type="number" placeholder="User ID" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              <input type="number" step="0.01" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              <input type="text" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              <div className="flex gap-2">
                <button onClick={() => setShowAddFundsModal(false)} className="flex-1 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
                <button onClick={handleAddFunds} className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Add Funds</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

