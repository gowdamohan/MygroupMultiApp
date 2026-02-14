import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';
import { Edit2, ToggleLeft, ToggleRight, X, Upload } from 'lucide-react';

interface Language {
  id: number;
  lang_1: string;
  lang_2?: string;
}

interface Country {
  id: number;
  country: string;
}

interface State {
  id: number;
  state: string;
}

interface District {
  id: number;
  district: string;
}

interface MediaChannel {
  id: number;
  media_name_english: string;
  media_name_regional: string;
  media_logo: string;
  status: string;
  is_active: number;
  created_at: string;
  country_id?: number | null;
  state_id?: number | null;
  district_id?: number | null;
  language_id?: number | null;
  language?: Language;
  country?: Country;
  state?: State;
  district?: District;
}

interface EditFormData {
  media_name_english: string;
  media_name_regional: string;
  country_id: string;
  state_id: string;
  district_id: string;
  language_id: string;
  media_logo_file: File | null;
}

interface MediaChannelsViewProps {
  appId: string | undefined;
  categoryId: number;
  categoryName: string;
}

const emptyEditForm: EditFormData = {
  media_name_english: '',
  media_name_regional: '',
  country_id: '',
  state_id: '',
  district_id: '',
  language_id: '',
  media_logo_file: null
};

export const MediaChannelsView: React.FC<MediaChannelsViewProps> = ({ appId, categoryId, categoryName }) => {
  const [mediaChannels, setMediaChannels] = useState<MediaChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<MediaChannel | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData>(emptyEditForm);
  const [saving, setSaving] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (appId && categoryId) {
      fetchMediaChannels();
    }
  }, [appId, categoryId]);

  useEffect(() => {
    fetchCountries();
    fetchLanguages();
  }, []);

  useEffect(() => {
    if (editFormData.country_id) {
      fetchStates(parseInt(editFormData.country_id));
    } else {
      setStates([]);
    }
  }, [editFormData.country_id]);

  useEffect(() => {
    if (editFormData.state_id) {
      fetchDistricts(parseInt(editFormData.state_id));
    } else {
      setDistricts([]);
    }
  }, [editFormData.state_id]);

  const fetchMediaChannels = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${API_BASE_URL}/admin/media-channels?app_id=${appId}&category_id=${categoryId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMediaChannels(response.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch media channels');
    } finally {
      setLoading(false);
    }
  };

  const fetchCountries = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_BASE_URL}/geo/countries`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setCountries(res.data.data || []);
    } catch (e) {
      console.error('Fetch countries:', e);
    }
  };

  const fetchStates = async (countryId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_BASE_URL}/geo/states/${countryId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setStates(res.data.data || []);
    } catch (e) {
      console.error('Fetch states:', e);
    }
  };

  const fetchDistricts = async (stateId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_BASE_URL}/geo/districts/${stateId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setDistricts(res.data.data || []);
    } catch (e) {
      console.error('Fetch districts:', e);
    }
  };

  const fetchLanguages = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_BASE_URL}/partner/languages`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setLanguages(res.data.data || []);
    } catch (e) {
      console.error('Fetch languages:', e);
    }
  };

  const openEditModal = (channel: MediaChannel) => {
    setSelectedChannel(channel);
    setEditFormData({
      media_name_english: channel.media_name_english || '',
      media_name_regional: channel.media_name_regional || '',
      country_id: channel.country_id ? String(channel.country_id) : '',
      state_id: channel.state_id ? String(channel.state_id) : '',
      district_id: channel.district_id ? String(channel.district_id) : '',
      language_id: channel.language_id ? String(channel.language_id) : '',
      media_logo_file: null
    });
    setLogoPreview(null);
    setShowEditModal(true);
    setError('');
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedChannel(null);
    setEditFormData(emptyEditForm);
    setLogoPreview(null);
  };

  const handleEditFormChange = (field: keyof EditFormData, value: string | File | null) => {
    if (field === 'media_logo_file') {
      setEditFormData(prev => ({ ...prev, media_logo_file: value as File | null }));
      if (value && value instanceof File) {
        const reader = new FileReader();
        reader.onloadend = () => setLogoPreview(reader.result as string);
        reader.readAsDataURL(value);
      } else {
        setLogoPreview(null);
      }
    } else {
      setEditFormData(prev => ({ ...prev, [field]: value as string }));
    }
  };

  const handleSaveChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannel) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('media_name_english', editFormData.media_name_english);
      formData.append('media_name_regional', editFormData.media_name_regional);
      if (editFormData.country_id) formData.append('country_id', editFormData.country_id);
      if (editFormData.state_id) formData.append('state_id', editFormData.state_id);
      if (editFormData.district_id) formData.append('district_id', editFormData.district_id);
      if (editFormData.language_id) formData.append('language_id', editFormData.language_id);
      if (editFormData.media_logo_file) formData.append('media_logo', editFormData.media_logo_file);

      const response = await axios.put(
        `${API_BASE_URL}/admin/media-channels/${selectedChannel.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setMediaChannels(prev =>
          prev.map(ch => (ch.id === selectedChannel.id ? response.data.data : ch))
        );
        setSuccess('Media channel updated successfully');
        setTimeout(() => setSuccess(''), 3000);
        closeEditModal();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update media channel');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (channelId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const token = localStorage.getItem('accessToken');
      await axios.put(
        `${API_BASE_URL}/admin/media-channels/${channelId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMediaChannels(prev => prev.map(ch =>
        ch.id === channelId ? { ...ch, status: newStatus } : ch
      ));
      setSuccess('Status updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleToggleActive = async (channelId: number, currentActive: number) => {
    try {
      const newActive = currentActive === 1 ? 0 : 1;
      const token = localStorage.getItem('accessToken');
      await axios.put(
        `${API_BASE_URL}/admin/media-channels/${channelId}/active`,
        { is_active: newActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMediaChannels(prev => prev.map(ch =>
        ch.id === channelId ? { ...ch, is_active: newActive } : ch
      ));
      setSuccess('Active status updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update active status');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {categoryName} - Media Channels
        </h1>
      </div>

      {/* Error/Success Messages */}
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

      {/* Media Channels Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Media Logo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Media Name (Regional)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {mediaChannels.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                      No media channels found for this category
                    </td>
                  </tr>
                ) : (
                  mediaChannels.map((channel, index) => (
                    <tr key={channel.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(channel.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {channel.media_logo ? (
                          <img
                            src={channel.media_logo.startsWith('http') ? channel.media_logo : (channel.media_logo.startsWith('/') ? BACKEND_URL + channel.media_logo : BACKEND_URL + '/' + channel.media_logo)}
                            alt={channel.media_name_regional || channel.media_name_english}
                            className="h-10 w-10 object-contain rounded"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                            No Logo
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {channel.media_name_regional || channel.media_name_english || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {channel.language?.lang_1 || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {channel.country?.country || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {channel.state?.state || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {channel.district?.district || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(channel.id, channel.status)}
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            channel.status === 'active'
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {channel.status}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(channel.id, channel.is_active)}
                          className="inline-flex items-center gap-1"
                        >
                          {channel.is_active === 1 ? (
                            <ToggleRight size={24} className="text-blue-600" />
                          ) : (
                            <ToggleLeft size={24} className="text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(channel)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                        >
                          <Edit2 size={16} />
                          Edit
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

      {/* Edit Channel Modal */}
      {showEditModal && selectedChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Edit Media Channel</h2>
              <button
                type="button"
                onClick={closeEditModal}
                className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveChannel} className="p-4 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Media Name (English) *</label>
                <input
                  type="text"
                  value={editFormData.media_name_english}
                  onChange={e => handleEditFormChange('media_name_english', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Media Name (Regional)</label>
                <input
                  type="text"
                  value={editFormData.media_name_regional}
                  onChange={e => handleEditFormChange('media_name_regional', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select
                  value={editFormData.country_id}
                  onChange={e => handleEditFormChange('country_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select country</option>
                  {countries.map(c => (
                    <option key={c.id} value={c.id}>{c.country}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <select
                  value={editFormData.state_id}
                  onChange={e => handleEditFormChange('state_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select state</option>
                  {states.map(s => (
                    <option key={s.id} value={s.id}>{s.state}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <select
                  value={editFormData.district_id}
                  onChange={e => handleEditFormChange('district_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select district</option>
                  {districts.map(d => (
                    <option key={d.id} value={d.id}>{d.district}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <select
                  value={editFormData.language_id}
                  onChange={e => handleEditFormChange('language_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select language</option>
                  {languages.map(l => (
                    <option key={l.id} value={l.id}>{l.lang_1} {l.lang_2 ? `(${l.lang_2})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Media Logo (optional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  {(logoPreview || selectedChannel?.media_logo) ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={logoPreview || (selectedChannel.media_logo.startsWith('http') ? selectedChannel.media_logo : BACKEND_URL + (selectedChannel.media_logo.startsWith('/') ? selectedChannel.media_logo : '/' + selectedChannel.media_logo))}
                        alt="Logo"
                        className="h-16 w-16 object-contain rounded"
                      />
                      <div className="flex gap-2">
                        <label className="cursor-pointer px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium">
                          <Upload size={14} className="inline mr-1" />
                          Replace
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => handleEditFormChange('media_logo_file', e.target.files?.[0] || null)}
                          />
                        </label>
                        {editFormData.media_logo_file && (
                          <button
                            type="button"
                            onClick={() => handleEditFormChange('media_logo_file', null)}
                            className="text-sm text-gray-500 hover:text-gray-700"
                          >
                            Clear new
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center text-gray-500 hover:text-gray-700">
                      <Upload size={24} className="mb-1" />
                      <span className="text-sm">Click to upload new logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleEditFormChange('media_logo_file', e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

