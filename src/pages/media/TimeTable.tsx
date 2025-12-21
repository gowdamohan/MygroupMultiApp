import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, ChevronRight, X, Upload, Trash2, Edit2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5002/api/v1';

interface Schedule {
  id: number;
  title: string;
  media_file: string | null;
  schedule_date: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  status: string;
  is_recurring?: number;
  is_edited?: number;
  is_master?: boolean;
}

interface TimeSlot {
  time: string;
  display: string;
  endTime: string;
}

// Days: 0=Monday to 6=Sunday (displayed as rows on left side)
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_MAP: { [key: number]: number } = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 }; // JS day to our index

// Generate 30-minute time slots from 00:00 to 23:30 (displayed as columns on top)
const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const endHour = minute === 30 ? hour + 1 : hour;
      const endMinute = minute === 30 ? 0 : 30;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      slots.push({ time, display: `${time}`, endTime });
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export const TimeTable: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlots, setSelectedSlots] = useState<{date: string, time: string}[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [modalData, setModalData] = useState({ title: '', file: null as File | null });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Get today's date for highlighting
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const getWeekDates = useCallback(() => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [currentWeekStart]);

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${API_BASE_URL}/partner/channel/${channelId}/schedules?weekStart=${currentWeekStart.toISOString().split('T')[0]}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setSchedules(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  }, [channelId, currentWeekStart]);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const isSlotBooked = (date: string, time: string) => {
    return schedules.some(s => s.schedule_date === date && s.start_time.substring(0, 5) === time);
  };

  const getSlotSchedule = (date: string, time: string) => {
    return schedules.find(s => s.schedule_date === date && s.start_time.substring(0, 5) === time);
  };

  const isSlotSelected = (date: string, time: string) => {
    return selectedSlots.some(s => s.date === date && s.time === time);
  };

  const isPastDate = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleSlotClick = (date: string, time: string) => {
    if (isSlotBooked(date, time)) return;
    if (isSlotSelected(date, time)) {
      setSelectedSlots(selectedSlots.filter(s => !(s.date === date && s.time === time)));
    } else {
      setSelectedSlots([...selectedSlots, { date, time }]);
    }
  };

  const handleMouseDown = (date: string, time: string) => {
    if (isSlotBooked(date, time)) return;
    setIsDragging(true);
    setSelectedSlots([{ date, time }]);
  };

  const handleMouseEnter = (date: string, time: string) => {
    if (!isDragging || isSlotBooked(date, time)) return;
    if (!isSlotSelected(date, time)) {
      setSelectedSlots([...selectedSlots, { date, time }]);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (selectedSlots.length > 0) {
      setModalMode('create');
      setEditingSchedule(null);
      setShowModal(true);
    }
  };

  const getEndTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const endM = m === 30 ? 0 : 30;
    const endH = m === 30 ? h + 1 : h;
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
  };

  const handleEdit = (schedule: Schedule) => {
    if (isPastDate(schedule.schedule_date)) return; // Can't edit past schedules
    setModalMode('edit');
    setEditingSchedule(schedule);
    setModalData({ title: schedule.title, file: null });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!modalData.title.trim()) { setError('Please enter a title'); return; }
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');

      if (modalMode === 'edit' && editingSchedule) {
        // Update existing schedule
        const formData = new FormData();
        formData.append('title', modalData.title);
        if (modalData.file) formData.append('media_file', modalData.file);
        await axios.put(`${API_BASE_URL}/partner/channel/${channelId}/schedules/${editingSchedule.id}`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // Create new schedules
        for (const slot of selectedSlots) {
          const formData = new FormData();
          formData.append('title', modalData.title);
          formData.append('schedule_date', slot.date);
          formData.append('start_time', slot.time + ':00');
          formData.append('end_time', getEndTime(slot.time) + ':00');
          formData.append('is_recurring', '1');
          if (modalData.file) formData.append('media_file', modalData.file);
          await axios.post(`${API_BASE_URL}/partner/channel/${channelId}/schedules`, formData, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
          });
        }
      }
      setShowModal(false);
      setSelectedSlots([]);
      setEditingSchedule(null);
      setModalData({ title: '', file: null });
      fetchSchedules();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: number, scheduleDate: string) => {
    if (isPastDate(scheduleDate)) return; // Can't delete past schedules
    if (!confirm('Delete this schedule?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/partner/channel/${channelId}/schedules/${scheduleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSchedules();
    } catch (err) {
      console.error('Error deleting schedule:', err);
    }
  };

  const weekDates = getWeekDates();
  const selectedTimeRange = selectedSlots.length > 0
    ? `${selectedSlots[0].date} ${selectedSlots[0].time} - ${getEndTime(selectedSlots[selectedSlots.length - 1].time)}`
    : '';

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Time Table</h2>
        <div className="flex items-center gap-4">
          <button onClick={() => navigateWeek('prev')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft size={20} />
          </button>
          <span className="font-medium">
            {currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -
            {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <button onClick={() => navigateWeek('next')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-100 border rounded"></div><span className="text-sm">Available</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-cyan-500 rounded"></div><span className="text-sm">Selected</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 rounded"></div><span className="text-sm">Booked</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-400 rounded"></div><span className="text-sm">Past (Locked)</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-amber-400 border-2 border-amber-600 rounded"></div><span className="text-sm">Today</span></div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden" onMouseUp={handleMouseUp} onMouseLeave={() => setIsDragging(false)}>
          <div className="overflow-x-auto">
            {/* Layout: Days as rows (left), Time slots as columns (top) */}
            <table className="border-collapse" style={{ minWidth: `${TIME_SLOTS.length * 50 + 120}px` }}>
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="border px-3 py-3 text-xs font-semibold text-gray-600 w-28 sticky left-0 bg-gray-50 z-20">Day / Time</th>
                  {TIME_SLOTS.map((slot, idx) => (
                    <th key={idx} className="border px-1 py-2 text-[10px] font-medium text-gray-600 min-w-[50px] whitespace-nowrap">
                      {slot.display}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weekDates.map((date, dayIdx) => {
                  const dateStr = formatDate(date);
                  const isToday = dateStr === todayStr;
                  const isPast = isPastDate(dateStr);
                  return (
                    <tr key={dayIdx} className={`h-10 ${isToday ? 'bg-amber-50' : ''}`}>
                      <td className={`border px-3 py-2 font-medium sticky left-0 z-10 ${isToday ? 'bg-amber-100 text-amber-800' : 'bg-white text-gray-700'}`}>
                        <div className="text-sm">{DAYS[dayIdx]}</div>
                        <div className={`text-xs ${isToday ? 'text-amber-600' : 'text-gray-500'}`}>
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {isToday && <span className="ml-1 font-bold">(Today)</span>}
                        </div>
                      </td>
                      {TIME_SLOTS.map((slot, timeIdx) => {
                        const booked = isSlotBooked(dateStr, slot.time);
                        const selected = isSlotSelected(dateStr, slot.time);
                        const schedule = getSlotSchedule(dateStr, slot.time);
                        const canInteract = !isPast || isToday;

                        let cellClass = 'border px-1 py-1 cursor-pointer transition-colors relative group text-center ';
                        if (isPast && !isToday) {
                          cellClass += booked ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-gray-200 cursor-not-allowed';
                        } else if (booked) {
                          cellClass += isToday ? 'bg-green-400 text-white' : 'bg-green-500 text-white';
                        } else if (selected) {
                          cellClass += 'bg-cyan-500 text-white';
                        } else {
                          cellClass += isToday ? 'bg-amber-50 hover:bg-cyan-100' : 'bg-gray-50 hover:bg-cyan-100';
                        }

                        return (
                          <td key={timeIdx}
                            className={cellClass}
                            onMouseDown={() => canInteract && !booked && handleMouseDown(dateStr, slot.time)}
                            onMouseEnter={() => canInteract && handleMouseEnter(dateStr, slot.time)}
                            onClick={() => canInteract && !isDragging && handleSlotClick(dateStr, slot.time)}
                            title={schedule ? `${schedule.title} (${slot.time}-${slot.endTime})` : `${slot.time}-${slot.endTime}`}>
                            {schedule && (
                              <div className="flex items-center justify-center gap-0.5">
                                <span className="text-[9px] truncate max-w-[30px]" title={schedule.title}>●</span>
                                {canInteract && (
                                  <>
                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(schedule); }}
                                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-green-600 rounded" title="Edit">
                                      <Edit2 size={10} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteSchedule(schedule.id, dateStr); }}
                                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-600 rounded" title="Delete">
                                      <Trash2 size={10} />
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{modalMode === 'edit' ? 'Edit Schedule' : 'Add Schedule'}</h3>
              <button onClick={() => { setShowModal(false); setSelectedSlots([]); setEditingSchedule(null); }} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" value={modalData.title} onChange={(e) => setModalData({ ...modalData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500" placeholder="Enter title" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Media File (optional)</label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <input type="file" id="media-file" className="hidden" accept="image/*,video/*,audio/*"
                    onChange={(e) => setModalData({ ...modalData, file: e.target.files?.[0] || null })} />
                  <label htmlFor="media-file" className="cursor-pointer flex flex-col items-center">
                    <Upload className="text-gray-400 mb-2" size={24} />
                    <span className="text-sm text-gray-600">{modalData.file ? modalData.file.name : 'Click to upload'}</span>
                  </label>
                </div>
              </div>
              {modalMode === 'create' && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selected Time</label>
                  <p className="text-sm text-gray-600">{selectedSlots.length} slot(s) selected</p>
                  <p className="text-xs text-gray-500 mt-1">{selectedTimeRange}</p>
                  <p className="text-xs text-cyan-600 mt-2">📅 Schedule will repeat weekly on the same day/time</p>
                </div>
              )}
              {modalMode === 'edit' && editingSchedule && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Editing</label>
                  <p className="text-sm text-gray-600">{editingSchedule.schedule_date} at {editingSchedule.start_time.substring(0,5)}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 p-4 border-t">
              <button onClick={() => { setShowModal(false); setSelectedSlots([]); setEditingSchedule(null); }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50">
                {submitting ? 'Saving...' : (modalMode === 'edit' ? 'Update' : 'Submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTable;

