import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Save, X, Edit2, Trash2, Plus, Upload } from 'lucide-react';
import { FileUpload } from '../../components/form/FileUpload';
import { SummernoteEditor } from '../../components/form/SummernoteEditor';
import { API_BASE_URL, getUploadUrl } from '../../config/api.config';

interface FooterPageEntry {
  id?: number;
  footer_page_type: string;
  title: string;
  tag_line: string;
  image: string | File | null;
  image_url?: string;
  content: string;
  url: string;
  group_name: string;
  event_date?: string;
  year?: string;
}

interface FooterPageImage {
  id: number;
  footer_page_id: number;
  image_path: string;
  image_url?: string;
}

interface FooterPageListManagerProps {
  pageType: string;
  pageTitle: string;
}

export const FooterPageListManager: React.FC<FooterPageListManagerProps> = ({ pageType, pageTitle }) => {
  const [items, setItems] = useState<FooterPageEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pageImages, setPageImages] = useState<FooterPageImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [formResetKey, setFormResetKey] = useState(0);

  const [formData, setFormData] = useState<FooterPageEntry>({
    footer_page_type: pageType,
    title: '',
    tag_line: '',
    image: null,
    content: '',
    url: '',
    group_name: '',
    event_date: '',
    year: ''
  });

  const pageConfig = useMemo(() => ({
    about_us: { showTitle: true, titleLabel: 'Title', showImage: true, imageLabel: 'Image', showContent: true, contentLabel: 'Description' },
    awards: { showTitle: true, titleLabel: 'Title', showImage: true, imageLabel: 'Image' },
    newsroom: { showTitle: true, titleLabel: 'Title', showImage: true, imageLabel: 'Image' },
    events: { showTitle: true, titleLabel: 'Event Name', showEventDate: true, eventDateLabel: 'Event Date', showContent: true, contentLabel: 'Description', showImage: true, imageLabel: 'Main Image' },
    careers: { showTitle: true, titleLabel: 'Title', showContent: true, contentLabel: 'Description', showImage: true, imageLabel: 'Image' },
    clients: { showTitle: true, titleLabel: 'Title', showImage: true, imageLabel: 'Image' },
    milestones: { showYear: true, yearLabel: 'Year', showTitle: true, titleLabel: 'Title', showImage: true, imageLabel: 'Image', showContent: true, contentLabel: 'Description' },
    testimonials: { showTitle: true, titleLabel: 'Title', showTagLine: true, tagLineLabel: 'Tagline', showContent: true, contentLabel: 'Description', showImage: true, imageLabel: 'Image' }
  }), []);

  const currentConfig = pageConfig[pageType] || { showTitle: true, titleLabel: 'Title', showContent: true, contentLabel: 'Content' };
  const isEvents = pageType === 'events';
  const yearOptions = Array.from({ length: new Date().getFullYear() - 2014 + 1 }, (_, index) => (2014 + index).toString());
  const tableColumns =
    3 +
    (currentConfig.showEventDate ? 1 : 0) +
    (currentConfig.showYear ? 1 : 0) +
    (currentConfig.showImage ? 1 : 0);
  const resolveImageSrc = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('/uploads')) {
      return getUploadUrl(path);
    }
    return path;
  };
  const normalizeDate = (value?: string) => (value ? value.split('T')[0] : '');

  useEffect(() => {
    fetchItems();
    resetForm();
    setPageImages([]);
    setImageFiles([]);
  }, [pageType]);

  useEffect(() => {
    if (isEvents && editingId) {
      fetchPageImages(editingId);
    }
  }, [editingId, pageType]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const group_name = user.group_name || 'corporate';

      const response = await axios.get(`${API_BASE_URL}/footer/pages`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { pageType, group_name }
      });

      setItems(response.data.data || []);
    } catch (err) {
      console.error('Error fetching footer pages:', err);
      setError('Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  const fetchPageImages = async (footerPageId: number) => {
    try {
      setImagesLoading(true);
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const group_name = user.group_name || 'corporate';

      const response = await axios.get(`${API_BASE_URL}/footer/page-images`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { footer_page_id: footerPageId, pageType, group_name }
      });

      setPageImages(response.data.data || []);
    } catch (err) {
      console.error('Error fetching page images:', err);
      setError('Failed to fetch page images');
    } finally {
      setImagesLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      footer_page_type: pageType,
      title: '',
      tag_line: '',
      image: null,
      content: '',
      url: '',
      group_name: '',
      event_date: '',
      year: ''
    });
    setEditingId(null);
    setShowForm(false);
    setImageFiles([]);
    setPageImages([]);
    setFormResetKey((k) => k + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (currentConfig.showTitle && !formData.title.trim()) {
      setError(`${currentConfig.titleLabel || 'Title'} is required`);
      return;
    }
    if (currentConfig.showContent && !formData.content.trim()) {
      setError(`${currentConfig.contentLabel || 'Content'} is required`);
      return;
    }
    if (currentConfig.showEventDate && !formData.event_date) {
      setError(`${currentConfig.eventDateLabel || 'Event Date'} is required`);
      return;
    }
    if (currentConfig.showYear && !formData.year) {
      setError(`${currentConfig.yearLabel || 'Year'} is required`);
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const group_name = user.group_name || 'corporate';

      const payload = new FormData();
      payload.append('footer_page_type', formData.footer_page_type);
      payload.append('title', formData.title || '');
      payload.append('tag_line', formData.tag_line || '');
      payload.append('content', formData.content || '');
      payload.append('url', formData.url || '');
      payload.append('group_name', group_name);
      payload.append('user_id', String(user.id || ''));
      if (formData.event_date) payload.append('event_date', formData.event_date);
      if (formData.year) payload.append('year', formData.year);

      if (formData.image instanceof File) {
        payload.append('image', formData.image);
      }

      if (editingId) {
        await axios.put(`${API_BASE_URL}/footer/pages/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Entry updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/footer/pages`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Entry created successfully');
      }

      resetForm();
      fetchItems();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: FooterPageEntry) => {
    setEditingId(item.id || null);
    setFormData({
      ...item,
      image: item.image || null,
      event_date: normalizeDate(item.event_date),
      year: item.year ? String(item.year) : '',
      group_name: item.group_name || ''
    });
    setImageFiles([]);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/footer/pages/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Entry deleted successfully');
      fetchItems();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete entry');
    }
  };

  const handleImageUpload = async () => {
    if (!editingId) {
      setError('Please save the entry before uploading images');
      return;
    }
    if (imageFiles.length === 0) {
      setError('Please select at least one image to upload');
      return;
    }

    try {
      setError('');
      setSuccess('');
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const group_name = user.group_name || 'corporate';

      await Promise.all(
        imageFiles.map((file) => {
          const uploadData = new FormData();
          uploadData.append('footer_page_id', String(editingId));
          uploadData.append('group_name', group_name);
          uploadData.append('user_id', String(user.id || ''));
          uploadData.append('image', file);
          return axios.post(`${API_BASE_URL}/footer/page-images`, uploadData, {
            headers: { Authorization: `Bearer ${token}` }
          });
        })
      );

      setSuccess('Images uploaded successfully');
      setImageFiles([]);
      fetchPageImages(editingId);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload images');
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      setError('');
      setSuccess('');
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/footer/page-images/${imageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Image deleted successfully');
      if (editingId) {
        fetchPageImages(editingId);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete image');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{pageTitle}</h2>
          <p className="text-gray-600 mt-1">Manage {pageTitle.toLowerCase()} entries</p>
        </div>
        <button
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          {showForm ? 'Close Form' : 'Add Entry'}
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
            {editingId ? 'Edit Entry' : 'Add New Entry'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            {(currentConfig.showTitle || currentConfig.showTagLine || currentConfig.showEventDate || currentConfig.showYear) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentConfig.showTitle && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {currentConfig.titleLabel || 'Title'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                )}

                {currentConfig.showTagLine && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {currentConfig.tagLineLabel || 'Tagline'}
                    </label>
                    <input
                      type="text"
                      value={formData.tag_line}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tag_line: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      maxLength={100}
                    />
                  </div>
                )}

                {currentConfig.showEventDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {currentConfig.eventDateLabel || 'Event Date'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.event_date || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, event_date: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                )}

                {currentConfig.showYear && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {currentConfig.yearLabel || 'Year'} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.year || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, year: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">-- Select Year --</option>
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {currentConfig.showImage && (
              <div>
                <FileUpload
                  label={currentConfig.imageLabel || 'Image'}
                  value={
                    typeof formData.image === 'string'
                      ? resolveImageSrc(formData.image_url || formData.image)
                      : formData.image
                  }
                  onChange={(file) => setFormData((prev) => ({ ...prev, image: file }))}
                  accept="image/*"
                  preview={true}
                />
              </div>
            )}

            {currentConfig.showContent && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentConfig.contentLabel || 'Content'} <span className="text-red-500">*</span>
                </label>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <SummernoteEditor
                    key={formResetKey}
                    value={formData.content}
                    onChange={(value) => setFormData((prev) => ({ ...prev, content: value }))}
                    placeholder={`Enter ${currentConfig.contentLabel?.toLowerCase() || 'content'}...`}
                    height={280}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 ${
                  saving ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                <Save size={20} />
                {saving ? 'Saving...' : 'Save Entry'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
              >
                <X size={20} />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isEvents && editingId && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Event Images</h3>
              <p className="text-sm text-gray-600 mt-1">Upload and manage multiple images</p>
            </div>
            <button
              type="button"
              onClick={handleImageUpload}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Upload size={18} />
              Upload Images
            </button>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Images</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {imageFiles.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">{imageFiles.length} file(s) selected</p>
            )}
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {imagesLoading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                      Loading images...
                    </td>
                  </tr>
                ) : pageImages.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                      No images uploaded yet.
                    </td>
                  </tr>
                ) : (
                  pageImages.map((image) => (
                    <tr key={image.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{image.id}</td>
                      <td className="px-6 py-4">
                        <img
                          src={resolveImageSrc(image.image_url || image.image_path)}
                          alt={`Event ${image.id}`}
                          className="h-16 w-auto rounded border border-gray-200 object-cover"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(image.id)}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
                  {currentConfig.titleLabel || 'Title'}
                </th>
                {currentConfig.showEventDate && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Date
                  </th>
                )}
                {currentConfig.showYear && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Year
                  </th>
                )}
                {currentConfig.showImage && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={tableColumns} className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={tableColumns} className="px-6 py-4 text-center text-gray-500">
                    No entries found. Click "Add Entry" to create one.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{item.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.title}</td>
                    {currentConfig.showEventDate && (
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.event_date ? new Date(item.event_date).toLocaleDateString() : '-'}
                      </td>
                    )}
                    {currentConfig.showYear && (
                      <td className="px-6 py-4 text-sm text-gray-900">{item.year || '-'}</td>
                    )}
                    {currentConfig.showImage && (
                      <td className="px-6 py-4">
                        {item.image ? (
                          <img
                            src={resolveImageSrc(item.image_url || String(item.image))}
                            alt={item.title}
                            className="h-12 w-auto rounded border border-gray-200 object-cover"
                          />
                        ) : (
                          <span className="text-sm text-gray-500">No image</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id!)}
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
