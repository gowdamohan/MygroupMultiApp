import React, { useState, useEffect } from 'react';
import { Video, Eye, Edit, Trash2, Search, Filter, Calendar } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5002/api/v1';

interface Media {
  id: number;
  title: string;
  description: string;
  mediaType: string;
  category: string;
  views: number;
  createdAt: string;
  thumbnail?: string;
  status: 'active' | 'pending' | 'inactive';
}

export const MyChannelList: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<Media[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMediaList();
  }, []);

  useEffect(() => {
    filterMediaList();
  }, [searchTerm, filterType, mediaList]);

  const fetchMediaList = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/partner/media`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setMediaList(response.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch media list');
      // Set dummy data for demonstration
      setMediaList([
        {
          id: 1,
          title: 'Sample Video 1',
          description: 'This is a sample video description',
          mediaType: 'video',
          category: 'entertainment',
          views: 1250,
          createdAt: new Date().toISOString(),
          status: 'active'
        },
        {
          id: 2,
          title: 'Sample Image 1',
          description: 'This is a sample image description',
          mediaType: 'image',
          category: 'education',
          views: 850,
          createdAt: new Date().toISOString(),
          status: 'active'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filterMediaList = () => {
    let filtered = mediaList;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(media =>
        media.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        media.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(media => media.mediaType === filterType);
    }

    setFilteredMedia(filtered);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this media?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/partner/media/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMediaList(mediaList.filter(media => media.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete media');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Channel List</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search media..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filter by Type */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Types</option>
              <option value="video">Videos</option>
              <option value="image">Images</option>
              <option value="document">Documents</option>
            </select>
          </div>
        </div>
      </div>

      {/* Media List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600">Loading media...</p>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
          <Video className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No media found</h3>
          <p className="text-gray-600">
            {searchTerm || filterType !== 'all'
              ? 'Try adjusting your filters'
              : 'Start by creating your first media'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMedia.map((media) => (
            <div
              key={media.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Thumbnail */}
              <div className="h-48 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                {media.thumbnail ? (
                  <img
                    src={media.thumbnail}
                    alt={media.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Video className="text-primary-600" size={48} />
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                    {media.title}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      media.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : media.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {media.status}
                  </span>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {media.description}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Eye size={16} />
                    <span>{media.views.toLocaleString()} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    <span>{formatDate(media.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                  <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                    {media.mediaType}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {media.category}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors">
                    <Eye size={16} />
                    View
                  </button>
                  <button className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(media.id)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

