import React, { useState } from 'react';
import { Upload, Video, Image as ImageIcon, FileText, Save, X } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5002/api/v1';

export const CreateMedia: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [mediaType, setMediaType] = useState<'video' | 'image' | 'document'>('video');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    file: null as File | null
  });
  const [preview, setPreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({
        ...formData,
        file
      });

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('accessToken');
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('tags', formData.tags);
      formDataToSend.append('mediaType', mediaType);
      if (formData.file) {
        formDataToSend.append('file', formData.file);
      }

      const response = await axios.post(`${API_BASE_URL}/partner/media`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setSuccess('Media uploaded successfully!');
        setFormData({
          title: '',
          description: '',
          category: '',
          tags: '',
          file: null
        });
        setPreview(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload media');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Media</h2>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Media Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Media Type
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setMediaType('video')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                  mediaType === 'video'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Video size={20} />
                Video
              </button>
              <button
                type="button"
                onClick={() => setMediaType('image')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                  mediaType === 'image'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <ImageIcon size={20} />
                Image
              </button>
              <button
                type="button"
                onClick={() => setMediaType('document')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                  mediaType === 'document'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <FileText size={20} />
                Document
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter media title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter media description"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select a category</option>
              <option value="entertainment">Entertainment</option>
              <option value="education">Education</option>
              <option value="news">News</option>
              <option value="sports">Sports</option>
              <option value="music">Music</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma separated)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., tutorial, beginner, programming"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                onChange={handleFileChange}
                accept={
                  mediaType === 'video'
                    ? 'video/*'
                    : mediaType === 'image'
                    ? 'image/*'
                    : '.pdf,.doc,.docx'
                }
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="text-gray-400 mb-2" size={40} />
                <span className="text-sm text-gray-600">
                  {formData.file ? formData.file.name : 'Click to upload or drag and drop'}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  {mediaType === 'video' && 'MP4, AVI, MOV up to 500MB'}
                  {mediaType === 'image' && 'PNG, JPG, GIF up to 10MB'}
                  {mediaType === 'document' && 'PDF, DOC, DOCX up to 10MB'}
                </span>
              </label>
            </div>

            {/* Preview */}
            {preview && (
              <div className="mt-4 relative">
                <img src={preview} alt="Preview" className="max-w-xs rounded-lg" />
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null);
                    setFormData({ ...formData, file: null });
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !formData.file}
              className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={20} />
              {loading ? 'Uploading...' : 'Upload Media'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

