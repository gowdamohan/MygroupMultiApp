import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Edit2, Trash2, Save, X, Upload, FileText, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';

interface Application {
  id: number;
  app_id: number;
  title: string;
  file_path?: string;
  content?: string;
  app?: { id: number; name: string; apps_name: string };
}

interface AppApplicationDetailsProps {
  appId: string | undefined;
  appName: string | undefined;
}

export const AppApplicationDetails: React.FC<AppApplicationDetailsProps> = ({ appId, appName }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const editorRef = useRef<HTMLDivElement>(null);
  const summernoteInitialized = useRef(false);

  useEffect(() => {
    fetchApplications();
  }, [appId]);

  // Load Summernote via CDN
  useEffect(() => {
    const loadSummernote = async () => {
      // Load jQuery if not present
      if (!(window as any).jQuery) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js');
      }
      // Load Summernote CSS
      if (!document.querySelector('link[href*="summernote"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/summernote/0.8.20/summernote-lite.min.css';
        document.head.appendChild(link);
      }
      // Load Summernote JS
      if (!(window as any).jQuery?.fn?.summernote) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/summernote/0.8.20/summernote-lite.min.js');
      }
      initSummernote();
    };
    loadSummernote();
    return () => {
      if (summernoteInitialized.current && editorRef.current) {
        try { (window as any).jQuery(editorRef.current).summernote('destroy'); } catch (e) {}
        summernoteInitialized.current = false;
      }
    };
  }, []);

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const initSummernote = useCallback(() => {
    if (!editorRef.current || summernoteInitialized.current) return;
    const $ = (window as any).jQuery;
    if (!$ || !$.fn.summernote) return;
    $(editorRef.current).summernote({
      height: 200,
      placeholder: 'Enter content...',
      toolbar: [
        ['style', ['style']],
        ['font', ['bold', 'italic', 'underline', 'strikethrough']],
        ['fontsize', ['fontsize']],
        ['color', ['color']],
        ['para', ['ul', 'ol', 'paragraph']],
        ['table', ['table']],
        ['insert', ['link', 'picture']],
        ['view', ['fullscreen', 'codeview']],
      ],
      callbacks: {
        onChange: (contents: string) => {
          setFormData(prev => ({ ...prev, content: contents }));
        }
      }
    });
    summernoteInitialized.current = true;
  }, []);

  // Sync content to Summernote when editing
  useEffect(() => {
    const $ = (window as any).jQuery;
    if (summernoteInitialized.current && $ && editorRef.current) {
      $(editorRef.current).summernote('code', formData.content);
    }
  }, [editingId]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/applications?app_id=${appId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setApplications(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setFilePreview(reader.result as string);
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    // Get content from summernote
    const $ = (window as any).jQuery;
    const content = summernoteInitialized.current && $ && editorRef.current
      ? $(editorRef.current).summernote('code')
      : formData.content;

    if (!formData.title) { setError('Title is required'); return; }
    try {
      const token = localStorage.getItem('accessToken');
      const fd = new FormData();
      fd.append('app_id', appId || '');
      fd.append('title', formData.title);
      if (content) fd.append('content', content);
      if (file) fd.append('file', file);

      if (editingId) {
        await axios.put(`${API_BASE_URL}/applications/${editingId}`, fd, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('Application updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/applications`, fd, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
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
    setFormData({ title: application.title, content: application.content || '' });
    setFile(null);
    setFilePreview('');
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
    setFormData({ title: '', content: '' });
    setFile(null);
    setFilePreview('');
    setEditingId(null);
    const $ = (window as any).jQuery;
    if (summernoteInitialized.current && $ && editorRef.current) {
      $(editorRef.current).summernote('code', '');
    }
  };

  const getFileIcon = (filePath: string) => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image';
    return 'document';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Application Details Management</h1>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</motion.div>
        )}
      </AnimatePresence>

      {/* Form - Always Visible */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Application' : 'Add New Application'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">App Name</label>
            <input type="text" value={appName || `App #${appId}`} readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <input type="text" value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter title" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">File (Image or Document)</label>
            <input type="file" accept="image/*,.pdf,.doc,.docx" onChange={handleFileChange} className="hidden" id="app-file-upload" />
            <label htmlFor="app-file-upload"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <div ref={editorRef}></div>
          </div>
          <div className="flex gap-3">
            <button type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Save size={18} />{editingId ? 'Update' : 'Save'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm}
                className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                <X size={18} />Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b">ID</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b">Title</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b">File</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b">Content</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">No applications found. Fill the form above to create one.</td>
                </tr>
              ) : (
                applications.map((application) => (
                  <tr key={application.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 text-gray-900">{application.id}</td>
                    <td className="py-4 px-6 font-medium text-gray-900">{application.title}</td>
                    <td className="py-4 px-6">
                      {application.file_path ? (
                        getFileIcon(application.file_path) === 'image' ? (
                          <img src={`${BACKEND_URL}${application.file_path}`} alt="File"
                            className="h-16 w-auto object-contain rounded border border-gray-200" />
                        ) : (
                          <div className="flex items-center gap-2">
                            <FileText size={20} className="text-gray-500" />
                            <a href={`${BACKEND_URL}${application.file_path}`} target="_blank" rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm">View File</a>
                          </div>
                        )
                      ) : (
                        <span className="text-gray-400 text-sm">No file</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {application.content ? (
                        <div className="max-w-xs">
                          <div className="text-sm text-gray-700 line-clamp-2" dangerouslySetInnerHTML={{ __html: application.content }} />
                          {application.content.length > 100 && (
                            <button onClick={() => {
                              const div = document.createElement('div');
                              div.innerHTML = application.content || '';
                              alert(div.textContent || div.innerText);
                            }} className="text-blue-600 hover:underline text-xs mt-1 flex items-center gap-1">
                              <Eye size={12} />View Full
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(application)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                          <Edit2 size={14} />Edit
                        </button>
                        <button onClick={() => handleDelete(application.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                          <Trash2 size={14} />Delete
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