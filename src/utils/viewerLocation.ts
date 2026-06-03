/**
 * Resolve viewer location IDs from user_registration_form.
 * FK columns reference country_tbl, state_tbl, district_tbl (set_* preferred over registration fields).
 */

export interface ViewerLocationIds {
  countryId: number;
  stateId: number | null;
  districtId: number | null;
}

export interface CountryOption {
  id: number;
  country: string;
  nationality?: string;
}

export interface StateOption {
  id: number;
  state: string;
  country_id?: number;
}

export interface DistrictOption {
  id: number;
  district: string;
  state_id?: number;
}

type ProfileLike = Record<string, unknown> | null | undefined;

/** Extract numeric PK from id field, nested Sequelize row, or string. */
export const pickGeoTableId = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? null : n;
  }
  if (typeof value === 'object') {
    const row = value as Record<string, unknown>;
    if (row.id != null) return pickGeoTableId(row.id);
  }
  return null;
};

/** user_registration_form row from API user.profile, or null if missing */
export const extractRegistrationProfile = (source: ProfileLike): ProfileLike => {
  if (!source || typeof source !== 'object') return null;
  const obj = source as Record<string, unknown>;
  if (obj.profile != null && typeof obj.profile === 'object') {
    return obj.profile as Record<string, unknown>;
  }
  if ('user_id' in obj && ('country' in obj || 'set_country' in obj || 'nationality' in obj)) {
    return obj;
  }
  return null;
};

/** True when user_registration_form exists and has at least one location field */
export const hasRegistrationLocationData = (source: ProfileLike): boolean => {
  const reg = extractRegistrationProfile(source);
  if (!reg) return false;
  return !!(
    pickGeoTableId(reg.set_country) ??
    pickGeoTableId(reg.country) ??
    pickGeoTableId(reg.set_state) ??
    pickGeoTableId(reg.state) ??
    (typeof reg.nationality === 'string' && reg.nationality.trim())
  );
};

/**
 * Read location FK ids from user_registration_form fields.
 * Priority: set_country/set_state/set_district → country/state/district
 */
export const getLocationFromRegistration = (source: ProfileLike): ViewerLocationIds | null => {
  const reg = extractRegistrationProfile(source);
  if (!reg) return null;

  const countryId =
    pickGeoTableId(reg.set_country) ??
    pickGeoTableId(reg.setCountryData) ??
    pickGeoTableId(reg.country) ??
    pickGeoTableId(reg.countryData);

  const stateId =
    pickGeoTableId(reg.set_state) ??
    pickGeoTableId(reg.setStateData) ??
    pickGeoTableId(reg.state) ??
    pickGeoTableId(reg.stateData);

  const districtId =
    pickGeoTableId(reg.set_district) ??
    pickGeoTableId(reg.setDistrictData) ??
    pickGeoTableId(reg.district) ??
    pickGeoTableId(reg.districtData);

  if (!countryId && !stateId && !districtId && !reg.nationality) {
    return null;
  }

  if (!countryId) {
    return null;
  }

  return { countryId, stateId, districtId };
};

/** Match registration nationality to country_tbl.id */
export const resolveCountryIdFromNationality = (
  countries: CountryOption[],
  nationality: string
): number | null => {
  const norm = nationality.trim().toLowerCase();
  if (!norm) return null;

  const match = countries.find((c) => {
    const nat = (c.nationality || '').trim().toLowerCase();
    const name = (c.country || '').trim().toLowerCase();
    return nat === norm || name === norm;
  });

  return match?.id ?? null;
};

/** Resolve country from profile; nationality fallback uses country_tbl list */
export const resolveViewerLocation = (
  source: ProfileLike,
  countries: CountryOption[]
): ViewerLocationIds | null => {
  const base = getLocationFromRegistration(source);
  if (!base) return null;

  let countryId = base.countryId || null;
  const reg = extractRegistrationProfile(source);

  if (!countryId && reg?.nationality && typeof reg.nationality === 'string') {
    countryId = resolveCountryIdFromNationality(countries, reg.nationality);
  }

  if (!countryId) return null;

  return {
    countryId,
    stateId: base.stateId,
    districtId: base.districtId
  };
};

/** Keep only ids that exist in loaded country_tbl / state_tbl / district_tbl rows */
export const validateViewerLocationAgainstGeoLists = (
  location: ViewerLocationIds,
  countries: CountryOption[],
  states: StateOption[],
  districts: DistrictOption[]
): ViewerLocationIds => {
  const country = countries.find((c) => c.id === location.countryId);
  if (!country) {
    return { countryId: 0, stateId: null, districtId: null };
  }

  let stateId = location.stateId;
  if (stateId != null && !states.some((s) => s.id === stateId)) {
    stateId = null;
  }

  let districtId = location.districtId;
  if (districtId != null && !districts.some((d) => d.id === districtId)) {
    districtId = null;
  }

  return { countryId: country.id, stateId, districtId };
};

export interface ViewerLocationApiResponse {
  country_id: number | null;
  state_id: number | null;
  district_id: number | null;
  country_name?: string;
  state_name?: string;
  district_name?: string;
}

export const locationFromApiResponse = (
  data: ViewerLocationApiResponse | null | undefined
): ViewerLocationIds | null => {
  if (!data?.country_id) return null;
  return {
    countryId: data.country_id,
    stateId: data.state_id ?? null,
    districtId: data.district_id ?? null
  };
};
