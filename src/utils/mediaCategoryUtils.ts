/** Shared helpers for Mymedia channel category detection (TV, Radio, E-paper, Magazines, etc.) */

export interface CategoryRef {
  category_name?: string;
  category_type?: string;
}

export interface ChannelCategoryContext {
  category?: CategoryRef | null;
  parentCategory?: CategoryRef | null;
}

const norm = (value?: string | null): string => (value || '').trim().toLowerCase();

const matchesAny = (text: string, tokens: string[]): boolean =>
  tokens.some((t) => text.includes(t));

export const getParentCategoryKey = (ctx: ChannelCategoryContext | null | undefined): string => {
  if (!ctx) return '';
  const parent = ctx.parentCategory;
  const cat = ctx.category;
  return norm(parent?.category_type) || norm(parent?.category_name) || norm(cat?.category_type) || '';
};

export const isTVOrRadioCategory = (ctx: ChannelCategoryContext | null | undefined): boolean => {
  const key = getParentCategoryKey(ctx);
  return matchesAny(key, ['tv', 'radio', 'television']);
};

export const isEPaperCategory = (ctx: ChannelCategoryContext | null | undefined): boolean => {
  const parts = [
    norm(ctx?.parentCategory?.category_type),
    norm(ctx?.parentCategory?.category_name),
    norm(ctx?.category?.category_type),
    norm(ctx?.category?.category_name)
  ];
  return parts.some((p) =>
    matchesAny(p, ['e-paper', 'epaper', 'e paper', 'newspaper', 'e_paper'])
  );
};

export const isMagazineCategory = (ctx: ChannelCategoryContext | null | undefined): boolean => {
  const parts = [
    norm(ctx?.category?.category_type),
    norm(ctx?.category?.category_name),
    norm(ctx?.parentCategory?.category_type),
    norm(ctx?.parentCategory?.category_name)
  ];
  return parts.some((p) => matchesAny(p, ['magazine', 'magazines', 'periodical']));
};

export const isPrintMediaCategory = (ctx: ChannelCategoryContext | null | undefined): boolean =>
  isEPaperCategory(ctx) || isMagazineCategory(ctx);

/**
 * Parse periodical_schedule from API/DB (JSON column, JSON string, or double-encoded string).
 */
export const parsePeriodicalSchedule = (schedule: unknown): Record<string, unknown> => {
  let value: unknown = schedule;

  if (value == null || value === '') return {};

  // Sequelize JSON / plain object
  if (typeof value === 'object' && !Array.isArray(value)) {
    return normalizePeriodicalSchedule(value as Record<string, unknown>);
  }

  // String: may be JSON once or twice
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return {};
    try {
      value = JSON.parse(trimmed);
      if (typeof value === 'string') {
        const inner = value.trim();
        if (inner.startsWith('{') || inner.startsWith('[')) {
          try {
            value = JSON.parse(inner);
          } catch {
            /* keep single parse result */
          }
        }
      }
    } catch {
      return {};
    }
  }

  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return normalizePeriodicalSchedule(value as Record<string, unknown>);
  }

  return {};
};

/**
 * Normalize schedule keys/values to match MediaRegistrationForm output.
 */
export const normalizePeriodicalSchedule = (
  schedule: Record<string, unknown>
): Record<string, unknown> => {
  const out: Record<string, unknown> = { ...schedule };

  // months: array (checkboxes) — may arrive as JSON string
  if (typeof out.months === 'string') {
    try {
      const parsed = JSON.parse(out.months);
      out.months = Array.isArray(parsed) ? parsed : [];
    } catch {
      out.months = [];
    }
  }
  if (out.months != null && !Array.isArray(out.months)) {
    out.months = [];
  }

  // Numeric schedule fields stored as strings in some DB drivers
  for (const key of ['date', 'date1', 'date2'] as const) {
    if (out[key] != null && out[key] !== '') {
      const n = parseInt(String(out[key]), 10);
      if (!Number.isNaN(n)) out[key] = n;
    }
  }

  // month1..month6 — keep month names as strings
  for (let i = 1; i <= 6; i++) {
    const key = `month${i}`;
    if (out[key] != null && typeof out[key] !== 'string') {
      out[key] = String(out[key]);
    }
  }

  if (out.month != null && typeof out.month !== 'string') {
    out.month = String(out.month);
  }

  if (out.day != null && typeof out.day !== 'string') {
    out.day = String(out.day);
  }

  return out;
};

/** Stable key for useMemo when schedule object identity changes. */
export const periodicalScheduleSignature = (schedule: Record<string, unknown>): string => {
  const keys = Object.keys(schedule).sort();
  const normalized: Record<string, unknown> = {};
  keys.forEach((k) => {
    normalized[k] = schedule[k];
  });
  return JSON.stringify(normalized);
};
