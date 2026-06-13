import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  CheckCircle, Clock, Upload, AlertCircle, Loader2, FileText
} from 'lucide-react';
import { API_BASE_URL } from '../config/api.config';
import { FileUpload } from './form/FileUpload';

const IMAGE_ACCEPT = 'image/jpeg,image/jpg,image/png';
const DOC_ACCEPT = 'image/jpeg,image/jpg,image/png,application/pdf';
const MAX_FILE_MB = 5;

const BUSINESS_CATEGORIES = [
  'Media & Broadcasting',
  'Advertising & Marketing',
  'Technology',
  'Retail',
  'Healthcare',
  'Education',
  'Finance',
  'Real Estate',
  'Hospitality',
  'Manufacturing',
  'Other'
];

export interface PartnerProfileCompletionFormProps {
  registrationStatus: string;
  onStatusChange?: (newStatus: string) => void;
}

interface ProfileFormData {
  display_name: string;
  company_name: string;
  business_category: string;
  office_address: string;
  owner_full_name: string;
  personal_email: string;
  mobile_number: string;
}

interface ProfileErrors {
  display_name?: string;
  company_name?: string;
  business_category?: string;
  office_address?: string;
  owner_full_name?: string;
  personal_email?: string;
  mobile_number?: string;
  company_photo?: string;
  business_license?: string;
  id_proof?: string;
}

interface ExistingFiles {
  logo_signed_url?: string;
  id_proof_signed_url?: string;
  company_registration_docs?: { name: string; path: string; signed_url?: string }[];
}

const defaultFormData: ProfileFormData = {
  display_name: '',
  company_name: '',
  business_category: '',
  office_address: '',
  owner_full_name: '',
  personal_email: '',
  mobile_number: ''
};

const validateImageFile = (file: File | null, label: string): string | undefined => {
  if (!file) return undefined;
  const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!allowed.includes(file.type)) {
    return `${label} must be JPG or PNG`;
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    return `${label} must be under ${MAX_FILE_MB}MB`;
  }
  return undefined;
};

const validateDocFile = (file: File | null, label: string): string | undefined => {
  if (!file) return undefined;
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  if (!allowed.includes(file.type)) {
    return `${label} must be JPG, PNG, or PDF`;
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    return `${label} must be under ${MAX_FILE_MB}MB`;
  }
  return undefined;
};

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100';

