import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Breadcrumb from '../../components/layout/Breadcrumb';
import StatusBadge from '../../components/shared/StatusBadge';
import { formatDate } from '../../utils/helpers';
import { 
  FileText, Activity, CheckCircle, AlertCircle, PlusCircle, List, ArrowRight, Clock
} from 'lucide-react';

const CitizenDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [realFIRs, setRealFIRs] = useState([]);
  const [stats, setStats] = useState([
    { label: t('totalFirsFiled') || 'Total FIRs Filed', value: 0, icon: <FileText size={24} className="text-navy" />, bgColor: 'bg-navy-50' },
    { label: t('activeCases') || 'Active Cases', value: 0, icon: <Activity size={24} className="text-saffron" />, bgColor: 'bg-saffron-50' },
    { label: t('resolvedCases') || 'Resolved', value: 0, icon: <CheckCircle size={24} className="text-forest" />, bgColor: 'bg-green-50' },
    { label: t('pendingAction') || 'Pending Action', value: 0, icon: <AlertCircle size={24} className="text-alert" />, bgColor: 'bg-red-50' },
  ]);

  useEffect(() => {
    const fetchMyFirs = async () => {
      try {
        const token = localStorage.getItem('anveshak_token');
        if(!token) return;
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        const res = await fetch(`${API_URL}/fir/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const fList = data.firs || [];
        
        let active = 0, resolved = 0, pending = 0;
        fList.forEach(f => {
           const s = (f.status || '').toUpperCase();
           if(s === 'RESOLVED' || s === 'DISPOSED') resolved++;
           else if(s === 'FILED' || s === 'PENDING') pending++;
           else active++;
        });

        setStats([
          { label: t('totalFirsFiled') || 'Total FIRs Filed', value: fList.length, icon: <FileText size={24} className="text-navy" />, bgColor: 'bg-navy-50' },
          { label: t('activeCases') || 'Active Cases', value: active, icon: <Activity size={24} className="text-saffron" />, bgColor: 'bg-saffron-50' },
          { label: t('resolvedCases') || 'Resolved', value: resolved, icon: <CheckCircle size={24} className="text-forest" />, bgColor: 'bg-green-50' },
          { label: t('pendingAction') || 'Pending Action', value: pending, icon: <AlertCircle size={24} className="text-alert" />, bgColor: 'bg-red-50' },
        ]);

        const mapped = fList.slice(0, 3).map(f => ({
          id: f._id,
          trackingId: f.firNumber,
          title: `${f.category || 'Incident'} Report`,
          status: f.status || 'FILED',
          date: f.createdAt,
          location: f.incidentLocation
        }));
        
        setRealFIRs(mapped);
      } catch(e) {
        console.error(e);
      }
    };
    fetchMyFirs();
  }, [user, t]);

  return (
    <div className="min-h-screen bg-cream pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: 'Dashboard', path: '/citizen' }]} />
        
        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-bold text-charcoal font-sans">
            {t('welcomeBack') || 'Welcome back'}, {user?.name || 'Citizen'}
          </h1>
          <p className="text-gray-600 mt-2">
            {t('dashboardDescription') || 'Manage your FIRs and track justice progress digitally.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, index) => (
            <div key={index} className="rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 bg-white border-l-4" style={{ borderColor: 'var(--navy)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-charcoal mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-navy flex items-center gap-2">
                  <Clock size={20} />
                  {t('recentActivity') || 'Recent Activity'}
                </h2>
                <Link to="/citizen/view-firs" className="text-sm font-bold text-saffron hover:text-orange-600 flex items-center gap-1 transition-colors">
                  {t('viewAll') || 'View All'} <ArrowRight size={16} />
                </Link>
              </div>

              <div className="space-y-4">
                {realFIRs.map((fir) => (
                  <div key={fir.id} className="group border border-gray-100 rounded-xl p-5 hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-mono font-bold text-navy">{fir.trackingId}</span>
                        <StatusBadge status={fir.status} />
                      </div>
                      <h3 className="font-bold text-charcoal">{fir.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{formatDate(fir.date)} • {fir.location}</p>
                    </div>
                    <Link to={`/citizen/fir/${fir.id}`} className="px-4 py-2 text-sm font-semibold text-navy bg-white border border-gray-200 rounded-lg hover:border-navy transition-colors self-start md:self-center">
                      View Details
                    </Link>
                  </div>
                ))}
                {realFIRs.length === 0 && (
                   <p className="text-gray-500 text-sm">No recent FIRs found.</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#FFF1E0] to-[#FFE0B2] rounded-2xl shadow-md p-6 text-orange-950">
              <h3 className="text-lg font-bold mb-2">Quick Actions</h3>
           <p className="text-orange-900/75 text-sm mb-6">Need to report an incident? File an e-FIR instantly.</p>
              
              <div className="space-y-3">
                <Link to="/citizen/log-fir" className="w-full flex items-center justify-between bg-white/10 hover:bg-white/20 p-4 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <PlusCircle size={20} className="text-saffron" />
                  <span className="font-semibold text-orange-950">Log New FIR</span>
                  </div>
                  <ArrowRight size={16} className="text-white/50" />
                </Link>
                
                <Link to="/citizen/view-firs" className="w-full flex items-center justify-between bg-white/10 hover:bg-white/20 p-4 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <List size={20} className="text-green-400" />
                   <span className="font-semibold text-orange-950">Track Status</span>
                  </div>
                 <ArrowRight size={16} className="text-orange-900/50" />
                </Link>
              </div>
            </div>
            
            <div className="bg-saffron-50 border border-saffron-200 rounded-2xl p-6">
               <div className="flex gap-3">
                 <AlertCircle className="text-saffron shrink-0" />
                 <div>
                   <h4 className="font-bold text-amber-900">Emergency Help</h4>
                   <p className="text-sm text-amber-800 mt-1">For immediate police assistance, dial <strong>112</strong> immediately instead of filing an e-FIR.</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;
