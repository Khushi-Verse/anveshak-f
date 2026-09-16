import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { mockCourtCases } from '../../data/mockData';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { Link } from 'react-router-dom';
import { Scale, Users, FileText, Calendar, Bell, ChevronRight, Clock, AlertCircle, Briefcase } from 'lucide-react';

const CourtDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [todaysCauseList, setTodaysCauseList] = useState([]);
  const [stats, setStats] = useState({ docket: 0, hearings: 0, pending: 0, disposed: 0 });

  React.useEffect(() => {
    const fetchCases = async () => {
      try {
        const token = localStorage.getItem('anveshak_token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        const res = await fetch(`${API_URL}/case`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if(res.ok) {
          const data = await res.json();
          const courtCases = data.cases.filter(c => c.status === 'COURT_PROCEEDINGS' || c.status === 'CHARGE_SHEET' || c.status === 'DISPOSED');
          
          setStats({
            docket: courtCases.filter(c => c.status !== 'DISPOSED').length,
            hearings: courtCases.filter(c => c.nextHearingDate).length,
            pending: courtCases.filter(c => c.status === 'COURT_PROCEEDINGS' || c.status === 'CHARGE_SHEET').length,
            disposed: courtCases.filter(c => c.status === 'DISPOSED').length,
          });

          const activeHearings = courtCases
            .filter(c => c.status !== 'DISPOSED')
            .map(c => ({
              id: c.caseId || c._id,
              title: c.firId ? `${c.firId.category || 'General'} Case` : 'Case File',
              hearingDate: c.nextHearingDate || new Date().toISOString().split('T')[0],
              time: 'TBD',
              category: 'Hearing'
            }));
          setTodaysCauseList(activeHearings);
        }
      } catch(e) { console.error("Error fetching cases:", e); }
    };
    fetchCases();
  }, []);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: t('courtDashboard') || 'Court Dashboard', path: '/court' }]} />
      
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-[#0B3D91] mb-1">
            Welcome back, Honorable {user?.name || 'Judge'}
          </h1>
          <p className="text-[#1A1A1A]/70">
            {t('overviewText') || 'Here is the overview of your court docket today.'}
          </p>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-sm text-[#1A1A1A]/60">Current Date</p>
          <p className="font-semibold text-[#1A1A1A]">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-[#0B3D91] hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-[#1A1A1A]/60">Cases on Docket</p>
              <h3 className="text-2xl font-bold text-[#0B3D91] mt-1">{stats.docket}</h3>
            </div>
            <div className="bg-[#0B3D91]/10 p-2 rounded-lg text-[#0B3D91]">
              <Scale size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-purple-600 hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-[#1A1A1A]/60">Today's Hearings</p>
              <h3 className="text-xl font-bold text-purple-600 mt-1">{stats.hearings}</h3>
            </div>
            <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
              <Calendar size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-red-500 hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-[#1A1A1A]/60">Pending Orders</p>
              <h3 className="text-2xl font-bold text-red-500 mt-1">{stats.pending}</h3>
            </div>
            <div className="bg-red-50 p-2 rounded-lg text-red-500">
              <AlertCircle size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-green-600 hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-[#1A1A1A]/60">Disposed (Total)</p>
              <h3 className="text-2xl font-bold text-green-600 mt-1">{stats.disposed}</h3>
            </div>
            <div className="bg-green-50 p-2 rounded-lg text-green-600">
              <FileText size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-[#0B3D91]">Today's Cause List</h2>
            <Link to="/court/proceedings" className="text-sm font-medium text-[#0B3D91] hover:text-[#0B3D91]/80 flex items-center">
              View Calendar <ChevronRight size={16} />
            </Link>
          </div>
          
          <div className="space-y-4">
            {todaysCauseList.length === 0 ? (
              <p className="text-[#1A1A1A]/60">No hearings scheduled for today.</p>
            ) : (
              todaysCauseList.map((hearing, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[#FAF8F5] rounded-lg border border-gray-100 hover:border-gray-300 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="bg-white border border-gray-200 p-2 rounded-lg flex flex-col items-center justify-center min-w-[70px]">
                      <span className="text-xs text-[#1A1A1A]/60 font-semibold">Time</span>
                      <span className="text-sm font-bold text-[#0B3D91] whitespace-nowrap">{hearing.time}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#1A1A1A]">{hearing.title}</h4>
                      <p className="text-sm text-[#1A1A1A]/70 flex items-center gap-1 mt-1">
                        <Scale size={14} /> Case ID: {hearing.id} ? {hearing.category}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-0 flex items-center gap-3">
                    <Link 
                      to={`/court/cases/${hearing.id}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-[#0B3D91] hover:text-white bg-white border border-[#0B3D91]/20 px-3 py-1.5 rounded-lg hover:bg-[#0B3D91] transition-colors whitespace-nowrap"
                    >
                      Open Case ↗
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-[#0B3D91] mb-6">Quick Links</h2>
          
          <div className="space-y-3">
            <Link to="/court/cases" className="flex items-center gap-3 p-4 rounded-lg bg-[#FAF8F5] hover:bg-[#0B3D91]/5 text-[#1A1A1A] hover:text-[#0B3D91] transition-colors group">
              <div className="bg-white p-2 rounded-md shadow-sm group-hover:bg-[#0B3D91] group-hover:text-white transition-colors">
                <Briefcase size={18} />
              </div>
              <span className="font-medium">My Cases</span>
            </Link>
            
            <Link to="/court/proceedings" className="flex items-center gap-3 p-4 rounded-lg bg-[#FAF8F5] hover:bg-[#0B3D91]/5 text-[#1A1A1A] hover:text-[#0B3D91] transition-colors group">
              <div className="bg-white p-2 rounded-md shadow-sm group-hover:bg-[#0B3D91] group-hover:text-white transition-colors">
                <Calendar size={18} />
              </div>
              <span className="font-medium">Legal Proceedings</span>
            </Link>
            
            <Link to="/court/alerts" className="flex items-center gap-3 p-4 rounded-lg bg-[#FAF8F5] hover:bg-[#0B3D91]/5 text-[#1A1A1A] hover:text-[#0B3D91] transition-colors group">
              <div className="bg-white p-2 rounded-md shadow-sm group-hover:bg-[#0B3D91] group-hover:text-white transition-colors">
                <Bell size={18} />
              </div>
              <span className="font-medium">Alert Settings</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourtDashboard;
