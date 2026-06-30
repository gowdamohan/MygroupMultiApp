import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Database, Search } from 'lucide-react';
import { API_BASE_URL } from '../../config/api.config';

interface PublicDatabaseRecord {
  userId: number;
  email: string;
  phone: string;
  first_name: string | null;
  display_name: string | null;
  country_name: string | null;
  state_name: string | null;
  district_name: string | null;
  gender: string | null;
  dob: string | null;
  nationality: string | null;
  marital_status: string | null;
}

export const PublicDatabase: React.FC = () => {
  const [records, setRecords] = useState<PublicDatabaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPublicDatabase();
  }, []);

  const fetchPublicDatabase = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/public-database`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecords(response.data.data || []);
    } catch (err: unknown) {
      console.error('Error fetching public database:', err);
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'Failed to load public database records';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter((record) => {
    const query = searchQuery.toLowerCase();
    const name = [record.first_name, record.display_name].filter(Boolean).join(' ').toLowerCase();
    const location = [record.country_name, record.state_name, record.district_name]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return (
      name.includes(query) ||
      record.email?.toLowerCase().includes(query) ||
      record.phone?.toLowerCase().includes(query) ||
      location.includes(query)
    );
  });

  const formatName = (record: PublicDatabaseRecord) => {
    if (record.display_name && record.first_name && record.display_name !== record.first_name) {
      return `${record.first_name} (${record.display_name})`;
    }
    return record.display_name || record.first_name || '—';
  };

  const formatLocation = (record: PublicDatabaseRecord) => {
    const parts = [record.country_name, record.state_name, record.district_name].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '—';
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-7 h-7 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Public Database</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Loading public database records...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {records.length === 0 ? 'No public database records found' : 'No records match your search'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">DOB</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nationality</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marital Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.map((record, index) => (
                  <tr key={record.userId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatName(record)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{record.email || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{record.phone || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatLocation(record)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{record.gender || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatDate(record.dob)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{record.nationality || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{record.marital_status || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !error && records.length > 0 && (
        <p className="mt-3 text-sm text-gray-500">
          Showing {filteredRecords.length} of {records.length} record{records.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};
