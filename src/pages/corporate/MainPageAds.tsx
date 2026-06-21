import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Loader2, FileImage, Upload, Link } from 'lucide-react';
import { API_BASE_URL } from '../../config/api.config';

interface MainAdsData {
  id: number;
  main_ad_path: string | null;
  main_ad_url: string | null;
  main_ad_signed_url: string | null;
  side_ad_1_path: string | null;
  side_ad_1_url: string | null;
  side_ad_1_signed_url: string | null;
  side_ad_2_path: string | null;
  side_ad_2_url: string | null;
  side_ad_2_signed_url: string | null;
  side_ad_3_path: string | null;
  side_ad_3_url: string | null;
  side_ad_3_signed_url: string | null;
}

interface SlotState {
  file: File | null;
  url: string;
  saving: boolean;
  previewSrc: string | null;
}

const SIDE_SLOTS = [1, 2, 3] as const;
type SideSlot = typeof SIDE_SLOTS[number];

const emptySlot = (): SlotState => ({ file: null, url: '', saving: false, previewSrc: null });

export const MainPageAds: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [mainSlot, setMainSlot] = useState<SlotState>(emptySlot());
  const [sideSlots, setSideSlots] = useState<Record<SideSlot, SlotState>>({
    1: emptySlot(),
    2: emptySlot(),
    3: emptySlot()
  });

  const mainFileRef = useRef<HTMLInputElement | null>(null);
  const sideFileRefs = useRef<Record<SideSlot, HTMLInputElement | null>>({ 1: null, 2: null, 3: null });

  const fetchAds = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_BASE_URL}/main-ads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && res.data.data) {
        const d: MainAdsData = res.data.data;
        setMainSlot(prev => ({
          ...prev,
          file: null,
          url: d.main_ad_url || '',
          previewSrc: d.main_ad_signed_url || null
        }));
        setSideSlots({
          1: { file: null, url: d.side_ad_1_url || '', saving: false, previewSrc: d.side_ad_1_signed_url || null },
          2: { file: null, url: d.side_ad_2_url || '', saving: false, previewSrc: d.side_ad_2_signed_url || null },
          3: { file: null, url: d.side_ad_3_url || '', saving: false, previewSrc: d.side_ad_3_signed_url || null }
        });
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  /* ── Main Ad handlers ── */
  const handleMainFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setMainSlot(prev => ({ ...prev, file: f }));
  };

  const handleSaveMain = async () => {
    if (!mainSlot.file && !mainSlot.url.trim()) {
      showMessage('error', 'Provide an image or a destination URL for the Main Ad.');
      return;
    }
    setMainSlot(prev => ({ ...prev, saving: true }));
    setMessage(null);
    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      if (mainSlot.file) formData.append('image', mainSlot.file);
      formData.append('url', mainSlot.url);
      const res = await axios.post(`${API_BASE_URL}/main-ads/save-main`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        showMessage('success', 'Main ad saved successfully.');
        if (mainFileRef.current) mainFileRef.current.value = '';
        fetchAds();
      } else throw new Error(res.data.message);
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Failed to save main ad.');
    } finally {
      setMainSlot(prev => ({ ...prev, saving: false, file: null }));
    }
  };

  /* ── Side Ad handlers ── */
  const updateSideSlot = (slot: SideSlot, patch: Partial<SlotState>) => {
    setSideSlots(prev => ({ ...prev, [slot]: { ...prev[slot], ...patch } }));
  };

  const handleSideFileChange = (slot: SideSlot, e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    updateSideSlot(slot, { file: f });
  };

  const handleSaveSide = async (slot: SideSlot) => {
    const state = sideSlots[slot];
    if (!state.file && !state.url.trim()) {
      showMessage('error', `Provide an image or destination URL for Side Ad ${slot}.`);
      return;
    }
    updateSideSlot(slot, { saving: true });
    setMessage(null);
    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      if (state.file) formData.append('image', state.file);
      formData.append('url', state.url);
      const res = await axios.post(`${API_BASE_URL}/main-ads/save-side/${slot}`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        showMessage('success', `Side ad ${slot} saved successfully.`);
        if (sideFileRefs.current[slot]) sideFileRefs.current[slot]!.value = '';
        fetchAds();
      } else throw new Error(res.data.message);
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || `Failed to save side ad ${slot}.`);
    } finally {
      updateSideSlot(slot, { saving: false, file: null });
    }
  };

  /* ── Shared image preview ── */
  const PreviewBox: React.FC<{ src: string | null; file: File | null; label: string; large?: boolean }> = ({
    src, file, label, large
  }) => {
    const displaySrc = file ? URL.createObjectURL(file) : src;
    const size = large ? 'w-full h-40' : 'w-24 h-24';
    return displaySrc ? (
      <img
        src={displaySrc}
        alt={label}
        className={`${size} object-cover rounded-lg border border-gray-200 shadow-sm`}
        onError={e => {
          (e.target as HTMLImageElement).src =
            'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect fill="%23f3f4f6" width="96" height="96"/><text x="48" y="52" fill="%239ca3af" font-size="12" text-anchor="middle">Error</text></svg>';
        }}
      />
    ) : (
      <div
        className={`${size} rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-400 gap-1`}
      >
        <FileImage size={large ? 32 : 20} />
        <span className="text-xs">{label}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-blue-600" size={36} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileImage size={24} className="text-blue-600" />
          Main Page Ads
        </h2>
        <p className="text-gray-500 mt-1 text-sm">
          Manage the main ad banner and three side ad slots displayed on the home page.
          Upload an image and/or set a click-through destination URL per slot.
        </p>
      </div>

      {/* Status message */}
      {message && (
        <div
          className={`mb-5 px-4 py-3 rounded-lg text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ── Main Ad ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Upload size={18} className="text-blue-500" />
          Main Ad
        </h3>
        <p className="text-xs text-gray-500 mb-5">
          Large banner shown as the primary advertisement on the main page.
        </p>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Preview */}
          <div className="shrink-0">
            <PreviewBox
              src={mainSlot.previewSrc}
              file={mainSlot.file}
              label="Main Ad"
              large
            />
          </div>

          {/* Controls */}
          <div className="flex-1 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Image / GIF
              </label>
              <input
                ref={mainFileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleMainFileChange}
                className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 file:text-sm hover:file:bg-blue-100"
              />
              {mainSlot.file && (
                <span className="text-xs text-gray-400 mt-1 block truncate">{mainSlot.file.name}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Link size={12} /> Destination URL
              </label>
              <input
                type="url"
                value={mainSlot.url}
                onChange={e => setMainSlot(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="mt-auto">
              <button
                type="button"
                onClick={handleSaveMain}
                disabled={mainSlot.saving || (!mainSlot.file && !mainSlot.url.trim())}
                className="flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {mainSlot.saving ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                {mainSlot.saving ? 'Saving…' : (mainSlot.previewSrc ? 'Update Main Ad' : 'Save Main Ad')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Side Ads ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileImage size={18} className="text-blue-500" />
            Side Ads (3 Slots)
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Three independent ad slots displayed alongside the main ad. Each supports its own image and link.
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {SIDE_SLOTS.map(slot => {
            const state = sideSlots[slot];
            return (
              <div key={slot} className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {slot}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">Side Ad Slot {slot}</span>
                  {state.previewSrc && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                      Active
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {/* Preview thumbnail */}
                  <div className="shrink-0">
                    <PreviewBox src={state.previewSrc} file={state.file} label={`Side ${slot}`} />
                  </div>

                  {/* Controls */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Image / GIF
                      </label>
                      <input
                        ref={el => { sideFileRefs.current[slot] = el; }}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={e => handleSideFileChange(slot, e)}
                        className="block w-full text-sm text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 file:text-sm hover:file:bg-blue-100"
                      />
                      {state.file && (
                        <span className="text-xs text-gray-400 mt-1 block truncate">{state.file.name}</span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                        <Link size={12} /> Destination URL
                      </label>
                      <input
                        type="url"
                        value={state.url}
                        onChange={e => updateSideSlot(slot, { url: e.target.value })}
                        placeholder="https://example.com"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={() => handleSaveSide(slot)}
                        disabled={state.saving || (!state.file && !state.url.trim())}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {state.saving ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                        {state.saving ? 'Saving…' : (state.previewSrc ? 'Update Slot' : 'Save Slot')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
