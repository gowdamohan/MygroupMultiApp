import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api.config';

interface Language {
  id: number;
  country_id: number;
  country?: string;
  lang_1: string;
  lang_2?: string;
}

interface Country {
  id: number;
  country: string;
}

export const LanguageList: React.FC = () => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ country_id: '', lang_1: '', lang_2: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCountries();
    fetchLanguages();
  }, []);

  const fetchCountries = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/countries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCountries(response.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch countries:', err);
    }
  };

  const fetchLanguages = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/languages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setLanguages(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch languages');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.lang_1.trim()) {
      setError('Primary language is required');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (editingId) {
        await axios.put(`${API_BASE_URL}/admin/languages/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Language updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/admin/languages`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Language created successfully');
      }
      setFormData({ country_id:'', lang_1: '', lang_2: '' });
      setEditingId(null);
      fetchLanguages();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (language: Language) => {
    setFormData({
      country_id: language.country_id.toString(),
      lang_1: language.lang_1,
      lang_2: language.lang_2 || ''
    });
    setEditingId(language.id);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this language?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/admin/languages/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Language deleted successfully');
      fetchLanguages();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleCancel = () => {
    setFormData({ country_id: '', lang_1: '', lang_2: '' });
    setEditingId(null);
    setError('');
    setSuccess('');
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Language Management</h1>
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

      {/* Form */}
      <motion.div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit Language' : 'Add New Language'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country </label>
              <select
                value={formData.country_id}
                onChange={(e) => setFormData({ ...formData, country_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select Country</option>
                {countries.map((c: Country) => (
                  <option key={c.id} value={c.id}>{c.country}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Language *</label>
              <input type="text" value={formData.lang_1} onChange={(e) => setFormData({ ...formData, lang_1: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter primary language" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Language</label>
              <input type="text" value={formData.lang_2} onChange={(e) => setFormData({ ...formData, lang_2: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter secondary language (optional)" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              <Save size={18} />
              {editingId ? 'Update' : 'Create'}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancel}
                className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                <X size={18} />
                Cancel
              </button>
            )}
          </div>
        </form>
      </motion.div>

      {/* Table */}
      <motion.div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Language List</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">#</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Country</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Primary Language</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Secondary Language</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {languages.map((language, index) => (
                <tr key={language.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{index+1}</td>
                  <td className="py-3 px-4 text-gray-900">{language.country}</td>
                  <td className="py-3 px-4 text-gray-900">{language.lang_1}</td>
                  <td className="py-3 px-4 text-gray-600">{language.lang_2 || '-'}</td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(language)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 size={18} />
                      </button>
                      {/* <button onClick={() => handleDelete(language.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button> */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {languages.length === 0 && (
            <div className="text-center py-8 text-gray-500">No languages found</div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
