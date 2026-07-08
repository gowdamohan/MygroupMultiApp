/**
 * EPaperMagazineView
 *
 * Mobile-first digital newspaper / magazine browser.
 *
 * Layout:
 *  • Sticky header with channel branding
 *  • Year accordion → month chip-tabs → 2-column issue grid
 *  • Cheap covers (stored thumb → channel logo → gradient) — no client PDF.js thumbs
 *  • PDF / media open in full-screen modal (progressive page-1-first reader)
 *
 * API: GET /api/v1/mymedia/channel/:channelId/documents
 */
import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import {
  ArrowLeft, Download, Calendar, ChevronDown, ChevronUp,
  Loader2, Newspaper, BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL, getUploadUrl, WASABI_IMG_PROPS } from '../../config/api.config';
import { isPdfFile, getDocumentStreamUrl } from '../../utils/pdfViewer';

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
  thumbnail_url?: string;
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

/** Shimmer skeleton card shown while loading */
const SkeletonCard: React.FC = () => (
  <div className="rounded-xl overflow-hidden bg-gray-200 animate-pulse">
    <div className="w-full aspect-[3/4] bg-gray-300" />
    <div className="p-2 space-y-1.5">
      <div className="h-2.5 bg-gray-300 rounded w-3/4" />
      <div className="h-2 bg-gray-200 rounded w-1/2" />
    </div>
  </div>
);

/** Resolve the best available URL for a document (direct Wasabi → stream → upload). */
const getDocUrl = (doc: Document): string => {
  if (doc.file_url && (doc.file_url.startsWith('http://') || doc.file_url.startsWith('https://'))) {
    return doc.file_url;
  }
  if (doc.id) return getDocumentStreamUrl(doc.id);
  return getUploadUrl(doc.file_url);
};

