import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface DisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
  showAcceptButton?: boolean;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({
  isOpen,
  onAccept,
  showAcceptButton = true
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 border border-neutral-200 animate-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="flex items-center gap-3 text-amber-600 pb-3 border-b border-neutral-100">
          <div className="p-2 bg-amber-50 rounded-lg">
            <ShieldAlert className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900 leading-tight">
              Important Notice & Disclaimer
            </h2>
            <p className="text-xs text-neutral-500">
              Please review before using Vitaminarian
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-3.5 text-xs sm:text-sm text-neutral-700 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
          <p className="font-semibold text-neutral-900">
            Vitaminarian is an educational and personal data tracking tool designed to assist users in tracking their dietary intake and nutrient content based on user-supplied or sample nutritional information.
          </p>

          <div className="space-y-1">
            <h4 className="font-bold text-neutral-900">
              1. Not Medical or Dietary Advice
            </h4>
            <p className="text-neutral-600">
              The calculations, food breakdown trees, daily values, estimations, and nutrient data provided in this application are strictly for general informational and educational purposes. This application does not provide medical, diagnostic, nutritional, or clinical dietary advice. Always consult with a qualified physician, registered dietitian, or certified medical professional prior to altering your diet or making decisions regarding nutritional regimens.
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-neutral-900">
              2. Accuracy of Data
            </h4>
            <p className="text-neutral-600">
              Nutrient compositions, serving sizes, and daily target references vary widely across brands, agricultural conditions, preparation methods, and scientific databases. The application and its creators make no representations or warranties regarding the accuracy, completeness, or reliability of any preloaded sample data or calculations.
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-neutral-900">
              3. User Assumption of Risk
            </h4>
            <p className="text-neutral-600">
              You assume full responsibility for all data entered, uploaded, modified, or downloaded through this application, and for any dietary habits, health practices, or decisions undertaken based on such data.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6 pt-4 border-t border-neutral-100 flex justify-end">
          {showAcceptButton ? (
            <button
              onClick={onAccept}
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs transition-colors cursor-pointer text-center"
            >
              I Understand & Accept
            </button>
          ) : (
            <button
              onClick={onAccept}
              className="w-full sm:w-auto px-5 py-2 text-sm font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-md transition-colors cursor-pointer text-center"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
