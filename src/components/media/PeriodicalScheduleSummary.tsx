import React from 'react';
import { Lock } from 'lucide-react';
import { normalizePeriodicalType } from '../../utils/periodicalSlots';

interface PeriodicalScheduleSummaryProps {
  periodicalType?: string | null;
  schedule: Record<string, unknown>;
}

/** Human-readable schedule line for read-only display (matches registration fields). */
export function formatPeriodicalScheduleSummary(
  periodicalType: string,
  schedule: Record<string, unknown>
): { scheduleLabel: string; scheduleValue: string } {
  const type = normalizePeriodicalType(periodicalType);

  switch (type) {
    case 'Weekly':
      return {
        scheduleLabel: 'Publication Day',
        scheduleValue: schedule.day ? String(schedule.day) : '—'
      };
    case 'Fortnightly':
      return {
        scheduleLabel: 'Publication Dates',
        scheduleValue:
          schedule.date1 != null && schedule.date2 != null
            ? `Day ${schedule.date1} & Day ${schedule.date2} each month`
            : schedule.date1 != null
              ? `Day ${schedule.date1}`
              : '—'
      };
    case 'Monthly':
      return {
        scheduleLabel: 'Publication Date',
        scheduleValue: schedule.date != null ? `Day ${schedule.date} of each month` : '—'
      };
    case 'Bimonthly': {
      const months = [1, 2, 3, 4, 5, 6]
        .map((i) => schedule[`month${i}`])
        .filter(Boolean)
        .join(', ');
      return { scheduleLabel: 'Bimonthly Issues', scheduleValue: months || '—' };
    }
    case 'Quarterly': {
      const months = [1, 2, 3, 4]
        .map((i) => schedule[`month${i}`])
        .filter(Boolean)
        .join(', ');
      return { scheduleLabel: 'Quarterly Issues', scheduleValue: months || '—' };
    }
    case 'Half-yearly': {
      const months = [1, 2]
        .map((i) => schedule[`month${i}`])
        .filter(Boolean)
        .join(', ');
      return { scheduleLabel: 'Half-yearly Issues', scheduleValue: months || '—' };
    }
    case 'Annually':
      return {
        scheduleLabel: 'Annual Issue Month',
        scheduleValue: schedule.month ? String(schedule.month) : '—'
      };
    case 'Specialized':
    case 'Seasonal': {
      const months = (schedule.months as string[]) || [];
      return {
        scheduleLabel: 'Publication Months',
        scheduleValue: months.length > 0 ? months.join(', ') : '—'
      };
    }
    case 'Others':
      return {
        scheduleLabel: 'Schedule Notes',
        scheduleValue: schedule.description ? String(schedule.description) : '—'
      };
    default:
      return { scheduleLabel: 'Schedule', scheduleValue: '—' };
  }
}

export const PeriodicalScheduleSummary: React.FC<PeriodicalScheduleSummaryProps> = ({
  periodicalType,
  schedule
}) => {
  const type = normalizePeriodicalType(periodicalType);
  const { scheduleLabel, scheduleValue } = formatPeriodicalScheduleSummary(type, schedule);

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 border-b border-teal-100 text-teal-800 text-sm">
        <Lock size={14} className="flex-shrink-0" />
        <span>Publication schedule from channel registration (read-only)</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
            Periodicals Type
          </p>
          <p className="text-base font-semibold text-gray-900">{type || '—'}</p>
        </div>
        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
            {scheduleLabel}
          </p>
          <p className="text-base font-semibold text-gray-900">{scheduleValue}</p>
        </div>
      </div>
    </div>
  );
};

export default PeriodicalScheduleSummary;
