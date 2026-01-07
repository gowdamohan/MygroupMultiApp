import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Save, X, Upload, FolderTree, Plus, UserPlus, FormInput } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { CategoryModal } from './CategoryModal';
import { CustomFormBuilder } from './CustomFormBuilder';
import { API_BASE_URL, BACKEND_URL } from '../../../config/api.config';

interface CreateDetails {
  id: number;
  create_id: number;
  icon?: string;
  logo?: string;
  name_image?: string;
  background_color?: string;
  url?: string;
}

interface App {
  id: number;
  name: string;
  apps_name: string;
  order_by: number;
  code?: string;
  details?: CreateDetails;
}

export const CreateAppsList: React.FC = () => {
  const [apps, setApps] = useState<App[]>([]);
  const [filteredApps, setFilteredApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '', apps_name: '', order_by: 0, code: '',
    background_color: '#ffffff', url: ''
  });
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [nameImageFile, setNameImageFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterAppsName, setFilterAppsName] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [selectedAppForForm, setSelectedAppForForm] = useState<number | null>(null);

  useEffect(() => {
    fetchApps();
  }, []);

  useEffect(() => {
    // Filter apps based on apps_name
    if (filterAppsName) {
      setFilteredApps(apps.filter(app =>
        app.apps_name.toLowerCase().includes(filterAppsName.toLowerCase())
      ));
    } else {
      setFilteredApps(apps);
    }
  }, [apps, filterAppsName]);

  const fetchApps = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/apps`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Apps data received:', response.data.data);
      if (response.data.success) {
        setApps(response.data.data);
        setFilteredApps(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch apps');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('accessToken');

      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('apps_name', formData.apps_name);
      formDataToSend.append('order_by', formData.order_by.toString());
      formDataToSend.append('code', formData.code);
      formDataToSend.append('background_color', formData.background_color);
      formDataToSend.append('url', formData.url);

      // Append files if selected
      if (iconFile) formDataToSend.append('icon', iconFile);
      if (logoFile) formDataToSend.append('logo', logoFile);
      if (nameImageFile) formDataToSend.append('name_image', nameImageFile);

      if (editingId) {
        await axios.put(`${API_BASE_URL}/admin/apps/${editingId}`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setSuccess('App updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/admin/apps`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setSuccess('App created successfully');
      }

      // Reset form
      setFormData({ name: '', apps_name: '', order_by: 0, code: '', background_color: '#ffffff', url: '' });
      setIconFile(null);
      setLogoFile(null);
      setNameImageFile(null);
      setEditingId(null);
      fetchApps();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (app: App) => {
    setFormData({
      name: app.name,
      apps_name: app.apps_name,
      order_by: app.order_by,
      code: app.code || '',
      background_color: app.details?.background_color || '#ffffff',
      url: app.details?.url || ''
    });
    // Clear file states when editing (user can upload new files if needed)
    setIconFile(null);
    setLogoFile(null);
    setNameImageFile(null);
    setEditingId(app.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setFormData({ name: '', apps_name: '', order_by: 0, code: '', background_color: '#ffffff', url: '' });
    setIconFile(null);
    setLogoFile(null);
    setNameImageFile(null);
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this app?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/admin/apps/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('App deleted successfully');
      fetchApps();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete app');
    }
  };

  const handleOpenCategoryModal = (appId: number) => {
    setSelectedAppId(appId);
    setShowCategoryModal(true);
  };

  const handleCreateAppUser = async (app: App) => {
    try {
      const token = localStorage.getItem('accessToken');

      // Create client user for this app
      const response = await axios.post(`${API_BASE_URL}/admin/apps/${app.id}/create-user`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess(`Client user created successfully! Username: ${response.data.data.username}, Password: 123456`);
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleOpenFormBuilder = (appId: number) => {
    setSelectedAppForForm(appId);
    setShowFormBuilder(true);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Create Apps Management</h1>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</motion.div>
        )}
      </AnimatePresence>

      <motion.div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit App' : 'Add New App'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input type="text" value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter name" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Apps Name *</label>
              <select value={formData.apps_name}
                onChange={(e) => setFormData({ ...formData, apps_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required>
                <option value="">Select Apps Name</option>
                <option value="My Apps">My Apps</option>
                <option value="My Company">My Company</option>
                <option value="Online Apps">Online Apps</option>
                <option value="Offline Apps">Offline Apps</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order By</label>
              <input type="number" value={formData.order_by}
                onChange={(e) => setFormData({ ...formData, order_by: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
              <input type="text" value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter code" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icon Upload</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setIconFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {iconFile && <p className="text-xs text-gray-500 mt-1">Selected: {iconFile.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo Upload</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {logoFile && <p className="text-xs text-gray-500 mt-1">Selected: {logoFile.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name Image Upload</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNameImageFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {nameImageFile && <p className="text-xs text-gray-500 mt-1">Selected: {nameImageFile.name}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
              <div className="flex gap-2">
                <input type="color" value={formData.background_color}
                  onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                  className="h-10 w-20 border border-gray-300 rounded-lg cursor-pointer" />
                <input type="text" value={formData.background_color}
                  onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="#ffffff" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
              <input type="url" value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com" />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Save size={20} />
              {editingId ? 'Update' : 'Create'}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancel} className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2">
                <X size={20} />
                Cancel
              </button>
            )}
          </div>
        </form>
      </motion.div>

      <motion.div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Apps List</h2>
          <div className="flex gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Filter by Apps Name</label>
              <input
                type="text"
                value={filterAppsName}
                onChange={(e) => setFilterAppsName(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Search apps name..."
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">#</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Apps Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Code</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Order</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Icon</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Logo</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Color</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map((app) => (
                <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{app.id}</td>
                  <td className="py-3 px-4 text-gray-900">{app.name}</td>
                  <td className="py-3 px-4 text-gray-600">{app.apps_name}</td>
                  <td className="py-3 px-4 text-gray-600">{app.code || '-'}</td>
                  <td className="py-3 px-4 text-center text-gray-600">{app.order_by}</td>
                  <td className="py-3 px-4">
                    {app.details?.icon ? (
                      <img
                        src={`${app.details.icon}`}
                        alt="icon"
                        className="w-8 h-8 object-contain"
                      />
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4">
                    {app.details?.logo ? (
                      <img
                        src={`${app.details.logo}`}
                        alt="logo"
                        className="w-8 h-8 object-contain"
                      />
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {app.details?.background_color ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-6 h-6 rounded border border-gray-300" style={{ backgroundColor: app.details.background_color }}></div>
                        <span className="text-xs text-gray-600">{app.details.background_color}</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-2">
                      {/* <button
                        onClick={() => handleOpenCategoryModal(app.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Add Category">
                        <FolderTree size={18} />
                      </button> */}
                      <button
                        onClick={() => handleCreateAppUser(app)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                        title="Create App User">
                        <UserPlus size={18} />
                      </button>
                      <button
                        onClick={() => handleOpenFormBuilder(app.id)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        title="Custom Form Builder">
                        <FormInput size={18} />
                      </button>
                      <button onClick={() => handleEdit(app)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit2 size={18} />
                      </button>
                      {/* <button onClick={() => handleDelete(app.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 size={18} />
                      </button> */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {showCategoryModal && selectedAppId && (
        <CategoryModal
          appId={selectedAppId}
          onClose={() => {
            setShowCategoryModal(false);
            setSelectedAppId(null);
          }}
        />
      )}

      {showFormBuilder && selectedAppForForm && (
        <CustomFormBuilder
          appId={selectedAppForForm}
          onClose={() => {
            setShowFormBuilder(false);
            setSelectedAppForForm(null);
          }}
        />
      )}
    </div>
  );
};

