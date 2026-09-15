import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { FileText, BarChart, Shield, UploadCloud, Lock, CheckCircle2, Download } from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import HashVerificationModal from '../../components/shared/HashVerificationModal';
import SigVerificationModal from '../../components/shared/SigVerificationModal';

export default function ResourceUpload() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('Documents');
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [verifyingEvidence, setVerifyingEvidence] = useState(null);
  const [verifyingSigEvidence, setVerifyingSigEvidence] = useState(null);
  const fileInputRef = useRef(null);
  const [currentFiles, setCurrentFiles] = useState([]);

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
          const casesArray = Array.isArray(data.cases) ? data.cases : Array.isArray(data) ? data : [];
          setCases(casesArray);
          if (casesArray.length > 0) {
            setSelectedCase(casesArray[0].caseId || casesArray[0]._id);
          }
        }
      } catch (err) {
        console.error("Failed to load cases", err);
      }
    };
    fetchCases();
  }, []);

  useEffect(() => {
    const fetchEvidence = async () => {
      if (!selectedCase) return;
      try {
        const token = localStorage.getItem('anveshak_token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        const res = await fetch(`${API_URL}/case/${selectedCase}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const caseEv = data.case?.evidence || data.evidence;
          if (caseEv) {
             setCurrentFiles(caseEv.map(e => ({
                id: e.evidenceId || e._id,
                evidenceId: e.evidenceId || e._id,
                name: e.fileName || 'Document',
                size: 'Encrypted',
                date: e.createdAt,
                type: 'Documents',
                fileHash: e.fileHash,
                verificationStatus: e.verificationStatus
             })));
          } else {
             setCurrentFiles([]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch evidence", err);
      }
    };
    fetchEvidence();
  }, [selectedCase]);

  const breadcrumbs = [
    { label: t('Home') || 'Home', path: '/' },
    { label: t('Resource Upload') || 'Resource Upload', path: '/officer/upload' }
  ];

  const handleDivClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!selectedCase) {
      alert("Please select a case first");
      return;
    }

    setIsUploading(true);
    setUploadMessage(null);

    try {
      const token = localStorage.getItem('anveshak_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caseId', selectedCase);
      formData.append('description', `Uploaded as ${activeTab}`);

      const res = await fetch(`${API_URL}/evidence/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        setUploadMessage({ type: 'success', text: 'File uploaded successfully!' });
        
        // Refresh evidence list
        const caseRes = await fetch(`${API_URL}/case/${selectedCase}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
          if (caseRes.ok) {
            const caseData = await caseRes.json();
            const caseEv = caseData.case?.evidence || caseData.evidence;
            if (caseEv) {
               setCurrentFiles(caseEv.map(ev => ({
                  id: ev.evidenceId || ev._id,
                  evidenceId: ev.evidenceId || ev._id,
                  name: ev.fileName || 'Document',
                  size: 'Encrypted',
                  date: ev.createdAt,
                  type: 'Documents',
                  fileHash: ev.fileHash,
                  verificationStatus: ev.verificationStatus
               })));
            }
          }
      } else {
        const data = await res.json();
        setUploadMessage({ type: 'error', text: data.message || 'Upload failed' });
      }
    } catch (err) {
      setUploadMessage({ type: 'error', text: err.message });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getIcon = (type) => {
    if (type === 'Documents') return <FileText className="w-6 h-6 text-blue-500" />;
    if (type === 'Reports') return <BarChart className="w-6 h-6 text-purple-500" />;
    if (type === 'Evidence') return <Shield className="w-6 h-6 text-alert" />;
    return <FileText className="w-6 h-6" />;
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={breadcrumbs} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
        <label className="font-medium text-charcoal">{t('Select Case') || 'Select Case'}:</label>
        <select 
          value={selectedCase} 
          onChange={(e) => setSelectedCase(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
        >
          {cases.map(c => (
            <option key={c.caseId || c._id} value={c.caseId || c._id}>
              {c.caseNumber || c.title || c.caseId || c._id}
            </option>
          ))}
        </select>
      </div>

      {uploadMessage && (
        <div className={`p-4 rounded-lg text-sm ${uploadMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {uploadMessage.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {['Documents', 'Reports', 'Evidence'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-gray-50 text-navy border-b-2 border-navy'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t(tab) || tab}
            </button>
          ))}
        </div>

        <div className="p-6">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />
          <div 
            onClick={handleDivClick}
            className="dropzone w-full p-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 hover:border-navy transition-all cursor-pointer flex flex-col items-center justify-center text-center"
          >
            {isUploading ? (
              <div className="animate-pulse flex flex-col items-center">
                <UploadCloud className="w-12 h-12 text-navy mb-4 animate-bounce" />
                <p className="text-charcoal font-medium">{t('Encrypting and Uploading...') || 'Encrypting and Uploading...'}</p>
              </div>
            ) : (
              <>
                <UploadCloud className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-charcoal font-medium text-lg mb-1">{t('Drag and drop files here') || 'Drag and drop files here'}</p>
                <p className="text-gray-500 text-sm mb-4">{t('or click to browse') || 'or click to browse'}</p>
                <div className="flex items-center gap-2 text-xs text-forest bg-forest/10 px-3 py-1.5 rounded-full font-medium">
                  <Lock className="w-3 h-3" />
                  {t('AES-256 End-to-End Encryption Enabled') || 'AES-256 End-to-End Encryption Enabled'}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-charcoal mb-4">{t('Recently Uploaded') || 'Recently Uploaded'}</h3>
        <div className="space-y-3">
          {currentFiles.map(file => (
            <div key={file.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  {getIcon(file.type)}
                </div>
                <div>
                  <p className="font-medium text-charcoal">{file.name}</p>
                  <p className="text-xs text-gray-500">{file.size} • {formatDate(file.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setVerifyingEvidence(file)}
                  className="px-3 py-1.5 bg-violet-100 text-violet-700 hover:bg-violet-200 rounded transition-colors text-xs font-semibold whitespace-nowrap"
                >
                  Verify Hash
                </button>
                <button 
                  onClick={() => setVerifyingSigEvidence(file)}
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors text-xs font-semibold whitespace-nowrap"
                >
                  Verify Sig
                </button>
                <button className="p-1.5 text-slate-400 hover:text-navy hover:bg-gray-100 rounded transition-colors" title="Download">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {currentFiles.length === 0 && (
            <p className="text-gray-500 text-center py-4">{t('No files uploaded in this category yet.') || 'No files uploaded in this category yet.'}</p>
          )}
        </div>
      </div>

      <HashVerificationModal 
        isOpen={!!verifyingEvidence} 
        onClose={() => setVerifyingEvidence(null)} 
        evidence={verifyingEvidence}
        caseId={selectedCase}
      />
      
      <SigVerificationModal 
        isOpen={!!verifyingSigEvidence} 
        onClose={() => setVerifyingSigEvidence(null)} 
        evidence={verifyingSigEvidence}
        caseId={selectedCase}
      />
    </div>
  );
}
