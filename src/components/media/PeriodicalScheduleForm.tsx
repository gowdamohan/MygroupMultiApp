import React from 'react';
import { MONTHS, PeriodicalType } from '../../utils/periodicalSlots';

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface PeriodicalScheduleFormProps {
  periodicalType: PeriodicalType | string;
  schedule: Record<string, unknown>;
  onTypeChange: (type: PeriodicalType | '') => void;
  onScheduleChange: (key: string, value: unknown) => void;
}

export const PeriodicalScheduleForm: React.FC<PeriodicalScheduleFormProps> = ({
  periodicalType,
  schedule,
  onTypeChange,
  onScheduleChange
}) => {
  const renderScheduleFields = () => {
    if (!periodicalType) return null;

    switch (periodicalType) {
      case 'Weekly':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Day</label>
            <select
              value={String(schedule.day || '')}
              onChange={(e) => onScheduleChange('day', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Select a day</option>
              {weekDays.map((day) => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
        );

      case 'Bi-weekly':
      case 'Fortnightly':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Two Dates (1-31)</label>
            <div className="grid grid-cols-2 gap-4">
              <select
                value={String(schedule.date1 || '')}
                onChange={(e) => onScheduleChange('date1', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="">First date</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((date) => (
                  <option key={date} value={date}>{date}</option>
                ))}
              </select>
              <select
                value={String(schedule.date2 || '')}
                onChange={(e) => onScheduleChange('date2', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Second date</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((date) => (
                  <option key={date} value={date}>{date}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'Monthly':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Date (1-31)</label>
            <select
              value={String(schedule.date || '')}
              onChange={(e) => onScheduleChange('date', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Select a date</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((date) => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          </div>
        );

      case 'Bimonthly':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select 6 Months (Bimonthly)</label>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <select
                  key={num}
                  value={String(schedule[`month${num}`] || '')}
                  onChange={(e) => onScheduleChange(`month${num}`, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Issue {num}</option>
                  {MONTHS.map((month) => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              ))}
            </div>
          </div>
        );

      case 'Quarterly':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select 4 Months (Quarterly)</label>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((quarter) => (
                <select
                  key={quarter}
                  value={String(schedule[`month${quarter}`] || '')}
                  onChange={(e) => onScheduleChange(`month${quarter}`, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Quarter {quarter}</option>
                  {MONTHS.map((month) => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              ))}
            </div>
          </div>
        );

      case 'Half-yearly':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select 2 Months (Half-yearly)</label>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2].map((half) => (
                <select
                  key={half}
                  value={String(schedule[`month${half}`] || '')}
                  onChange={(e) => onScheduleChange(`month${half}`, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Half {half}</option>
                  {MONTHS.map((month) => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              ))}
            </div>
          </div>
        );

      case 'Annually':
      case 'Yearly':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Month</label>
            <select
              value={String(schedule.month || '')}
              onChange={(e) => onScheduleChange('month', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Select a month</option>
              {MONTHS.map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
        );

      case 'Seasonal':
      case 'Specialized':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Months of Publication</label>
            <div className="grid grid-cols-3 gap-2">
              {MONTHS.map((month) => {
                const selected = ((schedule.months as string[]) || []).includes(month);
                return (
                  <label key={month} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(e) => {
                        const current = (schedule.months as string[]) || [];
                        const updated = e.target.checked
                          ? [...current, month]
                          : current.filter((m) => m !== month);
                        onScheduleChange('months', updated);
                      }}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm">{month}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );

      case 'Others':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Describe Publication Schedule</label>
            <textarea
              value={String(schedule.description || '')}
              onChange={(e) => onScheduleChange('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="Describe your publication schedule..."
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Periodicals Type</label>
        <select
          value={periodicalType}
          onChange={(e) => onTypeChange(e.target.value as PeriodicalType | '')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Select periodical type</option>
          <option value="Weekly">Weekly</option>
          <option value="Fortnightly">Bi-weekly / Fortnightly</option>
          <option value="Monthly">Monthly</option>
          <option value="Bimonthly">Bimonthly</option>
          <option value="Quarterly">Quarterly</option>
          <option value="Half-yearly">Half-yearly</option>
          <option value="Annually">Annually / Yearly</option>
          <option value="Specialized">Specialized</option>
          <option value="Seasonal">Seasonal</option>
          <option value="Others">Others</option>
        </select>
      </div>
      {renderScheduleFields()}
    </div>
  );
};

export default PeriodicalScheduleForm;
