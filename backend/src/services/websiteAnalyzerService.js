/**
 * Fetch and parse a website URL for name, logo, and latest content items.
 */

const FETCH_TIMEOUT_MS = 12_000;

const resolveUrl = (href, baseUrl) => {
  if (!href || href.startsWith('data:')) return null;
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return null;
  }
};

const stripHtml = (html) =>
  (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

const getMetaContent = (html, key, attr = 'name') => {
  const re1 = new RegExp(`<meta[^>]*${attr}=["']${key}["'][^>]*content=["']([^"']+)["']`, 'i');
  const re2 = new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*${attr}=["']${key}["']`, 'i');
  return (html.match(re1) || html.match(re2))?.[1]?.trim() || '';
};

const extractWebsiteName = (html) => {
  const ogSite = getMetaContent(html, 'og:site_name', 'property');
  if (ogSite) return ogSite;

  const metaTitle = getMetaContent(html, 'title');
  if (metaTitle) return metaTitle;

  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || '';
  if (!titleTag) return '';

  return titleTag
    .replace(/\s*[|\-–—]\s*.+$/, '')
    .trim() || titleTag;
};

const isLikelyLogoUrl = (url) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (lower.includes('social-icon') || lower.includes('sprite') || lower.includes('placeholder')) {
    return false;
  }
  return (
    lower.includes('logo') ||
    lower.includes('/brand') ||
    /\.(png|jpe?g|webp|svg)(\?|$)/i.test(lower)
  );
};

const extractImgSrcByClass = (html, classPattern) => {
  const re1 = new RegExp(
    `<img[^>]*class=["'][^"']*${classPattern}[^"']*["'][^>]*src=["']([^"']+)["']`,
    'i'
  );
  const re2 = new RegExp(
    `<img[^>]*src=["']([^"']+)["'][^>]*class=["'][^"']*${classPattern}[^"']*["']`,
    'i'
  );
  return (html.match(re1) || html.match(re2))?.[1] || '';
};

const extractWebsiteLogo = (html, pageUrl) => {
  const candidates = [];

  const brandLogo = extractImgSrcByClass(html, 'brand-logo');
  if (brandLogo) candidates.push(brandLogo);

  const siteLogo = extractImgSrcByClass(html, 'site-logo');
  if (siteLogo) candidates.push(siteLogo);

  const footerLogo = extractImgSrcByClass(html, 'footer-logo');
  if (footerLogo) candidates.push(footerLogo);

  const genericLogo = extractImgSrcByClass(html, 'logo');
  if (genericLogo) candidates.push(genericLogo);

  const ogImage = getMetaContent(html, 'og:image', 'property');
  if (ogImage) candidates.push(ogImage);

  const iconMatch =
    html.match(/<link[^>]*rel=["'](?:shortcut icon|icon|apple-touch-icon)[^"']*["'][^>]*href=["']([^"']+)["']/i) ||
    html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut icon|icon|apple-touch-icon)[^"']*["']/i);
  if (iconMatch) candidates.push(iconMatch[1]);

  for (const candidate of candidates) {
    const resolved = resolveUrl(candidate, pageUrl);
    if (resolved && isLikelyLogoUrl(resolved)) return resolved;
  }

  const first = candidates.find((c) => resolveUrl(c, pageUrl));
  return first ? resolveUrl(first, pageUrl) : null;
};

const extractLatestUpdatesFromHtml = (html, pageUrl, maxItems = 12) => {
  const items = [];
  const seen = new Set();

  const titleDivRegex = /<div[^>]*id=["']titleDiv["'][^>]*>([\s\S]*?)<\/div>/gi;
  let match;
  while ((match = titleDivRegex.exec(html)) !== null && items.length < maxItems) {
    const block = match[1];
    const linkMatch = block.match(/<a[^>]*href=["']([^"']+)["']/i);
    if (!linkMatch) continue;

    const url = resolveUrl(linkMatch[1], pageUrl);
    if (!url || seen.has(url)) continue;

    const title = stripHtml(block.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i)?.[1] || '');
    const description = stripHtml(block.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] || '');
    const publishedAt = stripHtml(block.match(/<small[^>]*>([\s\S]*?)<\/small>/i)?.[1] || '');

    if (!title && (!description || description === '...')) continue;

    seen.add(url);
    items.push({
      title: title || description.substring(0, 100),
      url,
      description: description && description !== '...' ? description : '',
      publishedAt,
      image: '',
    });
  }

  if (items.length > 0) return items;

  const articleRegex = /<article[\s\S]*?<\/article>/gi;
  while ((match = articleRegex.exec(html)) !== null && items.length < maxItems) {
    const block = match[0];
    const linkMatch = block.match(/<a[^>]*href=["']([^"']+)["']/i);
    const heading = block.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i)?.[1];
    const title = stripHtml(heading || '');
    if (!title || !linkMatch) continue;
    const url = resolveUrl(linkMatch[1], pageUrl);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    items.push({ title, url, description: '', publishedAt: '', image: '' });
  }

  return items;
};

const fetchText = async (url) => {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MyMediaBot/1.0; +https://mymedia.app)',
        Accept: 'text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8',
      },
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Analyze a website URL and return structured preview data.
 * @param {string} url
 * @returns {Promise<{ websiteName: string, websiteLogoUrl: string|null, latestUpdates: Array, sourceUrl: string }>}
 */
export const analyzeWebsiteUrl = async (url) => {
  const normalizedUrl = (url || '').trim();
  if (!normalizedUrl) {
    throw new Error('URL is required');
  }

  const html = await fetchText(normalizedUrl);
  const websiteName = extractWebsiteName(html);
  const websiteLogoUrl = extractWebsiteLogo(html, normalizedUrl);
  const latestUpdates = extractLatestUpdatesFromHtml(html, normalizedUrl);

  return {
    websiteName: websiteName || new URL(normalizedUrl).hostname.replace(/^www\./, ''),
    websiteLogoUrl,
    latestUpdates,
    sourceUrl: normalizedUrl,
  };
};
