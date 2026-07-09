import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';
import { PdfDocumentViewer } from '../shared/PdfDocumentViewer';
import { isPdfFile } from '../../utils/pdfViewer';
import { FileText, MessageCircle, Send, User, Upload, Calendar, Eye } from 'lucide-react';
import { MONTHS } from '../../utils/periodicalSlots';
import { isMagazineCategory, ChannelCategoryContext } from '../../utils/mediaCategoryUtils';

interface PrintDocument {
  id: number;
  document_year: number;
  document_month: number;
  document_date: number;
  document_url: string;
  file_name: string;
  created_at?: string;
}

interface Comment {
  id: number;
  comment_text: string;
  created_at: string;
  user: {
    id: number;
    full_name: string;
    profile?: { profile_photo: string | null };
  };
  replies?: Comment[];
}

interface InteractionsData {
  likes_count: number;
  dislikes_count: number;
  followers_count: number;
  shortlist_count: number;
  comments_count: number;
  views_count: number;
}

interface PrintMediaOutputPanelProps {
  channelId: string;
  categoryId: number;
  categoryCtx: ChannelCategoryContext;
  activeTab: 'output' | 'preview';
  comments: Comment[];
  interactions: InteractionsData | null;
  commentText: string;
  setCommentText: (v: string) => void;
  replyingTo: number | null;
  setReplyingTo: (v: number | null) => void;
  replyText: string;
  setReplyText: (v: string) => void;
  onAddComment: (parentId: number | null) => void;
  formatTimeAgo: (date: string) => string;
  formatCount: (count: number) => string;
  onNavigateUpload: () => void;
  onSwitchToPreview?: () => void;
  refreshKey?: number;
}

