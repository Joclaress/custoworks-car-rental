import React, { useEffect, useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

export const CloudServerNotice: React.FC = () => {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const handleSlow = (e: any) => {
      setIsSlow(Boolean(e.detail?.isSlow));
    };
    window.addEventListener('app:slow-request', handleSlow);
    return () => window.removeEventListener('app:slow-request', handleSlow);
  }, []);

  if (!isSlow) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce duration-1000 max-w-sm">
      <div className="bg-brand-navy/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-blue-400/40 flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
        <div className="text-xs">
          <p className="font-bold flex items-center gap-1.5 text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Waking Up Cloud Server
          </p>
          <p className="text-slate-300 text-[11px] mt-0.5 leading-snug">
            Free-tier instances spin down after inactivity and take ~20-30s to wake up on first visit. Hang tight!
          </p>
        </div>
      </div>
    </div>
  );
};
