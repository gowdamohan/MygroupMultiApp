import React, { useState, useRef, useEffect, useId } from 'react';
import { Upload, X } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL, getUploadUrl } from '../../../config/api.config';

const ACCEPT = 'image/jpeg,image/jpg,image/png,image/gif,image/webp';
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

interface CategoryImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  label?: string;
}

export const CategoryImageUpload: React.FC<CategoryImageUploadProps> = ({
  value,
  onChange,
  disabled = false,
  label = 'Category Image'
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // object URL for just-selected file
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const displayUrl = previewUrl || (value ? getUploadUrl(value) : '');

  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    if (file.size > MAX_SIZE_BYTES) {
      setError('Image must be 5MB or smaller.');
      e.target.value = '';
      return;
    }
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Allowed formats: JPEG, JPG, PNG, GIF, WEBP.');
      e.target.value = '';
      return;
    }

    clearPreview();
    const objUrl = URL.createObjectURL(file);
    setPreviewUrl(objUrl);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('category_image', file);
      const token = localStorage.getItem('accessToken');
      const res = await axios.post(`${API_BASE_URL}/admin/categories/upload-image`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data?.success && res.data?.url) {
        onChange(res.data.url);
        setError('');
        clearPreview();
        setPreviewUrl(null);
      } else {
        setError(res.data?.message || 'Upload failed');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Upload failed';
      setError(msg);
    } finally {
      setUploading(false);
      e.target.value = '';
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    onChange(e.target.value);
  };

  const handleClear = () => {
    clearPreview();
    onChange('');
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  useEffect(() => {
    return () => { clearPreview(); };
  }, []);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>

      <div className="flex flex-col gap-2">
        {displayUrl && (
          <div className="relative inline-block w-28 h-28 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
            <img
              src={displayUrl}
              alt="Category preview"
              className="w-full h-full object-contain"
              onError={() => setPreviewUrl(null)}
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                title="Remove image"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {!disabled && (
          <>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
                id={inputId}
              />
              <label
                htmlFor={inputId}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm ${
                  uploading ? 'bg-gray-100 border-gray-300 cursor-not-allowed' : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Upload size={16} />
                {uploading ? 'Uploading...' : 'Upload image'}
              </label>
              <span className="text-xs text-gray-500">JPEG, PNG, GIF, WEBP · max 5MB</span>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-0.5">Or paste image URL</label>
              <input
                type="text"
                value={value}
                onChange={handleUrlChange}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
          </>
        )}

        {disabled && value && (
          <p className="text-xs text-gray-500 truncate max-w-full" title={value}>
            {value}
          </p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
};
