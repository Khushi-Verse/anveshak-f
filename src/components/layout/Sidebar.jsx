import { NavLink, useLocation } from 'react-router-dom';

import { X, BarChart3, LayoutDashboard, Search, Briefcase, Upload, Share2, ShieldCheck, MessageSquare, FileText, Lock, ChevronLeft, ChevronRight, Scale } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

export default function Sidebar({ isOpen, onClose }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const officerLinks = [
    { to: '/officer', icon: LayoutDashboard, label: t('officer.dashboard'), end: true },
    { to: '/officer/search', icon: Search, label: t('officer.smartSearch') },
    { to: '/officer/cases', icon: Briefcase, label: t('officer.myCases') },
    { to: '/officer/upload', icon: Upload, label: t('officer.resourceUpload') },
    { to: '/officer/sharing', icon: Share2, label: t('officer.dataSharing') },
    { to: '/officer/access', icon: ShieldCheck, label: t('officer.accessControl') },
    { to: '/officer/chat', icon: MessageSquare, label: t('officer.chat') },
    { to: '/officer/audit', icon: FileText, label: t('officer.auditLog') },
    { to: '/officer/analytics', icon: BarChart3, label: t('officer.advancedAnalytics') || 'Analytics' },
    { to: '/officer/security', icon: Lock, label: t('officer.security') },
  ];

  const courtLinks = [
    { to: '/court', icon: LayoutDashboard, label: t('court.dashboard') || 'Court Dashboard', end: true },
    { to: '/court/cases', icon: Briefcase, label: t('court.myCases') || 'My Cases' },
    { to: '/court/proceedings', icon: Scale, label: t('court.proceedings') || 'Legal Proceedings' },
    { to: '/court/alerts', icon: MessageSquare, label: t('court.alertSettings') || 'Alert Settings' },
  ];

  const links = user?.role?.toUpperCase() === 'COURT' ? courtLinks : officerLinks;
  const basePath = user?.role?.toUpperCase() === 'COURT' ? '/court' : '/officer';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 bottom-0 z-40 bg-white border-r border-navy-100 transition-all duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-16' : 'w-64'}`}
        role="navigation"
        aria-label="Dashboard navigation"
      >
        <div className="flex flex-col h-full">
          {/* Close button (mobile) */}
          <div className="flex items-center justify-between p-3 lg:hidden border-b border-navy-50">
            <span className="text-sm font-semibold text-navy">{t('nav.dashboard')}</span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-navy-50 text-charcoal-muted"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {links.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-navy text-white shadow-sm'
                      : 'text-charcoal-muted hover:bg-navy-50 hover:text-navy'
                  }`
                }
                onClick={onClose}
                title={collapsed ? label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Collapse toggle (desktop) */}
          <div className="hidden lg:block p-2 border-t border-navy-50">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-navy-50 text-charcoal-muted transition-colors"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}


