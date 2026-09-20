import { useState, useEffect } from 'react';
import {
  Shield,
  Fingerprint,
  Lock,
  CheckCircle,
  ChevronRight,
  Loader2,
  Smartphone,
  ArrowRight,
} from 'lucide-react';

import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthGate({ onAuthenticated }) {
  const { t } = useLanguage();
  const { sendOTP, verifyOTP } = useAuth();

  const [step, setStep] = useState(0);
  const [method, setMethod] = useState(null);

  // Mobile OTP states
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }

      window.confirmationResult = null;
    };
  }, []);

  // DigiLocker / Aadhaar remain prototype flows
  const handleVerify = (selectedMethod) => {
    setMethod(selectedMethod);
    setError('');

    if (selectedMethod === 'mobile') {
      setStep(2);
      return;
    }

    setStep(2);

    setTimeout(() => {
      setStep(3);

      setTimeout(() => {
        onAuthenticated();
      }, 1500);
    }, 2500);
  };

  // Send Firebase OTP
  const handleSendOTP = async () => {
    setError('');

    if (!mobile.trim()) {
      setError('Please enter your mobile number.');
      return;
    }

    setIsSendingOTP(true);

    try {
      await sendOTP(mobile.trim());

      setOtpSent(true);
      setOtp('');
    } catch (error) {
      console.error(error);
      setError(
        error?.message || 'Unable to send OTP. Please try again.'
      );
    } finally {
      setIsSendingOTP(false);
    }
  };

  // Verify Firebase OTP
  const handleVerifyOTP = async () => {
    setError('');

    if (!otp.trim()) {
      setError('Please enter the OTP.');
      return;
    }

    if (otp.trim().length !== 6) {
      setError('OTP must contain 6 digits.');
      return;
    }

    setIsVerifyingOTP(true);

    try {
      const result = await verifyOTP(mobile.trim(), otp.trim());

      if (!result.success) {
        setError(result.message || 'Invalid OTP.');
        return;
      }

      setStep(3);

      setTimeout(() => {
        onAuthenticated();
      }, 1500);
    } catch (error) {
      console.error(error);
      setError(
        error?.message || 'OTP verification failed.'
      );
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 hero-gradient-light">
        <div
          className="mesh-orb w-[500px] h-[500px] bg-navy/[0.04] top-[-10%] left-[-10%]"
          style={{ animationDelay: '0s' }}
        />

        <div
          className="mesh-orb w-[600px] h-[600px] bg-saffron/[0.05] bottom-[-15%] right-[-10%]"
          style={{ animationDelay: '5s' }}
        />

        <div
          className="mesh-orb w-[400px] h-[400px] bg-forest/[0.04] top-[30%] right-[20%]"
          style={{ animationDelay: '10s' }}
        />

        <div
          className="mesh-orb w-[300px] h-[300px] bg-navy/[0.03] bottom-[20%] left-[15%]"
          style={{ animationDelay: '15s' }}
        />

        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1440 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-100,200 Q360,100 720,300 T1540,200"
            stroke="rgba(11,61,145,0.05)"
            strokeWidth="1"
            className="decorative-line"
          />

          <path
            d="M-100,400 Q360,300 720,500 T1540,400"
            stroke="rgba(255,107,53,0.04)"
            strokeWidth="1"
            className="decorative-line"
            style={{ animationDelay: '2s' }}
          />

          <path
            d="M-100,600 Q360,500 720,700 T1540,600"
            stroke="rgba(26,156,86,0.04)"
            strokeWidth="1"
            className="decorative-line"
            style={{ animationDelay: '4s' }}
          />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-lg mx-4 fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-lg shadow-navy/10 flex items-center justify-center p-2">
              <img
                src="/logo.jpg"
                alt="Anveshak Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-charcoal tracking-tight">
            <span className="font-serif italic text-navy">
              अन्वेषक
            </span>
          </h1>

          <p className="text-xs text-charcoal-muted mt-1 tracking-widest uppercase">
            Anveshak · Digital Justice Platform
          </p>

          <div className="flex gap-0 w-20 h-0.5 rounded-full overflow-hidden mx-auto mt-4">
            <div className="flex-1 bg-saffron" />
            <div className="flex-1 bg-charcoal-muted" />
            <div className="flex-1 bg-forest" />
          </div>
        </div>

        {/* Auth Card */}
        <div className="glass-strong rounded-3xl p-8">

          {/* STEP 0 */}
          {step === 0 && (
            <div className="text-center fade-in-up">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-navy-100 to-navy-50 flex items-center justify-center mx-auto mb-6">
                <Shield className="w-10 h-10 text-navy" />
              </div>

              <h2 className="text-xl font-bold text-charcoal mb-2">
                Secure Identity Verification
              </h2>

              <p className="text-sm text-charcoal-muted mb-8 max-w-sm mx-auto leading-relaxed">
                To access the Anveshak platform, please verify your identity through one of our secure government authentication services.
              </p>

              <button
                onClick={() => setStep(1)}
                className="pill-btn bg-navy text-white hover:bg-navy-700 font-semibold px-8 py-3.5 text-sm shadow-lg shadow-navy/20 mx-auto"
              >
                Continue to Verify
                <ChevronRight className="w-4 h-4" />
              </button>

              <p className="text-[10px] text-charcoal-muted/60 mt-6">
                A Government of India Digital Initiative — SIH 2026 Prototype
              </p>
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="fade-in-up">
              <h2 className="text-lg font-bold text-charcoal mb-1 text-center">
                Choose Verification Method
              </h2>

              <p className="text-xs text-charcoal-muted mb-6 text-center">
                Select how you'd like to verify your identity
              </p>

              <div className="space-y-3">

                {/* DigiLocker */}
                <button
                  onClick={() => handleVerify('digilocker')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-transparent bg-gradient-to-r from-[#1a237e]/5 to-[#0d47a1]/5 hover:border-navy-200 hover:shadow-md transition-all duration-300 group text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1a237e] to-[#0d47a1] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-navy/20">
                    <Lock className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1">
                    <span className="text-sm font-bold text-charcoal block">
                      DigiLocker
                    </span>

                    <span className="text-xs text-charcoal-muted">
                      Verify using your DigiLocker digital documents
                    </span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-navy opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>

                {/* Aadhaar */}
                <button
                  onClick={() => handleVerify('aadhaar')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-transparent bg-gradient-to-r from-saffron/5 to-saffron/[0.02] hover:border-saffron-200 hover:shadow-md transition-all duration-300 group text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-saffron to-saffron-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-saffron/20">
                    <Fingerprint className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1">
                    <span className="text-sm font-bold text-charcoal block">
                      Aadhaar eKYC
                    </span>

                    <span className="text-xs text-charcoal-muted">
                      Verify using Aadhaar OTP authentication
                    </span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-saffron opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>

                {/* Mobile OTP */}
                <button
                  onClick={() => handleVerify('mobile')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-transparent bg-gradient-to-r from-forest/5 to-forest/[0.02] hover:border-forest-200 hover:shadow-md transition-all duration-300 group text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-forest to-forest-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-forest/20">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1">
                    <span className="text-sm font-bold text-charcoal block">
                      Mobile OTP
                    </span>

                    <span className="text-xs text-charcoal-muted">
                      Quick login with registered mobile number
                    </span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-forest opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>
              </div>

              <button
                onClick={() => setStep(0)}
                className="w-full text-xs text-charcoal-muted hover:text-navy mt-4 transition-colors"
              >
                ← Go back
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="fade-in-up">

              {/* Mobile OTP */}
              {method === 'mobile' ? (
                <div>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-forest-50 flex items-center justify-center mx-auto mb-4">
                      <Smartphone className="w-8 h-8 text-forest" />
                    </div>

                    <h2 className="text-lg font-bold text-charcoal mb-2">
                      {otpSent ? 'Enter OTP' : 'Verify Mobile Number'}
                    </h2>

                    <p className="text-sm text-charcoal-muted">
                      {otpSent
                        ? 'Enter the 6-digit OTP sent to your mobile number.'
                        : 'Enter your mobile number to receive an OTP.'}
                    </p>
                  </div>

                  {!otpSent ? (
                    <>
                      <label className="block text-xs font-semibold text-charcoal mb-2">
                        Mobile Number
                      </label>

                      <input
                        type="tel"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="+1 650-555-3434"
                        className="w-full px-4 py-3 rounded-xl border border-charcoal-muted/20 bg-white/80 text-sm outline-none focus:border-forest focus:ring-2 focus:ring-forest/10"
                      />

                      <div
                        id="recaptcha-container"
                        className="mt-2"
                      />

                      {error && (
                        <p className="text-xs text-red-600 mt-3">
                          {error}
                        </p>
                      )}

                      <button
                        onClick={handleSendOTP}
                        disabled={isSendingOTP}
                        className="w-full mt-5 pill-btn bg-forest text-white hover:bg-forest-700 font-semibold px-6 py-3.5 text-sm shadow-lg shadow-forest/20 justify-center disabled:opacity-60"
                      >
                        {isSendingOTP ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending OTP...
                          </>
                        ) : (
                          <>
                            Send OTP
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      <label className="block text-xs font-semibold text-charcoal mb-2">
                        Enter OTP
                      </label>

                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otp}
                        onChange={(e) =>
                          setOtp(
                            e.target.value.replace(/\D/g, '')
                          )
                        }
                        placeholder="Enter 6-digit OTP"
                        className="w-full px-4 py-3 rounded-xl border border-charcoal-muted/20 bg-white/80 text-sm tracking-[0.3em] text-center outline-none focus:border-forest focus:ring-2 focus:ring-forest/10"
                      />

                      {error && (
                        <p className="text-xs text-red-600 mt-3">
                          {error}
                        </p>
                      )}

                      <button
                        onClick={handleVerifyOTP}
                        disabled={isVerifyingOTP}
                        className="w-full mt-5 pill-btn bg-forest text-white hover:bg-forest-700 font-semibold px-6 py-3.5 text-sm shadow-lg shadow-forest/20 justify-center disabled:opacity-60"
                      >
                        {isVerifyingOTP ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Verifying OTP...
                          </>
                        ) : (
                          <>
                            Verify OTP
                            <CheckCircle className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setOtpSent(false);
                          setOtp('');
                          setError('');
                        }}
                        className="w-full text-xs text-charcoal-muted hover:text-navy mt-4 transition-colors"
                      >
                        ← Change mobile number
                      </button>
                    </>
                  )}
                </div>
              ) : (
                /* Existing simulated DigiLocker / Aadhaar flow */
                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-navy-50 flex items-center justify-center mx-auto mb-6">
                    <Loader2 className="w-10 h-10 text-navy animate-spin" />
                  </div>

                  <h2 className="text-lg font-bold text-charcoal mb-2">
                    Verifying Your Identity
                  </h2>

                  <p className="text-sm text-charcoal-muted">
                    {method === 'digilocker' &&
                      'Connecting to DigiLocker...'}
                    {method === 'aadhaar' &&
                      'Connecting to UIDAI Aadhaar...'}
                  </p>

                  <div className="mt-6 flex justify-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-navy"
                        style={{
                          animation:
                            'badgePulse 1.4s ease-in-out infinite',
                          animationDelay: `${i * 0.2}s`,
                        }}
                      />
                    ))}
                  </div>

                  <p className="text-[10px] text-charcoal-muted/50 mt-4">
                    SIMULATED: No real API call is made in this prototype
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="text-center py-8 scale-in">
              <div className="w-20 h-20 rounded-full bg-forest-50 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-forest" />
              </div>

              <h2 className="text-lg font-bold text-charcoal mb-2">
                Identity Verified!
              </h2>

              <p className="text-sm text-charcoal-muted mb-1">
                Welcome to Anveshak
              </p>

              <p className="text-xs text-forest font-medium">
                Redirecting to platform...
              </p>
            </div>
          )}
        </div>

        {/* Security badges */}
        <div className="flex items-center justify-center gap-4 mt-6 opacity-50">
          <div className="flex items-center gap-1 text-[10px] text-charcoal-muted">
            <Lock className="w-3 h-3" />
            <span>256-bit SSL</span>
          </div>

          <div className="w-px h-3 bg-charcoal-muted/30" />

          <div className="flex items-center gap-1 text-[10px] text-charcoal-muted">
            <Shield className="w-3 h-3" />
            <span>ISO 27001</span>
          </div>

          <div className="w-px h-3 bg-charcoal-muted/30" />

          <div className="flex items-center gap-1 text-[10px] text-charcoal-muted">
            <Fingerprint className="w-3 h-3" />
            <span>UIDAI Certified</span>
          </div>
        </div>
      </div>
    </div>
  );
}