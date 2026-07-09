/**
 * EPaperMagazineView
 *
 * Mobile-first digital newspaper / magazine browser.
 *
 * Plan B:
 *  • Issue cards use page-1 WebP (thumbnail_url) — no client PDF parse
 *  • Full screen shows one page at a time with Prev / Next footer
 *  • Pages come as KB images from pages_json (signed URLs)
 *
 * API: GET /api/v1/mymedia/channel/:channelId/documents
 */
import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import {
  ArrowLeft, Download, Calendar, ChevronDown, ChevronUp,
  Loader2, Newspaper, BookOpen, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL, getUploadUrl, WASABI_IMG_PROPS } from '../../config/api.config';
import { getDocumentStreamUrl, isPdfFile } from '../../utils/pdfViewer';

const PdfDocumentViewer = lazy(() =>
  import('../shared/PdfDocumentViewer').then((m) => ({ default: m.PdfDocumentViewer })),
);

/* ── Types ──────────────────────────────────────────────────────── */
interface EPaperMagazineViewProps {
  channelId: number;
  channelName: string;
  channelLogo?: string;
  filterYear?: number;
  filterMonth?: number;
  onBack: () => void;
  onViewDetails: () => void;
}

interface Document {
  id: number;
  title: string;
  document_type: string;
  file_url: string;
  thumbnail_url?: string | null;
  /** Signed URLs keyed by page number string: { "1": "https://...", "2": "..." } */
  pages?: Record<string, string>;
  page_count?: number;
  pages_ready?: boolean;
  file_size?: number;
  year?: number;
  month?: number;
  date?: number;
  created_at: string;
}

interface GroupedDocuments {
  [year: string]: {
    [month: string]: Document[];
  };
}

/* ── Constants ───────────────────────────────────────────────────── */
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const COVER_GRADIENTS = [
  'from-red-800   to-red-950',
  'from-teal-700  to-teal-900',
  'from-blue-800  to-blue-950',
  'from-violet-700 to-violet-950',
  'from-emerald-700 to-emerald-900',
  'from-orange-700 to-orange-950',
];

/* ── Sub-components ──────────────────────────────────────────────── */

const SkeletonCard: React.FC = () => (
  <div className="rounded-xl overflow-hidden bg-gray-200 animate-pulse">
    <div className="w-full aspect-[3/4] bg-gray-300" />
    <div className="p-2 space-y-1.5">
      <div className="h-2.5 bg-gray-300 rounded w-3/4" />
      <div className="h-2 bg-gray-200 rounded w-1/2" />
    </div>
  </div>
);

const getDocUrl = (doc: Document): string => {
  if (doc.file_url && (doc.file_url.startsWith('http://') || doc.file_url.startsWith('https://'))) {
    return doc.file_url;
  }
  if (doc.id) return getDocumentStreamUrl(doc.id);
  return getUploadUrl(doc.file_url);
};

function getPageList(doc: Document): { nums: number[]; urls: Record<number, string> } {
  const urls: Record<number, string> = {};
  if (doc.pages && Object.keys(doc.pages).length > 0) {
    for (const [k, v] of Object.entries(doc.pages)) {
      const n = parseInt(k, 10);
      if (n > 0 && v) urls[n] = v;
    }
  } else if (doc.thumbnail_url) {
    urls[1] = doc.thumbnail_url;
  }
  const nums = Object.keys(urls).map(Number).sort((a, b) => a - b);
  return { nums, urls };
}

