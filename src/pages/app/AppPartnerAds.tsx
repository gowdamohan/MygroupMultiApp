import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Loader2, Megaphone } from 'lucide-react';
import { API_BASE_URL } from '../../config/api.config';

type AdType = 'ads1' | 'ads2';

interface PartnerAd {
  id: number;
  app_id: number;
  image_path: string | null;
  image_url: string | null;
  url: string | null;
  type: AdType | null;
  slot: number | null;
  signed_url?: string | null;
}

interface RowState {
  file: File | null;
  displayUrl: string | null;
  url: string;
  saving: boolean;
}

interface AppPartnerAdsProps {
  appId: string | undefined;
}

const SLOTS = [1, 2, 3] as const;

export const AppPartnerAds: React.FC<AppPartnerAdsProps> = ({ appId }) => {
  const [ads, setAds] = useState<PartnerAd[]>([]);
  const [loading, setLoading] = useState(false);
  const [headerScrollingText, setHeaderScrollingText] = useState('');
  const [savingScrollingText, setSavingScrollingText] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const getRowKey = (adType: AdType, slot: number) => `${adType}-${slot}`;

  const [rowState, setRowState] = useState<{ [key: string]: RowState }>(() => {
    const init: { [key: string]: RowState } = {};
    (['ads1', 'ads2'] as const).forEach(adType => {
      SLOTS.forEach(slot => {
        init[getRowKey(adType, slot)] = { file: null, displayUrl: null, url: '', saving: false };
      });
    });
    return init;
  });

  useEffect(() => {
    if (appId) fetchAds();
  }, [appId]);

  const fetchAds = async () => {
    const token = localStorage.getItem('accessToken');
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/partner-ads`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { app_id: appId, limit: 100 }
      });
      if (res.data.success) {
        const list: PartnerAd[] = res.data.data || [];
        setAds(list);
        setHeaderScrollingText(res.data.header_scrolling_text || '');
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
                url: ad?.url || '',
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

  const setUrlForRow = (adType: AdType, slot: number, url: string) => {
    const key = getRowKey(adType, slot);
    setRowState(prev => ({ ...prev, [key]: { ...prev[key], url } }));
  };

  const handleSaveRow = async (adType: AdType, slot: number) => {
    const key = getRowKey(adType, slot);
    const state = rowState[key];
    const token = localStorage.getItem('accessToken');

    if (!state.file && !state.url) {
      setMessage({ type: 'error', text: 'Provide an image or destination URL to save.' });
      return;
    }

    setRowState(prev => ({ ...prev, [key]: { ...prev[key], saving: true } }));
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('app_id', appId || '');
      formData.append('type', adType);
      formData.append('slot', String(slot));
      if (state.file) formData.append('image', state.file);
      formData.append('url', state.url);

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

  const handleSaveScrollingText = async () => {
    const token = localStorage.getItem('accessToken');
    setSavingScrollingText(true);
    setMessage(null);

    try {
      const res = await axios.put(`${API_BASE_URL}/partner-ads/settings`, {
        app_id: parseInt(appId || '0', 10),
        header_scrolling_text: headerScrollingText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Header scrolling text saved.' });
      } else throw new Error(res.data.message);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save scrolling text.' });
    } finally {
      setSavingScrollingText(false);
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
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">Destination URL</th>
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700 w-28">Save</th>
            </tr>
          </thead>
          <tbody>
            {SLOTS.map(slot => {
              const key = getRowKey(adType, slot);
              const state = rowState[key];
              const hasContent = !!state.file || !!state.url.trim();
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
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    <input
                      type="url"
                      value={state.url}
                      onChange={e => setUrlForRow(adType, slot, e.target.value)}
                      placeholder="https://example.com"
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
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-4">
        {SLOTS.map(slot => {
          const key = getRowKey(adType, slot);
          const state = rowState[key];
          const src = state.displayUrl || (state.file ? URL.createObjectURL(state.file) : null);
          return (
            <div key={slot} className="flex flex-col items-center">
              <span className="text-xs text-gray-500 mb-1">Slot {slot}</span>
              {src ? (
                <img src={src} alt={`Slot ${slot}`} className="w-16 h-16 object-cover rounded border border-gray-200" />
              ) : (
                <div className="w-16 h-16 rounded border border-dashed border-gray-300 bg-gray-100 flex items-center justify-center text-xs text-gray-400">—</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  if (loading) {
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
        <p className="text-gray-600 mt-1">Manage partner ad images, click-through links, and global header scrolling text.</p>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <label className="block text-sm font-semibold text-gray-900 mb-2">Header Scrolling Text</label>
        <p className="text-xs text-gray-500 mb-3">Global marquee text shown in the dashboard header (not tied to individual ad slots).</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={headerScrollingText}
            onChange={e => setHeaderScrollingText(e.target.value)}
            placeholder="Enter global scrolling text for the header..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={handleSaveScrollingText}
            disabled={savingScrollingText}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {savingScrollingText ? <Loader2 className="animate-spin" size={16} /> : 'Save Scrolling Text'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">{renderSectionTable('ads1', 'Ads1 (Section 1)')}</div>
        <div className="lg:col-span-1">{renderSectionTable('ads2', 'Ads2 (Section 2)')}</div>
      </div>
    </div>
  );
};
