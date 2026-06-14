/**
 * PdfDocumentViewer — Mobile-first PDF reader
 *
 * Features:
 *  • DPR-aware canvas rendering (crisp text on retina screens)
 *  • pdfjs text-layer overlay → native text selection & highlighting
 *  • Pinch-to-zoom (native touch events, non-passive) + zoom buttons
 *  • Smooth panning via native overflow-scroll (touch momentum on iOS)
 *  • Click on any page → opens Reader Mode for that page (clean text view)
 *  • Reader Mode: sepia-toned full-text overlay with prev/next page nav
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Loader2, ZoomIn, ZoomOut, BookOpen, X, Type,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { getUploadUrl } from '../../config/api.config';
import { getDocumentStreamUrl } from '../../utils/pdfViewer';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/* ── Constants ──────────────────────────────────────────────────── */
const DPR = Math.min(window.devicePixelRatio || 1, 3); // cap at 3× for memory
const ZOOM_LEVELS = [0.5, 0.7, 1.0, 1.4, 2.0, 2.8];
const DEFAULT_ZOOM_IDX = 2; // 1.0

/* Text-layer CSS injected once per app lifetime */
const TEXT_LAYER_STYLE = `
  .pdftl span, .pdftl a {
    color: transparent;
    position: absolute;
    white-space: pre;
    cursor: text;
    transform-origin: 0% 0%;
    pointer-events: auto;
    user-select: text;
    -webkit-user-select: text;
  }
  .pdftl span::selection, .pdftl a::selection {
    background-color: rgba(37,99,235,0.25);
    color: transparent;
  }
  .pdftl br { display: none; }
  .pdftl .endOfContent {
    display: block;
    position: absolute;
    left: 0; top: 100%;
    right: 0; bottom: 0;
    z-index: -1;
    cursor: default;
    user-select: none;
    -webkit-user-select: none;
  }
`;

/* ── Props ──────────────────────────────────────────────────────── */
export interface PdfDocumentViewerProps {
  /** Prefer same-origin stream when documentId is available. */
  documentId?: number;
  /** Fallback URL (signed Wasabi / local path). */
  src?: string;
  title?: string;
  className?: string;
}

