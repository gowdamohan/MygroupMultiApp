import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Mail, Phone, Hash } from 'lucide-react';
import { API_BASE_URL } from '../../config/api.config';

export const FranchiseAdminDetails: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setProfile(response.data.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4 max-w-2xl">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
      </div>
    );
  }

  const groupName = profile?.groups?.[0]?.description || profile?.groups?.[0]?.name || '—';

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Admin Details</h2>
        <p className="text-gray-600 mt-1">View your profile information (display only)</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <User className="text-primary-600" size={20} />
            </div>
            <div>
              <div className="text-sm text-gray-500">Full Name</div>
              <div className="font-medium text-gray-900">
                {profile?.first_name} {profile?.last_name || ''}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Hash className="text-gray-600" size={20} />
            </div>
            <div>
              <div className="text-sm text-gray-500">Username</div>
              <div className="font-medium text-gray-900">{profile?.username || '—'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Mail className="text-gray-600" size={20} />
            </div>
            <div>
              <div className="text-sm text-gray-500">Email</div>
              <div className="font-medium text-gray-900">{profile?.email || '—'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Phone className="text-gray-600" size={20} />
            </div>
            <div>
              <div className="text-sm text-gray-500">Phone</div>
              <div className="font-medium text-gray-900">{profile?.phone || '—'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <User className="text-gray-600" size={20} />
            </div>
            <div>
              <div className="text-sm text-gray-500">Group / Role</div>
              <div className="font-medium text-gray-900">{groupName}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
