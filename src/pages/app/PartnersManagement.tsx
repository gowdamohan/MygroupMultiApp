import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';
import { Eye, LogIn, X, ToggleLeft, ToggleRight } from 'lucide-react';

interface FormFieldInfo {
  raw: string | number;
  resolved: string | number;
  label: string;
  fieldType: string;
  mapping: string | null;
  options: string[] | null;
  order: number;
}

interface FormField {
  id: string;
  label: string;
  field_type: string;
  placeholder: string;
  required: boolean;
  enabled: boolean;
  order: number;
  mapping?: string;
  options?: string[];
}

interface Partner {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  identification_code: string;
  active: number;
  created_on: number;
  client_registration?: {
    id: number;
    status: string;
    custom_form_data: Record<string, any>;
    resolved_form_data?: Record<string, FormFieldInfo>;
  };
}

interface TableHeader {
  id: string;
  label: string;
  order: number;
}

interface EditFormData {
  email: string;
  custom_form_data: Record<string, any>;
}

interface PartnersManagementProps {
  appId: string | undefined;
  appName: string | undefined;
}

export const PartnersManagement: React.FC<PartnersManagementProps> = ({ appId, appName }) => {
  const [activeAppTab, setActiveAppTab] = useState<'MyMedia' | 'MyGod'>('MyMedia');
  const [activeStatusTab, setActiveStatusTab] = useState<'pending' | 'active' | 'inactive'>('pending');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tableHeaders, setTableHeaders] = useState<TableHeader[]>([]);
  const [formDefinition, setFormDefinition] = useState<FormField[] | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({ email: '', custom_form_data: {} });
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  useEffect(() => {
    if (appId) {
      fetchPartners();
    }
  }, [appId, activeStatusTab]);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/apps/${appId}/partners`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const allPartners: Partner[] = response.data.data || [];

        // Store form definition if available
        if (response.data.form_definition?.fields) {
          setFormDefinition(response.data.form_definition.fields);
        }

        // Extract headers from resolved_form_data (which includes labels)
        const headersMap = new Map<string, TableHeader>();
        allPartners.forEach((partner: Partner) => {
          const resolvedData = partner.client_registration?.resolved_form_data;
          if (resolvedData) {
            Object.entries(resolvedData).forEach(([key, fieldInfo]) => {
              if (!headersMap.has(key)) {
                headersMap.set(key, {
                  id: key,
                  label: fieldInfo.label,
                  order: fieldInfo.order
                });
              }
            });
          }
        });

        // Sort headers by order
        const sortedHeaders = Array.from(headersMap.values()).sort((a, b) => a.order - b.order);
        setTableHeaders(sortedHeaders);

        // Filter by status
        const filtered = allPartners.filter(p =>
          p.client_registration?.status === activeStatusTab
        );
        setPartners(filtered);
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
    setEditFormData({
      email: partner.email,
      custom_form_data: { ...(partner.client_registration?.custom_form_data || {}) }
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEditFormChange = (key: string, value: string) => {
    if (key === 'email') {
      setEditFormData(prev => ({ ...prev, email: value }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        custom_form_data: { ...prev.custom_form_data, [key]: value }
      }));
    }
  };

  const handleSavePartner = async () => {
    if (!selectedPartner || !appId) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.put(
        `${API_BASE_URL}/admin/apps/${appId}/partners/${selectedPartner.id}`,
        {
          email: editFormData.email,
          custom_form_data: editFormData.custom_form_data
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Update partners list with new data
        setPartners(prev => prev.map(p =>
          p.id === selectedPartner.id ? response.data.data : p
        ));
        setSelectedPartner(response.data.data);
        setSuccess('Partner details updated successfully');
        setIsEditing(false);

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update partner details');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (selectedPartner) {
      setEditFormData({
        email: selectedPartner.email,
        custom_form_data: { ...(selectedPartner.client_registration?.custom_form_data || {}) }
      });
    }
    setIsEditing(false);
  };

  const handleAccessPartnerPortal = async (partner: Partner) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_BASE_URL}/admin/partner-portal-access`,
        { partner_id: partner.id, app_id: appId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success && response.data.data.accessToken) {
        // Store partner's token temporarily
        localStorage.setItem('partnerAccessToken', response.data.data.accessToken);
        localStorage.setItem('partnerUser', JSON.stringify(response.data.data.user));

        // Open partner portal in new tab
        window.open('/dashboard/partner', '_blank');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to access partner portal');
    }
  };



  const getResolvedFormValue = (partner: Partner, fieldId: string) => {
    const resolvedData = partner.client_registration?.resolved_form_data;
    if (!resolvedData || !resolvedData[fieldId]) return '-';
    const value = resolvedData[fieldId].resolved;
    return value !== undefined && value !== null && value !== '' ? String(value) : '-';
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Partners Management</h1>
      </div>

      {/* Error/Success Messages */}
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

      {/* Partners View */}
      <div className="space-y-4">
          {/* App Tabs */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveAppTab('MyMedia')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeAppTab === 'MyMedia'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              MyMedia
            </button>
            <button
              onClick={() => setActiveAppTab('MyGod')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeAppTab === 'MyGod'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              MyGod
            </button>
          </div>

          {/* Status Tabs */}
          <div className="flex gap-2 bg-gray-50 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveStatusTab('pending')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeStatusTab === 'pending'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveStatusTab('active')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeStatusTab === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setActiveStatusTab('inactive')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeStatusTab === 'inactive'
                  ? 'bg-red-100 text-red-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Inactive
            </button>
          </div>

          {/* Partners Table */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partner ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      {tableHeaders.map(header => (
                        <th key={header.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {header.label}
                        </th>
                      ))}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {partners.length === 0 ? (
                      <tr>
                        <td colSpan={tableHeaders.length + 5} className="px-6 py-12 text-center text-gray-500">
                          No {activeStatusTab} partners found
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
                          {tableHeaders.map(header => (
                            <td key={`${partner.id}-${header.id}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {getResolvedFormValue(partner, header.id)}
                            </td>
                          ))}
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
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleViewDetails(partner)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                              >
                                <Eye size={16} />
                                Edit
                              </button>
                              <button
                                onClick={() => handleAccessPartnerPortal(partner)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm"
                              >
                                <LogIn size={16} />
                                Access Portal
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      {/* Edit Partner Modal */}
      {showModal && selectedPartner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {isEditing ? 'Edit Partner' : 'Partner Details'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setIsEditing(false); setError(''); setSuccess(''); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Success/Error Messages */}
            {success && (
              <div className="mx-6 mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                {success}
              </div>
            )}
            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {/* Read-only fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Partner ID</label>
                    <p className="text-gray-900">{selectedPartner.identification_code || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created At</label>
                    <p className="text-gray-900">{formatDate(selectedPartner.created_on)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className={selectedPartner.active === 1 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {selectedPartner.active === 1 ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>

                <hr className="my-4" />

                {/* Editable Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => handleEditFormChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{selectedPartner.email}</p>
                  )}
                </div>

                {/* Editable Custom Form Fields */}
                {selectedPartner.client_registration?.resolved_form_data && Object.keys(selectedPartner.client_registration.resolved_form_data).length > 0 && (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-3">Partner Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(selectedPartner.client_registration.resolved_form_data)
                        .sort(([, a], [, b]) => (a.order || 0) - (b.order || 0))
                        .map(([fieldId, fieldInfo]) => (
                        <div key={fieldId}>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            {fieldInfo.label}
                          </label>
                          {isEditing ? (
                            fieldInfo.options && fieldInfo.options.length > 0 ? (
                              <select
                                value={String(editFormData.custom_form_data[fieldId] || '')}
                                onChange={(e) => handleEditFormChange(fieldId, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">Select {fieldInfo.label}</option>
                                {fieldInfo.options.map((option: string) => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            ) : fieldInfo.mapping ? (
                              <p className="text-gray-500 py-2 italic">
                                {String(fieldInfo.resolved || '-')} (mapped field - not editable)
                              </p>
                            ) : (
                              <input
                                type="text"
                                value={String(editFormData.custom_form_data[fieldId] || '')}
                                onChange={(e) => handleEditFormChange(fieldId, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            )
                          ) : (
                            <p className="text-gray-900 py-2">{String(fieldInfo.resolved) || '-'}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePartner}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setShowModal(false); setError(''); setSuccess(''); }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit Partner
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

