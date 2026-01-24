import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Save, X, Edit2, Trash2, Upload } from 'lucide-react';
import { API_BASE_URL, getUploadUrl } from '../../config/api.config';

interface GalleryItem {
  gallery_id: number;
  gallery_name: string;
  gallery_description: string;
  gallery_date: string;
  group_id?: number;
  images?: GalleryImage[];
}

interface GalleryImage {
  image_id: number;
  gallery_id: number;
  image_name: string;
  image_description: string;
  group_id?: number;
  image_url?: string;
}

export const Gallery: React.FC = () => {
  const [galleries, setGalleries] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showImageForm, setShowImageForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedGalleryId, setSelectedGalleryId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    gallery_name: '',
    gallery_description: '',
    gallery_date: new Date().toISOString().split('T')[0]
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageDescription, setImageDescription] = useState('');
  const resolveImageSrc = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('/uploads')) {
      return getUploadUrl(path);
    }
    return path;
  };

  useEffect(() => {
    fetchGalleries();
  }, []);

  const fetchGalleries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const response = await axios.get(
        `${API_BASE_URL}/footer/galleries?group_id=${user.group_id || ''}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setGalleries(response.data.data || []);
    } catch (error) {
      console.error('Error fetching galleries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const payload = {
        ...formData,
        group_id: user.group_id
      };

      if (editingId) {
        await axios.put(`${API_BASE_URL}/footer/galleries/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Gallery updated successfully!');
      } else {
        await axios.post(`${API_BASE_URL}/footer/galleries`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Gallery created successfully!');
      }

      resetForm();
      fetchGalleries();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error saving gallery');
    }
  };

  const handleImageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGalleryId || imageFiles.length === 0) {
      alert('Please select a gallery and upload at least one image');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const payload = new FormData();
      payload.append('gallery_id', String(selectedGalleryId));
      payload.append('image_description', imageDescription || '');
      payload.append('group_id', user.group_id || '');
      imageFiles.forEach((file) => payload.append('images', file));

      await axios.post(`${API_BASE_URL}/footer/gallery-images`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Image added successfully!');
      resetImageForm();
      fetchGalleries();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error adding image');
    }
  };

  const handleEdit = (gallery: GalleryItem) => {
    setFormData({
      gallery_name: gallery.gallery_name,
      gallery_description: gallery.gallery_description,
      gallery_date: gallery.gallery_date.split('T')[0]
    });
    setEditingId(gallery.gallery_id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure? This will delete the gallery and all its images.')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/footer/galleries/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Gallery deleted successfully!');
      fetchGalleries();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error deleting gallery');
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/footer/gallery-images/${imageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Image deleted successfully!');
      fetchGalleries();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error deleting image');
    }
  };

  const resetForm = () => {
    setFormData({
      gallery_name: '',
      gallery_description: '',
      gallery_date: new Date().toISOString().split('T')[0]
    });
    setEditingId(null);
    setShowForm(false);
  };

  const resetImageForm = () => {
    setImageFiles([]);
    setImageDescription('');
    setSelectedGalleryId(null);
    setShowImageForm(false);
  };

  const handleMultiFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setImageFiles(files);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gallery Management</h2>
          <p className="text-gray-600 mt-1">Manage galleries and images</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Add Gallery
        </button>
      </div>

      {/* Gallery Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Gallery' : 'Add New Gallery'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gallery Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.gallery_name}
                  onChange={(e) => setFormData({ ...formData, gallery_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.gallery_date}
                  onChange={(e) => setFormData({ ...formData, gallery_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.gallery_description}
                onChange={(e) => setFormData({ ...formData, gallery_description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Save size={20} />
                {editingId ? 'Update' : 'Save'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
              >
                <X size={20} />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Image Upload Form */}
      {showImageForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Image to Gallery</h3>
          <form onSubmit={handleImageSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Gallery <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedGalleryId || ''}
                onChange={(e) => setSelectedGalleryId(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">-- Select Gallery --</option>
                {galleries.map((gallery) => (
                  <option key={gallery.gallery_id} value={gallery.gallery_id}>
                    {gallery.gallery_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Images <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleMultiFileChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              {imageFiles.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">{imageFiles.length} file(s) selected</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image Description
              </label>
              <textarea
                value={imageDescription}
                onChange={(e) => setImageDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Upload size={20} />
                Upload Image
              </button>
              <button
                type="button"
                onClick={resetImageForm}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
              >
                <X size={20} />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Galleries List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading galleries...</div>
        ) : galleries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No galleries found. Click "Add Gallery" to create one.
          </div>
        ) : (
          galleries.map((gallery) => (
            <div key={gallery.gallery_id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{gallery.gallery_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{gallery.gallery_description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Date: {new Date(gallery.gallery_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedGalleryId(gallery.gallery_id);
                        setShowImageForm(true);
                      }}
                      className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                    >
                      <Upload size={16} />
                      Add Image
                    </button>
                    <button
                      onClick={() => handleEdit(gallery)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Gallery"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(gallery.gallery_id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Gallery"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Gallery Images */}
              <div className="p-6">
                {gallery.images && gallery.images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {gallery.images.map((image) => (
                      <div key={image.image_id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={resolveImageSrc(image.image_url || image.image_name)}
                            alt={image.image_description}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2">{image.image_description}</p>
                        <button
                          onClick={() => handleDeleteImage(image.image_id)}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete Image"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No images in this gallery. Click "Add Image" to upload.
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

