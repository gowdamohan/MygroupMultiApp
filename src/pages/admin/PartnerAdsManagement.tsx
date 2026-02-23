import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Loader2, Megaphone } from 'lucide-react';
import { API_BASE_URL } from '../../config/api.config';

type AdType = 'ads1' | 'ads2';

interface AppOption {
  id: number;
  name: string;
}

interface PartnerAd {
  id: number;
  app_id: number;
  image_path: string | null;
  image_url: string | null;
  scrolling_text: string | null;
  type: AdType | null;
  slot: number | null;
  signed_url?: string | null;
}

interface RowState {
  file: File | null;
  displayUrl: string | null;
  scrollingText: string;
  saving: boolean;
}

const SLOTS = [1, 2, 3] as const;

export const PartnerAdsManagement: React.FC = () => {
  const [apps, setApps] = useState<AppOption[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [ads, setAds] = useState<PartnerAd[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingApps, setLoadingApps] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const getRowKey = (adType: AdType, slot: number) => `${adType}-${slot}`;

  const [rowState, setRowState] = useState<{ [key: string]: RowState }>(() => {
    const init: { [key: string]: RowState } = {};
    (['ads1', 'ads2'] as const).forEach(adType => {
      SLOTS.forEach(slot => {
        init[getRowKey(adType, slot)] = { file: null, displayUrl: null, scrollingText: '', saving: false };
      });
    });
    return init;
  });

  useEffect(() => {
    fetchApps();
  }, []);

  useEffect(() => {
    if (selectedAppId) fetchAds();
  }, [selectedAppId]);

  const fetchApps = async () => {
    try {
      setLoadingApps(true);
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_BASE_URL}/admin/apps`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const appList = res.data.data || [];
        setApps(appList);
        if (appList.length > 0) setSelectedAppId(String(appList[0].id));
      }
    } catch {
      console.error('Failed to fetch apps');
    } finally {
      setLoadingApps(false);
    }
  };

  const fetchAds = async () => {
    const token = localStorage.getItem('accessToken');
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/partner-ads`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { app_id: selectedAppId, limit: 100 }
      });
      if (res.data.success) {
        const list: PartnerAd[] = res.data.data || [];
        setAds(list);
        setRowState(prev => {
          const next = { ...prev };
          (['ads1', 'ads2'] as const).forEach(adType => {
            SLOTS.forEach(slot => {
              const key = getRowKey(adType, slot);
              const ad = list.find(a => a.type === adType && a.slot === slot);
              next[key] = {
                ...prev[key],
                file: null,
                displayUrl: ad ? (ad.signed_url || ad.image_url || null) : null,
                scrollingText: ad?.scrolling_text || '',
                saving: false
              };
            });
          });
          return next;
        });
      }
    } catch {
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  const setFileForRow = (adType: AdType, slot: number, file: File | null) => {
    const key = getRowKey(adType, slot);
    setRowState(prev => ({ ...prev, [key]: { ...prev[key], file } }));
  };

  const setScrollingTextForRow = (adType: AdType, slot: number, text: string) => {
    const key = getRowKey(adType, slot);
    setRowState(prev => ({ ...prev, [key]: { ...prev[key], scrollingText: text } }));
  };

  const handleSaveRow = async (adType: AdType, slot: number) => {
    const key = getRowKey(adType, slot);
    const state = rowState[key];
    const token = localStorage.getItem('accessToken');

    if (!state.file && !state.scrollingText) {
      setMessage({ type: 'error', text: 'Provide an image or scrolling text to save.' });
      return;
    }

    setRowState(prev => ({ ...prev, [key]: { ...prev[key], saving: true } }));
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('app_id', selectedAppId);
      formData.append('type', adType);
      formData.append('slot', String(slot));
      if (state.file) formData.append('image', state.file);
      formData.append('scrolling_text', state.scrollingText);

      const res = await axios.post(`${API_BASE_URL}/partner-ads/save-row`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Saved.' });
        setFileForRow(adType, slot, null);
        fetchAds();
      } else throw new Error(res.data.message);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Save failed.' });
    } finally {
      setRowState(prev => ({ ...prev, [key]: { ...prev[key], saving: false } }));
    }
  };

  const renderSectionTable = (adType: AdType, title: string) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <h3 className="text-lg font-semibold text-gray-900 px-4 py-3 border-b border-gray-200 bg-gray-50">
        {title}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700 w-12">#</th>
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">File Upload</th>
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">Scrolling Text</th>
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700 w-28">Save</th>
            </tr>
          </thead>
          <tbody>
            {SLOTS.map(slot => {
              const key = getRowKey(adType, slot);
              const state = rowState[key];
              const hasContent = !!state.file || !!state.scrollingText;
              return (
                <tr key={slot} className="hover:bg-gray-50/50">
                  <td className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700">{slot}</td>
                  <td className="border border-gray-300 px-3 py-2">
                    <input
                      ref={el => { fileInputRefs.current[key] = el; }}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,video/mp4"
                      className="block w-full text-sm text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 file:text-sm"
                      onChange={e => {
                        const f = e.target.files?.[0] ?? null;
                        setFileForRow(adType, slot, f);
                      }}
                    />
                    {state.file && (
                      <span className="text-xs text-gray-500 mt-0.5 block truncate">{state.file.name}</span>
                    )}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    <input
                      type="text"
                      value={state.scrollingText}
                      onChange={e => setScrollingTextForRow(adType, slot, e.target.value)}
                      placeholder="Enter scrolling text..."
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => handleSaveRow(adType, slot)}
                      disabled={state.saving || !hasContent}
                      className="flex items-center justify-center gap-1 w-full px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {state.saving ? <Loader2 className="animate-spin" size={16} /> : 'Save'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Preview row */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-4">
        {SLOTS.map(slot => {
          const key = getRowKey(adType, slot);
          const state = rowState[key];
          const src = state.displayUrl || (state.file ? URL.createObjectURL(state.file) : null);
          return (
            <div key={slot} className="flex flex-col items-center">
              <span className="text-xs text-gray-500 mb-1">Slot {slot}</span>
              {src ? (
                <img
                  src={src}
                  alt={`Slot ${slot}`}
                  className="w-16 h-16 object-cover rounded border border-gray-200"
                  onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect fill="%23f3f4f6" width="64" height="64"/><text x="32" y="34" fill="%239ca3af" font-size="10" text-anchor="middle">Error</text></svg>'; }}
                />
              ) : (
                <div className="w-16 h-16 rounded border border-dashed border-gray-300 bg-gray-100 flex items-center justify-center text-xs text-gray-400">—</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  if (loadingApps) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Megaphone size={24} /> Partner Ads Management
        </h2>
        <p className="text-gray-600 mt-1">Manage partner ads per app. Each section has 3 slots for image upload and scrolling text.</p>
      </div>

      {/* App Selector */}
      <div className="flex items-center gap-4 mb-6">
        <label className="text-sm font-medium text-gray-700">Select App:</label>
        <select
          value={selectedAppId}
          onChange={e => setSelectedAppId(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
        >
          {apps.map(app => (
            <option key={app.id} value={String(app.id)}>{app.name}</option>
          ))}
        </select>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-1">{renderSectionTable('ads1', 'Ads1 (Section 1)')}</div>
          <div className="lg:col-span-1">{renderSectionTable('ads2', 'Ads2 (Section 2)')}</div>
        </div>
      )}
    </div>
  );
};

