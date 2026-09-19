import React, { useState } from 'react';
import { Shield, Upload, CheckCircle, X } from 'lucide-react';

const SignatureVerification = ({
  isOpen,
  onClose,
  onVerified,
  officerName,
  actionDescription
}) => {
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);

  const handleVerify = () => {
    if (!signatureFile) {
      alert('Please upload your signature.');
      return;
    }

    const timestamp = new Date().toISOString();

    const data = {
      method: 'upload',
      officerName,
      timestamp,
      signatureFile
    };

    setVerificationSuccess(true);
    setSuccessData(data);

    setTimeout(() => {
      onVerified(data);
      setVerificationSuccess(false);
      setSuccessData(null);
      setSignatureFile(null);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-cream overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy/10 bg-gradient-to-r from-navy/5 to-transparent">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-navy" />

            <h2 className="text-xl font-serif font-bold text-navy">
              Upload Signature to Confirm This Action
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-navy/10 transition-colors"
          >
            <X className="w-5 h-5 text-charcoal" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">

          {/* Action Information */}
          <div className="mb-6 p-4 rounded-xl bg-navy/5 border border-navy/10">
            <p className="text-sm text-charcoal font-medium">
              Action:{' '}
              <span className="text-navy">
                {actionDescription}
              </span>
            </p>

            <p className="text-xs text-charcoal/70 mt-1">
              Officer:{' '}
              <span className="font-semibold">
                {officerName}
              </span>
            </p>
          </div>

          {/* Success State */}
          {verificationSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 animate-fade-in-up">

              <CheckCircle className="w-16 h-16 text-forest mb-4" />

              <h3 className="text-lg font-bold text-forest mb-2">
                Signature Uploaded Successfully
              </h3>

              <p className="text-sm text-center text-charcoal px-4">
                Signature uploaded successfully. A separate signed copy
                of the evidence will be generated. The original evidence
                will remain unchanged.
              </p>

            </div>
          ) : (
            <>
              {/* Signature Upload */}
              <div className="space-y-5 animate-fade-in-up">

                {/* Heading */}
                <div className="text-center">
                  <h3 className="text-lg font-bold text-navy mb-2">
                    Upload Your Signature
                  </h3>

                  <p className="text-sm text-charcoal/70">
                    Upload your signature image to attach it to the
                    signed copy of this evidence.
                  </p>
                </div>

                {/* File Upload */}
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-navy/20 rounded-xl bg-cream/30 cursor-pointer hover:bg-navy/5 transition-colors">

                  <Upload className="w-8 h-8 text-navy mb-3" />

                  <span className="text-sm font-medium text-navy">
                    {signatureFile
                      ? signatureFile.name
                      : 'Choose signature image'}
                  </span>

                  <span className="text-xs text-charcoal/60 mt-1">
                    PNG or JPG
                  </span>

                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];

                      if (!file) return;

                      if (
                        file.type !== 'image/png' &&
                        file.type !== 'image/jpeg'
                      ) {
                        alert(
                          'Please upload a PNG or JPG signature image.'
                        );
                        return;
                      }

                      setSignatureFile(file);
                    }}
                  />

                </label>

                {/* Signature Preview */}
                {signatureFile && (
                  <div className="flex justify-center">
                    <img
                      src={URL.createObjectURL(signatureFile)}
                      alt="Signature preview"
                      className="max-h-32 max-w-full object-contain border border-navy/10 rounded-lg p-2 bg-white"
                    />
                  </div>
                )}

                {/* Continue Button */}
                <button
                  onClick={handleVerify}
                  disabled={!signatureFile}
                  className="w-full px-6 py-3 bg-navy text-white text-sm font-medium rounded-xl hover:bg-navy/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-navy/20"
                >
                  <CheckCircle className="w-4 h-4" />
                  Continue with Signature
                </button>

              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default SignatureVerification;