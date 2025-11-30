import React, { useState, useRef } from 'react';
import { Upload, X, File, Image as ImageIcon, AlertCircle, Check } from 'lucide-react';

interface FileUploadProps {
  value?: File | string | null;
  onChange: (file: File | null) => void;
  label?: string;
  accept?: string;
  maxSize?: number; // in MB
  preview?: boolean;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  helperText?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  value,
  onChange,
  label = 'Upload File',
  accept = 'image/*',
  maxSize = 5, // 5MB default
  preview = true,
  required = false,
  error,
  disabled = false,
  className = '',
  helperText
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate preview URL when file changes
  React.useEffect(() => {
    if (value && typeof value === 'object' && 'name' in value && 'size' in value) {
      // It's a File object
      const url = URL.createObjectURL(value as File);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof value === 'string') {
      setPreviewUrl(value);
    } else {
      setPreviewUrl(null);
    }
  }, [value]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;

    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Check file type if accept is specified
    if (accept && !file.type.match(accept.replace('*', '.*'))) {
      alert(`Invalid file type. Accepted: ${accept}`);
      return;
    }

    onChange(file);
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const isImage = accept.includes('image');
  const hasFile = (value && typeof value === 'object' && 'name' in value) || (typeof value === 'string' && value);

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-all
          ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'}
          ${error ? 'border-red-500' : ''}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer hover:border-primary-400'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
        />

        {hasFile && preview && previewUrl && isImage ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-48 mx-auto rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X size={16} />
            </button>
          </div>
        ) : hasFile ? (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <File className="text-primary-600" size={24} />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {(value && typeof value === 'object' && 'name' in value) ? (value as File).name : 'Uploaded file'}
                </p>
                {(value && typeof value === 'object' && 'size' in value) && (
                  <p className="text-xs text-gray-500">
                    {((value as File).size / 1024).toFixed(2)} KB
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="p-1 text-red-500 hover:bg-red-50 rounded"
            >
              <X size={20} />
            </button>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="mx-auto text-gray-400 mb-3" size={40} />
            <p className="text-sm text-gray-600 mb-1">
              <span className="text-primary-600 font-medium">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              {accept} (max {maxSize}MB)
            </p>
          </div>
        )}
      </div>

      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}

      {error && (
        <div className="mt-1 flex items-center gap-1 text-red-600 text-sm">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

