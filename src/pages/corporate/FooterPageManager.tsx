import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, X, Upload, Trash2 } from 'lucide-react';
import { FileUpload } from '../../components/form/FileUpload';
import { SummernoteEditor } from '../../components/form/SummernoteEditor';
import { API_BASE_URL, getUploadUrl } from '../../config/api.config';

interface FooterPageManagerProps {
  pageType: string;
  pageTitle: string;
}

interface FooterPageData {
  id?: number;
  user_id?: number;
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

export const FooterPageManager: React.FC<FooterPageManagerProps> = ({ pageType, pageTitle }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pageImages, setPageImages] = useState<FooterPageImage[]>([]);
  const [imageUpload, setImageUpload] = useState<File | null>(null);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);
  const [formData, setFormData] = useState<FooterPageData>({
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

  const pageConfig: Record<string, {
    showTitle?: boolean;
    titleLabel?: string;
    showTagLine?: boolean;
    tagLineLabel?: string;
    showImage?: boolean;
    imageLabel?: string;
    showContent?: boolean;
    contentLabel?: string;
    showUrl?: boolean;
    showEventDate?: boolean;
    eventDateLabel?: string;
    showYear?: boolean;
    yearLabel?: string;
  }> = {
    about_us: { showTitle: true, titleLabel: 'Title', showImage: true, imageLabel: 'Image', showContent: true, contentLabel: 'Description' },
    awards: { showTitle: true, titleLabel: 'Title', showImage: true, imageLabel: 'Image' },
    newsroom: { showTitle: true, titleLabel: 'Title', showImage: true, imageLabel: 'Image' },
    events: { showTitle: true, titleLabel: 'Event Name', showEventDate: true, eventDateLabel: 'Event Date', showContent: true, contentLabel: 'Description', showImage: true, imageLabel: 'Main Image' },
    careers: { showTitle: true, titleLabel: 'Title', showContent: true, contentLabel: 'Description', showImage: true, imageLabel: 'Image' },
    clients: { showTitle: true, titleLabel: 'Title', showImage: true, imageLabel: 'Image' },
    milestones: { showYear: true, yearLabel: 'Year', showTitle: true, titleLabel: 'Title', showImage: true, imageLabel: 'Image', showContent: true, contentLabel: 'Description' },
    testimonials: { showTitle: true, titleLabel: 'Title', showTagLine: true, tagLineLabel: 'Tagline', showContent: true, contentLabel: 'Description', showImage: true, imageLabel: 'Image' },
    gallery: { showTitle: true, titleLabel: 'Title', showImage: true, imageLabel: 'Main Image' },
    contact_us: { showContent: true, contentLabel: 'Description' },
    terms: { showContent: true, contentLabel: 'Content' },
    privacy_policy: { showContent: true, contentLabel: 'Content' }
  };

  const currentConfig = pageConfig[pageType] || {
    showTitle: true,
    titleLabel: 'Title',
    showImage: true,
    imageLabel: 'Image',
    showContent: true,
    contentLabel: 'Content'
  };
  const isGalleryOrEvents = pageType === 'gallery' || pageType === 'events';
  const yearOptions = Array.from({ length: new Date().getFullYear() - 2014 + 1 }, (_, index) => (2014 + index).toString());
  const resolveImageSrc = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('/uploads')) {
      return getUploadUrl(path);
    }
    return path;
  };
  const normalizeDate = (value?: string) => (value ? value.split('T')[0] : '');

  useEffect(() => {
    fetchPageData();
    setImageUpload(null);
    setPageImages([]);
  }, [pageType]);

  useEffect(() => {
    if (isGalleryOrEvents) {
      fetchPageImages();
    }
  }, [pageType, formData.id]);

  const fetchPageData = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const group_name = user.group_name || 'corporate';

      const response = await axios.get(
        `${API_BASE_URL}/footer/page/${pageType}?group_name=${group_name}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.data && response.data.data.footer_page_type === pageType) {
        setFormData({
          ...response.data.data,
          image: response.data.data.image || null,
          image_url: response.data.data.image_url || '',
          event_date: normalizeDate(response.data.data.event_date),
          year: response.data.data.year ? String(response.data.data.year) : '',
          group_name
        });
      } else {
        // Reset form for new pages or different pageType
        setFormData({
          footer_page_type: pageType,
          title: '',
          tag_line: '',
          image: null,
          content: '',
          url: '',
          group_name,
          event_date: '',
          year: '',
          image_url: ''
        });
      }
    } catch (error) {
      console.error('Error fetching page data:', error);
      setError('Failed to fetch page data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPageImages = async () => {
    if (!isGalleryOrEvents) return;
    try {
      setImagesLoading(true);
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const group_name = formData.group_name || user.group_name || 'corporate';

      const response = await axios.get(`${API_BASE_URL}/footer/page-images`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          footer_page_id: formData.id || undefined,
          pageType,
          group_name
        }
      });

      setPageImages(response.data.data || []);
    } catch (err) {
      console.error('Error fetching page images:', err);
      setError('Failed to fetch page images');
    } finally {
      setImagesLoading(false);
    }
  };

  const handleImageUpload = async () => {
    if (!imageUpload) {
      setError('Please choose an image to upload');
      return;
    }
    if (!formData.id) {
      setError('Please save the page before uploading images');
      return;
    }

    try {
      setError('');
      setSuccess('');
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const group_name = formData.group_name || user.group_name || 'corporate';

      const uploadData = new FormData();
      uploadData.append('footer_page_id', String(formData.id));
      uploadData.append('group_name', group_name);
      uploadData.append('user_id', String(user.id || ''));
      uploadData.append('image', imageUpload);

      await axios.post(`${API_BASE_URL}/footer/page-images`, uploadData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Image uploaded successfully');
      setImageUpload(null);
      fetchPageImages();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload image');
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
      fetchPageImages();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete image');
    }
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
      const group_name = formData.group_name || user.group_name || 'corporate';

      const payload = new FormData();
      if (formData.id) payload.append('id', String(formData.id));
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
      } else if (typeof formData.image === 'string' && formData.image) {
        payload.append('image', formData.image);
      }

      await axios.post(`${API_BASE_URL}/footer/page`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Page saved successfully!');
      setFormData({
        footer_page_type: pageType,
        title: '',
        tag_line: '',
        image: null,
        content: '',
        url: '',
        group_name,
        event_date: '',
        year: '',
        image_url: ''
      });
      setImageUpload(null);
      setPageImages([]);
      setFormResetKey((k) => k + 1);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error saving page');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{pageTitle}</h2>
        <p className="text-gray-600 mt-1">Manage {pageTitle.toLowerCase()} content</p>
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

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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

          {currentConfig.showUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL (Optional)
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com"
              />
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
              {saving ? 'Saving...' : 'Save Page'}
            </button>
            <button
              type="button"
              onClick={() => fetchPageData()}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
            >
              <X size={20} />
              Reset
            </button>
          </div>
        </form>
      </div>

      {isGalleryOrEvents && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Additional Images</h3>
              <p className="text-sm text-gray-600 mt-1">Upload and manage multiple images</p>
            </div>
            <button
              type="button"
              onClick={handleImageUpload}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Upload size={18} />
              Upload Image
            </button>
          </div>

          <div className="mt-4">
            <FileUpload
              label="Upload Image"
              value={imageUpload}
              onChange={setImageUpload}
              accept="image/*"
              preview={true}
            />
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
                          alt={`Image ${image.id}`}
                          className="h-16 w-auto rounded border border-gray-200 object-cover"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(image.id)}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1 text-sm"
                        >
                          <Trash2 size={14} />
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
    </div>
  );
};

