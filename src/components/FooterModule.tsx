import React, { useState } from 'react';
import { BookOpen, ShieldAlert } from 'lucide-react';
import { DialogModal } from './DialogModal';

interface FooterModuleProps {
  tutorialContent: string;
  disclaimerText: string;
}

export const FooterModule: React.FC<FooterModuleProps> = ({
  tutorialContent,
  disclaimerText,
}) => {
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isDisclaimerModalOpen, setIsDisclaimerModalOpen] = useState(false);

  return (
    <footer className="w-full bg-slate-900 text-slate-300 py-10 px-6 sm:px-8 border-t border-slate-800">
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-6">
        {/* 1. Tutorial Link */}
        <div>
          <button
            type="button"
            onClick={() => setIsTutorialOpen(true)}
            className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-semibold text-sm sm:text-base underline underline-offset-4 decoration-emerald-500/50 hover:decoration-emerald-400 transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Open Vitaminarian User Tutorial & Documentation</span>
          </button>
        </div>

        {/* 2. Disclaimer stacked on bottom */}
        <div className="border-t border-slate-800/80 pt-6 max-w-3xl">
          <p className="text-xs text-slate-400 leading-relaxed font-normal">
            <span className="font-semibold text-slate-300 block mb-1">
              Important Disclaimer:
            </span>
            {disclaimerText}
          </p>
          <button
            type="button"
            onClick={() => setIsDisclaimerModalOpen(true)}
            className="mt-2 text-[11px] text-slate-500 hover:text-slate-300 underline transition-colors"
          >
            View Full Disclaimer
          </button>
        </div>

        <div className="text-[11px] text-slate-600 pt-2">
          Vitaminarian © {new Date().getFullYear()} — Precision Nutrition Tracking System
        </div>
      </div>

      {/* Tutorial Popup Modal */}
      <DialogModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        title="Vitaminarian User Tutorial & Documentation"
        maxWidth="max-w-3xl"
        icon={<BookOpen className="w-5 h-5 text-emerald-600" />}
        footer={
          <button
            type="button"
            onClick={() => setIsTutorialOpen(false)}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            Close Tutorial
          </button>
        }
      >
        <div className="prose prose-slate max-w-none text-slate-700 text-sm space-y-4">
          {tutorialContent.split('\n\n').map((paragraph, idx) => {
            if (paragraph.startsWith('# ')) {
              return (
                <h1 key={idx} className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">
                  {paragraph.replace('# ', '')}
                </h1>
              );
            }
            if (paragraph.startsWith('## ')) {
              return (
                <h2 key={idx} className="text-base font-bold text-emerald-800 pt-2">
                  {paragraph.replace('## ', '')}
                </h2>
              );
            }
            if (paragraph.startsWith('### ')) {
              return (
                <h3 key={idx} className="text-sm font-bold text-slate-800 pt-1">
                  {paragraph.replace('### ', '')}
                </h3>
              );
            }
            if (paragraph.startsWith('- ')) {
              const items = paragraph.split('\n').filter(line => line.trim().startsWith('- '));
              return (
                <ul key={idx} className="list-disc pl-5 space-y-1">
                  {items.map((item, itemIdx) => (
                    <li key={itemIdx}>{item.replace('- ', '')}</li>
                  ))}
                </ul>
              );
            }
            if (paragraph.startsWith('1. ') || paragraph.startsWith('2. ')) {
              const items = paragraph.split('\n').filter(line => /^\d+\.\s/.test(line.trim()));
              return (
                <ol key={idx} className="list-decimal pl-5 space-y-1">
                  {items.map((item, itemIdx) => (
                    <li key={itemIdx}>{item.replace(/^\d+\.\s/, '')}</li>
                  ))}
                </ol>
              );
            }
            if (paragraph.startsWith('---')) {
              return <hr key={idx} className="my-3 border-slate-200" />;
            }
            return (
              <p key={idx} className="leading-relaxed">
                {paragraph}
              </p>
            );
          })}
        </div>
      </DialogModal>

      {/* Full Disclaimer Modal */}
      <DialogModal
        isOpen={isDisclaimerModalOpen}
        onClose={() => setIsDisclaimerModalOpen(false)}
        title="Medical & Dietary Disclaimer"
        maxWidth="max-w-xl"
        icon={<ShieldAlert className="w-5 h-5 text-amber-500" />}
        footer={
          <button
            type="button"
            onClick={() => setIsDisclaimerModalOpen(false)}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-slate-800 text-white hover:bg-slate-900 transition-colors"
          >
            I Understand
          </button>
        }
      >
        <div className="space-y-3 whitespace-pre-line text-sm text-slate-700 leading-relaxed font-sans">
          {disclaimerText}
        </div>
      </DialogModal>
    </footer>
  );
};
