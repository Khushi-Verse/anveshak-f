import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { mockCourtCases } from '../../data/mockData';
import CaseTimeline from '../../components/shared/CaseTimeline';
import SignatureVerification from '../../components/shared/SignatureVerification';
import FormalCaseChat from '../../components/shared/FormalCaseChat';
import AuditTrail from '../../components/shared/AuditTrail';
import HashVerificationModal from '../../components/shared/HashVerificationModal';
import {
  ArrowLeft, Download, Clock, MapPin, FileText,
  CheckCircle, Plus, Scale, X, UploadCloud, AlertCircle, FileDown, Activity, Upload,
  FileCheck, Link as LinkIcon
} from 'lucide-react';

const API_ROOT =
  import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const API_URL = API_ROOT.replace(/\/api\/?$/, '');

// Unified pre-trial timeline stages — identical to officer/citizen view
const caseTimelineStages = [
  { event: 'FIR Filed',             description: 'First Information Report registered at the police station.', date: 'Sept 1, 2026',  by: 'Citizen / Station' },
  { event: 'Assigned to IO',        description: 'Case assigned to an Investigating Officer.',                 date: 'Sept 2, 2026',  by: 'Station Head' },
  { event: 'Investigation Ongoing', description: 'Active field investigation in progress.',                     date: 'Sept 3, 2026',  by: 'IO' },
  { event: 'Evidence Collected',    description: 'Physical and digital evidence gathered and sealed.',          date: 'Sept 4, 2026',  by: 'IO' },
  { event: 'Forensic Report',       description: 'FSL forensic lab reports submitted.',                        date: 'Sept 5, 2026',  by: 'FSL Lab' },
  { event: 'Charge Sheet Filed',    description: 'Final charge sheet submitted by Investigating Officer.',      date: 'Sept 7, 2026',  by: 'IO Inspector Sharma' },
  { event: 'Court Case Registered', description: 'Case registered in the court docket.',                       date: 'Sept 8, 2026',  by: 'Court Registry' },
];

