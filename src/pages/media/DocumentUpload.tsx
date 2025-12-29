import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Upload, FileText, Trash2, Check, X, Calendar } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5002/api/v1';

interface DocumentUploadProps {
  channelId: number;
  category: {
    id: number;
    category_name: string;
  };
  onBack: () => void;
}

interface Document {
  id: number;
  document_date: number;
  document_url: string;
  file_name: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ channelId, category, onBack }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Generate years (last 5 years + next year)
  const years = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);

  // Generate days for the selected month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };
  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => {
    fetchDocuments();
  }, [selectedYear, selectedMonth, channelId, category.id]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${API_BASE_URL}/media-document/documents/${channelId}/${category.id}/${selectedYear}/${selectedMonth}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setDocuments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (date: number, file: File) => {
    if (file.type !== 'application/pdf') {
      setMessage({ type: 'error', text: 'Only PDF files are allowed' });
      return;
    }

    try {
      setUploading(date);
      setMessage(null);
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('document', file);
      formData.append('categoryId', category.id.toString());
      formData.append('year', selectedYear.toString());
      formData.append('month', selectedMonth.toString());
      formData.append('date', date.toString());

      const response = await axios.post(
        `${API_BASE_URL}/media-document/upload/${channelId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Document uploaded successfully' });
        fetchDocuments();
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Upload failed' });
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (documentId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.delete(
        `${API_BASE_URL}/media-document/document/${documentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Document deleted successfully' });
        fetchDocuments();
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Delete failed' });
    }
  };

  const getDocumentForDate = (date: number) => {
    return documents.find(doc => doc.document_date === date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Upload {category.category_name}</h2>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Year and Month Selection */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Year Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Month Tabs */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Select Month</label>
          <div className="flex flex-wrap gap-2">
            {MONTHS.map((month, index) => (
              <button
                key={month}
                onClick={() => setSelectedMonth(index + 1)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMonth === index + 1
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {month}
              </button>
            ))}
          </div>
        </div>

        {/* Date Grid */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Calendar className="inline-block mr-2" size={16} />
            Upload PDFs for {MONTHS[selectedMonth - 1]} {selectedYear}
          </label>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
              {dates.map(date => {
                const doc = getDocumentForDate(date);
                const isUploading = uploading === date;

                return (
                  <div
                    key={date}
                    className={`relative p-3 rounded-lg border-2 text-center transition-all ${
                      doc
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-teal-300'
                    }`}
                  >
                    <div className="text-lg font-bold text-gray-800 mb-2">{date}</div>

                    {isUploading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600"></div>
                      </div>
                    ) : doc ? (
                      <div className="flex items-center justify-center gap-1">
                        <a
                          href={doc.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-teal-600 hover:bg-teal-100 rounded"
                          title="View PDF"
                        >
                          <FileText size={16} />
                        </a>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex items-center justify-center p-1 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors">
                        <Upload size={16} />
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
                );
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-green-500 bg-green-50"></div>
            <span>Uploaded</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-gray-200 bg-white"></div>
            <span>Not Uploaded</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;

