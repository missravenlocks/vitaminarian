"use client";

import { ChevronDown, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface DropdownOption {
  value: string;
  label: string;
  children?: DropdownOption[];
}

interface SearchableDropdownProps {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  readOnly?: boolean;
  className?: string;
}

export default function SearchableDropdown({
  label,
  hint,
  value,
  onChange,
  options,
  readOnly = false,
  className = "",
}: SearchableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [hoveredParent, setHoveredParent] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setHoveredParent(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const flatOptions: DropdownOption[] = [];
  function flatten(opts: DropdownOption[]) {
    for (const opt of opts) {
      if (opt.children) {
        for (const child of opt.children) {
          flatOptions.push(child);
        }
      } else {
        flatOptions.push(opt);
      }
    }
  }
  flatten(options);

  const selectedLabel =
    flatOptions.find((o) => o.value === value)?.label ?? value;

  const filterOptions = (opts: DropdownOption[]): DropdownOption[] => {
    if (!search) return opts;
    const q = search.toLowerCase();
    return opts
      .map((opt) => {
        if (opt.children) {
          const filteredChildren = opt.children.filter((c) =>
            c.label.toLowerCase().includes(q)
          );
          if (filteredChildren.length > 0) {
            return { ...opt, children: filteredChildren };
          }
          return null;
        }
        return opt.label.toLowerCase().includes(q) ? opt : null;
      })
      .filter(Boolean) as DropdownOption[];
  };

  const filtered = filterOptions(options);

  if (readOnly) {
    return (
      <div className={className}>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          {label}
        </label>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 px-3 py-2 text-sm text-slate-700">
          {selectedLabel || value}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-2xl border border-emerald-200 bg-white px-3 py-2 text-left text-sm text-slate-900 transition hover:border-emerald-400"
      >
        <span className={value ? "" : "text-slate-400"}>
          {value ? selectedLabel : hint ?? "Select…"}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full min-w-[200px] rounded-2xl border border-emerald-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-emerald-100 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              autoFocus
            />
          </div>
          <ul className="max-h-60 overflow-y-auto py-1">
            {filtered.map((opt) =>
              opt.children ? (
                <li
                  key={opt.value}
                  className="relative"
                  onMouseEnter={() => setHoveredParent(opt.value)}
                  onMouseLeave={() => setHoveredParent(null)}
                >
                  <span className="flex cursor-default items-center justify-between px-3 py-2 text-sm text-slate-600 hover:bg-emerald-50">
                    {opt.label}
                    <ChevronDown className="-rotate-90 h-3 w-3" />
                  </span>
                  {hoveredParent === opt.value && (
                    <ul className="absolute left-full top-0 z-40 ml-1 min-w-[180px] rounded-2xl border border-emerald-200 bg-white py-1 shadow-lg">
                      {opt.children.map((child) => (
                        <li key={child.value}>
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm hover:bg-emerald-50"
                            onClick={() => {
                              onChange(child.value);
                              setOpen(false);
                              setSearch("");
                              setHoveredParent(null);
                            }}
                          >
                            {child.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ) : (
                <li key={opt.value}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-emerald-50"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    {opt.label}
                  </button>
                </li>
              )
            )}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-slate-400">No results</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
