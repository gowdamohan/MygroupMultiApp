import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
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

  // Multi-panel selection state
  const [selectedSubApp, setSelectedSubApp] = useState<Category | null>(null);      // Panel 2 selection
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);   // Panel 3 selection
  const [selectedSubCategory, setSelectedSubCategory] = useState<Category | null>(null); // Panel 4 selection

  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormParentId, setAddFormParentId] = useState<number | null>(null);
  const [addFormLevel, setAddFormLevel] = useState<string>(''); // To track which panel we're adding to
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

      // Reset selections if deleted category was selected
      if (selectedSubApp?.id === id) {
        setSelectedSubApp(null);
        setSelectedCategory(null);
        setSelectedSubCategory(null);
      } else if (selectedCategory?.id === id) {
        setSelectedCategory(null);
        setSelectedSubCategory(null);
      } else if (selectedSubCategory?.id === id) {
        setSelectedSubCategory(null);
      }

      fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete category');
    }
  };

  // Handle selection functions for multi-panel navigation
  const handleSelectSubApp = (cat: Category) => {
    setSelectedSubApp(cat);
    setSelectedCategory(null);
    setSelectedSubCategory(null);
  };

  const handleSelectCategory = (cat: Category) => {
    setSelectedCategory(cat);
    setSelectedSubCategory(null);
  };

  const handleSelectSubCategory = (cat: Category) => {
    setSelectedSubCategory(cat);
  };

  // Get categories for each panel level
  const treeData = buildTree(categories);

  // Panel 3: Categories (children of selected SubApp)
  const categoryList = selectedSubApp
    ? treeData.find(c => c.id === selectedSubApp.id)?.children || []
    : [];

  // Panel 4: SubCategories (children of selected Category)
  const subCategoryList = selectedCategory
    ? categoryList.find(c => c.id === selectedCategory.id)?.children || []
    : [];

  // Panel 5: Child Categories (children of selected SubCategory, and deeper levels)
  const childCategoryList = selectedSubCategory
    ? subCategoryList.find(c => c.id === selectedSubCategory.id)?.children || []
    : [];

  // Helper function to render all deep children recursively for Panel 5
  const renderDeepChildren = (cats: Category[], level: number = 0): React.ReactNode => {
    return cats.map((cat) => (
      <div key={cat.id} className={`${level > 0 ? 'ml-4' : ''}`}>
        <div className="flex items-center justify-between py-2 px-3 hover:bg-purple-50 rounded transition-colors border-b border-gray-100">
          <span className="font-medium text-gray-800">{cat.category_name}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => openAddForm(cat.id, 'child')}
              className="p-1 text-green-600 hover:bg-green-100 rounded"
              title="Add Child"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={() => handleEditCategory(cat)}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
              title="Edit"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => handleDelete(cat.id)}
              className="p-1 text-red-600 hover:bg-red-100 rounded"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        {cat.children && cat.children.length > 0 && renderDeepChildren(cat.children, level + 1)}
      </div>
    ));
  };

  // Open add form with level tracking
  const openAddForm = (parentId: number | null, level: string) => {
    if (parentId === null && !canAddMainCategory && level !== 'addon') {
      setError(`Maximum ${MAX_MAIN_CATEGORIES} main categories allowed`);
      setTimeout(() => setError(''), 3000);
      return;
    }
    setAddFormParentId(parentId);
    setAddFormLevel(level);
    setFormData({
      category_name: '',
      category_type: level === 'addon' ? 'addon' : '',
      category_image: '',
      sort_order: 0,
      status: 1
    });
    setShowAddForm(true);
    setEditingCategory(null);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Panel component for consistent styling
  const Panel: React.FC<{
    title: string;
    headerColor: string;
    bgColor: string;
    children: React.ReactNode;
    onAdd?: () => void;
    addLabel?: string;
  }> = ({ title, headerColor, bgColor, children, onAdd, addLabel }) => (
    <div className={`w-48 min-w-[192px] ${bgColor} rounded-lg overflow-hidden flex flex-col h-full`}>
      <div className={`${headerColor} text-center py-2 font-semibold text-sm`}>
        {title}
      </div>
      <div className="flex-1 p-2 space-y-1 overflow-y-auto max-h-[400px]">
        {children}
      </div>
      {onAdd && (
        <div className="p-2 border-t border-gray-200">
          <button
            onClick={onAdd}
            className="w-full text-left px-3 py-2 text-blue-600 hover:bg-opacity-50 rounded flex items-center gap-2 text-sm"
          >
            <Plus size={14} /> {addLabel || 'Add'}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 space-y-4">
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

      {/* Multi-Panel Layout */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {/* Panel 2: Sub Apps (Main Categories) */}
        <div className="flex flex-col gap-3">
          {/* Regular Sub Apps */}
          <Panel
            title={`Sub Apps (${regularMainCategories.length}/${MAX_MAIN_CATEGORIES})`}
            headerColor="bg-primary-600 text-white"
            bgColor="bg-yellow-300"
            onAdd={canAddMainCategory ? () => openAddForm(null, 'subapp') : undefined}
            addLabel="Add Sub App"
          >
            {regularMainCategories.map((cat) => (
              <div
                key={cat.id}
                className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                  selectedSubApp?.id === cat.id ? 'bg-yellow-400' : 'hover:bg-yellow-200'
                }`}
              >
                <button
                  onClick={() => handleSelectSubApp(cat)}
                  className="flex-1 text-left font-medium text-sm"
                >
                  {cat.category_name}
                </button>
                <div className="flex items-center gap-0.5">
                  <button onClick={() => handleEditCategory(cat)} className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="Edit">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-1 text-red-600 hover:bg-red-100 rounded" title="Delete">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </Panel>

          {/* Add-ons Section */}
          <Panel
            title="Add-ons"
            headerColor="bg-green-500 text-black"
            bgColor="bg-yellow-300"
            onAdd={() => openAddForm(null, 'addon')}
            addLabel="Add Add-on"
          >
            {addonCategories.map((cat) => (
              <div
                key={cat.id}
                className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                  selectedSubApp?.id === cat.id ? 'bg-yellow-400' : 'hover:bg-yellow-200'
                }`}
              >
                <button
                  onClick={() => handleSelectSubApp(cat)}
                  className="flex-1 text-left font-medium text-sm"
                >
                  {cat.category_name}
                </button>
                <div className="flex items-center gap-0.5">
                  <button onClick={() => handleEditCategory(cat)} className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="Edit">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-1 text-red-600 hover:bg-red-100 rounded" title="Delete">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </Panel>
        </div>

        {/* Panel 3: Categories (first-level children of selected Sub App) */}
        <Panel
          title="Category"
          headerColor="bg-orange-500 text-white"
          bgColor="bg-orange-100"
          onAdd={selectedSubApp ? () => openAddForm(selectedSubApp.id, 'category') : undefined}
          addLabel="Add Category"
        >
          {selectedSubApp ? (
            categoryList.length > 0 ? (
              categoryList.map((cat) => (
                <div
                  key={cat.id}
                  className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                    selectedCategory?.id === cat.id ? 'bg-orange-300' : 'hover:bg-orange-200'
                  }`}
                >
                  <button
                    onClick={() => handleSelectCategory(cat)}
                    className="flex-1 text-left font-medium text-sm"
                  >
                    {cat.category_name}
                  </button>
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => handleEditCategory(cat)} className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="Edit">
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="p-1 text-red-600 hover:bg-red-100 rounded" title="Delete">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-xs text-center py-4">No categories</p>
            )
          ) : (
            <p className="text-gray-500 text-xs text-center py-4">Select a Sub App</p>
          )}
        </Panel>

        {/* Panel 4: Sub Categories (second-level children) */}
        <Panel
          title="Sub Category"
          headerColor="bg-teal-500 text-white"
          bgColor="bg-teal-100"
          onAdd={selectedCategory ? () => openAddForm(selectedCategory.id, 'subcategory') : undefined}
          addLabel="Add Sub Category"
        >
          {selectedCategory ? (
            subCategoryList.length > 0 ? (
              subCategoryList.map((cat) => (
                <div
                  key={cat.id}
                  className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                    selectedSubCategory?.id === cat.id ? 'bg-teal-300' : 'hover:bg-teal-200'
                  }`}
                >
                  <button
                    onClick={() => handleSelectSubCategory(cat)}
                    className="flex-1 text-left font-medium text-sm"
                  >
                    {cat.category_name}
                  </button>
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => handleEditCategory(cat)} className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="Edit">
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="p-1 text-red-600 hover:bg-red-100 rounded" title="Delete">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-xs text-center py-4">No sub categories</p>
            )
          ) : (
            <p className="text-gray-500 text-xs text-center py-4">Select a Category</p>
          )}
        </Panel>

        {/* Panel 5: Child Categories (third-level and deeper) */}
        <Panel
          title="Child Category"
          headerColor="bg-purple-500 text-white"
          bgColor="bg-purple-100"
          onAdd={selectedSubCategory ? () => openAddForm(selectedSubCategory.id, 'child') : undefined}
          addLabel="Add Child"
        >
          {selectedSubCategory ? (
            childCategoryList.length > 0 ? (
              <div className="space-y-1">
                {renderDeepChildren(childCategoryList)}
              </div>
            ) : (
              <p className="text-gray-500 text-xs text-center py-4">No child categories</p>
            )
          ) : (
            <p className="text-gray-500 text-xs text-center py-4">Select a Sub Category</p>
          )}
        </Panel>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Type</label>
                  <input
                    type="text"
                    value={formData.category_type}
                    onChange={(e) => setFormData({ ...formData, category_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., product, service, addon"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={formData.category_image}
                    onChange={(e) => setFormData({ ...formData, category_image: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2"
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

