/**
 * Lightweight PDF page renderer — one page at a time, with shared caches.
 * Uses same-origin stream URL for reliable range requests on mobile/production.
 */
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { getDocumentStreamUrl } from './pdfViewer';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const docCache = new Map<number, pdfjsLib.PDFDocumentProxy>();
const pageImageCache = new Map<string, string>();
const pageCountCache = new Map<number, number>();

let thumbActive = 0;
const THUMB_MAX_CONCURRENT = 2;
const thumbQueue: (() => void)[] = [];

function acquireThumbSlot(): Promise<void> {
  if (thumbActive < THUMB_MAX_CONCURRENT) {
    thumbActive++;
    return Promise.resolve();
  }
  return new Promise((resolve) => thumbQueue.push(resolve));
}

function releaseThumbSlot() {
  thumbActive--;
  const next = thumbQueue.shift();
  if (next) {
    thumbActive++;
    next();
  }
}

export function getCachedPageImage(documentId: number, pageNum = 1): string | null {
  return pageImageCache.get(`${documentId}-${pageNum}`) ?? null;
}

export function resolvePdfUrl(documentId: number, src?: string): string {
  if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
    return src;
  }
  return getDocumentStreamUrl(documentId);
}

export async function openPdfDocument(
  documentId: number,
  src?: string,
): Promise<pdfjsLib.PDFDocumentProxy> {
  if (docCache.has(documentId)) return docCache.get(documentId)!;

  const url = resolvePdfUrl(documentId, src);
  const pdf = await pdfjsLib.getDocument({
    url,
    withCredentials: false,
    disableAutoFetch: true,
    disableStream: false,
    rangeChunkSize: 65536,
  }).promise;

  docCache.set(documentId, pdf);
  pageCountCache.set(documentId, pdf.numPages);
  return pdf;
}

export async function getPdfPageCount(documentId: number, src?: string): Promise<number> {
  if (pageCountCache.has(documentId)) return pageCountCache.get(documentId)!;
  const pdf = await openPdfDocument(documentId, src);
  return pdf.numPages;
}

export interface RenderedPage {
  dataUrl: string;
  width: number;
  height: number;
}

/** Render one page to a JPEG data-URL (for grid thumbnails). Cached per doc+page. */
export async function renderPagePreview(
  documentId: number,
  pageNum = 1,
  maxCssWidth = 200,
  src?: string,
): Promise<RenderedPage | null> {
  const cacheKey = `${documentId}-${pageNum}`;
  const cached = pageImageCache.get(cacheKey);
  if (cached) return { dataUrl: cached, width: 0, height: 0 };

  await acquireThumbSlot();
  let pdf: pdfjsLib.PDFDocumentProxy | null = null;
  try {
    pdf = await openPdfDocument(documentId, src);
    const page = await pdf.getPage(pageNum);
    const vp = page.getViewport({ scale: 1 });
    const scale = maxCssWidth / vp.width;
    const scaled = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = scaled.width;
    canvas.height = scaled.height;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      page.cleanup();
      return null;
    }

    await page.render({ canvasContext: ctx, viewport: scaled }).promise;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
    pageImageCache.set(cacheKey, dataUrl);
    page.cleanup();

    return { dataUrl, width: scaled.width, height: scaled.height };
  } catch {
    return null;
  } finally {
    releaseThumbSlot();
  }
}

export interface RenderPageToCanvasOptions {
  documentId: number;
  pageNum: number;
  canvas: HTMLCanvasElement;
  containerWidth: number;
  src?: string;
}

/** Render one page into a canvas (full reader view). */
export async function renderPageToCanvas({
  documentId,
  pageNum,
  canvas,
  containerWidth,
  src,
}: RenderPageToCanvasOptions): Promise<{ width: number; height: number }> {
  const pdf = await openPdfDocument(documentId, src);
  const page = await pdf.getPage(pageNum);
  const vp = page.getViewport({ scale: 1 });
  const cssScale = containerWidth / vp.width;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const devScale = cssScale * dpr;

  const devVP = page.getViewport({ scale: devScale });
  const cssVP = page.getViewport({ scale: cssScale });

  canvas.width = devVP.width;
  canvas.height = devVP.height;
  canvas.style.width = `${cssVP.width}px`;
  canvas.style.height = `${cssVP.height}px`;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    page.cleanup();
    throw new Error('Canvas unavailable');
  }

  await page.render({ canvasContext: ctx, viewport: devVP }).promise;
  page.cleanup();

  return { width: cssVP.width, height: cssVP.height };
}

export function clearPdfDocumentCache(documentId?: number) {
  if (documentId != null) {
    docCache.get(documentId)?.destroy();
    docCache.delete(documentId);
    pageCountCache.delete(documentId);
    for (const key of pageImageCache.keys()) {
      if (key.startsWith(`${documentId}-`)) pageImageCache.delete(key);
    }
    return;
  }
  docCache.forEach((pdf) => pdf.destroy());
  docCache.clear();
  pageCountCache.clear();
  pageImageCache.clear();
}
