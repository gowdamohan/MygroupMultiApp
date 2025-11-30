import React, { useState, useEffect } from 'react';
import { X, Save, Edit2, Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api/v1';

interface Category {
  id: number;
  app_id: number;
  parent_id: number | null;
  category_name: string;
  category_type?: string;
  category_image?: string;
  sort_order: number;
  status: number;
  parent?: Category;
  children?: Category[];
}

interface CategoryModalProps {
  appId: number;
  onClose: () => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({ appId, onClose }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    parent_id: null as number | null,
    category_name: '',
    category_type: '',
    category_image: '',
    sort_order: 0,
    status: 1
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCategories();
  }, [appId]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/apps/${appId}/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) setCategories(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('accessToken');
      const payload = {
        app_id: appId,
        ...formData,
        sort_order: parseInt(formData.sort_order.toString()) || 0
      };

      if (editingId) {
        await axios.put(`${API_BASE_URL}/admin/categories/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Category updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/admin/categories`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Category created successfully');
      }
      setFormData({ parent_id: null, category_name: '', category_type: '', category_image: '', sort_order: 0, status: 1 });
      setEditingId(null);
      fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (category: Category) => {
    setFormData({
      parent_id: category.parent_id,
      category_name: category.category_name,
      category_type: category.category_type || '',
      category_image: category.category_image || '',
      sort_order: category.sort_order,
      status: category.status
    });
    setEditingId(category.id);
  };

  const handleCancel = () => {
    setFormData({ parent_id: null, category_name: '', category_type: '', category_image: '', sort_order: 0, status: 1 });
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/admin/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Category deleted successfully');
      fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete category');
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

  const renderCategoryTree = (cats: Category[], level: number = 0): JSX.Element[] => {
    return cats.map(cat => (
      <React.Fragment key={cat.id}>
        <tr className="border-b border-gray-100 hover:bg-gray-50">
          <td className="py-2 px-4" style={{ paddingLeft: `${level * 30 + 16}px` }}>
            {level > 0 && <span className="text-gray-400 mr-2">└─</span>}
            {cat.category_name}
          </td>
          <td className="py-2 px-4 text-gray-600">{cat.category_type || '-'}</td>
          <td className="py-2 px-4 text-center">{cat.sort_order}</td>
          <td className="py-2 px-4 text-center">
            <span className={`px-2 py-1 rounded-full text-xs ${cat.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {cat.status ? 'Active' : 'Inactive'}
            </span>
          </td>
          <td className="py-2 px-4">
            <div className="flex justify-end gap-2">
              <button onClick={() => handleEdit(cat)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                <Edit2 size={16} />
              </button>
              <button onClick={() => handleDelete(cat.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                <Trash2 size={16} />
              </button>
            </div>
          </td>
        </tr>
        {cat.children && cat.children.length > 0 && renderCategoryTree(cat.children, level + 1)}
      </React.Fragment>
    ));
  };

  const treeData = buildTree(categories);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">

        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Category Management</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
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

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-md font-semibold mb-3">{editingId ? 'Edit Category' : 'Add New Category'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                  <select
                    value={formData.parent_id || ''}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                    <option value="">None (Root Level)</option>
                    {categories.filter(c => c.id !== editingId).map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.parent_id ? `  └─ ${cat.category_name}` : cat.category_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                  <input
                    type="text"
                    value={formData.category_name}
                    onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Enter category name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Type</label>
                  <input
                    type="text"
                    value={formData.category_type}
                    onChange={(e) => setFormData({ ...formData, category_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g., product, service"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Image URL</label>
                  <input
                    type="text"
                    value={formData.category_image}
                    onChange={(e) => setFormData({ ...formData, category_image: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Image URL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm">
                  <Save size={16} />
                  {editingId ? 'Update' : 'Create'}
                </button>
                {editingId && (
                  <button type="button" onClick={handleCancel} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2 text-sm">
                    <X size={16} />
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div>
            <h3 className="text-md font-semibold mb-3">Categories List</h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Category Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Type</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Order</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Status</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {treeData.length > 0 ? renderCategoryTree(treeData) : (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-500">No categories found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

