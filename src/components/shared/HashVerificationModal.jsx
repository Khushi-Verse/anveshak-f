import React, { useState, useRef } from 'react';
import { X, Copy, CheckCircle, AlertTriangle, UploadCloud, Shield, Check } from 'lucide-react';

const HashVerificationModal = ({ isOpen, onClose, evidence, caseId, onVerifyComplete }) => {
  const [file, setFile] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen || !evidence) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(evidence.fileHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    if (!file) return;
    
    setIsVerifying(true);
    setResult(null);

    try {
      const token = localStorage.getItem('anveshak_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch(`${API_URL}/evidence/${evidence.evidenceId || evidence.id}/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setResult({
          success: data.verified,
          originalHash: data.originalHash,
          currentHash: data.currentHash,
          status: data.verificationStatus
        });
        if (onVerifyComplete) onVerifyComplete(data);
      } else {
        setResult({ success: false, error: data.message || 'Verification failed on server' });
      }
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden font-mono text-slate-300">
        <div className="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="text-xs font-semibold text-slate-400">integrity-check.sh</div>
          <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center text-emerald-400 font-bold text-lg mb-6 border-b border-slate-700 pb-3">
            <Shield className="w-5 h-5 mr-3" />
            Verify Evidence Integrity
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between">
              <span className="text-slate-500">Evidence ID:</span>
              <span className="text-white">{evidence.evidenceId || evidence.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Case ID:</span>
              <span className="text-white">{caseId}</span>
            </div>
            <div className="pt-3 border-t border-slate-800">
              <div className="text-slate-500 mb-1 flex justify-between items-center">
                <span>Original SHA-256 Hash:</span>
                <button onClick={handleCopy} className="flex items-center text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition-colors">
                  {copied ? <Check className="w-3 h-3 mr-1 text-emerald-400" /> : <Copy className="w-3 h-3 mr-1" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="text-xs text-amber-300 break-all bg-black/50 p-3 rounded border border-slate-800">
                {evidence.fileHash && evidence.fileHash !== 'N/A' ? evidence.fileHash : 'No hash available for this evidence.'}
              </div>
            </div>
          </div>

          {result ? (
            <div className={`p-4 rounded-lg border mb-6 animate-scale-in ${result.success ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
              <div className={`flex items-center font-bold text-lg mb-4 ${result.success ? 'text-emerald-400' : 'text-red-400'}`}>
                {result.success ? <><CheckCircle className="w-5 h-5 mr-2" /> ✓ Evidence Verified</> : <><AlertTriangle className="w-5 h-5 mr-2" /> ⚠ Evidence Integrity Failed</>}
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-slate-500 mb-1">Original Hash:</div>
                  <div className="break-all text-slate-300 bg-black/40 p-2 rounded">{result.originalHash || evidence.fileHash}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">Current File Hash:</div>
                  <div className={`break-all p-2 rounded ${result.success ? 'text-emerald-300 bg-emerald-900/30' : 'text-red-300 bg-red-900/30'}`}>
                    {result.currentHash || (result.error && 'N/A')}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-slate-500">Status:</span>
                  <span className={`font-bold px-2 py-1 rounded ${result.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {result.status || (result.success ? 'VERIFIED' : 'TAMPERED / FAILED')}
                  </span>
                </div>
                {!result.success && result.error && <div className="text-red-400 text-sm mt-2 p-2 bg-red-900/30 rounded border border-red-900">{result.error}</div>}
                {!result.success && !result.error && <div className="text-red-400 text-sm mt-2">The current file does not match the original evidence hash.</div>}
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <div className="text-slate-400 mb-2">Select evidence file to verify:</div>
              <label htmlFor="hash-file-input" className="cursor-pointer border border-dashed border-slate-600 hover:border-violet-500 bg-slate-800/50 hover:bg-slate-800 rounded-lg p-6 flex flex-col items-center justify-center transition-all">
                <input id="hash-file-input" type="file" onChange={(e) => setFile(e.target.files[0])} className="hidden" />
                <UploadCloud className="w-8 h-8 text-slate-500 mb-2" />
                {file ? (
                  <span className="text-emerald-400 font-medium truncate max-w-[90%]">{file.name}</span>
                ) : (
                  <div className="flex flex-col items-center">
                    <span className="text-slate-300 mb-2">[ Click to Choose File ]</span>
                    <span className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition-colors">Browse Files</span>
                  </div>
                )}
              </label>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            {!result ? (
              <>
                <button onClick={handleClose} className="px-4 py-2 border border-slate-600 text-slate-300 rounded hover:bg-slate-800 transition-colors">Cancel</button>
                <button onClick={handleVerify} disabled={!file || isVerifying} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
                  {isVerifying ? <><span className="animate-spin mr-2">?</span> Verifying...</> : <><Shield className="w-4 h-4 mr-2" /> [ Verify Hash ]</>}
                </button>
              </>
            ) : (
              <button onClick={handleClose} className="w-full px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors">Close Terminal</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HashVerificationModal;
