import { useState, useEffect, useRef, useCallback } from 'react';

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Search, Sparkles, AlertTriangle, FileSearch,
  Users, Shield, Building2, Scale, Share2, Bell, Mic, Lock,
  ClipboardList, CheckCircle, UserPlus, Send, Eye,
   Play, Globe, Zap, TrendingUp, MapPin, BarChart3,
  MessageSquare, Phone, Award, ArrowUpRight, MousePointerClick, Cpu, FileText
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import IndiaMap from '../components/shared/IndiaMap';

/* ─── Animated Counter Hook ─── */
function useCounter(end, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(!startOnView);
  const ref = useRef(null);

  useEffect(() => {
    if (!startOnView) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [startOnView]);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [started, end, duration]);

  return { count, ref };
}

/* ─── Scroll Reveal Hook ─── */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ─── Typing Effect Component ─── */
function TypingText({ texts, speed = 80, pause = 2000 }) {
  const [currentText, setCurrentText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = texts[textIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setCurrentText(current.substring(0, charIndex + 1));
        if (charIndex + 1 === current.length) {
          setTimeout(() => setIsDeleting(true), pause);
        } else {
          setCharIndex(c => c + 1);
        }
      } else {
        setCurrentText(current.substring(0, charIndex - 1));
        if (charIndex - 1 === 0) {
          setIsDeleting(false);
          setTextIndex((textIndex + 1) % texts.length);
          setCharIndex(0);
        } else {
          setCharIndex(c => c - 1);
        }
      }
    }, isDeleting ? speed / 2 : speed);
    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex, texts, speed, pause]);

  return (
    <span className="text-emerald-700 font-medium">
      {currentText}
      <span className="animate-pulse text-amber-500 ml-0.5">|</span>
    </span>
  );
}

import HeroCarousel from '../components/shared/HeroCarousel';

