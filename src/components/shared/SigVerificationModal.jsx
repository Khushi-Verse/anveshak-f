import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, Shield, Check, Lock } from 'lucide-react';

const SigVerificationModal = ({ isOpen, onClose, evidence, caseId }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen || !evidence) return null;

  const handleVerify = async () => {
    setIsVerifying(true);
    setResult(null);

    try {
      const token = localStorage.getItem('anveshak_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      
      const res = await fetch(`${API_URL}/evidence/${evidence.evidenceId || evidence.id}/signature/verify`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setResult({
          success: data.verified,
          originalHash: data.originalHash,
          currentHash: data.currentHash,
          status: data.verificationStatus,
          officerName: data.officerName || 'Unknown',
          timestamp: data.timestamp || new Date().toISOString()
        });
      } else {
        setResult({ success: false, error: data.message || 'Signature verification failed' });
      }
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
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
          <div className="text-xs font-semibold text-slate-400">sig-verify.sh</div>
          <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center text-blue-400 font-bold text-lg mb-6 border-b border-slate-700 pb-3">
            <Lock className="w-5 h-5 mr-3" />
            Verify Digital Signature
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
          </div>

          {result ? (
            <div className={`p-4 rounded-lg border mb-6 animate-scale-in ${result.success ? 'bg-blue-900/20 border-blue-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
              <div className={`flex items-center font-bold text-lg mb-4 ${result.success ? 'text-blue-400' : 'text-red-400'}`}>
                {result.success ? <><CheckCircle className="w-5 h-5 mr-2" /> ✓ Signature Valid</> : <><AlertTriangle className="w-5 h-5 mr-2" /> ⚠ Signature Invalid or Missing</>}
              </div>
              <div className="space-y-3 text-xs">
                {result.success && (
                  <>
                    <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                      <span className="text-slate-500">Verified By:</span>
                      <span className="font-bold text-slate-300">{result.officerName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Timestamp:</span>
                      <span className="text-slate-300">{new Date(result.timestamp).toLocaleString()}</span>
                    </div>
                  </>
                )}
                
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center mt-2">
                  <span className="text-slate-500">Status:</span>
                  <span className={`font-bold px-2 py-1 rounded ${result.success ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                    {result.status || (result.success ? 'VALID' : 'INVALID')}
                  </span>
                </div>
                {!result.success && result.error && <div className="text-red-400 text-sm mt-2 p-2 bg-red-900/30 rounded border border-red-900">{result.error}</div>}
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-slate-800/50 rounded border border-slate-700 text-sm text-center">
              Click below to verify the cryptographic digital signature attached to this evidence.
            </div>
          )}

          <div className="flex justify-end space-x-3">
            {!result ? (
              <>
                <button onClick={handleClose} className="px-4 py-2 border border-slate-600 text-slate-300 rounded hover:bg-slate-800 transition-colors">Cancel</button>
                <button onClick={handleVerify} disabled={isVerifying} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
                  {isVerifying ? <><span className="animate-spin mr-2">?</span> Verifying...</> : <><Lock className="w-4 h-4 mr-2" /> [ Verify Signature ]</>}
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

export default SigVerificationModal;
