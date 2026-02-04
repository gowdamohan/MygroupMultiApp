import React, { useState, useEffect } from 'react';
import { Save, Loader2, User } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL, getUploadUrl } from '../../config/api.config';

interface GroupProfile {
  id: number;
  name: string | null;
  icon: string | null;
  logo: string | null;
  name_image: string | null;
  color_code: string | null;
  created_at?: string;
  updated_at?: string;
}

export const Profile: React.FC = () => {
  const [profile, setProfile] = useState<GroupProfile | null>(null);
  const [name, setName] = useState('');
  const [colorCode, setColorCode] = useState('#2563eb');
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [nameImageFile, setNameImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (success || error) {
      const t = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [success, error]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_BASE_URL}/admin/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && res.data.data) {
        const p = res.data.data as GroupProfile;
        setProfile(p);
        setName(p.name || '');
        setColorCode(p.color_code || '#2563eb');
      } else {
        setProfile(null);
        setName('');
        setColorCode('#2563eb');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const token = localStorage.getItem('accessToken');
      const formDataToSend = new FormData();
      formDataToSend.append('name', name);
      formDataToSend.append('color_code', colorCode);
      if (iconFile) formDataToSend.append('icon', iconFile);
      if (logoFile) formDataToSend.append('logo', logoFile);
      if (nameImageFile) formDataToSend.append('name_image', nameImageFile);

      if (profile?.id) {
        await axios.put(`${API_BASE_URL}/admin/profile/${profile.id}`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setSuccess('Profile updated successfully.');
      } else {
        await axios.post(`${API_BASE_URL}/admin/profile`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setSuccess('Profile created successfully.');
      }
      await fetchProfile();
      setIconFile(null);
      setLogoFile(null);
      setNameImageFile(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const [iconPreviewUrl, setIconPreviewUrl] = useState<string | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [nameImagePreviewUrl, setNameImagePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (iconFile) {
      const url = URL.createObjectURL(iconFile);
      setIconPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setIconPreviewUrl(profile?.icon ? getUploadUrl(profile.icon) : null);
  }, [iconFile, profile?.icon]);

  useEffect(() => {
    if (logoFile) {
      const url = URL.createObjectURL(logoFile);
      setLogoPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setLogoPreviewUrl(profile?.logo ? getUploadUrl(profile.logo) : null);
  }, [logoFile, profile?.logo]);

  useEffect(() => {
    if (nameImageFile) {
      const url = URL.createObjectURL(nameImageFile);
      setNameImagePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setNameImagePreviewUrl(profile?.name_image ? getUploadUrl(profile.name_image) : null);
  }, [nameImageFile, profile?.name_image]);

  const iconPreview = iconPreviewUrl;
  const logoPreview = logoPreviewUrl;
  const nameImagePreview = nameImagePreviewUrl;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <User className="w-7 h-7 text-primary-600" />
        <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Group / Organization Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Enter group or organization name"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setIconFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            {iconPreview && (
              <div className="mt-2 w-20 h-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                <img src={iconPreview} alt="Icon preview" className="w-full h-full object-contain" />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            {logoPreview && (
              <div className="mt-2 w-20 h-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name Image / Banner</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNameImageFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            {nameImagePreview && (
              <div className="mt-2 h-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                <img src={nameImagePreview} alt="Name image preview" className="w-full h-full object-contain" />
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Brand Color</label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={colorCode}
              onChange={(e) => setColorCode(e.target.value)}
              className="h-10 w-14 border border-gray-300 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              value={colorCode}
              onChange={(e) => setColorCode(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="#2563eb"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {profile?.id ? 'Update' : 'Save'} Profile
          </button>
        </div>
      </form>
    </div>
  );
};
