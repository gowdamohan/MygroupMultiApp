import React, { useState, useEffect } from 'react';
import { Globe, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

interface Country {
  id: number;
  name: string;
  code: string;
  flag?: string;
}

interface CountrySelectProps {
  value?: number | string;
  onChange: (countryId: number, country?: Country) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const CountrySelect: React.FC<CountrySelectProps> = ({
  value,
  onChange,
  label = 'Country',
  placeholder = 'Select a country',
  required = false,
  error,
  disabled = false,
  className = ''
}) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      setLoading(true);
      setFetchError('');
      const response = await axios.get(`${API_BASE_URL}/geo/countries`);
      
      if (response.data.success) {
        setCountries(response.data.data);
      } else {
        setFetchError('Failed to load countries');
      }
    } catch (err: any) {
      console.error('Error fetching countries:', err);
      setFetchError(err.response?.data?.message || 'Failed to load countries');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const countryId = parseInt(e.target.value);
    const selectedCountry = countries.find(c => c.id === countryId);
    onChange(countryId, selectedCountry);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
        
        <select
          value={value || ''}
          onChange={handleChange}
          disabled={disabled || loading}
          required={required}
          className={`
            w-full pl-11 pr-4 py-2.5 border rounded-lg
            focus:ring-2 focus:ring-primary-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${loading ? 'text-gray-400' : 'text-gray-900'}
          `}
        >
          <option value="">{loading ? 'Loading...' : placeholder}</option>
          {countries.map((country) => (
            <option key={country.id} value={country.id}>
              {country.flag ? `${country.flag} ` : ''}{country.name}
            </option>
          ))}
        </select>

        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" size={20} />
        )}
      </div>

      {error && (
        <div className="mt-1 flex items-center gap-1 text-red-600 text-sm">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {fetchError && !error && (
        <div className="mt-1 flex items-center gap-1 text-red-600 text-sm">
          <AlertCircle size={14} />
          <span>{fetchError}</span>
          <button
            type="button"
            onClick={fetchCountries}
            className="ml-2 text-primary-600 hover:text-primary-700 underline"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

