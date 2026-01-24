import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { API_BASE_URL } from '../../../../config/api.config';

interface Continent { id: number; continent: string; code: string; }
interface Country { id: number; country: string; code: string; continent_id: number; continent?: Continent; locking_json?: { lockStates?: boolean; lockDistricts?: boolean } | null; }
interface State {
  id: number;
  country_id: number;
  state: string;
  code?: string;
  order: number;
  status: number;
  country?: Country;
}

export const StateList: React.FC = () => {
  const [states, setStates] = useState<State[]>([]);
  const [continents, setContinents] = useState<Continent[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    continent_id: '', country_id: '', state: '', code: '', order: 0, status: 1
  });
  const [filterContinentId, setFilterContinentId] = useState<string>('');
  const [filterCountryId, setFilterCountryId] = useState<string>('');
  const [filterCountries, setFilterCountries] = useState<Country[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchContinents();
    fetchCountries();
    fetchStates();
  }, []);

  useEffect(() => {
    if (formData.continent_id) {
      setFilteredCountries(countries.filter(c => c.continent_id === parseInt(formData.continent_id)));
    } else {
      setFilteredCountries([]);
    }
  }, [formData.continent_id, countries]);

  useEffect(() => {
    if (filterContinentId) {
      setFilterCountries(countries.filter(c => c.continent_id === parseInt(filterContinentId)));
    } else {
      setFilterCountries(countries);
    }
  }, [filterContinentId, countries]);

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
      setError(err.response?.data?.message || 'Failed to fetch states');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.state.trim() || !formData.country_id) {
      setError('State name and country are required');
      return;
    }

    // Check if state creation is locked for this country
    const selectedCountry = countries.find(c => c.id === parseInt(formData.country_id));
    if (!editingId && selectedCountry?.locking_json?.lockStates) {
      setError('State creation is locked for this country');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const payload = {
        country_id: parseInt(formData.country_id),
        state: formData.state,
        code: formData.code,
        order: formData.order,
        status: formData.status
      };

      if (editingId) {
        await axios.put(`${API_BASE_URL}/admin/states/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('State updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/admin/states`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('State created successfully');
      }
      setFormData({ continent_id: '', country_id: '', name: '', code: '', order: 0, status: 1 });
      setEditingId(null);
      fetchStates();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (state: State) => {
    // Get continent_id from the country's continent
    const continentId = state.country?.continent_id?.toString() || '';
    setFormData({
      continent_id: continentId,
      country_id: state.country_id.toString(),
      state: state.state,
      code: state.code || '',
      order: state.order,
      status: state.status
    });
    setEditingId(state.id);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this state?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/admin/states/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('State deleted successfully');
      fetchStates();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleStatusToggle = async (id: number, currentStatus: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const state = states.find(s => s.id === id);
      if (!state) return;

      await axios.put(`${API_BASE_URL}/admin/states/${id}`,
        { ...state, status: currentStatus === 1 ? 0 : 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchStates();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleCancel = () => {
    setFormData({ continent_id: '', country_id: '', state: '', code: '', order: 0, status: 1 });
    setEditingId(null);
    setError('');
    setSuccess('');
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">State Management</h1>

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
        <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit State' : 'Add New State'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Continent *</label>
              <select value={formData.continent_id}
                onChange={(e) => setFormData({ ...formData, continent_id: e.target.value, country_id: '' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" required>
                <option value="">Select Continent</option>
                {continents.map(c => <option key={c.id} value={c.id}>{c.continent}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
              <select value={formData.country_id}
                onChange={(e) => setFormData({ ...formData, country_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" required
                disabled={!formData.continent_id}>
                <option value="">Select Country</option>
                {filteredCountries.map(c => <option key={c.id} value={c.id}>{c.country}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State Name *</label>
              <input type="text" value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter state name" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State Code</label>
              <input type="text" value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="State code" />
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
          <h2 className="text-lg font-semibold">State List</h2>
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
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Continent</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Country</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">State Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Code</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Order</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {states
                .filter(state => {
                  if (filterCountryId) return state.country_id === parseInt(filterCountryId);
                  if (filterContinentId) return state.country?.continent_id === parseInt(filterContinentId);
                  return true;
                })
                .map((state) => (
                <tr key={state.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{state.id}</td>
                  <td className="py-3 px-4 text-gray-600">{state.country?.continent?.continent || '-'}</td>
                  <td className="py-3 px-4 text-gray-600">{state.country?.country || '-'}</td>
                  <td className="py-3 px-4 text-gray-900">{state.state}</td>
                  <td className="py-3 px-4 text-gray-600">{state.code || '-'}</td>
                  <td className="py-3 px-4 text-center text-gray-600">{state.order}</td>
                  <td className="py-3 px-4 text-center">
                    <button onClick={() => handleStatusToggle(state.id, state.status)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        state.status === 1 ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}>
                      {state.status === 1 ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(state)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit2 size={18} />
                      </button>
                      {/* <button onClick={() => handleDelete(state.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 size={18} />
                      </button> */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {states.length === 0 && <div className="text-center py-8 text-gray-500">No states found</div>}
        </div>
      </motion.div>
    </div>
  );
};

