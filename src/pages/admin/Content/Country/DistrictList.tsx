import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { API_BASE_URL } from '../../../../config/api.config';

interface Continent { id: number; continent: string; code: string; }
interface Country { id: number; country: string; code: string; continent_id: number; continent?: Continent; locking_json?: { lockStates?: boolean; lockDistricts?: boolean } | null; }
interface State { id: number; state: string; code: string; country_id: number; country?: Country; }
interface District {
  id: number;
  state_id: number;
  district: string;
  code?: string;
  order: number;
  status: number;
  state?: State;
}

export const DistrictList: React.FC = () => {
  const [districts, setDistricts] = useState<District[]>([]);
  const [continents, setContinents] = useState<Continent[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);
  const [filteredStates, setFilteredStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    continent_id: '', country_id: '', state_id: '', district: '', code: '', order: 0, status: 1
  });
  const [filterContinentId, setFilterContinentId] = useState<string>('');
  const [filterCountryId, setFilterCountryId] = useState<string>('');
  const [filterStateId, setFilterStateId] = useState<string>('');
  const [filterCountries, setFilterCountries] = useState<Country[]>([]);
  const [filterStates, setFilterStates] = useState<State[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchContinents();
    fetchCountries();
    fetchStates();
    fetchDistricts();
  }, []);

  useEffect(() => {
    if (formData.continent_id) {
      setFilteredCountries(countries.filter(c => c.continent_id === parseInt(formData.continent_id)));
    } else {
      setFilteredCountries([]);
    }
  }, [formData.continent_id, countries]);

  useEffect(() => {
    if (formData.country_id) {
      setFilteredStates(states.filter(s => s.country_id === parseInt(formData.country_id)));
    } else {
      setFilteredStates([]);
    }
  }, [formData.country_id, states]);

  useEffect(() => {
    if (filterContinentId) {
      setFilterCountries(countries.filter(c => c.continent_id === parseInt(filterContinentId)));
    } else {
      setFilterCountries(countries);
    }
  }, [filterContinentId, countries]);

  useEffect(() => {
    if (filterCountryId) {
      setFilterStates(states.filter(s => s.country_id === parseInt(filterCountryId)));
    } else if (filterContinentId) {
      setFilterStates(states.filter(s => s.country?.continent_id === parseInt(filterContinentId)));
    } else {
      setFilterStates(states);
    }
  }, [filterCountryId, filterContinentId, states]);

  const fetchContinents = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/continents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) setContinents(response.data.data);
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
      if (response.data.success) setCountries(response.data.data);
    } catch (err: any) {
      console.error('Error fetching countries:', err);
    }
  };

  const fetchStates = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/states`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) setStates(response.data.data);
    } catch (err: any) {
      console.error('Error fetching states:', err);
    }
  };

  const fetchDistricts = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/districts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) setDistricts(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch districts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.district.trim() || !formData.state_id) {
      setError('District name and state are required');
      return;
    }

    // Check if district creation is locked for this country
    const selectedState = states.find(s => s.id === parseInt(formData.state_id));
    const selectedCountry = countries.find(c => c.id === selectedState?.country_id);
    if (!editingId && selectedCountry?.locking_json?.lockDistricts) {
      setError('District creation is locked for this country');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const payload = {
        state_id: parseInt(formData.state_id),
        district: formData.district,
        code: formData.code,
        order: formData.order,
        status: formData.status
      };

      if (editingId) {
        await axios.put(`${API_BASE_URL}/admin/districts/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('District updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/admin/districts`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('District created successfully');
      }
      setFormData({ continent_id: '', country_id: '', state_id: '', name: '', code: '', order: 0, status: 1 });
      setEditingId(null);
      fetchDistricts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (district: District) => {
    // Get continent_id and country_id from nested relations
    const continentId = district.state?.country?.continent_id?.toString() || '';
    const countryId = district.state?.country_id?.toString() || '';
    setFormData({
      continent_id: continentId,
      country_id: countryId,
      state_id: district.state_id.toString(),
      district: district.district,
      code: district.code || '',
      order: district.order,
      status: district.status
    });
    setEditingId(district.id);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this district?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/admin/districts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('District deleted successfully');
      fetchDistricts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleStatusToggle = async (id: number, currentStatus: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const district = districts.find(d => d.id === id);
      if (!district) return;

      await axios.put(`${API_BASE_URL}/admin/districts/${id}`,
        { ...district, status: currentStatus === 1 ? 0 : 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDistricts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleCancel = () => {
    setFormData({ continent_id: '', country_id: '', state_id: '', district: '', code: '', order: 0, status: 1 });
    setEditingId(null);
    setError('');
    setSuccess('');
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">District Management</h1>

      <AnimatePresence>
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
        <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit District' : 'Add New District'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Continent *</label>
              <select value={formData.continent_id}
                onChange={(e) => setFormData({ ...formData, continent_id: e.target.value, country_id: '', state_id: '' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" required>
                <option value="">Select Continent</option>
                {continents.map(c => <option key={c.id} value={c.id}>{c.continent}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
              <select value={formData.country_id}
                onChange={(e) => setFormData({ ...formData, country_id: e.target.value, state_id: '' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" required
                disabled={!formData.continent_id}>
                <option value="">Select Country</option>
                {filteredCountries.map(c => <option key={c.id} value={c.id}>{c.country}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
              <select value={formData.state_id}
                onChange={(e) => setFormData({ ...formData, state_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" required
                disabled={!formData.country_id}>
                <option value="">Select State</option>
                {filteredStates.map(s => <option key={s.id} value={s.id}>{s.state}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">District Name *</label>
              <input type="text" value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter district name" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">District Code</label>
              <input type="text" value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="District code" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
              <input type="number" value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              <Save size={18} />{editingId ? 'Update' : 'Create'}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancel} className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                <X size={18} />Cancel
              </button>
            )}
          </div>
        </form>
      </motion.div>

      <motion.div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">District List</h2>
          <div className="flex gap-3">
            <select value={filterContinentId}
              onChange={(e) => setFilterContinentId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              <option value="">All Continents</option>
              {continents.map(c => <option key={c.id} value={c.id}>{c.continent}</option>)}
            </select>
            <select value={filterCountryId}
              onChange={(e) => setFilterCountryId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={!filterContinentId}>
              <option value="">All Countries</option>
              {filterCountries.map(c => <option key={c.id} value={c.id}>{c.country}</option>)}
            </select>
            <select value={filterStateId}
              onChange={(e) => setFilterStateId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={!filterCountryId}>
              <option value="">All States</option>
              {filterStates.map(s => <option key={s.id} value={s.id}>{s.state}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Continent</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Country</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">State</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">District Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Code</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Order</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {districts
                .filter(district => {
                  if (filterStateId) return district.state_id === parseInt(filterStateId);
                  if (filterCountryId) return district.state?.country_id === parseInt(filterCountryId);
                  if (filterContinentId) return district.state?.country?.continent_id === parseInt(filterContinentId);
                  return true;
                })
                .map((district) => (
                <tr key={district.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{district.id}</td>
                  <td className="py-3 px-4 text-gray-600">{district.state?.country?.continent?.continent || '-'}</td>
                  <td className="py-3 px-4 text-gray-600">{district.state?.country?.country || '-'}</td>
                  <td className="py-3 px-4 text-gray-600">{district.state?.state || '-'}</td>
                  <td className="py-3 px-4 text-gray-900">{district.district}</td>
                  <td className="py-3 px-4 text-gray-600">{district.code || '-'}</td>
                  <td className="py-3 px-4 text-center text-gray-600">{district.order}</td>
                  <td className="py-3 px-4 text-center">
                    <button onClick={() => handleStatusToggle(district.id, district.status)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        district.status === 1 ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}>
                      {district.status === 1 ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(district)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit2 size={18} />
                      </button>
                      {/* <button onClick={() => handleDelete(district.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 size={18} />
                      </button> */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {districts.length === 0 && <div className="text-center py-8 text-gray-500">No districts found</div>}
        </div>
      </motion.div>
    </div>
  );
};

