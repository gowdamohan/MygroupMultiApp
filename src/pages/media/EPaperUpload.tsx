import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  ArrowLeft, Upload, FileText, Trash2, Calendar, Newspaper,
  ChevronLeft, ChevronRight, Eye, UploadCloud, X
} from 'lucide-react';
import { API_BASE_URL, MEDIA_DOCUMENT_MAX_SIZE } from '../../config/api.config';
import { PdfDocumentViewer } from '../../components/shared/PdfDocumentViewer';
import { isPdfFile } from '../../utils/pdfViewer';
import {
  deleteMediaDocument,
  MediaUploadProgress,
  postMediaDocumentUpload,
} from '../../utils/mediaDocumentUpload';
import { MediaDocumentUploadProgress } from '../../components/media/MediaDocumentUploadProgress';

interface EPaperUploadProps {
  channelId: number;
  categoryId: number;
  onBack: () => void;
  embedded?: boolean;
  onUploadComplete?: () => void;
}

interface Document {
  id: number;
  document_year: number;
  document_month: number;
  document_date: number;
  document_url: string;
  file_name: string;
}

type ViewMode = 'upload' | 'uploaded';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatDate = (date: Date): string =>
  date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

const getDateLabel = (date: Date): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === -1) return 'Yesterday';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return formatDate(date);
};

/** Returns the number of blank leading cells and the days array for a given month. */
const getMonthGrid = (year: number, month: number) => {
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  return { leadingBlanks: firstDay, daysInMonth };
};

