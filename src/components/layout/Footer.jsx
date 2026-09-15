import { Link } from 'react-router-dom';
import { Scale, ExternalLink, Mail, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  const govLinks = [
    { label: t('footer.ministry'), href: '#' },
    { label: t('footer.homeAffairs'), href: '#' },
    { label: t('footer.digitalIndia'), href: '#' },
    { label: t('footer.nic'), href: '#' },
  ];

  const quickLinks = [
    { label: t('nav.about'), href: '/home#about' },
    { label: t('nav.howItWorks'), href: '/home#how-it-works' },
    { label: t('nav.forCitizens'), href: '/home#citizens' },
    { label: t('nav.forOfficers'), href: '/home#officers' },
    { label: t('nav.forCourts'), href: '/home#courts' },
  ];

  const legalLinks = [
    { label: t('footer.accessibility'), href: '#' },
    { label: t('footer.privacy'), href: '#' },
    { label: t('footer.terms'), href: '#' },
    { label: t('footer.sitemap'), href: '#' },
  ];

  return (
    <footer
      className="bg-[rgba(253,186,116,0.28)] backdrop-blur-2xl border-t border-white/50 text-black shadow-[0_-8px_30px_rgba(253,186,116,0.12)]"
      role="contentinfo"
    >
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              to="/home"
              className="flex items-center gap-2.5 mb-4"
              aria-label="Anveshak Home"
            >
              <img
                src="/logo.jpg"
                alt="Anveshak Logo"
                className="w-16 h-16 object-contain"
              />

              <div className="flex flex-col leading-none">
                <span className="text-lg font-bold">अन्वेषक</span>
                <span className="text-[10px] font-medium opacity-60 tracking-wider uppercase">
                  Anveshak
                </span>
              </div>
            </Link>

            <p className="text-sm text-black/70 leading-relaxed mb-4 max-w-xs">
              {t('footer.tagline')}
            </p>

            
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-black/90 mb-4">
              {t('footer.quickLinks')}
            </h3>

            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-black/70 hover:text-[rgb(234,88,12)] transition-colors duration-200 flex items-center gap-1"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Government Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-black/90 mb-4">
              {t('footer.govLinks')}
            </h3>

            <ul className="space-y-2.5">
              {govLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-black/70 hover:text-[rgb(234,88,12)] transition-colors duration-200 flex items-center gap-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-black/90 mb-4">
              {t('footer.contactInfo')}
            </h3>

            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-black/70">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{t('footer.helpline')}</span>
              </li>

              <li className="flex items-start gap-2 text-sm text-black/70">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{t('footer.email')}</span>
              </li>

              <li className="flex items-start gap-2 text-sm text-black/70">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Shastri Bhawan, New Delhi — 110001</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">

            <p className="text-xs text-black/60 text-center sm:text-left">
              {t('footer.copyright')}
            </p>

            <div className="flex items-center gap-4">
              {legalLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-xs text-black/60 hover:text-[rgb(234,88,12)] transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
}