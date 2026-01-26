import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';
import { SummernoteEditor } from '../../components/form/SummernoteEditor';

const USER_TERMS_TYPE = 'user_terms';

export const UserTermsConditions: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setError('');
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/user-terms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success && Array.isArray(response.data.data)) {
        const record = response.data.data.find((r: { type: string }) => r.type === USER_TERMS_TYPE);
        setContent(record?.content || '');
      }
    } catch (err: any) {
      console.error('Error fetching user terms:', err);
      setError('Failed to load user terms and conditions');
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
      await axios.post(
        `${API_BASE_URL}/user-terms`,
        { type: USER_TERMS_TYPE, content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('User terms and conditions saved successfully.');
      fetchContent();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save');
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
        <h2 className="text-2xl font-bold text-gray-900">User Terms and Conditions</h2>
        <p className="text-gray-600 mt-1">Manage user terms and conditions content</p>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content <span className="text-red-500">*</span>
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <SummernoteEditor
                value={content}
                onChange={(value) => setContent(value)}
                placeholder="Enter user terms and conditions..."
                height={320}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={20} />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
        <div className="prose max-w-none">
          {content ? (
            <div
              className="text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <p className="text-gray-400 italic">No content yet. Add content above to see preview.</p>
          )}
        </div>
      </div>
    </div>
  );
};
