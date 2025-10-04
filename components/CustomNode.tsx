"use client";

import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Info } from 'lucide-react';

interface CustomNodeData {
  label: string;
  type: string;
  description?: string;
  color: string;
  isRoot?: boolean;
}

function CustomNode({ data }: NodeProps<CustomNodeData>) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isRoot = data.isRoot || false;
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} />

      <div
        className={`rounded-lg shadow-lg border-2 bg-white dark:bg-slate-800 cursor-pointer hover:shadow-xl transition-all ${
          isRoot
            ? 'px-6 py-4 min-w-[250px] max-w-[350px] border-4'
            : 'px-4 py-3 min-w-[150px] max-w-[200px]'
        }`}
        style={{ borderColor: data.color }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="flex items-center gap-2 mb-1">
          <div
            className={`rounded-full flex-shrink-0 ${isRoot ? 'w-4 h-4' : 'w-3 h-3'}`}
            style={{ backgroundColor: data.color }}
          />
          <span
            className={`font-semibold text-slate-600 dark:text-slate-400 uppercase ${
              isRoot ? 'text-sm' : 'text-xs'
            }`}
          >
            {data.type}
          </span>
        </div>

        <div
          className={`font-medium text-slate-900 dark:text-white break-words ${
            isRoot ? 'text-lg' : 'text-sm'
          }`}
        >
          {data.label}
        </div>

        {data.description && (
          <div className="mt-1">
            <Info className={`text-slate-400 ${isRoot ? 'w-4 h-4' : 'w-3 h-3'}`} />
          </div>
        )}
      </div>

      {showTooltip && data.description && (
        <div className="absolute z-50 top-full mt-2 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs rounded-lg p-3 shadow-xl max-w-xs pointer-events-none">
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
          {data.description}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default memo(CustomNode);
