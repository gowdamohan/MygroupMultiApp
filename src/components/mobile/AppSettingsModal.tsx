import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  X, FileText, HelpCircle, MessageCircle, Phone, Star, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';

interface SocialLink {
  id: number;
  platform: string;
  url: string;
}

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appLogo?: string;
  appIcon?: string;
  appName?: string;
}

export const AppSettingsModal: React.FC<AppSettingsModalProps> = ({
  isOpen,
  onClose,
  appLogo,
  appIcon,
  appName = 'App'
}) => {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [expandedSection, setExpandedSection] = useState<'legal' | 'help' | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSocialLinks();
    }
  }, [isOpen]);

  const fetchSocialLinks = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/footer/social-media`);
      if (response.data.success) setSocialLinks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching social links:', error);
    }
  };

  const getSocialIcon = (platform: string) => {
    const iconClass = "w-6 h-6";
    switch (platform.toLowerCase()) {
      case 'facebook': return <div className={`${iconClass} bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold`}>f</div>;
      case 'instagram': return <div className={`${iconClass} bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-lg flex items-center justify-center text-white text-xs`}>📷</div>;
      case 'twitter': return <div className={`${iconClass} bg-sky-500 rounded-full flex items-center justify-center text-white text-xs font-bold`}>𝕏</div>;
      case 'youtube': return <div className={`${iconClass} bg-red-600 rounded-lg flex items-center justify-center text-white text-xs`}>▶</div>;
      case 'linkedin': return <div className={`${iconClass} bg-blue-700 rounded flex items-center justify-center text-white text-xs font-bold`}>in</div>;
      default: return <Globe className={iconClass} />;
    }
  };

  const toggleSection = (section: 'legal' | 'help') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (!isOpen) return null;

  const displayLogo = appLogo || appIcon;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[100] bg-black/50"
        onClick={onClose}
      />

      {/* Slide-in Panel from Right */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed top-0 right-0 bottom-0 z-[101] w-[85%] max-w-sm bg-white shadow-2xl overflow-y-auto"
      >
        {/* Header with App Logo and Name */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-teal-500 px-4 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {displayLogo ? (
              <img
                src={displayLogo.startsWith('http') ? displayLogo : `${BACKEND_URL}${displayLogo}`}
                alt={appName}
                className="w-10 h-10 rounded-full object-contain bg-white p-1"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-teal-600 font-bold">
                {appName?.charAt(0) || 'A'}
              </div>
            )}
            <span className="text-white font-semibold text-lg">{appName}</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* App Info Section */}
        <div className="bg-gradient-to-b from-teal-500 to-teal-400 px-4 pb-6 pt-2">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-lg overflow-hidden flex items-center justify-center">
              {displayLogo ? (
                <img
                  src={displayLogo.startsWith('http') ? displayLogo : `${BACKEND_URL}${displayLogo}`}
                  alt={appName}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <span className="text-3xl font-bold text-teal-600">{appName?.charAt(0) || 'A'}</span>
              )}
            </div>
            <h3 className="text-white font-semibold text-xl mt-3">{appName}</h3>
          </div>
        </div>

        {/* Menu Items */}
        <div className="px-4 py-4 space-y-1">
          {/* Legal - Expandable */}
          <div>
            <button
              onClick={() => toggleSection('legal')}
              className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
            >
              <FileText size={20} className="text-gray-600" />
              <span className="text-gray-800">Legal</span>
            </button>
            <AnimatePresence>
              {expandedSection === 'legal' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden pl-10 space-y-1"
                >
                  <Link to="/terms" onClick={onClose} className="block px-3 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700">
                    Terms and Conditions
                  </Link>
                  <Link to="/privacy" onClick={onClose} className="block px-3 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700">
                    Privacy Policy
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Help & Support - Expandable */}
          <div>
            <button
              onClick={() => toggleSection('help')}
              className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
            >
              <HelpCircle size={20} className="text-gray-600" />
              <span className="text-gray-800">Help & Support</span>
            </button>
            <AnimatePresence>
              {expandedSection === 'help' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden pl-10 space-y-1"
                >
                  <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-left">
                    <MessageCircle size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700">Feedback & Suggestions</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-left">
                    <MessageCircle size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700">Live Chat</span>
                  </button>
                  <Link to="/contact" onClick={onClose} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg">
                    <Phone size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700">Contact Us</span>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Reviews */}
          <button className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors text-left">
            <Star size={20} className="text-gray-600" />
            <span className="text-gray-800">Reviews</span>
          </button>

          {/* Ratings */}
          <div className="px-3 py-3">
            <div className="flex items-center gap-3">
              <Star size={20} className="text-gray-600" />
              <span className="text-gray-800">Ratings</span>
            </div>
            <div className="flex items-center gap-1 mt-2 ml-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} className="text-yellow-400 hover:scale-110 transition-transform">
                  <Star size={24} fill="currentColor" />
                </button>
              ))}
              <span className="text-sm text-gray-500 ml-2">(4.5)</span>
            </div>
          </div>
        </div>

        {/* Follow Us Section */}
        <div className="border-t border-gray-200 px-4 py-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Follow Us</h4>
          <div className="flex gap-3 flex-wrap">
            {socialLinks.length > 0 ? (
              socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {getSocialIcon(link.platform)}
                </a>
              ))
            ) : (
              ['facebook', 'instagram', 'twitter', 'youtube', 'linkedin'].map((platform) => (
                <button
                  key={platform}
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {getSocialIcon(platform)}
                </button>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default AppSettingsModal;

