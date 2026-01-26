import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Trash2, MapPin, Building2, Link2, FileImage, Plus } from 'lucide-react';
import { API_BASE_URL } from '../../config/api.config';

interface OfferAd {
  id: number;
  image_path: string | null;
  image_url: string;
  group_name: string;
}

type TabType = 'regional' | 'branch';
type AddMode = 'url' | 'file';

export const FranchiseOfferAds: React.FC = () => {
  const [tab, setTab] = useState<TabType>('regional');
  const [ads, setAds] = useState<OfferAd[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>('file');
  const [files, setFiles] = useState<File[]>([]);
  const [urls, setUrls] = useState<string[]>(['']);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const groupName = tab;

  const fetchAds = () => {
    const token = localStorage.getItem('accessToken');
    const params: Record<string, string> = { limit: '100', group_name: groupName };
    setLoading(true);
    axios.get(`${API_BASE_URL}/franchise-offer-ads`, {
      headers: { Authorization: `Bearer ${token}` },
      params
    })
      .then(res => {
        if (res.data.success) setAds(res.data.data || []);
      })
      .catch(() => setAds([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAds();
  }, [tab]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    setFiles(prev => [...prev, ...list]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addUrlField = () => setUrls(prev => [...prev, '']);
  const setUrlAt = (index: number, value: string) => {
    setUrls(prev => prev.map((u, i) => (i === index ? value : u)));
  };
  const removeUrlAt = (index: number) => {
    setUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadByUrl = async () => {
    const imageUrls = urls.map(u => u.trim()).filter(Boolean);
    if (imageUrls.length === 0) {
      setMessage({ type: 'error', text: 'Please enter at least one image URL.' });
      return;
    }

    setUploading(true);
    setMessage(null);
    const token = localStorage.getItem('accessToken');
    try {
      const res = await axios.post(
        `${API_BASE_URL}/franchise-offer-ads/by-url`,
        { group_name: groupName, image_urls: imageUrls },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      setMessage({ type: 'success', text: res.data.message || 'URLs added successfully.' });
      setUrls(['']);
      fetchAds();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to add URLs.' });
    } finally {
      setUploading(false);
    }
  };

  const handleUploadFiles = async () => {
    if (files.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one image.' });
      return;
    }

    setUploading(true);
    setMessage(null);
    const token = localStorage.getItem('accessToken');
    const formData = new FormData();
    formData.append('group_name', groupName);
    files.forEach(f => formData.append('images', f));

    try {
      const res = await axios.post(`${API_BASE_URL}/franchise-offer-ads`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setMessage({ type: 'success', text: res.data.message || 'Uploaded successfully.' });
      setFiles([]);
      fetchAds();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this image?')) return;
    const token = localStorage.getItem('accessToken');
    try {
      await axios.delete(`${API_BASE_URL}/franchise-offer-ads/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Deleted.' });
      fetchAds();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Delete failed.' });
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Offer Ads</h2>
        <p className="text-gray-600 mt-1">Add images for Regional or Branch via URL or file upload. Stored in franchise_offer_ads (group_name: regional / branch).</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => { setTab('regional'); setMessage(null); }}
          className={`px-4 py-2 font-medium rounded-t-lg flex items-center gap-2 ${
            tab === 'regional' ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <MapPin size={18} />
          Regional
        </button>
        <button
          onClick={() => { setTab('branch'); setMessage(null); }}
          className={`px-4 py-2 font-medium rounded-t-lg flex items-center gap-2 ${
            tab === 'branch' ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Building2 size={18} />
          Branch
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Add images (group: {groupName})</h3>
        <p className="text-sm text-gray-500 mb-4">Choose how to add images for this group.</p>

        <div className="flex gap-2 mb-4 border-b border-gray-100 pb-4">
          <button
            type="button"
            onClick={() => setAddMode('url')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              addMode === 'url' ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
            }`}
          >
            <Link2 size={18} />
            URL Input
          </button>
          <button
            type="button"
            onClick={() => setAddMode('file')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              addMode === 'file' ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
            }`}
          >
            <FileImage size={18} />
            File Upload
          </button>
        </div>

        {addMode === 'url' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Enter one or more image URLs. Each URL will be saved for group &quot;{groupName}&quot;.</p>
            {urls.map((url, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrlAt(i, e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {urls.length > 1 ? (
                  <button type="button" onClick={() => removeUrlAt(i)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Remove">×</button>
                ) : null}
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={addUrlField} className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                <Plus size={16} /> Add URL
              </button>
              <button
                type="button"
                onClick={handleUploadByUrl}
                disabled={uploading || !urls.some(u => u.trim())}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Adding...' : 'Add by URL'}
              </button>
            </div>
          </div>
        )}

        {addMode === 'file' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Select one or more image files to upload for group &quot;{groupName}&quot;.</p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                    {f.name}
                    <button type="button" onClick={() => removeFile(i)} className="text-red-600 hover:text-red-800">&times;</button>
                  </span>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={handleUploadFiles}
              disabled={uploading || files.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload size={18} />
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Images for {groupName}</h3>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : ads.length === 0 ? (
          <p className="text-gray-500">No images yet. Add using URL Input or File Upload above.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {ads.map(ad => (
              <div key={ad.id} className="relative group rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={ad.image_url || '#'}
                  alt="Offer"
                  className="w-full aspect-square object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23eee" width="100" height="100"/><text x="50" y="50" fill="%23999" text-anchor="middle" dy=".3em" font-size="12">No image</text></svg>'; }}
                />
                <button
                  type="button"
                  onClick={() => handleDelete(ad.id)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
