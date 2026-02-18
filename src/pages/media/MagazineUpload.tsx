import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Upload, FileText, Trash2, Calendar, BookOpen } from 'lucide-react';
import { API_BASE_URL } from '../../config/api.config';

interface MagazineUploadProps {
  channelId: number;
  categoryId: number;
  periodicalType?: string;
  periodicalSchedule?: any;
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

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MagazineUpload: React.FC<MagazineUploadProps> = ({
  channelId, categoryId, periodicalType, periodicalSchedule, onBack
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const years = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);

  // Determine which months to show based on periodical type and schedule
  const getUploadSlots = (): { month: number; date: number; label: string }[] => {
    const schedule = periodicalSchedule || {};
    switch (periodicalType) {
      case 'Weekly':
        // Show all dates for each month (delegate to a per-month view)
        return MONTHS.map((m, i) => ({ month: i + 1, date: 1, label: m }));
      case 'Bi-weekly':
      case 'Fortnightly': {
        const d1 = parseInt(schedule.date1) || 1;
        const d2 = parseInt(schedule.date2) || 15;
        const slots: { month: number; date: number; label: string }[] = [];
        MONTHS.forEach((m, i) => {
          slots.push({ month: i + 1, date: d1, label: `${m} - Issue 1 (Date ${d1})` });
          slots.push({ month: i + 1, date: d2, label: `${m} - Issue 2 (Date ${d2})` });
        });
        return slots;
      }
      case 'Monthly':
        return MONTHS.map((m, i) => ({ month: i + 1, date: 1, label: m }));
      case 'Bimonthly': {
        const biMonths: { month: number; date: number; label: string }[] = [];
        for (let i = 1; i <= 6; i++) {
          const monthName = schedule[`month${i}`] || MONTHS[(i - 1) * 2];
          const monthIdx = MONTHS.indexOf(monthName);
          biMonths.push({ month: monthIdx >= 0 ? monthIdx + 1 : i * 2 - 1, date: 1, label: monthName });
        }
        return biMonths;
      }
      case 'Quarterly': {
        const qMonths: { month: number; date: number; label: string }[] = [];
        for (let i = 1; i <= 4; i++) {
          const monthName = schedule[`month${i}`] || MONTHS[(i - 1) * 3];
          const monthIdx = MONTHS.indexOf(monthName);
          qMonths.push({ month: monthIdx >= 0 ? monthIdx + 1 : i * 3 - 2, date: 1, label: `Q${i} - ${monthName}` });
        }
        return qMonths;
      }
      case 'Half-yearly': {
        const hMonths: { month: number; date: number; label: string }[] = [];
        for (let i = 1; i <= 2; i++) {
          const monthName = schedule[`month${i}`] || MONTHS[(i - 1) * 6];
          const monthIdx = MONTHS.indexOf(monthName);
          hMonths.push({ month: monthIdx >= 0 ? monthIdx + 1 : i * 6 - 5, date: 1, label: `H${i} - ${monthName}` });
        }
        return hMonths;
      }
      case 'Annually':
      case 'Yearly': {
        const monthName = schedule.month || 'January';
        const monthIdx = MONTHS.indexOf(monthName);
        return [{ month: monthIdx >= 0 ? monthIdx + 1 : 1, date: 1, label: monthName }];
      }
      case 'Specialized':
      case 'Seasonal': {
        const selectedMonths: string[] = schedule.months || [];
        return selectedMonths.map(m => {
          const monthIdx = MONTHS.indexOf(m);
          return { month: monthIdx >= 0 ? monthIdx + 1 : 1, date: 1, label: m };
        });
      }
      case 'Others':
      default:
        return MONTHS.map((m, i) => ({ month: i + 1, date: 1, label: m }));
    }
  };

  const uploadSlots = getUploadSlots();

  useEffect(() => {
    fetchAllDocuments();
  }, [selectedYear, channelId, categoryId]);

  const fetchAllDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const allDocs: Document[] = [];
      // Fetch documents for all 12 months at once
      const promises = Array.from({ length: 12 }, (_, i) =>
        axios.get(
          `${API_BASE_URL}/media-document/documents/${channelId}/${categoryId}/${selectedYear}/${i + 1}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch(() => ({ data: { success: false, data: [] } }))
      );
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

  const getDocForSlot = (month: number, date: number) => {
    return documents.find(d => d.document_month === month && d.document_date === date);
  };

  const handleFileUpload = async (month: number, date: number, file: File) => {
    if (file.type !== 'application/pdf') {
      setMessage({ type: 'error', text: 'Only PDF files are allowed' });
      return;
    }
    const key = `${month}-${date}`;
    try {
      setUploading(key);
      setMessage(null);
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('document', file);
      formData.append('categoryId', categoryId.toString());
      formData.append('year', selectedYear.toString());
      formData.append('month', month.toString());
      formData.append('date', date.toString());

      const response = await axios.post(
        `${API_BASE_URL}/media-document/upload/${channelId}`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Magazine uploaded successfully' });
        fetchAllDocuments();
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Upload failed' });
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (documentId: number) => {
    if (!confirm('Are you sure you want to delete this magazine?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/media-document/document/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Magazine deleted successfully' });
      fetchAllDocuments();
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
        <BookOpen size={24} className="text-teal-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Upload Magazine</h2>
          {periodicalType && <p className="text-sm text-gray-500">Periodical: {periodicalType}</p>}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Year Selector */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-4 mb-6">
          <label className="text-sm font-medium text-gray-700">Year:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            {years.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>

        {/* Upload Slots Grid */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadSlots.map((slot, idx) => {
              const doc = getDocForSlot(slot.month, slot.date);
              const isUploading = uploading === `${slot.month}-${slot.date}`;

              return (
                <div
                  key={idx}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    doc ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-teal-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={16} className="text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">{slot.label}</span>
                  </div>

                  {isUploading ? (
                    <div className="flex items-center justify-center py-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                    </div>
                  ) : doc ? (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 truncate" title={doc.file_name}>{doc.file_name}</p>
                      <div className="flex items-center gap-2">
                        <a
                          href={doc.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-teal-100 text-teal-700 rounded-lg text-xs font-medium hover:bg-teal-200"
                        >
                          <FileText size={14} /> View
                        </a>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="flex items-center justify-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-teal-400 hover:bg-teal-50 transition-colors">
                      <Upload size={20} className="text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">Upload PDF</span>
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(slot.month, slot.date, file);
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

export default MagazineUpload;

