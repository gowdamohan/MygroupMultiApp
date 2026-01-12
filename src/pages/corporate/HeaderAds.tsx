import React, { useState, useEffect } from 'react';
import { Save, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';

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
  const [appCategories, setAppCategories] = useState<{[appId: number]: Category[]}>({});
  const [headerAds, setHeaderAds] = useState<HeaderAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdData, setNewAdData] = useState<{[key: string]: { file: File | null, url: string, preview: string }}>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchApps();
    fetchHeaderAds();
  }, []);

  const fetchApps = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/header-ads/my-apps`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const appsData = response.data.data;
        setApps(appsData);
        
        // Fetch categories for each app
        for (const app of appsData) {
          await fetchCategories(app.id);
        }
      }
    } catch (err: any) {
      console.error('Error fetching apps:', err);
      setError('Failed to fetch apps');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async (appId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/header-ads/categories/${appId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAppCategories(prev => ({ ...prev, [appId]: response.data.data }));
      }
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchHeaderAds = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/header-ads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setHeaderAds(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch header ads');
    }
  };

  const handleFileChange = (appId: number, categoryId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const key = `${appId}-${categoryId}`;
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAdData(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            file,
            preview: reader.result as string
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (appId: number, categoryId: number, url: string) => {
    const key = `${appId}-${categoryId}`;
    setNewAdData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        url
      }
    }));
  };

  const handleSave = async (appId: number, categoryId: number) => {
    setError('');
    setSuccess('');

    const key = `${appId}-${categoryId}`;
    const adData = newAdData[key];
    if (!adData?.file && !adData?.url) {
      setError('Please upload a file or provide a URL');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const formDataToSend = new FormData();
      formDataToSend.append('app_id', appId.toString());
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

      setNewAdData(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });

      fetchHeaderAds();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const getAdForCategory = (appId: number, categoryId: number): HeaderAd | undefined => {
    return headerAds.find(ad => ad.app_id === appId && ad.app_category_id === categoryId);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Header Ads Management</h1>
      </div>

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

      {apps.map((app, index) => {
        const categories = appCategories[app.id] || [];
        
        return (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">{index + 1}. {app.name}</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700 text-sm">Category</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700 text-sm">Choose File</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700 text-sm">URL</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700 text-sm">Save</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => {
                    const existingAd = getAdForCategory(app.id, category.id);
                    const key = `${app.id}-${category.id}`;
                    const adData = newAdData[key];

                    return (
                      <tr key={category.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-6 font-medium text-gray-900">
                          {category.category_name}
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileChange(app.id, category.id, e)}
                              className="hidden"
                              id={`file-${app.id}-${category.id}`}
                            />
                            <label
                              htmlFor={`file-${app.id}-${category.id}`}
                              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-sm"
                            >
                              <Upload size={16} />
                              <span>{adData?.file ? adData.file.name : 'Choose file'}</span>
                            </label>
                            {(adData?.preview || existingAd?.file_path) && (
                              <div className="mt-2">
                                <img
                                  src={adData?.preview || `${BACKEND_URL}${existingAd?.file_path}`}
                                  alt="Preview"
                                  className="h-16 w-auto object-contain rounded border border-gray-200"
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <input
                            type="url"
                            value={adData?.url || existingAd?.url || ''}
                            onChange={(e) => handleUrlChange(app.id, category.id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="https://example.com"
                          />
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => handleSave(app.id, category.id)}
                            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            <Save size={16} />
                            Save
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        );
      })}

      {apps.length === 0 && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg">No apps available</p>
        </div>
      )}
    </div>
  );
};


