import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Save, X, Link, ExternalLink, GripVertical } from 'lucide-react';
import { API_BASE_URL } from '../../config/api.config';

interface FooterLink {
  id: number;
  app_id: number;
  title: string;
  url: string;
  order_index: number;
  is_active: boolean;
}

interface FooterManagementProps {
  appId: string | undefined;
}

export const FooterManagement: React.FC<FooterManagementProps> = ({ appId }) => {
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState<FooterLink | null>(null);
  const [formData, setFormData] = useState({ title: '', url: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchLinks();
  }, [appId]);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/footer/links?app_id=${appId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setLinks(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching footer links:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title || !formData.url) {
      setError('Title and URL are required');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (editingLink) {
        await axios.put(`${API_BASE_URL}/footer/links/${editingLink.id}`, {
          ...formData,
          app_id: appId
        }, { headers: { Authorization: `Bearer ${token}` } });
        setSuccess('Link updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/footer/links`, {
          ...formData,
          app_id: appId,
          order_index: links.length
        }, { headers: { Authorization: `Bearer ${token}` } });
        setSuccess('Link created successfully');
      }
      setShowModal(false);
      setEditingLink(null);
      setFormData({ title: '', url: '' });
      fetchLinks();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error saving link');
    }
  };

  const handleEdit = (link: FooterLink) => {
    setEditingLink(link);
    setFormData({ title: link.title, url: link.url });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this link?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/footer/links/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchLinks();
    } catch (err) {
      console.error('Error deleting link:', err);
    }
  };

  const handleToggleActive = async (link: FooterLink) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.patch(`${API_BASE_URL}/footer/links/${link.id}/status`, {
        is_active: !link.is_active
      }, { headers: { Authorization: `Bearer ${token}` } });
      fetchLinks();
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Footer Management</h1>
          <p className="text-gray-500">Manage footer links for your app</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setEditingLink(null); setFormData({ title: '', url: '' }); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Link
        </button>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
      {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">{success}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : links.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Link className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No footer links yet. Add your first link!</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {links.map((link, idx) => (
                <tr key={link.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{link.title}</td>
                  <td className="px-4 py-3 text-sm text-blue-600">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
                      {link.url.length > 40 ? link.url.substring(0, 40) + '...' : link.url}
                      <ExternalLink size={14} />
                    </a>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleToggleActive(link)} className={`px-2 py-1 rounded text-xs font-medium ${link.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {link.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleEdit(link)} className="text-blue-600 hover:text-blue-800 mr-3"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(link.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editingLink ? 'Edit Link' : 'Add New Link'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g., Privacy Policy" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input type="url" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="https://example.com/privacy" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                  <Save size={18} />
                  {editingLink ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

