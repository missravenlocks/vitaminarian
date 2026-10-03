import React from 'react';
import { SpinachLogo } from './SpinachLogo.tsx';
import { DownloadCloud } from 'lucide-react';

interface HeaderModuleProps {
  onExportZip?: () => void;
}

export const HeaderModule: React.FC<HeaderModuleProps> = ({ onExportZip }) => {
  return (
    <header className="w-full bg-white border-b border-neutral-200 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3.5">
          <SpinachLogo size={46} />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 leading-none">
              Vitaminarian
            </h1>
            <p className="text-sm font-medium text-neutral-500 mt-1">
              Customizable nutrition tracking
            </p>
          </div>
        </div>

        {/* Right side helper / quick actions */}
        {onExportZip && (
          <div className="flex items-center gap-2">
            <button
              onClick={onExportZip}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-md transition-colors cursor-pointer"
              title="Download complete project source as a .zip file ready for GitHub & Vercel deployment"
            >
              <DownloadCloud className="w-4 h-4 text-emerald-600" />
              <span>Project Source (.zip)</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
