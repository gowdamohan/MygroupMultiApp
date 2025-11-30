import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api/v1';

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
  currency?: string;
  phone_code?: string;
  nationality?: string;
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
      const payload = {
        ...formData,
        continent_id: parseInt(formData.continent_id)
      };

      if (editingId) {
        await axios.put(`${API_BASE_URL}/admin/countries/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Country updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/admin/countries`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Country created successfully');
      }
      setFormData({
        continent_id: '',
        country: '',
        code: '',
        country_flag: '',
        currency: '',
        phone_code: '',
        nationality: '',
        order: 0,
        status: 1
      });
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
      currency: country.currency || '',
      phone_code: country.phone_code || '',
      nationality: country.nationality || '',
      order: country.order,
      status: country.status
    });
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
    setFormData({ continent_id: '', country: '', code: '', country_flag: '', currency: '', phone_code: '', nationality: '', order: 0, status: 1 });
    setEditingId(null);
    setError('');
    setSuccess('');
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
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
        <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit Country' : 'Add New Country'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Continent *</label>
              <select value={formData.continent_id}
                onChange={(e) => setFormData({ ...formData, continent_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter country name" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country Code</label>
              <input type="text" value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Country code (e.g., US, IN)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Flag URL</label>
              <input type="text" value={formData.country_flag}
                onChange={(e) => setFormData({ ...formData, country_flag: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Flag image URL" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <input type="text" value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Currency (e.g., USD, INR)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Code</label>
              <input type="text" value={formData.phone_code}
                onChange={(e) => setFormData({ ...formData, phone_code: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Phone code (e.g., +1, +91)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
              <input type="text" value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nationality (e.g., American, Indian)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
              <input type="number" value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Display order" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Save size={18} />
              {editingId ? 'Update' : 'Create'}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancel}
                className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                <X size={18} />
                Cancel
              </button>
            )}
          </div>
        </form>
      </motion.div>

      <motion.div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Country List</h2>
          <div className="flex gap-3">
            <select value={filterContinentId}
              onChange={(e) => setFilterContinentId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">All Continents</option>
              {continents.map(c => <option key={c.id} value={c.id}>{c.continent}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Continent</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Country Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Code</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Order</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {countries
                .filter(country => !filterContinentId || country.continent_id === parseInt(filterContinentId))
                .map((country) => (
                <tr key={country.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{country.id}</td>
                  <td className="py-3 px-4 text-gray-600">{country.continent?.continent || '-'}</td>
                  <td className="py-3 px-4 text-gray-900">{country.country}</td>
                  <td className="py-3 px-4 text-gray-600">{country.code || '-'}</td>
                  <td className="py-3 px-4 text-center text-gray-600">{country.order}</td>
                  <td className="py-3 px-4 text-center">
                    <button onClick={() => handleStatusToggle(country.id, country.status)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        country.status === 1
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}>
                      {country.status === 1 ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(country)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(country.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
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
    </div>
  );
};

