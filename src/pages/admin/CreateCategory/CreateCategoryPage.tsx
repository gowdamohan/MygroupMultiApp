import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api.config';
import { CategoryManagerInline } from './CategoryManagerInline';

interface App {
  id: number;
  name: string;
  apps_name: string;
  order_by: number;
  locking_json?: {
    lockCategory?: boolean;
    lockSubCategory?: boolean;
    lockChildCategory?: boolean;
    customFormConfig?: any;
  } | null;
}

type TabType = 'myapps' | 'mycompany' | 'onlineapps';

export const CreateCategoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('myapps');
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [selectedAppForLock, setSelectedAppForLock] = useState<App | null>(null);
  const [lockSettings, setLockSettings] = useState({ lockCategory: false, lockSubCategory: false, lockChildCategory: false });

  // Tab configuration
  const tabs: { id: TabType; label: string; appsNameFilter: string }[] = [
    { id: 'myapps', label: 'My Apps', appsNameFilter: 'My Apps' },
    { id: 'mycompany', label: 'My Company', appsNameFilter: 'My Company' },
    { id: 'onlineapps', label: 'Online Apps', appsNameFilter: 'Online Apps' } // Note: typo in DB
  ];

  useEffect(() => {
    fetchApps();
  }, [activeTab]);

  const fetchApps = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/apps`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const currentTab = tabs.find(t => t.id === activeTab);
        const filteredApps = response.data.data.filter(
          (app: App) => app.apps_name === currentTab?.appsNameFilter
        );
        // Fetch locking data for My Apps
        if (activeTab === 'myapps') {
          const appsWithLocking = await Promise.all(
            filteredApps.map(async (app: App) => {
              try {
                const lockResponse = await axios.get(`${API_BASE_URL}/admin/apps/${app.id}/locking`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                if (lockResponse.data.success) {
                  return { ...app, locking_json: lockResponse.data.data.locking_json };
                }
              } catch (err) {
                // If locking endpoint fails, app just won't have locking_json
              }
              return app;
            })
          );
          setApps(appsWithLocking);
        } else {
          setApps(filteredApps);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch apps');
    } finally {
      setLoading(false);
    }
  };

  const handleAppClick = (app: App) => {
    setSelectedApp(app);
  };

  const handleLockClick = (app: App, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAppForLock(app);
    setLockSettings({
      lockCategory: app.locking_json?.lockCategory || false,
      lockSubCategory: app.locking_json?.lockSubCategory || false,
      lockChildCategory: app.locking_json?.lockChildCategory || false
    });
    setLockModalOpen(true);
  };

  const handleLockSave = async () => {
    if (!selectedAppForLock) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(
        `${API_BASE_URL}/admin/apps/${selectedAppForLock.id}/locking`,
        lockSettings,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Locking settings updated successfully');
      setLockModalOpen(false);
      fetchApps();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update locking settings');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Create Category</h1>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSelectedApp(null);
            }}
            className={`px-6 py-3 font-semibold text-sm transition-all rounded-t-lg ${
              activeTab === tab.id
                ? 'bg-green-500 text-black'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg"
          >
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Multi-Panel Layout: Panel 1 (Apps) + Panels 2-5 (Categories) */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {/* Panel 1: Apps List */}
        <div className="w-48 min-w-[192px] bg-gray-800 rounded-lg overflow-hidden flex flex-col">
          <div className="bg-gray-700 text-white text-center py-2 font-semibold text-sm">
            {tabs.find(t => t.id === activeTab)?.label}
          </div>
          <div className="flex-1 p-2 space-y-1 overflow-y-auto max-h-[500px]">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            ) : apps.length === 0 ? (
              <p className="text-gray-400 text-center text-xs py-4">No apps found</p>
            ) : (
              apps.map((app) => (
                <div
                  key={app.id}
                  className={`w-full flex items-center justify-between px-3 py-2 text-white text-sm rounded transition-colors ${
                    selectedApp?.id === app.id ? 'bg-green-600' : 'hover:bg-gray-700'
                  }`}
                >
                  <button
                    onClick={() => handleAppClick(app)}
                    className="flex-1 text-left"
                  >
                    {app.name}
                  </button>
                  {activeTab === 'myapps' && (
                    <button
                      onClick={(e) => handleLockClick(app, e)}
                      className="p-1 text-purple-300 hover:bg-gray-600 rounded transition-colors ml-2"
                      title="Lock Settings"
                    >
                      <Lock size={16} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panels 2-5: Category Management (inline) */}
        {selectedApp ? (
          <CategoryManagerInline app={selectedApp} />
        ) : (
          <div className="flex-1 bg-gray-100 rounded-lg p-8 flex items-center justify-center min-h-[400px]">
            <p className="text-gray-500 text-lg">Select an app from the list to manage its categories</p>
          </div>
        )}
      </div>

      {/* Lock Settings Modal */}
      <AnimatePresence>
        {lockModalOpen && selectedAppForLock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setLockModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Lock Settings - {selectedAppForLock.name}</h3>
              <p className="text-sm text-gray-600 mb-4">Lock category levels to prevent adding children at those levels.</p>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lockSettings.lockCategory}
                    onChange={(e) => setLockSettings({ ...lockSettings, lockCategory: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-gray-700 font-medium">Lock Category Level</span>
                    <p className="text-xs text-gray-500">Prevents adding Categories under Sub Apps</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lockSettings.lockSubCategory}
                    onChange={(e) => setLockSettings({ ...lockSettings, lockSubCategory: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-gray-700 font-medium">Lock Sub Category Level</span>
                    <p className="text-xs text-gray-500">Prevents adding Sub Categories under Categories</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lockSettings.lockChildCategory}
                    onChange={(e) => setLockSettings({ ...lockSettings, lockChildCategory: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-gray-700 font-medium">Lock Child Category Level</span>
                    <p className="text-xs text-gray-500">Prevents adding Child Categories under Sub Categories</p>
                  </div>
                </label>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleLockSave}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setLockModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

