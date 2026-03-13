'use client';

import { useEffect } from 'react';

export default function InfoModal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-border"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4 gap-3">
          <h3 className="font-display text-xl text-coffee-dark leading-tight">{title}</h3>
          <button
            onClick={onClose}
            className="text-coffee-light hover:text-coffee-dark text-2xl leading-none flex-shrink-0 mt-0.5"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="text-sm text-gray-700 leading-relaxed space-y-3 [&_strong]:text-coffee-dark [&_ul]:pl-5 [&_ul]:my-2 [&_li]:mb-1">
          {children}
        </div>
        <p className="text-[0.65rem] text-coffee-light mt-5 pt-3 border-t border-border italic">
          Source: <em>The Physics of Filter Coffee</em> — Jonathan Gagné
        </p>
      </div>
    </div>
  );
}
