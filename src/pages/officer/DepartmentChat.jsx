import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import Breadcrumb from '../../components/layout/Breadcrumb';
import FormalCaseChat from '../../components/shared/FormalCaseChat';
import { MessageSquare, Hash, ChevronRight } from 'lucide-react';

/**
 * DepartmentChat — Formal Multi-Party Case Collaboration
 * Replaces casual chat with a structured government-grade memo thread.
 * In production, this would connect to a real-time messaging service with E2E encryption.
 */
export default function DepartmentChat() {
  const { t } = useLanguage();
  const [selectedCase, setSelectedCase] = useState('');
  const [caseChannels, setCaseChannels] = useState([]);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const token = localStorage.getItem('anveshak_token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        const res = await fetch(`${API_URL}/case/assigned-to-me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const cases = Array.isArray(data.cases) ? data.cases : Array.isArray(data) ? data : [];
          const channels = cases.map(c => ({
            id: c.caseId || c._id,
            name: c.title || c.firId?.incidentDescription?.substring(0, 30) + '...',
            stage: c.status
          }));
          setCaseChannels(channels);
          if (channels.length > 0) {
            setSelectedCase(channels[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load cases", err);
      }
    };
    fetchCases();
  }, []);

  const breadcrumbs = [
    { label: t('Home') || 'Home', path: '/' },
    { label: t('Case Collaboration') || 'Case Collaboration', path: '/officer/chat' }
  ];

  const activeChannel = caseChannels.find(c => c.id === selectedCase) || caseChannels[0];

  if (!activeChannel) {
    return <div className="p-8 text-center text-gray-500">Loading your cases...</div>;
  }

  return (
    <div className="space-y-4">
      <Breadcrumb items={breadcrumbs} />

      <div className="flex flex-col lg:flex-row gap-4" style={{ minHeight: 'calc(100vh - 180px)' }}>
        {/* Case Channel Sidebar */}
        <div className="lg:w-72 bg-white rounded-xl shadow-sm border border-gray-100 flex-shrink-0 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-navy/[0.02]">
            <h2 className="font-semibold text-charcoal flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-navy" />
              Case Channels
            </h2>
            <p className="text-xs text-gray-500 mt-1">Select a case to view its formal communication thread</p>
          </div>
          <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto">
            {caseChannels.map(channel => (
              <button
                key={channel.id}
                onClick={() => setSelectedCase(channel.id)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${
                  selectedCase === channel.id
                    ? 'bg-navy/5 border border-navy/20 shadow-sm'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Hash className="w-3.5 h-3.5 text-navy/60" />
                  <span className={`text-xs font-mono ${
                    selectedCase === channel.id ? 'text-navy font-bold' : 'text-gray-500'
                  }`}>
                    {channel.id}
                  </span>
                </div>
                <p className={`text-sm font-medium truncate ${
                  selectedCase === channel.id ? 'text-charcoal' : 'text-gray-600'
                }`}>
                  {channel.name}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-navy/10 text-navy font-medium">
                    {channel.stage}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${
                    selectedCase === channel.id ? 'text-navy translate-x-0.5' : 'text-gray-300'
                  }`} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Formal Case Chat */}
        <div className="flex-1 min-w-0">
          <FormalCaseChat
            caseId={activeChannel.id}
            caseName={activeChannel.name}
            currentStage={activeChannel.stage}
          />
        </div>
      </div>
    </div>
  );
}
