import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Sun, Moon, Settings } from 'lucide-react';
import axios from 'axios';
import { HomeData } from '../../types/home.types';
import { AuthModal } from '../../components/AuthModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api/v1';
const BACKEND_URL = 'http://localhost:5002';

export const MobileHomePage: React.FC = () => {
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      // Show auth modal if not logged in
      setShowAuthModal(true);
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/home/mobile-data`);
      if (response.data.success) {
        setHomeData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!homeData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <>
      {/* Auth Modal - Cannot be closed until user logs in */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        allowClose={false}
      />

      <div className={`mobile-home ${darkMode ? 'dark-mode' : ''}`}>
        {/* Fixed Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: '#057284' }}>
        <div className="overflow-x-auto">
          <div className="flex gap-4 px-4 py-3" style={{ width: 'max-content' }}>
            {homeData.topIcon.myapps.map((app) => (
              <Link
                key={app.id}
                to={app.url || '#'}
                className="flex flex-col items-center gap-1 min-w-[60px]"
              >
                <img
                  src={`${app.icon}`}
                  alt={app.name}
                  className="w-8 h-8 object-contain"
                />
                <span className="text-white text-xs text-center">{app.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Logo Header */}
      <div className="fixed top-[60px] left-0 right-0 z-40 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* User Profile Icon */}
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <User size={24} className="text-gray-700" />
          </button>
          
          {/* Dark Mode Toggle & Settings */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              {darkMode ? <Sun size={20} className="text-gray-700" /> : <Moon size={20} className="text-gray-700" />}
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Settings size={20} className="text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Add margin-top to account for fixed headers */}
      <div className="pt-[120px]">
        {/* My Apps Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
          style={{ background: 'linear-gradient(-45deg, #ac32e4, #7918f2, #4801ff)' }}>
          <div className="flex flex-col gap-4 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white text-center mb-4">My Apps</h2>
            {homeData.topIcon.myapps.map((app) => (
              <Link
                key={app.id}
                to={app.url || '#'}
                className="flex items-center justify-center gap-3 bg-transparent border-2 border-white rounded-full py-3 px-6 text-white font-medium hover:bg-white hover:text-purple-600 transition-all duration-300"
              >
                <img
                  src={`${app.icon}`}
                  alt={app.name}
                  className="w-5 h-5 object-contain"
                />
                <span>{app.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* More sections will be added here */}
      </div>
    </div>
    </>
  );
};

