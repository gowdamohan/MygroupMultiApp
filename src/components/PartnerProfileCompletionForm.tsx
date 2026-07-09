import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  CheckCircle, Clock, Upload, AlertCircle, Loader2, FileText, Edit2, Save, X
} from 'lucide-react';
import { API_BASE_URL } from '../config/api.config';
import { FileUpload, MultiFileUpload } from './form/FileUpload';

const IMAGE_ACCEPT = 'image/jpeg,image/jpg,image/png';
const DOC_ACCEPT = 'image/jpeg,image/jpg,image/png,application/pdf';
const MAX_FILE_MB = 5;

const NATIONALITIES = ['Indian', 'American', 'British', 'Canadian', 'Australian', 'Other'];
const GENDERS = ['Male', 'Female', 'Other'];
const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widowed'];

export interface PartnerProfileCompletionFormProps {
  registrationStatus: string;
  onStatusChange?: (newStatus: string) => void;
  /** onboarding = dashboard activation flow; edit = /partner/edit-profile page */
  variant?: 'onboarding' | 'edit';
}

type SectionKey = 'owner' | 'company';

interface ProfileFormData {
  name: string;
  father_name: string;
  mother_name: string;
  mobile_no: string;
  email_id: string;
  address: string;
  dob: string;
  nationality: string;
  gender: string;
  marital_status: string;
  education: string;
  other_details: string;
  display_name: string;
  company_name: string;
  company_registration: string;
  company_taxation: string;
}

interface ExistingFiles {
  photo_signed_url?: string;
  logo_signed_url?: string;
  id_proof_signed_url?: string;
  address_proof_signed_url?: string;
  other_documents?: { name: string; path: string; signed_url?: string }[];
  company_registration_docs?: { name: string; path: string; signed_url?: string }[];
  company_taxation_docs?: { name: string; path: string; signed_url?: string }[];
}

interface RegistrationSummaryField {
  id: string;
  label: string;
  value: string;
  order?: number;
}

interface RegistrationSummary {
  email?: string;
  username?: string;
  identification_code?: string;
  registration_date?: string;
  fields: RegistrationSummaryField[];
}

const formatRegistrationDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const defaultFormData: ProfileFormData = {
  name: '',
  father_name: '',
  mother_name: '',
  mobile_no: '',
  email_id: '',
  address: '',
  dob: '',
  nationality: '',
  gender: '',
  marital_status: '',
  education: '',
  other_details: '',
  display_name: '',
  company_name: '',
  company_registration: '',
  company_taxation: ''
};

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100';

const sectionHeaderClass = (verified: boolean) =>
  verified
    ? 'border-green-200 bg-green-50'
    : 'border-gray-100 bg-white';

