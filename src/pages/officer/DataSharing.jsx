import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { mockOfficerCases, mockSharedAccess } from '../../data/mockData';
import StatusBadge from '../../components/shared/StatusBadge';
import { getTimeRemaining } from '../../utils/helpers';
import { ShieldCheck, Share2, Clock, CheckCircle } from 'lucide-react';

export default function DataSharing() {
  const { t } = useLanguage();
  const [toastMessage, setToastMessage] = useState('');
  const [realCases, setRealCases] = useState([]);
  const [sharedCases, setSharedCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState('');

  const agencies = ['CBI', 'ED', 'Customs', 'State Police'];
  const durations = ['24h', '48h', '7 days', '30 days'];

  const breadcrumbs = [
    { label: t('Home') || 'Home', path: '/' },
    { label: t('Data Sharing') || 'Data Sharing', path: '/officer/sharing' }
  ];

  React.useEffect(() => {
    const fetchCases = async () => {
      try {
        const token = localStorage.getItem('anveshak_token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        const res = await fetch(`${API_URL}/case`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const d = await res.json();
          let cases = [];
          if (Array.isArray(d)) cases = d;
          else if (Array.isArray(d.cases)) cases = d.cases;
          else if (Array.isArray(d.data)) cases = d.data;
          
          setRealCases(cases);
          setSharedCases(cases.slice(0, 3)); // simulate shared cases with first 3 real cases
        }
      } catch (err) {
        console.error("Failed to fetch cases for data sharing", err);
      }
    };
    fetchCases();
  }, []);

  const handleRequest = (e) => {
    e.preventDefault();
    setToastMessage('Access request submitted successfully.');
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={breadcrumbs} />

      {toastMessage && (
        <div className="bg-forest text-white px-4 py-3 rounded-lg flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-navy-50/50 px-6 py-4 border-b border-navy-100 flex items-center">
            <Share2 className="w-5 h-5 text-navy mr-2" />
            <h2 className="text-lg font-semibold text-charcoal">Request Cross-Agency Access</h2>
          </div>

          <form onSubmit={handleRequest} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Agency</label>
              <select className="w-full border-gray-300 rounded-lg shadow-sm p-2 border focus:ring-navy focus:border-navy" required>
                <option value="">Select Agency</option>
                {agencies.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Case</label>
              <select 
                className="w-full border-gray-300 rounded-lg shadow-sm p-2 border focus:ring-navy focus:border-navy"
                value={selectedCase}
                onChange={(e) => setSelectedCase(e.target.value)}
                required
              >
                <option value="">Select Case</option>
                {realCases.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.caseId || c.id} - {c.category || c.type || 'Unknown'}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requested Documents</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded text-navy focus:ring-navy border-gray-300" />
                  <span className="text-sm text-gray-600">FIR & Initial Reports</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded text-navy focus:ring-navy border-gray-300" />
                  <span className="text-sm text-gray-600">Evidence Vault</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded text-navy focus:ring-navy border-gray-300" />
                  <span className="text-sm text-gray-600">Case Logs</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Duration</label>
              <select className="w-full border-gray-300 rounded-lg shadow-sm p-2 border focus:ring-navy focus:border-navy">
                {durations.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <button type="submit" className="w-full bg-navy text-white font-medium py-2 px-4 rounded-lg hover:bg-navy/90 transition-colors">
              Submit Request
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-forest/10 rounded-lg text-forest">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-charcoal">{t('Shared With Me') || 'Shared With Me'}</h2>
          </div>

          <div className="space-y-4">
            {sharedCases.map(c => {
              const isExpired = c.status === 'Closed';
              return (
                <div key={c._id || c.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-navy">{c.caseId || c.id}</h3>
                      <p className="text-xs text-gray-500">Shared by: {c.assignedTo?.name || 'System'}</p>
                    </div>
                    <StatusBadge status={isExpired ? 'Expired' : 'Active'} />
                  </div>
                  
                  <div className="mt-3 text-sm text-gray-600">
                    <p><strong>Category:</strong> {c.category || c.type || 'Unknown'}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-600">
                      <Clock className="w-4 h-4" />
                      {isExpired ? (
                        <span className="text-red-500">Expired</span>
                      ) : (
                        <span className="text-emerald-600">Active</span>
                      )}
                    </div>
                    {!isExpired && (
                      <button className="text-sm font-medium text-navy hover:text-navy-700 underline">
                        Access Documents
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
