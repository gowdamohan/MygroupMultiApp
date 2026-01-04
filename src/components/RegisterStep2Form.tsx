import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';

interface FormField {
  id: number;
  country?: string;
  state?: string;
  district?: string;
  education?: string;
  profession?: string;
  status?: number;
  phone_code?: string;
  country_flag?: string;
  nationality?: string;
}

interface RegisterStep2FormProps {
  registerData: {
    first_name: string;
    mobile: string;
    password: string;
    confirmPassword: string;
  };
  userId: number;
  onBack: () => void;
  onSuccess: () => void;
}

export const RegisterStep2Form: React.FC<RegisterStep2FormProps> = ({
  registerData,
  userId,
  onBack,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form fields data
  const [countries, setCountries] = useState<FormField[]>([]);
  const [states, setStates] = useState<FormField[]>([]);
  const [districts, setDistricts] = useState<FormField[]>([]);
  const [educationList, setEducationList] = useState<FormField[]>([]);
  const [professionList, setProfessionList] = useState<FormField[]>([]);
  const [nationalityList, setNationalityList] = useState<string[]>([]);

  // Show/hide conditional fields
  const [showEducationOthers, setShowEducationOthers] = useState(false);
  const [showWorkOthers, setShowWorkOthers] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    display_name: '',
    last_name: '',
    alter_number: '',
    alter_country_code: '',
    nationality: '',
    marital_status: '',
    gender: '',
    dob_date: '',
    dob_month: '',
    dob_year: '',
    country: '',
    state: '',
    district: '',
    education: '',
    profession: '',
    education_others: '',
    work_others: ''
  });

  // Fetch form fields on mount
  useEffect(() => {
    fetchFormFields();
  }, []);

  // Fetch states when country changes
  useEffect(() => {
    if (formData.country) {
      fetchStates(formData.country);
    } else {
      setStates([]);
      setDistricts([]);
    }
  }, [formData.country]);

  // Fetch districts when state changes
  useEffect(() => {
    if (formData.state) {
      fetchDistricts(formData.state);
    } else {
      setDistricts([]);
    }
  }, [formData.state]);

  const fetchFormFields = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/member/registration-fields`);
      if (response.data.success) {
        setCountries(response.data.data.countries || []);
        setEducationList(response.data.data.education || []);
        setProfessionList(response.data.data.profession || []);
        setNationalityList(response.data.data.nationalities || []);
      }
    } catch (err) {
      console.error('Error fetching form fields:', err);
    }
  };

  const fetchStates = async (countryId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/geo/states/${countryId}`);
      if (response.data.success) {
        setStates(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching states:', err);
    }
  };

  const fetchDistricts = async (stateId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/geo/districts/${stateId}`);
      if (response.data.success) {
        setDistricts(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching districts:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate required fields
    if (!formData.display_name) {
      setError('Display name is required');
      setLoading(false);
      return;
    }

    try {
      // Update user profile (Step 2)
      const response = await axios.post(`${API_BASE_URL}/member/update-profile`, {
        user_id: userId,
        ...formData
      });

      if (response.data.success) {
        alert('Registration successful! Please login to continue.');
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Profile update failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = [
    '01', '02', '03', '04', '05', '06',
    '07', '08', '09', '10', '11', '12'
  ];
  const dates = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Display Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Display Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.display_name}
          onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter display name"
          required
        />
      </div>

      {/* First Name (from Step 1 - display only) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          First Name
        </label>
        <input
          type="text"
          value={registerData.first_name}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
          disabled
        />
      </div>

      {/* Last Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Last Name
        </label>
        <input
          type="text"
          value={formData.last_name}
          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter last name"
        />
      </div>

      {/* Alternate Number with Country Code */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Alternate Number
        </label>
        <div className="flex gap-2">
          {/* Country Code Dropdown */}
          <select
            value={formData.alter_country_code}
            onChange={(e) => {
              setFormData({
                ...formData,
                alter_country_code: e.target.value
              });
            }}
            className="w-32 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Code</option>
            {countries.map((country: any) => (
              <option key={country.id} value={country.phone_code}>
                {country.country_flag} {country.phone_code}
              </option>
            ))}
          </select>

          {/* Phone Number Input */}
          <input
            type="tel"
            value={formData.alter_number}
            onChange={(e) => setFormData({ ...formData, alter_number: e.target.value })}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter alternate number"
            pattern="[0-9]{10}"
          />
        </div>
      </div>

      {/* Nationality */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nationality
        </label>
        <select
          value={formData.nationality}
          onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select Nationality</option>
          {nationalityList.map((nationality: string, index: number) => (
            <option key={index} value={nationality}>
              {nationality}
            </option>
          ))}
        </select>
      </div>

      {/* Marital Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Marital Status
        </label>
        <select
          value={formData.marital_status}
          onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select Marital Status</option>
          <option value="Single">Single</option>
          <option value="Married">Married</option>
          <option value="Divorced">Divorced</option>
          <option value="Widowed">Widowed</option>
        </select>
      </div>

      {/* Gender */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Gender
        </label>
        <select
          value={formData.gender}
          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Date of Birth */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date of Birth
        </label>
        <div className="grid grid-cols-3 gap-2">
          <select
            value={formData.dob_date}
            onChange={(e) => setFormData({ ...formData, dob_date: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Date</option>
            {dates.map(date => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>
          <select
            value={formData.dob_month}
            onChange={(e) => setFormData({ ...formData, dob_month: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Month</option>
            {months.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
          <select
            value={formData.dob_year}
            onChange={(e) => setFormData({ ...formData, dob_year: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Year</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Country */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Country
        </label>
        <select
          value={formData.country}
          onChange={(e) => setFormData({ ...formData, country: e.target.value, state: '', district: '' })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select Country</option>
          {countries.map(country => (
            <option key={country.id} value={country.id}>{country.country}</option>
          ))}
        </select>
      </div>

      {/* State */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          State
        </label>
        <select
          value={formData.state}
          onChange={(e) => setFormData({ ...formData, state: e.target.value, district: '' })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={!formData.country}
        >
          <option value="">Select State</option>
          {states.map(state => (
            <option key={state.id} value={state.id}>{state.state}</option>
          ))}
        </select>
      </div>

      {/* District */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          District
        </label>
        <select
          value={formData.district}
          onChange={(e) => setFormData({ ...formData, district: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={!formData.state}
        >
          <option value="">Select District</option>
          {districts.map(district => (
            <option key={district.id} value={district.id}>{district.district}</option>
          ))}
        </select>
      </div>

      {/* Education */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Education
        </label>
        <select
          value={formData.education}
          onChange={(e) => {
            setFormData({ ...formData, education: e.target.value });
            setShowEducationOthers(e.target.value === 'others');
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select Education</option>
          {educationList.map(edu => (
            <option key={edu.id} value={edu.id}>{edu.education}</option>
          ))}
          <option value="others">Others</option>
        </select>
      </div>

      {/* Education Others (if "Others" selected) */}
      {showEducationOthers && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Education Details <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.education_others}
            onChange={(e) => setFormData({ ...formData, education_others: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter education details"
            required
          />
        </div>
      )}

      {/* Profession */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Profession
        </label>
        <select
          value={formData.profession}
          onChange={(e) => {
            setFormData({ ...formData, profession: e.target.value });
            setShowWorkOthers(e.target.value === 'others');
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select Profession</option>
          {professionList.map(prof => (
            <option key={prof.id} value={prof.id}>{prof.profession}</option>
          ))}
          <option value="others">Others</option>
        </select>
      </div>

      {/* Work Others (if "Others" selected) */}
      {showWorkOthers && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Work Details <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.work_others}
            onChange={(e) => setFormData({ ...formData, work_others: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter work details"
            required
          />
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </div>
    </form>
  );
};

