import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { getUploadUrl } from '../../config/api.config';
import { getDocumentStreamUrl } from '../../utils/pdfViewer';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface PdfDocumentViewerProps {
  /** Prefer same-origin stream when document id is available. */
  documentId?: number;
  /** Fallback URL (signed Wasabi or local path) when no documentId. */
  src?: string;
  title?: string;
  className?: string;
}

export const PdfDocumentViewer: React.FC<PdfDocumentViewerProps> = ({
  documentId,
  src,
  title = 'PDF document',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;

    const renderPdf = async () => {
      setLoading(true);
      setError(null);
      container.innerHTML = '';

      const pdfUrl = documentId
        ? getDocumentStreamUrl(documentId)
        : getUploadUrl(src || '');

      if (!pdfUrl) {
        setError('No document URL available');
        setLoading(false);
        return;
      }

      try {
        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          withCredentials: false,
        });
        pdfDoc = await loadingTask.promise;
        if (cancelled) return;

        const containerWidth = container.clientWidth || window.innerWidth - 32;

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum += 1) {
          if (cancelled) return;

          const page = await pdfDoc.getPage(pageNum);
          const baseViewport = page.getViewport({ scale: 1 });
          const scale = Math.min(containerWidth / baseViewport.width, 2);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.className = 'w-full h-auto mb-2 shadow-sm bg-white';

          const context = canvas.getContext('2d');
          if (!context) continue;

          await page.render({ canvasContext: context, viewport }).promise;
          if (!cancelled) container.appendChild(canvas);
        }
      } catch (err) {
        console.error('PDF render error:', err);
        if (!cancelled) {
          setError('Unable to load PDF. Please try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    renderPdf();

    return () => {
      cancelled = true;
      pdfDoc?.destroy();
      container.innerHTML = '';
    };
  }, [documentId, src]);

  return (
    <div className={`relative flex flex-col min-h-0 ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" aria-label="Loading PDF" />
        </div>
      )}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500">
          <p className="text-sm">{error}</p>
          <p className="text-xs mt-1 text-gray-400">{title}</p>
        </div>
      )}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overscroll-contain min-h-0 w-full"
        aria-label={title}
      />
    </div>
  );
};
