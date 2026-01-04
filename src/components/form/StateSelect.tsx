import React, { useState, useEffect } from 'react';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';

interface State {
  id: number;
  name: string;
}

interface StateSelectProps {
  countryId?: number;
  value?: number | string;
  onChange: (stateId: number, state?: State) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const StateSelect: React.FC<StateSelectProps> = ({
  countryId,
  value,
  onChange,
  label = 'State/Province',
  placeholder = 'Select a state',
  required = false,
  error,
  disabled = false,
  className = ''
}) => {
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (countryId) {
      fetchStates(countryId);
    } else {
      setStates([]);
      setFetchError('');
    }
  }, [countryId]);

  const fetchStates = async (countryId: number) => {
    try {
      setLoading(true);
      setFetchError('');
      const response = await axios.get(`${API_BASE_URL}/geo/countries/${countryId}/states`);
      
      if (response.data.success) {
        setStates(response.data.data);
      } else {
        setFetchError('Failed to load states');
      }
    } catch (err: any) {
      console.error('Error fetching states:', err);
      setFetchError(err.response?.data?.message || 'Failed to load states');
      setStates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stateId = parseInt(e.target.value);
    const selectedState = states.find(s => s.id === stateId);
    onChange(stateId, selectedState);
  };

  const isDisabled = disabled || loading || !countryId;

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
            ${loading || !countryId ? 'text-gray-400' : 'text-gray-900'}
          `}
        >
          <option value="">
            {!countryId ? 'Select country first' : loading ? 'Loading...' : placeholder}
          </option>
          {states.map((state) => (
            <option key={state.id} value={state.id}>
              {state.name}
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
          {countryId && (
            <button
              type="button"
              onClick={() => fetchStates(countryId)}
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

