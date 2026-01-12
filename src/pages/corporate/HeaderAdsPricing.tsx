import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Save, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
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
  id?: number;
  app_id: number;
  app_category_id: number;
  date: string;
  ad_slot: 'ads1' | 'ads2';
  office_level: 'corporate' | 'head_office' | 'regional' | 'branch';
  price: number;
  is_booked: number;
}

export const HeaderAdsPricing: React.FC = () => {
  const [apps, setApps] = useState<App[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<'ads1' | 'ads2'>('ads1');
  const [selectedLevel, setSelectedLevel] = useState<string>('corporate');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [pricingData, setPricingData] = useState<PricingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bulkPrice, setBulkPrice] = useState<string>('');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  useEffect(() => {
    fetchApps();
  }, []);

  useEffect(() => {
    if (selectedAppId) {
      fetchCategories(selectedAppId);
    } else {
      setCategories([]);
      setSelectedCategoryId('');
    }
  }, [selectedAppId]);

  useEffect(() => {
    if (selectedAppId && selectedCategoryId) {
      fetchPricing();
    }
  }, [selectedAppId, selectedCategoryId, selectedSlot, selectedLevel, currentMonth]);

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
      setError('Failed to fetch apps');
    } finally {
      setLoading(false);
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

  const fetchPricing = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      // Fetch 3 months of data
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 3, 0);

      const response = await axios.get(`${API_BASE_URL}/advertisement/pricing`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          app_id: selectedAppId,
          app_category_id: selectedCategoryId,
          ad_slot: selectedSlot,
          office_level: selectedLevel,
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

  // Get 3 months starting from currentMonth
  const getThreeMonths = () => {
    const months = [];
    for (let i = 0; i < 3; i++) {
      const monthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + i, 1);
      months.push(monthDate);
    }
    return months;
  };

  const getDaysInMonth = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // Add empty slots for days before the first day of month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(new Date(0)); // placeholder
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const getPriceForDate = (date: Date): PricingData | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return pricingData.find(p => p.date === dateStr);
  };

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const toggleDateSelection = (date: Date) => {
    const dateStr = formatDate(date);
    setSelectedDates(prev => 
      prev.includes(dateStr) 
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  const handleBulkPriceSave = async () => {
    if (!bulkPrice || selectedDates.length === 0) {
      setError('Please select dates and enter a price');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${API_BASE_URL}/advertisement/pricing/bulk`, {
        app_id: parseInt(selectedAppId),
        app_category_id: parseInt(selectedCategoryId),
        ad_slot: selectedSlot,
        office_level: selectedLevel,
        dates: selectedDates,
        price: parseFloat(bulkPrice)
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Pricing saved successfully');
      setSelectedDates([]);
      setBulkPrice('');
      fetchPricing();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save pricing');
    } finally {
      setSaving(false);
    }
  };

  const prevMonths = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 3, 1));
  };

  const nextMonths = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 6);
    const nextMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 3, 1);
    if (nextMonthDate <= maxDate) {
      setCurrentMonth(nextMonthDate);
    }
  };

  const isDateSelectable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return date >= today && date <= maxDate;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Header Ads Pricing</h1>
      </div>

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

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ad Slot</label>
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value as 'ads1' | 'ads2')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ads1">Ads 1 (Top)</option>
              <option value="ads2">Ads 2 (Bottom)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Office Level</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="corporate">Corporate</option>
              <option value="head_office">Head Office</option>
              <option value="regional">Regional Office</option>
              <option value="branch">Branch Office</option>
            </select>
          </div>
        </div>
      </div>

      {selectedAppId && selectedCategoryId && (
        <>
          {/* Bulk Price Setting */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Set Bulk Pricing</h3>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₹) for {selectedDates.length} selected date(s)
                </label>
                <input
                  type="number"
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(e.target.value)}
                  placeholder="Enter price"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleBulkPriceSave}
                disabled={saving || selectedDates.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Pricing'}
              </button>
            </div>
          </div>

          {/* 3-Month Calendar View */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <button onClick={prevMonths} className="p-2 hover:bg-gray-100 rounded-lg flex items-center gap-1">
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">Previous 3 Months</span>
              </button>
              <h3 className="text-lg font-semibold">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - {
                  new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                }
              </h3>
              <button onClick={nextMonths} className="p-2 hover:bg-gray-100 rounded-lg flex items-center gap-1">
                <span className="text-sm">Next 3 Months</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {getThreeMonths().map((monthDate, monthIdx) => (
                <div key={monthIdx} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-center font-semibold text-gray-800 mb-4">
                    {monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h4>

                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                      <div key={i} className="text-center text-xs font-medium text-gray-500 py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {getDaysInMonth(monthDate).map((date, idx) => {
                      if (date.getTime() === 0) {
                        return <div key={idx} className="h-14"></div>;
                      }
                      const pricing = getPriceForDate(date);
                      const isSelected = selectedDates.includes(formatDate(date));
                      const selectable = isDateSelectable(date);
                      const isBooked = pricing?.is_booked === 1;

                      return (
                        <motion.div
                          key={idx}
                          whileHover={selectable && !isBooked ? { scale: 1.05 } : {}}
                          onClick={() => selectable && !isBooked && toggleDateSelection(date)}
                          className={`h-14 p-1 rounded-md border cursor-pointer transition-all text-center ${
                            isBooked
                              ? 'bg-red-50 border-red-200 cursor-not-allowed'
                              : isSelected
                              ? 'bg-blue-100 border-blue-500'
                              : selectable
                              ? 'bg-white border-gray-200 hover:border-blue-300'
                              : 'bg-gray-50 border-gray-100 cursor-not-allowed opacity-50'
                          }`}
                        >
                          <div className="text-xs font-medium">{date.getDate()}</div>
                          {pricing ? (
                            <div className={`text-[10px] ${isBooked ? 'text-red-600' : 'text-green-600'}`}>
                              ₹{pricing.price}
                              {isBooked && <span className="block text-red-500 text-[8px]">Booked</span>}
                            </div>
                          ) : (
                            <div className="text-[10px] text-gray-400">-</div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

