import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { StatsGridLayout, CardGridLayout } from '../../layouts';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

const statsData = [
  {
    title: 'Total Users',
    value: '12,543',
    change: '+12.5%',
    trend: 'up',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    title: 'Active Sessions',
    value: '3,842',
    change: '+8.2%',
    trend: 'up',
    icon: Activity,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    title: 'Revenue',
    value: '$45,231',
    change: '+23.1%',
    trend: 'up',
    icon: DollarSign,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100'
  },
  {
    title: 'Growth Rate',
    value: '18.2%',
    change: '-2.4%',
    trend: 'down',
    icon: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  }
];

const recentActivity = [
  { id: 1, user: 'John Doe', action: 'Created new account', time: '2 minutes ago' },
  { id: 2, user: 'Jane Smith', action: 'Updated profile', time: '15 minutes ago' },
  { id: 3, user: 'Mike Johnson', action: 'Logged in', time: '1 hour ago' },
  { id: 4, user: 'Sarah Williams', action: 'Made a purchase', time: '2 hours ago' },
];

export default function Overview() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <StatsGridLayout>
        {statsData.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? ArrowUp : ArrowDown;
          
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    <div className={`flex items-center gap-1 mt-2 text-sm ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <TrendIcon size={16} />
                      <span>{stat.change}</span>
                      <span className="text-gray-500">vs last month</span>
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={stat.color} size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </StatsGridLayout>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Card */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue for the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Chart placeholder - integrate with chart library</p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest user actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 text-sm font-semibold">
                      {activity.user[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                    <p className="text-sm text-gray-600">{activity.action}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Add User', 'Create Group', 'View Reports', 'Settings'].map((action) => (
              <button
                key={action}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center"
              >
                <p className="text-sm font-medium text-gray-700">{action}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