export default function CourtCaseDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  // Signature verification modal controls
  const [isSigModalOpen, setIsSigModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null); // 'order' | 'judgment' | 'document'
  const [verifiedSignature, setVerifiedSignature] = useState(null);

  // Upload Modals state (opened AFTER signature is verified)
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showJudgmentModal, setShowJudgmentModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [verifyingEvidence, setVerifyingEvidence] = useState(null);

  // Case status
  const [caseStatus, setCaseStatus] = useState('Hearing');

  // Form states for Hearing / Add Order
  const [hearingDate, setHearingDate] = useState('');
  const [nextHearingDate, setNextHearingDate] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [orderFile, setOrderFile] = useState(null);

  // Form states for Final Judgment
  const [judgmentFile, setJudgmentFile] = useState(null);
  const [judgmentRemarks, setJudgmentRemarks] = useState('');

  // Form states for inline Document Upload
  const [docFile, setDocFile] = useState(null);
  const [docType, setDocType] = useState('Court Order');

  const [orders, setOrders] = useState([]);
  const [caseData, setCaseData] = useState({
    id: id,
    caseId: id,
    title: 'Loading Case...',
    status: 'Hearing',
    priority: 'Normal',
    type: 'N/A',
    date: 'N/A',
    location: 'N/A',
    description: 'Loading details from real database...',
  });

  const judgeName = user?.name ? `Hon. Justice ${user.name}` : 'Hon. Justice';
  const [documents, setDocuments] = useState([]);
  const navigate = useNavigate();

  const handleAnalyzeWithAI = async () => {
    try {
      const token = localStorage.getItem('anveshak_token');
      const res = await fetch(`${API_URL}/api/case/analyze`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ caseId: caseData.caseId || caseData.id })
      });
      
      if(res.ok) {
        window.location.reload();
      } else {
        const d = await res.json();
        alert("AI Analysis failed: " + (d.message || d.error));
      }
    } catch(err) {
      alert("Error analyzing case: " + err.message);
    }
  };

  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        const token = localStorage.getItem('anveshak_token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        
        // Fetch case
        const caseRes = await fetch(`${API_URL}/api/case/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (caseRes.ok) {
          const data = await caseRes.json();
          const c = data.case;
          // Fetch timeline
          let timelineData = []; 
          try {
             const tRes = await fetch(`${API_URL}/api/case/${id}/timeline`, { headers: { Authorization: `Bearer ${token}` } });
             if (tRes.ok) {
                const tData = await tRes.json();
                if (tData.timeline && tData.timeline.length > 0) {
                   timelineData = tData.timeline.map(t => ({
                     event: t.action ? t.action.replace(/_/g, ' ') : (t.status || 'Update'),
                     date: new Date(t.createdAt).toLocaleDateString(),
                     by: t.performedBy ? (t.performedBy.name || t.performedBy) : 'System',
                     description: t.description || ''
                   }));
                }
             }
          } catch (e) {
             console.error("Error fetching timeline", e);
          }

          // Compute statusStep
          const statusMap = {
            'FIR_REGISTERED': 1,
            'ASSIGNED': 2,
            'INVESTIGATION_ONGOING': 3,
            'EVIDENCE_COLLECTED': 4,
            'FORENSIC_REPORT': 5,
            'CHARGE_SHEET': 6,
            'COURT_PROCEEDINGS': 7,
            'DISPOSED': 9
          };
          const statusStep = statusMap[c.status] || 7;

          // Fetch audit
          let auditData = [];
          try {
             const aRes = await fetch(`${API_URL}/api/case/${id}/audit`, { headers: { Authorization: `Bearer ${token}` } });
             if (aRes.ok) {
                const aData = await aRes.json();
                if (aData.auditLogs || aData.length > 0) {
                   const logs = aData.auditLogs || aData;
                   auditData = logs.map(log => ({
                     id: log._id,
                     timestamp: new Date(log.createdAt).toLocaleString(),
                     by: log.userId ? (log.userId.name || log.userId) : 'System',
                     action: log.action ? log.action.replace(/_/g, ' ') : 'Action',
                     details: log.description || log.details
                   }));
                }
             }
          } catch(e) {}

          setCaseData({
            id: c.caseId || c._id,
            caseId: c.caseId || c._id,
            title: c.firId ? `${c.firId.category || 'Incident'} — ${c.firId.incidentLocation || 'Unknown'}` : 'Case File',
            status: c.status || 'COURT_PROCEEDINGS',
            priority: c.priority || 'MEDIUM',
            type: c.firId?.category || 'General',
            date: new Date(c.createdAt).toLocaleDateString(),
            location: c.jurisdiction || c.firId?.incidentLocation || 'District Court',
            description: c.firId?.incidentDescription || 'No description',
            aiAnalysis: c.aiAnalysis || null,
            timeline: timelineData.length > 0 ? timelineData : null,
            statusStep: statusStep,
            auditLog: auditData,
            evidence: c.evidence || []
          });
          setCaseStatus(c.status === 'DISPOSED' ? 'Disposed' : 'Hearing');
          
          if (c.courtProceedings) {
             const mappedOrders = c.courtProceedings.map(o => ({
                hearingDate: new Date(o.hearingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                note: o.note,
                nextHearingDate: o.nextHearingDate ? new Date(o.nextHearingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD',
                pdfName: o.documentId ? 'Court_Order.pdf' : null,
                signedBy: o.signedBy || 'Hon. Judge',
                signedAt: new Date(o.signedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
             }));
             setOrders(mappedOrders);
          }

          // Fetch documents
          let docs = [];
          
          // Evidence from case
          if (c.evidence) {
             docs = c.evidence.map(e => ({
                id: e.evidenceId || e._id,
                filename: e.fileName || e.filename || 'Evidence',
                type: 'Evidence',
                uploadedBy: e.uploadedBy ? (e.uploadedBy.name || e.uploadedBy) : 'System',
                date: new Date(e.createdAt || Date.now()).toISOString().split('T')[0],
                size: 'Unknown',
                blockchainTxHash: e.blockchainTxHash,
                fileHash: e.fileHash,
                verificationStatus: e.verificationStatus,
                verified: e.verificationStatus === 'VERIFIED'
             }));
          }

          try {
             const docRes = await fetch(`${API_URL}/api/court/case/${c.caseId || c._id}/documents`, {
                headers: { Authorization: `Bearer ${token}` }
             });
             if (docRes.ok) {
                const courtDocs = await docRes.json();
                const mappedCourtDocs = courtDocs.map(d => ({
                  id: d._id,
                  filename: d.filename,
                  type: d.type,
                  uploadedBy: d.uploadedBy ? (d.uploadedBy.name || d.uploadedBy) : 'Court',
                  date: new Date(d.createdAt).toISOString().split('T')[0],
                  size: d.size ? `${(d.size / (1024 * 1024)).toFixed(2)} MB` : 'Unknown',
                  verified: d.digitalSignature?.verified,
                  blockchainTxHash: d.blockchainTxHash,
                  fileHash: d.digitalSignature?.documentHash || d.fileHash
                }));
                docs = [...docs, ...mappedCourtDocs];
             }
          } catch (e) {
             console.error("Error fetching court documents", e);
          }
          setDocuments(docs);
        }
      } catch (error) {
        console.error("Error fetching case details:", error);
      }
    };

    fetchCaseDetails();
  }, [id]);

  /* ─── Step 1: Trigger Signature Verification ─── */
  const triggerSignatureFlow = (type) => {
    setActionType(type);
    setIsSigModalOpen(true);
  };

  /* ─── Step 2: Signature Verified → Open Upload Window ─── */
  const handleSignatureVerified = (sigData) => {
    setVerifiedSignature(sigData);
    setIsSigModalOpen(false);

    // Open corresponding upload window
    if (actionType === 'order') {
      setShowOrderModal(true);
    } else if (actionType === 'judgment') {
      setShowJudgmentModal(true);
    } else if (actionType === 'document') {
      setShowDocumentModal(true);
    }
  };

  /* ─── Form Submissions ─── */
  const handleAddOrderSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('anveshak_token') || '';
    const caseId = caseData.caseId || id;

    const formData = new FormData();
    formData.append('hearingDate', hearingDate || new Date().toISOString().split('T')[0]);
    formData.append('note', orderNote || 'Hearing concluded with judicial directions.');
    if (nextHearingDate) formData.append('nextHearingDate', nextHearingDate);
    if (verifiedSignature) formData.append('signatureData', JSON.stringify(verifiedSignature));
    if (orderFile) formData.append('file', orderFile);

    try {
      const res = await fetch(`${API_URL}/api/court/case/${caseId}/order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error('Failed to save order');
      const data = await res.json();
        alert('Document securely uploaded and cryptographically signed.');
        window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Error uploading document to backend.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Navigation */}
        <div className="flex items-center justify-between animate-fade-in-up mb-4 ">
          <Link to="/court" className="flex items-center text-[#0B3D91] hover:text-[#0B3D91]/80 font-medium transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              caseStatus === 'Disposed' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
            }`}>
              {caseStatus === 'Disposed' ? 'Disposed' : 'Active — Hearing'}
            </span>
            <button className="flex items-center px-3 py-1.5 bg-white border border-gray-200 text-[#1A1A1A]/70 rounded-lg hover:bg-gray-50 transition-colors text-sm shadow-sm">
              <Download className="w-4 h-4 mr-1.5" /> Download Dossier
            </button>
          </div>
        </div>

        {/* Header Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="font-mono text-sm font-semibold text-[#0B3D91] bg-[#0B3D91]/10 px-3 py-1 rounded-full">
                  {caseData.caseId || caseData.id}
                </span>
                <span className="text-sm text-[#1A1A1A]/60 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" /> {caseData.location}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">{caseData.title}</h1>
              <p className="text-[#1A1A1A]/70 text-sm max-w-2xl">{caseData.description}</p>
            </div>

            {/* Action Buttons with Signature Gates */}
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={() => triggerSignatureFlow('order')}
                disabled={caseStatus === 'Disposed'}
                className="flex items-center justify-center px-4 py-2 bg-[#0B3D91] text-white rounded-lg hover:bg-[#0B3D91]/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Order / Next Hearing
              </button>
              <button
                onClick={() => triggerSignatureFlow('judgment')}
                disabled={caseStatus === 'Disposed'}
                className="flex items-center justify-center px-4 py-2 bg-white border border-[#0B3D91] text-[#0B3D91] rounded-lg hover:bg-[#0B3D91]/5 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                <Scale className="w-4 h-4 mr-2" /> Upload Final Judgment
              </button>
            </div>
          </div>
        </div>


        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: Timelines (spans 2 cols) */}
          <div className="lg:col-span-2 space-y-6">

            {caseData.aiAnalysis && (
              <div className="bg-gradient-to-br from-indigo-900 to-violet-900 rounded-2xl shadow-lg p-6 mb-6 text-white animate-fade-in-up">
                <h2 className="text-xl font-serif font-bold mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-indigo-300" /> Gemini AI Analysis
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-indigo-200 text-xs uppercase font-bold">Classification</p>
                    <p className="font-semibold">{caseData.aiAnalysis.classification || 'Unknown'}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-indigo-200 text-xs uppercase font-bold">Confidence</p>
                    <p className="font-semibold">{caseData.aiAnalysis.confidence ?? caseData.aiAnalysis.confidenceScore ?? 'N/A'}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-indigo-200 text-xs uppercase font-bold">Severity</p>
                    <p className="font-semibold">{caseData.aiAnalysis.severity || 'Unknown'}</p>
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 mb-4">
                  <p className="text-indigo-200 text-xs uppercase font-bold mb-1">Summary</p>
                  <p className="text-sm leading-relaxed">{caseData.aiAnalysis.summary}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4 mb-4">
                  <p className="text-indigo-200 text-xs uppercase font-bold mb-1">Reasoning</p>
                  <p className="text-sm leading-relaxed">{caseData.aiAnalysis.severityReason || caseData.aiAnalysis.reasoning || 'No reasoning provided.'}</p>
                </div>
                
                {(caseData.aiAnalysis.keyInformation?.length > 0 || caseData.aiAnalysis.keywords?.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/10 rounded-lg p-4">
                      <p className="text-indigo-200 text-xs uppercase font-bold mb-2">Key Information</p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {caseData.aiAnalysis.keyInformation?.map((info, idx) => (
                          <li key={idx}>{info}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <p className="text-indigo-200 text-xs uppercase font-bold mb-2">Keywords</p>
                      <div className="flex flex-wrap gap-2">
                        {caseData.aiAnalysis.keywords?.map((kw, idx) => (
                          <span key={idx} className="bg-indigo-800/50 px-2 py-1 rounded text-xs border border-indigo-500/30">{kw}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {caseData.aiAnalysis.investigationLeads?.length > 0 && (
                  <div className="bg-white/10 rounded-lg p-4 mb-4 border-l-4 border-emerald-400">
                    <p className="text-emerald-300 text-xs uppercase font-bold mb-2">Investigation Leads</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {caseData.aiAnalysis.investigationLeads?.map((lead, idx) => (
                        <li key={idx}>{lead}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {caseData.aiAnalysis.riskIndicators?.length > 0 && (
                  <div className="bg-white/10 rounded-lg p-4 mb-4 border-l-4 border-red-400">
                    <p className="text-red-300 text-xs uppercase font-bold mb-2">Risk Indicators</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {caseData.aiAnalysis.riskIndicators?.map((risk, idx) => (
                        <li key={idx}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {caseData.aiAnalysis.entities && Object.keys(caseData.aiAnalysis.entities).length > 0 && (
                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="text-indigo-200 text-xs uppercase font-bold mb-2">Entities Extracted</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      {Object.entries(caseData.aiAnalysis.entities).map(([type, list]) => {
                        if (!list || list.length === 0) return null;
                        return (
                          <div key={type}>
                            <span className="text-indigo-300 font-semibold capitalize block mb-1">{type}:</span>
                            <span className="text-white">{list.join(', ')}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pre-Trial Unified Timeline — read-only for judge */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-[#0B3D91] mb-6 flex items-center">
                <Activity className="w-5 h-5 mr-2" /> Pre-Trial Timeline
              </h2>
              <div className="pointer-events-none opacity-90">
                <CaseTimeline 
                  stages={caseData.timeline || caseTimelineStages} 
                  currentStep={caseData.statusStep || 7} 
                  totalStages={9} 
                />
              </div>
            </div>

            {/* Court Proceedings Sub-Timeline */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-purple-700 flex items-center">
                  <Scale className="w-5 h-5 mr-2" /> Court Proceedings
                </h2>
                <button
                  onClick={() => triggerSignatureFlow('order')}
                  disabled={caseStatus === 'Disposed'}
                  className="text-xs px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg font-semibold border border-purple-200 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" /> Record Hearing
                </button>
              </div>

              {orders.length === 0 && caseStatus !== 'Disposed' ? (
                <div className="text-center p-8 bg-[#FAF8F5] rounded-xl border border-dashed border-gray-300">
                  <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-[#1A1A1A]/60">No hearings or orders recorded yet.</p>
                </div>
              ) : (
                <div className="relative ml-4 md:ml-8 border-l-2 border-purple-200 space-y-8 pb-4">
                  {orders.map((order, idx) => (
                    <div key={idx} className="relative pl-6">
                      <div className="absolute -left-[17px] top-1 w-8 h-8 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center shadow-sm">
                        <Scale className="w-4 h-4 text-purple-700" />
                      </div>
                      <div className="bg-[#FAF8F5] p-4 rounded-xl border border-purple-100">
                        <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                          <h4 className="font-bold text-[#1A1A1A]">Hearing on {order.hearingDate}</h4>
                          {order.nextHearingDate && order.nextHearingDate !== 'TBD' && (
                            <span className="text-xs font-medium bg-purple-50 text-purple-700 px-2 py-1 rounded-full border border-purple-100">
                              Next: {order.nextHearingDate}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#1A1A1A]/80 mb-3 leading-relaxed">{order.note}</p>
                        {order.pdfName && (
                          <div className="flex items-center gap-2 pt-3 border-t border-gray-200/60">
                            <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                            <span className="text-sm font-medium text-[#0B3D91] truncate">
                              {order.pdfName}
                            </span>
                            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 ml-auto flex items-center shrink-0">
                              <CheckCircle className="w-3 h-3 mr-1 text-emerald-500" /> Digitally Signed
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {caseStatus === 'Disposed' && (
                    <div className="relative pl-6">
                      <div className="absolute -left-[17px] top-1 w-8 h-8 rounded-full bg-green-100 border-2 border-white flex items-center justify-center shadow-sm">
                        <CheckCircle className="w-4 h-4 text-green-700" />
                      </div>
                      <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                        <h4 className="font-bold text-green-800 mb-1">Final Judgment Passed — Case Disposed</h4>
                        <p className="text-sm text-green-700 mb-3">All proceedings closed. SMS alert broadcast to parties.</p>
                        <div className="flex items-center gap-2 pt-3 border-t border-green-200/60">
                          <FileText className="w-4 h-4 text-green-700 shrink-0" />
                          <span className="text-sm font-medium text-green-900">
                            Final_Judgment_Signed.pdf
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Evidence & Documents */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-[#0B3D91] flex items-center">
                  <FileCheck className="w-5 h-5 mr-2" /> Evidence & Documents
                </h2>
                <button 
                  onClick={() => triggerSignatureFlow('document')}
                  className="text-xs px-3 py-1.5 bg-[#0B3D91]/10 text-[#0B3D91] hover:bg-[#0B3D91]/20 rounded-md font-semibold transition-colors flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5 mr-1" /> Add New
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-medium">Filename</th>
                      <th className="px-4 py-3 font-medium">File Hash (SHA-256)</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Uploaded By</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Blockchain</th>
                      <th className="px-4 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800 flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-purple-600" />
                          <span className="truncate max-w-[150px]" title={item.filename}>{item.filename}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-[10px] text-gray-500 truncate block max-w-[120px]" title={item.fileHash}>{item.fileHash || 'N/A'}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          <span className="px-2 py-1 bg-gray-100 rounded text-[10px]">{item.type}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs truncate max-w-[120px]">
                          {item.uploadedBy}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-[10px] font-medium ${
                            item.verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {item.verified ? 'VERIFIED' : 'PENDING'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono">
                          {item.blockchainTxHash ? (
                            <a href={`https://sepolia.etherscan.io/tx/${item.blockchainTxHash}`} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline flex items-center">
                              <LinkIcon className="w-3 h-3 mr-1" />
                              {item.blockchainTxHash.substring(0, 8)}...
                            </a>
                          ) : (
                            <span className="text-gray-400">Not Anchored</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right flex justify-end items-center space-x-2">
                          <button 
                            onClick={() => setVerifyingEvidence(item)}
                            className="px-2 py-1 bg-[#0B3D91]/10 text-[#0B3D91] hover:bg-[#0B3D91]/20 rounded transition-colors text-xs font-semibold whitespace-nowrap"
                          >
                            Verify Hash
                          </button>
                          <button className="p-1.5 text-purple-600 hover:bg-purple-100 rounded transition-colors inline-block" title="Download">
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {documents.length === 0 && (
                  <p className="text-center text-gray-500 py-6">No evidence or documents attached yet.</p>
                )}
              </div>
            </div>

            {/* Formal Case Chat */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <FormalCaseChat 
                caseId={caseData.caseId || caseData.id} 
                caseName={caseData.title} 
                currentStage={caseData.status} 
              />
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-[#0B3D91] mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2" /> Case Audit Log
              </h3>
              
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:ml-2.5 md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent max-h-[600px] overflow-y-auto pr-2">
                {caseData.auditLog && caseData.auditLog.length > 0 ? caseData.auditLog.map((log) => (
                  <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-gray-200 text-gray-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                    </div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border border-gray-100 bg-[#FAF8F5] shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-800 text-xs">{log.action}</span>
                      </div>
                      <div className="text-xs text-gray-600 mb-1 leading-relaxed">
                        {log.details}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100/50">
                        <span className="text-[10px] text-gray-500 font-medium bg-white px-2 py-0.5 rounded border border-gray-100">{log.by}</span>
                        <time className="text-[10px] text-gray-400 font-mono flex items-center"><Clock className="w-3 h-3 mr-1" />{log.timestamp}</time>
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500">No audit logs available.</p>
                )}
              </div>
              <button 
                onClick={() => setShowAuditModal(true)}
                className="w-full mt-4 py-2 bg-gray-50 hover:bg-gray-100 text-[#0B3D91] text-sm font-semibold rounded-lg transition-colors border border-gray-200 shadow-sm"
              >
                View Full Audit Trail
              </button>
            </div>
            
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── STEP 1: Signature Verification Modal (Draw / DigiLocker) ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <SignatureVerification 
        isOpen={isSigModalOpen} 
        onClose={() => setIsSigModalOpen(false)} 
        onVerified={handleSignatureVerified} 
        officerName={judgeName}
        actionDescription={
          actionType === 'order' ? 'Sign & Issue Court Order' : 
          actionType === 'judgment' ? 'Sign & Upload Final Judgment' : 
          'Sign & Upload Court Document'
        }
      />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── STEP 2A: Upload Order & Record Hearing Window ──────────── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-100 animate-scale-in">

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-[#FAF8F5]">
              <h2 className="text-lg font-bold text-[#0B3D91] flex items-center">
                <Plus className="w-5 h-5 mr-2" /> Add Order / Next Hearing
              </h2>
              <button
                onClick={() => setShowOrderModal(false)}
                className="p-1.5 text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[75vh]">
              {/* Identity Verified Badge */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start mb-5">
                <CheckCircle className="w-5 h-5 text-emerald-600 mr-2 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-emerald-800">
                    Identity Verified: {verifiedSignature?.officerName || judgeName}
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Your digital cryptographic signature and official court seal will be appended to this order.
                  </p>
                </div>
              </div>

              <form onSubmit={handleAddOrderSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#1A1A1A] mb-1">
                      Hearing Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={hearingDate}
                      onChange={e => setHearingDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#1A1A1A] mb-1">
                      Next Hearing Date
                    </label>
                    <input
                      type="date"
                      value={nextHearingDate}
                      onChange={e => setNextHearingDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1A1A1A] mb-1">
                    Judge's Order / Directions Note <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={orderNote}
                    onChange={e => setOrderNote(e.target.value)}
                    placeholder="Enter short order, summary of arguments heard, or judicial directions..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm resize-none"
                  />
                </div>

                {/* File Upload from System */}
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A1A] mb-1">
                    Upload Order File (from your computer)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={e => setOrderFile(e.target.files[0])}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 border border-slate-200 rounded-lg bg-slate-50/50 p-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {orderFile && (
                    <div className="mt-2 p-2.5 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between text-xs text-purple-800">
                      <span className="font-semibold truncate">Selected: {orderFile.name}</span>
                      <span className="text-slate-500 shrink-0">({(orderFile.size / 1024).toFixed(0)} KB)</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowOrderModal(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-[#0B3D91] text-white rounded-lg font-medium hover:bg-[#0B3D91]/90 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" /> Sign & Issue Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── STEP 2B: Upload Final Judgment Window ──────────────────── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {showJudgmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-100 animate-scale-in">

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-[#FAF8F5]">
              <h2 className="text-lg font-bold text-[#0B3D91] flex items-center">
                <Scale className="w-5 h-5 mr-2" /> Upload Final Judgment
              </h2>
              <button
                onClick={() => setShowJudgmentModal(false)}
                className="p-1.5 text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[75vh]">
              {/* Identity Verified Badge */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start mb-4">
                <CheckCircle className="w-5 h-5 text-emerald-600 mr-2 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-emerald-800">
                    Identity Verified: {verifiedSignature?.officerName || judgeName}
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Authorized Judicial Seal will be cryptographically anchored to this judgment.
                  </p>
                </div>
              </div>

              {/* Warning Notice */}
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start mb-4">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 shrink-0 mt-0.5" />
                <p className="text-xs text-red-800 font-medium leading-relaxed">
                  Notice: Final judgment permanently marks this case as <strong>"Disposed"</strong> and triggers SMS notifications to all registered litigants and the Investigating Officer.
                </p>
              </div>

              <form onSubmit={handleUploadJudgmentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A1A] mb-1">
                    Judgment Remarks / Verdict Summary
                  </label>
                  <textarea
                    rows={3}
                    value={judgmentRemarks}
                    onChange={e => setJudgmentRemarks(e.target.value)}
                    placeholder="Enter final verdict summary (e.g., Acquittal / Conviction details, sentencing)..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm resize-none"
                  />
                </div>

                {/* System File Input */}
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A1A] mb-1">
                    Select Final Judgment PDF (from your computer) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    required
                    onChange={e => setJudgmentFile(e.target.files[0])}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 border border-slate-200 rounded-lg bg-slate-50/50 p-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  {judgmentFile && (
                    <div className="mt-2 p-2.5 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between text-xs text-green-800">
                      <span className="font-semibold truncate">Selected: {judgmentFile.name}</span>
                      <span className="text-slate-500 shrink-0">({(judgmentFile.size / 1024).toFixed(0)} KB)</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowJudgmentModal(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Scale className="w-4 h-4" /> Sign & Dispose Case
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── STEP 2C: Upload General Case Document Window ──────────── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {showDocumentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-100 animate-scale-in">

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-[#FAF8F5]">
              <h2 className="text-lg font-bold text-[#0B3D91] flex items-center">
                <Upload className="w-5 h-5 mr-2" /> Upload Case Document
              </h2>
              <button
                onClick={() => setShowDocumentModal(false)}
                className="p-1.5 text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[75vh]">
              {/* Identity Verified Badge */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start mb-4">
                <CheckCircle className="w-5 h-5 text-emerald-600 mr-2 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-emerald-800">
                    Identity Verified: {verifiedSignature?.officerName || judgeName}
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Your digital seal will be securely attached to this court record.
                  </p>
                </div>
              </div>

              <form onSubmit={handleUploadDocumentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A1A] mb-1">
                    Document Category
                  </label>
                  <select
                    value={docType}
                    onChange={e => setDocType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
                  >
                    <option value="Court Order">Court Order</option>
                    <option value="Judicial Notice">Judicial Notice / Summons</option>
                    <option value="Bail Order">Bail Order</option>
                    <option value="Witness Summons">Witness Summons</option>
                    <option value="Miscellaneous">Miscellaneous Filing</option>
                  </select>
                </div>

                {/* System File Input */}
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A1A] mb-1">
                    Select File from System <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.png"
                    required
                    onChange={e => setDocFile(e.target.files[0])}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 border border-slate-200 rounded-lg bg-slate-50/50 p-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {docFile && (
                    <div className="mt-2 p-2.5 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between text-xs text-purple-800">
                      <span className="font-semibold truncate">Selected: {docFile.name}</span>
                      <span className="text-slate-500 shrink-0">({(docFile.size / 1024).toFixed(0)} KB)</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDocumentModal(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-[#0B3D91] text-white rounded-lg font-medium hover:bg-[#0B3D91]/90 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-4 h-4" /> Sign & Upload
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── STEP 5: Audit Trail Modal ──────────── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {showAuditModal && (
        <AuditTrail 
          logs={caseData.auditLog} 
          onClose={() => setShowAuditModal(false)} 
        />
      )}

      <HashVerificationModal 
        isOpen={!!verifyingEvidence} 
        onClose={() => setVerifyingEvidence(null)} 
        evidence={verifyingEvidence}
        caseId={caseData?.caseId || caseData?.id}
      />
    </div>
  );
}
