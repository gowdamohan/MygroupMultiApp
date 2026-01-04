import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Save, X, Upload, FileText, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';

interface App {
  id: number;
  name: string;
  apps_name: string;
}

interface Application {
  id: number;
  app_id: number;
  title: string;
  file_path?: string;
  content?: string;
  app?: {
    id: number;
    name: string;
    apps_name: string;
  };
}

export const ApplicationDetails: React.FC = () => {
  const [apps, setApps] = useState<App[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    app_id: '',
    title: '',
    content: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');

  useEffect(() => {
    fetchApps();
    fetchApplications();
  }, []);

  const fetchApps = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/applications/apps`, {
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

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setApplications(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch applications');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.app_id || !formData.title) {
      setError('App name and title are required');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const formDataToSend = new FormData();
      formDataToSend.append('app_id', formData.app_id);
      formDataToSend.append('title', formData.title);
      if (formData.content) formDataToSend.append('content', formData.content);
      if (file) formDataToSend.append('file', file);

      if (editingId) {
        await axios.put(`${API_BASE_URL}/applications/${editingId}`, formDataToSend, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setSuccess('Application updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/applications`, formDataToSend, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setSuccess('Application created successfully');
      }

      resetForm();
      fetchApplications();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (application: Application) => {
    setEditingId(application.id);
    setFormData({
      app_id: application.app_id.toString(),
      title: application.title,
      content: application.content || ''
    });
    setFile(null);
    setFilePreview('');
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this application?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/applications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Application deleted successfully');
      fetchApplications();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const resetForm = () => {
    setFormData({
      app_id: '',
      title: '',
      content: ''
    });
    setFile(null);
    setFilePreview('');
    setEditingId(null);
    setShowForm(false);
  };

  const getFileIcon = (filePath: string) => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return 'image';
    }
    return 'document';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Application Details Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Application'}
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
              {editingId ? 'Edit Application' : 'Add New Application'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  App Name *
                </label>
                <select
                  value={formData.app_id}
                  onChange={(e) => setFormData({ ...formData, app_id: e.target.value })}
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
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File (Image or Document)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <Upload size={18} />
                  <span>{file ? file.name : 'Choose file'}</span>
                </label>
                {filePreview && (
                  <div className="mt-3">
                    <img src={filePreview} alt="Preview" className="h-32 w-auto object-contain rounded border border-gray-200" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={5}
                  placeholder="Enter content description"
                />
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
                  <X size={18} />
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Applications Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b">ID</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b">App Name</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b">Title</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b">File</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b">Content</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No applications found. Click "Add Application" to create one.
                  </td>
                </tr>
              ) : (
                applications.map((application) => (
                  <tr key={application.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 text-gray-900">{application.id}</td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-gray-900">{application.app?.name}</div>
                        <div className="text-sm text-gray-500">{application.app?.apps_name}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-gray-900">{application.title}</td>
                    <td className="py-4 px-6">
                      {application.file_path ? (
                        <div className="flex items-center gap-2">
                          {getFileIcon(application.file_path) === 'image' ? (
                            <img
                              src={`${BACKEND_URL}${application.file_path}`}
                              alt="File"
                              className="h-16 w-auto object-contain rounded border border-gray-200"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <FileText size={20} className="text-gray-500" />
                              <a
                                href={`${BACKEND_URL}${application.file_path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                View File
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No file</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {application.content ? (
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-700 line-clamp-2">{application.content}</p>
                          {application.content.length > 100 && (
                            <button
                              onClick={() => alert(application.content)}
                              className="text-blue-600 hover:underline text-xs mt-1 flex items-center gap-1"
                            >
                              <Eye size={12} />
                              View Full
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(application)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <Edit2 size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(application.id)}
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

