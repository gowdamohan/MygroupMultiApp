import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Lock, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api.config';
import { CategoryCustomFormBuilder } from './CategoryCustomFormBuilder';

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
  locking_json?: {
    lockSubCategory?: boolean;
    lockChildCategory?: boolean;
    customFormConfig?: any;
  } | null;
}

interface CategoryManagerInlineProps {
  app: App;
}

const MAX_MAIN_CATEGORIES = 6;

export const CategoryManagerInline: React.FC<CategoryManagerInlineProps> = ({ app }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [appLocking, setAppLocking] = useState<App['locking_json']>(null);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [selectedCategoryForForm, setSelectedCategoryForForm] = useState<{ id: number; name: string } | null>(null);

  // Multi-panel selection state
  const [selectedSubApp, setSelectedSubApp] = useState<Category | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<Category | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormParentId, setAddFormParentId] = useState<number | null>(null);
  const [addFormLevel, setAddFormLevel] = useState<string>('');
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
    fetchAppLocking();
    // Reset selections when app changes
    setSelectedSubApp(null);
    setSelectedCategory(null);
    setSelectedSubCategory(null);
  }, [app.id]);

  const fetchCategories = async () => {
    setLoading(true);
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

  const fetchAppLocking = async () => {
    if (app.apps_name !== 'My Apps') return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/apps/${app.id}/locking`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAppLocking(response.data.data.locking_json);
      }
    } catch (err: any) {
      // If endpoint doesn't exist or fails, set to null
      setAppLocking(null);
    }
  };

  // Helper functions to check if levels are locked
  const isCategoryLocked = (): boolean => {
    return app.apps_name === 'My Apps' && appLocking?.lockCategory === true;
  };

  const isSubCategoryLocked = (): boolean => {
    return app.apps_name === 'My Apps' && appLocking?.lockSubCategory === true;
  };

  const isChildCategoryLocked = (): boolean => {
    return app.apps_name === 'My Apps' && appLocking?.lockChildCategory === true;
  };

  const handleCustomFormClick = (category: Category) => {
    setSelectedCategoryForForm({ id: category.id, name: category.category_name });
    setShowFormBuilder(true);
  };

  const buildTree = (cats: Category[], parentId: number | null = null): Category[] => {
    return cats
      .filter(cat => cat.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(cat => ({ ...cat, children: buildTree(cats, cat.id) }));
  };

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
    if (!window.confirm('Delete this category and all subcategories?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/admin/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (selectedSubApp?.id === id) {
        setSelectedSubApp(null); setSelectedCategory(null); setSelectedSubCategory(null);
      } else if (selectedCategory?.id === id) {
        setSelectedCategory(null); setSelectedSubCategory(null);
      } else if (selectedSubCategory?.id === id) {
        setSelectedSubCategory(null);
      }
      fetchCategories();
      setSuccess('Deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

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

  const treeData = buildTree(categories);
  const categoryList = selectedSubApp ? treeData.find(c => c.id === selectedSubApp.id)?.children || [] : [];
  const subCategoryList = selectedCategory ? categoryList.find(c => c.id === selectedCategory.id)?.children || [] : [];
  const childCategoryList = selectedSubCategory ? subCategoryList.find(c => c.id === selectedSubCategory.id)?.children || [] : [];

  const renderDeepChildren = (cats: Category[], level: number = 0): React.ReactNode => {
    return cats.map((cat) => {
      // Check if this is a leaf node (no children) - last level child category
      const isLeafNode = !cat.children || cat.children.length === 0;
      
      return (
        <div key={cat.id} className={`${level > 0 ? 'ml-3' : ''}`}>
          <div className="flex items-center justify-between py-1.5 px-2 hover:bg-purple-50 rounded border-b border-gray-100">
            <span className="text-sm font-medium">{cat.category_name}</span>
            <div className="flex items-center gap-0.5">
              <button onClick={() => openAddForm(cat.id, 'child')} className="p-1 text-green-600 hover:bg-green-100 rounded"><Plus size={12} /></button>
              {/* Show custom form icon for leaf nodes (last level) or when child category is locked */}
              {(isLeafNode || isChildCategoryLocked()) && (
                <button 
                  onClick={() => handleCustomFormClick(cat)} 
                  className="p-1 text-purple-600 hover:bg-purple-100 rounded" 
                  title="Custom Form"
                >
                  <FileText size={12} />
                </button>
              )}
              <button onClick={() => handleEditCategory(cat)} className="p-1 text-blue-600 hover:bg-blue-100 rounded"><Edit2 size={12} /></button>
              {/* <button onClick={() => handleDelete(cat.id)} className="p-1 text-red-600 hover:bg-red-100 rounded"><Trash2 size={12} /></button> */}
            </div>
          </div>
          {cat.children && cat.children.length > 0 && renderDeepChildren(cat.children, level + 1)}
        </div>
      );
    });
  };

  const Panel: React.FC<{
    title: string;
    headerColor: string;
    bgColor: string;
    children: React.ReactNode;
    onAdd?: () => void;
    addLabel?: string;
  }> = ({ title, headerColor, bgColor, children, onAdd, addLabel }) => (
    <div className={`w-48 min-w-[192px] ${bgColor} rounded-lg overflow-hidden flex flex-col`}>
      <div className={`${headerColor} text-center py-2 font-semibold text-sm`}>{title}</div>
      <div className="flex-1 p-2 space-y-1 overflow-y-auto max-h-[400px]">{children}</div>
      {onAdd && (
        <div className="p-2 border-t border-gray-200">
          <button onClick={onAdd} className="w-full text-left px-3 py-1.5 text-blue-600 hover:bg-opacity-50 rounded flex items-center gap-2 text-sm">
            <Plus size={14} /> {addLabel || 'Add'}
          </button>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <>
      {/* Messages */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed top-4 right-4 bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg z-50">{error}</motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed top-4 right-4 bg-green-100 border border-green-300 text-green-700 px-4 py-2 rounded-lg z-50">{success}</motion.div>
        )}
      </AnimatePresence>

      {/* Panel 2: Sub Apps */}
      <div className="flex flex-col gap-3">
        <Panel title={`Sub Apps (${regularMainCategories.length}/${MAX_MAIN_CATEGORIES})`} headerColor="bg-primary-600 text-white" bgColor="bg-yellow-300"
          onAdd={canAddMainCategory ? () => openAddForm(null, 'subapp') : undefined} addLabel="Add Sub App">
          {regularMainCategories.map((cat) => (
            <div key={cat.id} className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer ${selectedSubApp?.id === cat.id ? 'bg-yellow-400' : 'hover:bg-yellow-200'}`}>
              <button onClick={() => handleSelectSubApp(cat)} className="flex-1 text-left font-medium text-sm">{cat.category_name}</button>
              <div className="flex gap-0.5">
                <button onClick={() => handleEditCategory(cat)} className="p-1 text-blue-600 hover:bg-blue-100 rounded"><Edit2 size={12} /></button>
                {/* <button onClick={() => handleDelete(cat.id)} className="p-1 text-red-600 hover:bg-red-100 rounded"><Trash2 size={12} /></button> */}
              </div>
            </div>
          ))}
        </Panel>
        <Panel title="Add-ons" headerColor="bg-green-500 text-black" bgColor="bg-yellow-300" onAdd={() => openAddForm(null, 'addon')} addLabel="Add Add-on">
          {addonCategories.map((cat) => (
            <div key={cat.id} className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer ${selectedSubApp?.id === cat.id ? 'bg-yellow-400' : 'hover:bg-yellow-200'}`}>
              <button onClick={() => handleSelectSubApp(cat)} className="flex-1 text-left font-medium text-sm">{cat.category_name}</button>
              <div className="flex gap-0.5">
                <button onClick={() => handleEditCategory(cat)} className="p-1 text-blue-600 hover:bg-blue-100 rounded"><Edit2 size={12} /></button>
                {/* <button onClick={() => handleDelete(cat.id)} className="p-1 text-red-600 hover:bg-red-100 rounded"><Trash2 size={12} /></button> */}
              </div>
            </div>
          ))}
        </Panel>
      </div>

      {/* Panel 3: Categories */}
      <Panel 
        title="Category" 
        headerColor="bg-orange-500 text-white" 
        bgColor="bg-orange-100"
        onAdd={selectedSubApp && !isCategoryLocked() ? () => openAddForm(selectedSubApp.id, 'category') : undefined} 
        addLabel={isCategoryLocked() ? "Locked" : "Add Category"}
      >
        {selectedSubApp ? (categoryList.length > 0 ? categoryList.map((cat) => (
          <div key={cat.id} className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer ${selectedCategory?.id === cat.id ? 'bg-orange-300' : 'hover:bg-orange-200'}`}>
            <button onClick={() => handleSelectCategory(cat)} className="flex-1 text-left font-medium text-sm">{cat.category_name}</button>
            <div className="flex gap-0.5">
              {(isCategoryLocked() || isSubCategoryLocked()) && (
                <button 
                  onClick={() => handleCustomFormClick(cat)} 
                  className="p-1 text-purple-600 hover:bg-purple-100 rounded" 
                  title="Custom Form"
                >
                  <FileText size={12} />
                </button>
              )}
              <button onClick={() => handleEditCategory(cat)} className="p-1 text-blue-600 hover:bg-blue-100 rounded"><Edit2 size={12} /></button>
              {/* <button onClick={() => handleDelete(cat.id)} className="p-1 text-red-600 hover:bg-red-100 rounded"><Trash2 size={12} /></button> */}
            </div>
          </div>
        )) : <p className="text-gray-500 text-xs text-center py-4">No categories</p>) : <p className="text-gray-500 text-xs text-center py-4">Select a Sub App</p>}
        {isCategoryLocked() && selectedSubApp && (
          <div className="px-2 py-1 text-xs text-purple-600 flex items-center gap-1">
            <Lock size={10} /> Category level is locked
          </div>
        )}
      </Panel>

      {/* Panel 4: Sub Categories */}
      <Panel 
        title="Sub Category" 
        headerColor="bg-teal-500 text-white" 
        bgColor="bg-teal-100"
        onAdd={selectedCategory && !isSubCategoryLocked() ? () => openAddForm(selectedCategory.id, 'subcategory') : undefined} 
        addLabel={isSubCategoryLocked() ? "Locked" : "Add Sub Category"}
      >
        {selectedCategory ? (subCategoryList.length > 0 ? subCategoryList.map((cat) => (
          <div key={cat.id} className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer ${selectedSubCategory?.id === cat.id ? 'bg-teal-300' : 'hover:bg-teal-200'}`}>
            <button onClick={() => handleSelectSubCategory(cat)} className="flex-1 text-left font-medium text-sm">{cat.category_name}</button>
            <div className="flex gap-0.5">
              {isChildCategoryLocked() && (
                <button 
                  onClick={() => handleCustomFormClick(cat)} 
                  className="p-1 text-purple-600 hover:bg-purple-100 rounded" 
                  title="Custom Form"
                >
                  <FileText size={12} />
                </button>
              )}
              <button onClick={() => handleEditCategory(cat)} className="p-1 text-blue-600 hover:bg-blue-100 rounded"><Edit2 size={12} /></button>
              {/* <button onClick={() => handleDelete(cat.id)} className="p-1 text-red-600 hover:bg-red-100 rounded"><Trash2 size={12} /></button> */}
            </div>
          </div>
        )) : <p className="text-gray-500 text-xs text-center py-4">No sub categories</p>) : <p className="text-gray-500 text-xs text-center py-4">Select a Category</p>}
        {isSubCategoryLocked() && selectedCategory && (
          <div className="px-2 py-1 text-xs text-purple-600 flex items-center gap-1">
            <Lock size={10} /> Sub Category level is locked
          </div>
        )}
      </Panel>

      {/* Panel 5: Child Categories */}
      <Panel 
        title="Child Category" 
        headerColor="bg-purple-500 text-white" 
        bgColor="bg-purple-100"
        onAdd={selectedSubCategory && !isChildCategoryLocked() ? () => openAddForm(selectedSubCategory.id, 'child') : undefined} 
        addLabel={isChildCategoryLocked() ? "Locked" : "Add Child"}
      >
        {selectedSubCategory ? (childCategoryList.length > 0 ? <div>{renderDeepChildren(childCategoryList)}</div> : <p className="text-gray-500 text-xs text-center py-4">No child categories</p>) : <p className="text-gray-500 text-xs text-center py-4">Select a Sub Category</p>}
        {isChildCategoryLocked() && selectedSubCategory && (
          <div className="px-2 py-1 text-xs text-purple-600 flex items-center gap-1">
            <Lock size={10} /> Child Category level is locked
          </div>
        )}
      </Panel>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-lg font-bold mb-4">{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                  <input type="text" value={formData.category_name} onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Type</label>
                  <input type="text" value={formData.category_type} onChange={(e) => setFormData({ ...formData, category_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="e.g., product, service" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                    <input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2">
                    <Save size={18} /> {editingCategory ? 'Update' : 'Create'}
                  </button>
                  <button type="button" onClick={() => { setShowAddForm(false); setEditingCategory(null); }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2">
                    <X size={18} /> Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Form Builder Modal */}
      {showFormBuilder && selectedCategoryForForm && (
        <CategoryCustomFormBuilder
          categoryId={selectedCategoryForForm.id}
          categoryName={selectedCategoryForForm.name}
          appId={app.id}
          onClose={() => {
            setShowFormBuilder(false);
            setSelectedCategoryForForm(null);
            fetchCategories();
          }}
        />
      )}
    </>
  );
};

