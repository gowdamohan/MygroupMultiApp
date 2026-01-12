import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, ChevronLeft, ChevronRight, Upload, Link, Check, X, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import axios from 'axios';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';

interface PricingData {
  id: number;
  date: string;
  ad_slot: 'ads1' | 'ads2';
  price: number;
  is_booked: number;
  booked_by?: string;
}

interface FranchiseHeaderAdsProps {
  officeLevel: 'head_office' | 'regional' | 'branch';
}

export const FranchiseHeaderAds: React.FC<FranchiseHeaderAdsProps> = ({ officeLevel }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<'ads1' | 'ads2'>('ads1');
  const [pricingData, setPricingData] = useState<PricingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPricing();
  }, [currentMonth, selectedSlot, officeLevel]);

  const fetchPricing = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const response = await axios.get(`${API_BASE_URL}/advertisement/franchise-pricing`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          office_level: officeLevel,
          ad_slot: selectedSlot,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        }
      });
      if (response.data.success) {
        setPricingData(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching pricing:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (date: string, pricing: PricingData | undefined) => {
    if (pricing?.is_booked) return;
    
    if (selectedDates.includes(date)) {
      setSelectedDates(selectedDates.filter(d => d !== date));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image file (JPEG, PNG, or GIF)');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError('File size must be less than 2MB');
        return;
      }
      setUploadedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleBooking = async () => {
    if (selectedDates.length === 0) {
      setError('Please select at least one date');
      return;
    }
    if (!uploadedFile) {
      setError('Please upload an ad image');
      return;
    }

    setBooking(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('ad_image', uploadedFile);
      formData.append('dates', JSON.stringify(selectedDates));
      formData.append('ad_slot', selectedSlot);
      formData.append('office_level', officeLevel);
      formData.append('link_url', linkUrl);

      const response = await axios.post(`${API_BASE_URL}/advertisement/franchise-book`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setSuccess('Ad booked successfully!');
        setSelectedDates([]);
        setUploadedFile(null);
        setPreviewUrl('');
        setLinkUrl('');
        setShowBookingModal(false);
        fetchPricing();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to book ad');
    } finally {
      setBooking(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: { date: string; day: number; isCurrentMonth: boolean }[] = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 1, day);
      days.push({ date: date.toISOString().split('T')[0], day, isCurrentMonth: false });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ date: date.toISOString().split('T')[0], day, isCurrentMonth: true });
    }

    return days;
  };

  const getPricingForDate = (date: string) => {
    return pricingData.find(p => p.date === date);
  };

  const calculateTotal = () => {
    return selectedDates.reduce((total, date) => {
      const pricing = getPricingForDate(date);
      return total + (pricing?.price || 0);
    }, 0);
  };

  const getOfficeLevelLabel = () => {
    switch (officeLevel) {
      case 'head_office': return 'Head Office';
      case 'regional': return 'Regional Office';
      case 'branch': return 'Branch Office';
      default: return 'Office';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{getOfficeLevelLabel()} Header Ads</h2>
        <p className="text-gray-600 mt-1">Book header advertisement slots for your {getOfficeLevelLabel().toLowerCase()}</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* Slot Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Ad Slot</h3>
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedSlot('ads1')}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              selectedSlot === 'ads1'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-900">Header Ads 1</div>
            <div className="text-sm text-gray-500">Primary header position</div>
          </button>
          <button
            onClick={() => setSelectedSlot('ads2')}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              selectedSlot === 'ads2'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-900">Header Ads 2</div>
            <div className="text-sm text-gray-500">Secondary header position</div>
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth().map((dayInfo, index) => {
                const pricing = getPricingForDate(dayInfo.date);
                const isSelected = selectedDates.includes(dayInfo.date);
                const isBooked = pricing?.is_booked === 1;
                const isPast = new Date(dayInfo.date) < new Date(new Date().toDateString());

                return (
                  <button
                    key={index}
                    onClick={() => !isPast && dayInfo.isCurrentMonth && handleDateClick(dayInfo.date, pricing)}
                    disabled={isPast || !dayInfo.isCurrentMonth || isBooked}
                    className={`
                      p-2 min-h-[80px] rounded-lg border text-left transition-all
                      ${!dayInfo.isCurrentMonth ? 'opacity-30' : ''}
                      ${isPast ? 'bg-gray-100 cursor-not-allowed' : ''}
                      ${isBooked ? 'bg-red-50 border-red-200 cursor-not-allowed' : ''}
                      ${isSelected ? 'bg-blue-100 border-blue-500' : 'border-gray-200 hover:border-gray-300'}
                    `}
                  >
                    <div className="text-sm font-medium text-gray-900">{dayInfo.day}</div>
                    {dayInfo.isCurrentMonth && pricing && (
                      <div className={`text-xs mt-1 ${isBooked ? 'text-red-600' : 'text-green-600'}`}>
                        {isBooked ? 'Booked' : `₹${pricing.price}`}
                      </div>
                    )}
                    {isSelected && (
                      <Check size={14} className="text-blue-600 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Selected Dates Summary */}
      {selectedDates.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Dates</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedDates.map(date => (
              <span key={date} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2">
                {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                <button onClick={() => setSelectedDates(selectedDates.filter(d => d !== date))}>
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div>
              <span className="text-gray-600">Total:</span>
              <span className="text-2xl font-bold text-gray-900 ml-2">₹{calculateTotal()}</span>
            </div>
            <button
              onClick={() => setShowBookingModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Proceed to Book
            </button>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Complete Your Booking</h3>

            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Ad Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {previewUrl ? (
                    <div className="relative">
                      <img src={previewUrl} alt="Preview" className="max-h-40 mx-auto rounded" />
                      <button
                        onClick={() => { setUploadedFile(null); setPreviewUrl(''); }}
                        className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                      <span className="text-sm text-gray-600">Click to upload (JPEG, PNG, GIF - Max 2MB)</span>
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              {/* Link URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link URL (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <Link size={18} className="text-gray-400" />
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Selected Dates:</span>
                  <span className="font-medium">{selectedDates.length} days</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Ad Slot:</span>
                  <span className="font-medium">{selectedSlot === 'ads1' ? 'Header Ads 1' : 'Header Ads 2'}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span>Total:</span>
                  <span className="text-blue-600">₹{calculateTotal()}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBooking}
                disabled={booking || !uploadedFile}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {booking ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                {booking ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

