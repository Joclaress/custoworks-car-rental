import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Car,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  RefreshCw,
  ArrowRight,
  FileText,
  KeyRound,
  Send,
} from 'lucide-react';
import { format, addDays, subDays, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns';
import { api } from '../../lib/api';
import { formatPeso, formatDate } from '../../lib/utils';

interface AdminDailyDispatchScheduleProps {
  onOpenBookingModal: (booking: any) => void;
  onOpenReleaseModal: (booking: any) => void;
  onRefreshParent?: () => void;
}

export const AdminDailyDispatchSchedule: React.FC<AdminDailyDispatchScheduleProps> = ({
  onOpenBookingModal,
  onOpenReleaseModal,
  onRefreshParent,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
  const [activeTab, setActiveTab] = useState<'RELEASES' | 'RETURNS' | 'ONGOING'>('RELEASES');
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<{
    date: string;
    releases: any[];
    returns: any[];
    ongoing: any[];
    stats: { totalReleases: number; totalReturns: number; totalOngoing: number };
  } | null>(null);

  const fetchSchedule = async (dateStr: string) => {
    try {
      setLoading(true);
      const res = await api.get<any>(`/bookings/admin/dispatch-schedule?date=${dateStr}`);
      setData(res);
    } catch (err) {
      console.error('Failed to load dispatch schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule(selectedDate);
  }, [selectedDate]);

  const parsedDate = parseISO(selectedDate);

  const getDateHeaderLabel = () => {
    if (isToday(parsedDate)) return 'Today';
    if (isTomorrow(parsedDate)) return 'Tomorrow';
    if (isYesterday(parsedDate)) return 'Yesterday';
    return format(parsedDate, 'EEEE');
  };

  const handlePrevDay = () => {
    const prev = subDays(parsedDate, 1);
    setSelectedDate(format(prev, 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    const next = addDays(parsedDate, 1);
    setSelectedDate(format(next, 'yyyy-MM-dd'));
  };

  const handleToday = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const cleanPhone = (phone?: string) => {
    if (!phone) return '';
    return phone.replace(/[^0-9+]/g, '');
  };

  const formatTimeOnly = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'hh:mm a');
    } catch {
      return dateStr;
    }
  };

  const releases = data?.releases || [];
  const returns = data?.returns || [];
  const ongoing = data?.ongoing || [];

  return (
    <div className="bg-slate-900/95 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
      {/* HEADER & DATE CONTROLS */}
      <div className="p-5 sm:p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/60">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-inner">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-400 bg-blue-950/80 px-2.5 py-0.5 rounded-full border border-blue-800/80">
                Live Operations Schedule
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline">•</span>
              <span className="text-xs font-semibold text-emerald-400 hidden sm:inline">
                Garage Beside SM Naga City
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white mt-0.5 tracking-tight flex items-center gap-2">
              Daily Vehicle Release & Dispatch Schedule
            </h2>
          </div>
        </div>

        {/* DATE SELECTOR BAR */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Date Shortcuts */}
          <div className="flex items-center bg-slate-800/90 rounded-xl p-1 border border-slate-700/80 text-xs font-bold text-slate-300">
            <button
              onClick={() => setSelectedDate(format(subDays(new Date(), 1), 'yyyy-MM-dd'))}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                isYesterday(parsedDate) ? 'bg-blue-600 text-white shadow-sm' : 'hover:text-white'
              }`}
            >
              Yesterday
            </button>
            <button
              onClick={handleToday}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                isToday(parsedDate) ? 'bg-blue-600 text-white shadow-sm' : 'hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'))}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                isTomorrow(parsedDate) ? 'bg-blue-600 text-white shadow-sm' : 'hover:text-white'
              }`}
            >
              Tomorrow
            </button>
          </div>

          {/* Stepper with Native Date Picker */}
          <div className="flex items-center bg-slate-800/90 rounded-xl border border-slate-700/80 overflow-hidden shadow-sm">
            <button
              onClick={handlePrevDay}
              title="Previous Day"
              className="p-2 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="relative px-3 py-1.5 flex items-center gap-2 text-xs font-black text-white">
              <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>
                {getDateHeaderLabel()} • {format(parsedDate, 'MMM d, yyyy')}
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>

            <button
              onClick={handleNextDay}
              title="Next Day"
              className="p-2 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => {
              fetchSchedule(selectedDate);
              onRefreshParent?.();
            }}
            disabled={loading}
            className="p-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl border border-slate-700/80 transition-colors shadow-sm disabled:opacity-50"
            title="Refresh Schedule"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* FILTER TABS & COUNTS */}
      <div className="px-5 sm:px-6 pt-4 pb-2 border-b border-slate-800/80 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('RELEASES')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'RELEASES'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Vehicles Scheduled for Release</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                activeTab === 'RELEASES' ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {releases.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('RETURNS')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'RETURNS'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Vehicles Expected for Return</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                activeTab === 'RETURNS' ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {returns.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ONGOING')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'ONGOING'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Currently on the Road (Active)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                activeTab === 'ONGOING' ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {ongoing.length}
            </span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-medium">
          Showing dispatches for <strong className="text-white">{format(parsedDate, 'MMMM d, yyyy')}</strong>
        </span>
      </div>

      {/* BODY CONTENT */}
      <div className="p-5 sm:p-6">
        {loading ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-400" />
            <p className="text-sm font-semibold">Loading daily vehicle dispatch schedule...</p>
          </div>
        ) : activeTab === 'RELEASES' ? (
          releases.length === 0 ? (
            <div className="py-14 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-8 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Car className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">No Vehicle Releases Scheduled</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                There are no vehicle dispatches scheduled for {format(parsedDate, 'MMMM d, yyyy')}. Customers
                can book online anytime and once you confirm their booking, it will appear right here.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleNextDay}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline"
                >
                  Check next day ({format(addDays(parsedDate, 1), 'MMM d')}) →
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {releases.map((b) => {
                const fin = b.financials || {};
                const balanceDue = Number(fin.balanceDue ?? b.totalAmount);
                const isConfirmed = b.status === 'CONFIRMED';
                const isReleased = b.status === 'ONGOING';
                const phone = cleanPhone(b.customerPhone);

                return (
                  <div
                    key={b.id}
                    className="bg-slate-850/90 hover:bg-slate-850 border border-slate-700/80 rounded-2xl p-5 transition-all shadow-lg hover:border-blue-500/50 flex flex-col lg:flex-row lg:items-center justify-between gap-5 group"
                  >
                    {/* LEFT SECTION: TIME & VEHICLE DETAILS */}
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Scheduled Pickup Time Badge */}
                      <div className="shrink-0 flex sm:flex-col items-center justify-center bg-blue-600/20 border border-blue-500/40 rounded-2xl px-4 py-3 text-center min-w-[110px]">
                        <Clock className="w-4 h-4 text-blue-400 sm:mb-1 mr-2 sm:mr-0" />
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-300 block">
                          Release Time
                        </span>
                        <span className="text-lg font-black text-white font-mono block">
                          {formatTimeOnly(b.pickupAt)}
                        </span>
                      </div>

                      {/* Customer Full Name & Vehicle Meta */}
                      <div className="space-y-2">
                        {/* Customer Header */}
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-black text-white tracking-tight">
                              {b.customerName}
                            </span>
                            <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/80">
                              {b.reference}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                                isReleased
                                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                  : isConfirmed
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              {isReleased
                                ? 'Released (On Road)'
                                : isConfirmed
                                ? 'Confirmed • Ready for Release'
                                : b.status.replace(/_/g, ' ')}
                            </span>
                          </div>

                          {/* Contact Shortcuts */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1">
                            {b.customerPhone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-semibold">{b.customerPhone}</span>
                                <a
                                  href={`tel:${phone}`}
                                  className="text-[11px] text-blue-400 hover:underline font-bold ml-1 bg-slate-800 px-1.5 py-0.5 rounded"
                                >
                                  Call
                                </a>
                                <a
                                  href={`https://wa.me/${phone.replace(/^\+/, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-emerald-400 hover:underline font-bold ml-0.5 bg-slate-800 px-1.5 py-0.5 rounded"
                                >
                                  WhatsApp
                                </a>
                              </div>
                            )}
                            {b.customerEmail && (
                              <div className="flex items-center gap-1.5 text-slate-400">
                                <Mail className="w-3.5 h-3.5" />
                                <span className="truncate max-w-[200px]">{b.customerEmail}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Vehicle Unit & Trip Info */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {/* Plate Number in PH style badge */}
                          <span className="font-mono font-black text-xs bg-amber-400 text-slate-950 px-2 py-0.5 rounded border border-amber-500 shadow-sm">
                            {b.vehicle?.plateNumber || 'TBA'}
                          </span>
                          <span className="font-extrabold text-sm text-slate-200">
                            {b.vehicle?.name}
                          </span>
                          <span className="text-slate-400 text-xs">•</span>
                          <span className="text-xs font-semibold text-slate-300">
                            {b.rentalType === 'WITH_DRIVER' ? 'Chauffeur / With Driver' : 'Self-Drive (LTMS)'}
                          </span>
                          <span className="text-slate-400 text-xs">•</span>
                          <span className="text-xs text-blue-300 font-bold flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-blue-400" />
                            {b.destination?.name || 'Local'}
                          </span>
                        </div>

                        {/* Handover Location */}
                        <div className="text-[11px] text-slate-400">
                          {b.pickupMethod === 'DELIVERY' ? (
                            <span className="text-amber-300 font-semibold">
                              📍 Delivery Handover: {b.deliveryAddress || 'Address specified in booking'}
                            </span>
                          ) : (
                            <span>
                              📍 Handover at Garage: <strong>Carnation St. CBD II (Beside SM Naga)</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT SECTION: FINANCIALS & ACTION BUTTONS */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-700/60">
                      {/* Balance to Collect Highlight */}
                      <div className="text-left lg:text-right">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">
                          Rental Balance Due on Release
                        </span>
                        <div className="flex items-baseline gap-2 justify-start lg:justify-end mt-0.5">
                          <span
                            className={`text-xl font-black ${
                              balanceDue > 0 ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            {balanceDue > 0 ? formatPeso(balanceDue) : 'Fully Paid'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            (Total: {formatPeso(fin.totalAmount ?? b.totalAmount)})
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          ₱1,000 reservation fee serves as refundable deposit upon return
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        {isConfirmed && (
                          <button
                            onClick={() => onOpenReleaseModal(b)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-1.5 w-full sm:w-auto justify-center"
                          >
                            <KeyRound className="w-4 h-4" />
                            Release Vehicle (Handover)
                          </button>
                        )}

                        {isReleased && (
                          <div className="flex items-center gap-1.5 px-3 py-2 bg-blue-950/80 border border-blue-800 text-blue-300 rounded-xl text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4 text-blue-400" />
                            Vehicle Released & Dispatched
                          </div>
                        )}

                        <button
                          onClick={() => onOpenBookingModal(b)}
                          className="bg-slate-750 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs px-3 py-2 rounded-xl border border-slate-600 transition-colors flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : activeTab === 'RETURNS' ? (
          returns.length === 0 ? (
            <div className="py-14 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-8 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">No Returns Scheduled for This Day</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No vehicles are expected back at the garage on {format(parsedDate, 'MMMM d, yyyy')}.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {returns.map((b) => (
                <div
                  key={b.id}
                  className="bg-slate-850/90 hover:bg-slate-850 border border-slate-700/80 rounded-2xl p-5 transition-all shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 bg-emerald-600/20 border border-emerald-500/40 rounded-2xl px-4 py-3 text-center min-w-[110px]">
                      <Clock className="w-4 h-4 text-emerald-400 mb-1 mx-auto" />
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-300 block">
                        Return Time
                      </span>
                      <span className="text-lg font-black text-white font-mono block">
                        {formatTimeOnly(b.returnAt)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-white">{b.customerName}</span>
                        <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/80">
                          {b.reference}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <span className="font-mono font-bold bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded text-[11px]">
                          {b.vehicle?.plateNumber || 'TBA'}
                        </span>
                        <span className="font-bold text-white">{b.vehicle?.name}</span>
                        <span className="text-slate-400">•</span>
                        <span>{b.customerPhone}</span>
                      </div>
                      <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                        Return vehicle inspection & ₱1,000 security deposit refund due upon garage handover.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onOpenBookingModal(b)}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Complete Return & Refund Deposit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          ongoing.length === 0 ? (
            <div className="py-14 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-8 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Car className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">No Other Active Vehicles On the Road</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                All other vehicles are currently in the garage ready for future bookings.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {ongoing.map((b) => (
                <div
                  key={b.id}
                  className="bg-slate-850/90 border border-slate-700/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-white">{b.customerName}</span>
                      <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/80">
                        {b.reference}
                      </span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Active Rental
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="font-mono font-bold bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded text-[11px]">
                        {b.vehicle?.plateNumber || 'TBA'}
                      </span>
                      <span className="font-bold text-white">{b.vehicle?.name}</span>
                      <span className="text-slate-400">•</span>
                      <span>Scheduled return: {formatDate(b.returnAt)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenBookingModal(b)}
                    className="bg-slate-750 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl border border-slate-600 transition-colors"
                  >
                    View Trip Details
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};
