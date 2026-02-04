import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL, getUploadUrl } from '../../config/api.config';
import { HeadOfficeLogin } from '../corporate/HeadOfficeLogin';
import { FooterPageManager } from '../corporate/FooterPageManager';
import { FooterPageListManager } from '../corporate/FooterPageListManager';
import { SocialMediaLinks } from '../corporate/SocialMediaLinks';
import { Gallery } from '../corporate/Gallery';
import { HeaderAds } from '../corporate/HeaderAds';
import { CompanyHeaderAds } from '../corporate/CompanyHeaderAds';
import { ApplicationDetails } from '../corporate/ApplicationDetails';
import { TermsConditions } from '../corporate/TermsConditions';
import { UserTermsConditions } from '../corporate/UserTermsConditions';
import { FooterFaqManager } from '../corporate/FooterFaqManager';
import { HeaderAdsPricing } from '../corporate/HeaderAdsPricing';
import { CorporateHeaderAdsPricing } from '../corporate/CorporateHeaderAdsPricing';
import { CorporateOfferAds } from '../corporate/CorporateOfferAds';
import { ChangePassword } from '../corporate/ChangePassword';
import {
  LayoutDashboard, Users, Building2, MapPin, Globe, FileText,
  LogOut, ChevronDown, ChevronRight, Menu, X,
  Settings, Shield, Award, Newspaper, Calendar, Briefcase,
  UserCheck, MessageSquare, Mail, FileCheck, Lock, Copyright,
  Clock, TrendingUp, BarChart3, DollarSign, Image, Megaphone,
  Database, HelpCircle, Key, User, FileImage, Link2, BookOpen,
  Smile, Building, Milestone, Phone, Share2, Scale, ShieldCheck,
  FileQuestion, Headphones, Package
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path?: string;
  children?: MenuItem[];
}

interface DashboardStats {
  headOfficeUsers: number;
  regionalOfficeUsers: number;
  branchOfficeUsers: number;
  headOfficeAds: any[];
  regionalOfficeAds: any[];
  branchOfficeAds: any[];
}

