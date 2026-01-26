import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Trash2, MapPin, Building2 } from 'lucide-react';
import { API_BASE_URL } from '../../config/api.config';

interface State {
  id: number;
  state: string;
  code?: string;
  country_id?: number;
}

interface District {
  id: number;
  district: string;
  code?: string;
  state_id: number;
}

interface OfferAd {
  id: number;
  image_path: string;
  image_url: string;
  group_id: number;
  state_id: number | null;
  district_id: number | null;
}

type TabType = 'regional' | 'branch';

export const FranchiseOfferAds: React.FC = () => {
  const [tab, setTab] = useState<TabType>('regional');
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [ads, setAds] = useState<OfferAd[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    axios.get(`${API_BASE_URL}/admin/states`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setStates(res.data.data || []))
      .catch(() => setStates([]));
  }, []);

  useEffect(() => {
    if (!selectedState) {
      setDistricts([]);
      setSelectedDistrict('');
      return;
    }
    const token = localStorage.getItem('accessToken');
    axios.get(`${API_BASE_URL}/admin/districts?state_id=${selectedState}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setDistricts(res.data.data || []))
      .catch(() => setDistricts([]));
    setSelectedDistrict('');
  }, [selectedState]);

  const fetchAds = () => {
    const token = localStorage.getItem('accessToken');
    const params: Record<string, string> = { limit: '100', group_id: tab === 'regional' ? '1' : '2' };
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

  const handleUpload = async () => {
    if (tab === 'regional' && !selectedState) {
      setMessage({ type: 'error', text: 'Please select a state.' });
      return;
    }
    if (tab === 'branch' && !selectedDistrict) {
      setMessage({ type: 'error', text: 'Please select a district.' });
      return;
    }
    if (files.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one image.' });
      return;
    }

    setUploading(true);
    setMessage(null);
    const token = localStorage.getItem('accessToken');
    const formData = new FormData();
    formData.append('group_id', tab === 'regional' ? '1' : '2');
    if (tab === 'regional') formData.append('state_id', selectedState);
    else formData.append('district_id', selectedDistrict);
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
        <p className="text-gray-600 mt-1">Upload images by region (state) or branch (district). Stored on Wasabi.</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => { setTab('regional'); setMessage(null); setSelectedState(''); setSelectedDistrict(''); }}
          className={`px-4 py-2 font-medium rounded-t-lg flex items-center gap-2 ${
            tab === 'regional' ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <MapPin size={18} />
          Regional (by State)
        </button>
        <button
          onClick={() => { setTab('branch'); setMessage(null); setSelectedState(''); setSelectedDistrict(''); }}
          className={`px-4 py-2 font-medium rounded-t-lg flex items-center gap-2 ${
            tab === 'branch' ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Building2 size={18} />
          Branch (by District)
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload images</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
            <select
              value={selectedState}
              onChange={e => setSelectedState(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select state</option>
              {states.map(s => (
                <option key={s.id} value={s.id}>{s.state}</option>
              ))}
            </select>
          </div>
          {tab === 'branch' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
              <select
                value={selectedDistrict}
                onChange={e => setSelectedDistrict(e.target.value)}
                disabled={!selectedState}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Select district</option>
                {districts.map(d => (
                  <option key={d.id} value={d.id}>{d.district}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
        />
        {files.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
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
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload size={18} />
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded images</h3>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : ads.length === 0 ? (
          <p className="text-gray-500">No images yet. Upload using the form above.</p>
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
