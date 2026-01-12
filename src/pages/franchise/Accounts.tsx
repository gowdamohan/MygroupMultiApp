import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Download, Filter, RefreshCw, Image, BarChart3 } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';

interface Transaction {
  id: number;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  reference_type: string;
  reference_id: number;
  balance_after: number;
  created_at: string;
}

interface AdTransaction {
  id: number;
  ad_slot: string;
  ad_date: string;
  amount: number;
  status: string;
  created_at: string;
}

interface ReportSummary {
  totalCredits: number;
  totalDebits: number;
  netBalance: number;
  transactionCount: number;
}

interface AdsSummary {
  totalSpent: number;
  totalAds: number;
  pendingAds: number;
  approvedAds: number;
}

export const Accounts: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'ads'>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [adTransactions, setAdTransactions] = useState<AdTransaction[]>([]);
  const [summary, setSummary] = useState<ReportSummary>({
    totalCredits: 0,
    totalDebits: 0,
    netBalance: 0,
    transactionCount: 0
  });
  const [adsSummary, setAdsSummary] = useState<AdsSummary>({
    totalSpent: 0,
    totalAds: 0,
    pendingAds: 0,
    approvedAds: 0
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');

  useEffect(() => {
    if (activeTab === 'all') {
      fetchTransactions();
    } else {
      fetchAdTransactions();
    }
  }, [dateRange, filterType, activeTab]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/wallet/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          start_date: dateRange.startDate,
          end_date: dateRange.endDate,
          type: filterType !== 'all' ? filterType : undefined
        }
      });

      if (response.data.success) {
        const txns = response.data.data.transactions || [];
        setTransactions(txns);

        // Calculate summary
        const credits = txns.filter((t: Transaction) => t.type === 'credit').reduce((sum: number, t: Transaction) => sum + t.amount, 0);
        const debits = txns.filter((t: Transaction) => t.type === 'debit').reduce((sum: number, t: Transaction) => sum + t.amount, 0);
        setSummary({
          totalCredits: credits,
          totalDebits: debits,
          netBalance: credits - debits,
          transactionCount: txns.length
        });
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdTransactions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/advertisement/my-ads`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          start_date: dateRange.startDate,
          end_date: dateRange.endDate
        }
      });

      if (response.data.success) {
        const ads = response.data.data || [];
        setAdTransactions(ads);

        // Calculate ads summary
        const totalSpent = ads.reduce((sum: number, ad: AdTransaction) => sum + (ad.amount || 0), 0);
        const pendingAds = ads.filter((ad: AdTransaction) => ad.status === 'pending').length;
        const approvedAds = ads.filter((ad: AdTransaction) => ad.status === 'approved').length;

        setAdsSummary({
          totalSpent,
          totalAds: ads.length,
          pendingAds,
          approvedAds
        });
      }
    } catch (err) {
      console.error('Error fetching ad transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (activeTab === 'all') {
      const headers = ['Date', 'Type', 'Description', 'Amount', 'Balance After'];
      const rows = transactions.map(t => [
        new Date(t.created_at).toLocaleDateString(),
        t.type,
        t.description,
        t.amount.toFixed(2),
        t.balance_after.toFixed(2)
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${dateRange.startDate}_${dateRange.endDate}.csv`;
      a.click();
    } else {
      const headers = ['Date', 'Ad Slot', 'Ad Date', 'Amount', 'Status'];
      const rows = adTransactions.map(ad => [
        new Date(ad.created_at).toLocaleDateString(),
        ad.ad_slot,
        ad.ad_date,
        (ad.amount || 0).toFixed(2),
        ad.status
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ads_report_${dateRange.startDate}_${dateRange.endDate}.csv`;
      a.click();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const handleRefresh = () => {
    if (activeTab === 'all') {
      fetchTransactions();
    } else {
      fetchAdTransactions();
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Accounts & Financial Reports</h1>
        <div className="flex gap-2">
          <button onClick={handleRefresh} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          All Transactions
        </button>
        <button
          onClick={() => setActiveTab('ads')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'ads'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Image className="w-4 h-4" />
          Ads Only
        </button>
      </div>

      {/* Summary Cards */}
      {activeTab === 'all' ? (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Credits</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalCredits)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Debits</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalDebits)}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Net Balance</p>
              <p className={`text-2xl font-bold ${summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.netBalance)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{summary.transactionCount}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Spent on Ads</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(adsSummary.totalSpent)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Ads</p>
              <p className="text-2xl font-bold text-gray-900">{adsSummary.totalAds}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Image className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Ads</p>
              <p className="text-2xl font-bold text-yellow-600">{adsSummary.pendingAds}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approved Ads</p>
              <p className="text-2xl font-bold text-green-600">{adsSummary.approvedAds}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          {activeTab === 'all' && (
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'credit' | 'debit')}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Transactions</option>
              <option value="credit">Credits Only</option>
              <option value="debit">Debits Only</option>
            </select>
          </div>
          )}
        </div>
      </div>

      {/* Transactions/Ads Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">{activeTab === 'all' ? 'Transaction History' : 'Ads History'}</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : activeTab === 'all' ? (
          transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No transactions found for the selected period
            </div>
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
                  {transactions.map((txn, index) => (
                    <tr key={txn.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(txn.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          txn.type === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {txn.type === 'credit' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                          {txn.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{txn.description}</td>
                      <td className={`px-4 py-3 text-sm text-right font-medium ${
                        txn.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(txn.balance_after)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          adTransactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No ads found for the selected period
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ad Slot</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ad Date</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {adTransactions.map((ad, index) => (
                    <tr key={ad.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(ad.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {ad.ad_slot === 'ads1' ? 'Header Ads 1' : 'Header Ads 2'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(ad.ad_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                        {formatCurrency(ad.amount || 0)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          ad.status === 'approved' ? 'bg-green-100 text-green-700' :
                          ad.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          ad.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {ad.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
};
