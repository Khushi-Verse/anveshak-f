import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Link } from 'react-router-dom';
import Breadcrumb from '../../components/layout/Breadcrumb';
import StatusBadge from '../../components/shared/StatusBadge';
import CaseTimeline from '../../components/shared/CaseTimeline';
import { formatDate, formatRelativeTime } from '../../utils/helpers';
import {
  FileText, Search, Download, ChevronDown, ChevronUp,
  Calendar, MapPin, User, ExternalLink, Clock, ShieldAlert, Loader2
} from 'lucide-react';

const ViewFIRs = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [allFIRs, setAllFIRs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFIRs = async () => {
      try {
        const token = localStorage.getItem('anveshak_token');
        if (!token) return;

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        
        // Fetch from real backend endpoint for citizen FIRs
        const res = await fetch(`${API_URL}/fir/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = await res.json();
        const fList = data.firs || [];
        
        if (fList.length > 0) {
          let mappedFIRs = fList.map(f => ({
            id: f._id,
            trackingId: f.firNumber,
            title: `${f.category || 'General'} Incident`,
            status: f.status || 'FILED',
            date: f.incidentDate || f.createdAt,
            location: f.incidentLocation || 'Unknown',
            description: f.incidentDescription || '',
            lastUpdated: f.updatedAt,
            timeline: [], // Usually derived from backend timeline route, but we keep it empty or mock here if not present in /my
            nextHearing: null
          }));

          try {
            const caseRes = await fetch(`${API_URL}/case`, { headers: { Authorization: `Bearer ${token}` } });
            if (caseRes.ok) {
              const caseData = await caseRes.json();
              const cases = caseData.cases || caseData;
              mappedFIRs = mappedFIRs.map(fir => {
                const matchedCase = cases.find(c => c.firId && (c.firId._id === fir.id || c.firId === fir.id));
                if (matchedCase && matchedCase.nextHearingDate) {
                  return { ...fir, nextHearing: new Date(matchedCase.nextHearingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) };
                }
                return fir;
              });
            }
          } catch(e) {}

          setAllFIRs(mappedFIRs);
        } else {
          setAllFIRs([]);
        }
      } catch (err) {
        console.error('Fetch FIRs error:', err);
        setError('Failed to load FIRs from the server');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFIRs();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const getStatusStep = (fir) => {
    const s = (fir.status || '').toLowerCase();
    if (s === 'filed') return 1;
    if (s === 'under_investigation' || s === 'under investigation') return 2;
    if (s === 'chargesheet') return 3;
    if (s === 'court_registered' || s === 'court registered') return 4;
    if (s === 'disposed' || s === 'resolved') return 5;
    return 1;
  };

  const filteredFIRs = allFIRs.filter(fir => {
    const matchesSearch =
      (fir.trackingId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (fir.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (fir.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus !== 'all') {
      const s = (fir.status || '').toLowerCase();
      if (filterStatus === 'active') return ['filed', 'under_investigation'].includes(s);
      if (filterStatus === 'court') return ['chargesheet', 'court_registered'].includes(s);
      if (filterStatus === 'closed') return ['disposed', 'resolved'].includes(s);
    }

    return true;
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-navy" /></div>;
  }

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      <Breadcrumb items={[
        { label: 'Home', path: '/' },
        { label: 'Citizen Dashboard', path: '/citizen' },
        { label: 'My FIRs', path: '/citizen/view-firs' }
      ]} />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold text-navy font-serif mb-2">My Registered FIRs</h1>
          <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
            Track the real-time status of your complaints, view investigation updates, and securely download copies of your registered FIRs from the real database.
          </p>
        </div>
        <Link
          to="/citizen/log-fir"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-navy text-white font-bold rounded-xl hover:bg-navy-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap"
        >
          <FileText size={18} />
          File New FIR
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by FIR ID, title, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-navy focus:bg-white transition-all outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            {[
              { id: 'all', label: 'All Cases' },
              { id: 'active', label: 'Active' },
              { id: 'court', label: 'In Court' },
              { id: 'closed', label: 'Closed' }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setFilterStatus(filter.id)}
                className={`px-5 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  filterStatus === filter.id
                    ? 'bg-navy text-white shadow-md'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute top-0 left-6 bottom-0 w-px bg-gray-200 hidden md:block"></div>
        <div className="space-y-6">
          {error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
              {error}
            </div>
          ) : filteredFIRs.length > 0 ? (
            filteredFIRs.map((fir, index) => {
              const isExpanded = expandedId === fir.id;
              const currentStep = getStatusStep(fir);

              return (
                <div key={fir.id} className="relative group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 ml-0 md:ml-12">
                  <div className="absolute top-8 -left-12 w-6 h-px bg-gray-200 hidden md:block"></div>
                  <div className="absolute top-7 -left-14 w-4 h-4 rounded-full border-2 border-navy bg-white hidden md:block group-hover:bg-navy transition-colors"></div>

                  <div className="p-5 lg:p-6 cursor-pointer" onClick={() => toggleExpand(fir.id)}>
                    <div className="flex flex-col lg:flex-row justify-between gap-6">
                      
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-mono text-sm font-bold text-navy px-3 py-1 bg-navy-50 rounded-lg border border-navy-100">
                            {fir.trackingId}
                          </span>
                          <StatusBadge status={fir.status} />
                          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md flex items-center gap-1">
                            <Clock size={12} /> Last updated: {formatRelativeTime(fir.lastUpdated)}
                          </span>
                          {fir.nextHearing && (
                            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded-md border border-purple-100 flex items-center gap-1">
                              <Calendar size={12} /> Next Hearing: {fir.nextHearing}
                            </span>
                          )}
                        </div>
                        
                        <div>
                          <h3 className="text-xl font-bold text-charcoal mb-2">{fir.title}</h3>
                          <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
                            {fir.description}
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1.5"><Calendar size={16} /> Filed on: {formatDate(fir.date)}</span>
                          <span className="flex items-center gap-1.5"><MapPin size={16} /> {fir.location}</span>
                        </div>
                      </div>

                      <div className="flex flex-row lg:flex-col items-center justify-between lg:items-end gap-4 border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6 min-w-[200px]">
                        <Link 
                          to={`/citizen/fir/${fir.id}`} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-navy hover:text-navy-700 font-bold text-sm bg-navy-50 px-4 py-2 rounded-xl transition-colors w-full justify-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={16} />
                          View Full FIR
                        </Link>
                        
                        <button 
                          className="flex items-center gap-2 text-charcoal hover:text-navy font-bold text-sm px-4 py-2 rounded-xl border border-gray-200 hover:border-navy hover:bg-navy-50 transition-colors w-full justify-center"
                          onClick={(e) => { e.stopPropagation(); /* trigger download */ }}
                        >
                          <Download size={16} />
                          Download PDF
                        </button>
                        
                        <button className="hidden lg:flex items-center gap-2 text-gray-400 hover:text-navy text-sm font-semibold mt-auto">
                          {isExpanded ? (
                            <><ChevronUp size={16} /> Hide Timeline</>
                          ) : (
                            <><ChevronDown size={16} /> View Timeline</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/30 p-4 lg:p-6">
                      <CaseTimeline
                        stages={fir.timeline || []}
                        currentStep={currentStep - 1}
                        totalStages={fir.timeline?.length || 5}
                      />
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-2xl shadow-sm p-16 text-center border border-gray-100 ml-0 md:ml-12">
              <Search size={48} className="mx-auto text-gray-200 mb-4" />
              <h3 className="text-xl font-bold text-charcoal mb-2">No FIRs Found</h3>
              <p className="text-gray-400 text-sm">
                No records match your search criteria. Try a different keyword or clear your filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewFIRs;