export const PartnerProfileCompletionForm: React.FC<PartnerProfileCompletionFormProps> = ({
  registrationStatus,
  onStatusChange,
  variant = 'onboarding'
}) => {
  const [formData, setFormData] = useState<ProfileFormData>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<SectionKey | 'all' | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentStatus, setCurrentStatus] = useState(registrationStatus);
  const [existing, setExisting] = useState<ExistingFiles>({});
  const [registrationSummary, setRegistrationSummary] = useState<RegistrationSummary>({ fields: [] });
  const [editingSections, setEditingSections] = useState<Record<SectionKey, boolean>>({
    owner: false,
    company: false
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [addressProofFile, setAddressProofFile] = useState<File | null>(null);
  const [otherDocFiles, setOtherDocFiles] = useState<File[]>([]);
  const [compRegDocFiles, setCompRegDocFiles] = useState<File[]>([]);
  const [compTaxDocFiles, setCompTaxDocFiles] = useState<File[]>([]);

  const isPending = currentStatus === 'pending';
  const isProfileLocked = ['verified', 'processed_for_approve'].includes(currentStatus);
  const isSectionVerified = isProfileLocked;
  const isActiveAccount = currentStatus === 'active';
  const isSubmittedFlow = !isPending;
  const isGloballyReadOnly = isProfileLocked;
  const showOnboardingHeader = variant === 'onboarding' || !isActiveAccount;

  const fetchProfile = useCallback(async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setLoading(true);
      }
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.get(`${API_BASE_URL}/partner/owner-details`, { headers });

      if (response.data.success) {
        if (response.data.registration_status) {
          setCurrentStatus(response.data.registration_status);
        }

        const userData = response.data.user;
        const registrationFields = Array.isArray(response.data.registration_fields)
          ? response.data.registration_fields
          : [];

        setRegistrationSummary({
          email: userData?.email,
          username: userData?.username,
          identification_code: userData?.identification_code,
          registration_date: response.data.registration_date,
          fields: registrationFields
        });

        const d = response.data.data;
        if (d) {
          setFormData({
            name: d.name || '',
            father_name: d.father_name || '',
            mother_name: d.mother_name || '',
            mobile_no: d.mobile_no || '',
            email_id: d.email_id || '',
            address: d.address || '',
            dob: d.dob || '',
            nationality: d.nationality || '',
            gender: d.gender || '',
            marital_status: d.marital_status || '',
            education: d.education || '',
            other_details: d.other_details || '',
            display_name: d.display_name || '',
            company_name: d.company_name || '',
            company_registration: d.company_registration || '',
            company_taxation: d.company_taxation || ''
          });
          setExisting({
            photo_signed_url: d.photo_signed_url,
            logo_signed_url: d.logo_signed_url,
            id_proof_signed_url: d.id_proof_signed_url,
            address_proof_signed_url: d.address_proof_signed_url,
            other_documents: Array.isArray(d.other_documents) ? d.other_documents : [],
            company_registration_docs: Array.isArray(d.company_registration_docs)
              ? d.company_registration_docs
              : [],
            company_taxation_docs: Array.isArray(d.company_taxation_docs)
              ? d.company_taxation_docs
              : []
          });
        }
      }
    } catch (err) {
      console.error('Error fetching partner profile:', err);
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    setCurrentStatus(registrationStatus);
  }, [registrationStatus]);

  useEffect(() => {
    if (currentStatus === 'pending') {
      setEditingSections({ owner: true, company: true });
    }
  }, [currentStatus]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const isSectionEditing = (section: SectionKey) =>
    !isGloballyReadOnly && (isPending || editingSections[section]);

  const startEditSection = (section: SectionKey) => {
    setEditingSections(prev => ({ ...prev, [section]: true }));
    setError('');
    setSuccess('');
  };

  const cancelEditSection = (section: SectionKey) => {
    setEditingSections(prev => ({ ...prev, [section]: false }));
    fetchProfile();
  };

  const getSectionErrors = (section: SectionKey): Record<string, string> => {
    const next: Record<string, string> = {};

    if (section === 'owner') {
      if (!formData.name.trim()) next.name = 'Full name is required';
      if (!formData.father_name.trim()) next.father_name = "Father's name is required";
      if (!formData.mobile_no.trim()) {
        next.mobile_no = 'Mobile number is required';
      } else if (!/^[0-9+\-\s()]{8,15}$/.test(formData.mobile_no.trim())) {
        next.mobile_no = 'Enter a valid mobile number';
      }
      if (formData.email_id && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_id)) {
        next.email_id = 'Enter a valid email address';
      }
      if (!formData.address.trim()) next.address = 'Address is required';
      if (!formData.dob) next.dob = 'Date of birth is required';
      if (!formData.nationality) next.nationality = 'Nationality is required';
      if (!formData.gender) next.gender = 'Gender is required';
      if (!formData.marital_status) next.marital_status = 'Marital status is required';
      if (!idProofFile && !existing.id_proof_signed_url) {
        next.id_proof = 'ID proof is required';
      }
      if (!addressProofFile && !existing.address_proof_signed_url) {
        next.address_proof = 'Address proof is required';
      }
    }

    if (section === 'company') {
      if (!formData.display_name.trim()) next.display_name = 'Company display name is required';
      if (!formData.company_name.trim()) next.company_name = 'Company name is required';
      if (!formData.company_registration.trim()) {
        next.company_registration = 'Registration number is required';
      }
      if (!logoFile && !existing.logo_signed_url) {
        next.logo = 'Logo upload is required';
      }
    }

    return next;
  };

  const validateSection = (section: SectionKey): boolean => {
    const next = getSectionErrors(section);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateAllSections = (): boolean => {
    const next = getSectionErrors('owner');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const showCompanySection = false;

  const buildFormData = (section?: SectionKey | 'all', submitForVerification = false): FormData => {
    const fd = new FormData();

    const ownerTextFields: (keyof ProfileFormData)[] = [
      'name', 'father_name', 'mother_name', 'mobile_no', 'email_id',
      'address', 'dob', 'nationality', 'gender', 'marital_status',
      'education', 'other_details'
    ];
    const companyTextFields: (keyof ProfileFormData)[] = [
      'display_name', 'company_name', 'company_registration', 'company_taxation'
    ];

    const appendTextFields = (fields: (keyof ProfileFormData)[]) => {
      fields.forEach(key => fd.append(key, formData[key] || ''));
    };

    if (section === 'owner') {
      fd.append('section', 'owner');
      appendTextFields(ownerTextFields);
      if (photoFile) fd.append('photo', photoFile);
      if (idProofFile) fd.append('id_proof', idProofFile);
      if (addressProofFile) fd.append('address_proof', addressProofFile);
      otherDocFiles.forEach(f => fd.append('other_documents', f));
    } else if (section === 'company') {
      fd.append('section', 'company');
      appendTextFields(companyTextFields);
      if (logoFile) fd.append('logo', logoFile);
      compRegDocFiles.forEach(f => fd.append('company_registration_docs', f));
      compTaxDocFiles.forEach(f => fd.append('company_taxation_docs', f));
    } else {
      appendTextFields([...ownerTextFields, ...companyTextFields]);
      if (photoFile) fd.append('photo', photoFile);
      if (logoFile) fd.append('logo', logoFile);
      if (idProofFile) fd.append('id_proof', idProofFile);
      if (addressProofFile) fd.append('address_proof', addressProofFile);
      otherDocFiles.forEach(f => fd.append('other_documents', f));
      compRegDocFiles.forEach(f => fd.append('company_registration_docs', f));
      compTaxDocFiles.forEach(f => fd.append('company_taxation_docs', f));
    }

    if (submitForVerification) {
      fd.append('submit_for_verification', 'true');
    }

    return fd;
  };

  const clearSectionFileState = (section: SectionKey | 'all') => {
    if (section === 'owner' || section === 'all') {
      setPhotoFile(null);
      setIdProofFile(null);
      setAddressProofFile(null);
      setOtherDocFiles([]);
    }
    if (section === 'company' || section === 'all') {
      setLogoFile(null);
      setCompRegDocFiles([]);
      setCompTaxDocFiles([]);
    }
  };

  const saveSection = async (section: SectionKey) => {
    setError('');
    setSuccess('');
    if (!validateSection(section)) return;

    setSaving(section);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_BASE_URL}/partner/owner-details`,
        buildFormData(section),
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccess(`${section === 'owner' ? 'Owner' : 'Company'} details saved successfully.`);
        if (response.data.registration_status) {
          setCurrentStatus(response.data.registration_status);
          onStatusChange?.(response.data.registration_status);
        }
        setEditingSections(prev => ({ ...prev, [section]: false }));
        clearSectionFileState(section);
        await fetchProfile({ silent: true });
        window.dispatchEvent(new CustomEvent('partner:profile-saved'));
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to save section');
    } finally {
      setSaving(null);
    }
  };

  const handleSubmitAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!validateAllSections()) return;

    setSaving('all');
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_BASE_URL}/partner/owner-details`,
        buildFormData('all', true),
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccess('Profile submitted successfully! Your account will be verified within 24 working hours.');
        if (response.data.registration_status) {
          setCurrentStatus(response.data.registration_status);
          onStatusChange?.(response.data.registration_status);
        }
        setEditingSections({ owner: false, company: false });
        clearSectionFileState('all');
        await fetchProfile({ silent: true });
        window.dispatchEvent(new CustomEvent('partner:profile-saved'));
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to submit profile');
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteDoc = async (docField: string, docPath: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/partner/owner-details/document`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { doc_field: docField, doc_path: docPath }
      });
      await fetchProfile();
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  const statusSteps = [
    { key: 'submitted', label: 'Submitted' },
    { key: 'verified', label: 'Verified' }
  ];

  const getStepStatus = (stepKey: string) => {
    const order = ['pending', 'submitted', 'verified', 'processed_for_approve', 'active'];
    const currentIdx = order.indexOf(currentStatus);
    const stepIdx = order.indexOf(stepKey);
    if (stepIdx <= currentIdx) return 'completed';
    if (stepIdx === currentIdx + 1) return 'current';
    return 'upcoming';
  };

  const renderSectionActions = (section: SectionKey) => {
    if (isGloballyReadOnly) return null;
    const editing = isSectionEditing(section);

    return (
      <div className="flex items-center gap-2">
        {!editing ? (
          <button
            type="button"
            onClick={() => startEditSection(section)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <Edit2 size={14} />
            Edit
          </button>
        ) : (
          <>
            {isSubmittedFlow && (
              <button
                type="button"
                onClick={() => cancelEditSection(section)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X size={14} />
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={() => saveSection(section)}
              disabled={saving === section}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {saving === section ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Save size={14} />
              )}
              Save
            </button>
          </>
        )}
      </div>
    );
  };

  const sectionDisabled = (section: SectionKey) =>
    isGloballyReadOnly || (isSubmittedFlow && !isSectionEditing(section));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  const showForm =
    variant === 'edit'
      ? true
      : !['verified', 'processed_for_approve', 'active'].includes(currentStatus);
  const initialMessage =
    'Registered Successfully. To proceed with your account activation, please ensure all fields in the Profile section are accurately filled and upload the necessary documentation for verification.';
  const postSubmissionMessage =
    'Your Account will be verified and activate within 24 working hours. For any queries or details please send message to Admin in support chat option.';

  const summaryEntries = [
    ...(registrationSummary.registration_date
      ? [{ id: 'registration_date', label: 'Registration Date', value: formatRegistrationDate(registrationSummary.registration_date) }]
      : []),
    ...(registrationSummary.email
      ? [{ id: 'email', label: 'Registered Email', value: registrationSummary.email }]
      : []),
    ...(registrationSummary.username
      ? [{ id: 'username', label: 'Username', value: registrationSummary.username }]
      : []),
    ...(registrationSummary.identification_code
      ? [{ id: 'identification_code', label: 'Identification Code', value: registrationSummary.identification_code }]
      : []),
    ...registrationSummary.fields.map(field => ({
      id: field.id,
      label: field.label,
      value: field.value
    }))
  ];

  const renderProfileSummary = () => (
    <div className="rounded-xl shadow-sm border border-gray-200 bg-white p-5 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Registration Details</h3>
        <p className="text-xs text-gray-500 mt-0.5">Information entered at the time of registration</p>
      </div>
      {summaryEntries.length > 0 ? (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
          {summaryEntries.map(({ id, label, value }) => (
            <div key={id} className="border-b border-gray-100 pb-2 last:border-0">
              <dt className="text-xs font-medium text-gray-500">{label}</dt>
              <dd className="text-sm text-gray-900 mt-0.5 break-words">{value || '—'}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-gray-500">No registration details available.</p>
      )}
    </div>
  );

  const renderSectionHeader = (
    title: string,
    subtitle: string,
    section: SectionKey
  ) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-3">
      <div>
        <h3 className={`text-lg font-semibold ${isSectionVerified ? 'text-green-800' : 'text-gray-900'}`}>
          {title}
          {isSectionVerified && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
              <CheckCircle size={12} /> Verified
            </span>
          )}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
      </div>
      {renderSectionActions(section)}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {variant === 'edit' && isActiveAccount ? (
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
          <p className="text-sm text-gray-600 mt-1">
            Update your owner details below.
          </p>
        </div>
      ) : showOnboardingHeader ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {variant === 'edit' ? 'Partner Profile' : 'Registered Successfully'}
            </h2>
            <p className="text-sm text-gray-600 mt-2 max-w-2xl mx-auto">
              {isPending ? initialMessage : postSubmissionMessage}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 flex-wrap">
            {statusSteps.map((step, idx) => {
              const status = getStepStatus(step.key);
              const isSectionVerifiedStep = step.key === 'verified' && status === 'completed';
              return (
                <React.Fragment key={step.key}>
                  {idx > 0 && <div className="w-8 h-0.5 bg-gray-300" />}
                  <div
                    className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                      isSectionVerifiedStep
                        ? 'bg-green-100 text-green-700 ring-2 ring-green-300'
                        : status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : status === 'current'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {status === 'completed' ? <CheckCircle size={14} /> : <Clock size={14} />}
                    {step.label}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ) : null}

      {showForm ? (
        <form onSubmit={handleSubmitAll} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="text-red-500 flex-shrink-0" size={16} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle className="text-green-500 flex-shrink-0" size={16} />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          <div className="grid grid-cols-12 gap-6 items-start">
            {/* Left sidebar — registration summary & company details */}
            <div className="col-span-12 lg:col-span-6 space-y-6 lg:sticky lg:top-6">
              {renderProfileSummary()}

              {/* Company Details (includes taxation) */}
              {showCompanySection && (
              <div
                className={`rounded-xl shadow-sm border p-5 space-y-4 ${sectionHeaderClass(isSectionVerified)} ${
                  isSectionVerified ? 'border-green-300' : 'border-gray-200'
                }`}
              >
                {renderSectionHeader('Company Details', 'Company, taxation, and registration information', 'company')}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Display Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="display_name"
                      value={formData.display_name}
                      onChange={handleChange}
                      disabled={sectionDisabled('company')}
                      className={`${inputClass} ${errors.display_name ? 'border-red-500' : ''}`}
                    />
                    {errors.display_name && (
                      <p className="mt-1 text-xs text-red-600">{errors.display_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      disabled={sectionDisabled('company')}
                      className={`${inputClass} ${errors.company_name ? 'border-red-500' : ''}`}
                    />
                    {errors.company_name && (
                      <p className="mt-1 text-xs text-red-600">{errors.company_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Taxation Details <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="company_taxation"
                      value={formData.company_taxation}
                      onChange={handleChange}
                      disabled={sectionDisabled('company')}
                      placeholder="e.g. GST, VAT, TIN"
                      className={`${inputClass} ${errors.company_taxation ? 'border-red-500' : ''}`}
                    />
                    {errors.company_taxation && (
                      <p className="mt-1 text-xs text-red-600">{errors.company_taxation}</p>
                    )}
                  </div>

                  {existing.company_taxation_docs && existing.company_taxation_docs.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Taxation Documents
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {existing.company_taxation_docs.map((doc, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs"
                          >
                            <FileText size={12} />
                            <a
                              href={doc.signed_url || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline"
                            >
                              {doc.name}
                            </a>
                            {!sectionDisabled('company') && (
                              <button
                                type="button"
                                onClick={() => handleDeleteDoc('company_taxation_docs', doc.path)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <MultiFileUpload
                    label="Taxation Documents (Multiple Upload)"
                    accept={DOC_ACCEPT}
                    maxSize={MAX_FILE_MB}
                    value={compTaxDocFiles}
                    onChange={setCompTaxDocFiles}
                    disabled={sectionDisabled('company')}
                    helperText="JPG, PNG, or PDF — multiple files allowed"
                  />

                  <div>
                    {existing.logo_signed_url && !logoFile && (
                      <img
                        src={existing.logo_signed_url}
                        alt="Logo"
                        className="w-20 h-20 rounded-lg object-cover mb-2 border border-gray-200"
                      />
                    )}
                    <FileUpload
                      label="Upload Logo"
                      accept={IMAGE_ACCEPT}
                      maxSize={MAX_FILE_MB}
                      value={logoFile || existing.logo_signed_url || null}
                      onChange={setLogoFile}
                      disabled={sectionDisabled('company')}
                      required
                      error={errors.logo}
                      helperText="JPG or PNG, max 5MB"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Registration No <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="company_registration"
                      value={formData.company_registration}
                      onChange={handleChange}
                      disabled={sectionDisabled('company')}
                      placeholder="Enter company registration number"
                      className={`${inputClass} ${errors.company_registration ? 'border-red-500' : ''}`}
                    />
                    {errors.company_registration && (
                      <p className="mt-1 text-xs text-red-600">{errors.company_registration}</p>
                    )}
                  </div>

                  {existing.company_registration_docs &&
                    existing.company_registration_docs.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Registration Documents
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {existing.company_registration_docs.map((doc, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs"
                            >
                              <FileText size={12} />
                              <a
                                href={doc.signed_url || '#'}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:underline"
                              >
                                {doc.name}
                              </a>
                              {!sectionDisabled('company') && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteDoc('company_registration_docs', doc.path)
                                  }
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  <MultiFileUpload
                    label="Registration Documents (Multiple Upload)"
                    accept={DOC_ACCEPT}
                    maxSize={MAX_FILE_MB}
                    value={compRegDocFiles}
                    onChange={setCompRegDocFiles}
                    disabled={sectionDisabled('company')}
                    helperText="JPG, PNG, or PDF — multiple files allowed"
                  />
                </div>
              </div>
              )}
            </div>

            {/* Right column — owner details */}
            <div className="col-span-12 lg:col-span-6">
              <div
                className={`rounded-xl shadow-sm border p-6 space-y-4 ${sectionHeaderClass(isSectionVerified)} ${
                  isSectionVerified ? 'border-green-300' : 'border-gray-200'
                }`}
              >
                {renderSectionHeader('Owner Details', 'Personal information and identity documents', 'owner')}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={sectionDisabled('owner')}
                  className={`${inputClass} ${errors.name ? 'border-red-500' : ''}`}
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Father&apos;s Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="father_name"
                  value={formData.father_name}
                  onChange={handleChange}
                  disabled={sectionDisabled('owner')}
                  className={`${inputClass} ${errors.father_name ? 'border-red-500' : ''}`}
                />
                {errors.father_name && <p className="mt-1 text-xs text-red-600">{errors.father_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mother&apos;s Name</label>
                <input
                  type="text"
                  name="mother_name"
                  value={formData.mother_name}
                  onChange={handleChange}
                  disabled={sectionDisabled('owner')}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile No <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="mobile_no"
                  value={formData.mobile_no}
                  onChange={handleChange}
                  disabled={sectionDisabled('owner')}
                  className={`${inputClass} ${errors.mobile_no ? 'border-red-500' : ''}`}
                />
                {errors.mobile_no && <p className="mt-1 text-xs text-red-600">{errors.mobile_no}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email ID</label>
                <input
                  type="email"
                  name="email_id"
                  value={formData.email_id}
                  onChange={handleChange}
                  disabled={sectionDisabled('owner')}
                  className={`${inputClass} ${errors.email_id ? 'border-red-500' : ''}`}
                />
                {errors.email_id && <p className="mt-1 text-xs text-red-600">{errors.email_id}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={sectionDisabled('owner')}
                  rows={2}
                  className={`${inputClass} ${errors.address ? 'border-red-500' : ''}`}
                />
                {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  disabled={sectionDisabled('owner')}
                  className={`${inputClass} ${errors.dob ? 'border-red-500' : ''}`}
                />
                {errors.dob && <p className="mt-1 text-xs text-red-600">{errors.dob}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nationality <span className="text-red-500">*</span>
                </label>
                <select
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  disabled={sectionDisabled('owner')}
                  className={`${inputClass} ${errors.nationality ? 'border-red-500' : ''}`}
                >
                  <option value="">Select nationality</option>
                  {NATIONALITIES.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                {errors.nationality && <p className="mt-1 text-xs text-red-600">{errors.nationality}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  disabled={sectionDisabled('owner')}
                  className={`${inputClass} ${errors.gender ? 'border-red-500' : ''}`}
                >
                  <option value="">Select gender</option>
                  {GENDERS.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                {errors.gender && <p className="mt-1 text-xs text-red-600">{errors.gender}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marital Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="marital_status"
                  value={formData.marital_status}
                  onChange={handleChange}
                  disabled={sectionDisabled('owner')}
                  className={`${inputClass} ${errors.marital_status ? 'border-red-500' : ''}`}
                >
                  <option value="">Select status</option>
                  {MARITAL_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.marital_status && <p className="mt-1 text-xs text-red-600">{errors.marital_status}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                <textarea
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                  disabled={sectionDisabled('owner')}
                  rows={2}
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Any other details</label>
                <textarea
                  name="other_details"
                  value={formData.other_details}
                  onChange={handleChange}
                  disabled={sectionDisabled('owner')}
                  rows={2}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              {/* Owner Photo upload */}
              <div className="md:col-span-2">
                <div className="flex items-start gap-4">
                  {existing.photo_signed_url && !photoFile && (
                    <img
                      src={existing.photo_signed_url}
                      alt="Owner"
                      className="w-20 h-20 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <FileUpload
                      label="Owner Photo"
                      accept={IMAGE_ACCEPT}
                      maxSize={MAX_FILE_MB}
                      value={photoFile || existing.photo_signed_url || null}
                      onChange={setPhotoFile}
                      disabled={sectionDisabled('owner')}
                      helperText="JPG or PNG, max 5MB"
                    />
                  </div>
                </div>
              </div>
              <div>
                {existing.id_proof_signed_url && !idProofFile && (
                  <a
                    href={existing.id_proof_signed_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-primary-600 hover:underline mb-2"
                  >
                    <FileText size={14} /> View uploaded ID Proof
                  </a>
                )}
                <FileUpload
                  label="Id Proof"
                  accept={DOC_ACCEPT}
                  maxSize={MAX_FILE_MB}
                  preview={false}
                  value={idProofFile}
                  onChange={setIdProofFile}
                  disabled={sectionDisabled('owner')}
                  required
                  error={errors.id_proof}
                  helperText="JPG, PNG, or PDF, max 5MB"
                />
              </div>

              <div>
                {existing.address_proof_signed_url && !addressProofFile && (
                  <a
                    href={existing.address_proof_signed_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-primary-600 hover:underline mb-2"
                  >
                    <FileText size={14} /> View uploaded Address Proof
                  </a>
                )}
                <FileUpload
                  label="Address Proof"
                  accept={DOC_ACCEPT}
                  maxSize={MAX_FILE_MB}
                  preview={false}
                  value={addressProofFile}
                  onChange={setAddressProofFile}
                  disabled={sectionDisabled('owner')}
                  required
                  error={errors.address_proof}
                  helperText="JPG, PNG, or PDF, max 5MB"
                />
              </div>

              <div className="md:col-span-2">
                {existing.other_documents && existing.other_documents.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {existing.other_documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs">
                        <FileText size={12} />
                        <a href={doc.signed_url || '#'} target="_blank" rel="noreferrer" className="hover:underline">
                          {doc.name}
                        </a>
                        {!sectionDisabled('owner') && (
                          <button
                            type="button"
                            onClick={() => handleDeleteDoc('other_documents', doc.path)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <MultiFileUpload
                  label="Any other details (Multiple Upload)"
                  accept={DOC_ACCEPT}
                  maxSize={MAX_FILE_MB}
                  value={otherDocFiles}
                  onChange={setOtherDocFiles}
                  disabled={sectionDisabled('owner')}
                  helperText="JPG, PNG, or PDF — multiple files allowed"
                />
              </div>
            </div>
              </div>
            </div>
          </div>

          {!isGloballyReadOnly && currentStatus === 'pending' && (
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={saving === 'all'}
                className="px-8 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving === 'all' ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Submit for Verification
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="text-green-600" size={28} />
          </div>
          <h3 className="text-lg font-semibold text-green-800 mb-2">Profile Verified</h3>
          <p className="text-sm text-gray-600 mb-4 max-w-lg mx-auto">{postSubmissionMessage}</p>
        </div>
      )}
    </div>
  );
};
