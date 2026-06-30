import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';
import {
  Database, Eye, X, Users, Loader2, FileText, Download, Shield
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

interface PartnerRecord {
  id: number;
  identification_code: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  active: number;
  created_on: number;
  client_registration?: {
    id: number;
    status: string;
    custom_form_data: Record<string, unknown>;
    resolved_form_data?: Record<string, FormFieldInfo>;
  };
  owner_details?: OwnerDetails | null;
}

interface OwnerDetails {
  name?: string;
  display_name?: string;
  father_name?: string;
  mother_name?: string;
  mobile_no?: string;
  email_id?: string;
  dob?: string;
  nationality?: string;
  gender?: string;
  marital_status?: string;
  education?: string;
  company_name?: string;
  company_registration?: string;
  company_taxation?: string;
  address?: string;
  other_details?: string;
  status?: string;
  photo_signed_url?: string;
  logo_signed_url?: string;
  id_proof_signed_url?: string;
  address_proof_signed_url?: string;
  other_documents?: Array<{ signed_url?: string; url?: string; original_name?: string }>;
  company_registration_docs?: Array<{ signed_url?: string; url?: string; original_name?: string }>;
  company_taxation_docs?: Array<{ signed_url?: string; url?: string; original_name?: string }>;
}

interface TableHeader {
  id: string;
  label: string;
  order: number;
}

interface AppOption {
  id: number;
  group_name: string;
  app_code: string;
}

type StatusTab = 'all' | 'active' | 'pending';

const PENDING_STATUSES = ['pending', 'submitted', 'verified', 'processed_for_approve'];

const formatDate = (timestamp: number): string => {
  if (!timestamp) return '—';
  const date = new Date(timestamp * 1000);
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleDateString('en-GB', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const getResolvedFormValue = (record: PartnerRecord, fieldId: string): string => {
  const resolvedData = record.client_registration?.resolved_form_data;
  if (!resolvedData?.[fieldId]) return '—';
  const value = resolvedData[fieldId].resolved;
  return value !== undefined && value !== null && value !== '' ? String(value) : '—';
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
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
};

export const ClientDatabase: React.FC = () => {
  const [apps, setApps] = useState<AppOption[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [allRecords, setAllRecords] = useState<PartnerRecord[]>([]);
  const [records, setRecords] = useState<PartnerRecord[]>([]);
  const [tableHeaders, setTableHeaders] = useState<TableHeader[]>([]);
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [loadingApps, setLoadingApps] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<PartnerRecord | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchApps();
  }, []);

  useEffect(() => {
    if (selectedAppId) {
      fetchPartners(selectedAppId);
    }
  }, [selectedAppId]);

  const filterRecords = useCallback(() => {
    let filtered = [...allRecords];

    if (activeTab === 'active') {
      filtered = filtered.filter(
        (r) => r.client_registration?.status === 'active'
      );
    } else if (activeTab === 'pending') {
      filtered = filtered.filter((r) =>
        PENDING_STATUSES.includes(r.client_registration?.status || '')
      );
    }

    setRecords(filtered);
  }, [allRecords, activeTab]);

  useEffect(() => {
    filterRecords();
  }, [filterRecords]);

  const fetchApps = async () => {
    try {
      setLoadingApps(true);
      setError('');
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/apps-with-custom-forms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const appList: AppOption[] = response.data.data || [];
        setApps(appList);
        if (appList.length > 0) {
          setSelectedAppId(appList[0].id);
        }
      }
    } catch (err: unknown) {
      console.error('Failed to fetch apps:', err);
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'Failed to load apps';
      setError(message);
    } finally {
      setLoadingApps(false);
    }
  };

  const fetchPartners = async (appId: number) => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/apps/${appId}/partners`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const fetched: PartnerRecord[] = response.data.data || [];
        setAllRecords(fetched);

        const headersMap = new Map<string, TableHeader>();
        fetched.forEach((record) => {
          const resolvedData = record.client_registration?.resolved_form_data;
          if (resolvedData) {
            Object.entries(resolvedData).forEach(([key, fieldInfo]) => {
              if (!headersMap.has(key)) {
                headersMap.set(key, { id: key, label: fieldInfo.label, order: fieldInfo.order });
              }
            });
          }
        });
        setTableHeaders(
          Array.from(headersMap.values()).sort((a, b) => a.order - b.order)
        );
      }
    } catch (err: unknown) {
      console.error('Failed to fetch partners:', err);
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'Failed to load client database records';
      setError(message);
      setAllRecords([]);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAppChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const appId = parseInt(e.target.value, 10);
    setSelectedAppId(appId);
    setActiveTab('all');
  };

  const handleViewDetails = (record: PartnerRecord) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRecord(null);
  };

  const colSpan = tableHeaders.length + 9;

  if (loadingApps) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Database className="w-7 h-7 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Client Database</h1>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-100 text-red-700">{error}</div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Select App:</label>
        <select
          value={selectedAppId ?? ''}
          onChange={handleAppChange}
          disabled={apps.length === 0}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-[220px]"
        >
          {apps.length === 0 ? (
            <option value="">No apps with custom forms</option>
          ) : (
            apps.map((app) => (
              <option key={app.id} value={app.id}>
                {app.group_name}
              </option>
            ))
          )}
        </select>
      </div>

      {selectedAppId && (
        <>
          <div className="flex gap-2 bg-gray-50 p-1 rounded-lg w-fit">
            {(['all', 'active', 'pending'] as StatusTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                  activeTab === tab
                    ? tab === 'all'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : tab === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="animate-spin text-primary-600" size={32} />
                <p className="text-sm text-gray-500">Loading client records...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">First Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                      {tableHeaders.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap"
                        >
                          {header.label}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {records.length === 0 ? (
                      <tr>
                        <td colSpan={colSpan} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center justify-center gap-3 text-gray-500">
                            <div className="rounded-full bg-gray-100 p-4">
                              <Users className="w-10 h-10 text-gray-400" strokeWidth={1.5} />
                            </div>
                            <p className="text-base font-medium text-gray-600">
                              No {activeTab === 'all' ? '' : activeTab} client records
                            </p>
                            <p className="text-sm text-gray-400 max-w-sm">
                              Client registrations will appear here once partners register for this app.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      records.map((record, index) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                            {formatDate(record.created_on)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                            {record.identification_code || '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{record.email || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{record.first_name || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{record.last_name || '—'}</td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                record.active === 1
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {record.active === 1 ? 'Yes' : 'No'}
                            </span>
                          </td>
                          {tableHeaders.map((header) => (
                            <td
                              key={`${record.id}-${header.id}`}
                              className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                            >
                              {getResolvedFormValue(record, header.id)}
                            </td>
                          ))}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {getStatusBadge(record.client_registration?.status || 'pending')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() => handleViewDetails(record)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                            >
                              <Eye size={14} />
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!loading && allRecords.length > 0 && (
            <p className="text-sm text-gray-500">
              Showing {records.length} of {allRecords.length} record{allRecords.length !== 1 ? 's' : ''}
            </p>
          )}
        </>
      )}

      {showModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">Client Details</h2>
                {getStatusBadge(selectedRecord.client_registration?.status || 'pending')}
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">ID Code</label>
                  <p className="text-gray-900">{selectedRecord.identification_code || '—'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created At</label>
                  <p className="text-gray-900">{formatDate(selectedRecord.created_on)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{selectedRecord.email || '—'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">First Name</label>
                  <p className="text-gray-900">{selectedRecord.first_name || '—'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Name</label>
                  <p className="text-gray-900">{selectedRecord.last_name || '—'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Active</label>
                  <p className="text-gray-900">{selectedRecord.active === 1 ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {selectedRecord.client_registration?.resolved_form_data &&
                Object.keys(selectedRecord.client_registration.resolved_form_data).length > 0 && (
                  <>
                    <hr />
                    <h3 className="text-lg font-semibold text-gray-900">Registration Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(selectedRecord.client_registration.resolved_form_data)
                        .sort(([, a], [, b]) => (a.order || 0) - (b.order || 0))
                        .map(([fieldId, fieldInfo]) => (
                          <div key={fieldId}>
                            <label className="block text-sm font-medium text-gray-500 mb-1">
                              {fieldInfo.label}
                            </label>
                            <p className="text-gray-900">{String(fieldInfo.resolved) || '—'}</p>
                          </div>
                        ))}
                    </div>
                  </>
                )}

              {selectedRecord.owner_details ? (
                <>
                  <hr />
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Shield size={18} />
                    Owner Details
                    {selectedRecord.owner_details.status &&
                      getStatusBadge(selectedRecord.owner_details.status)}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Name', value: selectedRecord.owner_details.name },
                      { label: 'Display Name', value: selectedRecord.owner_details.display_name },
                      { label: "Father's Name", value: selectedRecord.owner_details.father_name },
                      { label: "Mother's Name", value: selectedRecord.owner_details.mother_name },
                      { label: 'Mobile', value: selectedRecord.owner_details.mobile_no },
                      { label: 'Email', value: selectedRecord.owner_details.email_id },
                      { label: 'Date of Birth', value: selectedRecord.owner_details.dob },
                      { label: 'Nationality', value: selectedRecord.owner_details.nationality },
                      { label: 'Gender', value: selectedRecord.owner_details.gender },
                      { label: 'Marital Status', value: selectedRecord.owner_details.marital_status },
                      { label: 'Education', value: selectedRecord.owner_details.education },
                      { label: 'Company Name', value: selectedRecord.owner_details.company_name },
                      { label: 'Company Registration', value: selectedRecord.owner_details.company_registration },
                      { label: 'Company Taxation', value: selectedRecord.owner_details.company_taxation }
                    ]
                      .filter((item) => item.value)
                      .map((item) => (
                        <div key={item.label}>
                          <label className="block text-sm font-medium text-gray-500">{item.label}</label>
                          <p className="text-gray-900">{item.value}</p>
                        </div>
                      ))}
                    {selectedRecord.owner_details.address && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-500">Address</label>
                        <p className="text-gray-900">{selectedRecord.owner_details.address}</p>
                      </div>
                    )}
                    {selectedRecord.owner_details.other_details && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-500">Other Details</label>
                        <p className="text-gray-900">{selectedRecord.owner_details.other_details}</p>
                      </div>
                    )}
                  </div>

                  <h4 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                    <FileText size={16} />
                    Documents
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Photo', url: selectedRecord.owner_details.photo_signed_url },
                      { label: 'Logo', url: selectedRecord.owner_details.logo_signed_url },
                      { label: 'ID Proof', url: selectedRecord.owner_details.id_proof_signed_url },
                      { label: 'Address Proof', url: selectedRecord.owner_details.address_proof_signed_url }
                    ]
                      .filter((doc) => doc.url)
                      .map((doc) => (
                        <a
                          key={doc.label}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border"
                        >
                          {doc.label.includes('Photo') || doc.label.includes('Logo') ? (
                            <img src={doc.url} alt={doc.label} className="w-10 h-10 object-cover rounded" />
                          ) : (
                            <Download size={16} className="text-blue-600" />
                          )}
                          <span className="text-sm text-gray-700">{doc.label}</span>
                        </a>
                      ))}
                  </div>

                  {Array.isArray(selectedRecord.owner_details.other_documents) &&
                    selectedRecord.owner_details.other_documents.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-600 mb-2">Other Documents</h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedRecord.owner_details.other_documents.map((doc, i) => (
                            <a
                              key={i}
                              href={doc.signed_url || doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs hover:bg-blue-100"
                            >
                              <Download size={12} />
                              {doc.original_name || `Document ${i + 1}`}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                  {Array.isArray(selectedRecord.owner_details.company_registration_docs) &&
                    selectedRecord.owner_details.company_registration_docs.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-600 mb-2">Company Registration Docs</h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedRecord.owner_details.company_registration_docs.map((doc, i) => (
                            <a
                              key={i}
                              href={doc.signed_url || doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs hover:bg-indigo-100"
                            >
                              <Download size={12} />
                              {doc.original_name || `Doc ${i + 1}`}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                  {Array.isArray(selectedRecord.owner_details.company_taxation_docs) &&
                    selectedRecord.owner_details.company_taxation_docs.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-600 mb-2">Company Taxation Docs</h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedRecord.owner_details.company_taxation_docs.map((doc, i) => (
                            <a
                              key={i}
                              href={doc.signed_url || doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs hover:bg-purple-100"
                            >
                              <Download size={12} />
                              {doc.original_name || `Doc ${i + 1}`}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                </>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm">
                  Owner details not yet submitted by this client.
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
