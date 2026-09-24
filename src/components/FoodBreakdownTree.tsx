import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { TreeNode } from '../types/nutrition';

interface FoodBreakdownTreeProps {
  rootNode: TreeNode;
}

interface TreeNodeItemProps {
  node: TreeNode;
  level: number;
}

const TreeNodeItem: React.FC<TreeNodeItemProps> = ({ node, level }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // If leaf node (single food item)
  if (!node.isExpandable || !node.children || node.children.length === 0) {
    return (
      <div
        className="py-1 text-sm font-medium text-slate-800"
        style={{ paddingLeft: `${level * 24}px` }}
      >
        <span>{node.title}</span>
      </div>
    );
  }

  // If expandable node (root or meal)
  return (
    <div className="select-none">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="group flex items-center gap-1.5 py-1 text-sm font-semibold text-emerald-800 hover:text-emerald-950 transition-colors focus:outline-hidden"
        style={{ paddingLeft: `${level * 24}px` }}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-emerald-600 transition-transform" />
        ) : (
          <ChevronRight className="w-4 h-4 text-emerald-600 transition-transform group-hover:translate-x-0.5" />
        )}
        <span className="underline decoration-emerald-300 underline-offset-3 group-hover:decoration-emerald-600">
          {node.title}
        </span>
      </button>

      {/* Children */}
      {isExpanded && (
        <div className="space-y-0.5 animate-in fade-in-50 duration-150">
          {node.children.map(child => (
            <TreeNodeItem key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const FoodBreakdownTree: React.FC<FoodBreakdownTreeProps> = ({ rootNode }) => {
  return (
    <div className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
      <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
        <span>Food Breakdown</span>
      </h3>

      <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-x-auto">
        <TreeNodeItem node={rootNode} level={0} />
      </div>
    </div>
  );
};
