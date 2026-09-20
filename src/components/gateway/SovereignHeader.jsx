import React from 'react';


export const SovereignHeader = ({
  language,
  onLanguageChange,
}) => {
  return (
    <header className="relative z-20 w-full py-4 sm:py-5 px-6 sm:px-10 lg:px-16 flex items-center justify-between border-b border-[#002244]/10 backdrop-blur-md bg-white/85 shadow-[0_2px_12px_rgba(0,34,68,0.04)]">
      {/* Ministry & Sovereign Branding */}
      <div className="flex items-center space-x-4 sm:space-x-6">
        <div className="flex flex-col text-left">
          <div className="flex items-center space-x-3">
            <span className="text-base sm:text-lg font-bold tracking-widest text-[#E65100] uppercase font-sans-jakarta">
              भारत सरकार
            </span>
            <span className="text-gray-300 text-sm font-light">|</span>
            <span className="text-base sm:text-lg font-extrabold tracking-wider text-[#001C3A] uppercase font-sans-jakarta">
              GOVERNMENT OF INDIA
            </span>
          </div>
          <span className="text-sm sm:text-base text-[#43474e] font-medium tracking-wide">
            {language === 'hi'
              ? 'गृह मंत्रालय • भारत सरकार'
              : 'गृह मंत्रालय • Ministry of Home Affairs'}
          </span>
        </div>
      </div>

      {/* Security Accreditation & Controls */}
      <div className="flex items-center space-x-3 sm:space-x-6 text-sm font-sans-jakarta">
        {/* GIGW Badge */}
       
        {/* Bilingual Switcher */}
        <div className="flex items-center space-x-2 bg-slate-50 border border-[#002244]/15 px-3 py-1.5 rounded-full shadow-xs">
          <button
            onClick={() => onLanguageChange('en')}
            className={`text-sm px-2.5 py-1 rounded font-bold transition-colors ${
              language === 'en'
                ? 'text-[#002244] bg-white shadow-xs'
                : 'text-[#43474e] hover:text-[#fc6018]'
            }`}
          >
            English
          </button>
          <span className="text-gray-300 text-sm">|</span>
          <button
            onClick={() => onLanguageChange('hi')}
            className={`text-sm px-2.5 py-1 rounded font-bold transition-colors ${
              language === 'hi'
                ? 'text-[#fc6018] bg-white shadow-xs'
                : 'text-[#43474e] hover:text-[#fc6018]'
            }`}
          >
            हिन्दी
          </button>
        </div>
      </div>
    </header>
  );
};
