import { 
  Building2, Users, Briefcase, Newspaper, Radio, 
  Tv, Camera, MessageSquare, ShoppingBag, Calendar,
  FileText, BarChart, Settings, Shield, Crown,
  Handshake, Megaphone, Factory, Wrench, GraduationCap,
  Heart, Home, Globe
} from 'lucide-react';

export interface Application {
  id: string;
  name: string;
  tagline: string;
  icon: any;
  category: 'admin' | 'company' | 'media' | 'all';
  loginPath: string;
  color: string;
}

export const applications: Application[] = [
  // Admin Applications
  {
    id: 'admin',
    name: 'Admin Portal',
    tagline: 'Manage your entire empire',
    icon: Shield,
    category: 'admin',
    loginPath: '/auth/login',
    color: 'from-blue-500 to-blue-700'
  },
  {
    id: 'god-mode',
    name: 'God Mode',
    tagline: 'Ultimate system access',
    icon: Crown,
    category: 'admin',
    loginPath: '/god-login/default/default',
    color: 'from-yellow-500 to-amber-700'
  },
  
  // Company Applications
  {
    id: 'corporate',
    name: 'Corporate Hub',
    tagline: 'Enterprise management',
    icon: Building2,
    category: 'company',
    loginPath: '/admin/login/corporate',
    color: 'from-indigo-500 to-indigo-700'
  },
  {
    id: 'franchise',
    name: 'Franchise Manager',
    tagline: 'Regional operations control',
    icon: Factory,
    category: 'company',
    loginPath: '/admin/login/franchise',
    color: 'from-purple-500 to-purple-700'
  },
  {
    id: 'services',
    name: 'Service Provider',
    tagline: 'Professional services hub',
    icon: Briefcase,
    category: 'company',
    loginPath: '/client-login/services',
    color: 'from-teal-500 to-teal-700'
  },
  {
    id: 'labor',
    name: 'Labor Portal',
    tagline: 'Workforce management',
    icon: Wrench,
    category: 'company',
    loginPath: '/client-login/labor',
    color: 'from-orange-500 to-orange-700'
  },
  {
    id: 'education',
    name: 'Education Center',
    tagline: 'Learning & development',
    icon: GraduationCap,
    category: 'company',
    loginPath: '/client-login/education',
    color: 'from-green-500 to-green-700'
  },
  {
    id: 'healthcare',
    name: 'Healthcare Hub',
    tagline: 'Medical services portal',
    icon: Heart,
    category: 'company',
    loginPath: '/client-login/healthcare',
    color: 'from-red-500 to-red-700'
  },
  {
    id: 'realestate',
    name: 'Real Estate',
    tagline: 'Property management',
    icon: Home,
    category: 'company',
    loginPath: '/client-login/realestate',
    color: 'from-cyan-500 to-cyan-700'
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce',
    tagline: 'Online marketplace',
    icon: ShoppingBag,
    category: 'company',
    loginPath: '/client-login/ecommerce',
    color: 'from-pink-500 to-pink-700'
  },
  
  // Media Applications
  {
    id: 'news',
    name: 'News Portal',
    tagline: 'Breaking news platform',
    icon: Newspaper,
    category: 'media',
    loginPath: '/media-login/news',
    color: 'from-gray-700 to-gray-900'
  },
  {
    id: 'radio',
    name: 'Radio Station',
    tagline: 'Audio broadcasting',
    icon: Radio,
    category: 'media',
    loginPath: '/media-login/radio',
    color: 'from-violet-500 to-violet-700'
  },
  {
    id: 'tv',
    name: 'TV Channel',
    tagline: 'Video broadcasting',
    icon: Tv,
    category: 'media',
    loginPath: '/media-login/tv',
    color: 'from-rose-500 to-rose-700'
  },
  {
    id: 'photography',
    name: 'Photography',
    tagline: 'Visual storytelling',
    icon: Camera,
    category: 'media',
    loginPath: '/media-login/photography',
    color: 'from-emerald-500 to-emerald-700'
  },
  {
    id: 'reporter',
    name: 'Reporter Portal',
    tagline: 'Journalism platform',
    icon: Megaphone,
    category: 'media',
    loginPath: '/reporter/login',
    color: 'from-amber-500 to-amber-700'
  },
  
  // Partner & Others
  {
    id: 'partner',
    name: 'Partner Network',
    tagline: 'Strategic partnerships',
    icon: Handshake,
    category: 'all',
    loginPath: '/partner/login',
    color: 'from-sky-500 to-sky-700'
  },
  {
    id: 'community',
    name: 'Community',
    tagline: 'Social engagement',
    icon: Users,
    category: 'all',
    loginPath: '/client-login/community',
    color: 'from-fuchsia-500 to-fuchsia-700'
  },
  {
    id: 'events',
    name: 'Events',
    tagline: 'Event management',
    icon: Calendar,
    category: 'all',
    loginPath: '/client-login/events',
    color: 'from-lime-500 to-lime-700'
  },
  {
    id: 'messaging',
    name: 'Messaging',
    tagline: 'Instant communication',
    icon: MessageSquare,
    category: 'all',
    loginPath: '/client-login/messaging',
    color: 'from-blue-400 to-blue-600'
  },
  {
    id: 'analytics',
    name: 'Analytics',
    tagline: 'Data insights',
    icon: BarChart,
    category: 'all',
    loginPath: '/client-login/analytics',
    color: 'from-purple-400 to-purple-600'
  },
  {
    id: 'documents',
    name: 'Documents',
    tagline: 'Document management',
    icon: FileText,
    category: 'all',
    loginPath: '/client-login/documents',
    color: 'from-slate-500 to-slate-700'
  },
  {
    id: 'settings',
    name: 'Settings',
    tagline: 'System configuration',
    icon: Settings,
    category: 'admin',
    loginPath: '/auth/login',
    color: 'from-gray-600 to-gray-800'
  },
  {
    id: 'international',
    name: 'International',
    tagline: 'Global operations',
    icon: Globe,
    category: 'company',
    loginPath: '/client-login/international',
    color: 'from-teal-400 to-teal-600'
  }
];
