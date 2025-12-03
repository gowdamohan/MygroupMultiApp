import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Save, X, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api/v1';
const BACKEND_URL = 'http://localhost:5002';

interface App {
  id: number;
  name: string;
}

interface Category {
  id: number;
  category_name: string;
}

interface HeaderAd {
  id: number;
  app_id: number;
  app_category_id: number;
  file_path?: string;
  url?: string;
  app?: {
    id: number;
    name: string;
  };
  category?: {
    id: number;
    category_name: string;
  };
}

export const HeaderAds: React.FC = () => {
  const [apps, setApps] = useState<App[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [headerAds, setHeaderAds] = useState<HeaderAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [newAdData, setNewAdData] = useState<{[categoryId: number]: { file: File | null, url: string, preview: string }}>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchApps();
  }, []);

  useEffect(() => {
    if (selectedAppId) {
      fetchCategories(selectedAppId);
      fetchHeaderAds();
    } else {
      setCategories([]);
      setHeaderAds([]);
    }
  }, [selectedAppId]);

  const fetchApps = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/header-ads/my-apps`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setApps(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching apps:', err);
      setError('Failed to fetch apps');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async (appId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/header-ads/categories/${appId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchHeaderAds = async () => {
    if (!selectedAppId) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/header-ads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        // Filter ads for selected app only
        const filteredAds = response.data.data.filter((ad: HeaderAd) => ad.app_id === parseInt(selectedAppId));
        setHeaderAds(filteredAds);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch header ads');
    }
  };

  const handleFileChange = (categoryId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAdData(prev => ({
          ...prev,
          [categoryId]: {
            ...prev[categoryId],
            file,
            preview: reader.result as string
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (categoryId: number, url: string) => {
    setNewAdData(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        url
      }
    }));
  };

  const handleSave = async (categoryId: number) => {
    setError('');
    setSuccess('');

    const adData = newAdData[categoryId];
    if (!adData?.file && !adData?.url) {
      setError('Please upload a file or provide a URL');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const formDataToSend = new FormData();
      formDataToSend.append('app_id', selectedAppId);
      formDataToSend.append('app_category_id', categoryId.toString());
      if (adData.url) formDataToSend.append('url', adData.url);
      if (adData.file) formDataToSend.append('file', adData.file);

      await axios.post(`${API_BASE_URL}/header-ads`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('Header ad created successfully');

      // Clear form data for this category
      setNewAdData(prev => {
        const updated = { ...prev };
        delete updated[categoryId];
        return updated;
      });

      fetchHeaderAds();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = async (ad: HeaderAd) => {
    setEditingId(ad.id);
    setError('');
    setSuccess('');
  };

  const handleUpdate = async (adId: number, categoryId: number) => {
    setError('');
    setSuccess('');

    const adData = newAdData[categoryId];

    try {
      const token = localStorage.getItem('accessToken');
      const formDataToSend = new FormData();
      formDataToSend.append('app_id', selectedAppId);
      formDataToSend.append('app_category_id', categoryId.toString());
      if (adData?.url) formDataToSend.append('url', adData.url);
      if (adData?.file) formDataToSend.append('file', adData.file);

      await axios.put(`${API_BASE_URL}/header-ads/${adId}`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('Header ad updated successfully');
      setEditingId(null);

      // Clear form data for this category
      setNewAdData(prev => {
        const updated = { ...prev };
        delete updated[categoryId];
        return updated;
      });

      fetchHeaderAds();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this header ad?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/header-ads/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Header ad deleted successfully');
      fetchHeaderAds();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleCancelEdit = (categoryId: number) => {
    setEditingId(null);
    setNewAdData(prev => {
      const updated = { ...prev };
      delete updated[categoryId];
      return updated;
    });
    setError('');
    setSuccess('');
  };

  // Get ad for a specific category
  const getAdForCategory = (categoryId: number): HeaderAd | undefined => {
    return headerAds.find(ad => ad.app_category_id === categoryId);
  };

  // Get selected app name
  const selectedApp = apps.find(app => app.id === parseInt(selectedAppId));

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Header Ads Management</h1>
      </div>

      {/* Alert Messages */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* App Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select App *</label>
        <select
          value={selectedAppId}
          onChange={(e) => setSelectedAppId(e.target.value)}
          className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Select App --</option>
          {apps.map((app) => (
            <option key={app.id} value={app.id}>{app.name}</option>
          ))}
        </select>
      </div>

      {/* Table Display */}
      {selectedAppId && selectedApp && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">{selectedApp.name}</h1>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b">Category</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b">Ads</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b">URL</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b">Action</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => {
                  const existingAd = getAdForCategory(category.id);
                  const isEditing = editingId === existingAd?.id;
                  const adData = newAdData[category.id];

                  return (
                    <tr key={category.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6 font-medium text-gray-900">
                        {category.category_name}
                      </td>
                      <td className="py-4 px-6">
                        {existingAd && !isEditing ? (
                          existingAd.file_path ? (
                            <img
                              src={`${BACKEND_URL}${existingAd.file_path}`}
                              alt="Ad"
                              className="h-20 w-auto object-contain rounded border border-gray-200"
                            />
                          ) : (
                            <span className="text-gray-400 text-sm">No image</span>
                          )
                        ) : (
                          <div className="space-y-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileChange(category.id, e)}
                              className="hidden"
                              id={`file-upload-${category.id}`}
                            />
                            <label
                              htmlFor={`file-upload-${category.id}`}
                              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-sm"
                            >
                              <Upload size={16} />
                              <span>{adData?.file ? adData.file.name : 'Choose file'}</span>
                            </label>
                            {adData?.preview && (
                              <div className="mt-2">
                                <img
                                  src={adData.preview}
                                  alt="Preview"
                                  className="h-20 w-auto object-contain rounded border border-gray-200"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {existingAd && !isEditing ? (
                          existingAd.url ? (
                            <a
                              href={existingAd.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm break-all"
                            >
                              {existingAd.url}
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )
                        ) : (
                          <input
                            type="url"
                            value={adData?.url || ''}
                            onChange={(e) => handleUrlChange(category.id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="https://example.com"
                          />
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          {existingAd && !isEditing ? (
                            <>
                              <button
                                onClick={() => handleEdit(existingAd)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                              >
                                <Edit2 size={14} />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(existingAd.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </>
                          ) : isEditing ? (
                            <>
                              <button
                                onClick={() => handleUpdate(existingAd.id, category.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                              >
                                <Save size={14} />
                                Update
                              </button>
                              <button
                                onClick={() => handleCancelEdit(category.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                              >
                                <X size={14} />
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleSave(category.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              <Save size={14} />
                              Save
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {!selectedAppId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg">Please select an app to manage header ads</p>
        </div>
      )}
    </div>
  );
};


