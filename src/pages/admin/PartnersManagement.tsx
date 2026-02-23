import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';
import { PartnersManagement as AppPartnersManagement } from '../app/PartnersManagement';
import { Loader2 } from 'lucide-react';

interface AppOption {
  id: number;
  name: string;
  apps_name?: string;
}

export const PartnersManagement: React.FC = () => {
  const [apps, setApps] = useState<AppOption[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [selectedAppName, setSelectedAppName] = useState<string>('');
  const [loadingApps, setLoadingApps] = useState(true);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      setLoadingApps(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/apps`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const appList = response.data.data || [];
        setApps(appList);
        if (appList.length > 0) {
          setSelectedAppId(String(appList[0].id));
          setSelectedAppName(appList[0].name);
        }
      }
    } catch (err) {
      console.error('Failed to fetch apps:', err);
    } finally {
      setLoadingApps(false);
    }
  };

  const handleAppChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const appId = e.target.value;
    setSelectedAppId(appId);
    const app = apps.find(a => String(a.id) === appId);
    setSelectedAppName(app?.name || '');
  };

  if (loadingApps) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* App Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Select App:</label>
        <select
          value={selectedAppId}
          onChange={handleAppChange}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
        >
          {apps.map(app => (
            <option key={app.id} value={String(app.id)}>
              {app.name}
            </option>
          ))}
        </select>
      </div>

      {/* Existing Partners Management Component */}
      {selectedAppId && (
        <AppPartnersManagement appId={selectedAppId} appName={selectedAppName} />
      )}
    </div>
  );
};

