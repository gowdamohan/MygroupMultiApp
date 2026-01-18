import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
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

interface MasterPriceData {
  id: number | null;
  my_coins: number;
}

interface MasterPricing {
  General: {
    header_ads: MasterPriceData | null;
    popup_ads: MasterPriceData | null;
    middle_ads: MasterPriceData | null;
  };
  Capitals: {
    header_ads: MasterPriceData | null;
    popup_ads: MasterPriceData | null;
    middle_ads: MasterPriceData | null;
  };
}

interface PriceCardEditModal {
  pricing_slot: 'General' | 'Capitals';
  ads_type: 'header_ads' | 'popup_ads' | 'middle_ads';
  currentPrice: number;
}

export const CorporateHeaderAdsPricing: React.FC = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate>({ rate: 0, loading: false, error: '' });
  const [activeTab, setActiveTab] = useState<'General' | 'Capitals'>('General');
  const [loading, setLoading] = useState(false);
  const [pricingData, setPricingData] = useState<{[key: string]: PricingSlave[]}>({});
  const [apps, setApps] = useState<App[]>([]);
  const [appCategories, setAppCategories] = useState<{[appId: number]: Category[]}>({});
  const [cellEditModal, setCellEditModal] = useState<CellEditModal | null>(null);
  const [cellPrice, setCellPrice] = useState('');

  // Master pricing for all ads types
  const [masterPricing, setMasterPricing] = useState<MasterPricing>({
    General: { header_ads: null, popup_ads: null, middle_ads: null },
    Capitals: { header_ads: null, popup_ads: null, middle_ads: null }
  });

  // Price card edit modal
  const [priceCardModal, setPriceCardModal] = useState<PriceCardEditModal | null>(null);
  const [priceCardValue, setPriceCardValue] = useState('');

  useEffect(() => {
    fetchCountries();
    fetchApps();
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      fetchExchangeRate();
      fetchMasterPricing();
      fetchPricingData();
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedCountry) {
      fetchPricingData();
    }
  }, [activeTab]);

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

  const fetchMasterPricing = async () => {
    if (!selectedCountry) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_BASE_URL}/header-ads-pricing/master/all`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { country_id: selectedCountry.id }
      });

      if (res.data.success) {
        setMasterPricing(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching master pricing:', error);
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
    setCellEditModal({ appId, categoryId, date, currentPrice: currentPrice || 0 });
    setCellPrice(currentPrice ? currentPrice.toString() : '');
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

  // Handle price card click to open edit modal
  const handlePriceCardClick = (
    pricing_slot: 'General' | 'Capitals',
    ads_type: 'header_ads' | 'popup_ads' | 'middle_ads'
  ) => {
    const currentPrice = masterPricing[pricing_slot]?.[ads_type]?.my_coins || 0;
    setPriceCardModal({ pricing_slot, ads_type, currentPrice });
    setPriceCardValue(currentPrice > 0 ? currentPrice.toString() : '');
  };

  // Submit price card update
  const handlePriceCardUpdate = async () => {
    if (!priceCardModal || !selectedCountry || !priceCardValue) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.post(`${API_BASE_URL}/header-ads-pricing/master`, {
        country_id: selectedCountry.id,
        pricing_slot: priceCardModal.pricing_slot,
        ads_type: priceCardModal.ads_type,
        my_coins: parseFloat(priceCardValue)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setPriceCardModal(null);
        setPriceCardValue('');
        await fetchMasterPricing();
        await fetchPricingData();
      }
    } catch (error) {
      console.error('Error updating price card:', error);
      alert('Failed to update price. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get ads type display name
  const getAdsTypeName = (ads_type: string) => {
    switch (ads_type) {
      case 'header_ads': return 'Header Ads';
      case 'popup_ads': return 'Popup Ads';
      case 'middle_ads': return 'Middle Ads';
      default: return ads_type;
    }
  };

  // Helper to format date as YYYY-MM-DD without timezone issues
  const formatDateString = (year: number, month: number, day: number): string => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getMonthGroups = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const groups: { month: string; year: number; dates: { date: string; day: number }[] }[] = [];

    for (let m = 0; m < 3; m++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() + m, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const dates: { date: string; day: number }[] = [];

      const startDay = (m === 0) ? today.getDate() : 1;

      for (let day = startDay; day <= daysInMonth; day++) {
        const dateStr = formatDateString(year, month, day);
        dates.push({ date: dateStr, day });
      }

      if (dates.length > 0) {
        groups.push({ month: monthName, year, dates });
      }
    }

    return groups;
  };

  const getPriceForDate = (appId: number, categoryId: number, date: string): number | null => {
    const key = `${appId}-${categoryId}`;
    const prices = pricingData[key];
    if (!prices) return null;
    const found = prices.find(p => p.selected_date === date);
    return found ? found.my_coins : null;
  };

  // Render price card
  const renderPriceCard = (
    pricing_slot: 'General' | 'Capitals',
    ads_type: 'header_ads' | 'popup_ads' | 'middle_ads',
    bgColor: string
  ) => {
    const priceData = masterPricing[pricing_slot]?.[ads_type];
    const price = priceData?.my_coins || 0;

    return (
      <button
        onClick={() => handlePriceCardClick(pricing_slot, ads_type)}
        className={`${bgColor} text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity min-w-[180px] text-center`}
      >
        {getAdsTypeName(ads_type)} : {price.toFixed(0).padStart(5, '0')} Mycoins
      </button>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Header Ads Pricing Management</h1>
      </div>

      {/* Top Section - My Coins Pricing Value */}
      <div className="bg-indigo-700 rounded-xl p-4 space-y-4">
        {/* Row 1: MY Coins Pricing Value with Country Selection */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-white font-semibold text-lg">MY Coins Pricing Value</span>

          {/* Country Dropdown with Flag */}
          <div className="flex items-center gap-2 bg-indigo-600 rounded-lg px-3 py-2">
            {selectedCountry?.flag_icon && (
              <span className="text-xl">{selectedCountry.flag_icon}</span>
            )}
            <select
              value={selectedCountry?.id || ''}
              onChange={(e) => {
                const country = countries.find(c => c.id === parseInt(e.target.value));
                setSelectedCountry(country || null);
              }}
              className="bg-transparent text-white border-none focus:ring-0 focus:outline-none cursor-pointer"
            >
              {countries.map(country => (
                <option key={country.id} value={country.id} className="text-gray-900">
                  {country.name} - {country.currency_code}
                </option>
              ))}
            </select>
          </div>

          {/* Currency Display */}
          <div className="flex items-center gap-2 text-white">
            {exchangeRate.loading ? (
              <span className="text-white/70">Loading...</span>
            ) : exchangeRate.error ? (
              <span className="text-red-300">{exchangeRate.error}</span>
            ) : selectedCountry ? (
              <>
                <span className="bg-indigo-600 px-3 py-2 rounded-lg">1</span>
                <span>=</span>
                <span className="bg-indigo-600 px-3 py-2 rounded-lg">
                  {exchangeRate.rate > 0 ? Math.round(1 / exchangeRate.rate) : 1}
                </span>
                <span className="font-semibold">Mycoins</span>
              </>
            ) : (
              <span className="text-white/70">Select a country</span>
            )}
          </div>
        </div>

        {/* Row 2: Adding prices to General */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-white font-semibold min-w-[200px]">Adding Pricess to General</span>
          <div className="flex flex-wrap gap-3">
            {renderPriceCard('General', 'header_ads', 'bg-cyan-500')}
            {renderPriceCard('General', 'popup_ads', 'bg-cyan-500')}
            {renderPriceCard('General', 'middle_ads', 'bg-cyan-500')}
          </div>
        </div>

        {/* Row 3: Adding prices to Capitals */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-white font-semibold min-w-[200px]">Adding Pricess to Capitals</span>
          <div className="flex flex-wrap gap-3">
            {renderPriceCard('Capitals', 'header_ads', 'bg-cyan-500')}
            {renderPriceCard('Capitals', 'popup_ads', 'bg-cyan-500')}
            {renderPriceCard('Capitals', 'middle_ads', 'bg-cyan-500')}
          </div>
        </div>
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-auto" style={{ maxHeight: '600px' }}>
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-20 bg-white">
            <tr>
              <th rowSpan={2} className="sticky left-0 z-30 bg-blue-600 border border-gray-300 px-4 py-2 text-sm font-bold text-white min-w-[150px]">
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
                      className="sticky left-0 z-10 bg-blue-500 border border-gray-300 px-4 py-2 font-bold text-white">
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
                            {price !== null ? (
                              <div className="font-semibold text-gray-900">🪙{price}</div>
                            ) : (
                              <div className="text-gray-400">-</div>
                            )}
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
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Edit Price</h3>
                  <p className="text-sm text-gray-600 mt-1">{new Date(cellEditModal.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <button onClick={() => setCellEditModal(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount in Rate
                  </label>
                  <input
                    type="number"
                    value={cellPrice}
                    onChange={(e) => setCellPrice(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Current: {cellEditModal.currentPrice > 0 ? `🪙${cellEditModal.currentPrice}` : 'Not set'}</p>
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

      {/* Price Card Edit Modal */}
      <AnimatePresence>
        {priceCardModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Update {getAdsTypeName(priceCardModal.ads_type)} Price
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {priceCardModal.pricing_slot} • {selectedCountry?.name}
                  </p>
                </div>
                <button onClick={() => setPriceCardModal(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mycoins Amount
                  </label>
                  <input
                    type="number"
                    value={priceCardValue}
                    onChange={(e) => setPriceCardValue(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Current: {priceCardModal.currentPrice > 0 ? `🪙${priceCardModal.currentPrice}` : 'Not set'}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setPriceCardModal(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePriceCardUpdate}
                    disabled={loading || !priceCardValue}
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
    </div>
  );
};
