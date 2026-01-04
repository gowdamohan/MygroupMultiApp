import React, { useState, useEffect } from 'react';
import { Save, Edit2, Trash2, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';

interface App {
  id: number;
  name: string;
  apps_name: string;
}

interface TncData {
  id: number;
  tnc_content: string;
  group_id: number;
  group?: App;
}

export const TncDetailsManager: React.FC = () => {
  const [apps, setApps] = useState<App[]>([]);
  const [tncList, setTncList] = useState<TncData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    group_id: '',
    tnc_content: ''
  });

  useEffect(() => {
    fetchApps();
    fetchTncList();
  }, []);

  const fetchApps = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/tnc-details/apps`, {
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

  const fetchTncList = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/tnc-details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setTncList(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching TNC list:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.group_id || !formData.tnc_content.trim()) {
      setError('Please select an app and enter content');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${API_BASE_URL}/tnc-details`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess(editingId ? 'TNC updated successfully' : 'TNC created successfully');
      resetForm();
      fetchTncList();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save TNC');
    }
  };

  const handleEdit = (tnc: TncData) => {
    setEditingId(tnc.id);
    setFormData({
      group_id: tnc.group_id.toString(),
      tnc_content: tnc.tnc_content
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this TNC?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/tnc-details/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('TNC deleted successfully');
      fetchTncList();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const resetForm = () => {
    setFormData({
      group_id: '',
      tnc_content: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Terms and Conditions</h1>
          <p className="text-gray-600 mt-1">Manage terms and conditions for each app</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add TNC'}
        </button>
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
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Edit TNC' : 'Add New TNC'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  App Name *
                </label>
                <select
                  value={formData.group_id}
                  onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Select App --</option>
                  {apps.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.name} ({app.apps_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  value={formData.tnc_content}
                  onChange={(e) => setFormData({ ...formData, tnc_content: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={15}
                  placeholder="Enter terms and conditions content..."
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  {formData.tnc_content.length} characters
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save size={18} />
                  {editingId ? 'Update' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TNC List Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b">ID</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b">App Name</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b">Content</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tncList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">
                    No TNC found. Click "Add TNC" to create one.
                  </td>
                </tr>
              ) : (
                tncList.map((tnc) => (
                  <tr key={tnc.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 text-gray-900">{tnc.id}</td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-gray-900">{tnc.group?.name}</div>
                        <div className="text-sm text-gray-500">{tnc.group?.apps_name}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="max-w-md">
                        <p className="text-sm text-gray-700 line-clamp-3">{tnc.tnc_content}</p>
                        {tnc.tnc_content.length > 150 && (
                          <button
                            onClick={() => alert(tnc.tnc_content)}
                            className="text-blue-600 hover:underline text-xs mt-1 flex items-center gap-1"
                          >
                            <Eye size={12} />
                            View Full
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(tnc)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <Edit2 size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(tnc.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

