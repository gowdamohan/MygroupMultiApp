import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, X, Image as ImageIcon } from 'lucide-react';
import { FileUpload } from '../../components/form/FileUpload';
import { API_BASE_URL } from '../../config/api.config';

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
  content: string;
  url: string;
  group_name: string;
}

export const FooterPageManager: React.FC<FooterPageManagerProps> = ({ pageType, pageTitle }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FooterPageData>({
    footer_page_type: pageType,
    title: '',
    tag_line: '',
    image: null,
    content: '',
    url: '',
    group_name: ''
  });

  useEffect(() => {
    fetchPageData();
  }, [pageType]);

  const fetchPageData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const group_name = user.group_name || 'corporate';

      const response = await axios.get(
        `${API_BASE_URL}/footer/page/${pageType}?group_name=${group_name}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.data) {
        setFormData({
          ...response.data.data,
          image: response.data.data.image || null
        });
      } else {
        // Set default group_name for new pages
        setFormData(prev => ({ ...prev, group_name }));
      }
    } catch (error) {
      console.error('Error fetching page data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // For now, if image is a File, convert to base64 or handle upload separately
      // In production, you'd upload to S3 or similar
      let imageData = formData.image;
      if (formData.image instanceof File) {
        // Convert to base64 for simple storage
        imageData = await fileToBase64(formData.image);
      }

      const payload = {
        ...formData,
        image: imageData,
        user_id: user.id,
        group_name: formData.group_name || user.group_name || 'corporate'
      };

      await axios.post(`${API_BASE_URL}/footer/page`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Page saved successfully!');
      fetchPageData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error saving page');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{pageTitle}</h2>
        <p className="text-gray-600 mt-1">Manage {pageTitle.toLowerCase()} content</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tag Line
              </label>
              <input
                type="text"
                value={formData.tag_line}
                onChange={(e) => setFormData({ ...formData, tag_line: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={100}
              />
            </div>
          </div>

          <div>
            <FileUpload
              label="Image"
              value={formData.image}
              onChange={(file) => setFormData({ ...formData, image: file })}
              accept="image/*"
              preview={true}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={10}
              placeholder="Enter page content (HTML supported)"
            />
            <p className="text-sm text-gray-500 mt-1">
              Note: Rich text editor (Summernote) can be integrated here for better content editing
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL (Optional)
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Save size={20} />
              Save Page
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
    </div>
  );
};

