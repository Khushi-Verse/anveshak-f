import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import Breadcrumb from '../../components/layout/Breadcrumb';
import StatusBadge from '../../components/shared/StatusBadge';
import { Search, Filter, ChevronDown, Loader } from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';

export default function SmartSearch() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  const [filterValue, setFilterValue] = useState('');
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const token = localStorage.getItem('anveshak_token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        
        const res = await fetch(`${API_URL}/case`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          // Transform backend cases into expected format
          const formattedCases = (data.cases || data).map(c => ({
            id: c.caseId || c._id,
            realId: c._id,
            title: c.title || c.firId?.incidentDescription?.substring(0, 30) + '...' || 'Investigation',
            type: c.firId?.incidentCategory || 'General',
            status: c.status,
            assignedTo: c.assignedTo ? (c.assignedTo.name || 'Assigned') : 'Pending',
            lastActivity: c.updatedAt || c.createdAt
          }));
          setCases(formattedCases);
        } else {
          setError('Failed to fetch cases');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  const filters = ['Case Type', 'Date Range', 'Keyword', 'MO Pattern', 'Department', 'Status'];

  const breadcrumbs = [
    { label: t('Home') || 'Home', path: '/' },
    { label: t('Smart Search') || 'Smart Search', path: '/officer/search' }
  ];

  const filteredCases = cases.filter(c => {
    const searchMatch = !searchTerm || 
      c.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.assignedTo && c.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!activeFilter || !filterValue) return searchMatch;

    const filterValLower = filterValue.toLowerCase();
    let filterMatch = true;
    switch (activeFilter) {
      case 'Case Type':
        filterMatch = c.type?.toLowerCase().includes(filterValLower);
        break;
      case 'Department':
        filterMatch = c.department && c.department.toLowerCase().includes(filterValLower);
        break;
      case 'Status':
        filterMatch = c.status && c.status.toLowerCase().includes(filterValLower);
        break;
      default:
        filterMatch = true;
    }

    return searchMatch && filterMatch;
  });

  return (
    <div className="space-y-6">
      <Breadcrumb items={breadcrumbs} />

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-4 rounded-xl border-gray-200 bg-gray-50 text-charcoal focus:bg-white focus:ring-2 focus:ring-navy focus:border-transparent transition-all"
            placeholder={t('Search cases, documents, or patterns...') || 'Search cases, documents, or patterns...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(activeFilter === filter ? null : filter)}
              className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === filter
                  ? 'bg-navy text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter}
              <ChevronDown className="w-4 h-4" />
            </button>
          ))}
        </div>

        {activeFilter && (
          <div className="mt-4 p-4 border border-gray-100 rounded-lg bg-gray-50 flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">{activeFilter}:</span>
            <input 
              type="text" 
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="px-3 py-1 border border-gray-200 rounded-md text-sm flex-1 max-w-xs focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
              placeholder={`Enter ${activeFilter.toLowerCase()}...`}
            />
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-semibold text-charcoal">{t('Search Results') || 'Search Results'}</h2>
          <span className="text-sm text-gray-500">{filteredCases.length} {t('cases found') || 'cases found'}</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100 text-sm text-gray-500">
                <th className="px-6 py-4 font-medium">{t('Case ID') || 'Case ID'}</th>
                <th className="px-6 py-4 font-medium">{t('Title') || 'Title'}</th>
                <th className="px-6 py-4 font-medium">{t('Type') || 'Type'}</th>
                <th className="px-6 py-4 font-medium">{t('Status') || 'Status'}</th>
                <th className="px-6 py-4 font-medium">{t('Assigned To') || 'Assigned To'}</th>
                <th className="px-6 py-4 font-medium">{t('Last Activity') || 'Last Activity'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCases.map((c) => (
                <tr 
                  key={c.id} 
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => window.open(`/officer/cases/${c.id}`, '_blank', 'noopener,noreferrer')}
                >
                  <td className="px-6 py-4">
                    <span className="font-semibold text-navy hover:underline">{c.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-charcoal font-medium">{c.title}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{c.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {c.assignedTo ? (Array.isArray(c.assignedTo) ? c.assignedTo.join(', ') : c.assignedTo) : 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(c.lastUpdated || c.lastActivity)}
                  </td>
                </tr>
              ))}
              {filteredCases.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {t('No cases found matching your search.') || 'No cases found matching your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
