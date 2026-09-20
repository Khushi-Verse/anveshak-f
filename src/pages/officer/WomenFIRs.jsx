import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, MapPin, Calendar, ExternalLink, Loader2, Shield, ShieldCheck } from 'lucide-react';
import Breadcrumb from '../../components/layout/Breadcrumb';
import StatusBadge from '../../components/shared/StatusBadge';
import { formatDate } from '../../utils/helpers';

export default function WomenFIRs() {
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWomenFIRs = async () => {
      try {
        const token = localStorage.getItem('anveshak_token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

        const res = await fetch(`${API_URL}/case/women-safety`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to load Women FIRs');
        }

        setCases(data.cases || []);
      } catch (err) {
        console.error('Women FIRs fetch error:', err);
        setError(err.message || 'Failed to load Women FIRs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWomenFIRs();
  }, []);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Home', path: '/' },
        { label: 'Women FIRs', path: '/officer/women-firs' },
      ]} />

      <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-pink-50 text-pink-700 flex items-center justify-center shrink-0">
              <ShieldCheck size={25} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy font-serif">Women FIRs</h1>
              <p className="text-gray-500 text-sm mt-1">
                FIRs explicitly marked as Women Safety cases by citizens and assigned to you.
              </p>
            </div>
          </div>
          <div className="px-4 py-2 rounded-lg bg-pink-50 text-pink-700 font-semibold text-sm">
            {cases.length} {cases.length === 1 ? 'Case' : 'Cases'}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="bg-white rounded-xl border border-gray-100 py-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-navy" />
        </div>
      )}

      {!isLoading && error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {!isLoading && !error && cases.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
          <div className="w-16 h-16 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={30} />
          </div>
          <h2 className="text-lg font-semibold text-navy">No Women FIRs found</h2>
          <p className="text-gray-500 mt-1">No assigned FIR has been marked as a Women Safety case yet.</p>
        </div>
      )}

      {!isLoading && !error && cases.length > 0 && (
        <div className="space-y-4">
          {cases.map((caseData) => {
            const fir = caseData.firId;
            return (
              <div
                key={caseData._id || caseData.caseId}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-bold text-navy font-mono text-sm">
                          {caseData.caseId}
                        </span>
                        <StatusBadge status={caseData.status} />
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-pink-50 text-pink-700 border border-pink-100">
                          Women FIR
                        </span>
                      </div>

                      <h2 className="text-lg font-semibold text-charcoal">
                        {fir?.category || 'Incident'}
                      </h2>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <FileText size={15} className="text-navy" />
                          <span>FIR: <strong className="text-charcoal">{fir?.firNumber || 'N/A'}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={15} className="text-navy" />
                          <span className="truncate">{fir?.incidentLocation || 'Unknown location'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={15} className="text-navy" />
                          <span>{formatDate(fir?.incidentDate || caseData.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <Link
                      to={`/officer/cases/${caseData.caseId}`}
                      className="shrink-0 px-4 py-2.5 bg-navy text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-navy/90 transition-colors"
                    >
                      <ExternalLink size={16} />
                      Open Case File
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-3 text-sm text-gray-600">
        <Shield size={18} className="text-navy mt-0.5 shrink-0" />
        <p>
          Women FIRs are shown here using the same officer access controls as other assigned cases.
          Only cases assigned to the logged-in officer are included.
        </p>
      </div>
    </div>
  );
}
