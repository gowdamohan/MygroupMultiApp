import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Save } from 'lucide-react';
import { API_BASE_URL } from '../../config/api.config';

interface SocialLink {
  id?: number;
  title: string;
  url: string;
  group_name: string;
}

export const SocialMediaLinks: React.FC = () => {
  const platforms = useMemo(
    () => ['Website', 'YouTube', 'Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'Blogger'],
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formRows, setFormRows] = useState<Record<string, { id?: number; url: string }>>({});

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const group_name = user.group_name || 'corporate';

      const response = await axios.get(
        `${API_BASE_URL}/footer/social-media?group_name=${group_name}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response.data.data || [];

      const rows: Record<string, { id?: number; url: string }> = {};
      const normalize = (value: string) => value.trim().toLowerCase();
      platforms.forEach((platform) => {
        const existing = data.find((link: SocialLink) => normalize(link.title) === normalize(platform));
        rows[platform] = {
          id: existing?.id,
          url: existing?.url || ''
        };
      });
      setFormRows(rows);
    } catch (error) {
      console.error('Error fetching social media links:', error);
      setError('Failed to load social media links');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (platform: string) => {
    setError('');
    setSuccess('');
    const row = formRows[platform];

    if (!row?.url?.trim()) {
      setError(`Please enter a URL for ${platform}`);
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const payload = {
        id: row.id,
        title: platform,
        url: row.url,
        user_id: user.id,
        group_name: user.group_name || 'corporate'
      };

      await axios.post(`${API_BASE_URL}/footer/social-media`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(`${platform} link saved successfully`);
      fetchLinks();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error saving link');
    }
  };

  const handleUrlChange = (platform: string, url: string) => {
    setFormRows((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        url
      }
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Social Media Links</h2>
        <p className="text-gray-600 mt-1">Manage social media links</p>
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

      {/* Links Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
                ) : platforms.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No platform options available.
                  </td>
                </tr>
              ) : (
                platforms.map((platform, index) => (
                  <tr key={platform} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {platform}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <input
                        type="url"
                        value={formRows[platform]?.url || ''}
                        onChange={(e) => handleUrlChange(platform, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={`https://${platform.toLowerCase()}.com/yourpage`}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleSave(platform)}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Save size={16} />
                        Save
                      </button>
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

