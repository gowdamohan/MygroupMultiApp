import React, { useState, useEffect } from 'react';
import { Calendar, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import axios from 'axios';
import { API_BASE_URL, getUploadUrl} from '../../config/api.config';

interface Country {
  id: number;
  name: string;
  currency_code: string;
  currency_symbol: string;
  flag_icon?: string | null;
}

interface App {
  id: number;
  name: string;
}

interface Category {
  id: number;
  category_name: string;
}

interface SlavePricing {
  id: number;
  app_id: number;
  category_id: number;
  selected_date: string;
  my_coins: number;
  app?: { id: number; name: string };
  category?: { id: number; category_name: string };
}

interface PricingData {
  master_price: number;
  slaves: SlavePricing[];
}

interface PriceDialogData {
  date: string;
  currentPrice: number;
  isMaster: boolean;
}

interface MasterPricing {
  id: number;
  pricing_slot: 'A' | 'B' | 'C' | 'D';
  ads_type: 'header_ads' | 'popup_ads' | 'middle_ads' | 'chat_ads';
  my_coins: number;
  country_id: number;
}

interface MasterPriceDialogData {
  ads_type: 'header_ads' | 'popup_ads' | 'middle_ads' | 'chat_ads';
  pricing_slot: 'A' | 'B' | 'C' | 'D';
  currentPrice: number;
}

export const HeaderAdsPricing: React.FC = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [pricingData, setPricingData] = useState<PricingData>({ master_price: 0, slaves: [] });
  const [masterPricing, setMasterPricing] = useState<MasterPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [priceDialogData, setPriceDialogData] = useState<PriceDialogData | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [showMasterPriceDialog, setShowMasterPriceDialog] = useState(false);
  const [masterPriceDialogData, setMasterPriceDialogData] = useState<MasterPriceDialogData | null>(null);
  const [newMasterPrice, setNewMasterPrice] = useState('');
  const [flagImageError, setFlagImageError] = useState(false);

  useEffect(() => {
    fetchCountries();
    fetchApps();
  }, []);

  useEffect(() => {
    if (selectedCountryId) {
      fetchMasterPricing();
    }
  }, [selectedCountryId]);

  useEffect(() => {
    if (selectedAppId) {
      fetchCategories(selectedAppId);
    } else {
      setCategories([]);
      setSelectedCategoryId('');
    }
  }, [selectedAppId]);

  useEffect(() => {
    if (selectedCountryId && selectedAppId && selectedCategoryId) {
      fetchPricing();
    }
  }, [selectedCountryId, selectedSlot, selectedAppId, selectedCategoryId, currentMonth]);

  useEffect(() => {
    setFlagImageError(false);
  }, [selectedCountryId]);

  const fetchCountries = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/header-ads-pricing/countries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCountries(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching countries:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApps = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/header-ads/my-apps`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setApps(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching apps:', err);
    }
  };

  const fetchCategories = async (appId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/header-ads/categories/${appId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchMasterPricing = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/header-ads-pricing/master`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { country_id: selectedCountryId }
      });
      if (response.data.success) {
        setMasterPricing(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching master pricing:', err);
    }
  };

  const fetchPricing = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 3, 0);

      const response = await axios.get(`${API_BASE_URL}/header-ads-pricing/slave`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          country_id: selectedCountryId,
          pricing_slot: selectedSlot,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        }
      });
      if (response.data.success) {
        setPricingData(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching pricing:', err);
    }
  };

  const handleMasterPriceCardClick = (ads_type: 'header_ads' | 'popup_ads' | 'middle_ads' | 'chat_ads', pricing_slot: 'A' | 'B' | 'C' | 'D') => {
    const existing = masterPricing.find(m => m.ads_type === ads_type && m.pricing_slot === pricing_slot);
    setMasterPriceDialogData({
      ads_type,
      pricing_slot,
      currentPrice: existing?.my_coins || 0
    });
    setNewMasterPrice(existing?.my_coins?.toString() || '0');
    setShowMasterPriceDialog(true);
  };

  const handleMasterPriceUpdate = async () => {
    if (!masterPriceDialogData || !newMasterPrice || !selectedCountryId) {
      setError('Please enter a valid price');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${API_BASE_URL}/header-ads-pricing/master`, {
        country_id: parseInt(selectedCountryId),
        pricing_slot: masterPriceDialogData.pricing_slot,
        ads_type: masterPriceDialogData.ads_type,
        my_coins: parseFloat(newMasterPrice)
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Master price updated successfully');
      setShowMasterPriceDialog(false);
      fetchMasterPricing();
      if (selectedAppId && selectedCategoryId) {
        fetchPricing();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update master price');
    } finally {
      setSaving(false);
    }
  };

  const handleCellClick = (date: Date) => {
    const dateStr = formatDate(date);
    const slavePricing = pricingData.slaves.find(s => s.selected_date === dateStr);
    setPriceDialogData({
      date: dateStr,
      currentPrice: slavePricing?.my_coins || pricingData.master_price,
      isMaster: !slavePricing
    });
    setNewPrice(slavePricing?.my_coins?.toString() || pricingData.master_price.toString());
    setShowPriceDialog(true);
  };

  const handleSlavePriceUpdate = async () => {
    if (!priceDialogData || !newPrice) return;
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${API_BASE_URL}/header-ads-pricing/slave`, {
        app_id: parseInt(selectedAppId),
        category_id: parseInt(selectedCategoryId),
        selected_date: priceDialogData.date,
        my_coins: parseFloat(newPrice),
        country_id: parseInt(selectedCountryId),
        pricing_slot: selectedSlot
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Price updated successfully');
      setShowPriceDialog(false);
      fetchPricing();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update price');
    } finally {
      setSaving(false);
    }
  };

  const getThreeMonths = () => {
    const months = [];
    for (let i = 0; i < 3; i++) {
      months.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + i, 1));
    }
    return months;
  };

  const getDaysInMonth = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(new Date(0));
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  /** Resolve flag/icon URL: supports relative path, absolute path, or full URL (getUploadUrl handles all). */
  const getFlagImageUrl = (path?: string | null): string => {
    if (!path || typeof path !== 'string') return '';
    const trimmed = path.trim();
    return trimmed ? getUploadUrl(trimmed) : '';
  };

  /** Whether the value looks like an image path/URL (not an emoji or placeholder). */
  const isImagePath = (path?: string | null) => {
    if (!path || typeof path !== 'string') return false;
    const p = path.trim();
    return (
      p.startsWith('/') ||
      p.startsWith('http://') ||
      p.startsWith('https://') ||
      p.startsWith('data:') ||
      /\.(png|svg|jpe?g|gif|webp)(\?|$)/i.test(p) ||
      p.includes('uploads/')
    );
  };

  const renderImage = (path?: string | null, alt?: string) => {
    if (!path || !isImagePath(path)) {
      return <span className="text-gray-500">-</span>;
    }
    const src = getFlagImageUrl(path);
    if (!src) return <span className="text-gray-500">-</span>;
    return (
      <img
        src={src}
        alt={alt || 'asset'}
        className="h-8 w-8 rounded border border-gray-300 object-cover bg-gray-100"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  };

  /** Render country flag in "My Coins" section: uses flag_icon (PNG/SVG/URL), with fallback on error. */
  const renderCountryFlag = (country: Country | undefined) => {
    const fallback = (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded border border-white/30 bg-white/10 text-lg" title={country?.name}>
        🏳️
      </span>
    );
    if (!country) return fallback;
    if (flagImageError) return fallback;
    const path = country.flag_icon?.trim();
    if (!path || !isImagePath(path)) return fallback;
    const src = getFlagImageUrl(path);
    if (!src) return fallback;
    return (
      <img
        src={src}
        alt={`${country.name} flag`}
        className="h-8 w-8 rounded border border-white/30 object-contain bg-white/10 flex-shrink-0"
        onError={() => setFlagImageError(true)}
      />
    );
  };

  const getPriceForDate = (date: Date): number => {
    const dateStr = formatDate(date);
    const slavePricing = pricingData.slaves.find(s => {
      const slaveDate = s.selected_date.split('T')[0];
      return slaveDate === dateStr;
    });
    return slavePricing?.my_coins || pricingData.master_price;
  };

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getMasterPrice = (ads_type: 'header_ads' | 'popup_ads' | 'middle_ads' | 'chat_ads', pricing_slot: 'A' | 'B' | 'C' | 'D') => {
    const master = masterPricing.find(m => m.ads_type === ads_type && m.pricing_slot === pricing_slot);
    return master?.my_coins || 0;
  };

  const prevMonths = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 3, 1));
  };

  const nextMonths = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 3, 1));
  };

  const selectedCountry = countries.find(c => c.id === parseInt(selectedCountryId));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Header Ads Pricing Management</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* My Coins Pricing Value Section */}
      <div className="bg-gradient-to-r from-teal-400 to-teal-500 rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4 text-white">
          <div className="bg-white/20 rounded px-4 py-2 text-center">
            <div className="text-sm font-medium">My Coins pricing value</div>
          </div>
          <div className="bg-purple-600 rounded px-4 py-2 flex items-center justify-between gap-3">
            <span className="flex items-center flex-shrink-0">
              {renderCountryFlag(selectedCountry)}
            </span>
            <select
              value={selectedCountryId}
              onChange={(e) => setSelectedCountryId(e.target.value)}
              className="bg-transparent border-none text-white font-medium focus:outline-none"
            >
              <option value="">Select Country</option>
              {countries.map(c => (
                <option key={c.id} value={c.id} className="text-gray-900">
                  {c.name} - {c.currency_code}
                </option>
              ))}
            </select>
            <span className="text-sm">💰</span>
          </div>
          <div className="bg-purple-600 rounded px-4 py-2 flex items-center justify-center gap-2">
            <span className="text-lg font-bold">1 {selectedCountry?.currency_code || 'USD'}</span>
            <span className="text-sm">=</span>
            <span className="text-lg font-bold">1</span>
            <span className="text-sm">MyCoins</span>
          </div>
        </div>
      </div>

      {selectedCountryId && (
        <>
          {/* Grade A Pricing Section */}
          <div className="space-y-2">
            <div className="bg-gradient-to-r from-red-400 to-red-500 rounded-lg p-3">
              <div className="text-white text-center font-medium">Adding prices to Grade A</div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-3">
              <div className="grid grid-cols-4 gap-4 text-white text-sm">
                <div className="bg-blue-700 rounded px-4 py-2 text-center font-medium cursor-pointer hover:bg-blue-800 transition-colors" onClick={() => handleMasterPriceCardClick('header_ads', 'A')}>
                  Header Ads : {getMasterPrice('header_ads', 'A')} Mycoins
                </div>
                <div className="bg-blue-700 rounded px-4 py-2 text-center font-medium cursor-pointer hover:bg-blue-800 transition-colors" onClick={() => handleMasterPriceCardClick('popup_ads', 'A')}>
                  Popup Ads : {getMasterPrice('popup_ads', 'A')} Mycoins
                </div>
                <div className="bg-blue-700 rounded px-4 py-2 text-center font-medium cursor-pointer hover:bg-blue-800 transition-colors" onClick={() => handleMasterPriceCardClick('middle_ads', 'A')}>
                  Middle Ads : {getMasterPrice('middle_ads', 'A')} Mycoins
                </div>
                <div className="bg-blue-700 rounded px-4 py-2 text-center font-medium cursor-pointer hover:bg-blue-800 transition-colors" onClick={() => handleMasterPriceCardClick('chat_ads', 'A')}>
                  Chat Ads : {getMasterPrice('chat_ads', 'A')} Mycoins
                </div>
              </div>
            </div>
          </div>

          {/* Grade B Pricing Section */}
          <div className="space-y-2">
            <div className="bg-gradient-to-r from-red-400 to-red-500 rounded-lg p-3">
              <div className="text-white text-center font-medium">Adding prices to Grade B</div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-3">
              <div className="grid grid-cols-4 gap-4 text-white text-sm">
                <div className="bg-purple-700 rounded px-4 py-2 text-center font-medium cursor-pointer hover:bg-purple-800 transition-colors" onClick={() => handleMasterPriceCardClick('header_ads', 'B')}>
                  Header Ads : {getMasterPrice('header_ads', 'B')} Mycoins
                </div>
                <div className="bg-purple-700 rounded px-4 py-2 text-center font-medium cursor-pointer hover:bg-purple-800 transition-colors" onClick={() => handleMasterPriceCardClick('popup_ads', 'B')}>
                  Popup Ads : {getMasterPrice('popup_ads', 'B')} Mycoins
                </div>
                <div className="bg-purple-700 rounded px-4 py-2 text-center font-medium cursor-pointer hover:bg-purple-800 transition-colors" onClick={() => handleMasterPriceCardClick('middle_ads', 'B')}>
                  Middle Ads : {getMasterPrice('middle_ads', 'B')} Mycoins
                </div>
                <div className="bg-purple-700 rounded px-4 py-2 text-center font-medium cursor-pointer hover:bg-purple-800 transition-colors" onClick={() => handleMasterPriceCardClick('chat_ads', 'B')}>
                  Chat Ads : {getMasterPrice('chat_ads', 'B')} Mycoins
                </div>
              </div>
            </div>
          </div>

          {/* Grade C Pricing Section */}
          <div className="space-y-2">
            <div className="bg-gradient-to-r from-red-400 to-red-500 rounded-lg p-3">
              <div className="text-white text-center font-medium">Adding prices to Grade C</div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-3">
              <div className="grid grid-cols-4 gap-4 text-white text-sm">
                <div className="bg-green-700 rounded px-4 py-2 text-center font-medium cursor-pointer hover:bg-green-800 transition-colors" onClick={() => handleMasterPriceCardClick('header_ads', 'C')}>
                  Header Ads : {getMasterPrice('header_ads', 'C')} Mycoins
                </div>
                <div className="bg-green-700 rounded px-4 py-2 text-center font-medium cursor-pointer hover:bg-green-800 transition-colors" onClick={() => handleMasterPriceCardClick('popup_ads', 'C')}>
                  Popup Ads : {getMasterPrice('popup_ads', 'C')} Mycoins
                </div>
                <div className="bg-green-700 rounded px-4 py-2 text-center font-medium cursor-pointer hover:bg-green-800 transition-colors" onClick={() => handleMasterPriceCardClick('middle_ads', 'C')}>
                  Middle Ads : {getMasterPrice('middle_ads', 'C')} Mycoins
                </div>
                <div className="bg-green-700 rounded px-4 py-2 text-center font-medium cursor-pointer hover:bg-green-800 transition-colors" onClick={() => handleMasterPriceCardClick('chat_ads', 'C')}>
                  Chat Ads : {getMasterPrice('chat_ads', 'C')} Mycoins
                </div>
              </div>
            </div>
          </div>

          {/* Grade D Pricing Section */}
          <div className="space-y-2">
            <div className="bg-gradient-to-r from-red-400 to-red-500 rounded-lg p-3">
              <div className="text-white text-center font-medium">Adding prices to Grade D</div>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-3">
              <div className="grid grid-cols-4 gap-4 text-white text-sm">
                <div className="bg-orange-700 rounded px-4 py-2 text-center font-medium cursor-pointer hover:bg-orange-800 transition-colors" onClick={() => handleMasterPriceCardClick('header_ads', 'D')}>
                  Header Ads : {getMasterPrice('header_ads', 'D')} Mycoins
                </div>
                <div className="bg-orange-700 rounded px-4 py-2 text-center font-medium cursor-pointer hover:bg-orange-800 transition-colors" onClick={() => handleMasterPriceCardClick('popup_ads', 'D')}>
                  Popup Ads : {getMasterPrice('popup_ads', 'D')} Mycoins
                </div>
                <div className="bg-orange-700 rounded px-4 py-2 text-center font-medium cursor-pointer hover:bg-orange-800 transition-colors" onClick={() => handleMasterPriceCardClick('middle_ads', 'D')}>
                  Middle Ads : {getMasterPrice('middle_ads', 'D')} Mycoins
                </div>
                <div className="bg-orange-700 rounded px-4 py-2 text-center font-medium cursor-pointer hover:bg-orange-800 transition-colors" onClick={() => handleMasterPriceCardClick('chat_ads', 'D')}>
                  Chat Ads : {getMasterPrice('chat_ads', 'D')} Mycoins
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Table Filters */}
      {selectedCountryId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Individual Date Pricing (Header Ads)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pricing Slot</label>
              <select
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value as 'A' | 'B' | 'C' | 'D')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
                <option value="D">Grade D</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">App</label>
              <select
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select App</option>
                {apps.map(app => (
                  <option key={app.id} value={app.id}>{app.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!selectedAppId}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {selectedCountryId && selectedAppId && selectedCategoryId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonths} className="p-2 hover:bg-gray-100 rounded-lg flex items-center gap-1">
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Previous</span>
            </button>
            <h3 className="text-lg font-semibold">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - {
                new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              }
            </h3>
            <button onClick={nextMonths} className="p-2 hover:bg-gray-100 rounded-lg flex items-center gap-1">
              <span className="text-sm">Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <div className="inline-flex gap-6 min-w-full">
            {getThreeMonths().map((monthDate, monthIdx) => (
              <div key={monthIdx} className="border border-gray-200 rounded-lg p-4 flex-shrink-0" style={{ width: '320px' }}>
                <h4 className="text-center font-semibold text-gray-800 mb-4 sticky top-0 bg-white z-10 py-2">
                  {monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h4>

                <div className="grid grid-cols-7 gap-1 mb-2 sticky top-12 bg-white z-10 pb-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-center text-xs font-medium text-gray-500 py-1">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth(monthDate).map((date, idx) => {
                    if (date.getTime() === 0) {
                      return <div key={idx} className="h-14 w-10"></div>;
                    }
                    const price = getPriceForDate(date);

                    return (
                      <motion.div
                        key={idx}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => handleCellClick(date)}
                        className="h-14 w-10 p-1 rounded-md border border-gray-200 cursor-pointer hover:border-blue-300 bg-white transition-all text-center flex flex-col items-center justify-center"
                      >
                        <div className="text-xs font-medium">{date.getDate()}</div>
                        <div className="text-[10px] text-green-600">
                          {selectedCountry?.currency_symbol || '₹'}{price}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>
      )}

      {/* Price Update Dialog */}
      {showPriceDialog && priceDialogData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">
              Update Price for {formatDisplayDate(priceDialogData.date)}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (MyCoins)
              </label>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter price"
              />
              <p className="text-xs text-gray-500 mt-1">
                Current: {priceDialogData.isMaster ? 'Master Price' : 'Custom Price'} - {priceDialogData.currentPrice} MyCoins
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSlavePriceUpdate}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setShowPriceDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Master Price Update Dialog */}
      {showMasterPriceDialog && masterPriceDialogData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">
              Update {masterPriceDialogData.ads_type.replace('_', ' ').toUpperCase()} Price for {masterPriceDialogData.pricing_slot}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (MyCoins)
              </label>
              <input
                type="number"
                value={newMasterPrice}
                onChange={(e) => setNewMasterPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter price"
              />
              <p className="text-xs text-gray-500 mt-1">
                Current Price: {masterPriceDialogData.currentPrice} MyCoins
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleMasterPriceUpdate}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setShowMasterPriceDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
