/**
 * Session cache for partner ad signed URLs + in-memory blob cache
 * so carousel rotation does not re-download from Wasabi.
 */

const STORAGE_PREFIX = 'partner_ad_signed_v1:';
/** Slightly under server TTL (3600s) so we refresh before expiry */
const DEFAULT_TTL_SEC = 3500;

const blobUrlByPath = new Map<string, string>();

interface CachedSignedEntry {
  url: string;
  expiresAt: number;
}

export function getCachedSignedUrl(imagePath: string): string | null {
  if (!imagePath) return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + imagePath);
    if (!raw) return null;
    const entry: CachedSignedEntry = JSON.parse(raw);
    if (Date.now() < entry.expiresAt) return entry.url;
    sessionStorage.removeItem(STORAGE_PREFIX + imagePath);
  } catch {
    /* ignore corrupt cache */
  }
  return null;
}

export function setCachedSignedUrl(
  imagePath: string,
  url: string,
  ttlSec = DEFAULT_TTL_SEC
): void {
  if (!imagePath || !url) return;
  try {
    const entry: CachedSignedEntry = {
      url,
      expiresAt: Date.now() + ttlSec * 1000,
    };
    sessionStorage.setItem(STORAGE_PREFIX + imagePath, JSON.stringify(entry));
  } catch {
    /* quota exceeded — skip */
  }
}

export function getCachedBlobUrl(imagePath: string): string | null {
  if (!imagePath) return null;
  return blobUrlByPath.get(imagePath) ?? null;
}

/**
 * Resolve display src: blob cache → session signed URL → fetch once → blob URL.
 */
export async function resolveAdImageSrc(
  imagePath: string | null | undefined,
  signedUrl: string | null | undefined,
  fallbackUrl: string | null | undefined
): Promise<string> {
  const cacheKey = imagePath || signedUrl || fallbackUrl || '';
  if (!cacheKey) return '';

  if (imagePath) {
    const blob = blobUrlByPath.get(imagePath);
    if (blob) return blob;
  }

  let fetchUrl = signedUrl || fallbackUrl || '';
  if (imagePath) {
    const cachedSigned = getCachedSignedUrl(imagePath);
    if (cachedSigned) {
      fetchUrl = cachedSigned;
    } else if (signedUrl) {
      setCachedSignedUrl(imagePath, signedUrl);
    }
  }

  if (!fetchUrl) return '';

  try {
    const res = await fetch(fetchUrl);
    if (!res.ok) return fetchUrl;
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    if (imagePath) {
      blobUrlByPath.set(imagePath, blobUrl);
    } else {
      blobUrlByPath.set(cacheKey, blobUrl);
    }
    return blobUrl;
  } catch {
    return fetchUrl;
  }
}

export function applySignedUrlCacheToAds<
  T extends { image_path?: string | null; signed_url?: string | null }
>(ads: T[]): T[] {
  return ads.map((ad) => {
    if (!ad.image_path) {
      return ad;
    }
    const cached = getCachedSignedUrl(ad.image_path);
    if (cached) {
      return { ...ad, signed_url: cached };
    }
    if (ad.signed_url) {
      setCachedSignedUrl(ad.image_path, ad.signed_url);
    }
    return ad;
  });
}
