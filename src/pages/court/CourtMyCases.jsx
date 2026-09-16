import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockCourtCases } from '../../data/mockData';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { Scale, Search, ChevronRight, Clock, MapPin, Filter } from 'lucide-react';

const statusColor = {
  'Hearing': 'bg-purple-100 text-purple-700',
  'Pending': 'bg-amber-100 text-amber-700',
  'Disposed': 'bg-green-100 text-green-700',
  'Active': 'bg-blue-100 text-blue-700',
};


export default function CourtMyCases() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const [cases, setCases] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchCases = async () => {
      try {
        const token = localStorage.getItem('anveshak_token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        const res = await fetch(`${API_URL}/case`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if(res.ok) {
           const mapped = data.cases.filter(c => c.status === 'COURT_PROCEEDINGS' || c.status === 'CHARGE_SHEET' || c.status === 'DISPOSED').map(c => ({
             id: c.caseId || c._id,
             title: c.firId ? `${c.firId.category} Case` : 'Case File',
             status: c.status === 'DISPOSED' ? 'Disposed' : (c.status === 'CHARGE_SHEET' ? 'Pending' : 'Hearing'),
             hearingDate: 'Upcoming',
             priority: c.priority || 'Medium',
             nextAction: 'Review Evidence'
           }));
           setCases(mapped);
        }
      } catch(e) { console.error(e); } finally { setIsLoading(false); }
    };
    fetchCases();
  }, []);

  const filtered = cases.filter(c => {
    const matchesSearch =
      (c.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.caseId || c.id || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Court Dashboard', path: '/court' },
          { label: 'My Cases', path: '/court/cases' },
        ]}
      />

      {/* Page Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B3D91] mb-1">My Cases</h1>
          <p className="text-[#1A1A1A]/60 text-sm">
            All cases assigned to your docket — click any case to view full details and proceedings.
          </p>
        </div>
        <span className="bg-[#0B3D91]/10 text-[#0B3D91] text-sm font-semibold px-3 py-1.5 rounded-full">
          {filtered.length} Case{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by case title or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          {['All', 'Hearing', 'Pending', 'Disposed'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                filterStatus === s
                  ? 'bg-[#0B3D91] text-white border-[#0B3D91]'
                  : 'bg-white text-[#1A1A1A]/70 border-gray-200 hover:border-[#0B3D91]/40'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Cases List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Scale className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-[#1A1A1A]/60 font-medium">No cases match your search.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const caseId = c.caseId || c.id;
            const status = c.status || 'Pending';
            return (
              <div
                key={caseId}
                className="bg-white rounded-xl border border-gray-100 p-5 hover:border-[#0B3D91]/30 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-[#0B3D91]/10 p-2.5 rounded-lg shrink-0">
                    <Scale className="w-5 h-5 text-[#0B3D91]" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-[#0B3D91] bg-[#0B3D91]/10 px-2 py-0.5 rounded">
                        {caseId}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[status] || 'bg-gray-100 text-gray-600'}`}>
                        {status}
                      </span>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                        {c.type || 'Criminal'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-[#1A1A1A] text-base">{c.title}</h3>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-[#1A1A1A]/60">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {c.location || 'District Court'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Registered: {c.date || 'N/A'}
                      </span>
                      {c.nextHearing && (
                        <span className="flex items-center gap-1 font-semibold text-purple-600">
                          <Clock className="w-3 h-3" /> Next Hearing: {c.nextHearing}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Link
                  to={`/court/cases/${caseId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 px-4 py-2 bg-[#0B3D91] text-white text-sm font-medium rounded-lg hover:bg-[#0B3D91]/90 transition-colors whitespace-nowrap shrink-0"
                >
                  Open Case ↗
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
