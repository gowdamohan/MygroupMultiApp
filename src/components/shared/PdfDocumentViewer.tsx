/**
 * PdfDocumentViewer — Mobile-first PDF reader (virtualized)
 *
 * Features:
 *  • Lazy page rendering via Intersection Observer (viewport + buffer)
 *  • Adaptive DPR + canvas cleanup for low-memory mobile devices
 *  • pdfjs TextLayer overlay → native text selection (all scripts)
 *  • Fluid pinch-to-zoom preview + discrete snap on release
 *  • Per-page loading placeholders while canvases render
 *  • Reader Mode (optional, gated by SHOW_READER_UI)
 */
import React, {
  useEffect, useRef, useState, useCallback, memo,
} from 'react';
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
const ZOOM_LEVELS = [0.5, 0.7, 1.0, 1.4, 2.0, 2.8];
const DEFAULT_ZOOM_IDX = 2; // 1.0
const IO_ROOT_MARGIN = '120% 0px'; // preload ~1 page above/below viewport

/** Set true to show Reader toolbar button and tap-to-open reader overlay. */
const SHOW_READER_UI = false;

/* Text-layer CSS injected once per app lifetime */
const TEXT_LAYER_STYLE = `
  .pdftl {
    position: absolute;
    top: 0;
    left: 0;
    overflow: hidden;
    line-height: 1;
    z-index: 2;
    pointer-events: none;
    --scale-factor: 1;
  }
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

/* ── Helpers ────────────────────────────────────────────────────── */
interface PageDim {
  width: number;
  height: number;
}

type PageStatus = 'idle' | 'loading' | 'rendered' | 'error';

/** Cap device-pixel ratio based on zoom, page count, and device class. */
function getAdaptiveDPR(zoom: number, numPages: number): number {
  const dpr = window.devicePixelRatio || 1;
  const mobile = window.innerWidth < 768 || 'ontouchstart' in window;
  let cap = mobile ? 2 : 3;
  if (numPages > 20) cap = Math.min(cap, 1.25);
  else if (numPages > 10) cap = Math.min(cap, 1.5);
  else if (numPages > 5) cap = Math.min(cap, mobile ? 1.75 : 2);
  if (zoom < 0.8) cap = Math.min(cap, 1.25);
  else if (zoom >= 2) cap = Math.min(cap, mobile ? 1.75 : 2.5);
  return Math.min(dpr, cap);
}

function releaseCanvas(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.width = 0;
  canvas.height = 0;
}

function nearestZoomIdx(targetZoom: number): number {
  let best = 0;
  let bestDiff = Infinity;
  ZOOM_LEVELS.forEach((z, i) => {
    const d = Math.abs(z - targetZoom);
    if (d < bestDiff) { bestDiff = d; best = i; }
  });
  return best;
}

function extractPageText(tc: Awaited<ReturnType<pdfjsLib.PDFPageProxy['getTextContent']>>): string {
  return tc.items
    .filter((item): item is { str: string } & typeof item => 'str' in item)
    .map(item => item.str)
    .filter(s => s.trim())
    .join(' ');
}

/* ── Props ──────────────────────────────────────────────────────── */
export interface PdfDocumentViewerProps {
  /** Prefer same-origin stream when documentId is available. */
  documentId?: number;
  /** Fallback URL (signed Wasabi / local path). */
  src?: string;
  title?: string;
  className?: string;
}

/* ── Virtual page slot ──────────────────────────────────────────── */
interface PdfPageSlotProps {
  pageNum: number;
  pdf: pdfjsLib.PDFDocumentProxy;
  dim: PageDim;
  containerWidth: number;
  zoom: number;
  numPages: number;
  generation: number;
  scrollRootRef: React.RefObject<HTMLDivElement | null>;
  onTextExtracted: (pageNum: number, text: string) => void;
  onOpenReader?: (pageNum: number) => void;
}

const PdfPageSlot = memo<PdfPageSlotProps>(({
  pageNum,
  pdf,
  dim,
  containerWidth,
  zoom,
  numPages,
  generation,
  scrollRootRef,
  onTextExtracted,
  onOpenReader,
}) => {
  const slotRef      = useRef<HTMLDivElement>(null);
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const textRef        = useRef<HTMLDivElement>(null);
  const renderTaskRef  = useRef<pdfjsLib.RenderTask | null>(null);
  const textLayerRef   = useRef<InstanceType<typeof pdfjsLib.TextLayer> | null>(null);
  const pageRef        = useRef<pdfjsLib.PDFPageProxy | null>(null);

  const [visible, setVisible] = useState(false);
  const [status,  setStatus]  = useState<PageStatus>('idle');

  const fitScale = containerWidth / dim.width;
  const cssW = dim.width * fitScale * zoom;
  const cssH = dim.height * fitScale * zoom;

  /* Observe visibility inside the scroll container */
  useEffect(() => {
    const el = slotRef.current;
    const root = scrollRootRef.current;
    if (!el || !root) return;

    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { root, rootMargin: IO_ROOT_MARGIN, threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [scrollRootRef, containerWidth, numPages]);

  /* Render or cleanup when visibility / zoom / generation changes */
  useEffect(() => {
    if (!visible) {
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
      textLayerRef.current?.cancel();
      textLayerRef.current = null;
      pageRef.current?.cleanup();
      pageRef.current = null;
      releaseCanvas(canvasRef.current);
      if (textRef.current) textRef.current.innerHTML = '';
      setStatus('idle');
      return;
    }

    let cancelled = false;
    const gen = generation;

    const renderPage = async () => {
      setStatus('loading');

      try {
        const page = await pdf.getPage(pageNum);
        pageRef.current = page;
        if (cancelled || gen !== generation) return;

        const cssScale = fitScale * zoom;
        const dpr = getAdaptiveDPR(zoom, numPages);
        const devScale = cssScale * dpr;

        const devVP = page.getViewport({ scale: devScale });
        const cssVP = page.getViewport({ scale: cssScale });

        const canvas = canvasRef.current;
        const textDiv = textRef.current;
        if (!canvas || !textDiv) return;

        canvas.width = devVP.width;
        canvas.height = devVP.height;
        canvas.style.width = `${cssVP.width}px`;
        canvas.style.height = `${cssVP.height}px`;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) throw new Error('Canvas 2D unavailable');

        renderTaskRef.current?.cancel();
        const task = page.render({ canvasContext: ctx, viewport: devVP });
        renderTaskRef.current = task;
        await task.promise;
        if (cancelled || gen !== generation) return;

        textDiv.style.width = `${cssVP.width}px`;
        textDiv.style.height = `${cssVP.height}px`;
        textDiv.style.setProperty('--scale-factor', String(cssVP.scale));
        textDiv.innerHTML = '';

        try {
          const tc = await page.getTextContent();
          if (cancelled || gen !== generation) return;

          onTextExtracted(pageNum, extractPageText(tc));

          textLayerRef.current?.cancel();
          const textLayer = new pdfjsLib.TextLayer({
            textContentSource: tc,
            container: textDiv,
            viewport: cssVP,
          });
          textLayerRef.current = textLayer;
          await textLayer.render();
        } catch {
          /* text layer is optional */
        }

        if (!cancelled && gen === generation) setStatus('rendered');
      } catch (err) {
        if (!cancelled && gen === generation) {
          if ((err as { name?: string })?.name !== 'RenderingCancelledException') {
            setStatus('error');
          }
        }
      }
    };

    renderPage();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
      textLayerRef.current?.cancel();
      textLayerRef.current = null;
      pageRef.current?.cleanup();
      pageRef.current = null;
      releaseCanvas(canvasRef.current);
      if (textRef.current) textRef.current.innerHTML = '';
    };
  }, [
    visible, pageNum, pdf, fitScale, zoom, numPages, generation,
    onTextExtracted,
  ]);

  const showSkeleton = status !== 'rendered';

  return (
    <div
      ref={slotRef}
      className="relative mb-3 mx-auto bg-white shadow-lg"
      style={{ width: cssW, height: cssH }}
      data-page-num={pageNum}
    >
      {/* Layout placeholder — visible immediately */}
      {showSkeleton && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 border border-gray-200"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="w-7 h-7 animate-spin text-teal-500 mb-2" />
              <span className="text-xs text-gray-400">Page {pageNum}</span>
            </>
          ) : status === 'error' ? (
            <span className="text-xs text-red-400 px-4 text-center">
              Failed to render page {pageNum}
            </span>
          ) : (
            <span className="text-xs text-gray-300 select-none">Page {pageNum}</span>
          )}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="block relative z-[1]"
        style={{
          width: cssW,
          height: cssH,
          opacity: status === 'rendered' ? 1 : 0,
          transition: 'opacity 0.2s ease',
          cursor: SHOW_READER_UI && onOpenReader ? 'pointer' : undefined,
        }}
        onClick={SHOW_READER_UI && onOpenReader
          ? () => onOpenReader(pageNum)
          : undefined}
      />

      <div ref={textRef} className="pdftl" />
    </div>
  );
});
PdfPageSlot.displayName = 'PdfPageSlot';

/* ── Component ──────────────────────────────────────────────────── */
export const PdfDocumentViewer: React.FC<PdfDocumentViewerProps> = ({
  documentId,
  src,
  title = 'PDF document',
  className = '',
}) => {
  const scrollRef    = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const zoomIdxRef   = useRef(DEFAULT_ZOOM_IDX);
  const pinchScaleRef = useRef(1);

  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [numPages,     setNumPages]     = useState(0);
  const [pageDims,     setPageDims]     = useState<PageDim[]>([]);
  const [containerW,   setContainerW]   = useState(0);
  const [zoomIdx,      setZoomIdx]      = useState(DEFAULT_ZOOM_IDX);
  const [generation,   setGeneration]   = useState(0);
  const [pinchScale,   setPinchScale]   = useState(1);
  const [pinchOrigin,  setPinchOrigin]  = useState({ x: 0, y: 0 });
  const [pinching,     setPinching]     = useState(false);

  const [readerMode, setReaderMode] = useState(false);
  const [readerPage, setReaderPage] = useState(1);
  const [pageTexts,  setPageTexts]  = useState<string[]>([]);

  const zoom = ZOOM_LEVELS[zoomIdx];

  useEffect(() => { zoomIdxRef.current = zoomIdx; }, [zoomIdx]);
  useEffect(() => { pinchScaleRef.current = pinchScale; }, [pinchScale]);

  const handleTextExtracted = useCallback((pageNum: number, text: string) => {
    setPageTexts(prev => {
      const next = prev.length ? [...prev] : [];
      next[pageNum - 1] = text;
      return next;
    });
  }, []);

  const handleOpenReader = useCallback((pageNum: number) => {
    setReaderPage(pageNum);
    setReaderMode(true);
  }, []);

  /* Track scroll-container width for fit-to-width scaling */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const measure = () => setContainerW(el.clientWidth || window.innerWidth - 16);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading, pdfDoc]);

  /* ── Load PDF + page dimensions (no canvas rendering) ─────────── */
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
      setPageDims([]);
      setPageTexts([]);
      setZoomIdx(DEFAULT_ZOOM_IDX);
      setPinchScale(1);
      setGeneration(g => g + 1);

      try {
        const task = pdfjsLib.getDocument({ url: pdfUrl, withCredentials: false });
        const pdf  = await task.promise;
        if (cancelled) { pdf.destroy(); return; }

        setPdfDoc(prev => {
          prev?.destroy();
          return pdf;
        });

        const dims = await Promise.all(
          Array.from({ length: pdf.numPages }, (_, i) =>
            pdf.getPage(i + 1).then(p => {
              const vp = p.getViewport({ scale: 1 });
              return { width: vp.width, height: vp.height };
            }),
          ),
        );
        if (cancelled) return;

        setNumPages(pdf.numPages);
        setPageTexts(new Array(pdf.numPages).fill(''));
        setPageDims(dims);
        setLoading(false);
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
      setPdfDoc(prev => {
        prev?.destroy();
        return null;
      });
    };
  }, [documentId, src]);

  /* ── Bump generation when zoom settles (re-render visible pages) */
  const prevZoomIdx = useRef(DEFAULT_ZOOM_IDX);
  useEffect(() => {
    if (loading || prevZoomIdx.current === zoomIdx) return;
    prevZoomIdx.current = zoomIdx;
    setGeneration(g => g + 1);
  }, [zoomIdx, loading]);

  /* ── Pinch-to-zoom: fluid CSS preview, snap on release ────────── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let active     = false;
    let startDist  = 0;
    let startIdx   = DEFAULT_ZOOM_IDX;
    let startScale = 1;

    const dist = (e: TouchEvent) =>
      Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );

    const pinchCenter = (e: TouchEvent, scrollEl: HTMLDivElement) => {
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const rect = scrollEl.getBoundingClientRect();
      return {
        x: cx - rect.left + scrollEl.scrollLeft,
        y: cy - rect.top + scrollEl.scrollTop,
      };
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) {
        active = false;
        return;
      }
      active     = true;
      startDist  = dist(e);
      startIdx   = zoomIdxRef.current;
      startScale = pinchScaleRef.current;
      setPinching(true);
      setPinchOrigin(pinchCenter(e, el));
    };

    const onMove = (e: TouchEvent) => {
      if (!active || e.touches.length !== 2) return;
      e.preventDefault();
      const ratio = (dist(e) / startDist) * startScale;
      const clamped = Math.max(0.4, Math.min(3.2, ratio));
      setPinchScale(clamped);
      setPinchOrigin(pinchCenter(e, el));
    };

    const onEnd = () => {
      if (!active) return;
      active = false;
      setPinching(false);

      const effective = ZOOM_LEVELS[startIdx] * pinchScaleRef.current;
      const nextIdx = nearestZoomIdx(effective);
      setPinchScale(1);
      if (nextIdx !== zoomIdxRef.current) {
        setZoomIdx(nextIdx);
      }
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove',  onMove,  { passive: false });
    el.addEventListener('touchend',   onEnd,   { passive: true });
    el.addEventListener('touchcancel', onEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove',  onMove);
      el.removeEventListener('touchend',   onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, []);

  const pagesColumnStyle: React.CSSProperties = pinchScale !== 1
    ? {
        transform: `scale(${pinchScale})`,
        transformOrigin: `${pinchOrigin.x}px ${pinchOrigin.y}px`,
        transition: pinching ? 'none' : 'transform 0.18s ease-out',
        willChange: 'transform',
      }
    : {};

  return (
    <>
      <style>{TEXT_LAYER_STYLE}</style>

      <div className={`relative flex flex-col min-h-0 overflow-hidden ${className}`}>

        {/* ── Toolbar ── */}
        {!loading && !error && numPages > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-950 border-b border-gray-800 flex-shrink-0">
            <span className="text-xs text-gray-400 flex-1 select-none">
              {numPages} page{numPages !== 1 ? 's' : ''}
            </span>

            {SHOW_READER_UI && (
              <button
                type="button"
                onClick={() => { setReaderPage(1); setReaderMode(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-lg text-white text-xs font-semibold transition-colors"
              >
                <BookOpen size={12} /> Reader
              </button>
            )}

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
                {Math.round(zoom * pinchScale * 100)}%
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

        {/* ── Scroll area ── */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto overscroll-contain min-h-0 bg-gray-700 relative"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' } as React.CSSProperties}
          aria-label={title}
        >
          {loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-gray-700">
              <Loader2 className="w-10 h-10 animate-spin text-teal-400" />
              <p className="text-sm text-gray-300">Loading document…</p>
            </div>
          )}

          {error && !loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 p-8 text-center bg-gray-700">
              <p className="text-sm text-red-400">{error}</p>
              <p className="text-xs text-gray-500 mt-1">{title}</p>
            </div>
          )}

          {!loading && !error && pdfDoc && containerW > 0 && pageDims.length > 0 && (
            <div className="py-4 px-2 flex flex-col items-center" style={pagesColumnStyle}>
              {pageDims.map((dim, i) => (
                <PdfPageSlot
                  key={`p-${i + 1}`}
                  pageNum={i + 1}
                  pdf={pdfDoc}
                  dim={dim}
                  containerWidth={containerW}
                  zoom={zoom}
                  numPages={numPages}
                  generation={generation}
                  scrollRootRef={scrollRef}
                  onTextExtracted={handleTextExtracted}
                  onOpenReader={SHOW_READER_UI ? handleOpenReader : undefined}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Reader Mode overlay ── */}
        {SHOW_READER_UI && readerMode && (
          <div className="absolute inset-0 z-50 flex flex-col bg-[#fdf6e3]">
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
