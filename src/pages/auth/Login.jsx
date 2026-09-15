import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Scale, Shield, ShieldCheck, Search, Loader2, Upload, Lock, Mail } from 'lucide-react';

export default function Login() {
  const [step, setStep] = useState(2);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [isUploadingId, setIsUploadingId] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const { login } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const handleDigiLockerLogin = () => {
    setIsVerifying(true);
    setVerificationMessage('Connecting to DigiLocker...');
    
    setTimeout(() => {
      setVerificationMessage('Verifying identity...');
    }, 800);
    
    setTimeout(() => {
      setVerificationMessage('Identity verified!');
    }, 1600);
    
    setTimeout(() => {
      setIsVerifying(false);
      setStep(4);
    }, 2000);
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    if (role === 'citizen') {
      setStep(1);
    } else {
      setStep(3);
    }
  };

  const handleIdUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingId(true);
    setUploadMessage('Verifying Department ID...');

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setUploadMessage('ID Verified successfully!');
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsUploadingId(false);
      setStep(4);
    } catch (error) {
      console.error('Department ID verification failed:', error);
      setUploadMessage(error?.message || 'Verification failed. Please try again.');
      setIsUploadingId(false);
    }
  };

  const handleRealLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      await login(selectedRole, { email, password });
      if (selectedRole === 'citizen') navigate('/citizen');
      else if (selectedRole === 'court') navigate('/court');
      else navigate('/officer');
    } catch (error) {
      setLoginError(error?.message || 'Invalid email or password');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const roles = [
    { id: 'citizen', title: 'Citizen', description: 'File FIRs, track cases, access court orders', icon: Shield, colorClass: 'text-saffron', bgHoverClass: 'hover:bg-saffron/10', borderHoverClass: 'hover:border-saffron' },
    { id: 'police', title: 'Police Officer', description: 'Manage cases, upload evidence, inter-agency sharing', icon: ShieldCheck, colorClass: 'text-navy', bgHoverClass: 'hover:bg-navy/10', borderHoverClass: 'hover:border-navy' },
    { id: 'agency', title: 'Investigating Agency', description: 'CBI, ED, Customs — cross-agency case management', icon: Search, colorClass: 'text-charcoal', bgHoverClass: 'hover:bg-charcoal/10', borderHoverClass: 'hover:border-charcoal' },
    { id: 'court', title: 'Court / Judiciary', description: 'Manage proceedings, issue orders, view evidence', icon: Scale, colorClass: 'text-forest', bgHoverClass: 'hover:bg-forest/10', borderHoverClass: 'hover:border-forest' }
  ];

  return (
   <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 pt-24">
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="absolute w-[800px] h-[800px] bg-navy/5 rounded-full blur-3xl float-slow"></div>
        <div className="absolute w-[600px] h-[600px] bg-saffron/5 rounded-full blur-3xl float-medium transform translate-x-1/4 -translate-y-1/4"></div>
      </div>

      <div className="w-full max-w-4xl relative z-10 fade-in-up">
        {step === 1 ? (
          <div className="max-w-md mx-auto glass-card p-8 rounded-2xl shadow-xl flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-navy text-white rounded-full flex items-center justify-center mb-6 shadow-lg scale-in">
              <Scale size={40} />
            </div>
            <h1 className="text-3xl font-serif font-bold text-navy mb-2">Welcome to Anveshak</h1>
            <p className="text-charcoal/80 mb-10 font-medium">Digital Justice Platform — Government of India</p>

            {isVerifying ? (
              <div className="w-full py-8 flex flex-col items-center justify-center space-y-4 fade-in-up">
                <Loader2 className="w-12 h-12 text-navy animate-spin" />
                <p className="text-lg font-medium text-navy">{verificationMessage}</p>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center fade-in-up">
                <button onClick={handleDigiLockerLogin} className="w-full bg-navy hover:bg-navy/90 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center space-x-3 transition-all duration-300 transform hover:scale-[1.02] shadow-md">
                  <Shield size={24} />
                  <span className="text-lg">Verify with DigiLocker</span>
                </button>
                <p className="mt-4 text-sm text-charcoal/60">Authenticate via DigiLocker to access the platform</p>
              </div>
            )}
            <div className="mt-12 pt-6 border-t border-charcoal/10 w-full">
              <p className="text-xs text-charcoal/50 font-medium">© {new Date().getFullYear()} Government of India. All rights reserved.</p>
            </div>
          </div>
        ) : step === 3 ? (
          <div className="max-w-md mx-auto glass-card p-8 rounded-2xl shadow-xl flex flex-col items-center text-center fade-in-up">
            <div className="w-20 h-20 bg-navy/10 text-navy rounded-full flex items-center justify-center mb-6">
              <ShieldCheck size={40} />
            </div>
            <h1 className="text-3xl font-serif font-bold text-navy mb-2">2FA Verification</h1>
            <p className="text-charcoal/80 mb-8 font-medium">Please upload your Government/Department ID to proceed.</p>

            {isUploadingId ? (
              <div className="w-full py-8 flex flex-col items-center justify-center space-y-4 fade-in-up">
                <Loader2 className="w-12 h-12 text-navy animate-spin" />
                <p className="text-lg font-medium text-navy">{uploadMessage}</p>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center fade-in-up">
                <label className="w-full border-2 border-dashed border-navy/30 rounded-xl p-8 hover:bg-navy/5 cursor-pointer transition-colors group flex flex-col items-center">
                  <div className="bg-navy/10 p-3 rounded-full mb-3 group-hover:bg-navy group-hover:text-white text-navy transition-colors">
                    <Upload size={24} />
                  </div>
                  <span className="font-semibold text-navy mb-1">Click to upload ID</span>
                  <span className="text-sm text-charcoal/60">PDF, JPG or PNG (Max 5MB)</span>
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleIdUpload} />
                </label>
              </div>
            )}
            
            <button onClick={() => setStep(2)} className="mt-8 text-navy/70 hover:text-navy font-medium underline-offset-4 hover:underline transition-colors" disabled={isUploadingId}>
              Back to Roles
            </button>
          </div>
        ) : step === 4 ? (
          <div className="max-w-md mx-auto glass-card p-8 rounded-2xl shadow-xl flex flex-col items-center text-center fade-in-up">
            <div className="w-16 h-16 bg-navy/10 text-navy rounded-full flex items-center justify-center mb-4">
              <Lock size={32} />
            </div>
            <h1 className="text-2xl font-serif font-bold text-navy mb-2">Secure Login</h1>
            <p className="text-charcoal/80 mb-8 font-medium">Enter your credentials to access the {selectedRole} portal.</p>

            <form onSubmit={handleRealLogin} className="w-full flex flex-col space-y-4 text-left">
              <div>
                <label className="block text-sm font-semibold text-navy mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/50 w-5 h-5" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white border border-navy/20 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-navy/50" placeholder="Enter your email" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/50 w-5 h-5" />
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white border border-navy/20 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-navy/50" placeholder="Enter your password" />
                </div>
              </div>
              
              {loginError && <p className="text-red-500 text-sm font-medium mt-2 text-center">{loginError}</p>}
              
              <button type="submit" disabled={isLoggingIn} className="w-full bg-navy hover:bg-navy/90 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all mt-4 shadow-md">
                {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Sign In</span>}
              </button>
            </form>
            
            <div className="flex flex-col gap-3 mt-6 items-center w-full">
              <button onClick={() => setStep(2)} className="text-navy/70 hover:text-navy text-sm font-medium underline-offset-4 hover:underline transition-colors">
                Change Role
              </button>
              {selectedRole === 'citizen' && (
                <Link to="/register/citizen" className="text-navy font-bold hover:underline text-sm mt-2">
                  New Citizen? Register here
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center fade-in-up">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-serif font-bold text-navy mb-4">Welcome back!</h2>
              <p className="text-xl text-charcoal/80">Who are you signing in as?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
              {roles.map((r) => {
                const Icon = r.icon;
                return (
                  <button key={r.id} onClick={() => handleRoleSelect(r.id)} className={`glass-card p-6 rounded-xl text-left transition-all duration-300 border-2 border-transparent ${r.borderHoverClass} ${r.bgHoverClass} transform hover:-translate-y-1 group`}>
                    <div className={`${r.colorClass} mb-4 bg-white/50 p-4 rounded-full inline-block group-hover:scale-110 transition-transform duration-300`}>
                      <Icon size={32} />
                    </div>
                    <h3 className={`text-2xl font-bold mb-2 ${r.colorClass}`}>{r.title}</h3>
                    <p className="text-charcoal/70 leading-relaxed">{r.description}</p>
                  </button>
                );
              })}
            </div>
            
            
          </div>
        )}
      </div>
    </div>
  );
}