export const CorporateDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['dashboard']);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [user, setUser] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState<DashboardStats>({
    headOfficeUsers: 0,
    regionalOfficeUsers: 37,
    branchOfficeUsers: 735,
    headOfficeAds: [],
    regionalOfficeAds: [],
    branchOfficeAds: []
  });
  const [offerAds, setOfferAds] = useState<Array<{ id: number; image_path?: string; image_url?: string; group_id?: number }>>([]);
  const [carouselSlide, setCarouselSlide] = useState(0);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate('/auth/login');
    }

    // Update clock every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  useEffect(() => {
    const fetchOfferAds = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await axios.get(`${API_BASE_URL}/franchise-offer-ads?limit=4`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.success && Array.isArray(res.data.data)) {
          setOfferAds(res.data.data);
        }
      } catch (e) {
        console.error('Failed to fetch franchise offer ads', e);
      }
    };
    fetchOfferAds();
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setCarouselSlide((prev) => (prev === 0 ? 1 : 0));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard/corporate'
    },
    {
      id: 'head-office-login',
      label: 'Head Office Login',
      icon: Building2,
      path: '/corporate/head-office-login'
    },
    {
      id: 'advertisement',
      label: 'Advertisement',
      icon: Megaphone,
      children: [
        { id: 'header-ads', label: 'Header Ads', icon: Image, path: '/corporate/header-ads' },
        { id: 'offer-ads', label: 'Offer Ads', icon: Package, path: '/corporate/offer-ads' },
        { id: 'popup-ads', label: 'Popup Add', icon: MessageSquare, path: '/corporate/popup-ads' },
        { id: 'company-header-ads', label: 'My Company Header Ads', icon: Building, path: '/corporate/company-header-ads' },
        { id: 'main-page-ads', label: 'Main Page Ads', icon: FileImage, path: '/corporate/main-page-ads' }
      ]
    },
    {
      id: 'header-ads-pricing',
      label: 'Header Ads Pricing',
      icon: DollarSign,
      path: '/corporate/header-ads-pricing'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      path: '/corporate/profile'
    },
    {
      id: 'application-details',
      label: 'Application Details',
      icon: FileText,
      path: '/corporate/application-details'
    },
    {
      id: 'terms-conditions',
      label: 'Terms and Conditions',
      icon: FileCheck,
      path: '/corporate/terms-conditions'
    },
    {
      id: 'footer',
      label: 'Footer',
      icon: Settings,
      children: [
        { id: 'about-us', label: 'About Us', icon: BookOpen, path: '/corporate/footer/about-us' },
        { id: 'awards', label: 'Awards', icon: Award, path: '/corporate/footer/awards' },
        { id: 'newsroom', label: 'Newsroom', icon: Newspaper, path: '/corporate/footer/newsroom' },
        { id: 'events', label: 'Events', icon: Calendar, path: '/corporate/footer/events' },
        { id: 'careers', label: 'Careers', icon: Briefcase, path: '/corporate/footer/careers' },
        { id: 'clients', label: 'Clients', icon: Users, path: '/corporate/footer/clients' },
        { id: 'milestones', label: 'Milestones', icon: Milestone, path: '/corporate/footer/milestones' },
        { id: 'testimonials', label: 'Testimonials', icon: Smile, path: '/corporate/footer/testimonials' },
        { id: 'gallery', label: 'Gallery', icon: Image, path: '/corporate/footer/gallery' },
        { id: 'contact-us', label: 'Contact Us', icon: Phone, path: '/corporate/footer/contact-us' },
        { id: 'social-media', label: 'Social Media Link', icon: Share2, path: '/corporate/footer/social-media' },
        { id: 'footer-terms', label: 'Terms And Conditions', icon: Scale, path: '/corporate/footer/terms' },
        { id: 'privacy-policy', label: 'Privacy and Policy', icon: ShieldCheck, path: '/corporate/footer/privacy' },
        { id: 'user-terms', label: 'User Terms and Conditions', icon: FileCheck, path: '/corporate/footer/user-terms' },
        { id: 'faq', label: 'FAQ', icon: HelpCircle, path: '/corporate/footer/faq' }
      ]
    },
    {
      id: 'database',
      label: 'Database',
      icon: Database,
      children: [
        { id: 'public-database', label: 'Public Database', icon: Database, path: '/corporate/public-database' },
        { id: 'client-database', label: 'Client Database', icon: Database, path: '/corporate/client-database' }
      ]
    },
    {
      id: 'applications',
      label: 'Applications',
      icon: FileQuestion,
      children: [
        { id: 'franchise-application', label: 'Franchise Application', icon: Building2, path: '/corporate/franchise-application' },
        { id: 'job-application', label: 'Job Application', icon: Briefcase, path: '/corporate/job-application' },
        { id: 'enquiry-form', label: 'Enquiry Form', icon: Mail, path: '/corporate/enquiry-form' }
      ]
    },
    {
      id: 'supports',
      label: 'Supports',
      icon: Headphones,
      children: [
        { id: 'feedback', label: 'Feedback and Suggestions', icon: MessageSquare, path: '/corporate/feedback' },
        { id: 'chat', label: 'Chat with Us', icon: MessageSquare, path: '/corporate/chat' }
      ]
    },
    {
      id: 'change-password',
      label: 'Change Password',
      icon: Key,
      path: '/corporate/change-password'
    }
  ];

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleMenuClick = (item: MenuItem) => {
    if (item.children) {
      toggleMenu(item.id);
    } else if (item.path) {
      setActiveMenu(item.id);
      navigate(item.path);
      setMobileSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/auth/login');
  };

  const renderContent = () => {
    const path = location.pathname;
    console.log('Current path:', path);

    // Route matching
    switch (path) {
      case '/dashboard/corporate':
        return renderDashboard();
      case '/corporate/head-office-login':
        return <HeadOfficeLogin />;
      case '/corporate/header-ads':
        return <HeaderAds />;
      case '/corporate/offer-ads':
        return <CorporateOfferAds />;
      case '/corporate/header-ads-pricing':
        return <CorporateHeaderAdsPricing />;
      case '/corporate/popup-ads':
        return <div className="p-6"><h2 className="text-2xl font-bold">Popup Ads Management</h2><p className="text-gray-600 mt-2">Coming soon...</p></div>;
      case '/corporate/company-header-ads':
        return <CompanyHeaderAds />;
      case '/corporate/main-page-ads':
        return <div className="p-6"><h2 className="text-2xl font-bold">Main Page Ads Management</h2><p className="text-gray-600 mt-2">Coming soon...</p></div>;
      case '/corporate/profile':
        return <div className="p-6"><h2 className="text-2xl font-bold">Profile</h2><p className="text-gray-600 mt-2">Coming soon...</p></div>;
      case '/corporate/application-details':
        return <ApplicationDetails />;
      case '/corporate/terms-conditions':
        return <TermsConditions />;
      case '/corporate/footer/about-us':
        return <FooterPageListManager pageType="about_us" pageTitle="About Us" />;
      case '/corporate/footer/awards':
        return <FooterPageListManager pageType="awards" pageTitle="Awards" />;
      case '/corporate/footer/newsroom':
        return <FooterPageListManager pageType="newsroom" pageTitle="Newsroom" />;
      case '/corporate/footer/events':
        return <FooterPageListManager pageType="events" pageTitle="Events" />;
      case '/corporate/footer/careers':
        return <FooterPageListManager pageType="careers" pageTitle="Careers" />;
      case '/corporate/footer/clients':
        return <FooterPageListManager pageType="clients" pageTitle="Clients" />;
      case '/corporate/footer/milestones':
        return <FooterPageListManager pageType="milestones" pageTitle="Milestones" />;
      case '/corporate/footer/testimonials':
        return <FooterPageListManager pageType="testimonials" pageTitle="Testimonials" />;
      case '/corporate/footer/gallery':
        return <Gallery />;
      case '/corporate/footer/contact-us':
        return <FooterPageManager pageType="contact_us" pageTitle="Contact Us" />;
      case '/corporate/footer/social-media':
        return <SocialMediaLinks />;
      case '/corporate/footer/terms':
        return <FooterPageManager pageType="terms" pageTitle="Terms and Conditions" />;
      case '/corporate/footer/privacy':
        return <FooterPageManager pageType="privacy_policy" pageTitle="Privacy Policy" />;
      case '/corporate/footer/user-terms':
        return <UserTermsConditions />;
      case '/corporate/footer/faq':
        return <FooterFaqManager />;
      case '/corporate/public-database':
        return <div className="p-6"><h2 className="text-2xl font-bold">Public Database</h2><p className="text-gray-600 mt-2">Coming soon...</p></div>;
      case '/corporate/client-database':
        return <div className="p-6"><h2 className="text-2xl font-bold">Client Database</h2><p className="text-gray-600 mt-2">Coming soon...</p></div>;
      case '/corporate/franchise-application':
        return <div className="p-6"><h2 className="text-2xl font-bold">Franchise Applications</h2><p className="text-gray-600 mt-2">Coming soon...</p></div>;
      case '/corporate/job-application':
        return <div className="p-6"><h2 className="text-2xl font-bold">Job Applications</h2><p className="text-gray-600 mt-2">Coming soon...</p></div>;
      case '/corporate/enquiry-form':
        return <div className="p-6"><h2 className="text-2xl font-bold">Enquiry Forms</h2><p className="text-gray-600 mt-2">Coming soon...</p></div>;
      case '/corporate/feedback':
        return <div className="p-6"><h2 className="text-2xl font-bold">Feedback and Suggestions</h2><p className="text-gray-600 mt-2">Coming soon...</p></div>;
      case '/corporate/chat':
        return <div className="p-6"><h2 className="text-2xl font-bold">Chat with Us</h2><p className="text-gray-600 mt-2">Coming soon...</p></div>;
      case '/corporate/change-password':
        return <ChangePassword />;
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => {
    return (
      <div className="max-w-7xl mx-auto">
        {/* Dashboard Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Clock Widget */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg text-white">
              <div className="flex items-center justify-center mb-2">
                <Clock size={32} />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-sm opacity-90">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Head Office Users */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Building2 className="text-purple-600" size={24} />
                </div>
                <TrendingUp className="text-green-500" size={20} />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.headOfficeUsers}</div>
              <div className="text-sm text-gray-600">Head Office Users</div>
              <div className="text-xs text-green-600 mt-2">By Country</div>
            </div>

            {/* Regional Office Users */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <MapPin className="text-blue-600" size={24} />
                </div>
                <TrendingUp className="text-green-500" size={20} />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.regionalOfficeUsers}</div>
              <div className="text-sm text-gray-600">Regional Office Users</div>
              <div className="text-xs text-green-600 mt-2">By State</div>
            </div>

            {/* Branch Office Users */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <Globe className="text-green-600" size={24} />
                </div>
                <TrendingUp className="text-green-500" size={20} />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.branchOfficeUsers}</div>
              <div className="text-sm text-gray-600">Branch Office Users</div>
              <div className="text-xs text-green-600 mt-2">By District</div>
            </div>
          </div>

          {/* Ads Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Head Office Ads */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Head Office Ads</h3>
                <Building2 className="text-purple-600" size={20} />
              </div>
              <div className="text-sm text-gray-600 mb-3">By Country</div>
              <div className="text-2xl font-bold text-gray-900">0</div>
              <div className="text-xs text-gray-500 mt-2">Total advertisements</div>
            </div>

            {/* Regional Office Ads */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Regional Office Ads</h3>
                <MapPin className="text-green-600" size={20} />
              </div>
              <div className="text-sm text-gray-600 mb-3">By State</div>
              <div className="text-2xl font-bold text-gray-900">0</div>
              <div className="text-xs text-gray-500 mt-2">Total advertisements</div>
            </div>

            {/* Branch Office Ads */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Branch Office Ads</h3>
                <Globe className="text-blue-600" size={20} />
              </div>
              <div className="text-sm text-gray-600 mb-3">By District</div>
              <div className="text-2xl font-bold text-gray-900">0</div>
              <div className="text-xs text-gray-500 mt-2">Total advertisements</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isExpanded = expandedMenus.includes(item.id);
    const isActive = activeMenu === item.id;
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id}>
        <button
          onClick={() => handleMenuClick(item)}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
            isActive
              ? 'bg-primary-50 text-primary-700 border-r-3 border-primary-700'
              : 'text-gray-700 hover:bg-gray-100'
          } ${level > 0 ? 'pl-' + (4 + level * 4) : ''}`}
        >
          <Icon size={18} />
          <span className="flex-1 text-left">{item.label}</span>
          {hasChildren && (
            isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
          )}
        </button>
        {hasChildren && isExpanded && (
          <div className="bg-gray-50">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } hidden lg:block bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                <Building2 className="text-white" size={18} />
              </div>
              <span className="font-bold text-gray-900">Corporate</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto py-4">
            {menuItems.map(item => renderMenuItem(item))}
          </div>

          {/* Logout */}
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-white z-50 lg:hidden shadow-xl"
            >
              <div className="h-full flex flex-col">
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                      <Building2 className="text-white" size={18} />
                    </div>
                    <span className="font-bold text-gray-900">Corporate</span>
                  </div>
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Menu Items */}
                <div className="flex-1 overflow-y-auto py-4">
                  {menuItems.map(item => renderMenuItem(item))}
                </div>

                {/* Logout */}
                <div className="border-t border-gray-200 p-4">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 gap-4">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden lg:block shrink-0"
              >
                <Menu size={20} />
              </button>
            )}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden shrink-0"
            >
              <Menu size={20} />
            </button>
            {/* Carousel: 2 slides, 2 images per slide (4 images total); default placeholders when empty */}
            <div className="flex-1 min-w-0 max-w-2xl overflow-hidden">
              <div className="relative h-12 flex items-center">
                <AnimatePresence mode="wait">
                  {[0, 1].map((slideIndex) => (
                    slideIndex === carouselSlide && (
                      <motion.div
                        key={slideIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex gap-2 items-center justify-center"
                      >
                        {[0, 1].map((i) => {
                          const ad = offerAds[slideIndex * 2 + i];
                          const src = ad ? (ad.image_url || (ad.image_path ? getUploadUrl(ad.image_path) : '')) : '';
                          const key = ad ? ad.id : `placeholder-${slideIndex}-${i}`;
                          return (
                            <div
                              key={key}
                              className="h-10 w-24 shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center"
                            >
                              {src ? (
                                <img src={src} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">Ad</div>
                              )}
                            </div>
                          );
                        })}
                      </motion.div>
                    )
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 pl-2 border-l border-gray-200">
            <div className="text-right">
              <div className="text-xs font-medium text-gray-500">Corporate</div>
              <div className="text-sm font-semibold text-gray-900">
                {user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'User' : '—'}
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-sm font-medium shrink-0">
              {user?.first_name?.[0] || user?.email?.[0] || 'U'}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};