/** Issue card — page-1 WebP thumbnail from API (no pdf.js). */
const IssueCard: React.FC<{
  doc: Document;
  index: number;
  opening?: boolean;
  onClick: () => void;
}> = ({ doc, index, opening, onClick }) => {
  const thumbUrl = doc.thumbnail_url || doc.pages?.['1'] || null;
  const gradient = COVER_GRADIENTS[index % COVER_GRADIENTS.length];
  const label = doc.date
    ? `${doc.date} ${doc.month ? MONTHS[doc.month - 1] : ''} ${doc.year ?? ''}`
    : doc.title;
  const pageCount = doc.page_count || (doc.pages ? Object.keys(doc.pages).length : 0);

  return (
    <button
      onClick={onClick}
      disabled={opening}
      className="relative rounded-xl overflow-hidden shadow-md active:scale-95 transition-transform bg-white text-left w-full disabled:opacity-70"
    >
      <div className="w-full aspect-[3/4] relative overflow-hidden bg-gray-100">
        {opening ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gray-100">
            <Loader2 size={28} className="animate-spin text-teal-600" />
            <span className="text-xs text-gray-500">Opening…</span>
          </div>
        ) : thumbUrl ? (
          <img
            src={thumbUrl}
            alt={doc.title}
            className="w-full h-full object-cover bg-white"
            loading="lazy"
            {...WASABI_IMG_PROPS}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-2`}>
            <Newspaper size={32} className="text-white/60" />
            <span className="text-white/80 text-xs font-bold px-2 text-center leading-tight line-clamp-2">
              {doc.title}
            </span>
            <span className="text-white/50 text-[10px]">Re-upload to generate pages</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent pt-6 pb-2 px-2">
          <p className="text-white text-[11px] font-semibold leading-tight line-clamp-2">{label}</p>
        </div>
        {pageCount > 0 && (
          <span className="absolute top-1.5 right-1.5 bg-black/50 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
            {pageCount} pg
          </span>
        )}
      </div>
      <div className="flex items-center justify-between px-2 py-1.5">
        <p className="text-gray-500 text-[10px] truncate">
          {doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB` : doc.document_type?.toUpperCase() || 'PDF'}
        </p>
        <BookOpen size={12} className="text-teal-500 flex-shrink-0" />
      </div>
    </button>
  );
};

