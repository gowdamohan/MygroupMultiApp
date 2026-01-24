import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Edit2, Key, Save, X } from 'lucide-react';
import { API_BASE_URL } from '../../config/api.config';

interface Country {
  id: number;
  country: string;
}

interface State {
  id: number;
  state: string;
  country_id: number;
}

interface RegionalOfficeUser {
  id: number;
  first_name: string;
  phone: string;
  email: string;
  username: string;
  status: number;
  country_id: number;
  country_name: string;
  state_id: number;
  state_name: string;
  franchise_holder_id: number;
}

interface StateRow {
  state_id: number;
  state_name: string;
  country_id: number;
  user?: RegionalOfficeUser;
  isEditing?: boolean;
  formData?: {
    first_name: string;
    phone: string;
    email: string;
    username: string;
  };
}

export const RegionalOfficeLogin: React.FC = () => {
  const [stateRows, setStateRows] = useState<StateRow[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [resetPasswordId, setResetPasswordId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      setStates([]);
      setStateRows([]);
      fetchStates(selectedCountry);
    } else {
      setStates([]);
      setStateRows([]);
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (states.length > 0) {
      fetchUsersAndBuildRows();
    } else {
      setStateRows([]);
    }
  }, [states]);

  const fetchCountries = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/countries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCountries(response.data.data || []);
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  const fetchStates = async (countryId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/states?country_id=${countryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStates(response.data.data || []);
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  const fetchUsersAndBuildRows = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/franchise/regional-office-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const users: RegionalOfficeUser[] = response.data;

      // Build rows: one row per state
      const rows: StateRow[] = states.map(state => {
        const user = users.find(u => u.state_id === state.id);
        return {
          state_id: state.id,
          state_name: state.state,
          country_id: state.country_id,
          user: user,
          isEditing: false,
          formData: user ? {
            first_name: user.first_name,
            phone: user.phone,
            email: user.email,
            username: user.username
          } : {
            first_name: '',
            phone: '',
            email: '',
            username: `my_${state.state.toLowerCase().replace(/\s+/g, '_')}`
          }
        };
      });

      setStateRows(rows);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (stateId: number, field: string, value: string) => {
    setStateRows(prev => prev.map(row => {
      if (row.state_id === stateId) {
        return {
          ...row,
          formData: {
            ...row.formData!,
            [field]: value
          }
        };
      }
      return row;
    }));
  };

  const handleSave = async (stateId: number) => {
    const row = stateRows.find(r => r.state_id === stateId);
    if (!row || !row.formData) return;

    try {
      const token = localStorage.getItem('accessToken');
      const payload = {
        ...row.formData,
        country: selectedCountry,
        state: stateId.toString()
      };

      if (row.user) {
        // Update existing user
        await axios.put(
          `${API_BASE_URL}/franchise/regional-office-users/${row.user.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('User updated successfully');
      } else {
        // Create new user
        await axios.post(
          `${API_BASE_URL}/franchise/regional-office-users`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('User created successfully with default password: 123456');
      }

      fetchUsersAndBuildRows();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error saving user');
    }
  };

  const handleEdit = (stateId: number) => {
    setStateRows(prev => prev.map(row => {
      if (row.state_id === stateId) {
        return { ...row, isEditing: true };
      }
      return row;
    }));
  };

  const handleCancelEdit = (stateId: number) => {
    setStateRows(prev => prev.map(row => {
      if (row.state_id === stateId && row.user) {
        return {
          ...row,
          isEditing: false,
          formData: {
            first_name: row.user.first_name,
            phone: row.user.phone,
            email: row.user.email,
            username: row.user.username
          }
        };
      }
      return row;
    }));
  };

  const handleResetPassword = async (userId: number) => {
    if (!newPassword) {
      alert('Please enter a new password');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${API_BASE_URL}/franchise/regional-office-users/${userId}/reset-password`,
        { password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Password reset successfully');
      setResetPasswordId(null);
      setNewPassword('');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error resetting password');
    }
  };

  const handleToggleStatus = async (userId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.patch(
        `${API_BASE_URL}/franchise/regional-office-users/${userId}/toggle-status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsersAndBuildRows();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error toggling status');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Regional Office Login Management</h2>
        <p className="text-gray-600 mt-1">Manage regional office users by state</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 gap-4">
          {/* Country Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Country <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Country</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.country}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {!selectedCountry ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">Please select a country to view states</p>
        </div>
      ) : (
        <>
          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      State
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      First Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : stateRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        No states found for selected country
                      </td>
                    </tr>
                  ) : (
                    stateRows.map((row) => {
                      const isEditable = !row.user || row.isEditing;
                      return (
                        <tr key={row.state_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {row.state_name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {isEditable ? (
                              <input
                                type="text"
                                value={row.formData?.first_name || ''}
                                onChange={(e) => handleInputChange(row.state_id, 'first_name', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="First Name"
                              />
                            ) : (
                              <span className="text-gray-900">{row.user?.first_name}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {isEditable ? (
                              <input
                                type="text"
                                value={row.formData?.phone || ''}
                                onChange={(e) => handleInputChange(row.state_id, 'phone', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Phone"
                              />
                            ) : (
                              <span className="text-gray-900">{row.user?.phone}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {isEditable ? (
                              <input
                                type="email"
                                value={row.formData?.email || ''}
                                onChange={(e) => handleInputChange(row.state_id, 'email', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Email"
                              />
                            ) : (
                              <span className="text-gray-900">{row.user?.email}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {isEditable ? (
                              <input
                                type="text"
                                value={row.formData?.username || ''}
                                onChange={(e) => handleInputChange(row.state_id, 'username', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Username"
                              />
                            ) : (
                              <span className="text-gray-900">{row.user?.username}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {row.user ? (
                              <button
                                onClick={() => handleToggleStatus(row.user!.id)}
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  row.user.status === 1
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {row.user.status === 1 ? 'Active' : 'Inactive'}
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              {!row.user ? (
                                // New user - show Save button
                                <button
                                  onClick={() => handleSave(row.state_id)}
                                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 text-xs"
                                  title="Save"
                                >
                                  <Save size={14} />
                                  Save
                                </button>
                              ) : row.isEditing ? (
                                // Editing mode - show Save and Cancel
                                <>
                                  <button
                                    onClick={() => handleSave(row.state_id)}
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 text-xs"
                                    title="Save"
                                  >
                                    <Save size={14} />
                                    Save
                                  </button>
                                  <button
                                    onClick={() => handleCancelEdit(row.state_id)}
                                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-1 text-xs"
                                    title="Cancel"
                                  >
                                    <X size={14} />
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                // View mode - show Edit and Reset Password
                                <>
                                  <button
                                    onClick={() => handleEdit(row.state_id)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={() => setResetPasswordId(row.user!.id)}
                                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                    title="Reset Password"
                                  >
                                    <Key size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Reset Password Modal */}
      {resetPasswordId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reset Password</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter new password"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleResetPassword(resetPasswordId)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Save size={20} />
                Reset Password
              </button>
              <button
                onClick={() => {
                  setResetPasswordId(null);
                  setNewPassword('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
              >
                <X size={20} />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

