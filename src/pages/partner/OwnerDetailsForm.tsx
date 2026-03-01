import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  CheckCircle, Clock, FileText, Upload, X, Trash2, AlertCircle, Loader2
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api.config';

interface OwnerDetailsFormProps {
  registrationStatus: string;
  onStatusChange?: (newStatus: string) => void;
}

interface OwnerData {
  id?: number;
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
  // File URLs for display
  photo_signed_url?: string;
  logo_signed_url?: string;
  id_proof_signed_url?: string;
  address_proof_signed_url?: string;
  photo_path?: string;
  logo_path?: string;
  id_proof_path?: string;
  address_proof_path?: string;
  other_documents?: any[];
  company_registration_docs?: any[];
  company_taxation_docs?: any[];
}

const defaultOwnerData: OwnerData = {
  name: '', father_name: '', mother_name: '', mobile_no: '', email_id: '',
  address: '', dob: '', nationality: '', gender: '', marital_status: '',
  education: '', other_details: '', display_name: '',
  company_name: '', company_registration: '', company_taxation: '',
  other_documents: [], company_registration_docs: [], company_taxation_docs: []
};

export const OwnerDetailsForm: React.FC<OwnerDetailsFormProps> = ({ registrationStatus, onStatusChange }) => {
  const [formData, setFormData] = useState<OwnerData>(defaultOwnerData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentStatus, setCurrentStatus] = useState(registrationStatus);

  // File states
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [addressProofFile, setAddressProofFile] = useState<File | null>(null);
  const [otherDocFiles, setOtherDocFiles] = useState<File[]>([]);
  const [compRegDocFiles, setCompRegDocFiles] = useState<File[]>([]);
  const [compTaxDocFiles, setCompTaxDocFiles] = useState<File[]>([]);

  const fetchOwnerDetails = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/partner/owner-details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success && response.data.data) {
        const d = response.data.data;
        setFormData({
          ...defaultOwnerData,
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
          company_taxation: d.company_taxation || '',
          photo_signed_url: d.photo_signed_url,
          logo_signed_url: d.logo_signed_url,
          id_proof_signed_url: d.id_proof_signed_url,
          address_proof_signed_url: d.address_proof_signed_url,
          photo_path: d.photo_path,
          logo_path: d.logo_path,
          id_proof_path: d.id_proof_path,
          address_proof_path: d.address_proof_path,
          other_documents: Array.isArray(d.other_documents) ? d.other_documents : [],
          company_registration_docs: Array.isArray(d.company_registration_docs) ? d.company_registration_docs : [],
          company_taxation_docs: Array.isArray(d.company_taxation_docs) ? d.company_taxation_docs : []
        });
      }
      if (response.data.registration_status) {
        setCurrentStatus(response.data.registration_status);
      }
    } catch (err) {
      console.error('Error fetching owner details:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOwnerDetails();
  }, [fetchOwnerDetails]);

  useEffect(() => {
    setCurrentStatus(registrationStatus);
  }, [registrationStatus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validation
    const required = ['name', 'father_name', 'mobile_no', 'address', 'dob', 'nationality', 'gender', 'marital_status', 'education'];
    const missing = required.filter(f => !formData[f as keyof OwnerData]);
    if (missing.length > 0) {
      setError(`Please fill required fields: ${missing.join(', ')}`);
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('accessToken');
      const fd = new FormData();

      // Append text fields
      const textFields = [
        'name', 'father_name', 'mother_name', 'mobile_no', 'email_id',
        'address', 'dob', 'nationality', 'gender', 'marital_status',
        'education', 'other_details', 'display_name',
        'company_name', 'company_registration', 'company_taxation'
      ];
      textFields.forEach(key => {
        fd.append(key, (formData as any)[key] || '');
      });

      // Append files
      if (photoFile) fd.append('photo', photoFile);
      if (logoFile) fd.append('logo', logoFile);
      if (idProofFile) fd.append('id_proof', idProofFile);
      if (addressProofFile) fd.append('address_proof', addressProofFile);
      otherDocFiles.forEach(f => fd.append('other_documents', f));
      compRegDocFiles.forEach(f => fd.append('company_registration_docs', f));
      compTaxDocFiles.forEach(f => fd.append('company_taxation_docs', f));

      const response = await axios.post(`${API_BASE_URL}/partner/owner-details`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setSuccess('Profile submitted successfully!');
        setCurrentStatus('submitted');
        onStatusChange?.('submitted');
        // Clear file inputs
        setPhotoFile(null); setLogoFile(null); setIdProofFile(null); setAddressProofFile(null);
        setOtherDocFiles([]); setCompRegDocFiles([]); setCompTaxDocFiles([]);
        await fetchOwnerDetails();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save owner details');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDoc = async (docField: string, docPath: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/partner/owner-details/document`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { doc_field: docField, doc_path: docPath }
      });
      await fetchOwnerDetails();
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  const statusSteps = [
    { key: 'submitted', label: 'Submitted' },
    { key: 'verified', label: 'Verified' },
    { key: 'processed_for_approve', label: 'Processed for Approve' }
  ];

  const getStepStatus = (stepKey: string) => {
    const order = ['pending', 'submitted', 'verified', 'processed_for_approve', 'active'];
    const currentIdx = order.indexOf(currentStatus);
    const stepIdx = order.indexOf(stepKey);
    if (stepIdx <= currentIdx) return 'completed';
    if (stepIdx === currentIdx + 1) return 'current';
    return 'upcoming';
  };

  const isReadOnly = ['submitted', 'verified', 'processed_for_approve'].includes(currentStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Status Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Registered Successfully</h2>
          <p className="text-sm text-gray-600 mt-2 max-w-lg mx-auto">
            To proceed with your account activation, please ensure all fields in the Profile section are accurately filled and upload the necessary documentation for verification.
          </p>
        </div>

        {/* Status Steps */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {statusSteps.map((step, idx) => {
            const status = getStepStatus(step.key);
            return (
              <React.Fragment key={step.key}>
                {idx > 0 && <div className="w-8 h-0.5 bg-gray-300" />}
                <div className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                  status === 'completed' ? 'bg-green-100 text-green-700' :
                  status === 'current' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-400'
                }`}>
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
              Your Account will be verified and activated within 24 working hours.
            </p>
            <p className="text-xs text-gray-500">
              For any queries or details please send message to Admin in support chat option.
            </p>
          </div>
        )}
      </div>

      {/* Owner Details Form */}
      {currentStatus === 'pending' || currentStatus === 'submitted' ? (
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

          {/* Owner Information Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Owner Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} disabled={isReadOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100" />
              </div>
              {/* Father Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Father Name <span className="text-red-500">*</span></label>
                <input type="text" name="father_name" value={formData.father_name} onChange={handleChange} disabled={isReadOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100" />
              </div>
              {/* Mother Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mother Name</label>
                <input type="text" name="mother_name" value={formData.mother_name} onChange={handleChange} disabled={isReadOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100" />
              </div>
              {/* Mobile No */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile No <span className="text-red-500">*</span></label>
                <input type="text" name="mobile_no" value={formData.mobile_no} onChange={handleChange} disabled={isReadOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100" />
              </div>
              {/* Email ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email ID</label>
                <input type="email" name="email_id" value={formData.email_id} onChange={handleChange} disabled={isReadOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100" />
              </div>
              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address <span className="text-red-500">*</span></label>
                <textarea name="address" value={formData.address} onChange={handleChange} disabled={isReadOnly} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100" />
              </div>
              {/* DOB */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth <span className="text-red-500">*</span></label>
                <input type="date" name="dob" value={formData.dob} onChange={handleChange} disabled={isReadOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100" />
              </div>
              {/* Nationality */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nationality <span className="text-red-500">*</span></label>
                <select name="nationality" value={formData.nationality} onChange={handleChange} disabled={isReadOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100">
                  <option value="">Select Nationality</option>
                  <option value="Indian">Indian</option>
                  <option value="American">American</option>
                  <option value="British">British</option>
                  <option value="Canadian">Canadian</option>
                  <option value="Australian">Australian</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender <span className="text-red-500">*</span></label>
                <select name="gender" value={formData.gender} onChange={handleChange} disabled={isReadOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {/* Marital Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status <span className="text-red-500">*</span></label>
                <select name="marital_status" value={formData.marital_status} onChange={handleChange} disabled={isReadOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100">
                  <option value="">Select Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>
              {/* Education */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Education <span className="text-red-500">*</span></label>
                <textarea name="education" value={formData.education} onChange={handleChange} disabled={isReadOnly} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100" />
              </div>
              {/* Other Details */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Any other details</label>
                <textarea name="other_details" value={formData.other_details} onChange={handleChange} disabled={isReadOnly} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100" />
              </div>
            </div>
          </div>

          {/* Display & Photo Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Display & Photo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name for Display</label>
                <input type="text" name="display_name" value={formData.display_name} onChange={handleChange} disabled={isReadOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100" />
              </div>
              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                {formData.photo_signed_url && (
                  <img src={formData.photo_signed_url} alt="Photo" className="w-16 h-16 rounded-lg object-cover mb-2" />
                )}
                {!isReadOnly && (
                  <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                )}
              </div>
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Logo</label>
                {formData.logo_signed_url && (
                  <img src={formData.logo_signed_url} alt="Logo" className="w-16 h-16 rounded-lg object-cover mb-2" />
                )}
                {!isReadOnly && (
                  <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                )}
              </div>
            </div>
          </div>

          {/* Document Uploads Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Document Uploads</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ID Proof Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof Upload</label>
                {formData.id_proof_signed_url && (
                  <a href={formData.id_proof_signed_url} target="_blank" rel="noreferrer"
                    className="text-xs text-primary-600 hover:underline flex items-center gap-1 mb-2">
                    <FileText size={14} /> View uploaded ID Proof
                  </a>
                )}
                {!isReadOnly && (
                  <input type="file" accept="image/*,.pdf" onChange={e => setIdProofFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                )}
              </div>
              {/* Address Proof Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Proof Upload</label>
                {formData.address_proof_signed_url && (
                  <a href={formData.address_proof_signed_url} target="_blank" rel="noreferrer"
                    className="text-xs text-primary-600 hover:underline flex items-center gap-1 mb-2">
                    <FileText size={14} /> View uploaded Address Proof
                  </a>
                )}
                {!isReadOnly && (
                  <input type="file" accept="image/*,.pdf" onChange={e => setAddressProofFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                )}
              </div>
              {/* Other Documents (Multiple) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Other Documents (Multiple Upload)</label>
                {Array.isArray(formData.other_documents) && formData.other_documents.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.other_documents.map((doc: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs">
                        <FileText size={12} />
                        <span>{doc.name}</span>
                        {!isReadOnly && (
                          <button type="button" onClick={() => handleDeleteDoc('other_documents', doc.path)} className="text-red-500 hover:text-red-700">
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {!isReadOnly && (
                  <input type="file" multiple accept="image/*,.pdf" onChange={e => setOtherDocFiles(Array.from(e.target.files || []))}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                )}
              </div>
            </div>
          </div>

          {/* Company Details Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Company Details</h3>
            <div className="space-y-4">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} disabled={isReadOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100" />
              </div>
              {/* Company Registration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration</label>
                <input type="text" name="company_registration" value={formData.company_registration} onChange={handleChange} disabled={isReadOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 mb-2" />
                {Array.isArray(formData.company_registration_docs) && formData.company_registration_docs.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.company_registration_docs.map((doc: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs">
                        <FileText size={12} />
                        <span>{doc.name}</span>
                        {!isReadOnly && (
                          <button type="button" onClick={() => handleDeleteDoc('company_registration_docs', doc.path)} className="text-red-500 hover:text-red-700">
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {!isReadOnly && (
                  <input type="file" multiple accept="image/*,.pdf" onChange={e => setCompRegDocFiles(Array.from(e.target.files || []))}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                )}
              </div>
              {/* Company Taxation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taxation</label>
                <input type="text" name="company_taxation" value={formData.company_taxation} onChange={handleChange} disabled={isReadOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 mb-2" />
                {Array.isArray(formData.company_taxation_docs) && formData.company_taxation_docs.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.company_taxation_docs.map((doc: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs">
                        <FileText size={12} />
                        <span>{doc.name}</span>
                        {!isReadOnly && (
                          <button type="button" onClick={() => handleDeleteDoc('company_taxation_docs', doc.path)} className="text-red-500 hover:text-red-700">
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {!isReadOnly && (
                  <input type="file" multiple accept="image/*,.pdf" onChange={e => setCompTaxDocFiles(Array.from(e.target.files || []))}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
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
        /* Read-only status view for verified/processed */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="text-blue-600" size={28} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Under Review</h3>
          <p className="text-sm text-gray-600 mb-4">
            Your profile has been submitted and is currently being reviewed.
            Your Account will be verified and activated within 24 working hours.
          </p>
          <p className="text-xs text-gray-500">
            For any queries or details please send message to Admin in support chat option.
          </p>
        </div>
      )}
    </div>
  );
};

