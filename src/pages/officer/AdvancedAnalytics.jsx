import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  RefreshCw,
  ShieldAlert,
  CopyCheck,
  TrendingUp,
} from 'lucide-react';



const labelize = (value) =>
  String(value || 'Unknown')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
};

const formatMonth = (value) => {
  const [year, month] = String(value || '').split('-');
  if (!year || !month) return value;
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  });
};

function StatCard({ icon: Icon, title, value, note }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-charcoal mt-2">{value}</p>
          <p className="text-xs text-gray-400 mt-1">{note}</p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-navy/10 text-navy flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function HorizontalBars({ title, data, emptyText, limit = 10 }) {
  const visibleData = data.slice(0, limit);
  const max = Math.max(...visibleData.map((item) => item.count), 1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 className="w-5 h-5 text-navy" />
        <h2 className="text-lg font-semibold text-charcoal">{title}</h2>
      </div>

      {visibleData.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">{emptyText}</p>
      ) : (
        <div className="space-y-4">
          {visibleData.map((item) => (
            <div key={item.name}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-charcoal font-medium truncate pr-3">
                  {labelize(item.name)}
                </span>
                <span className="text-gray-500 font-semibold">{item.count}</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-navy rounded-full transition-all duration-500"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TrendChart({ data }) {
  const max = Math.max(...data.map((item) => item.count), 1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className="w-5 h-5 text-forest" />
        <h2 className="text-lg font-semibold text-charcoal">Crime Trends</h2>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">
          No dated case records are available yet.
        </p>
      ) : (
        <div className="h-56 flex items-end gap-3 overflow-x-auto pb-7">
          {data.map((item) => {
            const height = Math.max((item.count / max) * 100, 5);

            return (
              <div
                key={item.month}
                className="min-w-16 h-full flex flex-col justify-end items-center gap-2"
              >
                <span className="text-xs font-semibold text-charcoal">
                  {item.count}
                </span>
                <div
                  className="w-8 rounded-t-lg bg-forest/80 transition-all duration-500"
                  style={{ height: `${height}%` }}
                  title={`${formatMonth(item.month)}: ${item.count} cases`}
                />
                <span className="text-[10px] text-gray-500 rotate-[-35deg] whitespace-nowrap">
                  {formatMonth(item.month)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SimilarCasesPanel({ groups }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-5">
        <CopyCheck className="w-5 h-5 text-navy" />
        <div>
          <h2 className="text-lg font-semibold text-charcoal">Similar Cases</h2>
          <p className="text-xs text-gray-500">
            NLP similarity using incident text, category and location
          </p>
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">
          No sufficiently similar case pairs found yet.
        </p>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div
              key={`${group.caseId}-${group.relatedCaseId}`}
              className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-charcoal truncate">
                  {group.caseId}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  Related to {group.relatedCaseId}
                </p>
              </div>
              <span className="shrink-0 text-sm font-bold text-navy">
                {Math.round(group.similarity * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdvancedAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const loadAnalytics = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('anveshak_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      
      const res = await fetch(`${API_URL}/case`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to fetch cases');
      const data = await res.json();
      let cases = [];
      if (Array.isArray(data)) cases = data;
      else if (Array.isArray(data.cases)) cases = data.cases;
      else if (Array.isArray(data.data)) cases = data.data;

      // Aggregations
      const totalCases = cases.length;
      let highPriority = 0;
      let pendingCases = 0;
      let closedCases = 0;
      
      const catCount = {};
      const locCount = {};
      const prioCount = {};
      const statusCount = {};

      cases.forEach(c => {
        if (c.priority === 'High' || c.priority === 'Critical') highPriority++;
        if (c.status !== 'Closed' && c.status !== 'Resolved') pendingCases++;
        if (c.status === 'Closed' || c.status === 'Resolved') closedCases++;
        
        const cat = c.category || c.type || 'Unknown';
        catCount[cat] = (catCount[cat] || 0) + 1;
        
        const loc = c.location || 'Unknown';
        locCount[loc] = (locCount[loc] || 0) + 1;
        
        const prio = c.priority || 'Normal';
        prioCount[prio] = (prioCount[prio] || 0) + 1;
        
        const stat = c.status || 'Unknown';
        statusCount[stat] = (statusCount[stat] || 0) + 1;
      });

      const toArray = (obj) => Object.entries(obj).map(([label, count]) => ({ label, count })).sort((a,b) => b.count - a.count);

      const resolutionRate = totalCases ? ((closedCases / totalCases) * 100).toFixed(1) : 0;

      const dynamicData = {
        summary: {
          totalCases,
          highPriorityCases: highPriority,
          pendingCases,
          similarCases: 0,
          closedCases,
          resolutionRate
        },
        categories: toArray(catCount),
        locations: toArray(locCount).slice(0, 5),
        priorities: toArray(prioCount),
        monthlyTrend: [
          { label: 'Current', count: totalCases }
        ],
        status: toArray(statusCount),
        similarGroups: [],
        latestCases: cases.slice(0, 5).map(c => ({
          id: c.caseId || c._id,
          category: c.category || c.type || 'Unknown',
          status: c.status || 'Unknown',
          priority: c.priority || 'Normal'
        })),
        source: 'Live System Data',
        generatedAt: new Date().toISOString()
      };

      setAnalytics(dynamicData);
    } catch (err) {
      setError(err.message || 'Unable to load analytics.');
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const topLocation = useMemo(
    () => analytics?.locations?.[0],
    [analytics]
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-navy" />
              <h1 className="text-2xl font-bold text-charcoal">
                Advanced Analytics
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Real-time statistics calculated from stored case records.
            </p>
          </div>

          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-navy text-white text-sm font-semibold hover:bg-navy/90 disabled:opacity-60"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh Data
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
          <label className="text-sm text-gray-600">
            <span className="block mb-1 font-medium">From</span>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </div>
          </label>

          <label className="text-sm text-gray-600">
            <span className="block mb-1 font-medium">To</span>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </div>
          </label>

          <div className="flex items-end">
            <button
              onClick={loadAnalytics}
              className="w-full px-4 py-2 rounded-lg border border-navy text-navy font-semibold text-sm hover:bg-navy/5"
            >
              Apply Date Range
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-alert/20 bg-alert/5 px-4 py-3 text-sm text-alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-500">
          Loading analytics…
        </div>
      ) : analytics ? (
        <>
          {/* Requested dashboard statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              icon={FileText}
              title="Total Cases"
              value={analytics.summary.totalCases}
              note="Cases in selected range"
            />
            <StatCard
              icon={ShieldAlert}
              title="High Priority Cases"
              value={analytics.summary.highPriorityCases}
              note="High / critical / urgent"
            />
            <StatCard
              icon={Clock3}
              title="Pending Cases"
              value={analytics.summary.pendingCases}
              note="Pending / active investigation"
            />
            <StatCard
              icon={CopyCheck}
              title="Similar Cases"
              value={analytics.summary.similarCases}
              note="Cases with a matching group"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HorizontalBars
              title="Cases by Category"
              data={analytics.categories}
              emptyText="No case records available yet."
            />

            <HorizontalBars
              title="Cases by Location"
              data={analytics.locations}
              emptyText="No location data available yet."
            />

            <HorizontalBars
              title="Priority / Risk"
              data={analytics.priorities || []}
              emptyText="No priority analysis available yet."
            />

            <TrendChart data={analytics.monthlyTrend} />

            <HorizontalBars
              title="Case Status"
              data={analytics.status}
              emptyText="No case records available yet."
            />

            <SimilarCasesPanel groups={analytics.similarGroups || []} />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-5">
                <CheckCircle2 className="w-5 h-5 text-navy" />
                <h2 className="text-lg font-semibold text-charcoal">
                  Case Resolution
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Closed Cases</p>
                  <p className="text-2xl font-bold text-charcoal mt-1">
                    {analytics.summary.closedCases}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Resolution Rate</p>
                  <p className="text-2xl font-bold text-charcoal mt-1">
                    {analytics.summary.resolutionRate}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-charcoal">
                  Recent Case Records
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Latest records returned by the analytics service
                </p>
              </div>

              {topLocation && (
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin className="w-4 h-4" />
                  Top location:
                  <span className="font-semibold text-charcoal">
                    {topLocation.name}
                  </span>
                </div>
              )}
            </div>

            {analytics.latestCases.length === 0 ? (
              <div className="p-10 text-center">
                <FileText className="w-10 h-10 mx-auto text-gray-300" />
                <p className="font-semibold text-charcoal mt-3">
                  No case data yet
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  The analytics service is connected, but no FIR/case records are available yet.
                  Once the core backend API is configured, real records will be analysed automatically.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="text-left px-6 py-3 font-semibold">
                        Case / FIR
                      </th>
                      <th className="text-left px-6 py-3 font-semibold">
                        Category
                      </th>
                      <th className="text-left px-6 py-3 font-semibold">
                        Location
                      </th>
                      <th className="text-left px-6 py-3 font-semibold">
                        Priority
                      </th>
                      <th className="text-left px-6 py-3 font-semibold">
                        Status
                      </th>
                      <th className="text-left px-6 py-3 font-semibold">
                        Filed
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {analytics.latestCases.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 font-medium text-charcoal">
                          {item.id}
                        </td>
                        <td className="px-6 py-3 text-gray-600">
                          {labelize(item.type)}
                        </td>
                        <td className="px-6 py-3 text-gray-600">
                          {item.location}
                        </td>
                        <td className="px-6 py-3 text-gray-600">
                          {labelize(item.priority)}
                        </td>
                        <td className="px-6 py-3 text-gray-600">
                          {labelize(item.status)}
                        </td>
                        <td className="px-6 py-3 text-gray-600">
                          {formatDate(item.filedDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400">
            Data source: {analytics.source}. Last calculated:{' '}
            {formatDate(analytics.generatedAt)}.
          </p>
        </>
      ) : null}
    </div>
  );
}
