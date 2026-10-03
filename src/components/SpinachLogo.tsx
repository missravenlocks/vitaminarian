import React from 'react';

interface SpinachLogoProps {
  className?: string;
  size?: number;
}

export const SpinachLogo: React.FC<SpinachLogoProps> = ({ className = '', size = 44 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 hover:scale-105 ${className}`}
      aria-label="Spinach Leaf Logo"
    >
      <defs>
        <linearGradient id="leafGrad" x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22C55E" />
          <stop offset="50%" stopColor="#16A34A" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>
        <linearGradient id="stemGrad" x1="18" y1="52" x2="10" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#15803D" />
          <stop offset="100%" stopColor="#166534" />
        </linearGradient>
      </defs>

      {/* Main leaf blade: gentle crinkled organic spinach shape */}
      <path
        d="M 17 50
           C 14 43, 11 34, 13 25
           C 15 15, 23 8, 34 7
           C 44 6, 52 13, 54 23
           C 56 34, 51 44, 42 50
           C 34 54, 23 54, 17 50 Z"
        fill="url(#leafGrad)"
        stroke="#166534"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Leaf stem extending slightly downwards */}
      <path
        d="M 21 48 C 17 53, 13 58, 9 60"
        stroke="url(#stemGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Central primary vein */}
      <path
        d="M 20 48
           C 25 38, 29 27, 34 10"
        stroke="#86EFAC"
        strokeWidth="1.8"
        strokeOpacity="0.85"
        strokeLinecap="round"
      />

      {/* Side veins */}
      <path
        d="M 23 42 C 17 38, 16 33, 15 29"
        stroke="#86EFAC"
        strokeWidth="1.2"
        strokeOpacity="0.7"
        strokeLinecap="round"
      />
      <path
        d="M 25 35 C 33 34, 40 37, 47 40"
        stroke="#86EFAC"
        strokeWidth="1.2"
        strokeOpacity="0.7"
        strokeLinecap="round"
      />
      <path
        d="M 28 27 C 22 23, 20 19, 21 16"
        stroke="#86EFAC"
        strokeWidth="1.2"
        strokeOpacity="0.7"
        strokeLinecap="round"
      />
      <path
        d="M 30 22 C 37 20, 44 22, 49 26"
        stroke="#86EFAC"
        strokeWidth="1.2"
        strokeOpacity="0.7"
        strokeLinecap="round"
      />
    </svg>
  );
};
