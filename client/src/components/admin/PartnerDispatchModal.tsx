import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  ExternalLink,
  MessageSquare,
  Car,
  Percent,
  Calendar,
  MapPin,
  ShieldCheck,
  DollarSign,
} from 'lucide-react';

interface PartnerDispatchModalProps {
  booking: any;
  onClose: () => void;
}

export const PartnerDispatchModal: React.FC<PartnerDispatchModalProps> = ({ booking, onClose }) => {
  const [partnerSplitPct, setPartnerSplitPct] = useState<number>(80);
  const [customPayout, setCustomPayout] = useState<string>('');
  const [includeRouteDetails, setIncludeRouteDetails] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  if (!booking) return null;

  const totalAmount = parseFloat(booking.pricing?.totalAmount || booking.totalAmount || 0);
  const calculatedPartnerPayout = Math.round(totalAmount * (partnerSplitPct / 100));
  const partnerNetPayout = customPayout ? parseFloat(customPayout) || 0 : calculatedPartnerPayout;
  const custoFee = Math.max(0, totalAmount - partnerNetPayout);

  const pickupDate = booking.pickupAt ? new Date(booking.pickupAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }) : 'TBD';

  const returnDate = booking.returnAt ? new Date(booking.returnAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }) : 'TBD';

  const diffHours = booking.pickupAt && booking.returnAt
    ? Math.max(24, Math.round((new Date(booking.returnAt).getTime() - new Date(booking.pickupAt).getTime()) / 3600000))
    : 24;
  const days = Math.max(1, Math.ceil(diffHours / 24));

  const vehicleName = booking.vehicle?.name || 'Sedan / MPV / Van';
  const category = booking.vehicle?.category || 'SEDAN';
  const rentalTypeLabel = booking.rentalType === 'WITH_DRIVER'
    ? 'Chauffeur / With Driver'
    : 'Self-Drive (LTMS Verified)';
  const destination = booking.destination?.name || 'Naga City & Camarines Sur';
  const route = booking.deliveryAddress || 'SM City Naga Meetup';

  const generateDispatchText = () => {
    return [
      `🚗 **CUSTOWORKS DISPATCH ALERT (Tie-Up Partner Unit Needed)**`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📋 **Booking Ref**: #${booking.reference || 'N/A'}`,
      `🚘 **Unit Needed**: ${vehicleName} (${category})`,
      `⚙️ **Rental Mode**: ${rentalTypeLabel}`,
      `⏳ **Duration**: ${days} Day${days > 1 ? 's' : ''} (${diffHours} Hours)`,
      `📅 **Pickup**: ${pickupDate}`,
      `📅 **Return**: ${returnDate}`,
      includeRouteDetails ? `📍 **Route / Location**: ${route} (${destination})` : `📍 **Destination**: ${destination}`,
      ``,
      `💰 **FINANCIAL BREAKDOWN**:`,
      `• Total Customer Rental: ₱${totalAmount.toLocaleString()}`,
      `• 💵 **80% Partner Net Payout: ₱${partnerNetPayout.toLocaleString()}**`,
      `• Custoworks Management Fee (20%): ₱${custoFee.toLocaleString()}`,
      `• ₱1,000 Reservation Fee: Already Collected by Custoworks ✅`,
      ``,
      `🔒 **Security & Verification**:`,
      `• Customer ID & LTMS Driver's License: VERIFIED by Custoworks`,
      `• GPS Tracking Active: Required`,
      `• Official Contract & Rental Agreement prepared upon release`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `👉 **To claim this trip, reply "MINE" with your Plate # and unit color.**`,
      `📞 Dispatch: 0961 722 5326 / 0995 382 7972 (Custoworks Naga City)`,
    ].join('\n');
  };

  const dispatchText = generateDispatchText();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(dispatchText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy dispatch text:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 text-white rounded-3xl max-w-xl w-full p-6 space-y-4 border border-slate-800 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-lg">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                Dispatch to Partner Group Chat
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  80/20 Tie-Up
                </span>
              </h3>
              <p className="text-slate-400 text-xs">
                Copy ready-to-paste alert for Facebook Messenger & Viber Fleet GCs
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Config Controls */}
        <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-blue-400" />
              Partner Commission Split:
            </span>
            <div className="flex items-center gap-1.5">
              {[80, 85, 75].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => {
                    setPartnerSplitPct(pct);
                    setCustomPayout('');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    partnerSplitPct === pct && !customPayout
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/40">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Partner Net Payout</span>
              <span className="text-sm font-black text-emerald-400 block mt-0.5">
                ₱{partnerNetPayout.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-500">Paid upon turnover/completion</span>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/40">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Custoworks Fee (20%)</span>
              <span className="text-sm font-black text-blue-400 block mt-0.5">
                ₱{custoFee.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-500">Platform marketing & LTMS check</span>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={includeRouteDetails}
              onChange={(e) => setIncludeRouteDetails(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
            />
            <span>Include pickup address / delivery route details</span>
          </label>
        </div>

        {/* Live Message Preview */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Message Preview (Formatted for Messenger/Viber):
            </span>
            <span className="text-[11px] font-mono text-slate-500">Ref #{booking.reference}</span>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 font-mono text-[11px] text-slate-200 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto select-all">
            {dispatchText}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={handleCopy}
            className={`flex-1 font-extrabold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:shadow-emerald-500/20'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied to Clipboard! Ready to Paste
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                📋 Copy Dispatch for Group Chat
              </>
            )}
          </button>

          <a
            href="https://www.messenger.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            title="Open Facebook Messenger in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Messenger
          </a>

          <button
            type="button"
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 px-4 rounded-xl text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
