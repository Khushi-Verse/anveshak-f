import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { mockOfficerCases, mockSharedAccess } from '../../data/mockData';
import Breadcrumb from '../../components/layout/Breadcrumb';
import IndiaMap from '../../components/shared/IndiaMap';
import { FileText, ShieldAlert, Clock, Share2, Search, UploadCloud, Key } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

export default function OfficerDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();

    const [stats, setStats] = React.useState({ total: 0, active: 0, pending: 0, shared: 0 });
  const [recentCases, setRecentCases] = React.useState([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('anveshak_token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        
        // Fetch stats
        const statsRes = await fetch(`${API_URL}/case/stats`, { headers: { Authorization: `Bearer ${token}` } });
        if(statsRes.ok) {
           const sData = await statsRes.json();
           setStats({
             total: sData.totalCases || 0,
             active: sData.assignedCases || 0,
             pending: sData.pendingAssignment || 0,
             shared: 2
           });
        }
        
        // Fetch recent cases
        const casesRes = await fetch(`${API_URL}/case/assigned-to-me`, { headers: { Authorization: `Bearer ${token}` } });
        if(casesRes.ok) {
           const cData = await casesRes.json();
           setRecentCases(cData.cases || []);
        }
      } catch(e) {}
    };
    fetchData();
  }, []);

  const totalCases = stats.total;
  const activeCases = stats.active;
  const pendingReview = stats.pending;
  const sharedAccess = stats.shared;



  const breadcrumbs = [
    { label: t('Home') || 'Home', path: '/' },
    { label: t('Officer Dashboard') || 'Officer Dashboard', path: '/officer/dashboard' }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={breadcrumbs} />

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h1 className="text-2xl font-bold text-charcoal">
          {t('Welcome back') || 'Welcome back'}, {user?.name || 'Officer'}
        </h1>
        <p className="text-gray-500 mt-1">{t('Here is an overview of your current workload.') || 'Here is an overview of your current workload.'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-navy hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">{t('Total Cases') || 'Total Cases'}</p>
              <h3 className="text-2xl font-bold text-charcoal mt-1">{totalCases}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center text-navy">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-alert hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">{t('Active Cases') || 'Active Cases'}</p>
              <h3 className="text-2xl font-bold text-charcoal mt-1">{activeCases}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-alert/10 flex items-center justify-center text-alert">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-saffron hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">{t('Pending Review') || 'Pending Review'}</p>
              <h3 className="text-2xl font-bold text-charcoal mt-1">{pendingReview}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-saffron/10 flex items-center justify-center text-saffron">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-forest hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">{t('Shared Access') || 'Shared Access'}</p>
              <h3 className="text-2xl font-bold text-charcoal mt-1">{sharedAccess}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-forest/10 flex items-center justify-center text-forest">
              <Share2 className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-charcoal">{t('My Active Cases') || 'My Active Cases'}</h2>
            <Link to="/officer/cases" className="text-sm text-navy hover:underline font-medium">View All</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentCases.slice(0, 4).map(c => (
              <div key={c._id || c.caseId} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-charcoal">{c.firId ? (c.firId.category + ' Case') : 'Investigation File'}</h3>
                  <p className="text-xs text-gray-500 mt-1">{c.caseId || c._id} • {c.firId?.category || 'General'}</p>
                </div>
                <Link
                  to={`/officer/cases/${c.caseId || c._id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-charcoal hover:border-navy hover:text-navy transition-all shadow-sm"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-charcoal">{t('Quick Actions') || 'Quick Actions'}</h2>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <button className="flex items-center gap-3 w-full p-3 rounded-lg border border-gray-200 hover:border-navy hover:bg-navy/5 transition-all text-left group">
              <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center text-navy group-hover:scale-110 transition-transform">
                <Search className="w-4 h-4" />
              </div>
              <span className="font-medium text-charcoal">{t('Smart Search') || 'Smart Search'}</span>
            </button>
            <button className="flex items-center gap-3 w-full p-3 rounded-lg border border-gray-200 hover:border-navy hover:bg-navy/5 transition-all text-left group">
              <div className="w-8 h-8 rounded-full bg-forest/10 flex items-center justify-center text-forest group-hover:scale-110 transition-transform">
                <UploadCloud className="w-4 h-4" />
              </div>
              <span className="font-medium text-charcoal">{t('Upload Resource') || 'Upload Resource'}</span>
            </button>
            <button className="flex items-center gap-3 w-full p-3 rounded-lg border border-gray-200 hover:border-navy hover:bg-navy/5 transition-all text-left group">
              <div className="w-8 h-8 rounded-full bg-saffron/10 flex items-center justify-center text-saffron group-hover:scale-110 transition-transform">
                <Key className="w-4 h-4" />
              </div>
              <span className="font-medium text-charcoal">{t('Request Access') || 'Request Access'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Crime Hotspot Map — Command Center */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-charcoal">Crime Analytics — Hotspot Map</h2>
            <p className="text-xs text-gray-500 mt-0.5">Real-time nationwide crime density visualisation</p>
          </div>
          <span className="px-3 py-1 bg-forest/10 text-forest text-xs font-semibold rounded-full">Live</span>
        </div>
        <IndiaMap />
      </div>
    </div>
  );
}
