import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, ChevronRight, X, Upload, Trash2, Edit2 } from 'lucide-react';
import { API_BASE_URL } from '../../config/api.config';

interface ScheduleSlot {
  schedule_id: number;
  slot_id: number;
  title: string;
  media_file: string | null;
  schedule_date: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_recurring?: number;
  status: string;
  original_schedule_id?: number | null;
  is_edited?: number;
  is_master?: boolean;
}

interface TimeSlot {
  time: string;
  display: string;
  endTime: string;
}

// Days of week names
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

const formatDateLocal = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const normalizeTime = (time: string): string => time.substring(0, 5);

const getEndTimeOptions = (startTime: string) => {
  const startIdx = TIME_SLOTS.findIndex((s) => s.time === startTime);
  if (startIdx === -1) return [];
  return TIME_SLOTS.slice(startIdx).map((s) => ({
    value: s.endTime,
    label: s.endTime
  }));
};

const getSlotsInRange = (startTime: string, endTime: string) => {
  const startIdx = TIME_SLOTS.findIndex((s) => s.time === startTime);
  const endIdx = TIME_SLOTS.findIndex((s) => s.endTime === endTime);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) return [];
  return TIME_SLOTS.slice(startIdx, endIdx + 1).map((s) => ({
    start_time: `${s.time}:00`,
    end_time: s.endTime === '24:00' ? '24:00:00' : `${s.endTime}:00`,
    is_recurring: 1
  }));
};

