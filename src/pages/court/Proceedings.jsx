import React, { useState } from 'react';

import Breadcrumb from '../../components/layout/Breadcrumb';
import StatusBadge from '../../components/shared/StatusBadge';
import { Calendar as CalendarIcon, Clock, ChevronDown, ChevronUp, FileText, CheckCircle, Scale, AlertCircle } from 'lucide-react';

const Proceedings = () => {
  const [expandedTimeline, setExpandedTimeline] = useState(null);
  const [courtCases, setCourtCases] = useState([]);
  
  React.useEffect(() => {
    const fetchCases = async () => {
      try {
        const token = localStorage.getItem('anveshak_token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        const res = await fetch(`${API_URL}/case`, { headers: { Authorization: `Bearer ${token}` } });
        if(res.ok) {
          const data = await res.json();
          const filtered = data.cases.filter(c => c.status === 'COURT_PROCEEDINGS' || c.status === 'CHARGE_SHEET' || c.status === 'DISPOSED');
          const mapped = filtered.map(c => ({
            id: c.caseId || c._id,
            realId: c._id,
            title: c.firId ? `${c.firId.category || 'Incident'} — ${c.firId.incidentLocation || 'Unknown'}` : 'Case File',
            status: c.status,
            section: c.firId?.category || 'General',
            nextHearing: c.nextHearingDate ? new Date(c.nextHearingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD',
            proceedings: c.courtProceedings || []
          }));
          setCourtCases(mapped);
        }
      } catch(e) {}
    };
    fetchCases();
  }, []);

  const toggleTimeline = (id) => {
    if (expandedTimeline === id) setExpandedTimeline(null);
    else setExpandedTimeline(id);
  };

  // Dynamic calendar generation based on current month
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentDay = today.getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  
  const calendarDays = Array.from({ length: 35 }, (_, i) => {
    const day = i - startDay + 1;
    return (day > 0 && day <= daysInMonth) ? day : null;
  });

  // Extract hearing dates from active courtCases
  const highlightedDays = [];
  courtCases.forEach(c => {
    if (c.nextHearing !== 'TBD') {
      const d = new Date(c.nextHearing);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        highlightedDays.push(d.getDate());
      }
    }
  });

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Court Dashboard', path: '/court' },
        { label: 'Proceedings & Calendar', path: '/court/proceedings' }
      ]} />

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-navy mb-1">Legal Proceedings</h1>
        <p className="text-charcoal/70">View calendar and track case progression timelines.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-navy flex items-center gap-2">
                <CalendarIcon size={18} /> {today.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-2">
                <button className="text-charcoal/40 hover:text-navy">&lt;</button>
                <button className="text-charcoal/40 hover:text-navy">&gt;</button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                <div key={d} className="text-xs font-semibold text-charcoal/50 py-1">{d}</div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.map((day, i) => (
                <div 
                  key={i} 
                  className={`
                    p-2 text-sm rounded-md transition-colors
                    ${!day ? '' : 'hover:bg-cream cursor-pointer'}
                    ${highlightedDays.includes(day) ? 'bg-navy-50 text-navy font-bold border border-navy/20' : 'text-charcoal'}
                    ${day === currentDay ? 'bg-saffron text-white font-bold hover:bg-saffron-600' : ''}
                  `}
                >
                  {day || ''}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4 text-xs text-charcoal/60">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-saffron"></div> Today</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-navy-50 border border-navy/20"></div> Hearing</div>
            </div>
          </div>
          
          <div className="bg-navy rounded-xl shadow-sm p-6 text-white relative overflow-hidden">
            <Scale className="absolute -right-4 -bottom-4 text-white/10 w-32 h-32" />
            <h3 className="font-bold text-lg mb-2 relative z-10">Proceeding Rules</h3>
            <ul className="space-y-2 text-sm text-white/80 relative z-10 list-disc pl-4">
              <li>Upload orders within 48 hours of hearing.</li>
              <li>Status changes trigger auto-SMS to citizens.</li>
              <li>Check Next Hearing dates before adjourning.</li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-navy mb-6">Case Timelines</h2>
            
            <div className="space-y-4">
              {courtCases.length === 0 ? (
                 <div className="text-center p-8 text-charcoal/60">No active proceedings found.</div>
              ) : courtCases.map(courtCase => (
                <div key={courtCase.id} className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-300">
                  <div 
                    className="p-4 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center cursor-pointer hover:bg-cream"
                    onClick={() => toggleTimeline(courtCase.id)}
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-navy">{courtCase.id}</span>
                        <StatusBadge status={courtCase.status} />
                      </div>
                      <h4 className="font-semibold text-charcoal">{courtCase.title}</h4>
                      <p className="text-xs text-charcoal/60 mt-1">Section: {courtCase.section}</p>
                    </div>
                    <div className="mt-3 sm:mt-0 flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-charcoal/60">Next Hearing</p>
                        <p className="font-semibold text-charcoal flex items-center justify-end gap-1">
                          <Clock size={12} className="text-saffron" /> {courtCase.nextHearing}
                        </p>
                      </div>
                      <div className="text-navy">
                        {expandedTimeline === courtCase.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </div>

                  {expandedTimeline === courtCase.id && (
                    <div className="p-5 bg-white border-t border-gray-200">
                      <h5 className="font-bold text-charcoal text-sm mb-4">Hearing & Order History</h5>
                      
                      <div className="relative border-l-2 border-gray-200 ml-3 space-y-6">
                        
                        {courtCase.proceedings && courtCase.proceedings.length > 0 ? (
                           courtCase.proceedings.map((proc, idx) => (
                             <div key={idx} className="relative pl-6">
                               <div className="absolute w-4 h-4 rounded-full bg-forest border-4 border-white -left-[9px] top-1"></div>
                               <p className="text-xs font-bold text-charcoal/50">{new Date(proc.hearingDate).toLocaleDateString()}</p>
                               <h6 className="font-semibold text-charcoal mt-1 flex items-center gap-2">
                                 Hearing Completed <CheckCircle size={14} className="text-forest" />
                               </h6>
                               <div className="mt-2 p-3 bg-cream rounded-lg border border-gray-100 flex items-start gap-3">
                                 <FileText size={16} className="text-navy mt-0.5" />
                                 <div>
                                   <p className="text-sm font-medium text-charcoal">Order Issued</p>
                                   <p className="text-xs text-charcoal/60 mt-0.5">{proc.note}</p>
                                 </div>
                               </div>
                             </div>
                           ))
                        ) : (
                           <div className="text-sm text-gray-500 italic pl-6">No proceedings recorded yet.</div>
                        )}

                        <div className="relative pl-6">
                          <div className="absolute w-4 h-4 rounded-full bg-gray-400 border-4 border-white -left-[9px] top-1"></div>
                          <p className="text-xs font-bold text-charcoal/50">Initial</p>
                          <h6 className="font-semibold text-charcoal mt-1">Case Registered</h6>
                          <p className="text-sm text-charcoal/70">Case assigned to court docket.</p>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Proceedings;
