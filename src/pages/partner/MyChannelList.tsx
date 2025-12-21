import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, Search, Tv } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5002/api/v1';

interface MediaChannel {
  id: number;
  media_logo: string | null;
  media_name_english: string;
  media_name_regional: string | null;
  followers: number;
  ratings: number;
  earnings: number;
  status: string;
}

export const MyChannelList: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState<MediaChannel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<MediaChannel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchChannelList();
  }, []);

  useEffect(() => {
    filterChannelList();
  }, [searchTerm, channels]);

  const fetchChannelList = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/partner/my-channels`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setChannels(response.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch channel list');
    } finally {
      setLoading(false);
    }
  };

  const filterChannelList = () => {
    let filtered = channels;

    if (searchTerm) {
      filtered = filtered.filter(channel =>
        channel.media_name_english.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (channel.media_name_regional && channel.media_name_regional.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredChannels(filtered);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this channel?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/partner/my-channels/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setChannels(channels.filter(channel => channel.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete channel');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Channel List</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search channels..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Channel List Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600">Loading channels...</p>
        </div>
      ) : filteredChannels.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
          <Tv className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No channels found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search' : 'Start by creating your first media channel'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Media Name</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Followers</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ratings</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredChannels.map((channel, index) => (
                  <tr key={channel.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        {channel.media_logo ? (
                          <img
                            src={`http://localhost:5002${channel.media_logo}`}
                            alt={channel.media_name_english}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Tv className="text-gray-400" size={24} />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{channel.media_name_english}</div>
                        {channel.media_name_regional && (
                          <div className="text-sm text-gray-500">{channel.media_name_regional}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {channel.followers?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {channel.ratings?.toFixed(1) || '0.0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      ₹{channel.earnings?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(channel.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