export const EPaperUpload: React.FC<EPaperUploadProps> = ({
  channelId,
  categoryId,
  onBack,
  embedded = false,
  onUploadComplete
}) => {
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

  // ── Upload view state ──────────────────────────────────────────────────────
  const [dates] = useState<Date[]>([yesterday, today, tomorrow]);
  const [uploadDocs, setUploadDocs] = useState<Document[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<MediaUploadProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── View toggle ────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('upload');

  // ── Uploaded / calendar view state ────────────────────────────────────────
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1);
  const [calDocs, setCalDocs] = useState<Document[]>([]);
  const [calLoading, setCalLoading] = useState(false);
  const [activeDoc, setActiveDoc] = useState<Document | null>(null);

  // ── Fetch helpers ──────────────────────────────────────────────────────────

  const fetchUploadDocs = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const allDocs: Document[] = [];
      const monthsToFetch = new Set(dates.map(d => `${d.getFullYear()}-${d.getMonth() + 1}`));
      const promises = Array.from(monthsToFetch).map(key => {
        const [year, month] = key.split('-');
        return axios
          .get(`${API_BASE_URL}/media-document/documents/${channelId}/${categoryId}/${year}/${month}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .catch(() => ({ data: { success: false, data: [] } }));
      });
      const results = await Promise.all(promises);
      results.forEach(res => { if (res.data.success) allDocs.push(...res.data.data); });
      setUploadDocs(allDocs);
    } catch (err) {
      console.error('Error fetching upload documents:', err);
    } finally {
      setLoading(false);
    }
  }, [channelId, categoryId, dates]);

  const fetchCalendarDocs = useCallback(async (year: number, month: number) => {
    try {
      setCalLoading(true);
      const token = localStorage.getItem('accessToken');
      const res = await axios
        .get(`${API_BASE_URL}/media-document/documents/${channelId}/${categoryId}/${year}/${month}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .catch(() => ({ data: { success: false, data: [] } }));
      setCalDocs(res.data.success ? res.data.data : []);
    } catch (err) {
      console.error('Error fetching calendar documents:', err);
      setCalDocs([]);
    } finally {
      setCalLoading(false);
    }
  }, [channelId, categoryId]);

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => { fetchUploadDocs(); }, [fetchUploadDocs]);

  useEffect(() => {
    if (viewMode === 'uploaded') {
      setActiveDoc(null);
      fetchCalendarDocs(calYear, calMonth);
    }
  }, [viewMode, calYear, calMonth, fetchCalendarDocs]);

  // ── Upload view handlers ───────────────────────────────────────────────────

  const getDocForDate = (date: Date) =>
    uploadDocs.find(d =>
      d.document_year === date.getFullYear() &&
      d.document_month === date.getMonth() + 1 &&
      d.document_date === date.getDate()
    );

  const handleFileUpload = async (date: Date, file: File) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setMessage({ type: 'error', text: 'Only PDF or image files (JPG, PNG, WebP) are allowed' });
      return;
    }
    if (file.size > MEDIA_DOCUMENT_MAX_SIZE) {
      setMessage({
        type: 'error',
        text: `File size exceeds 200MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`,
      });
      return;
    }
    const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    try {
      setUploading(key);
      setUploadProgress({ phase: 'uploading', percent: 0, label: 'Uploading file…' });
      setMessage(null);
      const formData = new FormData();
      formData.append('document', file);
      formData.append('categoryId', categoryId.toString());
      formData.append('year', date.getFullYear().toString());
      formData.append('month', (date.getMonth() + 1).toString());
      formData.append('date', date.getDate().toString());
      const response = await postMediaDocumentUpload(channelId, formData, setUploadProgress);
      if (response.data.success) {
        const pages = response.data.data?.page_count;
        setMessage({
          type: 'success',
          text: pages
            ? `E-Paper uploaded (${pages} page${pages !== 1 ? 's' : ''} processed)`
            : 'E-Paper uploaded successfully',
        });
        await fetchUploadDocs();
        onUploadComplete?.();
      }
    } catch (error: any) {
      const msg =
        error?.code === 'ECONNABORTED'
          ? 'Upload timed out while processing pages. Please refresh — the file may still appear if processing finished on the server.'
          : error?.response?.status === 413
          ? 'File size exceeds 200MB limit. If this persists, ask your server admin to set nginx client_max_body_size to 200m.'
          : error.response?.data?.message || 'Upload failed';
      setMessage({ type: 'error', text: msg });
    } finally {
      setUploading(null);
      setUploadProgress(null);
    }
  };

  const handleDelete = async (documentId: number) => {
    if (!confirm('Are you sure you want to delete this e-paper?')) return;
    try {
      const { alreadyGone } = await deleteMediaDocument(documentId);
      setMessage({
        type: 'success',
        text: alreadyGone ? 'E-Paper was already removed' : 'E-Paper deleted successfully',
      });
      await fetchUploadDocs();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Delete failed' });
    }
  };

  // ── Calendar navigation ────────────────────────────────────────────────────

  const goToPrevMonth = () => {
    if (calMonth === 1) { setCalYear(y => y - 1); setCalMonth(12); }
    else { setCalMonth(m => m - 1); }
  };

  const goToNextMonth = () => {
    if (calMonth === 12) { setCalYear(y => y + 1); setCalMonth(1); }
    else { setCalMonth(m => m + 1); }
  };

  const getCalDocForDay = (day: number) =>
    calDocs.find(d => d.document_year === calYear && d.document_month === calMonth && d.document_date === day);

  // ── PDF / image preview renderer ──────────────────────────────────────────

  const renderPreview = (doc: Document) => {
    if (isPdfFile(doc.document_url)) {
      return (
        <PdfDocumentViewer
          documentId={doc.id}
          src={doc.document_url}
          title={doc.file_name}
          className="rounded-lg h-full"
        />
      );
    }
    return (
      <img
        key={doc.id}
        src={doc.document_url}
        alt={doc.file_name}
        className="w-full h-full object-contain rounded-lg"
      />
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const { leadingBlanks, daysInMonth } = getMonthGrid(calYear, calMonth);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        {!embedded && (
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
        )}
        <Newspaper size={24} className="text-teal-600" />
        <h2 className="text-2xl font-bold text-gray-800 flex-1">
          {viewMode === 'upload' ? 'Upload E-Paper' : 'Uploaded E-Papers'}
        </h2>

        {/* View toggle buttons */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => { setViewMode('upload'); setMessage(null); }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'upload'
                ? 'bg-teal-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <UploadCloud size={16} /> Upload
          </button>
          <button
            onClick={() => { setViewMode('uploaded'); setMessage(null); }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'uploaded'
                ? 'bg-teal-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Eye size={16} /> Uploaded View
          </button>
        </div>
      </div>

      {/* Message banner */}
      {message && (
        <div
          className={`flex items-start gap-3 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          <span className="flex-1">{message.text}</span>
          <button onClick={() => setMessage(null)} className="shrink-0 opacity-60 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── UPLOAD VIEW ─────────────────────────────────────────────────────── */}
      {viewMode === 'upload' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-6">
            <Calendar size={18} className="text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-700">Select Date &amp; Upload</h3>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {dates.map((date, idx) => {
                const doc = getDocForDate(date);
                const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
                const isUploading = uploading === key;
                const label = getDateLabel(date);
                const isToday = label === 'Today';

                return (
                  <div
                    key={idx}
                    className={`relative rounded-xl border-2 overflow-hidden transition-all ${
                      isToday
                        ? 'border-teal-500 shadow-lg shadow-teal-100'
                        : doc
                        ? 'border-green-500'
                        : 'border-gray-200'
                    }`}
                  >
                    {/* Date header */}
                    <div
                      className={`px-4 py-3 ${
                        isToday ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <p className="text-lg font-bold">{label}</p>
                      <p className={`text-sm ${isToday ? 'text-teal-100' : 'text-gray-500'}`}>
                        {formatDate(date)}
                      </p>
                    </div>

                    {/* Card body */}
                    <div className="p-4">
                      {isUploading ? (
                        <div className="flex flex-col items-center justify-center py-8 px-2">
                          {uploadProgress ? (
                            <MediaDocumentUploadProgress progress={uploadProgress} />
                          ) : (
                            <>
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-2" />
                              <span className="text-sm text-gray-500 text-center">Uploading…</span>
                            </>
                          )}
                        </div>
                      ) : doc ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                            <FileText size={20} className="text-green-600 shrink-0" />
                            <p className="text-sm text-green-800 truncate flex-1" title={doc.file_name}>
                              {doc.file_name}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={doc.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-teal-100 text-teal-700 rounded-lg text-sm font-medium hover:bg-teal-200 transition-colors"
                            >
                              <FileText size={16} /> View PDF
                            </a>
                            <button
                              onClick={() => handleDelete(doc.id)}
                              className="flex items-center justify-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                            >
                              <Trash2 size={16} /> Delete
                            </button>
                          </div>
                          <label className="cursor-pointer flex items-center justify-center gap-2 py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-teal-400 hover:text-teal-600 transition-colors text-sm">
                            <Upload size={14} /> Replace PDF
                            <input
                              type="file"
                              accept="application/pdf,image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(date, file);
                                e.target.value = '';
                              }}
                            />
                          </label>
                        </div>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-teal-400 hover:bg-teal-50 transition-colors">
                          <Upload size={32} className="text-gray-400 mb-2" />
                          <span className="text-sm font-medium text-gray-600">Upload E-Paper (PDF or Image)</span>
                          <span className="text-xs text-gray-400 mt-1">Click to select file</span>
                          <input
                            type="file"
                            accept="application/pdf,image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(date, file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── UPLOADED / CALENDAR VIEW ─────────────────────────────────────────── */}
      {viewMode === 'uploaded' && (
        <div className="space-y-4">
          {/* Calendar card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            {/* Month / Year navigation */}
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={goToPrevMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-teal-600" />
                <h3 className="text-lg font-bold text-gray-800">
                  {MONTH_NAMES[calMonth - 1]} {calYear}
                </h3>
              </div>

              <button
                onClick={goToNextMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Next month"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded bg-green-400" />
                Uploaded
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded bg-gray-100 border border-gray-200" />
                No upload
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded bg-teal-600" />
                Selected
              </span>
            </div>

            {calLoading ? (
              <div className="flex justify-center items-center py-16 text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
              </div>
            ) : (
              <>
                {/* Day-of-week header */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAY_LABELS.map(d => (
                    <div key={d} className="text-xs font-semibold text-center text-gray-500 py-1">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Leading blank cells */}
                  {Array.from({ length: leadingBlanks }).map((_, i) => (
                    <div key={`blank-${i}`} />
                  ))}

                  {/* Day cells */}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const doc = getCalDocForDay(day);
                    const isSelected = activeDoc?.document_date === day &&
                      activeDoc?.document_month === calMonth &&
                      activeDoc?.document_year === calYear;
                    const isCurrentDay =
                      day === today.getDate() &&
                      calMonth === today.getMonth() + 1 &&
                      calYear === today.getFullYear();

                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={!doc}
                        onClick={() => doc && setActiveDoc(doc)}
                        title={doc ? `${day} — ${doc.file_name}` : String(day)}
                        className={`
                          relative flex flex-col items-center justify-center rounded-lg py-2 text-sm font-medium
                          transition-all select-none
                          ${isSelected
                            ? 'bg-teal-600 text-white shadow-md ring-2 ring-teal-400'
                            : doc
                            ? 'bg-green-100 text-green-800 hover:bg-green-300 cursor-pointer'
                            : 'bg-gray-50 text-gray-400 cursor-default'}
                          ${isCurrentDay && !isSelected ? 'ring-2 ring-teal-400 ring-offset-1' : ''}
                        `}
                      >
                        <span>{day}</span>
                        {doc && !isSelected && (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-green-500" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Empty state */}
                {calDocs.length === 0 && (
                  <p className="text-center text-sm text-gray-400 mt-6">
                    No e-papers uploaded for {MONTH_NAMES[calMonth - 1]} {calYear}.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Document preview panel */}
          {activeDoc ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Preview header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={18} className="text-teal-600 shrink-0" />
                  <span className="text-sm font-semibold text-gray-700 truncate">
                    {MONTH_NAMES[activeDoc.document_month - 1]} {activeDoc.document_date}, {activeDoc.document_year}
                    &nbsp;&mdash;&nbsp;
                    <span className="font-normal text-gray-500">{activeDoc.file_name}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <a
                    href={activeDoc.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors"
                  >
                    <FileText size={14} /> Open in new tab
                  </a>
                  <button
                    onClick={() => setActiveDoc(null)}
                    className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-500"
                    aria-label="Close preview"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Preview body */}
              <div className="w-full" style={{ height: '75vh' }}>
                {renderPreview(activeDoc)}
              </div>
            </div>
          ) : (
            !calLoading && calDocs.length > 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                <Calendar size={40} className="mb-3 opacity-40" />
                <p className="text-sm">Click a highlighted date to preview its e-paper</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default EPaperUpload;
