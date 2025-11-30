import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { StatsCard } from '../../components/StatsCard';
import { UsersCRUD } from '../../components/dashboard/UsersCRUD';
import { GroupsCRUD } from '../../components/dashboard/GroupsCRUD';
import { Users, Grid3x3, DollarSign, UserPlus, Search, Bell, Menu, X, LayoutDashboard, Package, Languages, GraduationCap, Briefcase, Plus, Edit2, Trash2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api/v1';

// Mock Data
const statsData = [
  { title: 'Total Users', value: '12,483', icon: Users, change: 12.5, color: 'from-blue-500 to-blue-600' },
  { title: 'Active Groups', value: '23', icon: Grid3x3, change: 0, color: 'from-purple-500 to-purple-600' },
  { title: 'Revenue', value: '$48,652', icon: DollarSign, change: 23.8, color: 'from-green-500 to-green-600' },
  { title: 'New Registrations', value: '342', icon: UserPlus, change: -5.2, color: 'from-orange-500 to-orange-600' }
];

const userGrowthData = [
  { month: 'Jan', users: 4000 },
  { month: 'Feb', users: 5200 },
  { month: 'Mar', users: 6100 },
  { month: 'Apr', users: 7500 },
  { month: 'May', users: 9200 },
  { month: 'Jun', users: 12483 }
];

const groupActivityData = [
  { name: 'Corporate', value: 3200 },
  { name: 'Franchise', value: 2800 },
  { name: 'Services', value: 2400 },
  { name: 'Media', value: 1900 },
  { name: 'Education', value: 1200 },
  { name: 'Others', value: 983 }
];

const userDistributionData = [
  { name: 'Admin', value: 45, color: '#3b82f6' },
  { name: 'Client', value: 6200, color: '#8b5cf6' },
  { name: 'Corporate', value: 1800, color: '#10b981' },
  { name: 'Labor', value: 3200, color: '#f59e0b' },
  { name: 'Partner', value: 800, color: '#ef4444' },
  { name: 'Reporter', value: 438, color: '#06b6d4' }
];

const recentActivities = [
  { user: 'John Doe', action: 'Registered', group: 'Corporate Hub', time: '5 min ago', avatar: 'JD' },
  { user: 'Jane Smith', action: 'Updated Profile', group: 'Franchise Manager', time: '12 min ago', avatar: 'JS' },
  { user: 'Mike Johnson', action: 'Logged In', group: 'Service Provider', time: '23 min ago', avatar: 'MJ' },
  { user: 'Sarah Williams', action: 'Uploaded Media', group: 'News Portal', time: '1 hour ago', avatar: 'SW' },
  { user: 'Tom Brown', action: 'Created Event', group: 'Events', time: '2 hours ago', avatar: 'TB' }
];

export const AdminDashboard: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'groups' | 'language' | 'education' | 'profession'>('overview');

  // Language Management State
  const [languages, setLanguages] = useState<any[]>([]);
  const [languageForm, setLanguageForm] = useState({ lang_1: '', lang_2: '' });
  const [editingLanguageId, setEditingLanguageId] = useState<number | null>(null);
  const [languageLoading, setLanguageLoading] = useState(false);
  const [languageError, setLanguageError] = useState('');
  const [languageSuccess, setLanguageSuccess] = useState('');

  // Education Management State
  const [education, setEducation] = useState<any[]>([]);
  const [educationForm, setEducationForm] = useState({ education_name: '' });
  const [editingEducationId, setEditingEducationId] = useState<number | null>(null);
  const [educationLoading, setEducationLoading] = useState(false);
  const [educationError, setEducationError] = useState('');
  const [educationSuccess, setEducationSuccess] = useState('');

  // Profession Management State
  const [professions, setProfessions] = useState<any[]>([]);
  const [professionForm, setProfessionForm] = useState({ profession_name: '' });
  const [editingProfessionId, setEditingProfessionId] = useState<number | null>(null);
  const [professionLoading, setProfessionLoading] = useState(false);
  const [professionError, setProfessionError] = useState('');
  const [professionSuccess, setProfessionSuccess] = useState('');

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'groups' as const, label: 'Groups', icon: Package },
    { id: 'language' as const, label: 'Language', icon: Languages },
    { id: 'education' as const, label: 'Education', icon: GraduationCap },
    { id: 'profession' as const, label: 'Profession', icon: Briefcase }
  ];

  // Fetch Languages
  useEffect(() => {
    if (activeTab === 'language') {
      fetchLanguages();
    }
  }, [activeTab]);

  // Fetch Education
  useEffect(() => {
    if (activeTab === 'education') {
      fetchEducation();
    }
  }, [activeTab]);

  // Fetch Professions
  useEffect(() => {
    if (activeTab === 'profession') {
      fetchProfessions();
    }
  }, [activeTab]);

  const fetchLanguages = async () => {
    try {
      setLanguageLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/languages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLanguages(response.data.data);
    } catch (err: any) {
      setLanguageError(err.response?.data?.message || 'Failed to fetch languages');
    } finally {
      setLanguageLoading(false);
    }
  };

  const fetchEducation = async () => {
    try {
      setEducationLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/education`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEducation(response.data.data);
    } catch (err: any) {
      setEducationError(err.response?.data?.message || 'Failed to fetch education');
    } finally {
      setEducationLoading(false);
    }
  };

  const fetchProfessions = async () => {
    try {
      setProfessionLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/professions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfessions(response.data.data);
    } catch (err: any) {
      setProfessionError(err.response?.data?.message || 'Failed to fetch professions');
    } finally {
      setProfessionLoading(false);
    }
  };

  // Language CRUD Operations
  const handleLanguageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLanguageError('');
    setLanguageSuccess('');

    try {
      const token = localStorage.getItem('accessToken');

      if (editingLanguageId) {
        await axios.put(`${API_BASE_URL}/admin/languages/${editingLanguageId}`, languageForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLanguageSuccess('Language updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/admin/languages`, languageForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLanguageSuccess('Language created successfully');
      }

      setLanguageForm({ lang_1: '', lang_2: '' });
      setEditingLanguageId(null);
      fetchLanguages();
    } catch (err: any) {
      setLanguageError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleLanguageEdit = (language: any) => {
    setLanguageForm({ lang_1: language.lang_1, lang_2: language.lang_2 || '' });
    setEditingLanguageId(language.id);
    setLanguageError('');
    setLanguageSuccess('');
  };

  const handleLanguageDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this language?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/admin/languages/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLanguageSuccess('Language deleted successfully');
      fetchLanguages();
    } catch (err: any) {
      setLanguageError(err.response?.data?.message || 'Failed to delete language');
    }
  };

  // Education CRUD Operations
  const handleEducationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEducationError('');
    setEducationSuccess('');

    try {
      const token = localStorage.getItem('accessToken');

      if (editingEducationId) {
        await axios.put(`${API_BASE_URL}/admin/education/${editingEducationId}`, educationForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEducationSuccess('Education updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/admin/education`, educationForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEducationSuccess('Education created successfully');
      }

      setEducationForm({ education_name: '' });
      setEditingEducationId(null);
      fetchEducation();
    } catch (err: any) {
      setEducationError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEducationEdit = (edu: any) => {
    setEducationForm({ education_name: edu.education_name });
    setEditingEducationId(edu.id);
    setEducationError('');
    setEducationSuccess('');
  };

  const handleEducationDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this education?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/admin/education/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEducationSuccess('Education deleted successfully');
      fetchEducation();
    } catch (err: any) {
      setEducationError(err.response?.data?.message || 'Failed to delete education');
    }
  };

  // Profession CRUD Operations
  const handleProfessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfessionError('');
    setProfessionSuccess('');

    try {
      const token = localStorage.getItem('accessToken');

      if (editingProfessionId) {
        await axios.put(`${API_BASE_URL}/admin/professions/${editingProfessionId}`, professionForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfessionSuccess('Profession updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/admin/professions`, professionForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfessionSuccess('Profession created successfully');
      }

      setProfessionForm({ profession_name: '' });
      setEditingProfessionId(null);
      fetchProfessions();
    } catch (err: any) {
      setProfessionError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleProfessionEdit = (prof: any) => {
    setProfessionForm({ profession_name: prof.profession_name });
    setEditingProfessionId(prof.id);
    setProfessionError('');
    setProfessionSuccess('');
  };

  const handleProfessionDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this profession?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/admin/professions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfessionSuccess('Profession deleted successfully');
      fetchProfessions();
    } catch (err: any) {
      setProfessionError(err.response?.data?.message || 'Failed to delete profession');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              className="fixed left-0 top-0 bottom-0 z-50 lg:hidden"
            >
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 overflow-auto flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="px-6 lg:px-8 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {mobileSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <div>
                  <h2 className="text-gray-900">Dashboard</h2>
                  <p className="text-sm text-gray-600 mt-1">Welcome back, Admin</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="hidden md:flex relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64 transition-all"
                  />
                </div>

                {/* Notifications */}
                <button className="relative p-2.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <Bell size={22} className="text-gray-600" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-error-500 rounded-full" />
                </button>

                {/* User Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white shadow-md">
                  A
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 lg:p-8">
          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <div className="flex gap-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statsData.map((stat, index) => (
                  <StatsCard key={stat.title} {...stat} delay={index * 0.1} />
                ))}
              </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* User Growth Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
            >
              <h4 className="text-gray-900 mb-6">User Growth</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Group Activity Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
            >
              <h4 className="text-gray-900 mb-6">Group Activity</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={groupActivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Distribution Pie Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
            >
              <h4 className="text-gray-900 mb-6">User Distribution</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={userDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {userDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg"
            >
              <h4 className="text-gray-900 mb-6">Recent Activity</h4>
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white flex-shrink-0 text-sm shadow-md">
                      {activity.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">
                        <span className="font-medium">{activity.user}</span>
                        <span className="text-gray-600"> {activity.action}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{activity.group}</p>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">{activity.time}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
            </>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <UsersCRUD />
            </motion.div>
          )}

          {/* Groups Tab */}
          {activeTab === 'groups' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <GroupsCRUD />
            </motion.div>
          )}

          {/* Language Tab */}
          {activeTab === 'language' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Language Management</h3>

                {/* Alert Messages */}
                {languageError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {languageError}
                  </div>
                )}
                {languageSuccess && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                    {languageSuccess}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleLanguageSubmit} className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Primary Language <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={languageForm.lang_1}
                        onChange={(e) => setLanguageForm({ ...languageForm, lang_1: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="e.g., English"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Secondary Language
                      </label>
                      <input
                        type="text"
                        value={languageForm.lang_2}
                        onChange={(e) => setLanguageForm({ ...languageForm, lang_2: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="e.g., Spanish (optional)"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      {editingLanguageId ? <Save size={18} /> : <Plus size={18} />}
                      {editingLanguageId ? 'Update Language' : 'Add Language'}
                    </button>
                    {editingLanguageId && (
                      <button
                        type="button"
                        onClick={() => {
                          setLanguageForm({ lang_1: '', lang_2: '' });
                          setEditingLanguageId(null);
                          setLanguageError('');
                          setLanguageSuccess('');
                        }}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Primary Language</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Secondary Language</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {languageLoading ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                        </tr>
                      ) : languages.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No languages found</td>
                        </tr>
                      ) : (
                        languages.map((lang) => (
                          <tr key={lang.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{lang.id}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{lang.lang_1}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{lang.lang_2 || '-'}</td>
                            <td className="px-6 py-4 text-right text-sm">
                              <button
                                onClick={() => handleLanguageEdit(lang)}
                                className="text-primary-600 hover:text-primary-900 mr-4"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleLanguageDelete(lang.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Education Tab */}
          {activeTab === 'education' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Education Management</h3>

                {educationError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {educationError}
                  </div>
                )}
                {educationSuccess && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                    {educationSuccess}
                  </div>
                )}

                <form onSubmit={handleEducationSubmit} className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Education Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={educationForm.education_name}
                        onChange={(e) => setEducationForm({ education_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="e.g., Bachelor's Degree"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      {editingEducationId ? <Save size={18} /> : <Plus size={18} />}
                      {editingEducationId ? 'Update Education' : 'Add Education'}
                    </button>
                    {editingEducationId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEducationForm({ education_name: '' });
                          setEditingEducationId(null);
                          setEducationError('');
                          setEducationSuccess('');
                        }}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Education Name</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {educationLoading ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                        </tr>
                      ) : education.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-gray-500">No education found</td>
                        </tr>
                      ) : (
                        education.map((edu) => (
                          <tr key={edu.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{edu.id}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{edu.education_name}</td>
                            <td className="px-6 py-4 text-right text-sm">
                              <button
                                onClick={() => handleEducationEdit(edu)}
                                className="text-primary-600 hover:text-primary-900 mr-4"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleEducationDelete(edu.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Profession Tab */}
          {activeTab === 'profession' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Profession Management</h3>

                {professionError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {professionError}
                  </div>
                )}
                {professionSuccess && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                    {professionSuccess}
                  </div>
                )}

                <form onSubmit={handleProfessionSubmit} className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Profession Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={professionForm.profession_name}
                        onChange={(e) => setProfessionForm({ profession_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="e.g., Software Engineer"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      {editingProfessionId ? <Save size={18} /> : <Plus size={18} />}
                      {editingProfessionId ? 'Update Profession' : 'Add Profession'}
                    </button>
                    {editingProfessionId && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfessionForm({ profession_name: '' });
                          setEditingProfessionId(null);
                          setProfessionError('');
                          setProfessionSuccess('');
                        }}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profession Name</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {professionLoading ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                        </tr>
                      ) : professions.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-gray-500">No professions found</td>
                        </tr>
                      ) : (
                        professions.map((prof) => (
                          <tr key={prof.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{prof.id}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{prof.profession_name}</td>
                            <td className="px-6 py-4 text-right text-sm">
                              <button
                                onClick={() => handleProfessionEdit(prof)}
                                className="text-primary-600 hover:text-primary-900 mr-4"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleProfessionDelete(prof.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};