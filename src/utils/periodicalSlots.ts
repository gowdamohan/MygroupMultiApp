export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;

export type PeriodicalType =
  | 'Weekly'
  | 'Bi-weekly'
  | 'Fortnightly'
  | 'Monthly'
  | 'Bimonthly'
  | 'Quarterly'
  | 'Half-yearly'
  | 'Annually'
  | 'Yearly'
  | 'Specialized'
  | 'Seasonal'
  | 'Others'
  | '';

export interface UploadSlot {
  month: number;
  date: number;
  label: string;
  slotId?: string;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

/**
 * Map DB / registration values to canonical types used by slot logic and UI.
 * Registration saves ENUM values; legacy rows may use Bi-weekly or Yearly.
 */
export const normalizePeriodicalType = (type?: string | null): string => {
  if (!type) return '';
  const t = type.trim();
  const lower = t.toLowerCase().replace(/\s+/g, ' ');

  if (lower === 'bi-weekly' || lower === 'biweekly' || lower === 'fortnightly') return 'Fortnightly';
  if (lower === 'yearly' || lower === 'annually') return 'Annually';
  if (lower === 'half-yearly' || lower === 'half yearly' || lower === 'halfyearly') return 'Half-yearly';
  if (lower === 'seasonal') return 'Seasonal';
  if (lower === 'specialized') return 'Specialized';
  if (lower === 'weekly') return 'Weekly';
  if (lower === 'monthly') return 'Monthly';
  if (lower === 'bimonthly') return 'Bimonthly';
  if (lower === 'quarterly') return 'Quarterly';
  if (lower === 'others') return 'Others';

  // Exact ENUM match (case-sensitive fallback)
  if (t === 'Yearly') return 'Annually';
  if (t === 'Bi-weekly') return 'Fortnightly';

  return t;
};

const monthNameToIndex = (name: string): number => {
  const trimmed = name.trim();
  const idx = MONTHS.findIndex((m) => m.toLowerCase() === trimmed.toLowerCase());
  return idx >= 0 ? idx + 1 : 0;
};

const scheduleMonth = (schedule: Record<string, unknown>, key: string): string | null => {
  const val = schedule[key];
  if (val == null || val === '') return null;
  return String(val).trim();
};

/** All publication dates for a weekday in a calendar year (matches weekly registration `day`). */
export const generateWeeklySlotsForYear = (year: number, dayName: string): UploadSlot[] => {
  const targetDow = WEEKDAYS.findIndex((d) => d.toLowerCase() === dayName.trim().toLowerCase());
  if (targetDow < 0) return [];

  const slots: UploadSlot[] = [];
  const cursor = new Date(year, 0, 1);
  while (cursor.getDay() !== targetDow) {
    cursor.setDate(cursor.getDate() + 1);
  }

  while (cursor.getFullYear() === year) {
    const month = cursor.getMonth() + 1;
    const date = cursor.getDate();
    slots.push({
      month,
      date,
      slotId: `${year}-${month}-${date}`,
      label: cursor.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    });
    cursor.setDate(cursor.getDate() + 7);
  }

  return slots;
};

export const getMagazineUploadSlots = (
  periodicalType?: string | null,
  periodicalSchedule?: Record<string, unknown> | null,
  year: number = new Date().getFullYear()
): UploadSlot[] => {
  const schedule = periodicalSchedule || {};
  const type = normalizePeriodicalType(periodicalType);

  switch (type) {
    case 'Weekly': {
      const day = String(schedule.day || '').trim();
      if (day) {
        const weekly = generateWeeklySlotsForYear(year, day);
        if (weekly.length > 0) return weekly;
      }
      // Fallback if day not set yet
      return MONTHS.map((m, i) => ({
        month: i + 1,
        date: 1,
        slotId: `${year}-${i + 1}-1`,
        label: day ? `${m} (${day})` : m
      }));
    }

    case 'Fortnightly': {
      const d1 = parseInt(String(schedule.date1), 10) || 1;
      const d2 = parseInt(String(schedule.date2), 10) || 15;
      const slots: UploadSlot[] = [];
      MONTHS.forEach((m, i) => {
        const month = i + 1;
        slots.push({
          month,
          date: d1,
          slotId: `${year}-${month}-${d1}-1`,
          label: `${m} - Issue 1 (Day ${d1})`
        });
        slots.push({
          month,
          date: d2,
          slotId: `${year}-${month}-${d2}-2`,
          label: `${m} - Issue 2 (Day ${d2})`
        });
      });
      return slots;
    }

    case 'Monthly': {
      const day = parseInt(String(schedule.date), 10) || 1;
      return MONTHS.map((m, i) => ({
        month: i + 1,
        date: day,
        slotId: `${year}-${i + 1}-${day}`,
        label: `${m} (Day ${day})`
      }));
    }

    case 'Bimonthly': {
      const biMonths: UploadSlot[] = [];
      for (let i = 1; i <= 6; i++) {
        const monthName = scheduleMonth(schedule, `month${i}`);
        if (!monthName) continue;
        const monthIdx = monthNameToIndex(monthName);
        biMonths.push({
          month: monthIdx > 0 ? monthIdx : i * 2 - 1,
          date: 1,
          slotId: `${year}-bimonthly-${i}`,
          label: monthName
        });
      }
      return biMonths;
    }

    case 'Quarterly': {
      const qMonths: UploadSlot[] = [];
      for (let i = 1; i <= 4; i++) {
        const monthName = scheduleMonth(schedule, `month${i}`);
        if (!monthName) continue;
        const monthIdx = monthNameToIndex(monthName);
        qMonths.push({
          month: monthIdx > 0 ? monthIdx : i * 3 - 2,
          date: 1,
          slotId: `${year}-quarterly-${i}`,
          label: `Q${i} - ${monthName}`
        });
      }
      return qMonths;
    }

    case 'Half-yearly': {
      const hMonths: UploadSlot[] = [];
      for (let i = 1; i <= 2; i++) {
        const monthName = scheduleMonth(schedule, `month${i}`);
        if (!monthName) continue;
        const monthIdx = monthNameToIndex(monthName);
        hMonths.push({
          month: monthIdx > 0 ? monthIdx : i * 6 - 5,
          date: 1,
          slotId: `${year}-half-${i}`,
          label: `H${i} - ${monthName}`
        });
      }
      return hMonths;
    }

    case 'Annually': {
      const monthName = scheduleMonth(schedule, 'month') || 'January';
      const monthIdx = monthNameToIndex(monthName);
      return [
        {
          month: monthIdx > 0 ? monthIdx : 1,
          date: 1,
          slotId: `${year}-annual`,
          label: monthName
        }
      ];
    }

    case 'Specialized':
    case 'Seasonal': {
      const selectedMonths = (schedule.months as string[]) || [];
      if (selectedMonths.length === 0) return [];
      return selectedMonths.map((m, idx) => {
        const monthIdx = monthNameToIndex(m);
        return {
          month: monthIdx > 0 ? monthIdx : idx + 1,
          date: 1,
          slotId: `${year}-seasonal-${monthIdx || idx}`,
          label: m
        };
      });
    }

    case 'Others':
      return MONTHS.map((m, i) => ({
        month: i + 1,
        date: 1,
        slotId: `${year}-${i + 1}-1`,
        label: m
      }));

    default:
      return [];
  }
};
