import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Save, Edit2, Trash2, Plus } from 'lucide-react';
import { API_BASE_URL } from '../../config/api.config';
import { SummernoteEditor } from '../../components/form/SummernoteEditor';

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  order_index: number;
  is_active: number;
  group_name?: string;
}

export const FooterFaqManager: React.FC = () => {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    order_index: 0,
    is_active: true
  });

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const group_name = user.group_name || 'corporate';

      const response = await axios.get(`${API_BASE_URL}/footer/faq?group_name=${group_name}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFaqs(response.data.data || []);
    } catch (err) {
      console.error('Error fetching FAQs:', err);
      setError('Failed to fetch FAQs');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      order_index: 0,
      is_active: true
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.question.trim() || !formData.answer.trim()) {
      setError('Question and answer are required');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const group_name = user.group_name || 'corporate';

      const payload = {
        question: formData.question,
        answer: formData.answer,
        order_index: Number(formData.order_index) || 0,
        is_active: formData.is_active ? 1 : 0,
        group_name,
        user_id: user.id
      };

      if (editingId) {
        await axios.put(`${API_BASE_URL}/footer/faq/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('FAQ updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/footer/faq`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('FAQ created successfully');
      }

      resetForm();
      fetchFaqs();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save FAQ');
    }
  };

  const handleEdit = (faq: FaqItem) => {
    setEditingId(faq.id);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      order_index: faq.order_index || 0,
      is_active: faq.is_active === 1
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/footer/faq/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('FAQ deleted successfully');
      fetchFaqs();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete FAQ');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">FAQ Management</h2>
          <p className="text-gray-600 mt-1">Create, edit, and sort FAQs</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          {showForm ? 'Close Form' : 'Add FAQ'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit FAQ' : 'Add New FAQ'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Answer <span className="text-red-500">*</span>
              </label>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <SummernoteEditor
                  value={formData.answer}
                  onChange={(value) => setFormData({ ...formData, answer: value })}
                  placeholder="Enter the answer..."
                  height={240}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order Index</label>
                <input
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-3 mt-7">
                <input
                  id="faq-active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="faq-active" className="text-sm text-gray-700">
                  Active
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save size={18} />
                {editingId ? 'Update' : 'Save'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Question
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Loading FAQs...
                  </td>
                </tr>
              ) : faqs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No FAQs found. Click "Add FAQ" to create one.
                  </td>
                </tr>
              ) : (
                faqs.map((faq) => (
                  <tr key={faq.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{faq.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-lg">
                        <div className="font-medium text-gray-900">{faq.question}</div>
                        <div className="text-xs text-gray-500 line-clamp-2 mt-1" dangerouslySetInnerHTML={{ __html: faq.answer }} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{faq.order_index}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {faq.is_active ? 'Active' : 'Inactive'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(faq)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(faq.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
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
