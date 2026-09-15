import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Globe, LogIn, LogOut, User, Bell, Scale } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from '../shared/NotificationBell';

export default function Navbar() {
  const { language, toggleLanguage, t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const isLandingPage = location.pathname === '/' || location.pathname === '/home';
  const navBg = scrolled
    ? 'bg-white/90 backdrop-blur-xl shadow-sm border-b border-navy/5'
    : isLandingPage
      ? 'bg-white/40 backdrop-blur-md'
      : 'bg-white/95 backdrop-blur-md shadow-sm border-b border-navy-100';
  const textColor = 'text-charcoal';
  const logoColor = 'text-navy';

  const getHashLink = (hash) => location.pathname === '/home' ? hash : `/home${hash}`;

  const navLinks = [
    { href: getHashLink('#about'), label: 'About' },
    { href: getHashLink('#help'), label: 'Help & Support' },
    { href: getHashLink('#how-it-works'), label: t('nav.howItWorks') },
    { href: getHashLink('#citizens'), label: t('nav.forCitizens') },
    { href: getHashLink('#officers'), label: t('nav.forOfficers') },
    { href: getHashLink('#courts'), label: t('nav.forCourts') },
  ];

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'citizen': return '/citizen';
      case 'police': case 'agency': return '/officer';
      case 'court': return '/court';
      default: return '/login';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Main Navigation Tier */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link
              to="/home"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={`flex items-center gap-3 transition-colors duration-300 group`}
              aria-label="Anveshak Home"
            >
              <img src="/logo.jpg" alt="Anveshak Logo" className="w-16 h-16 object-contain" />
              <div className="flex flex-col leading-none border-l-2 border-gray-300 pl-3">
                <span className="text-xl font-bold tracking-tight text-gray-900">अन्वेषक</span>
                <span className="text-xs font-bold text-gray-600 tracking-wider uppercase">Anveshak</span>
              </div>
            </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-sm font-bold ${textColor} opacity-90 hover:opacity-100 rounded-lg hover:bg-gray-100 transition-all duration-200`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={toggleLanguage}
              className="hidden sm:flex items-center gap-1 hover:text-green-700 transition-colors text-sm font-bold text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100"
              aria-label={`Switch language to ${language === 'en' ? 'Hindi' : 'English'}`}
            >
              <Globe className="w-4 h-4" />
              {language === 'en' ? 'हिन्दी' : 'English'}
            </button>
            
            {isAuthenticated && <NotificationBell scrolled={scrolled} isLandingPage={isLandingPage} />}

            {/* Login / User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold text-navy border-2 border-navy-200 hover:bg-navy-50 transition-all duration-200 shadow-sm bg-white"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline max-w-24 truncate">{user.name.split(' ')[0]}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border-2 border-gray-100 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                        <p className="text-sm font-bold text-gray-900">{user.name}</p>
                        <p className="text-xs font-semibold text-gray-500 capitalize">{user.role}</p>
                      </div>
                      <Link
                        to={getDashboardPath()}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-navy transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        {t('nav.dashboard')}
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('nav.logout')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
            <Link
                 to="/login"
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-[#F28C28] text-white hover:bg-[#D97706] transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
>

                <LogIn className="w-4 h-4" />
                <span>{t('nav.login')}</span>
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-lg ${textColor} hover:bg-gray-100 transition-colors border border-gray-200 bg-white`}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden transition-all duration-300 overflow-hidden bg-white ${
          mobileMenuOpen ? 'max-h-[500px] opacity-100 shadow-lg border-b border-gray-200' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 py-4 space-y-1">
          {/* Mobile Top Tier items */}
          <div className="flex flex-col gap-2 pb-4 mb-4 border-b border-gray-100">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-green-700 hover:bg-green-50 rounded-lg transition-colors"
            >
              <Globe className="w-4 h-4" />
              {language === 'en' ? 'हिन्दी (Hindi)' : 'English'}
            </button>
            <a href={getHashLink('#about')} className="px-4 py-2 text-sm font-bold text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
              About Anveshak
            </a>
          </div>

          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block px-4 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          {isAuthenticated && (
            <Link
              to={getDashboardPath()}
              className="block px-4 py-3 text-sm font-bold text-navy hover:bg-navy-50 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.dashboard')}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
