import React, { useState, useEffect } from 'react';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

interface District {
  id: number;
  name: string;
}

interface DistrictSelectProps {
  stateId?: number;
  value?: number | string;
  onChange: (districtId: number, district?: District) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const DistrictSelect: React.FC<DistrictSelectProps> = ({
  stateId,
  value,
  onChange,
  label = 'District/City',
  placeholder = 'Select a district',
  required = false,
  error,
  disabled = false,
  className = ''
}) => {
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (stateId) {
      fetchDistricts(stateId);
    } else {
      setDistricts([]);
      setFetchError('');
    }
  }, [stateId]);

  const fetchDistricts = async (stateId: number) => {
    try {
      setLoading(true);
      setFetchError('');
      const response = await axios.get(`${API_BASE_URL}/geo/states/${stateId}/districts`);
      
      if (response.data.success) {
        setDistricts(response.data.data);
      } else {
        setFetchError('Failed to load districts');
      }
    } catch (err: any) {
      console.error('Error fetching districts:', err);
      setFetchError(err.response?.data?.message || 'Failed to load districts');
      setDistricts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtId = parseInt(e.target.value);
    const selectedDistrict = districts.find(d => d.id === districtId);
    onChange(districtId, selectedDistrict);
  };

  const isDisabled = disabled || loading || !stateId;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
        
        <select
          value={value || ''}
          onChange={handleChange}
          disabled={isDisabled}
          required={required}
          className={`
            w-full pl-11 pr-4 py-2.5 border rounded-lg
            focus:ring-2 focus:ring-primary-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${loading || !stateId ? 'text-gray-400' : 'text-gray-900'}
          `}
        >
          <option value="">
            {!stateId ? 'Select state first' : loading ? 'Loading...' : placeholder}
          </option>
          {districts.map((district) => (
            <option key={district.id} value={district.id}>
              {district.name}
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
          {stateId && (
            <button
              type="button"
              onClick={() => fetchDistricts(stateId)}
              className="ml-2 text-primary-600 hover:text-primary-700 underline"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
};

