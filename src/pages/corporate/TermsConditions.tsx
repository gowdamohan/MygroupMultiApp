import React, { useState, useEffect } from 'react';
import { Save, Building2, MapPin, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api/v1';

interface TermsData {
  id?: number;
  type: string;
  content: string;
}

type TabType = 'head_office' | 'regional' | 'branch';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ElementType;
}

export const TermsConditions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('head_office');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [termsData, setTermsData] = useState<{ [key in TabType]: TermsData }>({
    head_office: { type: 'head_office', content: '' },
    regional: { type: 'regional', content: '' },
    branch: { type: 'branch', content: '' }
  });

  const tabs: Tab[] = [
    { id: 'head_office', label: 'Head Office', icon: Building2 },
    { id: 'regional', label: 'Regional Office', icon: MapPin },
    { id: 'branch', label: 'Branch Office', icon: Home }
  ];

  useEffect(() => {
    fetchAllTerms();
  }, []);

  const fetchAllTerms = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/franchise-terms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const terms = response.data.data;
        const updatedTermsData = { ...termsData };
        
        terms.forEach((term: TermsData) => {
          if (term.type && (term.type === 'head_office' || term.type === 'regional' || term.type === 'branch')) {
            updatedTermsData[term.type as TabType] = term;
          }
        });
        
        setTermsData(updatedTermsData);
      }
    } catch (err: any) {
      console.error('Error fetching terms:', err);
      setError('Failed to fetch terms and conditions');
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (content: string) => {
    setTermsData({
      ...termsData,
      [activeTab]: {
        ...termsData[activeTab],
        content
      }
    });
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    const currentData = termsData[activeTab];

    if (!currentData.content.trim()) {
      setError('Content cannot be empty');
      setSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${API_BASE_URL}/franchise-terms`,
        {
          type: activeTab,
          content: currentData.content
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess(`${tabs.find(t => t.id === activeTab)?.label} terms saved successfully`);
      fetchAllTerms();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save terms and conditions');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Terms and Conditions Management</h1>
      </div>

      {/* Alert Messages */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs and Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content for {tabs.find(t => t.id === activeTab)?.label}
                </label>
                <textarea
                  value={termsData[activeTab].content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={15}
                  placeholder={`Enter terms and conditions for ${tabs.find(t => t.id === activeTab)?.label}...`}
                />
                <p className="text-sm text-gray-500 mt-2">
                  {termsData[activeTab].content.length} characters
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                    saving ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save Terms'}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Preview - {tabs.find(t => t.id === activeTab)?.label}
        </h2>
        <div className="prose max-w-none">
          {termsData[activeTab].content ? (
            <div className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
              {termsData[activeTab].content}
            </div>
          ) : (
            <p className="text-gray-400 italic">No content available. Add content above to see preview.</p>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const hasContent = termsData[tab.id].content.trim().length > 0;
          return (
            <div
              key={tab.id}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${
                  activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Icon size={20} />
                </div>
                <h3 className="font-semibold text-gray-900">{tab.label}</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  hasContent ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span className="text-sm text-gray-600">
                  {hasContent ? `${termsData[tab.id].content.length} characters` : 'No content'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