/* ── Component ──────────────────────────────────────────────────── */
export const PdfDocumentViewer: React.FC<PdfDocumentViewerProps> = ({
  documentId,
  src,
  title = 'PDF document',
  className = '',
}) => {
  const scrollRef   = useRef<HTMLDivElement>(null);
  const pagesRef    = useRef<HTMLDivElement>(null);
  const pdfRef      = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const renderToken = useRef(0);
  const zoomIdxRef  = useRef(DEFAULT_ZOOM_IDX); // kept in sync for native handlers

  const [loading,   setLoading]   = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [numPages,  setNumPages]  = useState(0);
  const [zoomIdx,   setZoomIdx]   = useState(DEFAULT_ZOOM_IDX);

  /* Reader mode */
  const [readerMode,  setReaderMode]  = useState(false);
  const [readerPage,  setReaderPage]  = useState(1);
  const [pageTexts,   setPageTexts]   = useState<string[]>([]);

  const zoom = ZOOM_LEVELS[zoomIdx];

  /* keep ref in sync so native touch handlers see current value */
  useEffect(() => { zoomIdxRef.current = zoomIdx; }, [zoomIdx]);

  /* ── Render all pages ─────────────────────────────────────────── */
  const renderAllPages = useCallback(async (
    pdf: pdfjsLib.PDFDocumentProxy,
    zoomLevel: number,
    token: number,
  ) => {
    const pagesEl  = pagesRef.current;
    const scrollEl = scrollRef.current;
    if (!pagesEl || !scrollEl) return;

    setRendering(true);
    pagesEl.innerHTML = '';

    const containerW = scrollEl.clientWidth || window.innerWidth - 16;
    const texts: string[] = new Array(pdf.numPages).fill('');

    for (let n = 1; n <= pdf.numPages; n++) {
      if (renderToken.current !== token) return;

      const page    = await pdf.getPage(n);
      if (renderToken.current !== token) return;

      const baseVP   = page.getViewport({ scale: 1 });
      const fitScale = containerW / baseVP.width;
      const cssScale = fitScale * zoomLevel;
      const devScale = cssScale * DPR;

      const devVP  = page.getViewport({ scale: devScale });
      const cssVP  = page.getViewport({ scale: cssScale });

      /* Page wrapper */
      const pageDiv = document.createElement('div');
      pageDiv.className = 'relative mb-3 mx-auto bg-white shadow-lg select-none';
      pageDiv.style.cssText = `width:${cssVP.width}px;height:${cssVP.height}px;`;
      pageDiv.dataset.pageNum = String(n);

      /* Canvas — rendered at device-pixel resolution for crispness */
      const canvas = document.createElement('canvas');
      canvas.width  = devVP.width;
      canvas.height = devVP.height;
      canvas.style.cssText =
        `width:${cssVP.width}px;height:${cssVP.height}px;display:block;`;
      canvas.title  = 'Tap to open Reader Mode';
      canvas.style.cursor = 'pointer';

      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      await page.render({ canvasContext: ctx, viewport: devVP }).promise;
      if (renderToken.current !== token) return;

      pageDiv.appendChild(canvas);

      /* Text layer — same CSS-pixel viewport as the visual canvas */
      const textDiv = document.createElement('div');
      textDiv.className = 'pdftl';
      textDiv.style.cssText = [
        'position:absolute;top:0;left:0;',
        `width:${cssVP.width}px;height:${cssVP.height}px;`,
        'overflow:hidden;line-height:1;pointer-events:none;',
      ].join('');

      try {
        const tc = await page.getTextContent();
        if (renderToken.current !== token) return;

        texts[n - 1] = tc.items
          .filter((item): item is { str: string } & typeof item => 'str' in item)
          .map(item => (item as { str: string }).str)
          .filter(s => s.trim())
          .join(' ');

        const rl = (pdfjsLib as Record<string, any>)['renderTextLayer'];
        if (typeof rl === 'function') {
          const task = rl({ textContentSource: tc, container: textDiv, viewport: cssVP });
          if (task?.promise) await task.promise;
        }
      } catch {
        /* text layer is optional — PDF still displays */
      }

      pageDiv.appendChild(textDiv);

      /* Tap opens reader mode for this page */
      canvas.addEventListener('click', () => {
        setReaderPage(n);
        setReaderMode(true);
      }, { passive: true });

      pagesEl.appendChild(pageDiv);
    }

    if (renderToken.current === token) {
      setPageTexts([...texts]);
      setRendering(false);
    }
  }, []);

  /* ── Load PDF ─────────────────────────────────────────────────── */
  useEffect(() => {
    const pdfUrl = documentId
      ? getDocumentStreamUrl(documentId)
      : getUploadUrl(src || '');

    if (!pdfUrl) {
      setError('No document URL available');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      setNumPages(0);
      setPageTexts([]);
      setZoomIdx(DEFAULT_ZOOM_IDX);
      renderToken.current++;

      try {
        const task = pdfjsLib.getDocument({ url: pdfUrl, withCredentials: false });
        const pdf  = await task.promise;
        if (cancelled) { pdf.destroy(); return; }

        pdfRef.current?.destroy();
        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
        setLoading(false);

        const token = ++renderToken.current;
        await renderAllPages(pdf, ZOOM_LEVELS[DEFAULT_ZOOM_IDX], token);
      } catch (err) {
        if (!cancelled) {
          console.error('PDF load error:', err);
          setError('Unable to load document. Please try again.');
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
      renderToken.current++;
      pdfRef.current?.destroy();
      pdfRef.current = null;
      if (pagesRef.current) pagesRef.current.innerHTML = '';
    };
  }, [documentId, src, renderAllPages]);

  /* ── Re-render when zoom changes (after initial load) ─────────── */
  const initialRender = useRef(true);
  useEffect(() => {
    if (initialRender.current) { initialRender.current = false; return; }
    const pdf = pdfRef.current;
    if (!pdf) return;
    const token = ++renderToken.current;
    renderAllPages(pdf, ZOOM_LEVELS[zoomIdx], token);
  }, [zoomIdx, renderAllPages]);

  /* ── Pinch-to-zoom via native touch events ───────────────────── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let pinching   = false;
    let startDist  = 0;
    let startIdx   = DEFAULT_ZOOM_IDX;

    const dist = (e: TouchEvent) =>
      Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );

    const nearestIdx = (targetZoom: number) => {
      let best = 0, bestDiff = Infinity;
      ZOOM_LEVELS.forEach((z, i) => {
        const d = Math.abs(z - targetZoom);
        if (d < bestDiff) { bestDiff = d; best = i; }
      });
      return best;
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinching  = true;
        startDist = dist(e);
        startIdx  = zoomIdxRef.current;
      } else { pinching = false; }
    };

    const onMove = (e: TouchEvent) => {
      if (!pinching || e.touches.length !== 2) return;
      e.preventDefault(); // prevent native browser pinch-zoom
      const ratio = dist(e) / startDist;
      const idx   = nearestIdx(ZOOM_LEVELS[startIdx] * ratio);
      if (idx !== zoomIdxRef.current) setZoomIdx(idx);
    };

    const onEnd = () => { pinching = false; };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove',  onMove,  { passive: false });
    el.addEventListener('touchend',   onEnd,   { passive: true });

    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove',  onMove);
      el.removeEventListener('touchend',   onEnd);
    };
  }, []);

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <>
      {/* Inject text-layer styles once */}
      <style>{TEXT_LAYER_STYLE}</style>

      <div className={`relative flex flex-col min-h-0 overflow-hidden ${className}`}>

        {/* ── Toolbar ── */}
        {!loading && !error && numPages > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-950 border-b border-gray-800 flex-shrink-0">
            <span className="text-xs text-gray-400 flex-1 select-none">
              {numPages} page{numPages !== 1 ? 's' : ''}
            </span>

            {/* Reader mode */}
            <button
              onClick={() => { setReaderPage(1); setReaderMode(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-lg text-white text-xs font-semibold transition-colors"
            >
              <BookOpen size={12} /> Reader
            </button>

            {/* Zoom controls */}
            <div className="flex items-center bg-gray-800 rounded-lg overflow-hidden">
              <button
                onClick={() => setZoomIdx(i => Math.max(0, i - 1))}
                disabled={zoomIdx === 0}
                className="p-2 hover:bg-gray-700 text-white disabled:opacity-30 transition-colors"
                aria-label="Zoom out"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-xs text-gray-300 px-2 min-w-[2.8rem] text-center select-none">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoomIdx(i => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
                disabled={zoomIdx === ZOOM_LEVELS.length - 1}
                className="p-2 hover:bg-gray-700 text-white disabled:opacity-30 transition-colors"
                aria-label="Zoom in"
              >
                <ZoomIn size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── Scroll area — always mounted so pagesRef/scrollRef are
             never null when renderAllPages is called right after
             setLoading(false). Loading / error states are overlays. ── */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto overscroll-contain min-h-0 bg-gray-700 relative"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' } as React.CSSProperties}
          aria-label={title}
        >
          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-gray-700">
              <Loader2 className="w-10 h-10 animate-spin text-teal-400" />
              <p className="text-sm text-gray-300">Loading document…</p>
            </div>
          )}

          {/* Error overlay */}
          {error && !loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 p-8 text-center bg-gray-700">
              <p className="text-sm text-red-400">{error}</p>
              <p className="text-xs text-gray-500 mt-1">{title}</p>
            </div>
          )}

          {/* Re-render progress banner */}
          {rendering && (
            <div className="sticky top-0 z-10 flex items-center justify-center gap-2 py-1.5 bg-gray-900/80 backdrop-blur-sm">
              <Loader2 size={14} className="animate-spin text-teal-400" />
              <span className="text-xs text-gray-300">Rendering…</span>
            </div>
          )}

          {/* Pages container — always in DOM; content filled imperatively */}
          <div
            ref={pagesRef}
            className="py-4 px-2 flex flex-col items-center"
          />
        </div>

        {/* ── Reader Mode overlay ── */}
        {readerMode && (
          <div className="absolute inset-0 z-50 flex flex-col bg-[#fdf6e3]">
            {/* Reader toolbar */}
            <div className="flex items-center gap-3 px-4 py-3 bg-[#f2e4c0] border-b border-[#d9c48a] flex-shrink-0">
              <button
                onClick={() => setReaderMode(false)}
                className="p-1.5 hover:bg-[#d9c48a] rounded-lg transition-colors"
                aria-label="Close reader mode"
              >
                <X size={18} className="text-gray-700" />
              </button>
              <div className="flex items-center gap-2 flex-1">
                <Type size={14} className="text-amber-700" />
                <span className="text-sm font-bold text-gray-800">Reader Mode</span>
              </div>
              {/* Page navigation */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setReaderPage(p => Math.max(1, p - 1))}
                  disabled={readerPage <= 1}
                  className="p-1.5 hover:bg-[#d9c48a] rounded-lg disabled:opacity-30 transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={18} className="text-gray-700" />
                </button>
                <span className="text-xs text-gray-600 min-w-[3.5rem] text-center select-none">
                  {readerPage} / {numPages}
                </span>
                <button
                  onClick={() => setReaderPage(p => Math.min(numPages, p + 1))}
                  disabled={readerPage >= numPages}
                  className="p-1.5 hover:bg-[#d9c48a] rounded-lg disabled:opacity-30 transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight size={18} className="text-gray-700" />
                </button>
              </div>
            </div>

            {/* Reader content */}
            <div
              className="flex-1 overflow-y-auto px-5 py-6"
              style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
            >
              {pageTexts[readerPage - 1]?.trim() ? (
                <p
                  className="text-gray-900"
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: '1.0625rem',
                    lineHeight: 1.85,
                    letterSpacing: '0.01em',
                  }}
                >
                  {pageTexts[readerPage - 1]}
                </p>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3 text-center">
                  <Type size={36} className="text-amber-300" />
                  <p className="text-sm text-gray-500">
                    No readable text found on page {readerPage}.
                  </p>
                  <p className="text-xs text-gray-400">
                    This page may contain scanned images.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