export const PrintMediaOutputPanel: React.FC<PrintMediaOutputPanelProps> = ({
  channelId,
  categoryId,
  categoryCtx,
  activeTab,
  comments,
  interactions,
  commentText,
  setCommentText,
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText,
  onAddComment,
  formatTimeAgo,
  formatCount,
  onNavigateUpload,
  onSwitchToPreview,
  refreshKey = 0
}) => {
  const isMagazine = isMagazineCategory(categoryCtx);
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [documents, setDocuments] = useState<PrintDocument[]>([]);
  const [lastUploaded, setLastUploaded] = useState<PrintDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUploadedLoading, setLastUploadedLoading] = useState(false);
  const [activeDocId, setActiveDocId] = useState<number | null>(null);
  const [previewInitialized, setPreviewInitialized] = useState(false);

  const years = useMemo(
    () => Array.from({ length: 7 }, (_, i) => now.getFullYear() - 5 + i),
    []
  );

  const fetchLastUploaded = useCallback(async () => {
    try {
      setLastUploadedLoading(true);
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(
        `${API_BASE_URL}/media-document/last-uploaded/${channelId}/${categoryId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success && res.data.data) {
        const doc: PrintDocument = res.data.data;
        setLastUploaded(doc);
        if (!previewInitialized) {
          setSelectedYear(doc.document_year);
          setSelectedMonth(doc.document_month);
          setActiveDocId(doc.id);
          setPreviewInitialized(true);
        }
      } else {
        setLastUploaded(null);
      }
    } catch {
      setLastUploaded(null);
    } finally {
      setLastUploadedLoading(false);
    }
  }, [channelId, categoryId, previewInitialized]);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(
        `${API_BASE_URL}/media-document/documents/${channelId}/${categoryId}/${selectedYear}/${selectedMonth}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        const docs: PrintDocument[] = res.data.data || [];
        setDocuments(docs);
        setActiveDocId((prev) => {
          if (prev && docs.some((d) => d.id === prev)) return prev;
          const sorted = [...docs].sort(
            (a, b) => b.document_date - a.document_date || b.id - a.id
          );
          return sorted[0]?.id ?? null;
        });
      } else {
        setDocuments([]);
        setActiveDocId(null);
      }
    } catch {
      setDocuments([]);
      setActiveDocId(null);
    } finally {
      setLoading(false);
    }
  }, [channelId, categoryId, selectedYear, selectedMonth]);

  useEffect(() => {
    fetchLastUploaded();
  }, [fetchLastUploaded, refreshKey]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const activeDoc = documents.find((d) => d.id === activeDocId) || null;
  const outputDoc = lastUploaded;

  const monthLabel = `${MONTHS[selectedMonth - 1]} ${selectedYear}`;

  const formatDocLabel = (doc: PrintDocument) =>
    isMagazine
      ? `Day ${doc.document_date} — ${MONTHS[doc.document_month - 1]} ${doc.document_year}`
      : formatIssueDate(doc);

  const lastUploadedPanel = (doc: PrintDocument | null, loadingState: boolean, dark = false) => (
    <div className={`${dark ? 'bg-gray-800 border-gray-700' : 'bg-teal-50 border-teal-200'} border rounded-lg p-3 mb-3`}>
      <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${dark ? 'text-teal-400' : 'text-teal-800'}`}>
        Last Uploaded
      </p>
      {loadingState ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : doc ? (
        <div className="space-y-1">
          <p className={`text-sm font-semibold ${dark ? 'text-gray-100' : 'text-gray-800'}`}>{formatDocLabel(doc)}</p>
          <p className={`text-xs truncate ${dark ? 'text-gray-400' : 'text-gray-600'}`} title={doc.file_name}>{doc.file_name}</p>
          {doc.created_at && (
            <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-500'}`}>
              Uploaded {new Date(doc.created_at).toLocaleString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No uploads yet</p>
      )}
    </div>
  );

  const docsByDate = useMemo(() => {
    const map = new Map<number, PrintDocument>();
    documents.forEach((d) => {
      const existing = map.get(d.document_date);
      if (!existing || d.id > existing.id) map.set(d.document_date, d);
    });
    return map;
  }, [documents]);

  const renderPdfViewer = (doc: PrintDocument | null, className = '') => {
    if (!doc) {
      return (
        <div className={`flex flex-col items-center justify-center text-gray-400 ${className}`}>
          <FileText size={48} className="mb-2 opacity-50" />
          <p className="text-sm">No issue uploaded for {monthLabel}</p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onNavigateUpload}
              className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 flex items-center gap-2"
            >
              <Upload size={16} /> Upload PDF
            </button>
            {onSwitchToPreview && (
              <button
                type="button"
                onClick={onSwitchToPreview}
                className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-500 flex items-center gap-2"
              >
                <Eye size={16} /> Preview
              </button>
            )}
          </div>
        </div>
      );
    }
    const isPdf = isPdfFile(doc.document_url);
    if (isPdf) {
      return (
        <PdfDocumentViewer
          documentId={doc.id}
          src={doc.document_url}
          title={doc.file_name}
          className={`w-full h-full ${className}`}
        />
      );
    }
    return (
      <img
        src={doc.document_url}
        alt={doc.file_name}
        className={`w-full h-full object-contain ${className}`}
      />
    );
  };

  const commentsPanel = (
    <div className="w-80 lg:w-96 bg-white flex flex-col border-l border-gray-300">
      <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <MessageCircle size={20} />
          Comments:
        </h3>
        <span className="text-sm">{comments.length} total</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.length === 0 ? (
          <div className="text-sm text-gray-500 py-8 text-center">No comments yet.</div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="space-y-2">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {comment.user?.profile?.profile_photo ? (
                    <img src={comment.user.profile.profile_photo} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <User size={16} className="text-gray-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{comment.user?.full_name || 'User'}</span>
                    <span className="text-xs text-gray-400">{formatTimeAgo(comment.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.comment_text}</p>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className="text-xs text-blue-500 hover:underline mt-1"
                  >
                    Reply
                  </button>
                  {replyingTo === comment.id && (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        className="flex-1 px-3 py-1 text-sm border rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                        onKeyDown={(e) => e.key === 'Enter' && onAddComment(comment.id)}
                      />
                      <button
                        type="button"
                        onClick={() => onAddComment(comment.id)}
                        className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Type a comment..."
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && onAddComment(null)}
          />
          <button
            type="button"
            onClick={() => onAddComment(null)}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  const statsBar = (
    <>
      <div className="bg-red-700 flex items-center text-white">
        <div className="flex items-center gap-2 px-4 py-2 bg-green-600">
          <FileText size={20} />
          <span className="font-bold">: {formatCount(interactions?.views_count || 0)}</span>
        </div>
        <div className="flex-1 flex items-center justify-center gap-4 px-4 py-2">
          <span className="font-bold flex items-center gap-2">
            <Calendar size={18} />
            {monthLabel}
          </span>
          {outputDoc && (
            <span className="text-sm text-red-100">
              Issue: {isMagazine ? `Day ${outputDoc.document_date}` : formatIssueDate(outputDoc)}
            </span>
          )}
        </div>
      </div>
      <div className="flex bg-gray-900 text-white">
        <div className="flex-1 flex items-center justify-center gap-2 py-3 border-r border-gray-700">
          <span className="text-red-500 font-bold">Likes:</span>
          <span className="font-bold text-lg">{formatCount(interactions?.likes_count || 0)}</span>
        </div>
        <div className="flex-1 flex items-center justify-center gap-2 py-3 border-r border-gray-700">
          <span className="text-red-500 font-bold">Unlikes:</span>
          <span className="font-bold text-lg">{formatCount(interactions?.dislikes_count || 0)}</span>
        </div>
        <div className="flex-1 flex items-center justify-center gap-2 py-3 border-r border-gray-700">
          <span className="text-green-500 font-bold">Followers:</span>
          <span className="font-bold text-lg">{formatCount(interactions?.followers_count || 0)}</span>
        </div>
        <div className="flex-1 flex items-center justify-center gap-2 py-3">
          <span className="text-blue-500 font-bold">Shortlists:</span>
          <span className="font-bold text-lg">{formatCount(interactions?.shortlist_count || 0)}</span>
        </div>
      </div>
    </>
  );

  if (activeTab === 'output') {
    return (
      <div className="flex-1 flex bg-black min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <div className="flex-1 bg-gray-900 relative min-h-0 overflow-hidden">
            {lastUploadedLoading ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">Loading last uploaded…</div>
            ) : (
              renderPdfViewer(outputDoc, 'absolute inset-0 w-full h-full')
            )}
          </div>
          <div className="px-4 py-2 border-t border-gray-700">
            {lastUploadedPanel(lastUploaded, lastUploadedLoading, true)}
          </div>
          {statsBar}
        </div>
        {commentsPanel}
      </div>
    );
  }

  // Preview tab — month/year navigation and per-issue selection
  return (
    <div className="flex-1 flex bg-gray-600 min-h-0 p-4 gap-4 overflow-hidden">
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-lg overflow-hidden min-w-0 min-h-0">
        <div className="bg-teal-700 text-white px-4 py-3 flex flex-wrap items-center gap-4">
          <span className="font-bold">Preview — Browse by Month</span>
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 rounded text-gray-800 text-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 rounded text-gray-800 text-sm"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 flex-col md:flex-row overflow-hidden">
          <div className="md:w-56 border-r border-gray-200 p-3 overflow-y-auto bg-gray-50">
            {lastUploadedPanel(lastUploaded, lastUploadedLoading)}
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{monthLabel}</p>
            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : documents.length === 0 ? (
              <p className="text-sm text-gray-500">No uploads this month</p>
            ) : (
              <div className="space-y-1">
                {[...documents]
                  .sort((a, b) => a.document_date - b.document_date)
                  .map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setActiveDocId(doc.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeDocId === doc.id
                          ? 'bg-teal-600 text-white'
                          : 'bg-white border border-gray-200 hover:border-teal-400'
                      }`}
                    >
                      {isMagazine
                        ? `Issue — Day ${doc.document_date}`
                        : formatIssueDate(doc)}
                    </button>
                  ))}
              </div>
            )}
            {!isMagazine && (
              <div className="mt-4 grid grid-cols-7 gap-1">
                {Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }, (_, i) => i + 1).map((day) => {
                  const doc = docsByDate.get(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={!doc}
                      onClick={() => doc && setActiveDocId(doc.id)}
                      className={`text-xs py-1 rounded ${
                        doc
                          ? activeDoc?.document_date === day
                            ? 'bg-teal-600 text-white'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {/* Main viewer — takes remaining width/height */}
          <div className="flex-1 min-h-0 overflow-hidden bg-gray-100">
            {renderPdfViewer(activeDoc, 'w-full h-full')}
          </div>
        </div>
      </div>

      <div className="w-72 flex flex-col gap-3">
        <div className="bg-red-600 text-white text-center py-2 font-bold rounded-lg">Output</div>
        <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden min-h-[200px] border-2 border-red-500">
          {renderPdfViewer(lastUploaded || activeDoc, 'w-full h-full')}
        </div>
        <p className="text-xs text-white text-center">
          {lastUploaded
            ? `Last uploaded issue shown on Output tab`
            : `Selected issue will appear on the Output tab for ${monthLabel}`}
        </p>
      </div>
    </div>
  );
};

function formatIssueDate(doc: PrintDocument): string {
  const d = new Date(doc.document_year, doc.document_month - 1, doc.document_date);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export default PrintMediaOutputPanel;
