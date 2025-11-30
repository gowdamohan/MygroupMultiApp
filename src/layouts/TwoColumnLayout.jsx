import React from 'react';
import { Outlet } from 'react-router-dom';

export default function TwoColumnLayout({ 
  leftColumn, 
  rightColumn, 
  leftWidth = 'w-64',
  rightWidth = 'flex-1',
  gap = 'gap-6',
  sticky = false
}) {
  return (
    <div className={`flex ${gap}`}>
      {/* Left Column */}
      <aside className={`${leftWidth} ${sticky ? 'sticky top-6 self-start' : ''}`}>
        {leftColumn}
      </aside>

      {/* Right Column / Main Content */}
      <main className={rightWidth}>
        {rightColumn || <Outlet />}
      </main>
    </div>
  );
}

// Preset: Sidebar + Content
export function SidebarContentLayout({ sidebar, children }) {
  return (
    <TwoColumnLayout
      leftColumn={sidebar}
      leftWidth="w-72"
      rightWidth="flex-1"
      gap="gap-6"
      sticky={true}
    >
      {children}
    </TwoColumnLayout>
  );
}

// Preset: Content + Widgets
export function ContentWidgetsLayout({ widgets, children }) {
  return (
    <TwoColumnLayout
      leftColumn={children}
      rightColumn={widgets}
      leftWidth="flex-1"
      rightWidth="w-80"
      gap="gap-6"
      sticky={true}
    />
  );
}

