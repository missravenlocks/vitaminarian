import React from 'react';
import { SpinachLogo } from './SpinachLogo';

export const HeaderModule: React.FC = () => {
  return (
    <header className="w-full bg-white border-b border-emerald-100 shadow-sm py-5 px-6 sm:px-8">
      <div className="max-w-6xl mx-auto flex items-center space-x-4">
        <SpinachLogo size={44} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
            Vitaminarian
          </h1>
          <p className="text-sm sm:text-base font-medium text-emerald-700">
            Customizable nutrition tracking
          </p>
        </div>
      </div>
    </header>
  );
};