export const PartnerProfileCompletionForm: React.FC<PartnerProfileCompletionFormProps> = ({
  registrationStatus,
  onStatusChange
}) => {
  const [formData, setFormData] = useState<ProfileFormData>(defaultFormData);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentStatus, setCurrentStatus] = useState(registrationStatus);
  const [existing, setExisting] = useState<ExistingFiles>({});

  const [companyPhoto, setCompanyPhoto] = useState<File | null>(null);
  const [businessLicense, setBusinessLicense] = useState<File | null>(null);
  const [idProof, setIdProof] = useState<File | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/partner/owner-details`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        if (response.data.registration_status) {
          setCurrentStatus(response.data.registration_status);
        }
        const d = response.data.data;
        if (d) {
          setFormData({
            display_name: d.display_name || '',
            company_name: d.company_name || '',
            business_category: d.company_registration || '',
            office_address: d.address || '',
            owner_full_name: d.name || '',
            personal_email: d.email_id || '',
            mobile_number: d.mobile_no || ''
          });
          setExisting({
            logo_signed_url: d.logo_signed_url,
            id_proof_signed_url: d.id_proof_signed_url,
            company_registration_docs: Array.isArray(d.company_registration_docs)
              ? d.company_registration_docs
              : []
          });
        }
      }
    } catch (err) {
      console.error('Error fetching partner profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    setCurrentStatus(registrationStatus);
  }, [registrationStatus]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validateForm = (): boolean => {
    const next: ProfileErrors = {};

    if (!formData.display_name.trim()) next.display_name = 'Display name is required';
    if (!formData.company_name.trim()) next.company_name = 'Company name is required';
    if (!formData.business_category) next.business_category = 'Business category is required';
    if (!formData.office_address.trim()) next.office_address = 'Office address is required';
    if (!formData.owner_full_name.trim()) next.owner_full_name = "Owner's full name is required";
    if (!formData.personal_email.trim()) {
      next.personal_email = 'Personal email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personal_email)) {
      next.personal_email = 'Enter a valid email address';
    }
    if (!formData.mobile_number.trim()) {
      next.mobile_number = 'Mobile number is required';
    } else if (!/^[0-9+\-\s()]{8,15}$/.test(formData.mobile_number.trim())) {
      next.mobile_number = 'Enter a valid mobile number';
    }

    const photoErr = validateImageFile(companyPhoto, 'Company photo');
    if (photoErr) next.company_photo = photoErr;
    if (!companyPhoto && !existing.logo_signed_url) {
      next.company_photo = 'Company photo is required';
    }

    const licenseErr = validateDocFile(businessLicense, 'Business license');
    if (licenseErr) next.business_license = licenseErr;
    if (
      !businessLicense &&
      (!existing.company_registration_docs || existing.company_registration_docs.length === 0)
    ) {
      next.business_license = 'Business license document is required';
    }

    const idErr = validateDocFile(idProof, 'ID proof');
    if (idErr) next.id_proof = idErr;
    if (!idProof && !existing.id_proof_signed_url) {
      next.id_proof = 'ID proof document is required';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setSaving(true);

    try {
      const token = localStorage.getItem('accessToken');
      const fd = new FormData();

      fd.append('name', formData.owner_full_name.trim());
      fd.append('email_id', formData.personal_email.trim());
      fd.append('mobile_no', formData.mobile_number.trim());
      fd.append('address', formData.office_address.trim());
      fd.append('display_name', formData.display_name.trim());
      fd.append('company_name', formData.company_name.trim());
      fd.append('company_registration', formData.business_category);

      if (companyPhoto) fd.append('logo', companyPhoto);
      if (idProof) fd.append('id_proof', idProof);
      if (businessLicense) fd.append('company_registration_docs', businessLicense);

      const response = await axios.post(`${API_BASE_URL}/partner/owner-details`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setSuccess('Profile submitted successfully! Your account will be verified within 24 working hours.');
        setCurrentStatus('submitted');
        onStatusChange?.('submitted');
        setCompanyPhoto(null);
        setBusinessLicense(null);
        setIdProof(null);
        await fetchProfile();
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to submit profile');
    } finally {
      setSaving(false);
    }
  };

  const statusSteps = [
    { key: 'submitted', label: 'Submitted' },
    { key: 'verified', label: 'Verified' }
  ];

  const getStepStatus = (stepKey: string) => {
    const order = ['pending', 'submitted', 'verified', 'active'];
    const currentIdx = order.indexOf(currentStatus);
    const stepIdx = order.indexOf(stepKey);
    if (stepIdx <= currentIdx) return 'completed';
    if (stepIdx === currentIdx + 1) return 'current';
    return 'upcoming';
  };

  const isReadOnly = ['submitted', 'verified', 'processed_for_approve', 'active'].includes(currentStatus);
  const showForm = currentStatus === 'pending' || currentStatus === 'submitted';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Registered Successfully header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Registered Successfully</h2>
          <p className="text-sm text-gray-600 mt-2 max-w-lg mx-auto">
            To proceed with your account activation, please complete your partner profile below
            and upload the required documentation for verification.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 flex-wrap">
          {statusSteps.map((step, idx) => {
            const status = getStepStatus(step.key);
            return (
              <React.Fragment key={step.key}>
                {idx > 0 && <div className="w-8 h-0.5 bg-gray-300" />}
                <div
                  className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                    status === 'completed'
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

        {currentStatus !== 'pending' && (
          <div className="mt-4 text-center space-y-1">
            <p className="text-sm text-blue-600 font-medium">
              Your account will be verified and activated within 24 working hours.
            </p>
            <p className="text-xs text-gray-500">
              For any queries, please message Admin via Support Chat.
            </p>
          </div>
        )}
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">
                  Display &amp; Photo
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="display_name"
                      value={formData.display_name}
                      onChange={handleChange}
                      disabled={isReadOnly}
                      placeholder="Public display name"
                      className={`${inputClass} ${errors.display_name ? 'border-red-500' : ''}`}
                    />
                    {errors.display_name && (
                      <p className="mt-1 text-xs text-red-600">{errors.display_name}</p>
                    )}
                  </div>

                  <div>
                    {existing.logo_signed_url && !companyPhoto && (
                      <img
                        src={existing.logo_signed_url}
                        alt="Current company"
                        className="w-20 h-20 rounded-lg object-cover mb-2 border border-gray-200"
                      />
                    )}
                    <FileUpload
                      label="Profile / Company Photo"
                      accept={IMAGE_ACCEPT}
                      maxSize={MAX_FILE_MB}
                      value={companyPhoto || existing.logo_signed_url || null}
                      onChange={setCompanyPhoto}
                      disabled={isReadOnly}
                      required
                      error={errors.company_photo}
                      helperText="JPG or PNG, max 5MB"
                    />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">
                  Company Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      disabled={isReadOnly}
                      placeholder="Registered company name"
                      className={`${inputClass} ${errors.company_name ? 'border-red-500' : ''}`}
                    />
                    {errors.company_name && (
                      <p className="mt-1 text-xs text-red-600">{errors.company_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="business_category"
                      value={formData.business_category}
                      onChange={handleChange}
                      disabled={isReadOnly}
                      className={`${inputClass} ${errors.business_category ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select category</option>
                      {BUSINESS_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {errors.business_category && (
                      <p className="mt-1 text-xs text-red-600">{errors.business_category}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Office Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="office_address"
                      value={formData.office_address}
                      onChange={handleChange}
                      disabled={isReadOnly}
                      rows={3}
                      placeholder="Full office address"
                      className={`${inputClass} ${errors.office_address ? 'border-red-500' : ''}`}
                    />
                    {errors.office_address && (
                      <p className="mt-1 text-xs text-red-600">{errors.office_address}</p>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* Right column */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">
                  Owner Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Owner&apos;s Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="owner_full_name"
                      value={formData.owner_full_name}
                      onChange={handleChange}
                      disabled={isReadOnly}
                      placeholder="Legal full name"
                      className={`${inputClass} ${errors.owner_full_name ? 'border-red-500' : ''}`}
                    />
                    {errors.owner_full_name && (
                      <p className="mt-1 text-xs text-red-600">{errors.owner_full_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Personal Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="personal_email"
                      value={formData.personal_email}
                      onChange={handleChange}
                      disabled={isReadOnly}
                      placeholder="owner@example.com"
                      className={`${inputClass} ${errors.personal_email ? 'border-red-500' : ''}`}
                    />
                    {errors.personal_email && (
                      <p className="mt-1 text-xs text-red-600">{errors.personal_email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="mobile_number"
                      value={formData.mobile_number}
                      onChange={handleChange}
                      disabled={isReadOnly}
                      placeholder="+91 98765 43210"
                      className={`${inputClass} ${errors.mobile_number ? 'border-red-500' : ''}`}
                    />
                    {errors.mobile_number && (
                      <p className="mt-1 text-xs text-red-600">{errors.mobile_number}</p>
                    )}
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">
                  Document Uploads
                </h3>
                <div className="space-y-4">
                  {existing.company_registration_docs &&
                    existing.company_registration_docs.length > 0 &&
                    !businessLicense && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {existing.company_registration_docs.map((doc, idx) => (
                          <a
                            key={idx}
                            href={doc.signed_url || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-xs text-primary-600 hover:underline bg-gray-50 px-2 py-1 rounded"
                          >
                            <FileText size={12} />
                            {doc.name || 'Business License'}
                          </a>
                        ))}
                      </div>
                    )}

                  <FileUpload
                    label="Business License"
                    accept={DOC_ACCEPT}
                    maxSize={MAX_FILE_MB}
                    preview={false}
                    value={businessLicense}
                    onChange={setBusinessLicense}
                    disabled={isReadOnly}
                    required
                    error={errors.business_license}
                    helperText="JPG, PNG, or PDF, max 5MB"
                  />

                  {existing.id_proof_signed_url && !idProof && (
                    <a
                      href={existing.id_proof_signed_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-primary-600 hover:underline"
                    >
                      <FileText size={14} />
                      View uploaded ID Proof
                    </a>
                  )}

                  <FileUpload
                    label="ID Proof"
                    accept={DOC_ACCEPT}
                    maxSize={MAX_FILE_MB}
                    preview={false}
                    value={idProof}
                    onChange={setIdProof}
                    disabled={isReadOnly}
                    required
                    error={errors.id_proof}
                    helperText="JPG, PNG, or PDF, max 5MB"
                  />
                </div>
              </section>
            </div>
          </div>

          {!isReadOnly && (
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="text-blue-600" size={28} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Under Review</h3>
          <p className="text-sm text-gray-600 mb-4">
            Your profile has been submitted and is currently being reviewed.
            Your account will be verified and activated within 24 working hours.
          </p>
          <p className="text-xs text-gray-500">
            For any queries, please message Admin via Support Chat.
          </p>
        </div>
      )}
    </div>
  );
};
