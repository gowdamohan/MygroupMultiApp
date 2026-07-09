/**
 * Session cache for partner ad signed URLs.
 * Uses <img src="signed-url"> directly — no fetch() (Wasabi blocks CORS on fetch).
 * Browser HTTP cache handles repeat carousel loads for the same signed URL.
 */

const STORAGE_PREFIX = 'partner_ad_signed_v1:';
/** Slightly under server TTL (3600s) so we refresh before expiry */
const DEFAULT_TTL_SEC = 3500;

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

/**
 * Resolve display src: session cached signed URL → fresh signed URL from API.
 * Never uses fetch() — avoids Wasabi CORS errors in the browser.
 */
export function resolveAdImageSrc(
  imagePath: string | null | undefined,
  signedUrl: string | null | undefined,
  fallbackUrl: string | null | undefined
): string {
  if (imagePath) {
    const cached = getCachedSignedUrl(imagePath);
    if (cached) return cached;
    if (signedUrl) {
      setCachedSignedUrl(imagePath, signedUrl);
      return signedUrl;
    }
  }
  return signedUrl || fallbackUrl || '';
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
