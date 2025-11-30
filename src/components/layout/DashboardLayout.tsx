import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from '../Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
  sidebarItems?: Array<{
    icon: React.ComponentType<any>;
    label: string;
    path: string;
    badge?: number;
  }>;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  user,
  sidebarItems
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        items={sidebarItems}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Header */}
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title={title}
          user={user}
        />

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

