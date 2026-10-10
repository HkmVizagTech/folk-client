import React from 'react';
import { cn } from '../../../lib/utils';

const CauseIcon = ({ cause, size = 24, className }) => {
  const Icon = cause.icon;
  return (
    <span className={cn('inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-soft', cause.tone, className)}>
      <Icon size={size} aria-hidden="true" />
    </span>
  );
};

export default CauseIcon;
