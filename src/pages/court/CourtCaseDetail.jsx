import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { mockCourtCases } from '../../data/mockData';
import CaseTimeline from '../../components/shared/CaseTimeline';
import SignatureVerification from '../../components/shared/SignatureVerification';
import {
  ArrowLeft, Download, Clock, MapPin, FileText,
  CheckCircle, Plus, Scale, X, UploadCloud, AlertCircle, FileDown, Activity, Upload
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

  // Court proceedings orders list
  const [orders, setOrders] = useState([
    {
      hearingDate: '2026-09-10',
      note: 'First hearing completed. Bail application reviewed; defense presented preliminary arguments. IO directed to submit additional forensic evidence by next hearing.',
      nextHearingDate: '2026-09-15',
      pdfName: 'Interim_Order_Sept10.pdf',
      signedBy: 'Hon. Justice Meera Desai',
      signedAt: 'Sept 10, 2026',
    },
  ]);

  // Find case from mock data or fallback
  const caseData = mockCourtCases?.find(c => c.id === id || c.caseId === id) || {
    id: id,
    caseId: id || 'ANV-2026-0342',
    title: 'State vs. Rohit Mehra & Anr.',
    status: 'Hearing',
    priority: 'Normal',
    type: 'Criminal',
    date: 'Sept 8, 2026',
    location: 'District Court, Delhi',
    description: 'Assault and wrongful restraint under IPC Sec 323, 341. Charge sheet filed by IO Inspector Sharma.',
  };

  const judgeName = user?.name ? `Hon. Justice ${user.name}` : 'Hon. Justice Meera Desai';

  // Inline documents state
  const [documents, setDocuments] = useState(caseData.evidence || [
    { id: 1, filename: 'Charge_Sheet_Final.pdf',  type: 'Charge Sheet', uploadedBy: 'IO Inspector Sharma', date: '2026-09-07', size: '2.4 MB' },
    { id: 2, filename: 'Forensic_Report_FSL.pdf', type: 'Forensic',     uploadedBy: 'Dr. Gupta (FSL)',      date: '2026-09-05', size: '1.1 MB' },
    { id: 3, filename: 'Medical_Report.pdf',      type: 'Medical',      uploadedBy: 'City Hospital',        date: '2026-09-04', size: '850 KB' },
    { id: 4, filename: 'Witness_Statements.pdf',  type: 'Statement',    uploadedBy: 'IO Inspector Sharma',  date: '2026-09-03', size: '3.2 MB' },
  ]);

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
    const token = localStorage.getItem('token') || '';
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

      const newOrder = {
        hearingDate: data.order.hearingDate,
        note: data.order.note,
        nextHearingDate: data.order.nextHearingDate || 'TBD',
        pdfName: data.document?.filename || (orderFile ? orderFile.name : null),
        signedBy: data.order.signedBy,
        signedAt: new Date(data.order.signedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };

      setOrders(prev => [...prev, newOrder]);

      if (data.document) {
        setDocuments(prev => [
          {
            id: data.document._id,
            filename: data.document.filename,
            type: data.document.type,
            uploadedBy: judgeName,
            date: new Date(data.document.createdAt).toISOString().split('T')[0],
            size: `${(data.document.size / (1024 * 1024)).toFixed(2)} MB`,
            verified: data.document.digitalSignature?.verified
          },
          ...prev,
        ]);
      }

      alert('Order successfully recorded with Cryptographic Digital Signature verification.');
      setShowOrderModal(false);
      setVerifiedSignature(null);
      setOrderFile(null);
      setOrderNote('');
      setHearingDate('');
      setNextHearingDate('');
    } catch (err) {
      console.error(err);
      alert('Error saving order to backend.');
    }
  };

  const handleUploadJudgmentSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token') || '';
    const currentCaseId = caseData.caseId || id;

    const formData = new FormData();
    if (judgmentRemarks) formData.append('remarks', judgmentRemarks);
    if (verifiedSignature) formData.append('signatureData', JSON.stringify(verifiedSignature));
    if (judgmentFile) formData.append('file', judgmentFile);

    try {
      const res = await fetch(`${API_URL}/api/court/case/${currentCaseId}/judgment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error('Failed to save final judgment');
      const data = await res.json();

      setCaseStatus('Disposed');

      if (data.document) {
        setDocuments(prev => [
          {
            id: data.document._id,
            filename: data.document.filename,
            type: data.document.type,
            uploadedBy: judgeName,
            date: new Date(data.document.createdAt).toISOString().split('T')[0],
            size: `${(data.document.size / (1024 * 1024)).toFixed(2)} MB`,
            verified: data.document.digitalSignature?.verified
          },
          ...prev,
        ]);
      }

      alert(`Final Judgment securely uploaded and cryptographically signed. Case marked as DISPOSED.`);
      setJudgmentFile(null);
      setJudgmentRemarks('');
      setVerifiedSignature(null);
      setShowJudgmentModal(false);
    } catch (err) {
      console.error(err);
      alert('Error uploading judgment to backend.');
    }
  };

  const handleUploadDocumentSubmit = async (e) => {
    e.preventDefault();
    if (!docFile) return;
    const token = localStorage.getItem('token') || '';
    const currentCaseId = caseData.caseId || id;

    const formData = new FormData();
    formData.append('type', docType || 'Court Document');
    if (verifiedSignature) formData.append('signatureData', JSON.stringify(verifiedSignature));
    formData.append('file', docFile);

    try {
      const res = await fetch(`${API_URL}/api/court/case/${currentCaseId}/document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error('Failed to save document');
      const data = await res.json();

      if (data.document) {
        setDocuments(prev => [
          {
            id: data.document._id,
            filename: data.document.filename,
            type: data.document.type,
            uploadedBy: judgeName,
            date: new Date(data.document.createdAt).toISOString().split('T')[0],
            size: `${(data.document.size / (1024 * 1024)).toFixed(2)} MB`,
            verified: data.document.digitalSignature?.verified
          },
          ...prev,
        ]);
      }

      alert(`Document "${docFile.name}" successfully verified, cryptographically signed, and added to docket.`);
      setDocFile(null);
      setDocType('Court Order');
      setVerifiedSignature(null);
      setShowDocumentModal(false);
    } catch (err) {
      console.error(err);
      alert('Error uploading document to backend.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Navigation */}
        <div className="flex items-center justify-between">
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

            {/* Pre-Trial Unified Timeline — read-only for judge */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-[#0B3D91] mb-6 flex items-center">
                <Activity className="w-5 h-5 mr-2" /> Pre-Trial Timeline
              </h2>
              <div className="pointer-events-none opacity-90">
                <CaseTimeline stages={caseTimelineStages} currentStep={7} totalStages={7} />
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
          </div>

          {/* RIGHT: Inline Documents */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sticky top-24">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-[#0B3D91] flex items-center">
                  <FileText className="w-5 h-5 mr-2" /> Case Documents
                </h2>
                <button
                  onClick={() => triggerSignatureFlow('document')}
                  className="text-xs px-2.5 py-1 bg-[#0B3D91]/10 text-[#0B3D91] hover:bg-[#0B3D91]/20 rounded-md font-semibold transition-colors flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload
                </button>
              </div>
              <p className="text-xs text-[#1A1A1A]/60 mb-4">Verified documents from IO, forensics, and court records.</p>

              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-3 bg-[#FAF8F5] rounded-lg border border-gray-100 hover:border-[#0B3D91]/30 transition-colors group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="bg-white p-1.5 rounded shadow-sm shrink-0">
                          <FileText className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-[#1A1A1A] truncate" title={doc.filename}>
                            {doc.filename}
                          </h4>
                          <p className="text-[10px] text-[#1A1A1A]/60 mt-0.5">{doc.uploadedBy} · {doc.date}</p>
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded mt-1 inline-block">
                            {doc.type}
                          </span>
                        </div>
                      </div>
                      <button className="text-[#0B3D91] p-1.5 hover:bg-[#0B3D91]/10 rounded transition-colors opacity-0 group-hover:opacity-100 shrink-0 ml-2" title="Download">
                        <FileDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
          actionType === 'order'
            ? `Record Court Order for Case ${caseData.caseId || caseData.id}`
            : actionType === 'judgment'
            ? `Sign & Issue Final Judgment for Case ${caseData.caseId || caseData.id}`
            : `Upload Judicial Document to Case ${caseData.caseId || caseData.id}`
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

    </div>
  );
}
