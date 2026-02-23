import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Save } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';

interface Category {
  id: number;
  category_name: string;
  category_type: string;
  category_image: string | null;
  registration_count: number;
  current_registrations: number;
  is_disabled: boolean;
}

interface MediaRegistrationFormProps {
  category: Category;
  onBack: () => void;
  onSuccess: () => void;
}

interface Country {
  id: number;
  country: string;
  locking_json?: { lockStates?: boolean; lockDistricts?: boolean } | null;
}

interface State {
  id: number;
  state: string;
}

interface District {
  id: number;
  district: string;
}

interface Language {
  id: number;
  lang_1: string;
  lang_2: string;
}

interface ParentCategory {
  id: number;
  category_name: string;
}

interface SubCategory {
  id: number;
  category_name: string;
  registration_count: number;
  current_registrations: number;
  is_disabled: boolean;
}

type SelectType = 'International' | 'National' | 'Regional' | 'Local';
type PeriodicalType = 'Weekly' | 'Bi-weekly' | 'Fortnightly' | 'Monthly' | 'Bimonthly' | 'Quarterly' | 'Half-yearly' | 'Annually' | 'Yearly' | 'Specialized' | 'Seasonal' | 'Others';

const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MediaRegistrationForm: React.FC<MediaRegistrationFormProps> = ({
  category,
  onBack,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check if category is Magazine or E-Paper
  const isMagazineOrEPaper =
    category.category_name.toLowerCase().includes('magazine') ||
    category.category_name.toLowerCase().includes('e-paper') ||
    category.category_name.toLowerCase().includes('epaper');

  // Form data
  const [selectType, setSelectType] = useState<SelectType>('National');
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [parentCategory, setParentCategory] = useState<ParentCategory | null>(null);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>('');
  const [selectedCountryLocking, setSelectedCountryLocking] = useState<{ lockStates?: boolean; lockDistricts?: boolean } | null>(null);
  const [distributionDistricts, setDistributionDistricts] = useState<number[]>([]);

  const [formData, setFormData] = useState({
    countryId: '',
    stateId: '',
    districtId: '',
    languageId: '',
    mediaNameEnglish: '',
    mediaNameRegional: '',
    mediaLogo: null as File | null,
    periodicalType: '' as PeriodicalType | '',
    periodicalSchedule: {} as any
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchLanguages();
    fetchSubCategories();
    if (category.category_type === 'sub') {
      fetchParentCategory();
    }
  }, []);

  useEffect(() => {
    fetchCountries();
  }, []);

  // Fetch states when country is selected
  useEffect(() => {
    if (isMagazineOrEPaper) {
      // Magazine/E-Paper: fetch states if country selected and states not locked
      if (formData.countryId && !selectedCountryLocking?.lockStates) {
        fetchStates(parseInt(formData.countryId));
      } else {
        setStates([]);
      }
    } else {
      // Other media: use selectType logic
      if ((selectType === 'Regional' || selectType === 'Local') && formData.countryId) {
        fetchStates(parseInt(formData.countryId));
      } else {
        setStates([]);
      }
    }
  }, [isMagazineOrEPaper, selectType, formData.countryId, selectedCountryLocking]);

  // Fetch districts when state is selected
  useEffect(() => {
    if (isMagazineOrEPaper) {
      // Magazine/E-Paper: fetch districts if state selected and districts not locked
      if (formData.stateId && !selectedCountryLocking?.lockDistricts) {
        fetchDistricts(parseInt(formData.stateId));
      } else {
        setDistricts([]);
      }
    } else {
      // Other media: use selectType logic
      if (selectType === 'Local' && formData.stateId) {
        fetchDistricts(parseInt(formData.stateId));
      } else {
        setDistricts([]);
      }
    }
  }, [isMagazineOrEPaper, selectType, formData.stateId, selectedCountryLocking]);

  const fetchCountries = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/geo/countries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCountries(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching countries:', err);
    }
  };

  const fetchStates = async (countryId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/geo/states/${countryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStates(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching states:', err);
    }
  };

  const fetchDistricts = async (stateId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/geo/districts/${stateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setDistricts(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching districts:', err);
    }
  };

  const fetchLanguages = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/partner/languages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setLanguages(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching languages:', err);
    }
  };

  const fetchParentCategory = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${API_BASE_URL}/partner/media-categories/${category.id}/parent`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.data.success) {
        setParentCategory(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching parent category:', err);
    }
  };

  const fetchSubCategories = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const appId = user.group_id;
      const response = await axios.get(
        `${API_BASE_URL}/partner/media-sub-categories/${appId}/${category.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.data.success) {
        setSubCategories(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching sub categories:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, mediaLogo: file });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePeriodicalScheduleChange = (key: string, value: any) => {
    setFormData({
      ...formData,
      periodicalSchedule: {
        ...formData.periodicalSchedule,
        [key]: value
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const appId = user.group_id;

      const submitData = new FormData();

      submitData.append('app_id', appId.toString());
      // category_id = main category (parent_id IS NULL), parent_category_id = sub-category (parent_id IS NOT NULL)
      if (selectedSubCategoryId) {
        submitData.append('category_id', category.id.toString());
        submitData.append('parent_category_id', selectedSubCategoryId);
      } else {
        submitData.append('category_id', category.id.toString());
      }
      submitData.append('media_type', category.category_name);

      // Only send select_type for non-Magazine/E-Paper categories
      if (!isMagazineOrEPaper) {
        submitData.append('select_type', selectType);
      }

      if (formData.countryId) submitData.append('country_id', formData.countryId);
      if (formData.stateId) submitData.append('state_id', formData.stateId);
      if (formData.districtId) submitData.append('district_id', formData.districtId);
      if (formData.languageId) submitData.append('language_id', formData.languageId);

      submitData.append('media_name_english', formData.mediaNameEnglish);
      if (formData.mediaNameRegional) {
        submitData.append('media_name_regional', formData.mediaNameRegional);
      }

      if (formData.mediaLogo) {
        submitData.append('media_logo', formData.mediaLogo);
      }

      // Add periodical data for Magazine category_type
      if ((category.category_type === 'Magazines' || category.category_name.toLowerCase().includes('magazine')) && formData.periodicalType) {
        submitData.append('periodical_type', formData.periodicalType);
        submitData.append('periodical_schedule', JSON.stringify(formData.periodicalSchedule));
      }

      // Add distribution districts for Magazine/E-Paper
      if (isMagazineOrEPaper && distributionDistricts.length > 0) {
        submitData.append('distribution_districts', JSON.stringify(distributionDistricts));
      }

      const response = await axios.post(
        `${API_BASE_URL}/partner/media-channel`,
        submitData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setSuccess('Media channel registered successfully!');
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err: any) {
      console.error('Error submitting form:', err);
      setError(err.response?.data?.message || 'Failed to register media channel');
    } finally {
      setLoading(false);
    }
  };

  const renderPeriodicalSchedule = () => {
    if (!formData.periodicalType) return null;

    switch (formData.periodicalType) {
      case 'Weekly':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Day
            </label>
            <select
              value={formData.periodicalSchedule.day || ''}
              onChange={(e) => handlePeriodicalScheduleChange('day', e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select a day</option>
              {weekDays.map((day) => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
        );

      case 'Bi-weekly':
      case 'Fortnightly':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Two Dates (1-31)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <select
                value={formData.periodicalSchedule.date1 || ''}
                onChange={(e) => handlePeriodicalScheduleChange('date1', e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">First date</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((date) => (
                  <option key={date} value={date}>{date}</option>
                ))}
              </select>
              <select
                value={formData.periodicalSchedule.date2 || ''}
                onChange={(e) => handlePeriodicalScheduleChange('date2', e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Second date</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((date) => (
                  <option key={date} value={date}>{date}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'Monthly':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date (1-31)
            </label>
            <select
              value={formData.periodicalSchedule.date || ''}
              onChange={(e) => handlePeriodicalScheduleChange('date', e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select a date</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((date) => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          </div>
        );

      case 'Bimonthly':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select 6 Months (Bimonthly)
            </label>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <select
                  key={num}
                  value={formData.periodicalSchedule[`month${num}`] || ''}
                  onChange={(e) => handlePeriodicalScheduleChange(`month${num}`, e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Issue {num}</option>
                  {months.map((month) => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              ))}
            </div>
          </div>
        );

      case 'Quarterly':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select 4 Months (Quarterly)
            </label>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((quarter) => (
                <select
                  key={quarter}
                  value={formData.periodicalSchedule[`month${quarter}`] || ''}
                  onChange={(e) => handlePeriodicalScheduleChange(`month${quarter}`, e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Quarter {quarter}</option>
                  {months.map((month, idx) => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              ))}
            </div>
          </div>
        );

      case 'Half-yearly':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select 2 Months (Half-yearly)
            </label>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2].map((half) => (
                <select
                  key={half}
                  value={formData.periodicalSchedule[`month${half}`] || ''}
                  onChange={(e) => handlePeriodicalScheduleChange(`month${half}`, e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Half {half}</option>
                  {months.map((month, idx) => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              ))}
            </div>
          </div>
        );

      case 'Annually':
      case 'Yearly':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Month
            </label>
            <select
              value={formData.periodicalSchedule.month || ''}
              onChange={(e) => handlePeriodicalScheduleChange('month', e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select a month</option>
              {months.map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
        );

      case 'Specialized':
      case 'Seasonal':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Months of Publication
            </label>
            <div className="grid grid-cols-3 gap-2">
              {months.map((month) => (
                <label key={month} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(formData.periodicalSchedule.months || []).includes(month)}
                    onChange={(e) => {
                      const currentMonths = formData.periodicalSchedule.months || [];
                      const updatedMonths = e.target.checked
                        ? [...currentMonths, month]
                        : currentMonths.filter((m: string) => m !== month);
                      handlePeriodicalScheduleChange('months', updatedMonths);
                    }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm">{month}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'Others':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe Publication Schedule
            </label>
            <textarea
              value={formData.periodicalSchedule.description || ''}
              onChange={(e) => handlePeriodicalScheduleChange('description', e.target.value)}
              required
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Describe your publication schedule..."
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Register {category.category_name} Channel</h1>
          <p className="text-gray-600">Fill in the details to register your media channel</p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Media Type (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Media Type
            </label>
            <input
              type="text"
              value={category.category_name}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          {/* Category Dropdown (Sub-categories) */}
          {subCategories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedSubCategoryId}
                onChange={(e) => setSelectedSubCategoryId(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select a category</option>
                {subCategories.map((subCat) => (
                  <option
                    key={subCat.id}
                    value={subCat.id}
                    disabled={subCat.is_disabled}
                  >
                    {subCat.category_name} {subCat.is_disabled ? `(Limit Reached: ${subCat.registration_count})` : `(${subCat.current_registrations}/${subCat.registration_count})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Parent Category (if subcategory) */}
          {parentCategory && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Category
              </label>
              <input
                type="text"
                value={parentCategory.category_name}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>
          )}

          {/* Select Type - Hidden for Magazine/E-Paper */}
          {!isMagazineOrEPaper && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Type <span className="text-red-500">*</span>
              </label>
              <select
                value={selectType}
                onChange={(e) => {
                  setSelectType(e.target.value as SelectType);
                  setFormData({ ...formData, countryId: '', stateId: '', districtId: '' });
                }}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="International">International</option>
                <option value="National">National</option>
                <option value="Regional">Regional</option>
                <option value="Local">Local</option>
              </select>
            </div>
          )}

          {/* Location Fields */}
          {isMagazineOrEPaper ? (
            <>
              {/* Magazine/E-Paper: Location based on locking_json */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.countryId}
                  onChange={(e) => {
                    const selectedCountry = countries.find(c => c.id === parseInt(e.target.value));
                    setSelectedCountryLocking(selectedCountry?.locking_json || null);
                    setFormData({ ...formData, countryId: e.target.value, stateId: '', districtId: '' });
                    setDistributionDistricts([]);
                  }}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select a country</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>{country.country}</option>
                  ))}
                </select>
              </div>

              {/* State - Show if not locked */}
              {!selectedCountryLocking?.lockStates && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.stateId}
                    onChange={(e) => {
                      setFormData({ ...formData, stateId: e.target.value, districtId: '' });
                      setDistributionDistricts([]);
                    }}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select a state</option>
                    {states.map((state) => (
                      <option key={state.id} value={state.id}>{state.state}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* District - Show if not locked */}
              {!selectedCountryLocking?.lockDistricts && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    District
                  </label>
                  <select
                    value={formData.districtId}
                    onChange={(e) => setFormData({ ...formData, districtId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select a district</option>
                    {districts.map((district) => (
                      <option key={district.id} value={district.id}>{district.district}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Other media types: Location based on selectType */}
              {selectType !== 'International' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.countryId}
                      onChange={(e) => setFormData({ ...formData, countryId: e.target.value, stateId: '', districtId: '' })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select a country</option>
                      {countries.map((country) => (
                        <option key={country.id} value={country.id}>{country.country}</option>
                      ))}
                    </select>
                  </div>

                  {(selectType === 'Regional' || selectType === 'Local') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.stateId}
                        onChange={(e) => setFormData({ ...formData, stateId: e.target.value, districtId: '' })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Select a state</option>
                        {states.map((state) => (
                          <option key={state.id} value={state.id}>{state.state}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectType === 'Local' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        District <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.districtId}
                        onChange={(e) => setFormData({ ...formData, districtId: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Select a district</option>
                        {districts.map((district) => (
                          <option key={district.id} value={district.id}>{district.district}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={formData.languageId}
              onChange={(e) => setFormData({ ...formData, languageId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select a language</option>
              {languages.map((language) => (
                <option key={language.id} value={language.id}>{language.lang_1} ({language.lang_2})</option>
              ))}
            </select>
          </div>

          {/* Media Name (English) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Media Name (English) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.mediaNameEnglish}
              onChange={(e) => setFormData({ ...formData, mediaNameEnglish: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter media name in English"
            />
          </div>

          {/* Media Name (Regional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Media Name (Regional Language)
            </label>
            <input
              type="text"
              value={formData.mediaNameRegional}
              onChange={(e) => setFormData({ ...formData, mediaNameRegional: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter media name in regional language"
            />
          </div>

          {/* Media Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Media Logo
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                {logoPreview ? (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="max-w-xs max-h-48 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setFormData({ ...formData, mediaLogo: null });
                        setLogoPreview(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="text-gray-400 mb-2" size={40} />
                    <span className="text-sm text-gray-600">
                      Click to upload logo
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      PNG, JPG (will be compressed to ~100KB)
                    </span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Periodicals (for Magazines category_type) */}
          {(category.category_type === 'Magazines' || category.category_name.toLowerCase() === 'magazines') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Periodicals <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.periodicalType}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      periodicalType: e.target.value as PeriodicalType,
                      periodicalSchedule: {}
                    });
                  }}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select periodical type</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Bi-weekly">Bi-weekly / Fortnightly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Bimonthly">Bimonthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Half-yearly">Half-yearly</option>
                  <option value="Annually">Annually / Yearly</option>
                  <option value="Specialized">Specialized / Seasonal</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              {renderPeriodicalSchedule()}
            </>
          )}

          {/* Distribution (Circulation) - Only for Magazine/E-Paper */}
          {isMagazineOrEPaper && !selectedCountryLocking?.lockDistricts && districts.length > 0 && (
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution (Circulation)</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Distribution Districts
                </label>
                <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-gray-500">
                      {distributionDistricts.length} district(s) selected
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (distributionDistricts.length === districts.length) {
                          setDistributionDistricts([]);
                        } else {
                          setDistributionDistricts(districts.map(d => d.id));
                        }
                      }}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      {distributionDistricts.length === districts.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {districts.map((district) => (
                      <label key={district.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={distributionDistricts.includes(district.id)}
                          onChange={(e) => {
                            const updated = e.target.checked
                              ? [...distributionDistricts, district.id]
                              : distributionDistricts.filter(id => id !== district.id);
                            setDistributionDistricts(updated);
                          }}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm">{district.district}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Select all districts where this publication is distributed
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Please wait...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Register Channel
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

