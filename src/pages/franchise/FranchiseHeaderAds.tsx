import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Save, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';

interface App {
  id: number;
  name: string;
}

interface Category {
  id: number;
  category_name: string;
}

interface PricingData {
  date: string;
  price: number;
  base_price?: number;
  multiplier?: number;
  is_booked: boolean;
}

interface SelectedSlot {
  appId: number;
  categoryId: number;
  dates: string[];
  file: File | null;
  url: string;
  preview: string;
}

interface HierarchyItem {
  level: string;
  name: string;
  count: number;
  total: number;
  logic: string;
}

interface FranchiseHeaderAdsProps {
  officeLevel?: 'head_office' | 'regional' | 'branch';
  adSlot?: 'ads1' | 'ads2';
}

export const FranchiseHeaderAds: React.FC<FranchiseHeaderAdsProps> = ({
  officeLevel = 'head_office',
  adSlot = 'ads1'
}) => {
  const [apps, setApps] = useState<App[]>([]);
  const [appCategories, setAppCategories] = useState<{[appId: number]: Category[]}>({});
  const [pricingData, setPricingData] = useState<{[key: string]: PricingData[]}>({});
  const [selectedSlots, setSelectedSlots] = useState<{[key: string]: SelectedSlot}>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showBookingModal, setShowBookingModal] = useState<{appId: number, categoryId: number} | null>(null);
  const [calendarStartMonth, setCalendarStartMonth] = useState(new Date());
  const [isFetchingCategories, setIsFetchingCategories] = useState(false);
  // Hierarchy pricing table data
  const [hierarchyPricing, setHierarchyPricing] = useState<HierarchyItem[]>([]);
  const [myCoins, setMyCoins] = useState<number>(0);
  const pricingFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasFetchedInitialPricing = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const topScrollRef = useRef<HTMLDivElement | null>(null);
  const topScrollContentRef = useRef<HTMLDivElement | null>(null);
  const isSyncingScrollRef = useRef(false);

  const syncScroll = useCallback((source: HTMLDivElement, target: HTMLDivElement) => {
    if (isSyncingScrollRef.current) return;
    isSyncingScrollRef.current = true;
    target.scrollLeft = source.scrollLeft;
    requestAnimationFrame(() => {
      isSyncingScrollRef.current = false;
    });
  }, []);

  const updateTopScrollWidth = useCallback(() => {
    const tableEl = tableScrollRef.current;
    const topContentEl = topScrollContentRef.current;
    if (!tableEl || !topContentEl) return;
    topContentEl.style.width = `${tableEl.scrollWidth}px`;
  }, []);

  // State for pricing multiplier info
  const [pricingMultiplier, setPricingMultiplier] = useState<number>(1);

  // Define fetchPricing first so it can be used in useEffects and useCallbacks
  const fetchPricing = useCallback(async (appId: number, categoryId: number, startDate: Date, endDate: Date, cancelPrevious: boolean = false) => {
    // Cancel previous request only if explicitly requested (e.g., for calendar modal)
    if (cancelPrevious && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const controller = new AbortController();
    if (cancelPrevious) {
      abortControllerRef.current = controller;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/header-ads/pricing`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          app_id: appId,
          category_id: categoryId,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          office_level: officeLevel
        },
        signal: controller.signal
      });

      // Store multiplier info from response
      if (response.data.multiplier) {
        setPricingMultiplier(response.data.multiplier);
      }
      
      if (response.data.success) {
        const key = `${appId}-${categoryId}`;
        setPricingData(prev => ({ ...prev, [key]: response.data.data }));
      }
    } catch (err: any) {
      // Don't log errors for aborted requests
      if (axios.isCancel(err) || err.name === 'AbortError') {
        return;
      }
      
      // Handle rate limit errors
      if (err.response?.status === 429) {
        const retryAfter = err.response?.headers['retry-after'] || 60;
        setError(`Too many requests. Please wait ${retryAfter} seconds before trying again.`);
        console.error('Rate limit exceeded:', err);
        return;
      }
      
      // Handle other errors
      if (err.response?.status >= 400 && err.response?.status < 500) {
        console.error('Error fetching pricing:', err.response?.data?.message || err.message);
      } else {
        console.error('Error fetching pricing:', err);
      }
    }
  }, []);

  const fetchPricingForAllCategories = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 3);
    endDate.setDate(endDate.getDate() - 1); // Exactly 3 months from today

    // Fetch pricing for all app-category combinations with a small delay between requests
    // to avoid overwhelming the server
    for (const app of apps) {
      const categories = appCategories[app.id] || [];
      for (const category of categories) {
        // Add a small delay between requests to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        await fetchPricing(app.id, category.id, startDate, endDate, false);
      }
    }
  }, [apps, appCategories, fetchPricing]);

  const fetchPricingForCalendar = useCallback(async (appId: number, categoryId: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 3);
    endDate.setDate(endDate.getDate() - 1); // Exactly 3 months from today
    // Cancel previous calendar pricing request when fetching new one
    await fetchPricing(appId, categoryId, startDate, endDate, true);
  }, [fetchPricing]);

  useEffect(() => {
    fetchApps();
    fetchHierarchyPricing();
    return () => {
      // Cleanup: cancel any pending requests on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (pricingFetchTimeoutRef.current) {
        clearTimeout(pricingFetchTimeoutRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [officeLevel, adSlot]);

  useEffect(() => {
    const tableEl = tableScrollRef.current;
    const topEl = topScrollRef.current;
    if (!tableEl || !topEl) return;

    const handleTableScroll = () => syncScroll(tableEl, topEl);
    const handleTopScroll = () => syncScroll(topEl, tableEl);

    tableEl.addEventListener('scroll', handleTableScroll, { passive: true });
    topEl.addEventListener('scroll', handleTopScroll, { passive: true });

    return () => {
      tableEl.removeEventListener('scroll', handleTableScroll);
      topEl.removeEventListener('scroll', handleTopScroll);
    };
  }, [syncScroll]);

  useEffect(() => {
    updateTopScrollWidth();
  }, [apps, appCategories, updateTopScrollWidth]);

  useEffect(() => {
    const handleResize = () => updateTopScrollWidth();
    window.addEventListener('resize', handleResize);
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && tableScrollRef.current) {
      resizeObserver = new ResizeObserver(() => updateTopScrollWidth());
      resizeObserver.observe(tableScrollRef.current);
    }
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver?.disconnect();
    };
  }, [updateTopScrollWidth]);

  // Only fetch pricing once all categories are loaded
  useEffect(() => {
    // Check if we have apps and all categories are loaded
    if (apps.length > 0 && !isFetchingCategories && !hasFetchedInitialPricing.current) {
      const allCategoriesLoaded = apps.every(app => appCategories[app.id] && appCategories[app.id].length > 0);
      
      if (allCategoriesLoaded) {
        // Debounce the pricing fetch to prevent rapid calls
        if (pricingFetchTimeoutRef.current) {
          clearTimeout(pricingFetchTimeoutRef.current);
        }
        
        pricingFetchTimeoutRef.current = setTimeout(() => {
          fetchPricingForAllCategories();
          hasFetchedInitialPricing.current = true;
        }, 300); // 300ms debounce
      }
    }

    return () => {
      if (pricingFetchTimeoutRef.current) {
        clearTimeout(pricingFetchTimeoutRef.current);
      }
    };
  }, [apps, appCategories, isFetchingCategories, fetchPricingForAllCategories]);

  // Debounced pricing fetch for calendar modal
  useEffect(() => {
    if (showBookingModal) {
      // Cancel any pending pricing fetch
      if (pricingFetchTimeoutRef.current) {
        clearTimeout(pricingFetchTimeoutRef.current);
      }
      
      // Debounce the calendar pricing fetch
      pricingFetchTimeoutRef.current = setTimeout(() => {
        fetchPricingForCalendar(showBookingModal.appId, showBookingModal.categoryId);
      }, 200);
    }

    return () => {
      if (pricingFetchTimeoutRef.current) {
        clearTimeout(pricingFetchTimeoutRef.current);
      }
    };
  }, [showBookingModal, calendarStartMonth, fetchPricingForCalendar]);

  const fetchApps = async () => {
    try {
      setIsFetchingCategories(true);
      hasFetchedInitialPricing.current = false;
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/header-ads/my-apps`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const appsData = response.data.data;
        setApps(appsData);
        
        // Fetch all categories in parallel
        await Promise.all(appsData.map(app => fetchCategories(app.id)));
      }
    } catch (err: any) {
      console.error('Error fetching apps:', err);
      setError('Failed to fetch apps');
    } finally {
      setIsFetchingCategories(false);
      setLoading(false);
    }
  };

  const fetchCategories = async (appId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/header-ads/categories/${appId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAppCategories(prev => ({ ...prev, [appId]: response.data.data }));
      }
    } catch (err: unknown) {
      console.error('Error fetching categories:', err);
    }
  };

  // Fetch location hierarchy pricing
  const fetchHierarchyPricing = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/header-ads-pricing/location-hierarchy`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { office_level: officeLevel }
      });
      if (response.data.success) {
        setHierarchyPricing(response.data.data.hierarchy || []);
        setMyCoins(response.data.data.my_coins || 0);
      }
    } catch (err: unknown) {
      console.error('Error fetching hierarchy pricing:', err);
    }
  };

  const formatDateString = (year: number, month: number, day: number): string => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getMonthGroups = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 3);
    endDate.setDate(endDate.getDate() - 1);
    endDate.setHours(0, 0, 0, 0);

    const allDates: { date: string; day: number; month: number; year: number }[] = [];
    const currentDate = new Date(today);
    
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const day = currentDate.getDate();
      const dateStr = formatDateString(year, month, day);
      allDates.push({ date: dateStr, day, month, year });
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(0, 0, 0, 0);
    }

    const monthMap = new Map<string, { month: string; year: number; dates: { date: string; day: number }[] }>();
    allDates.forEach(dayInfo => {
      const monthKey = `${dayInfo.year}-${String(dayInfo.month).padStart(2, '0')}`;
      if (!monthMap.has(monthKey)) {
        const monthName = new Date(dayInfo.year, dayInfo.month, 1).toLocaleDateString('en-US', { month: 'short' });
        monthMap.set(monthKey, { month: monthName, year: dayInfo.year, dates: [] });
      }
      monthMap.get(monthKey)!.dates.push({ date: dayInfo.date, day: dayInfo.day });
    });

    const startMonth = today.getMonth();
    const startYear = today.getFullYear();
    const endMonth = endDate.getMonth();
    const endYear = endDate.getFullYear();
    const allMonths: { month: string; year: number; dates: { date: string; day: number }[] }[] = [];
    let currentMonthDate = new Date(startYear, startMonth, 1);
    currentMonthDate.setHours(0, 0, 0, 0);
    const lastMonthDate = new Date(endYear, endMonth, 1);
    lastMonthDate.setHours(0, 0, 0, 0);
    
    while (currentMonthDate <= lastMonthDate) {
      const monthKey = `${currentMonthDate.getFullYear()}-${String(currentMonthDate.getMonth()).padStart(2, '0')}`;
      const monthName = currentMonthDate.toLocaleDateString('en-US', { month: 'short' });
      allMonths.push(monthMap.get(monthKey) || { month: monthName, year: currentMonthDate.getFullYear(), dates: [] });
      currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
    }
    return allMonths;
  };

  const monthGroups = getMonthGroups();
  const totalDateCols = monthGroups.reduce((sum, g) => sum + Math.max(g.dates.length, 1), 0);
  const tableMinWidthPx = 200 + 52 * totalDateCols;

  const getDateRangeText = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate end date: exactly 3 months from today
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 3);
    endDate.setDate(endDate.getDate() - 1);
    endDate.setHours(0, 0, 0, 0);
    
    // Format dates
    const firstMonth = today.toLocaleDateString('en-US', { month: 'short' });
    const firstDay = today.getDate();
    const lastMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
    const lastDay = endDate.getDate();
    
    return `${firstMonth}-${firstDay} to ${lastMonth}-${lastDay}`;
  };

  const handleCellClick = (appId: number, categoryId: number) => {
    const key = `${appId}-${categoryId}`;
    if (!selectedSlots[key]) {
      setSelectedSlots(prev => ({
        ...prev,
        [key]: { appId, categoryId, dates: [], file: null, url: '', preview: '' }
      }));
    }
    // Reset calendar to start from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCalendarStartMonth(today);
    setShowBookingModal({ appId, categoryId });
  };

  const handleCalendarDateClick = (appId: number, categoryId: number, date: string, pricing: PricingData | undefined) => {
    if (!pricing || pricing.is_booked) return;

    const key = `${appId}-${categoryId}`;
    const currentSlot = selectedSlots[key] || { appId, categoryId, dates: [], file: null, url: '', preview: '' };
    
    const newDates = currentSlot.dates.includes(date)
      ? currentSlot.dates.filter(d => d !== date)
      : [...currentSlot.dates, date];
    
    setSelectedSlots(prev => ({
      ...prev,
      [key]: { ...currentSlot, dates: newDates }
    }));
  };

  const getCalendarMonths = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate end date: exactly 3 months from today
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 3);
    endDate.setDate(endDate.getDate() - 1);
    endDate.setHours(0, 0, 0, 0);
    
    // Get all unique months that contain dates in our range
    // This could be 3 or 4 months depending on the start date
    const startMonth = today.getMonth();
    const startYear = today.getFullYear();
    const endMonth = endDate.getMonth();
    const endYear = endDate.getFullYear();
    
    const months: Date[] = [];
    let currentMonth = new Date(startYear, startMonth, 1);
    currentMonth.setHours(0, 0, 0, 0);
    
    while (currentMonth <= new Date(endYear, endMonth, 1)) {
      months.push(new Date(currentMonth));
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
    
    return months;
  };

  /** Full month grid for calendar: leading empty cells + all days 1..lastDay with date (YYYY-MM-DD). */
  const getFullMonthGrid = (month: Date): { emptyCells: number; days: { day: number; date: string }[] } => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const emptyCells = firstDay.getDay();
    const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate();
    const days: { day: number; date: string }[] = [];
    for (let day = 1; day <= lastDayOfMonth; day++) {
      days.push({ day, date: formatDateString(year, monthIndex, day) });
    }
    return { emptyCells, days };
  };

  /** Start and end of bookable range (today through 3 months). */
  const getBookableRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 3);
    endDate.setDate(endDate.getDate() - 1);
    endDate.setHours(0, 0, 0, 0);
    return { start: today, end: endDate };
  };

  const getPricingForDate = (appId: number, categoryId: number, date: string): PricingData | undefined => {
    const key = `${appId}-${categoryId}`;
    return pricingData[key]?.find(p => p.date === date);
  };

  const calculateTotal = (appId: number, categoryId: number): number => {
    const key = `${appId}-${categoryId}`;
    const slot = selectedSlots[key];
    if (!slot) return 0;

    return slot.dates.reduce((total, date) => {
      const pricing = getPricingForDate(appId, categoryId, date);
      return total + (pricing?.price || 0);
    }, 0);
  };

  const handleFileChange = (appId: number, categoryId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const key = `${appId}-${categoryId}`;
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedSlots(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            file,
            preview: reader.result as string
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (appId: number, categoryId: number) => {
    setError('');
    setSuccess('');

    const key = `${appId}-${categoryId}`;
    const slot = selectedSlots[key];

    if (!slot?.file) {
      setError('Please upload a file');
      return;
    }

    if (!slot?.dates || slot.dates.length === 0) {
      setError('Please select at least one date');
      return;
    }

    setSaving(key);

    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('app_id', appId.toString());
      formData.append('category_id', categoryId.toString());
      formData.append('dates', JSON.stringify(slot.dates));
      formData.append('ad_slot', adSlot);
      if (slot.url) formData.append('link_url', slot.url);
      if (slot.file) formData.append('file', slot.file);

      const response = await axios.post(`${API_BASE_URL}/header-ads`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setSuccess('Header ad booked successfully');
        setSelectedSlots(prev => {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        });
        setShowBookingModal(null);

        // Reset the flag to allow refetching pricing after booking
        hasFetchedInitialPricing.current = false;
        // Debounce the pricing refetch
        if (pricingFetchTimeoutRef.current) {
          clearTimeout(pricingFetchTimeoutRef.current);
        }
        pricingFetchTimeoutRef.current = setTimeout(() => {
          fetchPricingForAllCategories();
          hasFetchedInitialPricing.current = true;
        }, 500);
      }
    } catch (err: any) {
      console.error('Booking error:', err);
      // Handle rate limit errors
      if (err.response?.status === 429) {
        const retryAfter = err.response?.headers['retry-after'] || 60;
        setError(`Too many requests. Please wait ${retryAfter} seconds before trying again.`);
      } else {
        setError(err.response?.data?.message || 'Booking failed. Please try again.');
      }
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  const getOfficeLevelLabel = () => {
    switch (officeLevel) {
      case 'head_office': return 'Head Office';
      case 'regional': return 'Regional Office';
      case 'branch': return 'Branch Office';
      default: return 'Franchise';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getOfficeLevelLabel()} Header Ads {adSlot === 'ads2' ? '-2' : ''} Booking
          </h1>
          {pricingMultiplier > 1 && (
            <p className="text-sm text-gray-500 mt-1">
              Pricing includes location multiplier: <span className="font-semibold text-blue-600">×{pricingMultiplier}</span>
              {officeLevel === 'head_office' && ' (states × districts)'}
              {officeLevel === 'regional' && ' (districts)'}
            </p>
          )}
        </div>
        <div className="text-sm text-gray-600 font-medium">
          {getDateRangeText()}
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pricing Hierarchy Table */}
      {hierarchyPricing.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing Structure (Base: ₹{myCoins})</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-700">Level</th>
                  <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="border border-gray-200 px-4 py-2 text-center text-sm font-semibold text-gray-700">Count</th>
                  <th className="border border-gray-200 px-4 py-2 text-right text-sm font-semibold text-gray-700">Total</th>
                  <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-700">Logic</th>
                </tr>
              </thead>
              <tbody>
                {hierarchyPricing.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-200 px-4 py-2 text-sm font-medium text-gray-900">{item.level}</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm text-gray-700">{item.name}</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm text-center text-gray-700">{item.count}</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm text-right font-semibold text-teal-600">₹{item.total}</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm text-gray-500">{item.logic}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div
          ref={topScrollRef}
          onScroll={() => { if (topScrollRef.current && tableScrollRef.current) syncScroll(topScrollRef.current, tableScrollRef.current); }}
          className="overflow-x-auto overflow-y-hidden border-b border-gray-200"
          style={{ maxHeight: '16px' }}
        >
          <div ref={topScrollContentRef} style={{ minWidth: tableMinWidthPx, height: 1 }} />
        </div>
        <div
          ref={tableScrollRef}
          onScroll={() => { if (tableScrollRef.current && topScrollRef.current) syncScroll(tableScrollRef.current, topScrollRef.current); }}
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
                  const colSpan = group.dates.length > 0 ? group.dates.length : 1;
                  return (
                    <th key={`${group.month}-${group.year}-${idx}`} colSpan={colSpan} className={`border border-gray-300 px-2 py-2 text-sm font-bold text-white ${colors[colorIndex]}`}>
                      {group.month} {group.year}
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
              {apps.map((app) => {
                const categories = appCategories[app.id] || [];
                return (
                  <React.Fragment key={app.id}>
                    <tr>
                      <td className="sticky left-0 z-10 bg-blue-500 border border-gray-300 px-4 py-2 font-bold text-white shadow-[2px_0_4px_rgba(0,0,0,0.08)]">
                        {app.name}
                      </td>
                      <td colSpan={totalDateCols} className="bg-blue-500 border border-gray-300" />
                    </tr>
                    {categories.length === 0 ? (
                      <tr>
                        <td className="sticky left-0 z-10 bg-blue-100 border border-gray-300 px-4 py-2 font-medium text-gray-900 shadow-[2px_0_4px_rgba(0,0,0,0.08)]">
                          No categories
                        </td>
                        <td colSpan={totalDateCols} className="border border-gray-300 bg-gray-50" />
                      </tr>
                    ) : (
                      categories.map((category) => (
                        <tr key={category.id} className="hover:bg-gray-50">
                          <td className="sticky left-0 z-10 bg-blue-100 border border-gray-300 px-4 py-2 font-medium text-gray-900 shadow-[2px_0_4px_rgba(0,0,0,0.08)]">
                            {category.category_name}
                          </td>
                          {monthGroups.flatMap((group, groupIdx) => {
                            if (group.dates.length === 0) {
                              return [
                                <td key={`empty-${group.month}-${group.year}-${groupIdx}`} className="border border-gray-300 px-2 py-2 text-center text-xs bg-gray-50">
                                  &nbsp;
                                </td>
                              ];
                            }
                            return group.dates.map((dayInfo) => {
                              const pricing = getPricingForDate(app.id, category.id, dayInfo.date);
                              const isBooked = pricing?.is_booked;
                              const price = pricing?.price ?? 0;
                              return (
                                <td
                                  key={dayInfo.date}
                                  onClick={() => !isBooked && handleCellClick(app.id, category.id)}
                                  className={`border border-gray-300 px-2 py-2 text-center text-xs transition-colors ${
                                    isBooked ? 'bg-red-500 cursor-not-allowed' : 'bg-green-50 cursor-pointer hover:bg-green-100'
                                  }`}
                                >
                                  {!isBooked && <div className="font-semibold text-gray-900">₹{price}</div>}
                                  {isBooked && <div className="text-white font-bold text-lg">✕</div>}
                                </td>
                              );
                            });
                          })}
                        </tr>
                      ))
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-7xl w-full p-6 my-8"
          >
            {(() => {
              const key = `${showBookingModal.appId}-${showBookingModal.categoryId}`;
              const slot = selectedSlots[key];
              const total = calculateTotal(showBookingModal.appId, showBookingModal.categoryId);
              const app = apps.find(a => a.id === showBookingModal.appId);
              const category = appCategories[showBookingModal.appId]?.find(c => c.id === showBookingModal.categoryId);

              return (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                      Book Header Ad {adSlot === 'ads2' ? '-2' : ''} - {app?.name} - {category?.category_name}
                    </h3>
                    <button onClick={() => { setShowBookingModal(null); setSelectedSlots(prev => { const updated = {...prev}; delete updated[key]; return updated; }); }} className="p-2 hover:bg-gray-100 rounded-lg">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3 space-y-4">
                      <h4 className="font-semibold text-gray-900">Select Dates (3 Months)</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto">
                        {getCalendarMonths().map((month) => {
                          const { emptyCells, days } = getFullMonthGrid(month);
                          const { start: rangeStart, end: rangeEnd } = getBookableRange();
                          return (
                            <div key={month.toISOString()} className="border border-gray-200 rounded-lg p-3">
                              <h5 className="font-semibold text-center mb-2 text-gray-800">
                                {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                              </h5>
                              <div className="grid grid-cols-7 gap-1">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                  <div key={i} className="text-xs font-semibold text-center text-gray-600 py-1">{d}</div>
                                ))}
                                {Array.from({ length: emptyCells }).map((_, i) => (
                                  <div key={`empty-${i}`} />
                                ))}
                                {days.map((dayInfo) => {
                                  const pricing = getPricingForDate(showBookingModal.appId, showBookingModal.categoryId, dayInfo.date);
                                  const isSelected = slot?.dates.includes(dayInfo.date);
                                  const isBooked = pricing?.is_booked ?? false;
                                  const dayDate = new Date(dayInfo.date + 'T12:00:00');
                                  const isPast = dayDate < rangeStart;
                                  const isOutOfRange = dayDate < rangeStart || dayDate > rangeEnd;
                                  const isAvailable = !isOutOfRange && !isBooked;
                                  const price = pricing?.price ?? 0;

                                  return (
                                    <button
                                      key={dayInfo.date}
                                      type="button"
                                      onClick={() => isAvailable && handleCalendarDateClick(showBookingModal.appId, showBookingModal.categoryId, dayInfo.date, pricing)}
                                      disabled={isPast || isBooked || isOutOfRange}
                                      className={`text-xs p-1 rounded transition-colors min-h-[32px]
                                        ${isOutOfRange && !isBooked ? 'bg-gray-100 text-gray-400 cursor-default' : ''}
                                        ${isBooked ? 'bg-red-100 text-red-600 cursor-not-allowed' : ''}
                                        ${isSelected ? 'bg-teal-600 text-white font-bold' : ''}
                                        ${isAvailable && !isSelected ? 'bg-[rgb(150,240,68)] hover:bg-[rgb(140,230,60)] text-gray-900' : ''}
                                      `}
                                    >
                                      <div>{dayInfo.day}</div>
                                      {isAvailable && <div className="text-[9px]">₹{price}</div>}
                                      {isBooked && !isSelected && <div className="text-[9px]">—</div>}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Upload Ad Image</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(showBookingModal.appId, showBookingModal.categoryId, e)}
                            className="hidden"
                            id={`file-${key}`}
                          />
                          <label htmlFor={`file-${key}`}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 w-full justify-center">
                            <Upload size={16} />
                            <span className="text-sm truncate">{slot?.file ? slot.file.name : 'Choose file'}</span>
                          </label>
                          {slot?.preview && (
                            <img src={slot.preview} alt="Preview" className="mt-2 w-full h-32 object-contain rounded border" />
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Link URL (Optional)</label>
                          <input
                            type="url"
                            value={slot?.url || ''}
                            onChange={(e) => setSelectedSlots(prev => ({
                              ...prev,
                              [key]: { ...prev[key], url: e.target.value }
                            }))}
                            placeholder="https://example.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold mb-3 text-sm">Selection Summary</h4>
                        <div className="text-sm text-gray-600 mb-2">
                          Selected Dates: <span className="font-bold text-gray-900">{slot?.dates.length || 0}</span>
                        </div>
                        <div className="space-y-1 max-h-60 overflow-y-auto mb-3">
                          {slot?.dates.length > 0 ? slot.dates.map(date => {
                            const pricing = getPricingForDate(showBookingModal.appId, showBookingModal.categoryId, date);
                            return (
                              <div key={date} className="flex justify-between text-xs bg-white p-2 rounded">
                                <span>{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                <span className="font-medium">₹{pricing?.price ?? 0}</span>
                              </div>
                            );
                          }) : (
                            <p className="text-xs text-gray-500 text-center py-4">No dates selected</p>
                          )}
                        </div>
                        <div className="flex justify-between text-base font-bold pt-3 border-t border-gray-200">
                          <span>Total:</span>
                          <span className="text-teal-600">₹{total}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSave(showBookingModal.appId, showBookingModal.categoryId)}
                        disabled={saving === key || !slot?.file || !slot?.dates?.length}
                        className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold">
                        {saving === key ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Confirm Booking
                      </button>
                      
                      <button
                        onClick={() => { setShowBookingModal(null); setSelectedSlots(prev => { const updated = {...prev}; delete updated[key]; return updated; }); }}
                        className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </motion.div>
        </div>
      )}


    </div>
  );
};
