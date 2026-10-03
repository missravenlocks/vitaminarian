import React from 'react';
import { BookOpen, ShieldAlert } from 'lucide-react';

interface FooterModuleProps {
  onOpenTutorial: () => void;
  onOpenDisclaimer: () => void;
}

export const FooterModule: React.FC<FooterModuleProps> = ({
  onOpenTutorial,
  onOpenDisclaimer
}) => {
  return (
    <footer className="w-full bg-neutral-100 border-t border-neutral-200 py-8 mt-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center space-y-4">
        {/* Tutorial Link */}
        <div>
          <button
            onClick={onOpenTutorial}
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-4 decoration-emerald-400 hover:decoration-emerald-700 transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Application Tutorial & User Guide</span>
          </button>
        </div>

        {/* Disclaimer stacked directly below Tutorial Link */}
        <div className="max-w-2xl px-4 py-3 bg-white border border-neutral-200 rounded-lg shadow-2xs text-xs text-neutral-600 leading-relaxed text-center">
          <p className="flex items-center justify-center gap-1.5 font-semibold text-neutral-800 mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>Health & Accuracy Disclaimer</span>
          </p>
          <p>
            Vitaminarian is an educational and personal data tracking tool. It is not intended to provide professional dietary, medical, or clinical advice, and nutritional information may not be accurate. Always consult a qualified physician or registered dietitian before making significant changes to your diet.
          </p>
          <div className="mt-2">
            <button
              onClick={onOpenDisclaimer}
              className="text-neutral-500 hover:text-neutral-800 underline transition-colors cursor-pointer"
            >
              Read full legal disclaimer
            </button>
          </div>
        </div>

        {/* Copyright notice */}
        <p className="text-[11px] text-neutral-400 font-mono pt-2">
          Vitaminarian · Customizable Nutrition Tracking
        </p>
      </div>
    </footer>
  );
};