/** Single-page image reader with footer Prev / Next — only loads current page URL. */
const PageFlipReader: React.FC<{
  doc: Document;
  channelName: string;
  loading?: boolean;
  onClose: () => void;
  onDownload: () => void;
}> = ({ doc, channelName, loading, onClose, onDownload }) => {
  const { nums, urls } = getPageList(doc);
  const [pageIdx, setPageIdx] = useState(0);
  const [imgLoading, setImgLoading] = useState(true);
  const prefetched = useRef(new Set<string>());

  const currentPage = nums[pageIdx] ?? 1;
  const currentUrl = urls[currentPage];
  const total = nums.length;
  const hasImagePages = total > 0 && Boolean(currentUrl);
  const canUsePdfFallback = Boolean(
    doc.id || (doc.file_url && isPdfFile(doc.file_url, doc.document_type))
  );

  // Prefetch next/prev once while viewing current page
  useEffect(() => {
    if (!hasImagePages) return;
    const neighbors = [nums[pageIdx - 1], nums[pageIdx + 1]].filter(Boolean) as number[];
    for (const n of neighbors) {
      const u = urls[n];
      if (u && !prefetched.current.has(u)) {
        prefetched.current.add(u);
        const img = new Image();
        img.src = u;
      }
    }
  }, [pageIdx, nums, urls, hasImagePages]);

  useEffect(() => {
    setImgLoading(true);
  }, [currentUrl]);

  const goPrev = () => setPageIdx((i) => Math.max(0, i - 1));
  const goNext = () => setPageIdx((i) => Math.min(total - 1, i + 1));

  const header = (
    <div className="flex items-center gap-3 px-4 py-3 bg-gray-950 border-b border-gray-800 flex-shrink-0">
      <button
        onClick={onClose}
        className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white flex-shrink-0"
        aria-label="Close reader"
      >
        <ArrowLeft size={20} />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm leading-tight truncate">{doc.title}</p>
        <p className="text-gray-400 text-xs mt-0.5">
          {[
            doc.date,
            doc.month ? MONTHS[doc.month - 1] : null,
            doc.year,
          ].filter(Boolean).join(' ') || channelName}
        </p>
      </div>
      <button
        onClick={onDownload}
        className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-xl text-white text-xs font-semibold transition-colors flex-shrink-0"
        aria-label="Download original PDF"
      >
        <Download size={14} />
        <span className="hidden sm:inline">PDF</span>
      </button>
    </div>
  );

  if (loading) {
    return (
      <motion.div
        key="page-reader-loading"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="fixed inset-0 z-50 flex flex-col bg-gray-900"
      >
        {header}
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 size={32} className="animate-spin text-teal-400" />
          <p className="text-sm text-gray-400">Loading pages…</p>
        </div>
      </motion.div>
    );
  }

  if (!hasImagePages && canUsePdfFallback) {
    return (
      <motion.div
        key="pdf-reader"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="fixed inset-0 z-50 flex flex-col bg-gray-900"
      >
        {header}
        <div className="flex-1 min-h-0 bg-gray-800">
          {!doc.pages_ready && (
            <p className="text-xs text-amber-300/90 bg-amber-950/40 px-4 py-2 text-center border-b border-amber-900/50">
              Page images not generated yet — showing PDF. Re-upload from media dashboard for faster page-by-page reading.
            </p>
          )}
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <Loader2 size={28} className="animate-spin text-teal-400" />
              </div>
            }
          >
            <PdfDocumentViewer
              documentId={doc.id}
              src={doc.file_url}
              title={doc.title}
              className="h-full"
            />
          </Suspense>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="page-reader"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className="fixed inset-0 z-50 flex flex-col bg-gray-900"
    >
      {header}

      <div className="flex-1 min-h-0 overflow-y-auto bg-gray-800 flex items-start justify-center py-3 px-2">
        {!currentUrl ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center px-6">
            <Newspaper size={40} className="text-gray-500" />
            <p className="text-sm text-gray-300">
              Pages not ready for this issue. Please re-upload the e-paper from the media dashboard.
            </p>
          </div>
        ) : (
          <div className="relative w-full max-w-lg mx-auto">
            {imgLoading && (
              <div className="absolute inset-0 flex items-center justify-center min-h-[50vh]">
                <Loader2 size={28} className="animate-spin text-teal-400" />
              </div>
            )}
            <img
              key={currentUrl}
              src={currentUrl}
              alt={`${doc.title} — page ${currentPage}`}
              className="w-full h-auto object-contain bg-white shadow-xl rounded-sm"
              onLoad={() => setImgLoading(false)}
              onError={() => setImgLoading(false)}
              {...WASABI_IMG_PROPS}
            />
          </div>
        )}
      </div>

      {total > 0 && (
        <div
          className="flex-shrink-0 bg-gray-950 border-t border-gray-800 px-4 py-3 flex items-center justify-between gap-3"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
        >
          <button
            type="button"
            onClick={goPrev}
            disabled={pageIdx <= 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold disabled:opacity-30 active:bg-white/20 transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
            Prev
          </button>
          <span className="text-sm text-gray-300 font-medium select-none tabular-nums">
            {currentPage} / {total}
          </span>
          <button
            type="button"
            onClick={goNext}
            disabled={pageIdx >= total - 1}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold disabled:opacity-30 active:bg-teal-700 transition-colors"
            aria-label="Next page"
          >
            Next
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </motion.div>
  );
};

/* ── Main component ───────────────────────────────────────────────── */
export const EPaperMagazineView: React.FC<EPaperMagazineViewProps> = ({
  channelId,
  channelName,
  channelLogo,
  filterYear,
  filterMonth,
  onBack,
  onViewDetails,
}) => {
  const [documents,    setDocuments]    = useState<Document[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [page,         setPage]         = useState(1);
  const [hasMore,      setHasMore]      = useState(true);
  const [expandedYear, setExpandedYear] = useState<string | null>(null);
  const [monthFilter,  setMonthFilter]  = useState<Record<string, string>>({});
  const [selectedDoc,  setSelectedDoc]  = useState<Document | null>(null);
  const [readerLoading, setReaderLoading] = useState(false);
  const [openingDocId, setOpeningDocId] = useState<number | null>(null);
  const expandedYearRef = useRef<string | null>(null);

  const fetchDocuments = useCallback(async (pageNum: number, append = false) => {
    try {
      pageNum === 1 ? setLoading(true) : setLoadingMore(true);

      const qs = new URLSearchParams({ page: String(pageNum), limit: '50' });
      if (filterYear)  qs.append('year',  String(filterYear));
      if (filterMonth) qs.append('month', String(filterMonth));

      const res = await axios.get(
        `${API_BASE_URL}/mymedia/channel/${channelId}/documents?${qs}`,
      );

      if (res.data.success) {
        const docs: Document[] = res.data.data.documents || [];
        setDocuments(prev => append ? [...prev, ...docs] : docs);
        setHasMore(res.data.data.pagination?.hasMore ?? false);

        if (docs.length > 0 && !expandedYearRef.current) {
          const years = [...new Set(docs.map(d =>
            (d.year ?? new Date(d.created_at).getFullYear()).toString(),
          ))].sort((a, b) => +b - +a);
          const latest = years[0];
          expandedYearRef.current = latest;
          setExpandedYear(latest);

          const groups = docs.reduce((acc, doc) => {
            const y = (doc.year ?? new Date(doc.created_at).getFullYear()).toString();
            const m = (doc.month ?? (new Date(doc.created_at).getMonth() + 1)).toString();
            if (!acc[y]) acc[y] = new Set<string>();
            acc[y].add(m);
            return acc;
          }, {} as Record<string, Set<string>>);

          const recentMonths = [...(groups[latest] ?? [])].sort((a, b) => +b - +a);
          if (recentMonths.length) {
            setMonthFilter(prev => ({ ...prev, [latest]: recentMonths[0] }));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [channelId, filterYear, filterMonth]);

  useEffect(() => {
    setPage(1);
    setDocuments([]);
    expandedYearRef.current = null;
    setExpandedYear(null);
    fetchDocuments(1);
  }, [fetchDocuments]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const next = page + 1;
      setPage(next);
      fetchDocuments(next, true);
    }
  };

  const groupedDocs: GroupedDocuments = documents.reduce((acc, doc) => {
    const y = (doc.year ?? new Date(doc.created_at).getFullYear()).toString();
    const m = (doc.month ?? (new Date(doc.created_at).getMonth() + 1)).toString();
    if (!acc[y]) acc[y] = {};
    if (!acc[y][m]) acc[y][m] = [];
    acc[y][m].push(doc);
    return acc;
  }, {} as GroupedDocuments);

  const years = Object.keys(groupedDocs).sort((a, b) => +b - +a);

  const handleDownload = (doc: Document) => {
    const url = getDocUrl(doc);
    if (url) window.open(url, '_blank');
  };

  const handleDocClick = async (doc: Document) => {
    setOpeningDocId(doc.id);
    setReaderLoading(true);
    setSelectedDoc(doc);
    try {
      const res = await axios.get(`${API_BASE_URL}/mymedia/document/${doc.id}/pages`);
      if (res.data?.success && res.data.data) {
        setSelectedDoc(res.data.data as Document);
      }
    } catch (err) {
      console.error('Error fetching document pages:', err);
      // Keep list doc — reader may fall back to PDF stream
    } finally {
      setReaderLoading(false);
      setOpeningDocId(null);
    }
  };

  const toggleYear = (year: string) => {
    const next = expandedYear === year ? null : year;
    expandedYearRef.current = next;
    setExpandedYear(next);

    if (next && !monthFilter[next]) {
      const months = Object.keys(groupedDocs[next] ?? {}).sort((a, b) => +b - +a);
      if (months.length) {
        setMonthFilter(prev => ({ ...prev, [next]: months[0] }));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="sticky top-0 z-40 bg-gray-950 text-white shadow-lg">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <button
            onClick={onBack}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>

          <button
            className="flex-1 flex items-center gap-3 min-w-0 text-left"
            onClick={onViewDetails}
          >
            {channelLogo ? (
              <img
                src={getUploadUrl(channelLogo)}
                alt={channelName}
                className="w-10 h-10 rounded-xl object-contain bg-white/10 flex-shrink-0 border border-white/10"
                {...WASABI_IMG_PROPS}
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-base font-black flex-shrink-0">
                {channelName?.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-bold text-[15px] leading-tight truncate">{channelName}</h1>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {loading ? 'Loading…' : `${documents.length} issue${documents.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </button>
        </div>

        {loading && (
          <div className="h-0.5 bg-white/10">
            <div className="h-full bg-teal-400 animate-pulse" style={{ width: '60%' }} />
          </div>
        )}
      </div>

      <div className="flex-1 p-4 space-y-3">
        {loading && (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                <div className="flex items-center justify-between px-4 py-4">
                  <div className="h-4 bg-gray-200 rounded w-16" />
                  <div className="h-3 bg-gray-100 rounded w-20" />
                </div>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
            </div>
          </div>
        )}

        {!loading && years.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gray-200 flex items-center justify-center mb-4">
              <Newspaper size={36} className="text-gray-400" />
            </div>
            <p className="font-semibold text-gray-700 text-base">No Issues Yet</p>
            <p className="text-sm text-gray-400 mt-1">
              New issues will appear here when published.
            </p>
          </div>
        )}

        {!loading && years.map(year => {
          const yearDocs    = groupedDocs[year];
          const totalIssues = Object.values(yearDocs).flat().length;
          const isOpen      = expandedYear === year;
          const monthKeys   = Object.keys(yearDocs).sort((a, b) => +b - +a);
          const activeMonth = monthFilter[year] ?? monthKeys[0] ?? '';
          const visibleDocs = activeMonth ? (yearDocs[activeMonth] ?? []) : [];

          return (
            <div key={year} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => toggleYear(year)}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-950 flex items-center justify-center flex-shrink-0">
                    <Calendar size={16} className="text-teal-400" />
                  </div>
                  <span className="font-bold text-gray-900 text-base">{year}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white bg-teal-600 rounded-full px-2.5 py-0.5 font-semibold">
                    {totalIssues}
                  </span>
                  {isOpen
                    ? <ChevronUp size={18} className="text-gray-400" />
                    : <ChevronDown size={18} className="text-gray-400" />}
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="year-content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    {monthKeys.length > 1 && (
                      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide border-t border-gray-100 bg-gray-50">
                        {monthKeys.map(m => {
                          const isActive = activeMonth === m;
                          return (
                            <button
                              key={m}
                              onClick={() => setMonthFilter(prev => ({ ...prev, [year]: m }))}
                              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                isActive
                                  ? 'bg-gray-950 text-white border-gray-950'
                                  : 'bg-white text-gray-600 border-gray-200 hover:border-teal-400'
                              }`}
                            >
                              {MONTHS[parseInt(m) - 1]}
                              <span className={`ml-1.5 ${isActive ? 'text-teal-300' : 'text-gray-400'}`}>
                                {yearDocs[m].length}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {visibleDocs.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3 px-4 pb-4 pt-3">
                        {visibleDocs.map((doc, idx) => (
                          <IssueCard
                            key={doc.id}
                            doc={doc}
                            index={idx}
                            opening={openingDocId === doc.id}
                            onClick={() => handleDocClick(doc)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-6 text-center">
                        <p className="text-sm text-gray-400">No issues for this month.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {!loading && hasMore && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full py-3.5 bg-gray-950 text-white rounded-2xl font-semibold hover:bg-gray-800 active:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loadingMore
              ? <><Loader2 size={16} className="animate-spin" /> Loading…</>
              : 'Load Older Issues'}
          </button>
        )}
      </div>

      <AnimatePresence>
        {selectedDoc && (
          <PageFlipReader
            doc={selectedDoc}
            channelName={channelName}
            loading={readerLoading}
            onClose={() => {
              setSelectedDoc(null);
              setReaderLoading(false);
            }}
            onDownload={() => handleDownload(selectedDoc)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default EPaperMagazineView;
