import React from 'react';

/** Small lotus between two thin gold rules: the section divider. */
export const Lotus = ({ className = '' }) => (
  <svg viewBox="0 0 48 24" width="36" height="18" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M24 3c-3 4-3 10 0 16 3-6 3-12 0-16Z" />
    <path d="M24 19c-4-2-9-3-13-2 2 3 7 4 13 2Z" />
    <path d="M24 19c4-2 9-3 13-2-2 3-7 4-13 2Z" />
    <path d="M24 19c-3-4-7-7-11-8 0 4 5 7 11 8Z" />
    <path d="M24 19c3-4 7-7 11-8 0 4-5 7-11 8Z" />
  </svg>
);

const Ornament = ({ center = false, className = '' }) => (
  <div className={`ornament ${center ? 'justify-center' : ''} ${className}`}>
    <Lotus />
  </div>
);

export default Ornament;
