import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api/v1';

interface Education {
  id: number;
  education: string;
  group_id?: number;
}

export const EducationList: React.FC = () => {
  const [educations, setEducations] = useState<Education[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ education: '', group_id: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchEducations();
  }, []);

  const fetchEducations = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/education`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setEducations(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch education');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.education.trim()) {
      setError('Education name is required');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const payload = {
        education: formData.education,
        group_id: formData.group_id ? parseInt(formData.group_id) : null
      };
      if (editingId) {
        await axios.put(`${API_BASE_URL}/admin/education/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Education updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/admin/education`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Education created successfully');
      }
      setFormData({ education: '', group_id: '' });
      setEditingId(null);
      fetchEducations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (education: Education) => {
    setFormData({
      education: education.education,
      group_id: education.group_id?.toString() || ''
    });
    setEditingId(education.id);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this education?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/admin/education/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Education deleted successfully');
      fetchEducations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleCancel = () => {
    setFormData({ education: '', group_id: '' });
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
        <h1 className="text-2xl font-bold text-gray-900">Education Management</h1>
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
        <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit Education' : 'Add New Education'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Education Name *</label>
            <input type="text" value={formData.education}
              onChange={(e) => setFormData({ ...formData, education: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter education name" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Group ID</label>
            <input type="number" value={formData.group_id}
              onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter group ID (optional)" />
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
        <h2 className="text-lg font-semibold mb-4">Education List</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Education Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Group ID</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {educations.map((education) => (
                <tr key={education.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{education.id}</td>
                  <td className="py-3 px-4 text-gray-900">{education.education}</td>
                  <td className="py-3 px-4 text-gray-600">{education.group_id || '-'}</td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(education)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(education.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {educations.length === 0 && (
            <div className="text-center py-8 text-gray-500">No education records found</div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
