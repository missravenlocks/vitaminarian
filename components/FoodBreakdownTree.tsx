"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { BreakdownNode } from "@/lib/types";

interface FoodBreakdownTreeProps {
  tree: BreakdownNode;
}

function TreeNode({ node, depth = 0 }: { node: BreakdownNode; depth?: number }) {
  const [expanded, setExpanded] = useState(false);

  if (!node.expandable) {
    return (
      <div
        className="py-1 text-sm text-slate-700"
        style={{ paddingLeft: depth * 20 + 8 }}
      >
        {node.label}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 py-1 text-sm font-medium text-emerald-700 hover:text-emerald-900"
        style={{ paddingLeft: depth * 20 }}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" />
        )}
        {node.label}
      </button>
      {expanded &&
        node.children?.map((child) => (
          <TreeNode key={child.id} node={child} depth={depth + 1} />
        ))}
    </div>
  );
}

export default function FoodBreakdownTree({ tree }: FoodBreakdownTreeProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl bg-emerald-50/50 p-4 ring-1 ring-emerald-100">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-900"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        {tree.label}
      </button>
      {expanded && (
        <div className="mt-2 space-y-0.5">
          {tree.children?.map((child) => (
            <TreeNode key={child.id} node={child} depth={1} />
          ))}
          {(!tree.children || tree.children.length === 0) && (
            <p className="py-1 pl-6 text-sm text-slate-500">No items logged.</p>
          )}
        </div>
      )}
    </div>
  );
}
