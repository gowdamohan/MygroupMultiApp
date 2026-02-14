import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { 
  LayoutDashboard, 
  MessageSquare, 
  BookOpen, 
  Heart, 
  Smile, 
  Radio, 
  Users, 
  Tv, 
  DollarSign, 
  ShoppingBag,
  UserPlus,
  Briefcase,
  LogOut
} from 'lucide-react';

const applications = [
  { id: 1, name: 'MyChat', icon: MessageSquare, color: 'from-purple-500 to-purple-700', description: 'Messaging & Communication' },
  { id: 2, name: 'MyDiary', icon: BookOpen, color: 'from-amber-500 to-amber-700', description: 'Personal Journal' },
  { id: 3, name: 'MyNeedy', icon: Heart, color: 'from-green-500 to-green-700', description: 'Service Booking' },
  { id: 4, name: 'MyJoy', icon: Smile, color: 'from-pink-500 to-pink-700', description: 'Entertainment & Fun' },
  { id: 5, name: 'MyMedia', icon: Radio, color: 'from-red-500 to-red-700', description: 'Media Gallery' },
  { id: 6, name: 'MyUnions', icon: Users, color: 'from-blue-500 to-blue-700', description: 'Organizations' },
  { id: 7, name: 'MyTV', icon: Tv, color: 'from-indigo-500 to-indigo-700', description: 'Video Streaming' },
  { id: 8, name: 'MyFin', icon: DollarSign, color: 'from-emerald-500 to-emerald-700', description: 'Finance Management' },
  { id: 9, name: 'MyShop', icon: ShoppingBag, color: 'from-orange-500 to-orange-700', description: 'E-Commerce' },
  { id: 10, name: 'MyFriend', icon: UserPlus, color: 'from-cyan-500 to-cyan-700', description: 'Social Network' },
  { id: 11, name: 'MyBiz', icon: Briefcase, color: 'from-purple-400 to-purple-600', description: 'Business Tools' },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-primary-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">My Group</h1>
                <p className="text-xs text-gray-500">Multi-Tenant Platform</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.first_name}! 👋
          </h2>
          <p className="text-gray-600">
            Choose an application to get started
          </p>
        </div>

        {/* Applications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {applications.map((app) => {
            const Icon = app.icon;
            return (
              <Card 
                key={app.id} 
                className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
              >
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${app.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {app.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {app.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Applications</CardTitle>
              <CardDescription>Available to you</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary-600">{applications.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Status</CardTitle>
              <CardDescription>Your current status</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-green-600">Active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Role</CardTitle>
              <CardDescription>Your access level</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-gray-900 capitalize">{user?.role || 'User'}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

