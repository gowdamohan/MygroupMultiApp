import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Upload, FileText, Trash2, Calendar, Newspaper, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '../../config/api.config';

interface EPaperUploadProps {
  channelId: number;
  categoryId: number;
  onBack: () => void;
}

interface Document {
  id: number;
  document_year: number;
  document_month: number;
  document_date: number;
  document_url: string;
  file_name: string;
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

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

export const EPaperUpload: React.FC<EPaperUploadProps> = ({ channelId, categoryId, onBack }) => {
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

  const [dates] = useState<Date[]>([yesterday, today, tomorrow]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [channelId, categoryId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const allDocs: Document[] = [];
      // Fetch docs for the months covered by our 3 dates
      const monthsToFetch = new Set(dates.map(d => `${d.getFullYear()}-${d.getMonth() + 1}`));
      const promises = Array.from(monthsToFetch).map(key => {
        const [year, month] = key.split('-');
        return axios.get(
          `${API_BASE_URL}/media-document/documents/${channelId}/${categoryId}/${year}/${month}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch(() => ({ data: { success: false, data: [] } }));
      });
      const results = await Promise.all(promises);
      results.forEach(res => {
        if (res.data.success) allDocs.push(...res.data.data);
      });
      setDocuments(allDocs);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDocForDate = (date: Date) => {
    return documents.find(d =>
      d.document_year === date.getFullYear() &&
      d.document_month === date.getMonth() + 1 &&
      d.document_date === date.getDate()
    );
  };

  const handleFileUpload = async (date: Date, file: File) => {
    if (file.type !== 'application/pdf') {
      setMessage({ type: 'error', text: 'Only PDF files are allowed' });
      return;
    }
    const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    try {
      setUploading(key);
      setMessage(null);
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('document', file);
      formData.append('categoryId', categoryId.toString());
      formData.append('year', date.getFullYear().toString());
      formData.append('month', (date.getMonth() + 1).toString());
      formData.append('date', date.getDate().toString());

      const response = await axios.post(
        `${API_BASE_URL}/media-document/upload/${channelId}`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );
      if (response.data.success) {
        setMessage({ type: 'success', text: 'E-Paper uploaded successfully' });
        fetchDocuments();
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Upload failed' });
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (documentId: number) => {
    if (!confirm('Are you sure you want to delete this e-paper?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/media-document/document/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'E-Paper deleted successfully' });
      fetchDocuments();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Delete failed' });
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <Newspaper size={24} className="text-teal-600" />
        <h2 className="text-2xl font-bold text-gray-800">Upload E-Paper</h2>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Date Cards */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-6">
          <Calendar size={18} className="text-teal-600" />
          <h3 className="text-lg font-semibold text-gray-700">Select Date & Upload</h3>
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
                    isToday ? 'border-teal-500 shadow-lg shadow-teal-100' : doc ? 'border-green-500' : 'border-gray-200'
                  }`}
                >
                  {/* Date Header */}
                  <div className={`px-4 py-3 ${isToday ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                    <p className="text-lg font-bold">{label}</p>
                    <p className={`text-sm ${isToday ? 'text-teal-100' : 'text-gray-500'}`}>{formatDate(date)}</p>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {isUploading ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-2"></div>
                        <span className="text-sm text-gray-500">Uploading...</span>
                      </div>
                    ) : doc ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                          <FileText size={20} className="text-green-600 flex-shrink-0" />
                          <p className="text-sm text-green-800 truncate flex-1" title={doc.file_name}>{doc.file_name}</p>
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
                        {/* Re-upload option */}
                        <label className="cursor-pointer flex items-center justify-center gap-2 py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-teal-400 hover:text-teal-600 transition-colors text-sm">
                          <Upload size={14} /> Replace PDF
                          <input
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={(e) => {
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
                        <span className="text-sm font-medium text-gray-600">Upload E-Paper PDF</span>
                        <span className="text-xs text-gray-400 mt-1">Click to select file</span>
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => {
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
    </div>
  );
};

export default EPaperUpload;

