import React, { useState, useEffect } from 'react';
import { Save, Edit2, Key, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';

interface CorporateUser {
  id: number;
  first_name: string;
  email: string;
  username: string;
  active: number;
  created_on: number;
}

export const CorporateLogin: React.FC = () => {
  const [user, setUser] = useState<CorporateUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    email: '',
    username: '',
    password: ''
  });
  const [resetPassword, setResetPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCorporateUser();
  }, []);

  const fetchCorporateUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/corporate-user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setUser(response.data.data);
        if (response.data.data) {
          setFormData({
            first_name: response.data.data.first_name || '',
            email: response.data.data.email || '',
            username: response.data.data.username || '',
            password: ''
          });
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch corporate user');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${API_BASE_URL}/admin/corporate-user`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Corporate user created successfully');
      fetchCorporateUser();
      setFormData({ first_name: '', email: '', username: '', password: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create corporate user');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(`${API_BASE_URL}/admin/corporate-user/${user.id}`, {
        first_name: formData.first_name,
        email: formData.email,
        username: formData.username
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Corporate user updated successfully');
      setIsEditing(false);
      fetchCorporateUser();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update corporate user');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user) return;

    if (!resetPassword || resetPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${API_BASE_URL}/admin/corporate-user/${user.id}/reset-password`, {
        password: resetPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Password reset successfully');
      setShowPasswordReset(false);
      setResetPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        email: user.email || '',
        username: user.username || '',
        password: ''
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Corporate Login Management</h1>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</motion.div>
        )}
      </AnimatePresence>

      <motion.div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Corporate User Credentials</h2>

        {!user ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter username"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password (min 6 characters)"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <UserPlus size={18} />
              Create Corporate User
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-md font-semibold mb-3">Current Corporate User</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">{user.first_name || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">{user.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Username</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">{user.username}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <p className="text-gray-900 font-medium">
                    <span className={`px-2 py-1 rounded-full text-xs ${user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                {isEditing ? (
                  <>
                    <button onClick={handleUpdate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                      <Save size={18} />
                      Save Changes
                    </button>
                    <button onClick={handleCancelEdit} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                      <Edit2 size={18} />
                      Edit
                    </button>
                    <button onClick={() => setShowPasswordReset(true)} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2">
                      <Key size={18} />
                      Reset Password
                    </button>
                  </>
                )}
              </div>
            </div>

            {showPasswordReset && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="text-md font-semibold mb-3 text-orange-900">Reset Password</h3>
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password *</label>
                    <input
                      type="password"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter new password (min 6 characters)"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2">
                      <Key size={18} />
                      Reset Password
                    </button>
                    <button type="button" onClick={() => { setShowPasswordReset(false); setResetPassword(''); }}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

