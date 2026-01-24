import React, { useState, useEffect, useRef } from 'react';
import { Edit2, Trash2, Save, X, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { API_BASE_URL, getUploadUrl } from '../../../../config/api.config';

interface Continent {
  id: number;
  continent: string;
  code: string;
}

interface Country {
  id: number;
  continent_id: number;
  country: string;
  code?: string;
  country_flag?: string;
  currency_name?: string;
  currency_icon?: string;
  currency?: string;
  phone_code?: string;
  nationality?: string;
  locking_json?: { lockStates?: boolean; lockDistricts?: boolean } | null;
  order: number;
  status: number;
  continent?: Continent;
}

export const CountryList: React.FC = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [continents, setContinents] = useState<Continent[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    continent_id: '',
    country: '',
    code: '',
    country_flag: '',
    currency_name: '',
    currency_icon: '',
    currency: '',
    phone_code: '',
    nationality: '',
    order: 0,
    status: 1
  });
  const [filterContinentId, setFilterContinentId] = useState<string>('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [lockSettings, setLockSettings] = useState({ lockStates: false, lockDistricts: false });
  const [flagFile, setFlagFile] = useState<File | null>(null);
  const [currencyIconFile, setCurrencyIconFile] = useState<File | null>(null);
  const flagInputRef = useRef<HTMLInputElement>(null);
  const currencyIconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchContinents();
    fetchCountries();
  }, []);

  const fetchContinents = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/continents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setContinents(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching continents:', err);
    }
  };

  const fetchCountries = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/countries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCountries(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch countries');
    } finally {
      setLoading(false);
    }
  };

  const resetFileInputs = () => {
    if (flagInputRef.current) flagInputRef.current.value = '';
    if (currencyIconInputRef.current) currencyIconInputRef.current.value = '';
  };

  const resetForm = () => {
    setFormData({
      continent_id: '',
      country: '',
      code: '',
      country_flag: '',
      currency_name: '',
      currency_icon: '',
      currency: '',
      phone_code: '',
      nationality: '',
      order: 0,
      status: 1
    });
    setFlagFile(null);
    setCurrencyIconFile(null);
    resetFileInputs();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.country.trim() || !formData.continent_id) {
      setError('Country name and continent are required');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const payload = new FormData();

      payload.append('continent_id', formData.continent_id);
      payload.append('country', formData.country.trim());
      payload.append('code', formData.code || '');
      payload.append('currency', formData.currency || '');
      payload.append('currency_name', formData.currency_name || '');
      payload.append('phone_code', formData.phone_code || '');
      payload.append('nationality', formData.nationality || '');
      payload.append('order', formData.order.toString());
      payload.append('status', formData.status.toString());

      if (flagFile) {
        payload.append('country_flag', flagFile);
      } else if (formData.country_flag) {
        payload.append('country_flag', formData.country_flag);
      }

      if (currencyIconFile) {
        payload.append('currency_icon', currencyIconFile);
      } else if (formData.currency_icon) {
        payload.append('currency_icon', formData.currency_icon);
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };

      if (editingId) {
        await axios.put(`${API_BASE_URL}/admin/countries/${editingId}`, payload, config);
        setSuccess('Country updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/admin/countries`, payload, config);
        setSuccess('Country created successfully');
      }
      resetForm();
      setEditingId(null);
      fetchCountries();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (country: Country) => {
    setFormData({
      continent_id: country.continent_id.toString(),
      country: country.country,
      code: country.code || '',
      country_flag: country.country_flag || '',
      currency_name: country.currency_name || '',
      currency_icon: country.currency_icon || '',
      currency: country.currency || '',
      phone_code: country.phone_code || '',
      nationality: country.nationality || '',
      order: country.order,
      status: country.status
    });
    setFlagFile(null);
    setCurrencyIconFile(null);
    resetFileInputs();
    setEditingId(country.id);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this country?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/admin/countries/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Country deleted successfully');
      fetchCountries();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleStatusToggle = async (id: number, currentStatus: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const country = countries.find(c => c.id === id);
      if (!country) return;

      await axios.put(`${API_BASE_URL}/admin/countries/${id}`,
        { ...country, status: currentStatus === 1 ? 0 : 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCountries();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleCancel = () => {
    resetForm();
    setEditingId(null);
    setError('');
    setSuccess('');
  };

  const handleLockClick = (country: Country) => {
    setSelectedCountry(country);
    setLockSettings({
      lockStates: country.locking_json?.lockStates || false,
      lockDistricts: country.locking_json?.lockDistricts || false
    });
    setLockModalOpen(true);
  };

  const handleLockSave = async () => {
    if (!selectedCountry) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(
        `${API_BASE_URL}/admin/countries/${selectedCountry.id}/locking`,
        lockSettings,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Locking settings updated successfully');
      setLockModalOpen(false);
      fetchCountries();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update locking settings');
    }
  };

  const renderImage = (path?: string, alt?: string) => {
    if (!path) {
      return <span className="text-gray-500">-</span>;
    }
    return (
      <img
        src={getUploadUrl(path)}
        alt={alt || 'asset'}
        className="h-8 w-8 rounded border border-gray-300 object-cover bg-gray-100"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-gray-600">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Country Management</h1>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">{editingId ? 'Edit Country' : 'Add New Country'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Continent *</label>
              <select value={formData.continent_id}
                onChange={(e) => setFormData({ ...formData, continent_id: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required>
                <option value="">Select Continent</option>
                {continents.map(continent => (
                  <option key={continent.id} value={continent.id}>{continent.continent}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country Name *</label>
              <input type="text" value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter country name" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country Code</label>
              <input type="text" value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Country code (e.g., US, IN)" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency Code</label>
                <input type="text" value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Currency code (e.g., USD, INR)" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency Name</label>
                <input type="text" value={formData.currency_name}
                  onChange={(e) => setFormData({ ...formData, currency_name: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Currency name (e.g., US Dollar)" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Flag Image</label>
                <input
                  ref={flagInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFlagFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-primary-600 file:px-4 file:py-2 file:text-white file:hover:bg-primary-700 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {!flagFile && formData.country_flag && (
                  <a href={getUploadUrl(formData.country_flag)} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-block">
                    View current flag
                  </a>
                )}
            </div>
            {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency Icon</label>
                <input
                  ref={currencyIconInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCurrencyIconFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-primary-600 file:px-4 file:py-2 file:text-white file:hover:bg-primary-700 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {!currencyIconFile && formData.currency_icon && (
                  <a href={getUploadUrl(formData.currency_icon)} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-block">
                    View current icon
                  </a>
                )}
            </div> */}

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency Icon</label>
                <input
                  type="text"
                  value={formData.currency_icon}
                  onChange={(e) => setFormData({ ...formData, currency_icon: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Code</label>
                <input type="text" value={formData.phone_code}
                  onChange={(e) => setFormData({ ...formData, phone_code: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Phone code (e.g., +1, +91)" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
                <input type="text" value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Nationality (e.g., American, Indian)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                <input type="number" value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Display order" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>
            </div>
          <div className="flex gap-3">
            <button type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                <Save size={18} />
                {editingId ? 'Update' : 'Create'}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancel}
                  className="flex items-center gap-2 px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                <X size={18} />
                Cancel
              </button>
            )}
          </div>
        </form>
      </motion.div>

      <motion.div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Country List</h2>
          <div className="flex gap-3">
            <select value={filterContinentId}
              onChange={(e) => setFilterContinentId(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              <option value="">All Continents</option>
              {continents.map(c => <option key={c.id} value={c.id}>{c.continent}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">#</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Continent</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Country</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Code</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Flag</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Currency Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Currency</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Currency Icon</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Phone Code</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Nationality</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Order</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {countries
                .filter(country => !filterContinentId || country.continent_id === parseInt(filterContinentId))
                .map((country, index) => (
                <tr key={country.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{index + 1}</td>
                  <td className="py-3 px-4 text-gray-600">{country.continent?.continent || '-'}</td>
                  <td className="py-3 px-4 text-gray-900 font-medium">{country.country}</td>
                  <td className="py-3 px-4 text-gray-600">{country.code || '-'}</td>
                  <td className="py-3 px-4 text-center">{renderImage(country.country_flag, `${country.country} flag`)}</td>
                  <td className="py-3 px-4 text-gray-900">{country.currency_name || '-'}</td>
                  <td className="py-3 px-4 text-gray-900">{country.currency || '-'}</td>
                  {/* <td className="py-3 px-4 text-center">{renderImage(country.currency_icon, `${country.currency} icon`)}</td> */}
                  <td className="py-3 px-4 text-center">{country.currency_icon}</td>
                  <td className="py-3 px-4 text-center">{country.phone_code || '-'}</td>
                  <td className="py-3 px-4 text-gray-900">{country.nationality || '-'}</td>
                  <td className="py-3 px-4 text-center text-gray-900">{country.order}</td>
                  <td className="py-3 px-4 text-center">
                    <button onClick={() => handleStatusToggle(country.id, country.status)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        country.status === 1
                          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                          : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                      }`}>
                      {country.status === 1 ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleLockClick(country)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Lock Settings">
                        <Lock size={18} />
                      </button>
                      <button onClick={() => handleEdit(country)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                        <Edit2 size={18} />
                      </button>
                      {/* <button onClick={() => handleDelete(country.id)}
                        className="p-2 text-red-400 hover:bg-gray-700 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button> */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {countries.length === 0 && (
            <div className="text-center py-8 text-gray-500">No countries found</div>
          )}
        </div>
      </motion.div>

      {/* Lock Settings Modal */}
      <AnimatePresence>
        {lockModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setLockModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Lock Settings - {selectedCountry?.country}</h3>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lockSettings.lockStates}
                    onChange={(e) => setLockSettings({ ...lockSettings, lockStates: e.target.checked })}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-gray-700">Lock State Creation</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lockSettings.lockDistricts}
                    onChange={(e) => setLockSettings({ ...lockSettings, lockDistricts: e.target.checked })}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-gray-700">Lock District Creation</span>
                </label>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleLockSave}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setLockModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

