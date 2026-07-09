import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { ArrowLeft, Upload, FileText, Trash2, Calendar, BookOpen } from 'lucide-react';
import { API_BASE_URL, MEDIA_DOCUMENT_MAX_SIZE } from '../../config/api.config';
import { parsePeriodicalSchedule, periodicalScheduleSignature } from '../../utils/mediaCategoryUtils';
import { getMagazineUploadSlots, normalizePeriodicalType } from '../../utils/periodicalSlots';
import { PeriodicalScheduleSummary } from '../../components/media/PeriodicalScheduleSummary';
import { uploadMediaDocument, getUploadErrorMessage } from '../../utils/mediaDocumentUpload';
import { UploadProgressBar } from '../../components/media/UploadProgressBar';

interface MagazineUploadProps {
  channelId: number;
  categoryId: number;
  periodicalType?: string;
  periodicalSchedule?: unknown;
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

export const MagazineUpload: React.FC<MagazineUploadProps> = ({
  channelId,
  categoryId,
  periodicalType: periodicalTypeProp,
  periodicalSchedule: periodicalScheduleProp,
  onBack,
  embedded = false,
  onUploadComplete
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const periodicalType = normalizePeriodicalType(periodicalTypeProp);
  const periodicalSchedule = useMemo(
    () => parsePeriodicalSchedule(periodicalScheduleProp),
    [periodicalScheduleProp]
  );
  const scheduleSignature = useMemo(
    () => periodicalScheduleSignature(periodicalSchedule),
    [periodicalSchedule]
  );

  const uploadSlots = useMemo(
    () => getMagazineUploadSlots(periodicalType, periodicalSchedule, selectedYear),
    [periodicalType, scheduleSignature, selectedYear]
  );

  const years = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);

  useEffect(() => {
    fetchAllDocuments();
  }, [selectedYear, channelId, categoryId]);

  const fetchAllDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const allDocs: Document[] = [];
      const promises = Array.from({ length: 12 }, (_, i) =>
        axios
          .get(
            `${API_BASE_URL}/media-document/documents/${channelId}/${categoryId}/${selectedYear}/${i + 1}`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
          .catch(() => ({ data: { success: false, data: [] } }))
      );
      const results = await Promise.all(promises);
      results.forEach((res) => {
        if (res.data.success) allDocs.push(...res.data.data);
      });
      setDocuments(allDocs);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDocForSlot = (month: number, date: number) =>
    documents.find(
      (d) =>
        d.document_year === selectedYear &&
        d.document_month === month &&
        d.document_date === date
    );

  const handleFileUpload = async (month: number, date: number, file: File, slotId: string) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setMessage({ type: 'error', text: 'Only PDF or image files (JPG, PNG, WebP) are allowed' });
      return;
    }
    if (file.size > MEDIA_DOCUMENT_MAX_SIZE) {
      setMessage({
        type: 'error',
        text: `File size exceeds 200MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`
      });
      return;
    }
    try {
      setUploading(slotId);
      setUploadProgress((prev) => ({ ...prev, [slotId]: 0 }));
      setMessage(null);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setMessage({ type: 'error', text: 'Please sign in again to upload.' });
        return;
      }

      await uploadMediaDocument({
        channelId,
        categoryId,
        year: selectedYear,
        month,
        date,
        file,
        token,
        onProgress: (percent) => {
          setUploadProgress((prev) => ({ ...prev, [slotId]: percent }));
        },
      });

      setMessage({ type: 'success', text: 'Magazine uploaded successfully' });
      fetchAllDocuments();
      onUploadComplete?.();
    } catch (error: unknown) {
      setMessage({ type: 'error', text: getUploadErrorMessage(error) });
    } finally {
      setUploading(null);
      setUploadProgress((prev) => {
        const next = { ...prev };
        delete next[slotId];
        return next;
      });
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
      onUploadComplete?.();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setMessage({ type: 'error', text: err.response?.data?.message || 'Delete failed' });
    }
  };

  const slotsGridKey = `${periodicalType}|${scheduleSignature}|${selectedYear}`;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        {!embedded && (
          <button type="button" onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
        )}
        <BookOpen size={24} className="text-teal-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Upload Magazine</h2>
          <p className="text-sm text-gray-500">Upload issues for your registered publication schedule</p>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <PeriodicalScheduleSummary
          periodicalType={periodicalType}
          schedule={periodicalSchedule}
        />

        <div className="flex flex-wrap items-center gap-4 mb-6">
          <label className="text-sm font-medium text-gray-700">Year:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-500">
            {uploadSlots.length} upload slot{uploadSlots.length !== 1 ? 's' : ''} for {selectedYear}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : !periodicalType ? (
          <div className="text-center py-8 text-gray-500">
            No periodical type on this channel. Update your channel registration under Create Media.
          </div>
        ) : uploadSlots.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No upload slots for this schedule. Check that periodical details were saved during registration.
          </div>
        ) : (
          <div key={slotsGridKey} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadSlots.map((slot) => {
              const doc = getDocForSlot(slot.month, slot.date);
              const slotId = slot.slotId || `${selectedYear}-${slot.month}-${slot.date}`;
              const isUploading = uploading === slotId;
              const progress = uploadProgress[slotId] ?? 0;

              return (
                <div
                  key={slotId}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    doc ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-teal-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={16} className="text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">{slot.label}</span>
                  </div>

                  {isUploading ? (
                    <div className="py-2">
                      <UploadProgressBar percent={progress} />
                    </div>
                  ) : doc ? (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 truncate" title={doc.file_name}>
                        {doc.file_name}
                      </p>
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
                          type="button"
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
                      <span className="text-xs text-gray-500">PDF or Image</span>
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(slot.month, slot.date, file, slotId);
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

        <div className="mt-6 flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-green-500 bg-green-50" />
            <span>Uploaded</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-gray-200 bg-white" />
            <span>Not Uploaded</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MagazineUpload;
