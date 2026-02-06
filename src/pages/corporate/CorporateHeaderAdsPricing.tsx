import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';

const FLAG_ICON_BASE_URL = BACKEND_URL;

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
  A: {
    header_ads: MasterPriceData | null;
    popup_ads: MasterPriceData | null;
    middle_ads: MasterPriceData | null;
    chat_ads: MasterPriceData | null;
  };
  B: {
    header_ads: MasterPriceData | null;
    popup_ads: MasterPriceData | null;
    middle_ads: MasterPriceData | null;
    chat_ads: MasterPriceData | null;
  };
  C: {
    header_ads: MasterPriceData | null;
    popup_ads: MasterPriceData | null;
    middle_ads: MasterPriceData | null;
    chat_ads: MasterPriceData | null;
  };
  D: {
    header_ads: MasterPriceData | null;
    popup_ads: MasterPriceData | null;
    middle_ads: MasterPriceData | null;
    chat_ads: MasterPriceData | null;
  };
}

interface PriceCardEditModal {
  pricing_slot: 'A' | 'B' | 'C' | 'D';
  ads_type: 'header_ads' | 'popup_ads' | 'middle_ads' | 'chat_ads';
  currentPrice: number;
}

export const CorporateHeaderAdsPricing: React.FC = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate>({ rate: 0, loading: false, error: '' });
  const [activeTab, setActiveTab] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [loading, setLoading] = useState(false);
  const [pricingData, setPricingData] = useState<{[key: string]: PricingSlave[]}>({});
  const [apps, setApps] = useState<App[]>([]);
  const [appCategories, setAppCategories] = useState<{[appId: number]: Category[]}>({});
  const [cellEditModal, setCellEditModal] = useState<CellEditModal | null>(null);
  const [cellPrice, setCellPrice] = useState('');
  const [filterAppId, setFilterAppId] = useState<number | 'all'>('all');
  const [filterCategoryId, setFilterCategoryId] = useState<number | 'all'>('all');

  // Master pricing for all ads types
  const [masterPricing, setMasterPricing] = useState<MasterPricing>({
    A: { header_ads: null, popup_ads: null, middle_ads: null, chat_ads: null },
    B: { header_ads: null, popup_ads: null, middle_ads: null, chat_ads: null },
    C: { header_ads: null, popup_ads: null, middle_ads: null, chat_ads: null },
    D: { header_ads: null, popup_ads: null, middle_ads: null, chat_ads: null }
  });

  // Price card edit modal
  const [priceCardModal, setPriceCardModal] = useState<PriceCardEditModal | null>(null);
  const [priceCardValue, setPriceCardValue] = useState('');

  const tableScrollRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);

  const syncScrollFromMain = useCallback(() => {
    if (isSyncingScroll.current) return;
    isSyncingScroll.current = true;
    if (tableScrollRef.current && topScrollRef.current) {
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    }
    requestAnimationFrame(() => { isSyncingScroll.current = false; });
  }, []);

  const syncScrollFromTop = useCallback(() => {
    if (isSyncingScroll.current) return;
    isSyncingScroll.current = true;
    if (tableScrollRef.current && topScrollRef.current) {
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
    requestAnimationFrame(() => { isSyncingScroll.current = false; });
  }, []);

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

  // Close country dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setCountryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchExchangeRate = async () => {
    if (!selectedCountry) return;

    // Skip fetching if the country currency is INR (1:1 conversion)
    if (selectedCountry.currency_code === 'INR') {
      setExchangeRate({ rate: 1, loading: false, error: '' });
      return;
    }

    setExchangeRate({ rate: 0, loading: true, error: '' });

    try {
      // Fetch exchange rate from backend proxy endpoint
      // This avoids CSP violations by routing through our backend
      const response = await axios.get(`${API_BASE_URL}/geo/exchange-rates`, {
        params: {
          baseCurrency: 'INR'
        },
        timeout: 10000 // 10 second timeout
      });
      
      if (response.data.success && response.data.data && response.data.data.rates && response.data.data.rates[selectedCountry.currency_code]) {
        const rate = response.data.data.rates[selectedCountry.currency_code];
        setExchangeRate({ rate: rate, loading: false, error: '' });
      } else {
        setExchangeRate({ rate: 0, loading: false, error: 'Exchange rate not available for this currency' });
      }
    } catch (error: any) {
      console.error('Error fetching exchange rate:', error);
      const errorMessage = error.response?.data?.message 
        ? error.response.data.message
        : error.response 
        ? 'Failed to fetch exchange rate from service' 
        : error.code === 'ECONNABORTED' 
        ? 'Request timed out. Please try again.' 
        : 'Failed to fetch exchange rate. Please check your internet connection.';
      setExchangeRate({ rate: 0, loading: false, error: errorMessage });
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
      today.setHours(0, 0, 0, 0);
      const startDateStr = formatDateString(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Calculate end date: exactly 3 months from today
      const endDate = new Date(today);
      endDate.setMonth(endDate.getMonth() + 3);
      endDate.setDate(endDate.getDate() - 1); // Subtract 1 day to get exactly 3 months (not 3 months + 1 day)
      endDate.setHours(0, 0, 0, 0);
      const endDateStr = formatDateString(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

      const res = await axios.get(`${API_BASE_URL}/header-ads-pricing/slave`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          country_id: selectedCountry.id,
          pricing_slot: activeTab,
          start_date: startDateStr,
          end_date: endDateStr
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
    pricing_slot: 'A' | 'B' | 'C' | 'D',
    ads_type: 'header_ads' | 'popup_ads' | 'middle_ads' | 'chat_ads'
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
      case 'chat_ads': return 'Chat Ads';
      default: return ads_type;
    }
  };

  // Helper to format date as YYYY-MM-DD without timezone issues
  const formatDateString = (year: number, month: number, day: number): string => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Today in local YYYY-MM-DD for disabling cell and comparisons
  const getTodayDateString = (): string => {
    const t = new Date();
    return formatDateString(t.getFullYear(), t.getMonth(), t.getDate());
  };

  const getMonthGroups = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate end date: exactly 3 months from today
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 3);
    endDate.setDate(endDate.getDate() - 1); // Subtract 1 day to get exactly 3 months (not 3 months + 1 day)
    endDate.setHours(0, 0, 0, 0);

    // Generate all dates from today to endDate (inclusive)
    const allDates: { date: string; day: number; month: number; year: number }[] = [];
    const currentDate = new Date(today);
    
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const day = currentDate.getDate();
      const dateStr = formatDateString(year, month, day);
      allDates.push({
        date: dateStr,
        day,
        month,
        year
      });
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(0, 0, 0, 0);
    }

    // Group dates by month
    const monthMap = new Map<string, { month: string; year: number; dates: { date: string; day: number }[] }>();
    
    allDates.forEach(dayInfo => {
      const monthKey = `${dayInfo.year}-${String(dayInfo.month).padStart(2, '0')}`;
      
      if (!monthMap.has(monthKey)) {
        const monthName = new Date(dayInfo.year, dayInfo.month, 1).toLocaleDateString('en-US', { month: 'short' });
        monthMap.set(monthKey, {
          month: monthName,
          year: dayInfo.year,
          dates: []
        });
      }
      
      monthMap.get(monthKey)!.dates.push({
        date: dayInfo.date,
        day: dayInfo.day
      });
    });

    // Ensure we have all months in the range, even if they're empty
    // This ensures all month headers display correctly
    const startMonth = today.getMonth();
    const startYear = today.getFullYear();
    const endMonth = endDate.getMonth();
    const endYear = endDate.getFullYear();
    
    // Get all months that should be displayed
    const allMonths: { month: string; year: number; dates: { date: string; day: number }[] }[] = [];
    let currentMonthDate = new Date(startYear, startMonth, 1);
    currentMonthDate.setHours(0, 0, 0, 0);
    const lastMonthDate = new Date(endYear, endMonth, 1);
    lastMonthDate.setHours(0, 0, 0, 0);
    
    while (currentMonthDate <= lastMonthDate) {
      const monthKey = `${currentMonthDate.getFullYear()}-${String(currentMonthDate.getMonth()).padStart(2, '0')}`;
      const monthName = currentMonthDate.toLocaleDateString('en-US', { month: 'short' });
      
      if (monthMap.has(monthKey)) {
        allMonths.push(monthMap.get(monthKey)!);
      } else {
        // Add empty month to ensure header displays
        allMonths.push({
          month: monthName,
          year: currentMonthDate.getFullYear(),
          dates: []
        });
      }
      
      currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
    }

    return allMonths;
  };

  const getPriceForDate = (appId: number, categoryId: number, date: string): number | null => {
    const key = `${appId}-${categoryId}`;
    const prices = pricingData[key];
    if (!prices) return null;
    const found = prices.find(p => p.selected_date === date);
    return found ? found.my_coins : null;
  };

  // Filtered apps and categories for table
  const filteredApps = filterAppId === 'all' ? apps : apps.filter((a) => a.id === filterAppId);
  const getCategoriesForApp = (appId: number) => {
    const cats = appCategories[appId] || [];
    return filterCategoryId === 'all' ? cats : cats.filter((c) => c.id === filterCategoryId);
  };

  const monthGroups = getMonthGroups();
  const totalDateCols = monthGroups.reduce((sum, g) => sum + Math.max(g.dates.length, 1), 0);
  const tableMinWidthPx = 200 + 52 * totalDateCols;

  const getFlagUrl = (country: Country) => {
    if (!country?.flag_icon) return '';
    return country.flag_icon.startsWith('http')
      ? country.flag_icon
      : `${FLAG_ICON_BASE_URL}/${country.flag_icon.replace(/^\//, '')}`;
  };

  // Render price card
  const renderPriceCard = (
    pricing_slot: 'A' | 'B' | 'C' | 'D',
    ads_type: 'header_ads' | 'popup_ads' | 'middle_ads' | 'chat_ads',
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
          <div ref={countryDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
              className="flex items-center gap-2 bg-indigo-600 rounded-lg px-3 py-2 text-white hover:bg-indigo-500 transition-colors min-w-[200px]"
            >
              {selectedCountry ? (
                <>
                  {selectedCountry.flag_icon ? (
                    <img
                      src={getFlagUrl(selectedCountry)}
                      alt=""
                      className="w-6 h-4 object-cover rounded"
                    />
                  ) : (
                    <span className="text-xl opacity-80" aria-hidden>🏳️</span>
                  )}
                  <span className="flex-1 text-left">
                    {selectedCountry.name} - {selectedCountry.currency_code}
                  </span>
                </>
              ) : (
                <span className="flex-1 text-left">Select country</span>
              )}
              <ChevronDown
                size={18}
                className={`transition-transform ${countryDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {countryDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-1 z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 max-h-[280px] overflow-y-auto min-w-[200px]"
                >
                  {countries.map((country) => (
                    <button
                      key={country.id}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(country);
                        setCountryDropdownOpen(false);
                      }}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-indigo-50 transition-colors ${
                        selectedCountry?.id === country.id ? 'bg-indigo-100 text-indigo-800' : 'text-gray-900'
                      }`}
                    >
                      {country.flag_icon ? (
                        <img
                          src={getFlagUrl(country)}
                          alt=""
                          className="w-6 h-4 object-cover rounded flex-shrink-0"
                        />
                      ) : (
                        <span className="w-6 h-4 flex items-center justify-center text-lg">🏳️</span>
                      )}
                      <span>
                        {country.name} - {country.currency_code}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Currency Display */}
          <div className="flex items-center gap-2 text-white">
            {!selectedCountry ? (
              <span className="text-white/70">Select a country</span>
            ) : exchangeRate.loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={18} />
                <span className="text-white/70">Loading exchange rate...</span>
              </div>
            ) : exchangeRate.error ? (
              <div className="flex items-center gap-2">
                <span className="text-red-300 text-sm">{exchangeRate.error}</span>
                <button
                  onClick={fetchExchangeRate}
                  className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
                  title="Retry"
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                <span className="bg-indigo-600 px-3 py-2 rounded-lg">1 {selectedCountry.currency_code}</span>
                <span>=</span>
                <span className="bg-indigo-600 px-3 py-2 rounded-lg">
                  {exchangeRate.rate > 0 && selectedCountry.currency_code !== 'INR'
                    ? (1 / exchangeRate.rate).toFixed(2)
                    : '1.00'}
                </span>
                <span className="font-semibold">MyCoins</span>
              </>
            )}
          </div>
        </div>

        {/* Row 2: Adding prices to Grade A */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-white font-semibold min-w-[200px]">Adding Prices to Grade A</span>
          <div className="flex flex-wrap gap-3">
            {renderPriceCard('A', 'header_ads', 'bg-cyan-500')}
            {renderPriceCard('A', 'popup_ads', 'bg-cyan-500')}
            {renderPriceCard('A', 'middle_ads', 'bg-cyan-500')}
            {renderPriceCard('A', 'chat_ads', 'bg-cyan-500')}
          </div>
        </div>

        {/* Row 3: Adding prices to Grade B */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-white font-semibold min-w-[200px]">Adding Prices to Grade B</span>
          <div className="flex flex-wrap gap-3">
            {renderPriceCard('B', 'header_ads', 'bg-cyan-500')}
            {renderPriceCard('B', 'popup_ads', 'bg-cyan-500')}
            {renderPriceCard('B', 'middle_ads', 'bg-cyan-500')}
            {renderPriceCard('B', 'chat_ads', 'bg-cyan-500')}
          </div>
        </div>

        {/* Row 4: Adding prices to Grade C */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-white font-semibold min-w-[200px]">Adding Prices to Grade C</span>
          <div className="flex flex-wrap gap-3">
            {renderPriceCard('C', 'header_ads', 'bg-cyan-500')}
            {renderPriceCard('C', 'popup_ads', 'bg-cyan-500')}
            {renderPriceCard('C', 'middle_ads', 'bg-cyan-500')}
            {renderPriceCard('C', 'chat_ads', 'bg-cyan-500')}
          </div>
        </div>

        {/* Row 5: Adding prices to Grade D */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-white font-semibold min-w-[200px]">Adding Prices to Grade D</span>
          <div className="flex flex-wrap gap-3">
            {renderPriceCard('D', 'header_ads', 'bg-cyan-500')}
            {renderPriceCard('D', 'popup_ads', 'bg-cyan-500')}
            {renderPriceCard('D', 'middle_ads', 'bg-cyan-500')}
            {renderPriceCard('D', 'chat_ads', 'bg-cyan-500')}
          </div>
        </div>
      </div>

      {/* Filters: App & Category (shown when country selected) */}
      {selectedCountry && (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <span className="text-sm font-medium text-gray-700">Filters:</span>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">App</label>
            <select
              value={filterAppId === 'all' ? 'all' : filterAppId}
              onChange={(e) => {
                const v = e.target.value;
                setFilterAppId(v === 'all' ? 'all' : parseInt(v, 10));
                setFilterCategoryId('all');
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
            >
              <option value="all">All Apps</option>
              {apps.map((app) => (
                <option key={app.id} value={app.id}>{app.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Category</label>
            <select
              value={filterCategoryId === 'all' ? 'all' : filterCategoryId}
              onChange={(e) => {
                const v = e.target.value;
                setFilterCategoryId(v === 'all' ? 'all' : parseInt(v, 10));
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
              disabled={filterAppId === 'all'}
            >
              <option value="all">All Categories</option>
              {filterAppId !== 'all' && (appCategories[filterAppId] || []).map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.category_name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('A')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'A'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Grade A
        </button>
        <button
          onClick={() => setActiveTab('B')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'B'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Grade B
        </button>
        <button
          onClick={() => setActiveTab('C')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'C'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Grade C
        </button>
        <button
          onClick={() => setActiveTab('D')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'D'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Grade D
        </button>
      </div>

      {/* Pricing Table with top + bottom scrollbars, sticky first column */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Top horizontal scrollbar (synced with main) */}
        <div
          ref={topScrollRef}
          onScroll={syncScrollFromTop}
          className="overflow-x-auto overflow-y-hidden border-b border-gray-200"
          style={{ maxHeight: '16px' }}
        >
          <div style={{ minWidth: tableMinWidthPx, height: 1 }} />
        </div>
        {/* Main scroll area: vertical + horizontal */}
        <div
          ref={tableScrollRef}
          onScroll={syncScrollFromMain}
          className="overflow-auto"
          style={{ maxHeight: '600px' }}
        >
          <table className="w-full border-collapse" style={{ minWidth: tableMinWidthPx }}>
            <thead className="sticky top-0 z-20 bg-white">
              <tr>
                <th rowSpan={2} className="sticky left-0 z-30 bg-blue-600 border border-gray-300 px-4 py-2 text-sm font-bold text-white min-w-[180px] shadow-[2px_0_4px_rgba(0,0,0,0.08)]">
                  Category
                </th>
                {monthGroups.map((group, idx) => {
                const colors = ['bg-blue-600', 'bg-indigo-600', 'bg-purple-600', 'bg-pink-600', 'bg-yellow-600', 'bg-green-600', 'bg-red-600'];
                const colorIndex = idx % colors.length;
                const headerText = `${group.month} ${group.year}`;
                const colSpan = group.dates.length > 0 ? group.dates.length : 1;
                return (
                  <th key={`${group.month}-${group.year}-${idx}`} colSpan={colSpan} className={`border border-gray-300 px-2 py-2 text-sm font-bold text-white ${colors[colorIndex]}`}>
                    {headerText}
                  </th>
                );
              })}
            </tr>
            <tr>
              {monthGroups.map((group, idx) => {
                const colors = ['bg-blue-600', 'bg-indigo-600', 'bg-purple-600', 'bg-pink-600', 'bg-yellow-600', 'bg-green-600', 'bg-red-600'];
                const colorIndex = idx % colors.length;
                if (group.dates.length === 0) {
                  return (
                    <th key={`empty-${group.month}-${group.year}-${idx}`} className={`border border-gray-300 px-2 py-2 text-xs font-semibold text-white min-w-[52px] ${colors[colorIndex]}`}>
                      &nbsp;
                    </th>
                  );
                }
                return group.dates.map((dayInfo) => {
                  const dayName = new Date(dayInfo.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
                  return (
                    <th key={dayInfo.date} className={`border border-gray-300 px-2 py-2 text-xs font-semibold text-white min-w-[52px] ${colors[colorIndex]}`}>
                      <div>{dayName}</div>
                      <div>{dayInfo.day}</div>
                    </th>
                  );
                });
              })}
            </tr>
          </thead>
          <tbody>
            {filteredApps.map((app) => {
              const categories = getCategoriesForApp(app.id);
              return (
                <React.Fragment key={app.id}>
                  <tr>
                    <td className="sticky left-0 z-10 bg-blue-500 border border-gray-300 px-4 py-2 font-bold text-white shadow-[2px_0_4px_rgba(0,0,0,0.08)]">
                      {app.name}
                    </td>
                    <td colSpan={totalDateCols} className="bg-blue-500 border border-gray-300" />
                  </tr>
                  {categories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="sticky left-0 z-10 bg-blue-100 border border-gray-300 px-4 py-2 font-medium text-gray-900 shadow-[2px_0_4px_rgba(0,0,0,0.08)]">
                        {category.category_name}
                      </td>
                      {monthGroups.map((group, groupIdx) => {
                        if (group.dates.length === 0) {
                          // Empty month - add placeholder cell to match header colSpan
                          return (
                            <td
                              key={`empty-${group.month}-${group.year}-${groupIdx}`}
                              className="border border-gray-300 px-2 py-2 text-center text-xs bg-gray-50"
                            >
                              &nbsp;
                            </td>
                          );
                        }
                        return group.dates.map((dayInfo) => {
                          const price = getPriceForDate(app.id, category.id, dayInfo.date);
                          const isToday = dayInfo.date === getTodayDateString();
                          return (
                            <td 
                              key={dayInfo.date} 
                              onClick={() => !isToday && handleCellClick(app.id, category.id, dayInfo.date)}
                              className={`border border-gray-300 px-2 py-2 text-center text-xs transition-colors ${
                                isToday
                                  ? 'bg-gray-200 cursor-not-allowed opacity-75'
                                  : 'bg-green-50 cursor-pointer hover:bg-green-100'
                              }`}
                            >
                              {price !== null ? (
                                <div className="font-semibold text-gray-900">🪙{price}</div>
                              ) : (
                                <div className="text-gray-400">-</div>
                              )}
                            </td>
                          );
                        });
                      }).flat()}
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
          </table>
        </div>
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
                  <p className="text-sm text-gray-600 mt-1">{new Date(cellEditModal.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
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