const timeToMinutes = (time: string): number => {
  const t = normalizeTime(time);
  if (t === '24:00') return 24 * 60;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const isTimeWithinSchedule = (slotTime: string, schedule: ScheduleSlot): boolean => {
  const slotMin = timeToMinutes(slotTime);
  return slotMin >= timeToMinutes(schedule.start_time) && slotMin < timeToMinutes(schedule.end_time);
};

interface ScheduleBlock {
  schedule_id: number;
  title: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  startIdx: number;
  colSpan: number;
  representative: ScheduleSlot;
}

const buildDayBlocks = (dateStr: string, daySchedules: ScheduleSlot[]) => {
  const groups = new Map<number, ScheduleSlot[]>();

  for (const s of daySchedules) {
    const list = groups.get(s.schedule_id) || [];
    list.push(s);
    groups.set(s.schedule_id, list);
  }

  const startMap = new Map<number, ScheduleBlock>();
  const coveredSet = new Set<number>();

  for (const slots of groups.values()) {
    slots.sort((a, b) => a.start_time.localeCompare(b.start_time));
    const first = slots[0];
    const last = slots[slots.length - 1];
    const startTime = normalizeTime(first.start_time);
    const endTime = normalizeTime(last.end_time);
    const startIdx = TIME_SLOTS.findIndex((s) => s.time === startTime);
    if (startIdx === -1) continue;

    const endMin = timeToMinutes(endTime);
    let colSpan = 0;
    for (let i = startIdx; i < TIME_SLOTS.length; i++) {
      const slotMin = timeToMinutes(TIME_SLOTS[i].time);
      if (slotMin >= timeToMinutes(startTime) && slotMin < endMin) {
        colSpan++;
        coveredSet.add(i);
      } else if (slotMin >= endMin) {
        break;
      }
    }
    colSpan = Math.max(1, colSpan);

    startMap.set(startIdx, {
      schedule_id: first.schedule_id,
      title: first.title,
      schedule_date: dateStr,
      start_time: startTime,
      end_time: endTime,
      startIdx,
      colSpan,
      representative: {
        ...first,
        start_time: `${startTime}:00`,
        end_time: endTime === '24:00' ? '24:00:00' : `${endTime}:00`
      }
    });
  }

  return { startMap, coveredSet };
};

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
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlots, setSelectedSlots] = useState<{date: string, time: string}[]>([]);
  const [currentDragDate, setCurrentDragDate] = useState<string | null>(null); // For horizontal-only selection
  const [isDragging, setIsDragging] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingSchedule, setEditingSchedule] = useState<ScheduleSlot | null>(null);
  const [modalData, setModalData] = useState({ title: '', file: null as File | null });
  const [modalTime, setModalTime] = useState({ startTime: '', endTime: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Get today's date for highlighting and reordering
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayStr = formatDateLocal(today);

  // Get week dates and reorder so today is at top
  const getWeekDates = useCallback(() => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [currentWeekStart]);

  // Reorder days so today is at top, then remaining days
  const getReorderedDays = useCallback(() => {
    const weekDates = getWeekDates();
    const todayIndex = weekDates.findIndex(d => formatDateLocal(d) === todayStr);

    if (todayIndex === -1) {
      // Today is not in current week, use normal order
      return weekDates.map((date, idx) => ({ date, dayName: DAYS[idx], isToday: false }));
    }

    // Reorder: today first, then remaining days in order
    const reordered = [];
    for (let i = 0; i < 7; i++) {
      const idx = (todayIndex + i) % 7;
      const date = weekDates[idx];
      reordered.push({
        date,
        dayName: DAYS[idx],
        isToday: idx === todayIndex
      });
    }
    return reordered;
  }, [getWeekDates, todayStr]);

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const weekStart = formatDateLocal(currentWeekStart);
      const response = await axios.get(
        `${API_BASE_URL}/partner/channel/${channelId}/schedules?weekStart=${weekStart}&_=${Date.now()}`,
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

  const mergeScheduleUpdate = useCallback((updated: ScheduleSlot, previous?: ScheduleSlot | null) => {
    setSchedules((prev) => {
      const withoutOld = prev.filter((s) => {
        if (previous && s.schedule_id === previous.schedule_id && s.schedule_date === previous.schedule_date) {
          return false;
        }
        return !(s.schedule_date === updated.schedule_date && normalizeTime(s.start_time) === normalizeTime(updated.start_time));
      });
      return [...withoutOld, updated].sort((a, b) => {
        if (a.schedule_date !== b.schedule_date) return a.schedule_date.localeCompare(b.schedule_date);
        return a.start_time.localeCompare(b.start_time);
      });
    });
  }, []);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  const formatDate = formatDateLocal;

  const openCreateModal = (slots: { date: string; time: string }[]) => {
    const sorted = [...slots].sort((a, b) => a.time.localeCompare(b.time));
    const startTime = sorted[0].time;
    const endTime = getEndTime(sorted[sorted.length - 1].time);
    setModalMode('create');
    setEditingSchedule(null);
    setModalData({ title: '', file: null });
    setModalTime({ startTime, endTime });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSlots([]);
    setEditingSchedule(null);
    setModalData({ title: '', file: null });
    setModalTime({ startTime: '', endTime: '' });
    setError('');
  };

  const isSlotBooked = (date: string, time: string) => {
    return schedules.some((s) => s.schedule_date === date && isTimeWithinSchedule(time, s));
  };

  const isSlotSelected = (date: string, time: string) => {
    return selectedSlots.some(s => s.date === date && s.time === time);
  };

  const isPastDate = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Horizontal-only selection: only allow selecting slots in the same row (same date)
  const handleSlotClick = (date: string, time: string) => {
    if (isSlotBooked(date, time)) return;
    if (isSlotSelected(date, time)) {
      setSelectedSlots(selectedSlots.filter(s => !(s.date === date && s.time === time)));
    } else {
      // Only allow selection for the same date (horizontal only)
      if (selectedSlots.length > 0 && selectedSlots[0].date !== date) {
        // Different date, start new selection
        setSelectedSlots([{ date, time }]);
      } else {
        setSelectedSlots([...selectedSlots, { date, time }]);
      }
    }
  };

  const handleMouseDown = (date: string, time: string) => {
    if (isSlotBooked(date, time)) return;
    setIsDragging(true);
    setCurrentDragDate(date); // Store the date for horizontal-only drag
    setSelectedSlots([{ date, time }]);
  };

  const handleMouseEnter = (date: string, time: string) => {
    if (!isDragging || isSlotBooked(date, time)) return;
    // Horizontal only: only allow if same date as drag start
    if (currentDragDate && date !== currentDragDate) return;
    if (!isSlotSelected(date, time)) {
      setSelectedSlots([...selectedSlots, { date, time }]);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setCurrentDragDate(null);
    if (selectedSlots.length > 0) {
      openCreateModal(selectedSlots);
    }
  };

  const getEndTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const endM = m === 30 ? 0 : 30;
    const endH = m === 30 ? h + 1 : h;
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
  };

  const handleEdit = (schedule: ScheduleSlot) => {
    if (isPastDate(schedule.schedule_date)) return;
    setModalMode('edit');
    setEditingSchedule(schedule);
    setModalData({ title: schedule.title, file: null });
    setModalTime({
      startTime: normalizeTime(schedule.start_time),
      endTime: normalizeTime(schedule.end_time)
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!modalData.title.trim()) { setError('Please enter a title'); return; }
    if (!modalTime.startTime || !modalTime.endTime) { setError('Please select start and end times'); return; }
    if (modalTime.endTime <= modalTime.startTime && modalTime.endTime !== '24:00') {
      setError('End time must be after start time');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');

      if (modalMode === 'edit' && editingSchedule) {
        const formData = new FormData();
        formData.append('title', modalData.title);
        formData.append('target_date', editingSchedule.schedule_date);
        formData.append('slot_id', String(editingSchedule.slot_id));
        formData.append('start_time', `${modalTime.startTime}:00`);
        formData.append('end_time', modalTime.endTime === '24:00' ? '24:00:00' : `${modalTime.endTime}:00`);
        if (modalData.file) formData.append('media_file', modalData.file);

        const response = await axios.put(
          `${API_BASE_URL}/partner/channel/${channelId}/schedules/${editingSchedule.schedule_id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
        );

        if (response.data.success && response.data.data) {
          mergeScheduleUpdate(response.data.data, editingSchedule);
        }
        await fetchSchedules();
      } else {
        const slots = getSlotsInRange(modalTime.startTime, modalTime.endTime);
        if (slots.length === 0) {
          setError('Invalid time range selected');
          return;
        }

        const scheduleDate = selectedSlots[0]?.date;
        if (!scheduleDate) {
          setError('No date selected');
          return;
        }

        const formData = new FormData();
        formData.append('title', modalData.title);
        formData.append('schedule_date', scheduleDate);
        formData.append('slots', JSON.stringify(slots));
        if (modalData.file) formData.append('media_file', modalData.file);

        await axios.post(`${API_BASE_URL}/partner/channel/${channelId}/schedules`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        await fetchSchedules();
      }

      closeModal();
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
      await fetchSchedules();
    } catch (err) {
      console.error('Error deleting schedule:', err);
    }
  };

  const handleStartTimeChange = (startTime: string) => {
    const endOptions = getEndTimeOptions(startTime);
    const nextEnd = endOptions.some((o) => o.value === modalTime.endTime)
      ? modalTime.endTime
      : endOptions[0]?.value || '';
    setModalTime({ startTime, endTime: nextEnd });
  };

  const endTimeOptions = getEndTimeOptions(modalTime.startTime);
  const selectedScheduleDate = modalMode === 'edit' && editingSchedule
    ? editingSchedule.schedule_date
    : selectedSlots[0]?.date || '';

  // Get reordered days (today at top)
  const reorderedDays = getReorderedDays();
  const selectedTimeRange = modalTime.startTime && modalTime.endTime
    ? `${selectedScheduleDate} ${modalTime.startTime} - ${modalTime.endTime}`
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
                {reorderedDays.map((dayInfo, dayIdx) => {
                  const dateStr = formatDate(dayInfo.date);
                  const isToday = dayInfo.isToday;
                  const isPast = isPastDate(dateStr);
                  const daySchedules = schedules.filter((s) => s.schedule_date === dateStr);
                  const { startMap, coveredSet } = buildDayBlocks(dateStr, daySchedules);
                  const canInteract = !isPast || isToday;

                  return (
                    <tr key={dayIdx} className={`h-14 ${isToday ? 'bg-amber-50' : ''}`}>
                      <td className={`border px-3 py-2 font-medium sticky left-0 z-10 ${isToday ? 'bg-amber-100 text-amber-800' : 'bg-white text-gray-700'}`}>
                        <div className="text-sm">{dayInfo.dayName}</div>
                        <div className={`text-xs ${isToday ? 'text-amber-600' : 'text-gray-500'}`}>
                          {dayInfo.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {isToday && <span className="ml-1 font-bold">(Today)</span>}
                        </div>
                      </td>
                      {TIME_SLOTS.map((slot, timeIdx) => {
                        if (coveredSet.has(timeIdx) && !startMap.has(timeIdx)) {
                          return null;
                        }

                        const block = startMap.get(timeIdx);
                        const booked = !!block;
                        const selected = !booked && isSlotSelected(dateStr, slot.time);

                        let cellClass = 'border px-1 py-1 cursor-pointer transition-colors relative group text-center align-middle ';
                        if (booked) {
                          if (isPast && !isToday) {
                            cellClass += 'bg-gray-400 text-white cursor-default';
                          } else {
                            cellClass += isToday ? 'bg-green-400 text-white' : 'bg-green-500 text-white';
                          }
                        } else if (isPast && !isToday) {
                          cellClass += 'bg-gray-200 cursor-not-allowed';
                        } else if (selected) {
                          cellClass += 'bg-cyan-500 text-white';
                        } else {
                          cellClass += isToday ? 'bg-amber-50 hover:bg-cyan-100' : 'bg-gray-50 hover:bg-cyan-100';
                        }

                        if (block) {
                          return (
                            <td
                              key={timeIdx}
                              colSpan={block.colSpan}
                              className={cellClass}
                              title={`${block.title} (${block.start_time} - ${block.end_time})`}
                            >
                              <div className="flex items-center justify-between gap-1 px-1 min-h-[2.5rem]">
                                <div className="flex-1 min-w-0 text-left">
                                  <div className="text-xs font-semibold truncate leading-tight">{block.title}</div>
                                  <div className="text-[10px] opacity-90 leading-tight whitespace-nowrap">
                                    {block.start_time} - {block.end_time}
                                  </div>
                                </div>
                                {canInteract && (
                                  <div className="flex shrink-0 gap-0.5">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleEdit(block.representative); }}
                                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-green-600 rounded"
                                      title="Edit"
                                    >
                                      <Edit2 size={11} />
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDeleteSchedule(block.schedule_id, dateStr); }}
                                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-600 rounded"
                                      title="Delete"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td
                            key={timeIdx}
                            className={cellClass}
                            onMouseDown={() => canInteract && handleMouseDown(dateStr, slot.time)}
                            onMouseEnter={() => canInteract && handleMouseEnter(dateStr, slot.time)}
                            onClick={() => canInteract && !isDragging && handleSlotClick(dateStr, slot.time)}
                            title={`${slot.time}-${slot.endTime}`}
                          />
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
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded">
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                  <select
                    value={modalTime.startTime}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                  >
                    <option value="">Select start time</option>
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot.time} value={slot.time}>{slot.time}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                  <select
                    value={modalTime.endTime}
                    onChange={(e) => setModalTime({ ...modalTime, endTime: e.target.value })}
                    disabled={!modalTime.startTime}
                    className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-cyan-500 cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select end time</option>
                    {endTimeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Summary</label>
                  <p className="text-sm text-gray-600">
                    {modalTime.startTime && modalTime.endTime
                      ? `${getSlotsInRange(modalTime.startTime, modalTime.endTime).length} slot(s)`
                      : `${selectedSlots.length} slot(s) selected`}
                  </p>
                  {selectedTimeRange && <p className="text-xs text-gray-500 mt-1">{selectedTimeRange}</p>}
                  <p className="text-xs text-cyan-600 mt-2">Schedule will repeat weekly on the same day/time</p>
                </div>
              )}
              {modalMode === 'edit' && editingSchedule && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Editing</label>
                  <p className="text-sm text-gray-600">{editingSchedule.schedule_date}</p>
                  {editingSchedule.is_master && (
                    <p className="text-xs text-cyan-600 mt-1">Changes apply to this week only unless you edit the original master date.</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3 p-4 border-t">
              <button onClick={closeModal}
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