/** Single issue card — cheap covers only (no client-side PDF thumb rendering). */
const IssueCard: React.FC<{
  doc: Document;
  index: number;
  channelLogo?: string;
  onClick: () => void;
}> = ({ doc, index, channelLogo, onClick }) => {
  const thumbUrl = doc.thumbnail_url ? getUploadUrl(doc.thumbnail_url) : null;
  const logoUrl = channelLogo ? getUploadUrl(channelLogo) : null;
  const gradient = COVER_GRADIENTS[index % COVER_GRADIENTS.length];
  const label = doc.date
    ? `${doc.date} ${doc.month ? MONTHS[doc.month - 1] : ''} ${doc.year ?? ''}`
    : doc.title;

  return (
    <button
      onClick={onClick}
      className="relative rounded-xl overflow-hidden shadow-md active:scale-95 transition-transform bg-white text-left w-full"
    >
      {/* Cover */}
      <div className="w-full aspect-[3/4] relative overflow-hidden">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={doc.title}
            className="w-full h-full object-cover"
            loading="lazy"
            {...WASABI_IMG_PROPS}
          />
        ) : logoUrl ? (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center p-4`}>
            <img
              src={logoUrl}
              alt={doc.title}
              className="max-w-full max-h-full object-contain"
              loading="lazy"
              {...WASABI_IMG_PROPS}
            />
          </div>
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-2`}>
            <Newspaper size={32} className="text-white/60" />
            <span className="text-white/80 text-xs font-bold px-2 text-center leading-tight line-clamp-2">
              {doc.title}
            </span>
          </div>
        )}
        {/* Overlay: issue date/title */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent pt-6 pb-2 px-2">
          <p className="text-white text-[11px] font-semibold leading-tight line-clamp-2">{label}</p>
        </div>
        {/* PDF badge */}
        {isPdfFile(doc.file_url, doc.document_type) && (
          <span className="absolute top-1.5 right-1.5 bg-black/50 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
            PDF
          </span>
        )}
      </div>
      {/* Footer row */}
      <div className="flex items-center justify-between px-2 py-1.5">
        <p className="text-gray-500 text-[10px] truncate">
          {doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB` : doc.document_type?.toUpperCase() || 'PDF'}
        </p>
        <BookOpen size={12} className="text-teal-500 flex-shrink-0" />
      </div>
    </button>
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
  const [monthFilter,  setMonthFilter]  = useState<Record<string, string>>({}); // year → monthKey
  const [selectedDoc,  setSelectedDoc]  = useState<Document | null>(null);
  const expandedYearRef = useRef<string | null>(null);

  /* ── Fetch documents ─────────────────────────────────────────── */
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

        /* Auto-expand current year on first load */
        if (docs.length > 0 && !expandedYearRef.current) {
          const years = [...new Set(docs.map(d =>
            (d.year ?? new Date(d.created_at).getFullYear()).toString(),
          ))].sort((a, b) => +b - +a);
          const latest = years[0];
          expandedYearRef.current = latest;
          setExpandedYear(latest);

          /* Auto-select most recent month */
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

  /* ── Derive grouped structure ─────────────────────────────────── */
  const groupedDocs: GroupedDocuments = documents.reduce((acc, doc) => {
    const y = (doc.year ?? new Date(doc.created_at).getFullYear()).toString();
    const m = (doc.month ?? (new Date(doc.created_at).getMonth() + 1)).toString();
    if (!acc[y]) acc[y] = {};
    if (!acc[y][m]) acc[y][m] = [];
    acc[y][m].push(doc);
    return acc;
  }, {} as GroupedDocuments);

  const years = Object.keys(groupedDocs).sort((a, b) => +b - +a);

  /* ── Download / open helper ───────────────────────────────────── */
  const handleDownload = (doc: Document) => {
    const url = getDocUrl(doc);
    if (url) window.open(url, '_blank');
  };

  /** All issues open in-app (PDF uses progressive page-1-first reader). */
  const handleDocClick = (doc: Document) => {
    setSelectedDoc(doc);
  };

  /* ── Toggle year accordion & auto-select month ─────────────── */
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

  const selectedIsPdf = selectedDoc
    ? isPdfFile(selectedDoc.file_url, selectedDoc.document_type)
    : false;

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* ═══ HEADER ════════════════════════════════════════════════ */}
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

        {/* Thin progress bar during load */}
        {loading && (
          <div className="h-0.5 bg-white/10">
            <div className="h-full bg-teal-400 animate-pulse" style={{ width: '60%' }} />
          </div>
        )}
      </div>

      {/* ═══ BODY ═══════════════════════════════════════════════════ */}
      <div className="flex-1 p-4 space-y-3">

        {/* Loading skeleton */}
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

        {/* Empty state */}
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

        {/* Year accordion */}
        {!loading && years.map(year => {
          const yearDocs    = groupedDocs[year];
          const totalIssues = Object.values(yearDocs).flat().length;
          const isOpen      = expandedYear === year;
          const monthKeys   = Object.keys(yearDocs).sort((a, b) => +b - +a);
          const activeMonth = monthFilter[year] ?? monthKeys[0] ?? '';
          const visibleDocs = activeMonth ? (yearDocs[activeMonth] ?? []) : [];

          return (
            <div key={year} className="bg-white rounded-2xl shadow-sm overflow-hidden">

              {/* Year row */}
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
                    {/* Month chips */}
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

                    {/* Issue grid */}
                    {visibleDocs.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3 px-4 pb-4 pt-3">
                        {visibleDocs.map((doc, idx) => (
                          <IssueCard
                            key={doc.id}
                            doc={doc}
                            index={idx}
                            channelLogo={channelLogo}
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

        {/* Load more */}
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

      {/* ═══ FULL-SCREEN READER MODAL ══════════════════════════════ */}
      <AnimatePresence>
        {selectedDoc && (
          <motion.div
            key="reader"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed inset-0 z-50 flex flex-col bg-gray-900"
          >
            {/* Reader toolbar */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-950 border-b border-gray-800 flex-shrink-0">
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white flex-shrink-0"
                aria-label="Close reader"
              >
                <ArrowLeft size={20} />
              </button>

              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm leading-tight truncate">
                  {selectedDoc.title}
                </p>
                <p className="text-gray-400 text-xs mt-0.5">
                  {[
                    selectedDoc.date,
                    selectedDoc.month ? MONTHS[selectedDoc.month - 1] : null,
                    selectedDoc.year,
                  ].filter(Boolean).join(' ') || channelName}
                </p>
              </div>

              <button
                onClick={() => handleDownload(selectedDoc)}
                className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-xl text-white text-xs font-semibold transition-colors flex-shrink-0"
                aria-label="Download"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Download</span>
              </button>
            </div>

            <div className="flex-1 min-h-0 bg-gray-800">
              {selectedIsPdf ? (
                <Suspense
                  fallback={
                    <div className="h-full flex flex-col items-center justify-center gap-3 text-white">
                      <Loader2 size={28} className="animate-spin text-teal-400" />
                      <p className="text-sm text-gray-400">Opening first page…</p>
                    </div>
                  }
                >
                  <PdfDocumentViewer
                    documentId={selectedDoc.id}
                    src={selectedDoc.file_url}
                    title={selectedDoc.title}
                    className="h-full"
                  />
                </Suspense>
              ) : (
                <div className="h-full flex items-center justify-center p-4">
                  <img
                    src={getUploadUrl(selectedDoc.file_url)}
                    alt={selectedDoc.title}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
                    {...WASABI_IMG_PROPS}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EPaperMagazineView;
