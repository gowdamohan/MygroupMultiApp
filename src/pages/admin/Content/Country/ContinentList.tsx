import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { API_BASE_URL } from '../../../../config/api.config';

interface Continent {
  id: number;
  continent: string;
  code: string;
  order: number;
  status: number;
}

export const ContinentList: React.FC = () => {
  const [continents, setContinents] = useState<Continent[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ continent: '', code: '', order: 0, status: 1 });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchContinents();
  }, []);

  const fetchContinents = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/continents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setContinents(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch continents');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.continent.trim() || !formData.code.trim()) {
      setError('Continent name and code are required');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (editingId) {
        await axios.put(`${API_BASE_URL}/admin/continents/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Continent updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/admin/continents`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Continent created successfully');
      }
      setFormData({ continent: '', code: '', order: 0, status: 1 });
      setEditingId(null);
      fetchContinents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (continent: Continent) => {
    setFormData({
      continent: continent.continent,
      order: continent.order,
      status: continent.status,
      code: continent.code
    });
    setEditingId(continent.id);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this continent?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/admin/continents/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Continent deleted successfully');
      fetchContinents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleStatusToggle = async (id: number, currentStatus: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(`${API_BASE_URL}/admin/continents/${id}`, 
        { status: currentStatus === 1 ? 0 : 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchContinents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleCancel = () => {
    setFormData({ continent: '', code: '', order: 0, status: 1 });
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
        <h1 className="text-2xl font-bold text-gray-900">Continent Management</h1>
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

      <motion.div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit Continent' : 'Add New Continent'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Continent Name *</label>
              <input type="text" value={formData.continent}
                onChange={(e) => setFormData({ ...formData, continent: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter continent name" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Code *</label>
              <input type="text" value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Continent code" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
              <input type="number" value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Display order" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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

      <motion.div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Continent List</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Continent Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Code</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Order</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {continents.map((continent) => (
                <tr key={continent.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{continent.id}</td>
                  <td className="py-3 px-4 text-gray-900">{continent.continent}</td>
                  <td className="py-3 px-4 text-gray-600">{continent.code}</td>
                  <td className="py-3 px-4 text-center text-gray-600">{continent.order}</td>
                  <td className="py-3 px-4 text-center">
                    <button onClick={() => handleStatusToggle(continent.id, continent.status)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        continent.status === 1
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}>
                      {continent.status === 1 ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(continent)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 size={18} />
                      </button>
                      {/* <button onClick={() => handleDelete(continent.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button> */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {continents.length === 0 && (
            <div className="text-center py-8 text-gray-500">No continents found</div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

