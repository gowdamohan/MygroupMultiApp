/**
 * SinglePagePdfViewer — loads and renders ONE PDF page at a time.
 * Footer prev/next pagination keeps production load times low.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import {
  getPdfPageCount,
  renderPageToCanvas,
  getCachedPageImage,
} from '../../utils/pdfPageRenderer';

export interface SinglePagePdfViewerProps {
  documentId: number;
  /** Ignored when documentId is set — stream URL is always preferred. */
  src?: string;
  title?: string;
  className?: string;
  initialPage?: number;
  /** Instant display while page 1 renders (from grid thumbnail cache). */
  previewDataUrl?: string | null;
}

export const SinglePagePdfViewer: React.FC<SinglePagePdfViewerProps> = ({
  documentId,
  src,
  title = 'PDF document',
  className = '',
  initialPage = 1,
  previewDataUrl,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingPage, setLoadingPage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [containerW, setContainerW] = useState(0);
  const [showPreview, setShowPreview] = useState(
    () => !!(previewDataUrl && initialPage === 1),
  );

  const renderGeneration = useRef(0);

  useEffect(() => {
    setCurrentPage(initialPage);
    setShowPreview(!!(previewDataUrl && initialPage === 1));
  }, [documentId, initialPage, previewDataUrl]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setContainerW(Math.max(0, el.clientWidth - 8));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* Load page count only (no full-document prefetch). */
  useEffect(() => {
    let cancelled = false;
    setLoadingMeta(true);
    setError(null);
    setNumPages(0);

    getPdfPageCount(documentId, src)
      .then((total) => {
        if (!cancelled) {
          setNumPages(total);
          setCurrentPage((p) => Math.min(Math.max(1, p), total || 1));
          setLoadingMeta(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Unable to open document. Please try again.');
          setLoadingMeta(false);
        }
      });

    return () => { cancelled = true; };
  }, [documentId, src]);

  /* Render only the active page. */
  const renderCurrentPage = useCallback(async (pageNum: number, width: number) => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0) return;

    const gen = ++renderGeneration.current;
    setLoadingPage(true);

    try {
      await renderPageToCanvas({
        documentId,
        pageNum,
        canvas,
        containerWidth: width,
        src,
      });
      if (gen === renderGeneration.current) {
        setShowPreview(false);
        setLoadingPage(false);
      }
    } catch {
      if (gen === renderGeneration.current) {
        setError(`Failed to load page ${pageNum}.`);
        setLoadingPage(false);
      }
    }
  }, [documentId, src]);

  useEffect(() => {
    if (loadingMeta || error || numPages === 0 || containerW <= 0) return;
    renderCurrentPage(currentPage, containerW);
  }, [currentPage, containerW, loadingMeta, numPages, error, renderCurrentPage]);

  const goPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goNext = () => setCurrentPage((p) => Math.min(numPages, p + 1));

  const instantPreview = showPreview
    ? (previewDataUrl ?? (currentPage === 1 ? getCachedPageImage(documentId, 1) : null))
    : null;

  return (
    <div className={`flex flex-col min-h-0 overflow-hidden ${className}`}>
      {/* Page viewport */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-gray-800 flex items-start justify-center py-4"
        aria-label={title}
      >
        {loadingMeta && !instantPreview && (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="w-10 h-10 animate-spin text-teal-400" />
            <p className="text-sm text-gray-300">Opening document…</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center py-20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {!error && (
          <div className="relative mx-auto">
            {instantPreview && (
              <img
                src={instantPreview}
                alt={`${title} page ${currentPage}`}
                className="block max-w-full shadow-lg bg-white"
                style={{ opacity: loadingPage ? 0.85 : 1 }}
              />
            )}

            <canvas
              ref={canvasRef}
              className="block max-w-full shadow-lg bg-white mx-auto"
              style={{
                display: instantPreview && loadingPage ? 'none' : 'block',
                opacity: loadingPage && !instantPreview ? 0 : 1,
              }}
            />

            {loadingPage && !instantPreview && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800/60">
                <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
                <p className="text-xs text-gray-300 mt-2">Page {currentPage}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer pagination */}
      {!loadingMeta && !error && numPages > 0 && (
        <div
          className="flex-shrink-0 bg-gray-950 border-t border-gray-800 px-4 py-3 flex items-center justify-between gap-3"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
        >
          <button
            type="button"
            onClick={goPrev}
            disabled={currentPage <= 1 || loadingPage}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold disabled:opacity-30 active:bg-white/20 transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
            Prev
          </button>

          <span className="text-sm text-gray-300 font-medium select-none tabular-nums">
            {currentPage} / {numPages}
          </span>

          <button
            type="button"
            onClick={goNext}
            disabled={currentPage >= numPages || loadingPage}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold disabled:opacity-30 active:bg-teal-700 transition-colors"
            aria-label="Next page"
          >
            Next
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default SinglePagePdfViewer;
