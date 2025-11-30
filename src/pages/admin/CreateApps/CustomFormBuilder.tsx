import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, GripVertical, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api/v1';

interface FormField {
  id: string;
  label: string;
  field_type: 'text' | 'number' | 'email' | 'tel' | 'textarea' | 'radio' | 'checkbox' | 'dropdown' | 'date' | 'file';
  placeholder?: string;
  required: boolean;
  enabled: boolean;
  validation?: string;
  options?: string[]; // For radio, checkbox, dropdown
  mapping?: string; // For mapped dropdowns like 'country', 'state', 'district'
  order: number;
}

interface CustomFormBuilderProps {
  appId: number;
  onClose: () => void;
}

export const CustomFormBuilder: React.FC<CustomFormBuilderProps> = ({ appId, onClose }) => {
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formName, setFormName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Add new field
  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      label: '',
      field_type: 'text',
      placeholder: '',
      required: false,
      enabled: true,
      order: formFields.length + 1
    };
    setFormFields([...formFields, newField]);
  };

  // Update field
  const updateField = (id: string, updates: Partial<FormField>) => {
    setFormFields(formFields.map(field =>
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  // Delete field
  const deleteField = (id: string) => {
    setFormFields(formFields.filter(field => field.id !== id));
  };

  // Save form
  const handleSave = async () => {
    if (!formName.trim()) {
      setError('Form name is required');
      return;
    }

    if (formFields.length === 0) {
      setError('Please add at least one field');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_BASE_URL}/admin/apps/${appId}/custom-form`,
        {
          form_name: formName,
          fields: formFields
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSuccess('Form saved successfully!');
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save form');
    } finally {
      setLoading(false);
    }
  };

  // Load existing form if any
  useEffect(() => {
    const loadForm = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(
          `${API_BASE_URL}/admin/apps/${appId}/custom-form`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data.success && response.data.data) {
          setFormName(response.data.data.form_name || '');
          setFormFields(response.data.data.fields || []);
        }
      } catch (err) {
        console.error('Error loading form:', err);
      }
    };

    loadForm();
  }, [appId]);

  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'number', label: 'Number Input' },
    { value: 'email', label: 'Email Input' },
    { value: 'tel', label: 'Phone Input' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkboxes' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'date', label: 'Date Picker' },
    { value: 'file', label: 'File Upload' }
  ];

  const mappingOptions = [
    { value: '', label: 'None' },
    { value: 'country', label: 'Country (from country_tbl)' },
    { value: 'state', label: 'State (from state_tbl)' },
    { value: 'district', label: 'District (from district_tbl)' },
    { value: 'education', label: 'Education (from education)' },
    { value: 'profession', label: 'Profession (from profession)' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Custom Form Builder</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              title="Preview Form"
            >
              <Eye size={20} />
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-6 mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg"
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Form Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Form Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter form name"
            />
          </div>

          {/* Fields List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Form Fields</h3>
              <button
                onClick={addField}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={18} />
                Add Field
              </button>
            </div>

            {formFields.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No fields added yet. Click "Add Field" to start building your form.
              </div>
            ) : (
              <div className="space-y-4">
                {formFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-4">
                      {/* Drag Handle */}
                      <div className="pt-2 cursor-move text-gray-400">
                        <GripVertical size={20} />
                      </div>

                      {/* Field Configuration */}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Field Label */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Label <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Field label"
                          />
                        </div>

                        {/* Field Type */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Field Type
                          </label>
                          <select
                            value={field.field_type}
                            onChange={(e) => updateField(field.id, { field_type: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            {fieldTypes.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Placeholder */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Placeholder
                          </label>
                          <input
                            type="text"
                            value={field.placeholder || ''}
                            onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Placeholder text"
                          />
                        </div>

                        {/* Validation Pattern */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Validation (Regex)
                          </label>
                          <input
                            type="text"
                            value={field.validation || ''}
                            onChange={(e) => updateField(field.id, { validation: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="e.g., ^[0-9]{10}$"
                          />
                        </div>

                        {/* Mapping (for dropdowns) */}
                        {(field.field_type === 'dropdown' || field.field_type === 'radio' || field.field_type === 'checkbox') && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Data Mapping
                            </label>
                            <select
                              value={field.mapping || ''}
                              onChange={(e) => updateField(field.id, { mapping: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                              {mappingOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Custom Options (if no mapping) */}
                        {(field.field_type === 'dropdown' || field.field_type === 'radio' || field.field_type === 'checkbox') && !field.mapping && (
                          <div className="col-span-full">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Options (comma-separated)
                            </label>
                            <input
                              type="text"
                              value={field.options?.join(', ') || ''}
                              onChange={(e) => updateField(field.id, {
                                options: e.target.value.split(',').map(o => o.trim()).filter(o => o)
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              placeholder="Option 1, Option 2, Option 3"
                            />
                          </div>
                        )}

                        {/* Checkboxes */}
                        <div className="col-span-full flex gap-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateField(field.id, { required: e.target.checked })}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="text-sm text-gray-700">Required</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.enabled}
                              onChange={(e) => updateField(field.id, { enabled: e.target.checked })}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="text-sm text-gray-700">Enabled</span>
                          </label>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => deleteField(field.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={20} />
            {loading ? 'Saving...' : 'Save Form'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

