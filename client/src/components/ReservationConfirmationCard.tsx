import React, { useState } from 'react';
import {
  Camera,
  Download,
  Printer,
  Copy,
  Check,
  MessageCircle,
  Phone,
  HelpCircle,
  ShieldCheck,
  Car,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { downloadElementAsImage } from '../lib/screenshot';
import { formatPeso, formatDate } from '../lib/utils';

interface ReservationConfirmationCardProps {
  reference: string;
  vehicleName?: string;
  rentalType?: string;
  destinationName?: string;
  pickupAt?: string | Date;
  returnAt?: string | Date;
  status: string;
  reservationFee?: number | string;
  customerName?: string;
  customerPhone?: string;
  onTrackClick?: () => void;
}

export const ReservationConfirmationCard: React.FC<ReservationConfirmationCardProps> = ({
  reference,
  vehicleName = 'Selected Vehicle',
  rentalType = 'SELF_DRIVE',
  destinationName = 'Naga City & Surroundings',
  pickupAt,
  returnAt,
  status,
  reservationFee = 1000,
  customerName,
  customerPhone,
  onTrackClick,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const isConfirmed = status === 'CONFIRMED';
  const isSelfDrive = rentalType === 'SELF_DRIVE';

  const handleCopyRef = () => {
    navigator.clipboard.writeText(reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScreenshot = async () => {
    setDownloading(true);
    try {
      const ok = await downloadElementAsImage(
        'booking-confirmation-slip',
        `Custoworks-Reservation-${reference}.png`
      );
      if (ok) {
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      }
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Pre-filled message for chat
  const chatMessage = isConfirmed
    ? `Hello Custoworks Dispatch! My reservation ${reference} (${vehicleName}) is CONFIRMED. I would like to coordinate vehicle release / pickup schedule.`
    : `Hello Custoworks Dispatch! I have submitted a reservation with tracking number ${reference} (${vehicleName}). Please assist me with my booking.`;

  const messengerUrl = `https://m.me/CustoWorkss`;
  const whatsappUrl = `https://wa.me/639617225326?text=${encodeURIComponent(chatMessage)}`;
  const smsUrl = `sms:09617225326?body=${encodeURIComponent(chatMessage)}`;

  return (
    <div className="space-y-6 max-w-xl mx-auto text-left">
      {/* 1. EASY GUIDE FOR ALL USERS (SENIOR / FIRST-TIMER FRIENDLY) */}
      <div className="bg-amber-50/90 border-2 border-amber-300/80 rounded-2xl p-5 shadow-sm text-slate-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center shrink-0 font-black text-xl shadow-sm">
            💡
          </div>
          <div className="flex-1">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              Quick Guide: What to Do Now
              <span className="text-[10px] bg-amber-200/90 font-bold px-2 py-0.5 rounded text-amber-900 uppercase">
                Easy Steps
              </span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Please follow these simple steps to ensure a smooth car rental release in Naga City:
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white/90 p-3 rounded-xl border border-amber-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <span className="font-extrabold text-amber-900 block text-xs mb-1">
                📸 Step 1: Save Slip
              </span>
              <p className="text-[11px] text-slate-600 leading-snug">
                Click <strong>"Save Screenshot"</strong> below so you have a copy saved to your phone photos!
              </p>
            </div>
          </div>

          <div className="bg-white/90 p-3 rounded-xl border border-amber-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <span className="font-extrabold text-amber-900 block text-xs mb-1">
                ⏱️ Step 2: Verification
              </span>
              <p className="text-[11px] text-slate-600 leading-snug">
                Our team verifies your reservation fee & IDs. Status updates automatically.
              </p>
            </div>
          </div>

          <div className="bg-white/90 p-3 rounded-xl border border-amber-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <span className="font-extrabold text-amber-900 block text-xs mb-1">
                💬 Step 3: Direct Chat
              </span>
              <p className="text-[11px] text-slate-600 leading-snug">
                When accepted, chat directly with dispatch on Messenger / WhatsApp for pickup instructions!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. THE OFFICIAL RESERVATION SLIP (Target of html2canvas Screenshot) */}
      <div
        id="booking-confirmation-slip"
        className="bg-gradient-to-br from-[#0c1836] via-[#0f2347] to-[#0a1226] text-white p-6 sm:p-7 rounded-3xl shadow-2xl border border-blue-500/30 text-left space-y-5 relative overflow-hidden"
      >
        {/* Decorative ambient glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header with Custoworks branding */}
        <div className="flex items-center justify-between border-b border-white/15 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpg"
              alt="Custoworks"
              className="w-11 h-11 rounded-xl object-contain bg-slate-900 border border-blue-400/50 p-0.5 shadow-md"
            />
            <div>
              <span className="font-black text-sm tracking-widest text-white uppercase block">
                CUSTOWORKS
              </span>
              <span className="text-[10px] text-blue-300 font-semibold tracking-wider uppercase block">
                Official Reservation Slip
              </span>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                isConfirmed
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
              }`}
            >
              {isConfirmed ? '✓ Confirmed & Accepted' : '⏳ Payment Verification'}
            </span>
          </div>
        </div>

        {/* Tracking Number Callout */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-blue-300 uppercase tracking-widest font-bold block">
              Booking Tracking Number
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-amber-300 block select-all">
              {reference}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyRef}
            className="text-xs bg-white/10 hover:bg-white/20 text-white font-bold px-3.5 py-2.5 rounded-xl border border-white/20 flex items-center justify-center gap-1.5 transition-all shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-blue-300" /> Copy Number
              </>
            )}
          </button>
        </div>

        {/* Reservation Key Details */}
        <div className="grid grid-cols-2 gap-3.5 text-xs relative z-10">
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Vehicle</span>
            <span className="font-extrabold text-white text-sm block mt-0.5">{vehicleName}</span>
          </div>

          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Rental Type</span>
            <span className="font-extrabold text-white text-sm block mt-0.5">
              {isSelfDrive ? 'Self Drive' : 'With Driver / Chauffeur'}
            </span>
          </div>

          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Destination</span>
            <span className="font-bold text-slate-200 block mt-0.5">{destinationName}</span>
          </div>

          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Reservation Fee</span>
            <span className="font-bold text-emerald-300 block mt-0.5">
              {typeof reservationFee === 'number' ? formatPeso(reservationFee) : reservationFee} (Received)
            </span>
          </div>

          {pickupAt && (
            <div className="bg-white/5 p-3 rounded-xl border border-white/5 col-span-2 sm:col-span-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Pick-up Schedule</span>
              <span className="font-semibold text-slate-200 block mt-0.5">{formatDate(pickupAt)}</span>
            </div>
          )}

          {returnAt && (
            <div className="bg-white/5 p-3 rounded-xl border border-white/5 col-span-2 sm:col-span-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Return Schedule</span>
              <span className="font-semibold text-slate-200 block mt-0.5">{formatDate(returnAt)}</span>
            </div>
          )}
        </div>

        {/* Custoworks Dispatch & Pickup Address */}
        <div className="bg-white/5 rounded-2xl p-4 text-[11px] text-slate-300 border border-white/10 space-y-2 relative z-10">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">Custoworks Office Pickup Location:</span>
              <span>Carnation St. CBD II, Brgy. Triangulo (Beside SM City), Naga City</span>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-white/10">
            <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-slate-300">
              Hotlines: <strong className="text-white">0961 722 5326</strong> / <strong className="text-white">0995 382 7972</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 3. ONE-CLICK SCREENSHOT / SAVE AS IMAGE BUTTONS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={handleScreenshot}
            disabled={downloading}
            className="w-full sm:flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Camera className="w-5 h-5 text-amber-300" />
            {downloading ? 'Capturing High-Res Slip...' : downloadSuccess ? '✓ Saved to Photos / Gallery!' : '📸 Tap to Save to Phone Gallery / Photos'}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs py-3.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all"
            title="Print or Save as PDF"
          >
            <Printer className="w-4 h-4 text-slate-500" /> Print / PDF
          </button>
        </div>

        <p className="text-[11px] text-slate-500 text-center">
          📱 <strong>Phone user tip:</strong> Tapping <strong>"Tap to Save to Phone Gallery"</strong> will prompt your phone to save directly to your <strong>Photos / Gallery</strong> (select <em>"Save Image"</em> or <em>"Save to Photos"</em>). You can also press <kbd className="bg-slate-100 px-1 py-0.5 rounded border border-slate-300 text-[10px]">Power</kbd> + <kbd className="bg-slate-100 px-1 py-0.5 rounded border border-slate-300 text-[10px]">Volume Down</kbd> to screenshot.
        </p>
      </div>

      {/* 4. CHAT PAGE / AUTOMATIC MESSAGING CONNECT (ANSWERING USER REQUEST) */}
      <div
        className={`p-5 rounded-2xl border shadow-sm text-left transition-all ${
          isConfirmed
            ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/60 border-emerald-300 ring-2 ring-emerald-500/30'
            : 'bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50/60 border-blue-200'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
              isConfirmed
                ? 'bg-emerald-600 text-white animate-pulse'
                : 'bg-brand-blue text-white'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-black text-slate-900 text-base">
                {isConfirmed ? '🎉 Reservation Accepted! Chat With Us Now' : '💬 Need Help? Chat with Naga Dispatch'}
              </h4>
              {isConfirmed && (
                <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-full uppercase">
                  Ready
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {isConfirmed
                ? 'Your vehicle has been locked and confirmed by our dispatch team! Tap below to open a direct chat on Facebook Messenger or WhatsApp to coordinate your pickup time, send flight details, or request gate handover.'
                : 'Have questions about your booking requirements or receipt? Connect directly with our Naga City dispatch staff. Your tracking number is pre-filled automatically!'}
            </p>
          </div>
        </div>

        {/* Direct 1-Click Chat Action Buttons */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Messenger */}
          <a
            href={messengerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#0084FF] hover:bg-[#0073e6] text-white font-bold text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
          >
            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.512 3.734 7.207V22l3.398-1.865c.91.252 1.874.388 2.868.388 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.066 12.443l-2.556-2.727-4.992 2.727 5.492-5.83 2.62 2.727 4.928-2.727-5.492 5.83z"/>
            </svg>
            <span>Chat on Messenger</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>

          {/* WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02]"
          >
            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.586-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.303-.058.116-.087.188-.173.289l-.26.302c-.087.086-.177.18-.076.353.101.173.45 0.742.965 1.201.662.591 1.221.774 1.394.86.173.086.275.072.376-.044.101-.116.433-.506.549-.679.116-.173.231-.144.39-.086s1.011.477 1.184.564c.173.086.289.13.332.202.043.072.043.419-.101.824z"/>
            </svg>
            <span>Chat on WhatsApp</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>

          {/* Direct Call / SMS */}
          <a
            href="tel:09617225326"
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.02]"
          >
            <Phone className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Call 0961 722 5326</span>
          </a>
        </div>
      </div>

      {/* 4. LOCAL SPONSORS & RENTER PERKS BANNER PLACEMENT */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-blue-500/30 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-xs">
              🎁
            </span>
            <div>
              <h4 className="font-extrabold text-sm text-white">Direct Sponsor Renter Perks</h4>
              <p className="text-[11px] text-slate-300">Show this reservation slip to unlock partner discounts in Naga & Bicol</p>
            </div>
          </div>
          <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
            Partner Perks
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs mt-3">
          <a
            href="https://www.facebook.com/profile.php?id=61586727264046"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-500/15 hover:bg-blue-500/25 border border-cyan-400/40 rounded-xl p-3 flex items-center justify-between gap-2 transition-all group"
          >
            <div>
              <div className="font-bold text-cyan-300 text-[11px] flex items-center gap-1.5">
                <span>🧼 Custoworks Carwash & Detailing</span>
                <span className="text-[9px] bg-blue-600 text-white font-black px-1.5 py-0.2 rounded">Active Partner</span>
              </div>
              <div className="text-[11px] text-slate-200 mt-1">
                Carnation St. beside SM Naga. Return unit clean for 100% deposit refund!
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-cyan-300 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </a>

          <a
            href="/#sponsors"
            className="bg-white/5 hover:bg-white/10 border-2 border-dashed border-amber-400/40 rounded-xl p-3 flex items-center justify-between gap-2 transition-all group"
          >
            <div>
              <div className="font-bold text-amber-300 text-[11px] flex items-center gap-1.5">
                <span>🏨 + Add Your Hotel / Shop Slot Here</span>
                <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded">Open Slot</span>
              </div>
              <div className="text-[11px] text-slate-300 mt-1">
                Feature your business to confirmed car renters! ₱3,000/mo or 14-day free trial.
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-amber-300 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Local business owner?</span>
          <a
            href="/#sponsors"
            className="text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 transition-colors"
          >
            <span>Inquire for Direct Sponsor Banner Placement</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
