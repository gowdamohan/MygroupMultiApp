import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, GripVertical, Eye, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api.config';

interface FormField {
  id: string;
  label: string;
  field_type: 'text' | 'number' | 'email' | 'tel' | 'textarea' | 'radio' | 'checkbox' | 'dropdown' | 'date' | 'file' | 'price' | 'sku' | 'stock' | 'image' | 'variant';
  placeholder?: string;
  required: boolean;
  enabled: boolean;
  validation?: string;
  options?: string[]; // For radio, checkbox, dropdown, variant
  mapping?: string; // For mapped dropdowns
  order: number;
  min?: number; // For number, price, stock
  max?: number; // For number, price, stock
  step?: number; // For number, price
}

interface CategoryCustomFormBuilderProps {
  categoryId: number;
  categoryName: string;
  appId: number;
  onClose: () => void;
}

export const CategoryCustomFormBuilder: React.FC<CategoryCustomFormBuilderProps> = ({ 
  categoryId, 
  categoryName,
  appId,
  onClose 
}) => {
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formName, setFormName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // E-commerce preset fields
  const ecommercePresets: FormField[] = [
    {
      id: 'product_name',
      label: 'Product Name',
      field_type: 'text',
      placeholder: 'Enter product name',
      required: true,
      enabled: true,
      order: 1
    },
    {
      id: 'product_description',
      label: 'Product Description',
      field_type: 'textarea',
      placeholder: 'Enter product description',
      required: true,
      enabled: true,
      order: 2
    },
    {
      id: 'price',
      label: 'Price',
      field_type: 'price',
      placeholder: '0.00',
      required: true,
      enabled: true,
      min: 0,
      step: 0.01,
      order: 3
    },
    {
      id: 'compare_price',
      label: 'Compare at Price (Original Price)',
      field_type: 'price',
      placeholder: '0.00',
      required: false,
      enabled: true,
      min: 0,
      step: 0.01,
      order: 4
    },
    {
      id: 'sku',
      label: 'SKU (Stock Keeping Unit)',
      field_type: 'sku',
      placeholder: 'Enter SKU',
      required: false,
      enabled: true,
      order: 5
    },
    {
      id: 'stock_quantity',
      label: 'Stock Quantity',
      field_type: 'stock',
      placeholder: '0',
      required: false,
      enabled: true,
      min: 0,
      order: 6
    },
    {
      id: 'product_images',
      label: 'Product Images',
      field_type: 'image',
      placeholder: 'Upload product images',
      required: false,
      enabled: true,
      order: 7
    },
    {
      id: 'product_category',
      label: 'Product Category',
      field_type: 'dropdown',
      placeholder: 'Select category',
      required: false,
      enabled: true,
      options: [],
      order: 8
    },
    {
      id: 'product_tags',
      label: 'Product Tags',
      field_type: 'text',
      placeholder: 'Enter tags (comma-separated)',
      required: false,
      enabled: true,
      order: 9
    },
    {
      id: 'weight',
      label: 'Weight (kg)',
      field_type: 'number',
      placeholder: '0.00',
      required: false,
      enabled: true,
      min: 0,
      step: 0.01,
      order: 10
    },
    {
      id: 'dimensions',
      label: 'Dimensions (L x W x H in cm)',
      field_type: 'text',
      placeholder: 'e.g., 10 x 5 x 3',
      required: false,
      enabled: true,
      order: 11
    },
    {
      id: 'shipping_class',
      label: 'Shipping Class',
      field_type: 'dropdown',
      placeholder: 'Select shipping class',
      required: false,
      enabled: true,
      options: ['Standard', 'Express', 'Overnight', 'International'],
      order: 12
    },
    {
      id: 'product_status',
      label: 'Product Status',
      field_type: 'radio',
      placeholder: '',
      required: true,
      enabled: true,
      options: ['Active', 'Draft', 'Archived'],
      order: 13
    },
    {
      id: 'variants',
      label: 'Product Variants',
      field_type: 'variant',
      placeholder: 'Add variants (Size, Color, etc.)',
      required: false,
      enabled: true,
      options: [],
      order: 14
    }
  ];

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

  // Add preset e-commerce fields
  const addEcommercePresets = () => {
    if (formFields.length > 0) {
      if (!window.confirm('This will add e-commerce preset fields. Existing fields will be preserved.')) {
        return;
      }
    }
    const existingIds = new Set(formFields.map(f => f.id));
    const newPresets = ecommercePresets.filter(p => !existingIds.has(p.id));
    setFormFields([...formFields, ...newPresets]);
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
        `${API_BASE_URL}/admin/categories/${categoryId}/custom-form`,
        {
          form_schema: {
            form_name: formName,
            fields: formFields.sort((a, b) => a.order - b.order)
          }
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
          `${API_BASE_URL}/admin/categories/${categoryId}/custom-form`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data.success && response.data.data && response.data.data.form_schema) {
          const schema = response.data.data.form_schema;
          setFormName(schema.form_name || `Custom Form - ${categoryName}`);
          setFormFields(schema.fields || []);
        } else {
          setFormName(`Custom Form - ${categoryName}`);
        }
      } catch (err) {
        console.error('Error loading form:', err);
        setFormName(`Custom Form - ${categoryName}`);
      }
    };

    loadForm();
  }, [categoryId, categoryName]);

  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'number', label: 'Number Input' },
    { value: 'price', label: 'Price' },
    { value: 'sku', label: 'SKU' },
    { value: 'stock', label: 'Stock Quantity' },
    { value: 'email', label: 'Email Input' },
    { value: 'tel', label: 'Phone Input' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkboxes' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'date', label: 'Date Picker' },
    { value: 'file', label: 'File Upload' },
    { value: 'image', label: 'Image Upload (Multiple)' },
    { value: 'variant', label: 'Product Variant' }
  ];

  const mappingOptions = [
    { value: '', label: 'None' },
    { value: 'country', label: 'Country (from country_tbl)' },
    { value: 'state', label: 'State (from state_tbl)' },
    { value: 'district', label: 'District (from district_tbl)' },
    { value: 'education', label: 'Education (from education)' },
    { value: 'profession', label: 'Profession (from profession)' }
  ];

  const renderPreview = () => {
    return (
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Form Preview</h3>
        {formFields
          .filter(f => f.enabled)
          .sort((a, b) => a.order - b.order)
          .map((field) => (
            <div key={field.id} className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {field.field_type === 'textarea' && (
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder={field.placeholder}
                  rows={4}
                  disabled
                />
              )}
              {field.field_type === 'price' && (
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder={field.placeholder}
                  min={field.min}
                  step={field.step || 0.01}
                  disabled
                />
              )}
              {field.field_type === 'stock' && (
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder={field.placeholder}
                  min={field.min || 0}
                  disabled
                />
              )}
              {field.field_type === 'image' && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500">
                  Click to upload images
                </div>
              )}
              {field.field_type === 'variant' && (
                <div className="border border-gray-300 rounded-lg p-3 text-gray-500">
                  Variant options will be displayed here
                </div>
              )}
              {!['textarea', 'price', 'stock', 'image', 'variant'].includes(field.field_type) && (
                <input
                  type={field.field_type === 'number' ? 'number' : 'text'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder={field.placeholder}
                  disabled
                />
              )}
            </div>
          ))}
      </div>
    );
  };

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
          <div className="flex items-center gap-3">
            <ShoppingCart className="text-blue-600" size={24} />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">E-Commerce Form Builder</h2>
              <p className="text-sm text-gray-500">Category: {categoryName}</p>
            </div>
          </div>
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
          {showPreview ? (
            renderPreview()
          ) : (
            <>
              {/* Form Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Form Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter form name"
                />
              </div>

              {/* Quick Add E-commerce Presets */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900 mb-1">E-Commerce Preset Fields</h3>
                    <p className="text-xs text-blue-700">Quickly add common e-commerce fields like Product Name, Price, SKU, Stock, Images, etc.</p>
                  </div>
                  <button
                    onClick={addEcommercePresets}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 text-sm"
                  >
                    <Plus size={16} />
                    Add Presets
                  </button>
                </div>
              </div>

              {/* Fields List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Form Fields</h3>
                  <button
                    onClick={addField}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Add Field
                  </button>
                </div>

                {formFields.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No fields added yet. Click "Add Presets" for e-commerce fields or "Add Field" to create custom fields.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formFields
                      .sort((a, b) => a.order - b.order)
                      .map((field, index) => (
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

                              {/* Min/Max/Step for number/price/stock */}
                              {(field.field_type === 'number' || field.field_type === 'price' || field.field_type === 'stock') && (
                                <>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Min Value
                                    </label>
                                    <input
                                      type="number"
                                      value={field.min || ''}
                                      onChange={(e) => updateField(field.id, { min: e.target.value ? parseFloat(e.target.value) : undefined })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                      placeholder="Min"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Max Value
                                    </label>
                                    <input
                                      type="number"
                                      value={field.max || ''}
                                      onChange={(e) => updateField(field.id, { max: e.target.value ? parseFloat(e.target.value) : undefined })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                      placeholder="Max"
                                    />
                                  </div>
                                  {field.field_type === 'price' && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Step
                                      </label>
                                      <input
                                        type="number"
                                        value={field.step || 0.01}
                                        onChange={(e) => updateField(field.id, { step: e.target.value ? parseFloat(e.target.value) : 0.01 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        placeholder="0.01"
                                      />
                                    </div>
                                  )}
                                </>
                              )}

                              {/* Options for dropdown/radio/checkbox/variant */}
                              {(field.field_type === 'dropdown' || field.field_type === 'radio' || field.field_type === 'checkbox' || field.field_type === 'variant') && (
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
            </>
          )}
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
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={20} />
            {loading ? 'Saving...' : 'Save Form'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
