import { useState, useEffect } from 'react';
import { FileText, Download, Filter, Calendar, User, Search } from 'lucide-react';
import AuditTrail from '../../components/shared/AuditTrail';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatDateTime } from '../../utils/helpers';

export default function AuditLog() {
  const { t } = useLanguage();
  const [filterUser, setFilterUser] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllLogs = async () => {
      try {
        const token = localStorage.getItem('anveshak_token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        const res = await fetch(`${API_URL}/case/audit/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const d = data.data || data;
          const mappedLogs = d.map(l => ({
             id: l._id || l.id,
             action: l.action || 'ACTION_UNKNOWN',
             timestamp: l.createdAt || new Date().toISOString(),
             user: l.userId?.name || 'System',
             target: l.caseId || 'N/A',
             details: l.details || l.notes || 'No details provided'
          }));
          setLogs(mappedLogs);
        }
      } catch(e) {
        console.error("Failed to fetch logs", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAllLogs();
  }, []);

  const uniqueUsers = [...new Set(logs.map(l => l.user))].filter(Boolean);
  const uniqueActions = [...new Set(logs.map(l => l.action))].filter(Boolean);

  const filteredLogs = logs.filter(l => {
    const userMatch = !filterUser || l.user === filterUser;
    const actionMatch = !filterAction || l.action === filterAction;
    return userMatch && actionMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">{t('officer.auditLog') || 'Audit Log'}</h1>
          <p className="text-sm text-charcoal-muted mt-1">Complete record of all platform activity</p>
        </div>
        <button className="pill-btn bg-navy text-white hover:bg-navy-700 text-sm">
          <Download className="w-4 h-4" />
          Export Log
        </button>
      </div>

      {/* Filters */}
      <div className="gov-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Filter className="w-4 h-4 text-navy" />
            <span className="text-sm font-medium text-charcoal">Filters:</span>
          </div>
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="px-3 py-2 rounded-lg border border-navy-100 text-sm bg-white text-charcoal focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none"
            aria-label="Filter by user"
          >
            <option value="">All Users</option>
            {uniqueUsers.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 rounded-lg border border-navy-100 text-sm bg-white text-charcoal focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none"
            aria-label="Filter by action"
          >
            <option value="">All Actions</option>
            {uniqueActions.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Trail Table */}
      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading logs...</div>
      ) : (
        <AuditTrail limit={50} logs={filteredLogs} />
      )}

      {/* Info footer */}
      <div className="bg-navy-50 rounded-xl p-4 flex items-start gap-3">
        <FileText className="w-5 h-5 text-navy mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-navy">Tamper-Proof Audit Trail</p>
          <p className="text-xs text-charcoal-muted mt-1">
            All audit records are cryptographically signed and stored in an append-only ledger.
            Records cannot be modified or deleted. This ensures complete transparency and accountability.
          </p>
        </div>
      </div>
    </div>
  );
}
