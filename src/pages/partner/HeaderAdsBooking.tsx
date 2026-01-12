import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, ChevronLeft, ChevronRight, ShoppingCart, Wallet, Check } from 'lucide-react';
import { motion } from 'motion/react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';

interface Category {
  id: number;
  category_name: string;
}

interface PricingData {
  id: number;
  app_id: number;
  app_category_id: number;
  date: string;
  ad_slot: 'ads1' | 'ads2';
  office_level: string;
  price: number;
  is_booked: number;
}

interface WalletData {
  id: number;
  balance: number;
  currency: string;
}

export const HeaderAdsBooking: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<'ads1' | 'ads2'>('ads1');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [pricingData, setPricingData] = useState<PricingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchWallet();
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      fetchPricing();
    }
  }, [selectedCategoryId, selectedSlot, currentMonth]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await axios.get(`${API_BASE_URL}/header-ads/categories/${user.app_id || 1}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWallet = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/wallet`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setWallet(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching wallet:', err);
    }
  };

  const fetchPricing = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const response = await axios.get(`${API_BASE_URL}/advertisement/pricing`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          app_id: user.app_id || 1,
          app_category_id: selectedCategoryId,
          ad_slot: selectedSlot,
          office_level: 'branch',
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

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
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

  const getPriceForDate = (date: Date): PricingData | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return pricingData.find(p => p.date === dateStr);
  };

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const toggleDateSelection = (date: Date) => {
    const dateStr = formatDate(date);
    setSelectedDates(prev => 
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
    );
  };

  const calculateTotal = () => {
    return selectedDates.reduce((total, dateStr) => {
      const pricing = pricingData.find(p => p.date === dateStr);
      return total + (pricing?.price || 0);
    }, 0);
  };

  const isDateSelectable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return date >= today && date <= maxDate;
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    const nextMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    if (nextMonthDate <= maxDate) {
      setCurrentMonth(nextMonthDate);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('File size must be less than 2MB');
        return;
      }
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError('Only JPEG, PNG, and GIF files are allowed');
        return;
      }
      setUploadedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleBooking = async () => {
    if (!uploadedFile) {
      setError('Please upload an ad image');
      return;
    }
    if (selectedDates.length === 0) {
      setError('Please select at least one date');
      return;
    }
    const total = calculateTotal();
    if (wallet && wallet.balance < total) {
      setError('Insufficient wallet balance');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmBooking = async () => {
    setBooking(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const formData = new FormData();
      formData.append('file', uploadedFile!);
      formData.append('app_id', user.app_id || '1');
      formData.append('app_category_id', selectedCategoryId);
      formData.append('ad_slot', selectedSlot);
      formData.append('dates', JSON.stringify(selectedDates));
      formData.append('link_url', linkUrl);
      formData.append('office_level', 'branch');
      formData.append('country_id', user.country_id || '');
      formData.append('state_id', user.state_id || '');
      formData.append('district_id', user.district_id || '');

      await axios.post(`${API_BASE_URL}/advertisement/ads`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('Ad booking submitted successfully! Pending approval.');
      setSelectedDates([]);
      setUploadedFile(null);
      setPreviewUrl('');
      setLinkUrl('');
      setShowConfirmModal(false);
      fetchWallet();
      fetchPricing();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to book ad');
    } finally {
      setBooking(false);
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Book Header Ads</h1>
        <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg">
          <Wallet className="w-5 h-5 text-green-600" />
          <span className="text-green-700 font-semibold">
            Balance: ₹{wallet?.balance?.toFixed(2) || '0.00'}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
        </div>
      </div>

      {selectedCategoryId && (
        <>
          {/* Upload Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Upload Ad Image</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Max 2MB. Formats: JPEG, PNG, GIF</p>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link URL (optional)</label>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              {previewUrl && (
                <div className="border rounded-lg p-2">
                  <img src={previewUrl} alt="Preview" className="max-h-40 mx-auto object-contain" />
                </div>
              )}
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-semibold">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {getDaysInMonth().map((date, idx) => {
                if (date.getTime() === 0) return <div key={idx} className="h-20"></div>;
                const pricing = getPriceForDate(date);
                const isSelected = selectedDates.includes(formatDate(date));
                const selectable = isDateSelectable(date) && pricing && pricing.is_booked !== 1;
                const isBooked = pricing?.is_booked === 1;

                return (
                  <motion.div
                    key={idx}
                    whileHover={selectable ? { scale: 1.02 } : {}}
                    onClick={() => selectable && toggleDateSelection(date)}
                    className={`h-20 p-2 rounded-lg border cursor-pointer transition-all ${
                      isBooked ? 'bg-red-50 border-red-200 cursor-not-allowed'
                        : isSelected ? 'bg-blue-100 border-blue-500'
                        : selectable ? 'bg-white border-gray-200 hover:border-blue-300'
                        : 'bg-gray-50 border-gray-100 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <div className="text-sm font-medium">{date.getDate()}</div>
                    {pricing ? (
                      <div className={`text-xs mt-1 ${isBooked ? 'text-red-600' : 'text-green-600'}`}>
                        ₹{pricing.price}
                        {isBooked && <span className="block text-red-500">Booked</span>}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 mt-1">N/A</div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Booking Summary */}
          {selectedDates.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>
              <div className="flex items-center justify-between mb-4">
                <span>Selected Dates: {selectedDates.length}</span>
                <span className="text-xl font-bold text-blue-600">Total: ₹{calculateTotal().toFixed(2)}</span>
              </div>
              <button
                onClick={handleBooking}
                disabled={booking}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                {booking ? 'Processing...' : 'Book Now'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Booking</h3>
            <p className="text-gray-600 mb-4">
              You are about to book {selectedDates.length} ad slot(s) for ₹{calculateTotal().toFixed(2)}.
              This amount will be deducted from your wallet.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmBooking}
                disabled={booking}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                {booking ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

