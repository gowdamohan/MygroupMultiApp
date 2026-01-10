import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, FileText, Download, Calendar, ChevronDown, ChevronUp, Eye, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';

interface EPaperMagazineViewProps {
  channelId: number;
  channelName: string;
  channelLogo?: string;
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

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const EPaperMagazineView: React.FC<EPaperMagazineViewProps> = ({
  channelId,
  channelName,
  channelLogo,
  onBack,
  onViewDetails
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedYear, setExpandedYear] = useState<string | null>(null);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchDocuments = useCallback(async (pageNum: number, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const response = await axios.get(`${API_BASE_URL}/mymedia/channel/${channelId}/documents?page=${pageNum}&limit=50`);
      if (response.data.success) {
        const newDocs = response.data.data.documents || [];
        setDocuments(prev => append ? [...prev, ...newDocs] : newDocs);
        setHasMore(response.data.data.pagination?.hasMore || false);
        
        // Auto-expand current year
        if (newDocs.length > 0 && !expandedYear) {
          const currentYear = new Date().getFullYear().toString();
          setExpandedYear(currentYear);
        }
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [channelId, expandedYear]);

  useEffect(() => {
    fetchDocuments(1);
  }, [fetchDocuments]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchDocuments(nextPage, true);
    }
  };

  // Group documents by year and month
  const groupedDocs: GroupedDocuments = documents.reduce((acc, doc) => {
    const year = doc.year?.toString() || new Date(doc.created_at).getFullYear().toString();
    const month = doc.month?.toString() || (new Date(doc.created_at).getMonth() + 1).toString();
    
    if (!acc[year]) acc[year] = {};
    if (!acc[year][month]) acc[year][month] = [];
    acc[year][month].push(doc);
    return acc;
  }, {} as GroupedDocuments);

  const years = Object.keys(groupedDocs).sort((a, b) => parseInt(b) - parseInt(a));

  const handleDownload = (doc: Document) => {
    window.open(`${BACKEND_URL}${doc.file_url}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-teal-700 text-white">
        <div className="flex items-center gap-3 p-4">
          <button onClick={onBack} className="p-2 hover:bg-teal-600 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1 flex items-center gap-3" onClick={onViewDetails}>
            {channelLogo ? (
              <img src={`${BACKEND_URL}${channelLogo}`} alt={channelName} className="w-10 h-10 rounded-lg object-contain bg-white" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-lg font-bold">{channelName?.charAt(0)}</div>
            )}
            <div>
              <h1 className="font-bold text-lg">{channelName}</h1>
              <p className="text-sm text-teal-100">{documents.length} issues</p>
            </div>
          </div>
        </div>
      </div>

      {/* Document List */}
      <div className="p-4 space-y-3">
        {years.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p>No documents available</p>
          </div>
        ) : (
          years.map(year => (
            <div key={year} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedYear(expandedYear === year ? null : year)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900">{year}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{Object.values(groupedDocs[year]).flat().length} issues</span>
                  {expandedYear === year ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </div>
              </button>

              <AnimatePresence>
                {expandedYear === year && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    {Object.keys(groupedDocs[year]).sort((a, b) => parseInt(b) - parseInt(a)).map(month => (
                      <div key={month} className="border-t">
                        <button
                          onClick={() => setExpandedMonth(expandedMonth === `${year}-${month}` ? null : `${year}-${month}`)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <span className="text-sm font-medium text-gray-700">{MONTHS[parseInt(month) - 1]}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{groupedDocs[year][month].length} issues</span>
                            {expandedMonth === `${year}-${month}` ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                          </div>
                        </button>

                        <AnimatePresence>
                          {expandedMonth === `${year}-${month}` && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="grid grid-cols-3 gap-2 p-3 bg-white">
                                {groupedDocs[year][month].map(doc => (
                                  <div
                                    key={doc.id}
                                    className="relative rounded-lg overflow-hidden shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => setSelectedDoc(doc)}
                                  >
                                    {doc.thumbnail_url ? (
                                      <img
                                        src={`${BACKEND_URL}${doc.thumbnail_url}`}
                                        alt={doc.title}
                                        className="w-full aspect-[3/4] object-cover"
                                        loading="lazy"
                                      />
                                    ) : (
                                      <div className="w-full aspect-[3/4] bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                                        <FileText size={32} className="text-red-400" />
                                      </div>
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                      <p className="text-white text-xs font-medium truncate">{doc.date || doc.title}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}

        {hasMore && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loadingMore ? <><Loader2 size={20} className="animate-spin" /> Loading...</> : 'Load More'}
          </button>
        )}
      </div>

      {/* Document Preview Modal */}
      <AnimatePresence>
        {selectedDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex flex-col"
            onClick={() => setSelectedDoc(null)}
          >
            <div className="flex items-center justify-between p-4 text-white">
              <div>
                <h3 className="font-bold">{selectedDoc.title}</h3>
                <p className="text-sm text-gray-300">
                  {selectedDoc.date && `${selectedDoc.date} `}
                  {selectedDoc.month && MONTHS[selectedDoc.month - 1]} {selectedDoc.year}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDownload(selectedDoc); }}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Download size={20} />
                <span>Download</span>
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
              {selectedDoc.document_type === 'pdf' ? (
                <iframe
                  src={`${BACKEND_URL}${selectedDoc.file_url}`}
                  className="w-full h-full rounded-lg bg-white"
                  title={selectedDoc.title}
                />
              ) : (
                <img
                  src={`${BACKEND_URL}${selectedDoc.file_url}`}
                  alt={selectedDoc.title}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EPaperMagazineView;

