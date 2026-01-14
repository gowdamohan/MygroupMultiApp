import React, { useState, useEffect } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';

interface Country {
  id: number;
  name: string;
  currency_code: string;
  currency_symbol: string;
  flag_icon: string;
}

interface ExchangeRate {
  rate: number;
  loading: boolean;
  error: string;
}

interface App {
  id: number;
  name: string;
}

interface Category {
  id: number;
  category_name: string;
}

interface PricingSlave {
  selected_date: string;
  my_coins: number;
  app_id: number;
  category_id: number;
}

interface CellEditModal {
  appId: number;
  categoryId: number;
  date: string;
  currentPrice: number;
}

export const CorporateHeaderAdsPricing: React.FC = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate>({ rate: 0, loading: false, error: '' });
  const [activeTab, setActiveTab] = useState<'General' | 'Capitals'>('General');
  const [showModal, setShowModal] = useState(false);
  const [myCoins, setMyCoins] = useState('');
  const [loading, setLoading] = useState(false);
  const [pricingData, setPricingData] = useState<{[key: string]: PricingSlave[]}>({});
  const [masterPrice, setMasterPrice] = useState(0);
  const [apps, setApps] = useState<App[]>([]);
  const [appCategories, setAppCategories] = useState<{[appId: number]: Category[]}>({});
  const [cellEditModal, setCellEditModal] = useState<CellEditModal | null>(null);
  const [cellPrice, setCellPrice] = useState('');

  useEffect(() => {
    fetchCountries();
    fetchApps();
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      fetchExchangeRate();
      fetchPricingData();
    }
  }, [selectedCountry, activeTab]);

  const fetchExchangeRate = async () => {
    if (!selectedCountry) return;

    setExchangeRate({ rate: 0, loading: true, error: '' });

    try {
      // Using exchangerate-api.com (free tier, no API key required)
      const res = await axios.get(`https://api.exchangerate-api.com/v4/latest/${selectedCountry.currency_code}`);
      
      if (res.data && res.data.rates && res.data.rates.USD) {
        setExchangeRate({ rate: res.data.rates.USD, loading: false, error: '' });
      } else {
        setExchangeRate({ rate: 0, loading: false, error: 'Rate not available' });
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      setExchangeRate({ rate: 0, loading: false, error: 'Failed to fetch rate' });
    }
  };

  const fetchCountries = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_BASE_URL}/header-ads-pricing/countries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setCountries(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedCountry(res.data.data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  const fetchApps = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_BASE_URL}/header-ads/my-apps`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setApps(res.data.data);
        for (const app of res.data.data) {
          await fetchCategories(app.id);
        }
      }
    } catch (error) {
      console.error('Error fetching apps:', error);
    }
  };

  const fetchCategories = async (appId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_BASE_URL}/header-ads/categories/${appId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setAppCategories(prev => ({ ...prev, [appId]: res.data.data }));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchPricingData = async () => {
    if (!selectedCountry) return;

    try {
      const token = localStorage.getItem('accessToken');
      const today = new Date();
      const endDate = new Date(today.getFullYear(), today.getMonth() + 3, 0);

      const res = await axios.get(`${API_BASE_URL}/header-ads-pricing/slave`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          country_id: selectedCountry.id,
          pricing_slot: activeTab,
          start_date: today.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        }
      });

      if (res.data.success) {
        setMasterPrice(res.data.data.master_price || 0);
        const grouped: {[key: string]: PricingSlave[]} = {};
        res.data.data.slaves.forEach((item: any) => {
          const key = `${item.app_id}-${item.category_id}`;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push({
            selected_date: item.selected_date,
            my_coins: item.my_coins,
            app_id: item.app_id,
            category_id: item.category_id
          });
        });
        setPricingData(grouped);
      }
    } catch (error) {
      console.error('Error fetching pricing data:', error);
    }
  };

  const handleCellClick = (appId: number, categoryId: number, date: string) => {
    const currentPrice = getPriceForDate(appId, categoryId, date);
    setCellEditModal({ appId, categoryId, date, currentPrice });
    setCellPrice(currentPrice.toString());
  };

  const handleUpdateCellPrice = async () => {
    if (!cellEditModal || !selectedCountry || !cellPrice) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.put(`${API_BASE_URL}/header-ads-pricing/slave`, {
        app_id: cellEditModal.appId,
        category_id: cellEditModal.categoryId,
        selected_date: cellEditModal.date,
        my_coins: parseFloat(cellPrice),
        country_id: selectedCountry.id,
        pricing_slot: activeTab
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setCellEditModal(null);
        setCellPrice('');
        await fetchPricingData();
      }
    } catch (error) {
      console.error('Error updating cell price:', error);
      alert('Failed to update price. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPricing = async () => {
    if (!selectedCountry || !myCoins) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.post(`${API_BASE_URL}/header-ads-pricing/master`, {
        country_id: selectedCountry.id,
        pricing_slot: activeTab,
        my_coins: parseFloat(myCoins)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setShowModal(false);
        setMyCoins('');
        // Refresh pricing data to show new amounts
        await fetchPricingData();
      }
    } catch (error) {
      console.error('Error creating pricing:', error);
      alert('Failed to create pricing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMonthGroups = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const groups: { month: string; dates: { date: string; day: number }[] }[] = [];

    for (let m = 0; m < 3; m++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() + m, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const dates = [];

      const startDay = (m === 0) ? today.getDate() : 1;
      
      for (let day = startDay; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split('T')[0];
        dates.push({ date: dateStr, day });
      }

      if (dates.length > 0) {
        groups.push({ month: monthName, dates });
      }
    }

    return groups;
  };

  const getPriceForDate = (appId: number, categoryId: number, date: string): number => {
    const key = `${appId}-${categoryId}`;
    const prices = pricingData[key];
    if (!prices) return masterPrice;
    const found = prices.find(p => p.selected_date === date);
    return found ? found.my_coins : masterPrice;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Header Ads Pricing Management</h1>
      </div>

      {/* Country Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Country</label>
            <select
              value={selectedCountry?.id || ''}
              onChange={(e) => {
                const country = countries.find(c => c.id === parseInt(e.target.value));
                setSelectedCountry(country || null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              {countries.map(country => (
                <option key={country.id} value={country.id}>
                  {country.name} - {country.currency_code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
              {selectedCountry?.currency_symbol} {selectedCountry?.currency_code}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Exchange Rate</label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm">
              {exchangeRate.loading ? (
                <span className="text-gray-500">Loading...</span>
              ) : exchangeRate.error ? (
                <span className="text-red-500">{exchangeRate.error}</span>
              ) : exchangeRate.rate > 0 ? (
                <span>{selectedCountry?.currency_code} 1 = ${exchangeRate.rate.toFixed(4)} USD</span>
              ) : (
                <span className="text-gray-500">Select a country</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => { setActiveTab('General'); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          Adding Prices to General - Header Ads
        </button>
        <button
          onClick={() => { setActiveTab('Capitals'); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus size={18} />
          Adding Prices to Capitals - Header Ads
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('General')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'General'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          General Ads
        </button>
        <button
          onClick={() => setActiveTab('Capitals')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'Capitals'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Capital Ads
        </button>
      </div>

      {/* Pricing Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr>
              <th rowSpan={2} className="sticky left-0 z-20 bg-blue-600 border border-gray-300 px-4 py-2 text-sm font-bold text-white min-w-[150px]">
                Category
              </th>
              {getMonthGroups().map((group, idx) => {
                const colors = ['bg-blue-600', 'bg-indigo-600', 'bg-purple-600'];
                return (
                  <th key={group.month} colSpan={group.dates.length} className={`border border-gray-300 px-2 py-2 text-sm font-bold text-white ${colors[idx]}`}>
                    {group.month}
                  </th>
                );
              })}
            </tr>
            <tr>
              {getMonthGroups().map((group, idx) => {
                const colors = ['bg-blue-600', 'bg-indigo-600', 'bg-purple-600'];
                return group.dates.map((dayInfo) => (
                  <th key={dayInfo.date} className={`border border-gray-300 px-2 py-2 text-xs font-semibold text-white min-w-[50px] ${colors[idx]}`}>
                    {dayInfo.day}
                  </th>
                ));
              })}
            </tr>
          </thead>
          <tbody>
            {apps.map((app) => {
              const categories = appCategories[app.id] || [];
              return (
                <React.Fragment key={app.id}>
                  <tr>
                    <td colSpan={getMonthGroups().reduce((sum, g) => sum + g.dates.length, 0) + 1} 
                      className="bg-blue-500 border border-gray-300 px-4 py-2 font-bold text-white">
                      {app.name}
                    </td>
                  </tr>
                  {categories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="sticky left-0 z-10 bg-blue-100 border border-gray-300 px-4 py-2 font-medium text-gray-900">
                        {category.category_name}
                      </td>
                      {getMonthGroups().flatMap(g => g.dates).map((dayInfo) => {
                        const price = getPriceForDate(app.id, category.id, dayInfo.date);
                        return (
                          <td 
                            key={dayInfo.date} 
                            onClick={() => handleCellClick(app.id, category.id, dayInfo.date)}
                            className="border border-gray-300 px-2 py-2 text-center text-xs bg-green-50 cursor-pointer hover:bg-green-100 transition-colors"
                          >
                            <div className="font-semibold text-gray-900">₹{price}</div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cell Edit Modal */}
      <AnimatePresence>
        {cellEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Edit Price - {new Date(cellEditModal.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </h3>
                <button onClick={() => setCellEditModal(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount in MyCoins
                  </label>
                  <input
                    type="number"
                    value={cellPrice}
                    onChange={(e) => setCellPrice(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Master price: ₹{masterPrice}</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setCellEditModal(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateCellPrice}
                    disabled={loading || !cellPrice}
                    className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Update'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Add Pricing - {activeTab}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount in MyCoins
                  </label>
                  <input
                    type="number"
                    value={myCoins}
                    onChange={(e) => setMyCoins(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitPricing}
                    disabled={loading || !myCoins}
                    className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Submit'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
