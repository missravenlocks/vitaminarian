import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export interface DropdownOption {
  label: string;
  value: string;
  category?: string; // e.g. "Foods" or "Meals"
}

interface SearchableDropdownProps {
  label?: string;
  hintText?: string;
  options: (string | DropdownOption)[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  className?: string;
  readOnly?: boolean;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  label,
  hintText = 'Select an option...',
  options,
  value,
  onChange,
  disabled = false,
  readOnly = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options
  const normalizedOptions: DropdownOption[] = options.map(opt =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  const filteredOptions = normalizedOptions.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = normalizedOptions.find(opt => opt.value === value);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  if (readOnly) {
    return (
      <div className={`relative ${className}`}>
        {label && <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>}
        <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium cursor-not-allowed select-none">
          {value || hintText}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 bg-white border rounded-xl text-sm font-medium text-left transition-all ${
          isOpen ? 'border-emerald-500 ring-2 ring-emerald-100 shadow-xs' : 'border-slate-300 hover:border-slate-400'
        } ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'text-slate-800'}`}
      >
        <span className={selectedOption ? 'text-slate-900 truncate' : 'text-slate-400 truncate'}>
          {selectedOption ? selectedOption.label : hintText}
        </span>
        <ChevronDown className={`w-4 h-4 ml-1.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-40 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 min-w-[200px]">
          {/* Search box */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden"
            />
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-y-auto p-1 text-sm divide-y divide-slate-50">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">No matching items</div>
            ) : (
              filteredOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                    opt.value === value
                      ? 'bg-emerald-50 text-emerald-800 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.category && (
                    <span className="ml-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      {opt.category}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
