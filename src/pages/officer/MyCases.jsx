import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import Breadcrumb from '../../components/layout/Breadcrumb';
import StatusBadge from '../../components/shared/StatusBadge';
import SignatureVerification from '../../components/shared/SignatureVerification';
import { getPriorityColor, formatDate } from '../../utils/helpers';
import {
  FileText, Shield, Users, Network, ChevronDown, ChevronUp,
  ExternalLink, Edit3, UploadCloud, Share2, PenTool, CheckCircle, Loader2
} from 'lucide-react';

export default function MyCases() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('All');
  const [expandedCase, setExpandedCase] = useState(null);

  const [sigModal, setSigModal] = useState({ open: false, action: '', caseId: '' });
  const [showUploadEvidence, setShowUploadEvidence] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [toast, setToast] = useState('');
  
  const [realCases, setRealCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const token = localStorage.getItem('anveshak_token');
        if (!token) return;

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        
        // Use real backend endpoints from existing caseController.js
        // POLICE gets assigned cases, others get all cases (as per existing logic)
        const endpoint = user?.role?.toUpperCase() === 'POLICE' ? '/case/assigned-to-me' : '/case';
        
        const res = await fetch(`${API_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = await res.json();
        const caseList = data.cases || [];
        
        if (caseList.length > 0) {
          const mappedCases = caseList.map(c => ({
            id: c.caseId || c._id,
            realId: c._id,
            firId: c.firId ? (c.firId.firNumber || c.firId._id) : 'N/A',
            // Note: IncidentType might be 'category' in the real DB based on FIR model
            title: c.firId ? `${c.firId.category || c.firId.incidentType || 'Incident'} — ${c.firId.incidentLocation || 'Unknown'}` : 'Case File',
            type: c.firId?.category || c.firId?.incidentType || 'General',
            priority: (c.priority || 'MEDIUM').toLowerCase(),
            status: c.status || 'ACTIVE',
            assignedTo: c.assignedOfficer ? c.assignedOfficer.name : 'Pending Assignment',
            team: c.assignedOfficer ? [c.assignedOfficer.name] : [],
            department: c.jurisdiction || 'Delhi Police',
            station: 'Local Jurisdiction',
            openDate: c.createdAt,
            lastActivity: c.updatedAt,
            documentsCount: c.courtProceedings?.length || 0,
            evidenceCount: 0,
            linkedCases: [],
          }));
          setRealCases(mappedCases);
        } else {
          setRealCases([]);
        }
      } catch (err) {
        console.error('Fetch cases error:', err);
        setError('Failed to load cases from the server');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCases();
  }, [user]);

  const tabs = ['All', 'active', 'court', 'resolved'];
  const tabLabels = { All: 'All Cases', active: 'Active', court: 'Court', resolved: 'Resolved' };

  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'My Cases', path: '/officer/cases' }
  ];

  const filteredCases = realCases.filter(c =>
    activeTab === 'All' ? true : (c.status || '').toLowerCase() === activeTab
  );

  const openSigModal = (action, caseId, e) => {
    e.stopPropagation();
    setSigModal({ open: true, action, caseId });
  };

  const handleSignatureVerified = (sigData) => {
    const entry = {
      id: `audit-${Date.now()}`,
      action: sigModal.action,
      caseId: sigModal.caseId,
      officer: sigData.officerName || user?.name || 'Officer',
      method: sigData.method,
      timestamp: sigData.timestamp,
      tag: 'Digitally Verified',
    };
    setAuditLog(prev => [entry, ...prev]);
    const ts = new Date(sigData.timestamp).toLocaleTimeString('en-IN');
    setToast(`Action verified and logged — ${entry.officer}, ${ts}`);
    setTimeout(() => setToast(''), 4000);
    setSigModal({ open: false, action: '', caseId: '' });
  };
  const handleEvidenceUpload = async (e) => {
    e.preventDefault();

    if (!evidenceFile || !selectedCaseId) {
      alert("Please select an evidence file.");
      return;
    }

    try {
      const token = localStorage.getItem("anveshak_token");
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5001/api";

      const formData = new FormData();

      formData.append("file", evidenceFile);
      formData.append("caseId", selectedCaseId);
      formData.append(
        "description",
        "Evidence document uploaded by officer"
      );

      const res = await fetch(
        `${API_URL}/evidence/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Evidence upload failed"
        );
      }

      setEvidenceFile(null);
      setSelectedCaseId(null);
      setShowUploadEvidence(false);

      setToast("Evidence uploaded successfully");

      setTimeout(() => {
        setToast("");
      }, 4000);
    } catch (err) {
      console.error("Evidence upload error:", err);
      alert("Error uploading evidence: " + err.message);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-navy" /></div>;
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-forest text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-medium animate-fade-in">
          <CheckCircle size={16} />
          {toast}
        </div>
      )}

      <Breadcrumb items={breadcrumbs} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy font-serif">My Assigned Cases</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and track cases assigned to you</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-navy/10 p-2 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab ? 'bg-navy text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 hover:text-navy'}`}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center text-sm font-semibold text-gray-500 px-2">
        <span>{filteredCases.length} cases</span>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {filteredCases.map(c => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
            <div
              className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              onClick={() => setExpandedCase(expandedCase === c.id ? null : c.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-bold text-navy font-mono text-sm">{c.id}</span>
                  <StatusBadge status={c.status} />
                  {c.priority && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${getPriorityColor(c.priority).bg || ''}`}>
                      {c.priority.charAt(0).toUpperCase() + c.priority.slice(1)} Priority
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-charcoal">{c.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {c.type} • IO: {c.assignedTo} • Last updated: {formatDate(c.lastActivity)}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1"><Users size={14} /> {c.team?.length || 1} Members</div>
                <div className="flex items-center gap-1"><FileText size={14} /> {c.documentsCount} Docs</div>
                <div className="flex items-center gap-1"><Shield size={14} /> {c.evidenceCount} Evidence</div>
                {expandedCase === c.id ? <ChevronUp size={20} className="text-navy" /> : <ChevronDown size={20} className="text-gray-400" />}
              </div>
            </div>

            {expandedCase === c.id && (
              <div className="border-t border-gray-100 bg-gray-50/50 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                  <div>
                    <h4 className="text-sm font-semibold text-navy mb-3">Case Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-3 text-gray-500"><span className="col-span-1">FIR Ref:</span><span className="col-span-2 text-charcoal font-medium font-mono">{c.firId}</span></div>
                      <div className="grid grid-cols-3 text-gray-500"><span className="col-span-1">Department:</span><span className="col-span-2 text-charcoal font-medium">{c.department}</span></div>
                      <div className="grid grid-cols-3 text-gray-500"><span className="col-span-1">Station:</span><span className="col-span-2 text-charcoal font-medium">{c.station}</span></div>
                      <div className="grid grid-cols-3 text-gray-500"><span className="col-span-1">Open Date:</span><span className="col-span-2 text-charcoal font-medium">{formatDate(c.openDate)}</span></div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200">
                  <Link to={`/officer/cases/${c.id}`} className="px-4 py-2 bg-white border border-gray-300 text-charcoal hover:bg-gray-50 text-sm font-semibold rounded-lg flex items-center gap-2">
                    <ExternalLink size={16} /> Open Case File
                  </Link>
                  <button onClick={(e) => openSigModal('Update Status', c.id, e)} className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-lg flex items-center gap-2 hover:bg-navy/90">
                    <Edit3 size={16} /> Update Status
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCaseId(c.id);
                      setShowUploadEvidence(true);
                      setEvidenceFile(null);
                    }}
                    className="px-4 py-2 bg-saffron text-white text-sm font-semibold rounded-lg flex items-center gap-2 hover:bg-saffron/90"
                  >
                    <UploadCloud size={16} /> Upload Evidence
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredCases.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield size={32} />
            </div>
            <h3 className="text-lg font-semibold text-navy">No cases found</h3>
            <p className="text-gray-500 mt-1">No cases are assigned to you.</p>
          </div>
        )}
      </div>
      {showUploadEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-serif font-bold text-violet-900">
                Upload Evidence
              </h2>

              <button
                onClick={() => {
                  setShowUploadEvidence(false);
                  setSelectedCaseId(null);
                  setEvidenceFile(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEvidenceUpload} className="space-y-5">

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Evidence File
                </label>

                <input
                  type="file"
                  onChange={(e) =>
                    setEvidenceFile(e.target.files[0])
                  }
                  className="block w-full text-sm text-slate-500"
                  required
                />
              </div>

              <div className="flex gap-3">

                <button
                  type="submit"
                  className="flex-1 bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 font-medium"
                >
                  Upload Evidence
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowUploadEvidence(false);
                    setSelectedCaseId(null);
                    setEvidenceFile(null);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

      <SignatureVerification
        isOpen={sigModal.open}
        onClose={() => setSigModal({ open: false, action: '', caseId: '' })}
        onVerify={handleSignatureVerified}
        actionName={sigModal.action}
        caseId={sigModal.caseId}
      />
    </div>
  );
}
