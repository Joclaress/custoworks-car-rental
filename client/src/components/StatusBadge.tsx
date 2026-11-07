import React from 'react';
import { cn, getStatusColor, getStatusLabel } from '../lib/utils';

export const StatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        getStatusColor(status),
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70"></span>
      {getStatusLabel(status)}
    </span>
  );
};

