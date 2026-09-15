
import React from 'react';

export const ChakraBackground = () => {
  // 24 spokes at 15-degree intervals (360 / 24 = 15)
  const spokes = Array.from({ length: 24 }, (_, i) => i * 15);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
      {/* Saffron Ambient Glow at Top-Left */}
      <div
        className="absolute -top-20 -left-12 w-[600px] h-[540px] rounded-full blur-[85px] pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 35% 35%, rgba(190, 62, 0, 0.42) 0%, rgba(205, 75, 5, 0.28) 40%, rgba(220, 95, 20, 0.12) 65%, transparent 80%)',
        }}
      />

      {/* Emerald Green Ambient Glow at Bottom-Right */}
      <div
        className="absolute -bottom-20 -right-12 w-[600px] h-[540px] rounded-full blur-[85px] pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 65% 65%, rgba(8, 76, 16, 0.40) 0%, rgba(14, 96, 24, 0.26) 40%, rgba(22, 115, 34, 0.10) 65%, transparent 80%)',
        }}
      />

      {/* Central Radiance */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[580px] rounded-full blur-[80px] pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(255, 255, 255, 0.82) 0%, rgba(255, 255, 255, 0.45) 55%, transparent 85%)',
        }}
      />

      {/* Authentic Geometrical 24-Spoke Ashoka Chakra Rotating Clockwise Continuously */}
      <div
  className="absolute top-1/2 left-1/2 w-[min(800px,calc(100vh-140px),calc(100vw-48px))] h-[min(800px,calc(100vh-140px),calc(100vw-48px))] opacity-[0.15] pointer-events-none animate-spin-chakra flex items-center justify-center"
 
  aria-hidden="true"
>
        <svg
          className="w-full h-full text-[#002244]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 400 400"
        >
          {/* Outer Concentric Rims */}
          <circle cx="200" cy="200" r="185" strokeWidth="4.5" />
          <circle
            cx="200"
            cy="200"
            r="172"
            strokeDasharray="4 6"
            strokeWidth="1.8"
          />
          <circle cx="200" cy="200" r="158" strokeWidth="1.5" />

          {/* Central Hub Rings */}
          <circle cx="200" cy="200" r="42" strokeWidth="4" />
          <circle cx="200" cy="200" r="32" strokeWidth="1.5" />
          <circle
            cx="200"
            cy="200"
            fill="currentColor"
            r="16"
            stroke="none"
          />

          {/* 24 Spokes with Precision Geometry & Tip Beads */}
          <g fill="currentColor" stroke="none" transform="translate(200, 200)">
            {spokes.map((deg) => (
              <React.Fragment key={deg}>
                <polygon
                  points="-3,-42 3,-42 1.2,-158 -1.2,-158"
                  transform={`rotate(${deg})`}
                />
                <circle
                  cx="0"
                  cy="-164"
                  r="3.5"
                  transform={`rotate(${deg})`}
                />
              </React.Fragment>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
};


