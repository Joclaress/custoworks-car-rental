import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle,
  X,
  Calendar,
  ExternalLink,
  PhoneCall,
  Clock,
  Sparkles,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Send,
} from 'lucide-react';

export const FacebookMessengerWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<string | null>(null);
  const [bubbleVisible, setBubbleVisible] = useState(false);

  // Show a gentle greeting bubble 3 seconds after page loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setBubbleVisible(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const fbMessengerUrl = 'https://m.me/CustoWorkss';

  return (
    <div className="fixed bottom-5 right-5 z-50 print:hidden font-sans">
      {/* 1. Interactive Chat / FAQ Window */}
      {isOpen && (
        <div className="mb-3 w-[92vw] sm:w-[380px] bg-white rounded-3xl shadow-2xl border border-slate-250 overflow-hidden flex flex-col transition-all animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header with Facebook Messenger Branding */}
          <div className="bg-gradient-to-r from-[#0078FF] via-[#0084FF] to-[#A033FF] p-4 text-white relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
              title="Isara"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-white p-0.5 shadow-md flex items-center justify-center overflow-hidden">
                  <img
                    src="/images/logo.png"
                    alt="Custoworks Logo"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                    className="w-full h-full object-contain"
                  />
                  <span className="text-brand-navy font-black text-sm">CW</span>
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full animate-pulse" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-black text-sm tracking-tight text-white">Custoworks Car Rental</h4>
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-250" />
                </div>
                <div className="flex items-center gap-1 text-[11px] text-white/90 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                  <span>Online Dispatch · Naga City (Beside SM)</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-white/85 mt-2.5 leading-snug">
              👋 Kumusta! Paano po kami makakatulong sa inyong road trip o rental schedule ngayon?
            </p>
          </div>

          {/* Quick FAQ Options & Automated Replies */}
          <div className="p-4 space-y-3 max-h-[360px] overflow-y-auto bg-slate-50">
            {/* FAQ 1: Vehicle Availability (The Main Question) */}
            <div className="space-y-2">
              <button
                onClick={() => setSelectedFaq(selectedFaq === 'AVAILABILITY' ? null : 'AVAILABILITY')}
                className="w-full text-left bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-2xl p-3 transition-all flex items-center justify-between group shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-blue-100 text-[#0084FF] flex items-center justify-center shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600">
                    May available po bang sasakyan ngayon?
                  </span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${selectedFaq === 'AVAILABILITY' ? 'rotate-90 text-blue-600' : ''}`} />
              </button>

              {selectedFaq === 'AVAILABILITY' && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 text-xs text-slate-700 space-y-2.5 animate-in fade-in duration-150">
                  <p className="leading-relaxed">
                    Opo! May <strong>5 units po kami ng Mitsubishi Mirage G4 AT</strong>, plus Toyota Vios 2025, Xpander, Innova, at NV350 15-Seater Van.
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Maaari ninyong tingnan ang aming <strong>100% Real-Time Calendar</strong> para makita ang bakanteng units sa inyong napiling petsa:
                  </p>
                  <Link
                    to="/calendar"
                    onClick={() => setIsOpen(false)}
                    className="bg-[#0084FF] hover:bg-[#0073e6] text-white font-black text-xs py-2 px-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Tingnan ang Live Availability Calendar</span>
                  </Link>
                </div>
              )}
            </div>

            {/* FAQ 2: Rental Rates & Requirements */}
            <div className="space-y-2">
              <button
                onClick={() => setSelectedFaq(selectedFaq === 'RATES' ? null : 'RATES')}
                className="w-full text-left bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-2xl p-3 transition-all flex items-center justify-between group shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600">
                    Magkano ang rates at ano ang requirements?
                  </span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${selectedFaq === 'RATES' ? 'rotate-90 text-blue-600' : ''}`} />
              </button>

              {selectedFaq === 'RATES' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-slate-700 space-y-2.5 animate-in fade-in duration-150">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">Rental Rates:</p>
                    <ul className="text-[11px] space-y-1 list-disc list-inside text-slate-600">
                      <li><strong>Sedan (Mirage/Vios):</strong> ₱1,500 (12h) · ₱2,000 (24h)</li>
                      <li><strong>7-Seater MPV (Xpander/Innova):</strong> ₱2,000 (12h) · ₱2,500 (24h)</li>
                      <li><strong>15-Seater Van (NV350):</strong> With Driver starting ₱3,500</li>
                    </ul>
                  </div>
                  <div className="border-t border-emerald-200 pt-2 text-[11px]">
                    <strong>Requirements:</strong> 1 Valid Driver's License + 1 Secondary Government ID.
                  </div>
                  <Link
                    to="/rates"
                    onClick={() => setIsOpen(false)}
                    className="text-emerald-700 hover:text-emerald-800 font-bold text-[11px] inline-flex items-center gap-1"
                  >
                    <span>Tingnan ang Kumpletong Rate Matrix & Discounts</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>

            {/* FAQ 3: Pickup Garage Location */}
            <div className="space-y-2">
              <button
                onClick={() => setSelectedFaq(selectedFaq === 'LOCATION' ? null : 'LOCATION')}
                className="w-full text-left bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-2xl p-3 transition-all flex items-center justify-between group shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600">
                    Saan po ang garahe ninyo sa Naga?
                  </span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${selectedFaq === 'LOCATION' ? 'rotate-90 text-blue-600' : ''}`} />
              </button>

              {selectedFaq === 'LOCATION' && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-slate-700 space-y-2 animate-in fade-in duration-150">
                  <p className="leading-snug">
                    📍 <strong>Carnation St. CBD II Brgy. Triangulo, Naga City</strong> (katabi mismo ng SM City Naga).
                  </p>
                  <p className="text-[11px] text-slate-600">
                    24/7 po ang pag-release ng sasakyan basta't may confirmed reservation. May airport pickup din po sa Naga Airport (WNP) at Bicol International Airport (BIA).
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Direct CTA Buttons to Facebook Messenger & Call */}
          <div className="p-3 bg-white border-t border-slate-200 space-y-2">
            <a
              href={fbMessengerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-gradient-to-r from-[#0084FF] to-[#A033FF] hover:brightness-110 text-white font-black text-xs py-3 px-4 rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Mag-Chat sa Facebook Messenger</span>
              <ExternalLink className="w-3.5 h-3.5 text-white/80" />
            </a>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-0.5">
              <span>Hotline / Dispatch:</span>
              <a href="tel:09617225326" className="font-bold text-slate-700 hover:text-blue-600 flex items-center gap-1">
                <PhoneCall className="w-3 h-3 text-emerald-600" />
                <span>0961 722 5326</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 2. Floating Action Button & Bubble */}
      <div className="flex items-center gap-3 justify-end">
        {/* Gentle Welcome Bubble (Appears once) */}
        {!isOpen && bubbleVisible && (
          <div
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-white text-slate-800 text-xs font-bold py-2 px-3.5 rounded-2xl shadow-xl border border-slate-200 cursor-pointer hover:scale-105 transition-all animate-bounce duration-1000"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-ping" />
            <span>May tanong po kayo? Chat with Custoworks!</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setBubbleVisible(false);
              }}
              className="text-slate-400 hover:text-slate-600 ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Floating Messenger Icon Button */}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setBubbleVisible(false);
          }}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95 ${
            isOpen
              ? 'bg-slate-800 rotate-90'
              : 'bg-gradient-to-tr from-[#0084FF] via-[#0078FF] to-[#A033FF] shadow-blue-500/40 animate-pulse'
          }`}
          aria-label="Open Facebook Messenger Chat"
          title="Chat on Facebook Messenger"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <div className="relative">
              {/* Official Messenger Icon SVG */}
              <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.909 1.455 5.503 3.734 7.158V22l3.438-1.89c.895.249 1.846.384 2.828.384 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.045 12.445l-2.604-2.777-5.08 2.777 5.59-5.932 2.668 2.777 5.016-2.777-5.59 5.932z" />
              </svg>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full" />
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
