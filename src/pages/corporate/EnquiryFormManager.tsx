import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../../config/api.config';

interface EnquiryRow {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  status: 'new' | 'read' | 'replied' | 'closed';
  group_name?: string;
  created_at: string;
}

const STATUS_OPTIONS = ['new', 'read', 'replied', 'closed'] as const;

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    read: 'bg-gray-100 text-gray-700',
    replied: 'bg-green-100 text-green-700',
    closed: 'bg-red-100 text-red-700',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
};

export const EnquiryFormManager: React.FC = () => {
  const [rows, setRows] = useState<EnquiryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchRows = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/enquiry?group_name=corporate`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRows(response.data.data || []);
    } catch {
      setError('Failed to load enquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const updateStatus = async (id: number, status: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.patch(
        `${API_BASE_URL}/enquiry/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: status as EnquiryRow['status'] } : r)));
    } catch {
      setError('Failed to update status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this enquiry?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/enquiry/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError('Failed to delete enquiry');
    }
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return d; }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Enquiry Forms</h2>
          <p className="text-sm text-gray-500 mt-1">Messages submitted from the public Enquiry page</p>
        </div>
        <button
          type="button"
          onClick={fetchRows}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Loading enquiries…</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-400 text-sm py-12 text-center">No enquiries submitted yet.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Phone</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Subject</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr
                      className="border-b border-gray-100 hover:bg-gray-50/80 cursor-pointer"
                      onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                    >
                      <td className="px-4 py-3 text-gray-500">{row.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                      <td className="px-4 py-3 text-gray-600">{row.email}</td>
                      <td className="px-4 py-3 text-gray-600">{row.phone || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{row.subject || '—'}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={row.status}
                          onChange={(e) => updateStatus(row.id, e.target.value)}
                          className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${statusBadge(row.status)}`}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(row.created_at)}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                    {expandedId === row.id && (
                      <tr className="bg-gray-50/50">
                        <td colSpan={8} className="px-4 py-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Message</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{row.message}</p>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