/* ─── Main Landing ─── */
export default function Landing() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('citizens');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [activeFeature, setActiveFeature] = useState(0);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const searchRef = useRef(null);
const [voiceImgIdx, setVoiceImgIdx] = useState(0);
  // Scroll reveal for sections
  const heroReveal = useScrollReveal(0.1);
  const cardsReveal = useScrollReveal();
  const rolesReveal = useScrollReveal();
  const featuresReveal = useScrollReveal();
  const statsReveal = useScrollReveal();
  const howReveal = useScrollReveal();
  const servicesReveal = useScrollReveal();
  const mapReveal = useScrollReveal();
  const ctaReveal = useScrollReveal();

  // Animated counters
  const cases = useCounter(74523, 2500);
  const users = useCounter(12, 2000);
  const resolution = useCounter(68, 2000);
  const agencies = useCounter(847, 2000);

  // Search suggestions
  const allSuggestions = [
    {
      q: 'How do I file an FIR online?',
      a: 'Register or login as a citizen, then click on "File FIR" in your dashboard to securely log an e-FIR.',
      link: '/citizen/log-fir'
    },
    {
      q: 'How to track my case status?',
      a: 'Enter your Case ID or FIR Number in the "Track Case" section of your dashboard for real-time updates.',
      link: '/citizen/view-firs'
    },
    {
      q: 'How to report a cyber crime?',
      a: 'Use the dedicated National Cyber Crime Reporting portal or file an e-FIR directly here on Anveshak.',
      link: '/citizen/log-fir'
    },
    {
      q: 'How can I download a copy of my FIR?',
      a: 'Go to your dashboard, view your tracked cases, and click the download icon next to the registered FIR.',
      link: '/citizen/view-firs'
    },
    {
      q: 'Are my details safe when filing a complaint?',
      a: 'Yes. All data is encrypted with AES-256 and stored securely. You can also file complaints anonymously.',
      link: '/citizen/log-fir'
    },
    {
      q: 'How to find the nearest police station?',
      a: 'Allow location access or search your PIN code in the "Find Station" directory to locate nearby jurisdictions.',
      link: '/'
    },
    {
      q: 'How to check my court hearing date?',
      a: 'Link your case to e-Courts in the dashboard to receive automated SMS and portal notifications for hearings.',
      link: '/citizen'
    }
  ];

  const suggestions = allSuggestions.filter(s => 
    searchQuery ? (s.q.toLowerCase().includes(searchQuery.toLowerCase()) || s.a.toLowerCase().includes(searchQuery.toLowerCase())) : true
  );

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-rotate features
  useEffect(() => {
    const timer = setInterval(() => setActiveFeature(f => (f + 1) % 6), 4000);
    return () => clearInterval(timer);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => setTestimonialIdx(i => (i + 1) % testimonials.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const typingTexts = [
    'File an FIR online',
    'Track your case in real-time',
    'Report cyber crime',
    'Access court documents',
    'Find nearest police station',
  ];

  const roles = [
    { key: 'citizen', icon: Users, color: 'from-saffron/10 to-saffron/5', iconBg: 'from-saffron to-saffron-700', link: '/register/citizen', stat: '10M+', statLabel: 'Citizens' },
    { key: 'police', icon: Shield, color: 'from-navy/10 to-navy/5', iconBg: 'from-navy to-navy-700', link: '/register/officer', stat: '50K+', statLabel: 'Officers' },
    { key: 'agency', icon: Building2, color: 'from-forest/10 to-forest/5', iconBg: 'from-forest to-forest-700', link: '/register/officer', stat: '120+', statLabel: 'Agencies' },
    { key: 'court', icon: Scale, color: 'from-[#7c3aed]/10 to-[#7c3aed]/5', iconBg: 'from-[#7c3aed] to-[#6d28d9]', link: '/register/officer', stat: '680+', statLabel: 'Courts' },
  ];

  const features = [
    { icon: ClipboardList, titleKey: 'feature.tracking', descKey: 'feature.trackingDesc', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop' },
    { icon: Share2, titleKey: 'feature.sharing', descKey: 'feature.sharingDesc', color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200', img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=500&fit=crop' },
    { icon: Bell, titleKey: 'feature.alerts', descKey: 'feature.alertsDesc', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', img: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=800&h=500&fit=crop' },
    { icon: Mic, titleKey: 'feature.voice', descKey: 'feature.voiceDesc', color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200',  img: '/src/assets/voice-image.jpg' },
    { icon: Lock, titleKey: 'feature.vault', descKey: 'feature.vaultDesc', color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200', img: '/src/assets/encrypted-image.jpg' },
    { icon: Eye, titleKey: 'feature.audit', descKey: 'feature.auditDesc', color: 'text-emerald-800', bg: 'bg-emerald-100', border: 'border-emerald-300', img: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=500&fit=crop' },
  ];

  const steps = [
    { icon: UserPlus, num: '01', titleKey: 'howItWorks.step1', descKey: 'howItWorks.step1Desc', color: 'from-saffron to-saffron-700' },
    { icon: Send, num: '02', titleKey: 'howItWorks.step2', descKey: 'howItWorks.step2Desc', color: 'from-navy to-navy-700' },
    { icon: Lock, num: '03', titleKey: 'howItWorks.step3', descKey: 'howItWorks.step3Desc', color: 'from-forest to-forest-700' },
    { icon: CheckCircle, num: '04', titleKey: 'howItWorks.step4', descKey: 'howItWorks.step4Desc', color: 'from-[#7c3aed] to-[#6d28d9]' },
  ];

  const citizenServices = [
    { title: 'File FIR Online', desc: 'Register complaints from anywhere', icon: ClipboardList, img: '/src/assets/fir-image.jpg', link: '/citizen/log-fir' },
    { title: 'Track Case Status', desc: 'Real-time updates on your case', icon: Search, img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=300&h=200&fit=crop', link: '/citizen/view-firs' },
    { title: 'Court Hearings', desc: 'Check hearing dates & orders', icon: Scale, img: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300&h=200&fit=crop', link: '/court/proceedings' },
    { title: 'Evidence Upload', desc: 'Secure encrypted evidence vault', icon: Lock, img: 'src/assets/evidence-image.jpg', link: '/citizen/log-fir'  },
    { title: 'Legal Aid', desc: 'Find free legal assistance near you', icon: Users, img: 'https://images.unsplash.com/photo-1521791055366-0d553872125f?w=300&h=200&fit=crop', link: '#' },
  ];

  const officerServices = [
    { title: 'Smart Case Search', desc: 'AI-powered criminal database', icon: Search, img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=200&fit=crop', link: '/officer/search' },
    { title: 'Cross-Agency Share', desc: 'Secure inter-department data', icon: Share2, img: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=300&h=200&fit=crop', link: '/officer/sharing' },
    { title: 'Evidence Vault', desc: 'Encrypted digital evidence chain', icon: Shield, img: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=300&h=200&fit=crop', link: '/officer/upload' },
    { title: 'Department Chat', desc: 'Secure internal communication', icon: MessageSquare, img: 'https://images.unsplash.com/photo-1552581234-26160f608093?w=300&h=200&fit=crop', link: '/officer/chat' },
    { title: 'Audit Logs', desc: 'Complete activity transparency', icon: Eye, img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop', link: '/officer/audit' },
  ];

  const testimonials = [
    { name: 'Anita Sharma', role: 'Citizen, Delhi', text: 'Filed my FIR online in 10 minutes. The voice input feature in Hindi made it incredibly easy. Got real-time updates on my phone.', avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964ac31?w=80&h=80&fit=crop&crop=face' },
    { name: 'Inspector Rajesh Kumar', role: 'Delhi Police', text: 'Cross-agency data sharing has reduced case resolution time by 40%. The encrypted evidence vault gives us complete chain-of-custody confidence.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face' },
    { name: 'Justice Meera Desai', role: 'Delhi High Court', text: 'Having all case documents digitally available with complete audit trails has significantly improved court efficiency and transparency.', avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=80&h=80&fit=crop&crop=face' },
  ];

  const tickerItems = [
    '🔒 End-to-end encrypted platform',
    '📱 10M+ citizens registered',
    '⚡ Average FIR filing: 8 minutes',
    '🏛️ 680+ courts connected',
    '📊 68% case resolution rate',
    '🌐 Available in 22 languages',
    '🔍 AI-powered case matching',
    '📋 847 agencies integrated',
  ];

  const activeServices = activeTab === 'citizens' ? citizenServices : officerServices;

  return (
    <div className="min-h-screen bg-cream overflow-x-hidden">
      
      {/* ═══════════ HERO CAROUSEL MOVED BELOW HERO SECTION ═══════════ */}

      {/* ═══════════ HERO SECTION — Light Green & Light Orange Minimalist UI ═══════════ */}
      <section ref={heroReveal.ref} className="relative mt-16 lg:mt-20 overflow-x-hidden bg-gradient-to-br from-emerald-50 via-amber-50/60 to-orange-50/70 min-h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-5rem)] flex flex-col justify-center pt-28 pb-16 sm:pt-36 sm:pb-20">
        {/* Animated Subtle Ambient Glows */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Base backdrop blur filter */}
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
          
          {/* Light Green & Light Orange Ambient Orbs */}
          <div className="absolute w-[800px] h-[800px] bg-emerald-400/20 rounded-full blur-[120px] top-[-20%] left-[-10%] animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute w-[600px] h-[600px] bg-amber-400/25 rounded-full blur-[100px] bottom-[-10%] right-[-5%]" style={{ animation: 'pulse 6s infinite alternate' }} />
          <div className="absolute w-[400px] h-[400px] bg-orange-300/20 rounded-full blur-[80px] top-[30%] right-[20%]" style={{ animation: 'pulse 5s infinite alternate-reverse' }} />
          <div className="absolute w-[500px] h-[500px] bg-teal-400/20 rounded-full blur-[100px] bottom-[20%] left-[15%]" style={{ animation: 'pulse 7s infinite alternate' }} />

          {/* Minimal Grid Pattern */}
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(245, 158, 11, 0.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

          {/* Floating Subtle Ambient Particles */}
          <div className="absolute top-[20%] left-[10%] w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] float-slow" />
          <div className="absolute top-[30%] right-[15%] w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.8)] float-medium" />
          <div className="absolute bottom-[25%] left-[20%] w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.8)] float-fast" />
          <div className="absolute top-[60%] right-[10%] w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.8)] float-slow" style={{ animationDelay: '2s' }} />
        </div>

       <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-10 xl:mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-6 lg:mb-8">
            {/* Left content */}
            <div className={`${heroReveal.visible ? 'fade-in-up' : 'opacity-0'}`}>
              {/* Badge */}
              

             <h1 className="text-3xl sm:text-4xl lg:text-[2.85rem] font-bold text-charcoal leading-[1.1] tracking-tight mb-2 drop-shadow-sm animate-popup">
  {/* English name */}
 <span className="block text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-[0.12em] text-orange-500 uppercase mb-2">
  ANVESHAK
</span>
  {/* Hindi name — Indian flag green */}
  <span className="block font-serif italic text-[#138808]">
    अन्वेषक
  </span>

  <span className="text-2xl sm:text-3xl lg:text-[2.25rem] font-semibold animate-text-gradient bg-gradient-to-r from-emerald-800 via-teal-700 to-amber-600 bg-clip-text text-transparent inline-block pb-0.5">
    {t('hero.title')}
  </span>
</h1>

              <p className="text-sm sm:text-base text-charcoal-muted leading-relaxed mb-2 max-w-lg font-medium">
                {t('hero.subtitle')}
              </p>

              {/* Typing effect */}
              <p className="text-xs sm:text-sm mb-4 h-5 font-medium">
                <span className="text-charcoal-muted">Try: </span>
                <TypingText texts={typingTexts} />
              </p>

              {/* Search Bar with interactive suggestions */}
              <div ref={searchRef} className="relative mb-4 max-w-xl">
                <div className="relative">
                  <div className="backdrop-blur-xl bg-white/75 border border-emerald-200/80 flex items-center px-2 py-0.5 !rounded-2xl shadow-md ring-1 ring-emerald-500/10">
                    <div className="pl-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); setSelectedAnswer(null); }}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder={t('hero.search')}
                      className="flex-1 py-2.5 px-2.5 text-sm text-charcoal placeholder-charcoal-muted/70 bg-transparent outline-none font-medium"
                      aria-label="Search for services"
                    />
                    <button className="m-1 px-4 py-2 bg-[#FFB76B] hover:bg-[#FFB76B] text-white rounded-xl font-medium text-xs sm:text-sm transition-all duration-300 flex items-center gap-1.5 shadow-md">
                      <Search className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t('hero.searchBtn')}</span>
                    </button>
                  </div>

                  {/* Interactive suggestions dropdown */}
                  {showSuggestions && (
                    <div className="absolute top-full left-0 right-0 mt-2 backdrop-blur-xl bg-white/95 border border-emerald-200 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto">
                      <div className="p-2">
                        <p className="px-3 py-2 text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50/80 rounded-t-xl mb-1 border-b border-emerald-100/60">Frequently Asked Questions</p>
                        {suggestions.length > 0 ? suggestions.slice(0, 5).map((s, i) => (
                          <div
                            key={i}
                            className="w-full flex flex-col gap-1.5 px-3 py-2.5 border-b border-emerald-50 last:border-0 hover:bg-emerald-50/60 transition-colors text-left group cursor-pointer rounded-xl"
                            onClick={() => { setSearchQuery(s.q); setShowSuggestions(false); setSelectedAnswer(s); }}
                          >
                            <div className="flex items-start gap-3">
                              <Search className="w-4 h-4 text-emerald-500 group-hover:text-emerald-700 transition-colors flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <span className="text-xs sm:text-sm text-charcoal group-hover:text-emerald-950 transition-colors font-bold block">{s.q}</span>
                                <span className="text-[11px] text-charcoal-muted group-hover:text-charcoal transition-colors leading-relaxed block mt-0.5 line-clamp-1">{s.a}</span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-transparent group-hover:text-amber-500 flex-shrink-0 transition-all opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
                            </div>
                          </div>
                        )) : (
                          <p className="px-3 py-6 text-sm font-medium text-charcoal-muted text-center">No matching questions found.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Answer Box */}
              {selectedAnswer && (
                <div className="mb-4 max-w-xl bg-white/95 backdrop-blur-md border border-emerald-200/90 rounded-2xl p-4 shadow-xl animate-scale-in z-40 relative">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0 shadow-inner">
                      <Sparkles className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-emerald-950 mb-1">{selectedAnswer.q}</h4>
                      <p className="text-xs sm:text-sm text-charcoal leading-relaxed font-medium">{selectedAnswer.a}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick action pills */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'File FIR', path: '/citizen' },
                  { label: 'Track Case', path: '/citizen' },
                  { label: 'Report Cyber Crime', path: '/citizen' },
                  { label: 'Find Station', path: '/home#crime-map' }
                ].map((link, index) => (
                  link.path.startsWith('/home#') ? (
                    <a key={link.label} href={link.path} className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md bg-white/60 border border-emerald-200/60 text-emerald-900 hover:text-amber-950 hover:bg-amber-50/80 hover:border-amber-300 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 animate-popup`} style={{ animationDelay: `${index * 0.15 + 0.3}s` }}>
                      {link.label}
                    </a>
                  ) : (
                    <Link key={link.label} to={link.path} className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md bg-white/60 border border-emerald-200/60 text-emerald-900 hover:text-amber-950 hover:bg-amber-50/80 hover:border-amber-300 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 animate-popup`} style={{ animationDelay: `${index * 0.15 + 0.3}s` }}>
                      {link.label}
                    </Link>
                  )
                ))}
              </div>
            </div>

            {/* Right — Dashboard preview / hero image */}
            <div className={`hidden lg:block ${heroReveal.visible ? 'fade-in-up fade-in-up-delay-2' : 'opacity-0'}`}>
              <div className="relative max-w-xs sm:max-w-sm mx-auto">
                {/* Floating glass cards showing platform previews */}
                <div className="relative w-full aspect-[4/3] max-w-sm mx-auto">
                  {/* Main dashboard card */}
                  <div className="absolute inset-2 backdrop-blur-xl bg-white/30 border border-white/60 rounded-2xl overflow-hidden shadow-xl group">
                    <img
                      src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=600&fit=crop"
                      alt="Justice system illustration"
                      className="w-full h-full object-cover opacity-90 mix-blend-overlay group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-teal-950/20 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-300/20 to-amber-300/20 mix-blend-overlay" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-white text-xs font-semibold drop-shadow-md">Digital Justice for Every Citizen</p>
                      <p className="text-amber-200 text-[10px] font-medium">Secure · Transparent · Accessible</p>
                    </div>
                  </div>

                 

            
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5-IMAGE SLIDESHOW BANNER - AS REQUESTED, JUST AFTER SCROLL */}
      <div className="w-full">
        <HeroCarousel />
      </div>

      {/* 🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩 LIVE TICKER 🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩 */}
      <div className="bg-navy py-2.5 overflow-hidden">
        <div className="flex ticker-scroll" style={{ width: 'max-content' }}>
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="text-xs text-white/80 font-medium whitespace-nowrap mx-6">{item}</span>
          ))}
        </div>
      </div>

      {/* ═══════════ TWO-CARD SPLIT (ACSC-style with glass) ═══════════ */}
      <section ref={cardsReveal.ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10" id="citizens">
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${cardsReveal.visible ? 'fade-in-up' : 'opacity-0'}`}>
          {/* Emergency Card */}
          <Link
            to="/citizen/log-fir"
            className="group relative overflow-hidden rounded-3xl glass-card border-l-4 border-l-alert p-7 sm:p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-alert/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-start justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-alert to-alert-600 flex items-center justify-center shadow-lg shadow-alert/20 group-hover:scale-110 transition-transform duration-300">
                  <AlertTriangle className="w-7 h-7 text-white" />
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-alert/10 text-alert text-xs font-bold shimmer">
                  {t('action.emergency')}
                </span>
              </div>
              <h2 className="text-xl font-bold text-charcoal mb-2 group-hover:text-alert transition-colors">{t('action.fileFIR')}</h2>
              <p className="text-sm text-charcoal-muted leading-relaxed mb-6">{t('action.fileFIRDesc')}</p>
              <div className="flex items-center gap-2 text-alert font-semibold text-sm group-hover:gap-3 transition-all">
                <span>File Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Track Card */}
          <Link
            to="/citizen/view-firs"
            className="group relative overflow-hidden rounded-3xl glass-card border-l-4 border-l-navy p-7 sm:p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-navy/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-start justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-navy to-navy-700 flex items-center justify-center shadow-lg shadow-navy/20 group-hover:scale-110 transition-transform duration-300">
                  <FileSearch className="w-7 h-7 text-white" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-charcoal mb-2 group-hover:text-navy transition-colors">{t('action.trackCase')}</h2>
              <p className="text-sm text-charcoal-muted leading-relaxed mb-6">{t('action.trackCaseDesc')}</p>
              {/* Interactive case ID input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter Case ID / Tracking No."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-navy/10 bg-white/80 text-sm placeholder-charcoal-muted/50 outline-none focus:border-navy/30 focus:ring-2 focus:ring-navy/10 transition-all"
                  onClick={(e) => e.preventDefault()}
                />
                <button className="px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-medium hover:bg-navy-700 transition-colors">
                  Track
                </button>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ═══════════ ANIMATED STATS ═══════════ */}
      <section ref={statsReveal.ref} className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${statsReveal.visible ? 'fade-in-up' : 'opacity-0'}`}>
            {[
              { ref: cases.ref, value: cases.count.toLocaleString(), suffix: '+', label: 'Cases Tracked', icon: BarChart3, color: 'text-navy', iconBg: 'bg-navy/10' },
              { ref: users.ref, value: users.count, suffix: 'M+', label: 'Citizens Registered', icon: Users, color: 'text-saffron', iconBg: 'bg-saffron/10' },
              { ref: resolution.ref, value: resolution.count, suffix: '%', label: 'Resolution Rate', icon: TrendingUp, color: 'text-forest', iconBg: 'bg-forest/10' },
              { ref: agencies.ref, value: agencies.count, suffix: '+', label: 'Agencies Connected', icon: Building2, color: 'text-[#7c3aed]', iconBg: 'bg-[#7c3aed]/10' },
            ].map(({ ref, value, suffix, label, icon: Icon, color, iconBg }, i) => (
              <div key={label} ref={ref} className="glass-card p-5 sm:p-6 text-center group cursor-default" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <p className={`text-3xl sm:text-4xl font-bold ${color} stat-glow`}>
                  {value}{suffix}
                </p>
                <p className="text-xs text-charcoal-muted mt-1 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ ROLE SELECTION (Aadhaar pill-icon) ═══════════ */}
      <section ref={rolesReveal.ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" id="roles">
        <div className={`text-center mb-10 ${rolesReveal.visible ? 'fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-3xl sm:text-4xl font-bold text-charcoal mb-3">{t('roles.title')}</h2>
          <p className="text-charcoal-muted">{t('roles.subtitle')}</p>
        </div>
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto ${rolesReveal.visible ? 'fade-in-up fade-in-up-delay-1' : 'opacity-0'}`}>
          {roles.map(({ key, icon: Icon, color, iconBg, link, stat, statLabel }, i) => (
            <Link
              key={key}
              to={link}
              className="group glass-card p-6 text-center cursor-pointer"
              aria-label={t(`roles.${key}`)}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
             <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${iconBg} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-sm font-bold text-charcoal mb-1">{t(`roles.${key}`)}</h3>
              <p className="text-xs text-charcoal-muted leading-relaxed mb-3">{t(`roles.${key}Desc`)}</p>
              <div className="pt-3 border-t border-navy/5">
                <p className="text-lg font-bold text-navy">{stat}</p>
                <p className="text-[10px] text-charcoal-muted">{statLabel}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════ SERVICES TAB SECTION (Diia-style Citizens/Officers toggle) ═══════════ */}
      <section ref={servicesReveal.ref} className="py-16 bg-white" id="services">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-8 ${servicesReveal.visible ? 'fade-in-up' : 'opacity-0'}`}>
            <h2 className="text-3xl sm:text-4xl font-bold text-charcoal mb-3">Explore Our Services</h2>
            <p className="text-charcoal-muted mb-6">Discover what Anveshak can do for you</p>

            {/* Tab Toggle */}
            <div className="inline-flex items-center p-1 rounded-2xl bg-cream border border-navy/10">
              <button
                onClick={() => setActiveTab('citizens')}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeTab === 'citizens'
                    ? 'bg-[#FFB76B] text-[#5C3A21] shadow-md shadow-[#FFB76B]/20'
                    : 'text-charcoal-muted hover:text-charcoal'
                }`}
              >
                <Users className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                For Citizens
              </button>
              <button
                onClick={() => setActiveTab('officers')}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeTab === 'officers'
                    ? 'bg-[#FFB76B] text-[#5C3A21] shadow-md shadow-[#FFB76B]/20'
                    : 'text-charcoal-muted hover:text-charcoal'
                }`}
              >
                <Shield className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                For Officers
              </button>
            </div>
          </div>

          {/* Horizontal scrolling service cards */}
          <div className={`${servicesReveal.visible ? 'fade-in-up fade-in-up-delay-2' : 'opacity-0'}`}>
            <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
              {activeServices.map(({ title, desc, icon: Icon, img, link }, i) => (
                <Link
                  key={`${activeTab}-${i}`}
                  to={link}
                  className="min-w-[280px] sm:min-w-[300px] snap-start group"
                >
                  <div className="glass-card overflow-hidden">
                    <div className="img-zoom h-40">
                      <img src={img} alt={title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4 text-navy" />
                        <h3 className="text-sm font-bold text-charcoal group-hover:text-navy transition-colors">{title}</h3>
                      </div>
                      <p className="text-xs text-charcoal-muted leading-relaxed mb-3">{desc}</p>
                      <div className="flex items-center gap-1 text-xs font-semibold text-navy group-hover:gap-2 transition-all">
                        Explore <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES — Interactive cards with preview ═══════════ */}
      <section ref={featuresReveal.ref} className="py-16 lg:py-20" id="officers">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-12 ${featuresReveal.visible ? 'fade-in-up' : 'opacity-0'}`}>
            <h2 className="text-3xl sm:text-4xl font-bold text-charcoal mb-3">{t('features.title')}</h2>
            <p className="text-charcoal-muted">{t('features.subtitle')}</p>
          </div>

          <div className={`grid grid-cols-1 lg:grid-cols-5 gap-6 ${featuresReveal.visible ? 'fade-in-up fade-in-up-delay-1' : 'opacity-0'}`}>
            {/* Feature list (clickable) */}
            <div className="lg:col-span-2 space-y-2">
              {features.map(({ icon: Icon, titleKey, color, bg, border }, i) => (
                <button
                  key={titleKey}
                  onClick={() => setActiveFeature(i)}
                  className={`w-full relative flex items-center gap-3 p-4 rounded-2xl text-left transition-all duration-300 border-2 overflow-hidden ${
                    activeFeature === i
                      ? `glass-card !bg-white shadow-xl scale-[1.02] ${border}`
                      : 'border-transparent hover:bg-white/60'
                  }`}
                >
                  {/* Subtle active background gradient */}
                  {activeFeature === i && (
                    <div className={`absolute inset-0 bg-gradient-to-r ${bg} to-transparent opacity-50`} />
                  )}
                  <div className={`relative z-10 w-11 h-11 rounded-xl ${activeFeature === i ? bg : 'bg-gray-100'} flex items-center justify-center transition-colors flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${activeFeature === i ? color : 'text-charcoal-muted'} transition-colors`} />
                  </div>
                  <div className="relative z-10 flex-1 min-w-0">
                    <p className={`text-[15px] font-bold ${activeFeature === i ? 'text-charcoal' : 'text-charcoal-muted'} transition-colors inline-block relative`}>
                      {t(titleKey)}
                      
                    </p>
                  </div>
                  {activeFeature === i && (
                    <ChevronRight className={`relative z-10 w-5 h-5 ${color} flex-shrink-0`} />
                  )}
                </button>
              ))}
            </div>

            {/* Feature preview */}
            <div className="lg:col-span-3">
              <div className="glass-card overflow-hidden h-full flex flex-col border border-emerald-100/50 shadow-2xl relative" key={activeFeature}>
                {/* Decorative glowing orb behind content */}
                <div className={`absolute -top-32 -right-32 w-80 h-80 ${features[activeFeature].bg} rounded-full blur-[100px] opacity-70 pointer-events-none`} />
                
                <div className="relative img-zoom h-56 sm:h-72 w-full p-4 sm:p-6 pb-0">
                  <div className="w-full h-full rounded-2xl overflow-hidden shadow-lg border border-white/60 relative">
                    <img
                      src={features[activeFeature].img}
                      alt={t(features[activeFeature].titleKey)}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                  </div>
                </div>
                
                <div className="p-6 sm:p-8 flex-1 relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    {(() => { const Icon = features[activeFeature].icon; return (
                      <div className={`w-12 h-12 rounded-2xl ${features[activeFeature].bg} border ${features[activeFeature].border} flex items-center justify-center shadow-inner`}>
                        <Icon className={`w-6 h-6 ${features[activeFeature].color}`} />
                      </div>
                    ); })()}
                    <h3 className="text-xl sm:text-2xl font-bold text-charcoal">{t(features[activeFeature].titleKey)}</h3>
                  </div>
                  <p className="text-base text-charcoal-muted leading-relaxed font-medium">{t(features[activeFeature].descKey)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section ref={howReveal.ref} className="py-16 lg:py-20 bg-[#FFF4E6]" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-12 ${howReveal.visible ? 'fade-in-up' : 'opacity-0'}`}>
            <h2 className="text-3xl sm:text-4xl font-bold text-charcoal mb-3">{t('howItWorks.title')}</h2>
            <p className="text-charcoal-muted">{t('howItWorks.subtitle')}</p>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${howReveal.visible ? 'fade-in-up fade-in-up-delay-1' : 'opacity-0'}`}>
            {steps.map(({ icon: Icon, num, titleKey, descKey, color }, index) => (
              <div key={titleKey} className="relative group">
                {/* Connector */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-navy/20 to-transparent" />
                )}
                <div className="glass-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 transition-transform duration-300`}>
  {num}
</div>
                    <Icon className="w-5 h-5 text-charcoal-muted" />
                  </div>
                  <h3 className="text-base font-bold text-charcoal mb-2">{t(titleKey)}</h3>
                  <p className="text-sm text-charcoal-muted leading-relaxed">{t(descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

   {/* ═══════════ VOICES OF CHANGE IMAGE SLIDER ═══════════ */}
<section className="py-16 lg:py-20">
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-10">
      <h2 className="text-3xl sm:text-4xl font-bold text-charcoal mb-3">
        Voices of Change
      </h2>

      <p className="text-charcoal-muted">
        Explore the impact and journey of Anveshak
      </p>
    </div>

    <div className="relative">
      <div className="glass-card overflow-hidden rounded-3xl">
        <img
          src={`/voices/${voiceImgIdx + 1}.jpg`}
          alt={`Voices of Change image ${voiceImgIdx + 1}`}
          className="w-full h-64 sm:h-96 lg:h-[480px] object-cover transition-opacity duration-500"
          loading="lazy"
        />

        {/* Slider dots */}
        <div className="flex justify-center items-center gap-2 py-5">
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              onClick={() => setVoiceImgIdx(index)}
              aria-label={`Show image ${index + 1}`}
              className={`rounded-full transition-all duration-300 ${
                voiceImgIdx === index
                  ? "w-8 h-2 bg-navy"
                  : "w-2 h-2 bg-navy/20 hover:bg-navy/40"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Previous button */}
      <button
        onClick={() =>
          setVoiceImgIdx((voiceImgIdx - 1 + 3) % 3)
        }
        aria-label="Previous image"
        className="absolute left-2 sm:left-0 top-1/2 -translate-y-1/2 sm:-translate-x-4 w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/80 transition-colors"
      >
        <ChevronLeft className="w-5 h-5 text-charcoal" />
      </button>

      {/* Next button */}
      <button
        onClick={() => setVoiceImgIdx((voiceImgIdx + 1) % 3)}
        aria-label="Next image"
        className="absolute right-2 sm:right-0 top-1/2 -translate-y-1/2 sm:translate-x-4 w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/80 transition-colors"
      >
        <ChevronRight className="w-5 h-5 text-charcoal" />
      </button>
    </div>
  </div>
</section>

      {/* ═══════════ CRIME HOTSPOT MAP ═══════════ */}
      <section ref={mapReveal.ref} className="py-16 lg:py-20 bg-[#EAF7EF]" id="crime-map">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-12 ${mapReveal.visible ? 'fade-in-up' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-alert/5 border border-alert/10 text-xs font-semibold text-alert mb-4">
              <MapPin className="w-3.5 h-3.5" />
              Live Data · Updated Daily
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-charcoal mb-3">Crime Hotspot Intelligence</h2>
            <p className="text-charcoal-muted max-w-2xl mx-auto">
              Interactive map of major crime areas across India. Click on any hotspot to view detailed crime statistics and trends.
            </p>
          </div>

          <div className={`${mapReveal.visible ? 'fade-in-up fade-in-up-delay-2' : 'opacity-0'}`}>
            <IndiaMap />
          </div>
        </div>
      </section>

      {/* ═══════════ ABOUT SECTION (Light Orange Theme) ═══════════ */}
      <section id="about" className="py-20 bg-orange-50 border-t border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-navy mb-4">About Anveshak</h2>
            <div className="w-20 h-1 bg-orange-400 mx-auto rounded-full mb-6"></div>
            <p className="text-lg text-slate-700 max-w-4xl mx-auto leading-relaxed font-medium">
              Anveshak is a secure, integrated case and evidence management platform designed to unify the pillars of India's justice system. By connecting Police (CCTNS), Forensics (e-Forensics), Prosecution (e-Prosecution), and Courts (e-Courts), we eliminate data silos, accelerate investigations, and ensure a transparent, tamper-proof chain of custody for digital evidence.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 text-center hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-navy text-lg mb-2">Secure & Immutable</h3>
              <p className="text-slate-600 text-sm">Blockchain-backed audit trails and cryptographic signatures ensure that case data and evidence cannot be tampered with.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 text-center hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600">
                <Share2 className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-navy text-lg mb-2">Inter-Agency Sync</h3>
              <p className="text-slate-600 text-sm">Real-time data sharing across authorized departments drastically reduces delays and manual paperwork.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 text-center hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-navy text-lg mb-2">Citizen Centric</h3>
              <p className="text-slate-600 text-sm">Empowering citizens with transparent case tracking, online FIR filing, and easy access to court proceedings.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ HELP SECTION (Light Green Theme) ═══════════ */}
      <section id="help" className="py-20 bg-green-50 border-t border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-navy mb-4">Help & Support</h2>
            <div className="w-20 h-1 bg-green-500 mx-auto rounded-full mb-6"></div>
            <p className="text-lg text-slate-700 max-w-3xl mx-auto font-medium">
              Need assistance? We are here to help you navigate the portal and access justice services efficiently.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-green-100 flex items-start gap-4">
                <div className="bg-green-100 p-3 rounded-lg text-green-700 mt-1">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-navy mb-1">How do I register an account?</h4>
                  <p className="text-sm text-slate-600">Citizens can register using Aadhaar verification. Officers require official department credentials (e-Pramaan) for secure access.</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-green-100 flex items-start gap-4">
                <div className="bg-green-100 p-3 rounded-lg text-green-700 mt-1">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-navy mb-1">How do I file an e-FIR?</h4>
                  <p className="text-sm text-slate-600">Navigate to the Citizen Services section, verify your identity, and fill out the digital complaint form. You will receive an immediate acknowledgment receipt.</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-green-100 flex items-start gap-4">
                <div className="bg-green-100 p-3 rounded-lg text-green-700 mt-1">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-navy mb-1">Can I track my case status?</h4>
                  <p className="text-sm text-slate-600">Yes, you can track real-time updates of your registered FIRs and Court Hearings directly from your Citizen Dashboard.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-3xl p-8 border border-green-200 shadow-xl relative overflow-hidden flex flex-col justify-center text-center items-center">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-green-600"></div>
              <MessageSquare className="w-16 h-16 text-green-600 mb-6" />
              <h3 className="text-2xl font-bold text-navy mb-4">Contact Support</h3>
              <p className="text-slate-600 mb-8 max-w-md">Our dedicated support team is available 24/7 to assist citizens and officers with technical issues.</p>
              
              <div className="space-y-4 w-full max-w-xs">
                <a href="tel:112" className="flex items-center justify-center gap-3 w-full py-3 bg-red-50 text-red-700 rounded-xl font-bold hover:bg-red-100 transition-colors border border-red-200">
                  <span>Emergency: Dial 112</span>
                </a>
                <a href="tel:1930" className="flex items-center justify-center gap-3 w-full py-3 bg-navy text-white rounded-xl font-bold hover:bg-navy-700 transition-colors shadow-md">
                  <span>Cyber Crime: Dial 1930</span>
                </a>
                
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ CTA SECTION ═══════════ */}
      <section ref={ctaReveal.ref} className="py-16 lg:py-20" id="courts">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`relative overflow-hidden rounded-3xl p-1 ${ctaReveal.visible ? 'fade-in-up' : 'opacity-0'}`}>
            {/* Gradient border */}
    
            <div className="relative rounded-[1.35rem] bg-purple-300/45 backdrop-blur-xl border border-white/40 text-slate-800 p-8 sm:p-14 text-center overflow-hidden shadow-xl">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-72 h-72 bg-saffron/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-56 h-56 bg-forest/10 rounded-full blur-3xl" />
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)',
                  backgroundSize: '40px 40px'
                }} />
              </div>
              <div className="relative">
                
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Ready to Access <span className="font-serif italic text-purple-600">Digital Justice</span>?
                </h2>
                <p className="text-slate-700 mb-8 max-w-xl mx-auto">
                  Join millions of citizens, officers, and courts on India's unified justice delivery platform.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                
                  <Link to="/login" className="pill-btn border-2 border-[#7c3aed] bg-white text-black hover:bg-white/90 font-semibold px-8 py-3.5">
                    Login to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
