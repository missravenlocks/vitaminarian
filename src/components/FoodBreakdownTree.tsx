import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { TreeNode } from '../types/nutrition.ts';

interface TreeNodeViewProps {
  node: TreeNode;
  level?: number;
}

export const TreeNodeView: React.FC<TreeNodeViewProps> = ({ node, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!node.isExpandable) {
    // Leaf node: just text
    return (
      <div
        className="py-1 text-sm text-neutral-800 font-medium font-mono"
        style={{ paddingLeft: `${level * 1.5}rem` }}
      >
        <span>{node.title}</span>
      </div>
    );
  }

  return (
    <div className="select-none">
      {/* Clickable expandable link */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="py-1 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 hover:text-emerald-950 transition-colors text-left cursor-pointer group"
        style={{ paddingLeft: `${level * 1.5}rem` }}
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-emerald-600 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-emerald-600 shrink-0" />
        )}
        <span className="underline decoration-emerald-300 group-hover:decoration-emerald-700 underline-offset-2">
          {node.title}
        </span>
      </button>

      {/* Render children if open */}
      {isOpen && node.children && node.children.length > 0 && (
        <div className="space-y-0.5">
          {node.children.map((child) => (
            <TreeNodeView key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

interface FoodBreakdownTreeProps {
  tree: TreeNode;
}

export const FoodBreakdownTree: React.FC<FoodBreakdownTreeProps> = ({ tree }) => {
  return (
    <div className="w-full bg-neutral-50/70 border border-neutral-200 rounded-lg p-4 font-sans">
      <TreeNodeView node={tree} level={0} />
    </div>
  );
};
