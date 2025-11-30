import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';

export default function MinimalLayout({ showHeader = true, showFooter = false }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Minimal Header */}
      {showHeader && (
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center gap-3">
                <LayoutDashboard className="w-8 h-8 text-primary-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">My Group</h1>
                  <p className="text-xs text-gray-500">Multi-Tenant Platform</p>
                </div>
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Minimal Footer */}
      {showFooter && (
        <footer className="bg-white border-t border-gray-200 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              © 2024 My Group. All rights reserved.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}

