import React, { useEffect, useState } from 'react';
import { Sparkles, Loader2, X } from 'lucide-react';

export const CloudServerNotice: React.FC = () => {
  const [isSlow, setIsSlow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleSlow = (e: any) => {
      const slow = Boolean(e.detail?.isSlow);
      setIsSlow(slow);
      if (!slow) setDismissed(false);
    };
    window.addEventListener('app:slow-request', handleSlow);
    return () => window.removeEventListener('app:slow-request', handleSlow);
  }, []);

  if (!isSlow || dismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm transition-all animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-brand-navy/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-blue-400/40 flex items-start gap-3 relative">
        <Loader2 className="w-5 h-5 text-amber-400 animate-spin shrink-0 mt-0.5" />
        <div className="text-xs pr-4">
          <p className="font-bold flex items-center gap-1.5 text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Waking Up Cloud Server
          </p>
          <p className="text-slate-300 text-[11px] mt-0.5 leading-snug">
            Free-tier cloud servers (e.g. Render) spin down after 15 mins of inactivity and take ~20–30s to boot up on first visit. Subsequent clicks are instant!
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          title="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
