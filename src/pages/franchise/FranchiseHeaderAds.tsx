import React, { useState, useEffect } from 'react';
import { Upload, Save, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';

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

export const FranchiseHeaderAds: React.FC = () => {
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

  useEffect(() => {
    fetchApps();
  }, []);

  useEffect(() => {
    if (apps.length > 0) {
      fetchPricingForAllCategories();
    }
  }, [apps, appCategories]);

  useEffect(() => {
    if (showBookingModal) {
      fetchPricingForCalendar(showBookingModal.appId, showBookingModal.categoryId);
    }
  }, [showBookingModal, calendarStartMonth]);

  const fetchApps = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/header-ads/my-apps`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const appsData = response.data.data;
        setApps(appsData);
        
        for (const app of appsData) {
          await fetchCategories(app.id);
        }
      }
    } catch (err: any) {
      console.error('Error fetching apps:', err);
      setError('Failed to fetch apps');
    } finally {
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
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchPricingForAllCategories = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 3);
    endDate.setDate(endDate.getDate() - 1); // Exactly 3 months from today

    for (const app of apps) {
      const categories = appCategories[app.id] || [];
      for (const category of categories) {
        await fetchPricing(app.id, category.id, startDate, endDate);
      }
    }
  };

  const fetchPricingForCalendar = async (appId: number, categoryId: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 3);
    endDate.setDate(endDate.getDate() - 1); // Exactly 3 months from today
    await fetchPricing(appId, categoryId, startDate, endDate);
  };

  const fetchPricing = async (appId: number, categoryId: number, startDate: Date, endDate: Date) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/header-ads/pricing`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          app_id: appId,
          category_id: categoryId,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        }
      });
      
      if (response.data.success) {
        const key = `${appId}-${categoryId}`;
        setPricingData(prev => ({ ...prev, [key]: response.data.data }));
      }
    } catch (err: any) {
      console.error('Error fetching pricing:', err);
    }
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
      allDates.push({
        date: currentDate.toISOString().split('T')[0],
        day: currentDate.getDate(),
        month: currentDate.getMonth(),
        year: currentDate.getFullYear()
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

  const getDaysInCalendarMonth = (month: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate end date: exactly 3 months from today
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 3);
    endDate.setDate(endDate.getDate() - 1);
    endDate.setHours(0, 0, 0, 0);
    
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    
    // Determine the start day for this month
    // If this is the current month, start from today's date
    // Otherwise, start from day 1
    const isCurrentMonth = month.getFullYear() === today.getFullYear() && monthIndex === today.getMonth();
    const startDay = isCurrentMonth ? today.getDate() : 1;
    
    // Determine the end day for this month
    // If this is the last month in range, end at endDate's date
    // Otherwise, end at the last day of the month
    const isLastMonth = month.getFullYear() === endDate.getFullYear() && monthIndex === endDate.getMonth();
    const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate();
    const endDay = isLastMonth ? endDate.getDate() : lastDayOfMonth;

    const days: { date: string; day: number }[] = [];
    for (let day = startDay; day <= endDay; day++) {
      const date = new Date(year, monthIndex, day);
      date.setHours(0, 0, 0, 0);
      
      // Double-check that date is within our range
      if (date >= today && date <= endDate) {
        days.push({ date: date.toISOString().split('T')[0], day });
      }
    }
    return days;
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
        await fetchPricingForAllCategories();
      }
    } catch (err: any) {
      console.error('Booking error:', err);
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Franchise Header Ads Booking</h1>
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto relative max-h-[600px]">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr>
              <th rowSpan={2} className="sticky left-0 z-20 bg-blue-600 border border-gray-300 px-4 py-2 text-sm font-bold text-white min-w-[150px]">
                Category
              </th>
              {getMonthGroups().map((group, idx) => {
                const colors = ['bg-blue-600', 'bg-indigo-600', 'bg-purple-600'];
                const colorIndex = idx % colors.length;
                const headerText = `${group.month} ${group.year}`;
                const colSpan = group.dates.length > 0 ? group.dates.length : 1; // Minimum 1 to ensure header displays
                return (
                  <th key={`${group.month}-${group.year}-${idx}`} colSpan={colSpan} className={`border border-gray-300 px-2 py-2 text-sm font-bold text-white ${colors[colorIndex]}`}>
                    {headerText}
                  </th>
                );
              })}
            </tr>
            <tr>
              {getMonthGroups().map((group, idx) => {
                const colors = ['bg-blue-600', 'bg-indigo-600', 'bg-purple-600'];
                const colorIndex = idx % colors.length;
                if (group.dates.length === 0) {
                  // If no dates in this month, add a placeholder cell to match colSpan
                  return (
                    <th key={`empty-${group.month}-${group.year}-${idx}`} className={`border border-gray-300 px-2 py-2 text-xs font-semibold text-white min-w-[50px] ${colors[colorIndex]}`}>
                      &nbsp;
                    </th>
                  );
                }
                return group.dates.map((dayInfo) => (
                  <th key={dayInfo.date} className={`border border-gray-300 px-2 py-2 text-xs font-semibold text-white min-w-[50px] ${colors[colorIndex]}`}>
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
                    <td colSpan={getMonthGroups().reduce((sum, g) => sum + Math.max(g.dates.length, 1), 0) + 1} 
                      className="bg-blue-500 border border-gray-300 px-4 py-2 font-bold text-white">
                      {app.name}
                    </td>
                  </tr>
                  {categories.map((category) => {
                    const key = `${app.id}-${category.id}`;
                    const slot = selectedSlots[key];
                    const total = calculateTotal(app.id, category.id);

                    return (
                      <tr key={category.id} className="hover:bg-gray-50">
                        <td className="sticky left-0 z-10 bg-blue-100 border border-gray-300 px-4 py-2 font-medium text-gray-900">
                          {category.category_name}
                        </td>
                        {getMonthGroups().map((group, groupIdx) => {
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
                            const pricing = getPricingForDate(app.id, category.id, dayInfo.date);
                            const isBooked = pricing?.is_booked;
                            const price = pricing?.price ?? 0;

                            return (
                              <td
                                key={dayInfo.date}
                                onClick={() => !isBooked && handleCellClick(app.id, category.id)}
                                className={`border border-gray-300 px-2 py-2 text-center text-xs cursor-pointer transition-colors
                                  ${isBooked ? 'bg-red-500 cursor-not-allowed' : 'bg-green-100 hover:bg-green-200'}
                                `}
                              >
                                {!isBooked && (
                                  <div className="font-semibold text-gray-900">₹{price}</div>
                                )}
                                {isBooked && <div className="text-white font-bold text-lg">✕</div>}
                              </td>
                            );
                          });
                        }).flat()}
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
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
                      Book Header Ad - {app?.name} - {category?.category_name}
                    </h3>
                    <button onClick={() => { setShowBookingModal(null); setSelectedSlots(prev => { const updated = {...prev}; delete updated[key]; return updated; }); }} className="p-2 hover:bg-gray-100 rounded-lg">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3 space-y-4">
                      <h4 className="font-semibold text-gray-900">Select Dates (3 Months)</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
                        {getCalendarMonths().map((month) => (
                          <div key={month.toISOString()} className="border border-gray-200 rounded-lg p-3">
                            <h5 className="font-semibold text-center mb-2 text-gray-800">
                              {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </h5>
                            <div className="grid grid-cols-7 gap-1">
                              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                <div key={i} className="text-xs font-semibold text-center text-gray-600 py-1">{day}</div>
                              ))}
                              {(() => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const days = getDaysInCalendarMonth(month);
                                
                                if (days.length === 0) {
                                  // No days to show in this month
                                  return null;
                                }
                                
                                // Get the first date that should be displayed
                                const firstDate = new Date(days[0].date);
                                firstDate.setHours(0, 0, 0, 0);
                                const emptyCells = firstDate.getDay();
                                
                                return Array.from({ length: emptyCells }).map((_, i) => (
                                  <div key={`empty-${i}`} />
                                ));
                              })()}
                              {getDaysInCalendarMonth(month).map((dayInfo) => {
                                const pricing = getPricingForDate(showBookingModal.appId, showBookingModal.categoryId, dayInfo.date);
                                const isSelected = slot?.dates.includes(dayInfo.date);
                                const isBooked = pricing?.is_booked;
                                const dayDate = new Date(dayInfo.date);
                                dayDate.setHours(0, 0, 0, 0);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const isPast = dayDate < today;
                                const price = pricing?.price ?? 0;

                                return (
                                  <button
                                    key={dayInfo.date}
                                    onClick={() => !isPast && !isBooked && handleCalendarDateClick(showBookingModal.appId, showBookingModal.categoryId, dayInfo.date, pricing)}
                                    disabled={isPast || isBooked}
                                    className={`text-xs p-1 rounded transition-colors
                                      ${isPast ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}
                                      ${isBooked ? 'bg-red-100 text-red-500 cursor-not-allowed line-through' : ''}
                                      ${isSelected ? 'bg-teal-600 text-white font-bold' : ''}
                                      ${!isPast && !isBooked && !isSelected ? 'bg-[rgb(150,240,68)] hover:bg-[rgb(140,230,60)] text-gray-900' : ''}
                                    `}
                                  >
                                    <div>{dayInfo.day}</div>
                                    {!isBooked && !isPast && <div className="text-[9px]">₹{price}</div>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
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
