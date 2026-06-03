/** Resolve viewer location from user_registration_form for channel filtering */

export interface ViewerLocationIds {
  countryId: number | null;
  stateId: number | null;
  districtId: number | null;
}

export interface CountryOption {
  id: number;
  country: string;
  nationality?: string;
}

type ProfileLike = Record<string, unknown> | null | undefined;

export const getLocationFromProfile = (profile: ProfileLike): ViewerLocationIds | null => {
  if (!profile) return null;

  const countryRaw = profile.set_country ?? profile.country;
  const stateRaw = profile.set_state ?? profile.state;
  const districtRaw = profile.set_district ?? profile.district;

  const countryId = countryRaw != null && countryRaw !== '' ? Number(countryRaw) : null;
  const stateId = stateRaw != null && stateRaw !== '' ? Number(stateRaw) : null;
  const districtId = districtRaw != null && districtRaw !== '' ? Number(districtRaw) : null;

  if (!countryId && !stateId && !districtId && !profile.nationality) {
    return null;
  }

  return {
    countryId: Number.isNaN(countryId as number) ? null : countryId,
    stateId: Number.isNaN(stateId as number) ? null : stateId,
    districtId: Number.isNaN(districtId as number) ? null : districtId,
  };
};

/** Match registration nationality string to country_tbl id */
export const resolveCountryIdFromNationality = (
  countries: CountryOption[],
  nationality: string
): number | null => {
  const norm = nationality.trim().toLowerCase();
  if (!norm) return null;

  const match = countries.find((c) => {
    const nat = (c.nationality || '').trim().toLowerCase();
    const name = (c.country || '').trim().toLowerCase();
    return nat === norm || name === norm || nat.includes(norm) || name.includes(norm);
  });

  return match?.id ?? null;
};

export const resolveViewerLocation = (
  profile: ProfileLike,
  countries: CountryOption[]
): ViewerLocationIds | null => {
  const base = getLocationFromProfile(profile);
  if (!base) return null;

  let countryId = base.countryId;
  if (!countryId && profile?.nationality && typeof profile.nationality === 'string') {
    countryId = resolveCountryIdFromNationality(countries, profile.nationality);
  }

  if (!countryId && !base.stateId && !base.districtId) {
    return null;
  }

  return {
    countryId,
    stateId: base.stateId,
    districtId: base.districtId,
  };
};
