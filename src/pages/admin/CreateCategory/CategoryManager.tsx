import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api.config';

interface Category {
  id: number;
  app_id: number;
  parent_id: number | null;
  category_name: string;
  category_type?: string;
  category_image?: string;
  sort_order: number;
  status: number;
  children?: Category[];
}

interface App {
  id: number;
  name: string;
  apps_name: string;
}

interface CategoryManagerProps {
  app: App;
  onBack: () => void;
}

const MAX_MAIN_CATEGORIES = 6;

export const CategoryManager: React.FC<CategoryManagerProps> = ({ app, onBack }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormParentId, setAddFormParentId] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    category_name: '',
    category_type: '',
    category_image: '',
    sort_order: 0,
    status: 1
  });

  useEffect(() => {
    fetchCategories();
  }, [app.id]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/apps/${app.id}/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  // Build hierarchical tree
  const buildTree = (cats: Category[], parentId: number | null = null): Category[] => {
    return cats
      .filter(cat => cat.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(cat => ({
        ...cat,
        children: buildTree(cats, cat.id)
      }));
  };

  // Get main categories (parent_id = null)
  const mainCategories = categories.filter(c => c.parent_id === null);
  const regularMainCategories = mainCategories.filter(c => c.category_type !== 'addon');
  const addonCategories = mainCategories.filter(c => c.category_type === 'addon');
  const canAddMainCategory = regularMainCategories.length < MAX_MAIN_CATEGORIES;

  const handleAddCategory = (parentId: number | null = null) => {
    if (parentId === null && !canAddMainCategory) {
      setError(`Maximum ${MAX_MAIN_CATEGORIES} main categories allowed`);
      setTimeout(() => setError(''), 3000);
      return;
    }
    setAddFormParentId(parentId);
    setFormData({ category_name: '', category_type: '', category_image: '', sort_order: 0, status: 1 });
    setShowAddForm(true);
    setEditingCategory(null);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      category_name: category.category_name,
      category_type: category.category_type || '',
      category_image: category.category_image || '',
      sort_order: category.sort_order,
      status: category.status
    });
    setShowAddForm(true);
    setAddFormParentId(category.parent_id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('accessToken');
      const payload = {
        app_id: app.id,
        parent_id: addFormParentId,
        ...formData,
        sort_order: parseInt(formData.sort_order.toString()) || 0
      };

      if (editingCategory) {
        await axios.put(`${API_BASE_URL}/admin/categories/${editingCategory.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Category updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/admin/categories`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Category created successfully');
      }

      setShowAddForm(false);
      setEditingCategory(null);
      setFormData({ category_name: '', category_type: '', category_image: '', sort_order: 0, status: 1 });
      fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this category and all its subcategories?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/admin/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Category deleted successfully');
      fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const toggleExpand = (categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Render subcategory tree recursively
  const renderSubcategoryTree = (cats: Category[], level: number = 0): JSX.Element => {
    return (
      <div className={`${level > 0 ? 'ml-4 border-l-2 border-gray-200 pl-4' : ''}`}>
        {cats.map((cat) => {
          const isExpanded = expandedCategories.has(cat.id);
          const hasChildren = cat.children && cat.children.length > 0;

          return (
            <div key={cat.id} className="py-2">
              <div className="flex items-center justify-between bg-white rounded-lg p-3 hover:bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-2">
                  {hasChildren && (
                    <button onClick={() => toggleExpand(cat.id)} className="p-1 hover:bg-gray-200 rounded">
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  )}
                  {!hasChildren && <div className="w-6" />}
                  <span className="font-medium">{cat.category_name}</span>
                  {cat.category_type && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{cat.category_type}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleAddCategory(cat.id)}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                    title="Add Subcategory"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    onClick={() => handleEditCategory(cat)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {hasChildren && isExpanded && renderSubcategoryTree(cat.children!, level + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  const treeData = buildTree(categories);
  const selectedCategoryTree = selectedMainCategory
    ? treeData.find(c => c.id === selectedMainCategory.id)
    : null;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
          <p className="text-gray-600">App: {app.name}</p>
        </div>
      </div>

      {/* Messages */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Left Panel - Main Categories */}
        <div className="w-72 space-y-4">
          {/* Sub Apps Section */}
          <div className="bg-yellow-300 rounded-lg overflow-hidden">
            <div className="bg-blue-600 text-white text-center py-2 font-semibold">
              Sub Apps ({regularMainCategories.length}/{MAX_MAIN_CATEGORIES})
            </div>
            <div className="p-2 space-y-1">
              {regularMainCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedMainCategory(cat)}
                  className={`w-full text-left px-3 py-2 font-medium rounded transition-colors ${
                    selectedMainCategory?.id === cat.id ? 'bg-yellow-400' : 'hover:bg-yellow-200'
                  }`}
                >
                  {cat.category_name}
                </button>
              ))}
              {canAddMainCategory && (
                <button
                  onClick={() => handleAddCategory(null)}
                  className="w-full text-left px-3 py-2 text-blue-600 hover:bg-yellow-200 rounded flex items-center gap-2"
                >
                  <Plus size={16} /> Add Category
                </button>
              )}
            </div>
          </div>

          {/* Add-ons Section */}
          <div className="bg-yellow-300 rounded-lg overflow-hidden">
            <div className="bg-green-500 text-black text-center py-2 font-semibold">
              Add ons
            </div>
            <div className="p-2 space-y-1">
              {addonCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedMainCategory(cat)}
                  className={`w-full text-left px-3 py-2 font-medium rounded transition-colors ${
                    selectedMainCategory?.id === cat.id ? 'bg-yellow-400' : 'hover:bg-yellow-200'
                  }`}
                >
                  {cat.category_name}
                </button>
              ))}
              <button
                onClick={() => {
                  setAddFormParentId(null);
                  setFormData({ category_name: '', category_type: 'addon', category_image: '', sort_order: 0, status: 1 });
                  setShowAddForm(true);
                  setEditingCategory(null);
                }}
                className="w-full text-left px-3 py-2 text-blue-600 hover:bg-yellow-200 rounded flex items-center gap-2"
              >
                <Plus size={16} /> Add Add-on
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Subcategories */}
        <div className="flex-1 bg-white rounded-lg border border-gray-200 p-6">
          {selectedMainCategory ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 text-white px-4 py-2 rounded font-semibold">
                    Category
                  </div>
                  <h2 className="text-xl font-bold">{selectedMainCategory.category_name}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAddCategory(selectedMainCategory.id)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                  >
                    <Plus size={18} /> Add Subcategory
                  </button>
                  <button
                    onClick={() => handleEditCategory(selectedMainCategory)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(selectedMainCategory.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              {selectedCategoryTree?.children && selectedCategoryTree.children.length > 0 ? (
                renderSubcategoryTree(selectedCategoryTree.children)
              ) : (
                <p className="text-gray-500 text-center py-8">No subcategories. Click "Add Subcategory" to create one.</p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Select a category from the left panel to manage its subcategories
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-lg font-bold mb-4">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                  <input
                    type="text"
                    value={formData.category_name}
                    onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Type</label>
                  <input
                    type="text"
                    value={formData.category_type}
                    onChange={(e) => setFormData({ ...formData, category_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., product, service, addon"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={formData.category_image}
                    onChange={(e) => setFormData({ ...formData, category_image: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Save size={18} /> {editingCategory ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingCategory(null);
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
                  >
                    <X size={18} /> Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

