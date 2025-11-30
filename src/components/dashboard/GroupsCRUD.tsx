import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, X, Loader2, Package } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

interface Group {
  id: number;
  name: string;
  apps_name: string;
  db_name: string;
  details?: {
    icon: string;
    logo: string;
    background_color: string;
    banner: string;
    url: string;
  };
}

export const GroupsCRUD: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    apps_name: '',
    db_name: '',
    icon: '',
    logo: '',
    background_color: '#6366f1',
    banner: '',
    url: ''
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/groups`);
      if (response.data.success) {
        setGroups(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setModalMode('create');
    setFormData({
      name: '',
      apps_name: '',
      db_name: '',
      icon: '',
      logo: '',
      background_color: '#6366f1',
      banner: '',
      url: ''
    });
    setShowModal(true);
  };

  const handleEdit = (group: Group) => {
    setModalMode('edit');
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      apps_name: group.apps_name,
      db_name: group.db_name,
      icon: group.details?.icon || '',
      logo: group.details?.logo || '',
      background_color: group.details?.background_color || '#6366f1',
      banner: group.details?.banner || '',
      url: group.details?.url || ''
    });
    setShowModal(true);
  };

  const handleView = (group: Group) => {
    setModalMode('view');
    setSelectedGroup(group);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('accessToken');
      if (modalMode === 'create') {
        await axios.post(`${API_BASE_URL}/groups`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else if (modalMode === 'edit' && selectedGroup) {
        await axios.put(`${API_BASE_URL}/groups/${selectedGroup.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowModal(false);
      fetchGroups();
    } catch (error) {
      console.error('Error saving group:', error);
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.apps_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary-600" size={40} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Package className="text-primary-600" size={28} />
          <h2 className="text-2xl font-bold text-gray-900">Groups & Applications</h2>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span>Add Group</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map((group) => (
          <div key={group.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {group.details?.logo ? (
                  <img src={group.details.logo} alt={group.apps_name} className="w-12 h-12 rounded" />
                ) : (
                  <div className="w-12 h-12 rounded bg-primary-100 flex items-center justify-center">
                    <Package className="text-primary-600" size={24} />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">{group.apps_name || group.name}</h3>
                  <p className="text-sm text-gray-500">{group.name}</p>
                </div>
              </div>
            </div>

            {group.details?.url && (
              <p className="text-sm text-gray-600 mb-3 truncate">
                <a href={group.details.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                  {group.details.url}
                </a>
              </p>
            )}

            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => handleView(group)}
                className="flex-1 flex items-center justify-center gap-1 text-blue-600 hover:bg-blue-50 py-2 rounded transition-colors"
              >
                <Eye size={16} />
                <span className="text-sm">View</span>
              </button>
              <button
                onClick={() => handleEdit(group)}
                className="flex-1 flex items-center justify-center gap-1 text-green-600 hover:bg-green-50 py-2 rounded transition-colors"
              >
                <Edit2 size={16} />
                <span className="text-sm">Edit</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredGroups.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500">No groups found</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {modalMode === 'create' ? 'Add Group' : modalMode === 'edit' ? 'Edit Group' : 'View Group'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            {modalMode === 'view' && selectedGroup ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Group Name</label>
                  <p className="text-gray-900">{selectedGroup.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Application Name</label>
                  <p className="text-gray-900">{selectedGroup.apps_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Database Name</label>
                  <p className="text-gray-900">{selectedGroup.db_name}</p>
                </div>
                {selectedGroup.details?.logo && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Logo</label>
                    <img src={selectedGroup.details.logo} alt="Logo" className="mt-2 h-16" />
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Application Name</label>
                    <input
                      type="text"
                      value={formData.apps_name}
                      onChange={(e) => setFormData({ ...formData, apps_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Database Name</label>
                  <input
                    type="text"
                    value={formData.db_name}
                    onChange={(e) => setFormData({ ...formData, db_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                    <input
                      type="url"
                      value={formData.logo}
                      onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon URL</label>
                    <input
                      type="url"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                  <input
                    type="color"
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg transition-colors"
                  >
                    {modalMode === 'create' ? 'Create' : 'Update'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

