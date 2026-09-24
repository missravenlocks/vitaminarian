import React from 'react';

interface SpinachLogoProps {
  className?: string;
  size?: number;
}

export const SpinachLogo: React.FC<SpinachLogoProps> = ({ className = '', size = 48 }) => {
  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/80 p-2 shadow-sm border border-emerald-200/60 ${className}`}
      style={{ width: size + 16, height: size + 16 }}
      aria-label="Spinach Leaf Logo"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transform -rotate-6 transition-transform hover:rotate-0 duration-300 drop-shadow-sm"
      >
        <defs>
          <linearGradient id="spinachGradient" x1="12" y1="6" x2="52" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="45%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient id="veinGradient" x1="32" y1="8" x2="32" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="stemGradient" x1="32" y1="46" x2="28" y2="62" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>

        {/* Outer Leaf Blade - Organic Spinach Shape */}
        <path
          d="M32 6C20 9 10 22 11 36C11.6 44.5 17 50.5 28 53L27 61C27 61.5 27.5 62 28 62C28.8 62 29.5 61.2 30 60L32 53.5C44 52 53 43 53 32C53 19 43 7 32 6Z"
          fill="url(#spinachGradient)"
        />

        {/* Highlights & Texture */}
        <path
          d="M32 8C22 11 13 22 14 35C14.5 42 19 47 28 49.5C28 46 29 28 32 8Z"
          fill="#34d399"
          fillOpacity="0.25"
        />

        {/* Central Vein */}
        <path
          d="M32 10C32.5 22 31 38 28.5 53.5"
          stroke="url(#veinGradient)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Lateral Veins */}
        <path
          d="M31.8 19C26 21 21 24.5 17 29"
          stroke="url(#veinGradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M32 23C37 25 42 29 46 34"
          stroke="url(#veinGradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M31.2 30C25 33 21 38 18 43"
          stroke="url(#veinGradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M30.5 35C35 38 40 42 43 47"
          stroke="url(#veinGradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Delicate stem base */}
        <path
          d="M28.5 53.5L27 61"
          stroke="url(#stemGradient)"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};
