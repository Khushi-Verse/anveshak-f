import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmblemLogo } from './EmblemLogo';

export const HeroGateway = ({
  language,
  onBeginOnboarding,
  replayCounter,
}) => {
  const navigate = useNavigate();
  // Stage management for sequential choreographed animation
  // stage 0: initial blank/reset
  // stage 1: pill appears
  // stage 2: logo appears (FIRST)
  // stage 3: letters revealed one by one
  // stage 4: tagline & description
  // stage 5: stats appear
  // stage 6: button appears at the end
  const [stage, setStage] = useState(0);
  const [revealedLettersCount, setRevealedLettersCount] = useState(0);
  const [revealedHindiCount, setRevealedHindiCount] = useState(0);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const englishTitle = ['A', 'N', 'V', 'E', 'S', 'H', 'A', 'K'];
  const hindiProgressive = ['अ', 'अन्व', 'अन्वे', 'अन्वेष', 'अन्वेषक'];

  // Choreograph the sequence on load or replayCounter change
  useEffect(() => {
    // Reset state
    setStage(0);
    setRevealedLettersCount(0);
    setRevealedHindiCount(0);
    setIsAuthenticating(false);

    const timeouts = [];

    // Step 1: LOGO APPEARS FIRST! (starts at t = 300ms)
    timeouts.push(
      setTimeout(() => {
        setStage(2);
      }, 300)
    );

    // Step 2: TEXT APPEARS LETTER BY LETTER! (starts at t = 1100ms)
    englishTitle.forEach((_, idx) => {
      timeouts.push(
        setTimeout(() => {
          setStage(3);
          setRevealedLettersCount(idx + 1);
        }, 1100 + idx * 110)
      );
    });

    // Hindi letters reveal smoothly connected (starts after English title)
    const hindiStartTime = 1100 + englishTitle.length * 110 + 150;
    hindiProgressive.forEach((_, idx) => {
      timeouts.push(
        setTimeout(() => {
          setRevealedHindiCount(idx + 1);
        }, hindiStartTime + idx * 120)
      );
    });

    // Step 3: Taglines & description appear (t = ~2700ms)
    const taglinesTime = hindiStartTime + hindiProgressive.length * 120 + 200;
    timeouts.push(
      setTimeout(() => {
        setStage(4);
      }, taglinesTime)
    );

    // Step 4: Stats bar appear (t = ~3100ms)
    timeouts.push(
      setTimeout(() => {
        setStage(5);
      }, taglinesTime + 380)
    );

    // Step 5: BUTTON TO BEGIN ONBOARDING PROCESS APPEARS AT THE END! (t = ~3600ms)
    timeouts.push(
      setTimeout(() => {
        setStage(6);
      }, taglinesTime + 850)
    );

    return () => {
      timeouts.forEach((t) => clearTimeout(t));
    };
  }, [replayCounter]);

  const handleButtonClick = () => {
    setIsAuthenticating(true);
    // Smooth transition into the onboarding flow
    setTimeout(() => {
      setIsAuthenticating(false);
      onBeginOnboarding();
    }, 750);
  };

  const handleSkipAnimation = () => {
    setStage(6);
    setRevealedLettersCount(englishTitle.length);
    setRevealedHindiCount(hindiProgressive.length);
  };

  return (
   <main className="relative z-10 flex-1 w-full h-full min-h-0 flex flex-col items-center justify-center px-4 sm:px-6 pt-3 sm:pt-4 pb-2 sm:pb-3 text-center overflow-hidden">
      <div className="max-w-2xl w-full flex flex-col items-center justify-center">
        {/* Step 1: LOGO APPEARS FIRST! Exactly matching provided sovereign shield emblem with dedicated breathing room */}
        <div
          className={`transition-all duration-1000 ease-out mb-1.5 sm:mb-2 ${
            stage >= 2
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-75 translate-y-4 pointer-events-none'
          }`}
        >
          <EmblemLogo onClick={handleButtonClick} />
        </div>

        {/* Step 2: TEXT APPEARS LETTER BY LETTER */}
        <div className="flex flex-col items-center mb-1 min-h-[48px] sm:min-h-[58px] justify-center">
          {/* Primary English Acronym: ANVESHAK - Revealed Letter by Letter */}
          <h1
            className="font-serif-merriweather text-2xl sm:text-3xl md:text-4xl text-[#001C3A] tracking-wider font-black select-none flex items-center justify-center space-x-1 sm:space-x-1.5 uppercase"
            aria-label="ANVESHAK"
          >
            {englishTitle.map((char, index) => {
              const isRevealed = stage >= 3 && index < revealedLettersCount;
              return (
                <span
                  key={index}
                  className={`inline-block transition-all duration-500 transform ${
                    isRevealed
                      ? 'opacity-100 translate-y-0 scale-100 filter-none text-[#002244]'
                      : 'opacity-0 translate-y-4 scale-90 blur-xs text-transparent'
                  }`}
                  style={{
                    textShadow: isRevealed
                      ? '0 2px 8px rgba(0,34,68,0.12)'
                      : 'none',
                  }}
                >
                  {char}
                </span>
              );
            })}
          </h1>

          {/* Hindi Script: अन्वेषक - Rendered as a Continuous Connected Devanagari Word */}
          <div
            className="mt-0.5 flex items-center justify-center font-devanagari font-bold text-sm sm:text-base md:text-lg text-[#fc6018] min-h-[26px] tracking-normal select-none"
            aria-label="अन्वेषक"
          >
            <span
              className={`inline-block transition-all duration-300 transform ${
                stage >= 3 && revealedHindiCount > 0
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 translate-y-2 scale-90'
              }`}
            >
              {revealedHindiCount > 0
                ? hindiProgressive[Math.min(revealedHindiCount - 1, hindiProgressive.length - 1)]
                : ''}
            </span>
          </div>
        </div>

        {/* Step 3: Taglines & Reduced Description */}
        <div
          className={`transition-all duration-700 ease-out flex flex-col items-center ${
            stage >= 4
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-3 pointer-events-none'
          }`}
        >
          <div className="inline-flex items-center space-x-2.5 mb-0.5">
            <span className="h-0.5 w-5 sm:w-8 bg-gradient-to-r from-transparent to-[#FF9933] rounded-full"></span>
            <p className="text-xs sm:text-sm text-[#002244] font-extrabold tracking-widest uppercase font-sans-jakarta">
              {language === 'hi'
                ? 'एक राष्ट्र, एक न्याय तंत्र'
                : 'One Nation, One Justice Network'}
            </p>
            <span className="h-0.5 w-5 sm:w-8 bg-gradient-to-l from-transparent to-[#138808] rounded-full"></span>
          </div>

          <p className="max-w-lg text-[11px] sm:text-xs text-[#2d486c] leading-tight mb-2 px-2 font-sans-jakarta font-medium">
            {language === 'hi' ? (
              <>
                सर्वोच्च न्यायालय, उच्च न्यायालयों, जिला अदालतों एवं पुलिस सीसीटीएनएस को जोड़ने वाला संप्रभु डिजिटल ग्रिड।
              </>
            ) : (
              <>
                Sovereign digital grid linking the Supreme Court, High Courts, District Courts, and Police CCTNS.
              </>
            )}
          </p>
        </div>

        {/* Step 4: The 4 Project-Specific Info Cards (Anveshak) */}
        <div
          className={`grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 w-full max-w-2xl mb-3 px-2 transition-all duration-700 ${
            stage >= 5
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-3 scale-95 pointer-events-none'
          }`}
        >
          {/* Card 1: Unified Records */}
          <div className="bg-white/95 border border-[#002244]/10 rounded-lg py-1.5 px-2 shadow-xs flex items-center justify-center space-x-1.5 hover:border-[#fc6018]/40 transition-colors">
            <span className="material-symbols-outlined text-[#fc6018] text-base">
              folder
            </span>
            <div className="text-left">
              <div className="text-[11px] font-extrabold text-[#001C3A] leading-tight">
                {language === 'hi' ? 'एकीकृत रिकॉर्ड' : 'Unified Records'}
              </div>
              <div className="text-[9px] text-gray-500 font-medium">
                {language === 'hi' ? 'एफआईआर व विधिक दस्तावेज' : 'FIRs & Legal Documents'}
              </div>
            </div>
          </div>

          {/* Card 2: Role-Based Access */}
          <div className="bg-white/95 border border-[#002244]/10 rounded-lg py-1.5 px-2 shadow-xs flex items-center justify-center space-x-1.5 hover:border-[#138808]/40 transition-colors">
            <span className="material-symbols-outlined text-[#138808] text-base">
              shield
            </span>
            <div className="text-left">
              <div className="text-[11px] font-extrabold text-[#001C3A] leading-tight">
                {language === 'hi' ? 'भूमिका-आधारित पहुंच' : 'Role-Based Access'}
              </div>
              <div className="text-[9px] text-gray-500 font-medium">
                {language === 'hi' ? 'अधिकृत हितधारक' : 'Authorized Stakeholders'}
              </div>
            </div>
          </div>

          {/* Card 3: AI Case Intelligence */}
          <div className="bg-white/95 border border-[#002244]/10 rounded-lg py-1.5 px-2 shadow-xs flex items-center justify-center space-x-1.5 hover:border-[#002244]/40 transition-colors">
            <span className="material-symbols-outlined text-[#002244] text-base">
              auto_awesome
            </span>
            <div className="text-left">
              <div className="text-[11px] font-extrabold text-[#001C3A] leading-tight">
                {language === 'hi' ? 'एआई केस इंटेलिजेंस' : 'AI Case Intelligence'}
              </div>
              <div className="text-[9px] text-gray-500 font-medium">
                {language === 'hi' ? 'सारांश व समान मामले' : 'Summaries & Similar Cases'}
              </div>
            </div>
          </div>

          {/* Card 4: Smart Retrieval */}
          <div className="bg-white/95 border border-[#002244]/10 rounded-lg py-1.5 px-2 shadow-xs flex items-center justify-center space-x-1.5 hover:border-emerald-500/40 transition-colors">
            <span className="material-symbols-outlined text-emerald-600 text-base">
              search
            </span>
            <div className="text-left">
              <div className="text-[11px] font-extrabold text-[#001C3A] leading-tight">
                {language === 'hi' ? 'स्मार्ट पुनर्प्राप्ति' : 'Smart Retrieval'}
              </div>
              <div className="text-[9px] text-gray-500 font-medium">
                {language === 'hi' ? 'खोज व केस ट्रैकिंग' : 'Search & Case Tracking'}
              </div>
            </div>
          </div>
        </div>

        {/* Step 5: AT THE END INCLUDE A BUTTON TO BEGIN THE ONBOARDING PROCESS */}
        <div
          className={`relative w-full max-w-sm group flex flex-col items-center transition-all duration-800 ease-out ${
            stage >= 6
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
          }`}
        >
          {/* Primary Action Button - clean and crisp without orange shadow */}
          <button
            onClick={() => navigate('/home')}
            id="enter-portal-btn"
            className="relative w-full overflow-hidden bg-gradient-to-r from-[#fc6018] via-[#e65100] to-[#b33c00] hover:from-[#ff6f1f] hover:to-[#c44300] text-white text-xs sm:text-sm md:text-base font-extrabold px-6 py-2.5 sm:py-3 rounded-xl shadow-xs hover:shadow-sm transition-all duration-300 flex items-center justify-center space-x-2 border border-amber-300/30 hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer"
          >
            {/* Shimmer Sweep Animation */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            <>
              <span className="material-symbols-outlined text-lg sm:text-xl text-amber-100 transition-transform group-hover:rotate-6">
                login
              </span>
              <span className="tracking-wide">
                Login to Anveshak
              </span>
              <span className="material-symbols-outlined text-base sm:text-lg transition-transform duration-300 group-hover:translate-x-1 text-white">
                arrow_forward
              </span>
            </>
          </button>
        </div>
      </div>
    </main>
  );
};
