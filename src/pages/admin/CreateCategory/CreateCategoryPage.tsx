import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api.config';
import { CategoryManagerInline } from './CategoryManagerInline';

interface App {
  id: number;
  name: string;
  apps_name: string;
  order_by: number;
}

type TabType = 'myapps' | 'mycompany' | 'onlineapps';

export const CreateCategoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('myapps');
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApp, setSelectedApp] = useState<App | null>(null);

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
        setApps(filteredApps);
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

      {/* Error Message */}
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
                <button
                  key={app.id}
                  onClick={() => handleAppClick(app)}
                  className={`w-full text-left px-3 py-2 text-white text-sm rounded transition-colors ${
                    selectedApp?.id === app.id ? 'bg-green-600' : 'hover:bg-gray-700'
                  }`}
                >
                  {app.name}
                </button>
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
    </div>
  );
};

