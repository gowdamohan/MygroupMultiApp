import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import {
  Users,
  LogOut,
  Menu,
  X,
  Eye,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5002/api/v1';

interface AppInfo {
  id: number;
  name: string;
  logo?: string;
}

interface Partner {
  id: number;
  identification_code: string;
  email: string;
  active: number;
  created_on: number;
  client_registration?: {
    id: number;
    status: string;
    custom_form_data: Record<string, any>;
  };
}

export const AppDashboard: React.FC = () => {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'partners'>('partners');

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Fetch app info
    fetchAppInfo();
  }, [appId]);

  const fetchAppInfo = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/apps/${appId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setAppInfo(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching app info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  const menuItems = [
    { icon: Users, label: 'Partners', path: `/app/${appId}/dashboard`, view: 'partners' as const },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg transition-all duration-300 flex flex-col`}>
        {/* App Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center gap-3">
                {appInfo?.logo ? (
                  <img src={appInfo.logo} alt={appInfo.name} className="w-10 h-10 object-contain" />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                    {appInfo?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="font-bold text-gray-900">{appInfo?.name || 'App'}</h2>
                  <p className="text-xs text-gray-500">Admin Panel</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => setActiveView(item.view)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeView === item.view
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-200">
          {sidebarOpen && user && (
            <div className="mb-3 px-2">
              <p className="text-sm font-medium text-gray-900">{user.username}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {activeView === 'partners' && (
            <PartnersView appId={appId} appName={appInfo?.name} />
          )}
        </div>
      </main>
    </div>
  );
};

// Partners View Component
interface PartnersViewProps {
  appId: string | undefined;
  appName: string | undefined;
}

const PartnersView: React.FC<PartnersViewProps> = ({ appId, appName }) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  useEffect(() => {
    fetchPartners();
  }, [appId]);

  const fetchPartners = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/apps/${appId}/partners`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPartners(response.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch partners');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (partner: Partner) => {
    setUpdatingStatus(partner.id);
    try {
      const token = localStorage.getItem('accessToken');
      const newStatus = partner.active === 1 ? 0 : 1;

      await axios.patch(`${API_BASE_URL}/admin/apps/${appId}/partners/${partner.id}/status`, {
        active: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      setPartners(prev => prev.map(p =>
        p.id === partner.id ? { ...p, active: newStatus } : p
      ));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleViewDetails = (partner: Partner) => {
    setSelectedPartner(partner);
    setShowModal(true);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getNameFromCustomData = (data: Record<string, any> | undefined) => {
    if (!data) return '-';
    // Look for name fields in custom form data
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('name') && !lowerKey.includes('last') && value) {
        return String(value);
      }
    }
    // Also check for common field patterns
    return data.name || data.first_name || data.Name || data.full_name || '-';
  };

  const getMobileFromCustomData = (data: Record<string, any> | undefined) => {
    if (!data) return '-';
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if ((lowerKey.includes('mobile') || lowerKey.includes('phone')) && value) {
        return String(value);
      }
    }
    return data.mobile || data.phone || data.Mobile || data.Phone || '-';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Partners - {appName}</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partner ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {partners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No partners found
                  </td>
                </tr>
              ) : (
                partners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(partner.created_on)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {partner.identification_code || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {partner.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getNameFromCustomData(partner.client_registration?.custom_form_data)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getMobileFromCustomData(partner.client_registration?.custom_form_data)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetails(partner)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(partner)}
                        disabled={updatingStatus === partner.id}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg transition-colors text-sm ${
                          partner.active === 1
                            ? 'bg-green-50 text-green-600 hover:bg-green-100'
                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                      >
                        {updatingStatus === partner.id ? (
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : partner.active === 1 ? (
                          <ToggleRight size={16} />
                        ) : (
                          <ToggleLeft size={16} />
                        )}
                        {partner.active === 1 ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showModal && selectedPartner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Partner Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Partner ID</label>
                    <p className="text-gray-900">{selectedPartner.identification_code || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{selectedPartner.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created At</label>
                    <p className="text-gray-900">{formatDate(selectedPartner.created_on)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className={selectedPartner.active === 1 ? 'text-green-600' : 'text-red-600'}>
                      {selectedPartner.active === 1 ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>

                {selectedPartner.client_registration?.custom_form_data && (
                  <>
                    <hr className="my-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Custom Form Data</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(selectedPartner.client_registration.custom_form_data).map(([key, value]) => (
                        <div key={key}>
                          <label className="text-sm font-medium text-gray-500 capitalize">
                            {key.replace(/_/g, ' ').replace(/field_\d+/g, '')}
                          </label>
                          <p className="text-gray-900">{String(value) || '-'}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

