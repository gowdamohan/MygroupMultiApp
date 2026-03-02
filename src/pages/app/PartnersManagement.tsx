import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';
import {
  Eye, LogIn, X, ToggleLeft, ToggleRight, Users, CheckCircle, Clock,
  FileText, Download, Shield, Filter, ChevronDown
} from 'lucide-react';

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
  owner_details?: any;
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

interface AppWithForm {
  id: number;
  group_name: string;
  app_code: string;
  form_definition: any;
}

interface PartnersManagementProps {
  appId: string | undefined;
  appName: string | undefined;
}

export const PartnersManagement: React.FC<PartnersManagementProps> = ({ appId, appName }) => {
  const [appsWithForms, setAppsWithForms] = useState<AppWithForm[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [activeStatusTab, setActiveStatusTab] = useState<'pending' | 'active' | 'inactive'>('pending');
  const [allPartners, setAllPartners] = useState<Partner[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingApps, setLoadingApps] = useState(true);
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
  const [approving, setApproving] = useState(false);
  // Custom form field filters
  const [fieldFilters, setFieldFilters] = useState<Record<string, string>>({});

  // Fetch apps with custom forms
  useEffect(() => {
    fetchAppsWithForms();
  }, []);

  // Fetch partners when selected app changes
  useEffect(() => {
    if (selectedAppId) {
      fetchPartners(selectedAppId);
    }
  }, [selectedAppId]);

  // Re-filter when status tab or field filters change
  useEffect(() => {
    filterPartners();
  }, [activeStatusTab, fieldFilters, allPartners]);

  const fetchAppsWithForms = async () => {
    try {
      setLoadingApps(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/apps-with-custom-forms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const apps: AppWithForm[] = response.data.data || [];
        setAppsWithForms(apps);
        // Auto-select first app or matching appId
        if (apps.length > 0) {
          const match = appId ? apps.find(a => a.id === parseInt(appId)) : null;
          setSelectedAppId(match ? match.id : apps[0].id);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch apps');
    } finally {
      setLoadingApps(false);
    }
  };

  const fetchPartners = async (fetchAppId: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/apps/${fetchAppId}/partners`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const fetched: Partner[] = response.data.data || [];
        setAllPartners(fetched);

        // Store form definition if available
        if (response.data.form_definition?.fields) {
          setFormDefinition(response.data.form_definition.fields);
        }

        // Extract headers from resolved_form_data
        const headersMap = new Map<string, TableHeader>();
        fetched.forEach((partner: Partner) => {
          const resolvedData = partner.client_registration?.resolved_form_data;
          if (resolvedData) {
            Object.entries(resolvedData).forEach(([key, fieldInfo]) => {
              if (!headersMap.has(key)) {
                headersMap.set(key, { id: key, label: fieldInfo.label, order: fieldInfo.order });
              }
            });
          }
        });
        setTableHeaders(Array.from(headersMap.values()).sort((a, b) => a.order - b.order));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch partners');
    } finally {
      setLoading(false);
    }
  };

  const filterPartners = useCallback(() => {
    let filtered = [...allPartners];

    // Filter by status tab
    if (activeStatusTab === 'pending') {
      filtered = filtered.filter(p =>
        ['pending', 'submitted', 'verified', 'processed_for_approve'].includes(p.client_registration?.status || '')
      );
    } else if (activeStatusTab === 'active') {
      filtered = filtered.filter(p =>
        p.client_registration?.status === 'active' && p.active === 1
      );
    } else if (activeStatusTab === 'inactive') {
      filtered = filtered.filter(p =>
        p.client_registration?.status === 'inactive' || p.active === 0
      );
    }

    // Apply custom form field filters
    Object.entries(fieldFilters).forEach(([fieldId, filterValue]) => {
      if (filterValue) {
        filtered = filtered.filter(p => {
          const raw = p.client_registration?.custom_form_data?.[fieldId];
          const resolved = p.client_registration?.resolved_form_data?.[fieldId]?.resolved;
          return String(raw) === filterValue || String(resolved) === filterValue;
        });
      }
    });

    setPartners(filtered);
  }, [allPartners, activeStatusTab, fieldFilters]);

  // Get fields that have options (for filter dropdowns)
  const filterableFields = formDefinition?.filter(f => f.options && f.options.length > 0) || [];



  const handleToggleStatus = async (partner: Partner) => {
    setUpdatingStatus(partner.id);
    try {
      const token = localStorage.getItem('accessToken');
      const newStatus = partner.active === 1 ? 0 : 1;

      await axios.patch(`${API_BASE_URL}/admin/apps/${selectedAppId}/partners/${partner.id}/status`, {
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
    if (!selectedPartner || !selectedAppId) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.put(
        `${API_BASE_URL}/admin/apps/${selectedAppId}/partners/${selectedPartner.id}`,
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
        { partner_id: partner.id, app_id: selectedAppId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success && response.data.data.accessToken) {
        localStorage.setItem('partnerAccessToken', response.data.data.accessToken);
        localStorage.setItem('partnerUser', JSON.stringify(response.data.data.user));
        window.open('/dashboard/partner', '_blank');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to access partner portal');
    }
  };

  const handleApprovePartner = async (partner: Partner) => {
    if (!selectedAppId) return;
    setApproving(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${API_BASE_URL}/admin/apps/${selectedAppId}/partners/${partner.id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Partner approved and activated successfully');
      setShowModal(false);
      setSelectedPartner(null);
      await fetchPartners(selectedAppId);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve partner');
    } finally {
      setApproving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
      submitted: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Submitted' },
      verified: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Verified' },
      processed_for_approve: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Processing' },
      active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
      inactive: { bg: 'bg-red-100', text: 'text-red-700', label: 'Inactive' }
    };
    const s = map[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</span>;
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
                        <td colSpan={tableHeaders.length + 5} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center justify-center gap-3 text-gray-500">
                            <div className="rounded-full bg-gray-100 p-4">
                              <Users className="w-10 h-10 text-gray-400" strokeWidth={1.5} />
                            </div>
                            <p className="text-base font-medium text-gray-600">No {activeStatusTab} partners</p>
                            <p className="text-sm text-gray-400 max-w-sm">
                              {activeStatusTab === 'All'
                                ? 'Partners will appear here once they register. Ensure this app has a custom form configured.'
                                : `No ${activeStatusTab.toLowerCase()} partners in this app.`}
                            </p>
                          </div>
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
                            {activeStatusTab === 'pending' ? (
                              getStatusBadge(partner.client_registration?.status || 'pending')
                            ) : (
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
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleViewDetails(partner)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                              >
                                <Eye size={16} />
                                {activeStatusTab === 'pending' ? 'View' : 'Edit'}
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

      {/* Partner Details / Approval Modal */}
      {showModal && selectedPartner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">
                  {activeStatusTab === 'pending' ? 'Review Partner' : isEditing ? 'Edit Partner' : 'Partner Details'}
                </h2>
                {getStatusBadge(selectedPartner.client_registration?.status || 'pending')}
              </div>
              <button
                onClick={() => { setShowModal(false); setIsEditing(false); setError(''); setSuccess(''); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {success && (
              <div className="mx-6 mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{success}</div>
            )}
            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
            )}

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Partner ID</label>
                    <p className="text-gray-900">{selectedPartner.identification_code || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created At</label>
                    <p className="text-gray-900">{formatDate(selectedPartner.created_on)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    {isEditing ? (
                      <input type="email" value={editFormData.email} onChange={(e) => handleEditFormChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    ) : (
                      <p className="text-gray-900">{selectedPartner.email}</p>
                    )}
                  </div>
                </div>

                {/* Registration Form Data */}
                {selectedPartner.client_registration?.resolved_form_data && Object.keys(selectedPartner.client_registration.resolved_form_data).length > 0 && (
                  <>
                    <hr />
                    <h3 className="text-lg font-semibold text-gray-900">Registration Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(selectedPartner.client_registration.resolved_form_data)
                        .sort(([, a], [, b]) => (a.order || 0) - (b.order || 0))
                        .map(([fieldId, fieldInfo]) => (
                        <div key={fieldId}>
                          <label className="block text-sm font-medium text-gray-500 mb-1">{fieldInfo.label}</label>
                          {isEditing ? (
                            fieldInfo.options && fieldInfo.options.length > 0 ? (
                              <select value={String(editFormData.custom_form_data[fieldId] || '')}
                                onChange={(e) => handleEditFormChange(fieldId, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="">Select {fieldInfo.label}</option>
                                {fieldInfo.options.map((option: string) => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            ) : fieldInfo.mapping ? (
                              <p className="text-gray-500 py-2 italic">{String(fieldInfo.resolved || '-')} (mapped)</p>
                            ) : (
                              <input type="text" value={String(editFormData.custom_form_data[fieldId] || '')}
                                onChange={(e) => handleEditFormChange(fieldId, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                            )
                          ) : (
                            <p className="text-gray-900 py-1">{String(fieldInfo.resolved) || '-'}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Owner Details Section */}
                {selectedPartner.owner_details && (
                  <>
                    <hr />
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Shield size={18} /> Owner Details
                      {getStatusBadge(selectedPartner.owner_details.status || 'draft')}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'Name', value: selectedPartner.owner_details.name },
                        { label: 'Display Name', value: selectedPartner.owner_details.display_name },
                        { label: "Father's Name", value: selectedPartner.owner_details.father_name },
                        { label: "Mother's Name", value: selectedPartner.owner_details.mother_name },
                        { label: 'Mobile', value: selectedPartner.owner_details.mobile_no },
                        { label: 'Email', value: selectedPartner.owner_details.email_id },
                        { label: 'Date of Birth', value: selectedPartner.owner_details.dob },
                        { label: 'Nationality', value: selectedPartner.owner_details.nationality },
                        { label: 'Gender', value: selectedPartner.owner_details.gender },
                        { label: 'Marital Status', value: selectedPartner.owner_details.marital_status },
                        { label: 'Education', value: selectedPartner.owner_details.education },
                        { label: 'Company Name', value: selectedPartner.owner_details.company_name },
                        { label: 'Company Registration', value: selectedPartner.owner_details.company_registration },
                        { label: 'Company Taxation', value: selectedPartner.owner_details.company_taxation },
                      ].filter(item => item.value).map(item => (
                        <div key={item.label}>
                          <label className="block text-sm font-medium text-gray-500">{item.label}</label>
                          <p className="text-gray-900">{item.value}</p>
                        </div>
                      ))}
                      {selectedPartner.owner_details.address && (
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-500">Address</label>
                          <p className="text-gray-900">{selectedPartner.owner_details.address}</p>
                        </div>
                      )}
                      {selectedPartner.owner_details.other_details && (
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-500">Other Details</label>
                          <p className="text-gray-900">{selectedPartner.owner_details.other_details}</p>
                        </div>
                      )}
                    </div>

                    {/* Uploaded Documents */}
                    <h4 className="text-md font-semibold text-gray-800 mt-4 flex items-center gap-2">
                      <FileText size={16} /> Documents
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Photo', url: selectedPartner.owner_details.photo_signed_url },
                        { label: 'Logo', url: selectedPartner.owner_details.logo_signed_url },
                        { label: 'ID Proof', url: selectedPartner.owner_details.id_proof_signed_url },
                        { label: 'Address Proof', url: selectedPartner.owner_details.address_proof_signed_url },
                      ].filter(doc => doc.url).map(doc => (
                        <a key={doc.label} href={doc.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border">
                          {doc.label.includes('Photo') || doc.label.includes('Logo') ? (
                            <img src={doc.url} alt={doc.label} className="w-10 h-10 object-cover rounded" />
                          ) : (
                            <Download size={16} className="text-blue-600" />
                          )}
                          <span className="text-sm text-gray-700">{doc.label}</span>
                        </a>
                      ))}
                    </div>

                    {/* Other Documents */}
                    {Array.isArray(selectedPartner.owner_details.other_documents) && selectedPartner.owner_details.other_documents.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-600 mb-2">Other Documents</h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedPartner.owner_details.other_documents.map((doc: any, i: number) => (
                            <a key={i} href={doc.signed_url || doc.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs hover:bg-blue-100">
                              <Download size={12} /> {doc.original_name || `Document ${i + 1}`}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Company Registration Docs */}
                    {Array.isArray(selectedPartner.owner_details.company_registration_docs) && selectedPartner.owner_details.company_registration_docs.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-600 mb-2">Company Registration Docs</h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedPartner.owner_details.company_registration_docs.map((doc: any, i: number) => (
                            <a key={i} href={doc.signed_url || doc.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs hover:bg-indigo-100">
                              <Download size={12} /> {doc.original_name || `Doc ${i + 1}`}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Company Taxation Docs */}
                    {Array.isArray(selectedPartner.owner_details.company_taxation_docs) && selectedPartner.owner_details.company_taxation_docs.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-600 mb-2">Company Taxation Docs</h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedPartner.owner_details.company_taxation_docs.map((doc: any, i: number) => (
                            <a key={i} href={doc.signed_url || doc.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs hover:bg-purple-100">
                              <Download size={12} /> {doc.original_name || `Doc ${i + 1}`}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* No owner details message */}
                {!selectedPartner.owner_details && activeStatusTab === 'pending' && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm">
                    Owner details not yet submitted by this partner.
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              {isEditing ? (
                <>
                  <button onClick={handleCancelEdit} disabled={saving}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50">Cancel</button>
                  <button onClick={handleSavePartner} disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                    {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { setShowModal(false); setError(''); setSuccess(''); }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Close</button>
                  {activeStatusTab !== 'pending' && (
                    <button onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Edit Partner</button>
                  )}
                  {activeStatusTab === 'pending' && (
                    <button
                      onClick={() => handleApprovePartner(selectedPartner)}
                      disabled={approving}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {approving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      <CheckCircle size={16} />
                      {approving ? 'Approving...' : 'Approve Partner'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
