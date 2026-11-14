import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Booking, BookingRequirement } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { formatPeso, formatDate } from '../lib/utils';
import { MapRouteAdsCarousel } from '../components/MapRouteAdsCarousel';
import {
  Search,
  Car,
  Calendar,
  MapPin,
  Clock,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  PhoneCall,
  RotateCcw,
  XCircle,
  FileText,
  ShieldCheck,
  CreditCard,
  ReceiptText as Receipt,
  Copy,
  Info,
  Check,
  Camera,
  Image as ImageIcon,
  MessageCircle,
  ExternalLink,
  Printer,
  Sparkles,
} from 'lucide-react';
import { ReservationConfirmationCard } from '../components/ReservationConfirmationCard';
import { downloadElementAsImage, saveFileToGallery } from '../lib/screenshot';

export const TrackBookingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRef = searchParams.get('ref') || '';

  const [referenceInput, setReferenceInput] = useState(initialRef);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [financials, setFinancials] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Upload Requirement Modal / State
  const [uploadingReqId, setUploadingReqId] = useState<string | null>(null);
  const [selectedReqFile, setSelectedReqFile] = useState<File | null>(null);
  const [selectedReqPreview, setSelectedReqPreview] = useState<string | null>(null);
  const [uploadSubmitting, setUploadSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Re-upload Payment Modal / State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState('');
  const [paymentRefNumber, setPaymentRefNumber] = useState('');
  const [paymentReceiptFile, setPaymentReceiptFile] = useState<File | null>(null);
  const [paymentReceiptPreview, setPaymentReceiptPreview] = useState<string | null>(null);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Request Modal State (Reschedule / Cancellation)
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestType, setRequestType] = useState<'RESCHEDULE' | 'CANCELLATION'>('RESCHEDULE');
  const [requestReason, setRequestReason] = useState('');
  const [reqPickup, setReqPickup] = useState('');
  const [reqReturn, setReqReturn] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  // Official Slip View & Screenshot State
  const [showSlip, setShowSlip] = useState(false);
  const [slipDownloading, setSlipDownloading] = useState(false);
  const [slipSaved, setSlipSaved] = useState(false);

  const handleSearch = async (ref: string) => {
    const cleanRef = ref.trim().toUpperCase();
    if (!cleanRef) {
      setError('Please enter a booking tracking number (e.g. CW-261103-XXXXX)');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.get<{ booking: Booking; financials: any }>(`/bookings/track/${cleanRef}`);
      setBooking(res.booking);
      setFinancials(res.financials);
      setSearchParams({ ref: cleanRef });
    } catch (err: any) {
      setBooking(null);
      setFinancials(null);
      setError(err.message || 'No booking found with this tracking number. Please verify and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialRef) {
      handleSearch(initialRef);
    }
  }, []);

  const handleUploadRequirement = async (requirementId: string, customFile?: File) => {
    const fileToUpload = customFile || selectedReqFile;
    if (!fileToUpload || !booking) return;
    setUploadError(null);
    setUploadSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);
      await api.post(`/requirements/booking/${booking.id}/upload/${requirementId}`, formData);
      // Refresh booking data
      const res = await api.get<{ booking: Booking; financials: any }>(`/bookings/track/${booking.reference}`);
      setBooking(res.booking);
      setFinancials(res.financials);
      setUploadingReqId(null);
      setSelectedReqFile(null);
      setSelectedReqPreview(null);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload document');
    } finally {
      setUploadSubmitting(false);
    }
  };

  const handleOpenPaymentModal = async () => {
    try {
      const res = await api.get<{ methods: any[] }>('/payments/methods');
      setPaymentMethods(res.methods);
      if (res.methods.length > 0) setSelectedPaymentMethodId(res.methods[0].id);
      setShowPaymentModal(true);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || !selectedPaymentMethodId || !paymentRefNumber || !paymentReceiptFile) {
      setPaymentError('Please fill in reference number and select a receipt image');
      return;
    }
    setPaymentError(null);
    setPaymentSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('paymentMethodId', selectedPaymentMethodId);
      formData.append('referenceNumber', paymentRefNumber);
      formData.append('file', paymentReceiptFile);
      await api.post(`/payments/reservation/${booking.id}`, formData);
      // Refresh
      const res = await api.get<{ booking: Booking; financials: any }>(`/bookings/track/${booking.reference}`);
      setBooking(res.booking);
      setFinancials(res.financials);
      setShowPaymentModal(false);
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to submit payment receipt');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleSubmitCustomerRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || !requestReason) return;
    setRequestSubmitting(true);
    try {
      await api.post(`/bookings/track/${booking.reference}/request`, {
        type: requestType,
        reason: requestReason,
        requestedPickupAt: reqPickup ? new Date(reqPickup).toISOString() : null,
        requestedReturnAt: reqReturn ? new Date(reqReturn).toISOString() : null,
      });
      setRequestSuccess(`Your ${requestType.toLowerCase()} request has been sent to the Custoworks admin team.`);
      setTimeout(() => {
        setShowRequestModal(false);
        setRequestSuccess(null);
      }, 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit request');
    } finally {
      setRequestSubmitting(false);
    }
  };

  const handleDownloadAgreement = () => {
    if (!booking) return;
    window.open(api.getFileUrl(`/bookings/track/${booking.reference}/agreement`), '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Search Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-brand-blue text-xs font-bold px-3 py-1 rounded-full">
            <Search className="w-3.5 h-3.5" /> Self-Service Tracking Portal
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Track Your Reservation
          </h1>
          <p className="text-slate-600 text-sm max-w-xl mx-auto">
            Check your reservation status, review document approvals, upload payment receipts, and download your rental agreement using your official Tracking Number.
          </p>

          {/* Search Box */}
          <div className="max-w-xl mx-auto mt-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch(referenceInput);
              }}
              className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-300 shadow-sm focus-within:ring-2 focus-within:ring-brand-blue focus-within:border-transparent transition-all"
            >
              <div className="pl-3 text-slate-400">
                <Receipt className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={referenceInput}
                onChange={(e) => setReferenceInput(e.target.value)}
                placeholder="Enter Booking Tracking # (e.g. CW-261103-XXXXX)"
                className="w-full bg-transparent px-2 py-2 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none uppercase"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-brand-blue hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
              >
                {loading ? 'Searching...' : 'Track'}
              </button>
            </form>

            {error && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Local Partner & Travel Sponsor Ads Carousel */}
          <div className="max-w-4xl mx-auto mt-8">
            <MapRouteAdsCarousel />
          </div>
        </div>

        {/* When Booking is Found */}
        {booking && (
          <div className="space-y-6">
            {/* Top Status & Reference Banner */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Tracking Number</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(booking.reference);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                    >
                      <Copy className="w-3 h-3" /> {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-tight mt-0.5">
                    {booking.reference}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Booked by <strong>{booking.customerName}</strong> {booking.createdAt ? `on ${formatDate(booking.createdAt)}` : ''}
                  </p>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-1.5">
                  <span className="text-[11px] uppercase font-bold text-slate-400">Current Status</span>
                  <StatusBadge status={booking.status} />
                </div>
              </div>

              {/* Status Explanation Card */}
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                {booking.status === 'PENDING_PAYMENT' && (
                  <p>
                    ⏳ <strong>Awaiting Reservation Fee:</strong> Please upload your {formatPeso(booking.reservationFee || 1000)} reservation fee receipt below to lock your schedule.
                  </p>
                )}
                {booking.status === 'PAYMENT_VERIFICATION' && (
                  <p>
                    🔍 <strong>Payment Under Verification:</strong> Your payment receipt was uploaded and is currently being verified by the Custoworks Naga City team.
                  </p>
                )}
                {booking.status === 'PENDING_REQUIREMENTS' && (
                  <p>
                    📄 <strong>Action Required:</strong> Please upload all required driver documents below for admin review.
                  </p>
                )}
                {booking.status === 'REQUIREMENTS_REVIEW' && (
                  <p>
                    📋 <strong>Under Review:</strong> All requirements have been uploaded. The Custoworks admin team is verifying your credentials.
                  </p>
                )}
                {booking.status === 'CONFIRMED' && (
                  <p className="text-emerald-700 font-bold text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Reservation Confirmed & Accepted! Your vehicle is locked and ready for release.</span>
                  </p>
                )}
                {booking.status === 'ONGOING' && (
                  <p className="text-blue-700 font-semibold">
                    🚗 <strong>Vehicle Released / Active Rental:</strong> Have a safe journey! Contact our 24/7 hotlines at 0961 722 5326 / 0995 382 7972 if you need assistance.
                  </p>
                )}
                {booking.status === 'COMPLETED' && (
                  <p className="text-slate-700 font-semibold">
                    🏁 <strong>Rental Completed:</strong> Vehicle returned successfully. Thank you for choosing Custoworks Car Rental Naga City!
                  </p>
                )}
              </div>

              {/* AUTOMATIC CHAT / DISPATCH MESSAGING BAR (USER REQUEST) */}
              <div
                className={`mt-4 p-4 sm:p-5 rounded-2xl border transition-all ${
                  booking.status === 'CONFIRMED'
                    ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/70 border-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50/70 border-blue-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        booking.status === 'CONFIRMED'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                          : 'bg-brand-blue text-white shadow-md shadow-blue-600/30'
                      }`}
                    >
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        {booking.status === 'CONFIRMED'
                          ? '🎉 Reservation Accepted! Connect with Naga Dispatch'
                          : '💬 Have Questions? Chat with Naga Dispatch'}
                        {booking.status === 'CONFIRMED' && (
                          <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full uppercase">
                            Confirmed
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {booking.status === 'CONFIRMED'
                          ? 'Coordinate vehicle pickup, send flight arrival info, or request delivery via live chat.'
                          : 'Our staff in Naga City is ready to assist you. Tracking reference is included automatically.'}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <a
                      href="https://m.me/CustoWorkss"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#0084FF] hover:bg-[#0073e6] text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-transform hover:scale-105"
                    >
                      <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.512 3.734 7.207V22l3.398-1.865c.91.252 1.874.388 2.868.388 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.066 12.443l-2.556-2.727-4.992 2.727 5.492-5.83 2.62 2.727 4.928-2.727-5.492 5.83z"/>
                      </svg>
                      <span>Messenger</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>

                    <a
                      href={`https://wa.me/639617225326?text=${encodeURIComponent(
                        `Hi Custoworks! My booking reference is ${booking.reference} (${booking.vehicle.name}). Status: ${booking.status}. I'd like to coordinate pickup.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-transform hover:scale-105"
                    >
                      <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.586-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.303-.058.116-.087.188-.173.289l-.26.302c-.087.086-.177.18-.076.353.101.173.45 0.742.965 1.201.662.591 1.221.774 1.394.86.173.086.275.072.376-.044.101-.116.433-.506.549-.679.116-.173.231-.144.39-.086s1.011.477 1.184.564c.173.086.289.13.332.202.043.072.043.419-.101.824z"/>
                      </svg>
                      <span>WhatsApp</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>

                    <button
                      type="button"
                      onClick={() => setShowSlip(!showSlip)}
                      className="border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs px-3 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5 text-blue-600" />
                      <span>{showSlip ? 'Hide Slip' : '📸 View & Save Slip'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* COLLAPSIBLE OFFICIAL RESERVATION CONFIRMATION CARD & SCREENSHOT */}
              {showSlip && (
                <div className="mt-5 pt-5 border-t border-slate-200">
                  <ReservationConfirmationCard
                    reference={booking.reference}
                    vehicleName={booking.vehicle.name}
                    rentalType={booking.rentalType}
                    destinationName={booking.destination?.name}
                    pickupAt={booking.pickupAt}
                    returnAt={booking.returnAt}
                    status={booking.status}
                    reservationFee={booking.reservationFee || 1000}
                    customerName={booking.customerName}
                    customerPhone={booking.customerPhone}
                  />
                </div>
              )}
            </div>

            {/* Vehicle & Schedule Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Vehicle & Destination Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Car className="w-4 h-4 text-brand-blue" /> Reserved Vehicle
                </h3>

                {booking.vehicle.images?.[0] ? (
                  <img
                    src={booking.vehicle.images[0].url}
                    alt={booking.vehicle.name}
                    className="w-full h-36 object-cover rounded-xl border border-slate-200"
                  />
                ) : (
                  <div className="w-full h-36 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                    <Car className="w-12 h-12" />
                  </div>
                )}

                <div>
                  <h4 className="text-lg font-black text-slate-900">{booking.vehicle.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-slate-100 font-semibold text-slate-700 px-2.5 py-0.5 rounded">
                      {booking.vehicle.transmission}
                    </span>
                    <span className="text-xs bg-slate-100 font-semibold text-slate-700 px-2.5 py-0.5 rounded">
                      {booking.vehicle.seats} Seats
                    </span>
                    <span className="text-xs bg-blue-50 text-brand-blue font-bold px-2.5 py-0.5 rounded border border-blue-200">
                      {booking.rentalType === 'SELF_DRIVE' ? 'Self Drive' : 'With Driver'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Destination:</span>
                    <span className="font-bold text-slate-900">{booking.destination?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Handover:</span>
                    <span className="font-bold text-slate-900">
                      {booking.pickupMethod === 'OFFICE' ? 'Office Pickup (Naga City)' : 'Delivery'}
                    </span>
                  </div>
                  {booking.deliveryAddress && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Delivery Address:</span>
                      <span className="font-bold text-slate-900 text-right">{booking.deliveryAddress}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-blue" /> Rental Schedule
                </h3>

                <div className="space-y-4 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Pick-up Date & Time</span>
                    <span className="text-sm font-black text-slate-900">{formatDate(booking.pickupAt)}</span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Return Date & Time</span>
                    <span className="text-sm font-black text-slate-900">{formatDate(booking.returnAt)}</span>
                  </div>

                  <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl flex justify-between items-center text-brand-blue font-bold">
                    <span>Total Duration:</span>
                    <span>
                      {booking.rentalDays} Day(s) {booking.rentalHours ? `(${booking.rentalHours} hrs)` : ''}
                    </span>
                  </div>
                </div>

                {/* Reschedule Button */}
                {!['COMPLETED', 'CANCELLED', 'REJECTED'].includes(booking.status) && (
                  <button
                    onClick={() => {
                      setRequestType('RESCHEDULE');
                      setShowRequestModal(true);
                    }}
                    className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" /> Request Reschedule
                  </button>
                )}
              </div>

              {/* Financial Breakdown Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-brand-blue" /> Pricing & Payment
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rental Fee:</span>
                    <span className="font-bold text-slate-800">{formatPeso(booking.rentalFee)}</span>
                  </div>
                  {Number(booking.deliveryFee) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Delivery Fee:</span>
                      <span className="font-bold text-slate-800">{formatPeso(booking.deliveryFee)}</span>
                    </div>
                  )}
                  {Number(booking.carwashFee) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Carwash Fee:</span>
                      <span className="font-bold text-slate-800">{formatPeso(booking.carwashFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-slate-100 text-sm">
                    <span className="font-extrabold text-slate-900">Total Rental Amount:</span>
                    <span className="font-black text-brand-navy">{formatPeso(booking.totalAmount)}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-2 pt-2 border border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-semibold">{formatPeso(booking.reservationFee || 1000)} Reservation Fee:</span>
                      {booking.payments?.some((p) => p.status === 'APPROVED') ? (
                        <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : booking.payments?.some((p) => p.status === 'PENDING_VERIFICATION') ? (
                        <span className="text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                          Pending Verification
                        </span>
                      ) : (
                        <span className="text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded text-[11px]">
                          Not Paid
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-slate-700">
                      <span>Remaining Balance Due:</span>
                      <span className="font-extrabold text-slate-900">
                        {financials ? formatPeso(financials.balanceDue) : formatPeso(Number(booking.totalAmount))}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      * Remaining balance is collected upon vehicle pickup in Naga City.
                    </p>
                  </div>
                </div>

                {/* If payment proof missing or rejected, show upload button */}
                {!booking.payments?.some((p) => p.status === 'APPROVED') && (
                  <button
                    onClick={handleOpenPaymentModal}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Payment Proof
                  </button>
                )}
              </div>
            </div>

            {/* Rental Requirements Review Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-brand-blue" /> Rental Requirements Verification
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    For Self-Drive rentals, all 5 required documents must be uploaded and approved before vehicle release.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {booking.requirements?.map((req) => {
                  const isApproved = req.status === 'APPROVED';
                  const isSubmitted = req.status === 'SUBMITTED';
                  const isReupload = req.status === 'REUPLOAD_REQUESTED' || req.status === 'REJECTED';
                  const notSubmitted = req.status === 'NOT_SUBMITTED';

                  return (
                    <div
                      key={req.id}
                      className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs text-slate-900">{req.name}</h4>
                            {req.isRequired ? (
                              <span className="text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1 py-0.2 rounded">
                                REQUIRED
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1 py-0.2 rounded">
                                OPTIONAL
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{req.requirementType?.description}</p>
                        </div>

                        {/* Status Chip */}
                        <div>
                          {isApproved && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Approved
                            </span>
                          )}
                          {isSubmitted && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" /> Pending Review
                            </span>
                          )}
                          {isReupload && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                              <XCircle className="w-3 h-3" /> Re-upload Needed
                            </span>
                          )}
                          {notSubmitted && (
                            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                              req.isRequired ? 'text-rose-700 bg-rose-50 border border-rose-200' : 'text-slate-500 bg-slate-100'
                            }`}>
                              {req.isRequired ? 'Missing' : 'Optional · Not Uploaded'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Rejection Note */}
                      {req.rejectionReason && (
                        <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-700">
                          <strong>Admin Note:</strong> {req.rejectionReason}
                        </div>
                      )}

                      {/* Upload / Re-upload Action */}
                      {!isApproved && (
                        <div className="pt-1">
                          {uploadingReqId === req.id ? (
                            <div className="space-y-3 bg-white p-3.5 rounded-xl border border-blue-200">
                              {selectedReqFile ? (
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                  {selectedReqPreview ? (
                                    <img
                                      src={selectedReqPreview}
                                      alt="Preview"
                                      className="w-24 h-16 object-cover rounded-lg border border-slate-200 shadow-sm shrink-0"
                                    />
                                  ) : (
                                    <div className="w-24 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                                      <ImageIcon className="w-6 h-6" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0 text-left w-full sm:w-auto">
                                    <p className="text-xs font-bold text-slate-900 truncate">{selectedReqFile.name}</p>
                                    <p className="text-[11px] text-slate-500">
                                      {(selectedReqFile.size / 1024).toFixed(1)} KB • Ready to submit
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => saveFileToGallery(selectedReqFile, `${req.name}.jpg`)}
                                      className="mt-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                      title="Save photo copy to your phone's photo gallery"
                                    >
                                      <Download className="w-3 h-3" /> Save to Phone Gallery
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    {/* Tap to Picture */}
                                    <label className="cursor-pointer inline-flex items-center gap-1.5 bg-brand-blue hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all">
                                      <Camera className="w-3.5 h-3.5 text-blue-200" />
                                      <span>Tap to Take Picture</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        capture={req.name.toLowerCase().includes('selfie') ? 'user' : 'environment'}
                                        onChange={(e) => {
                                          if (e.target.files?.[0]) {
                                            const f = e.target.files[0];
                                            setSelectedReqFile(f);
                                            if (f.type.startsWith('image/')) {
                                              setSelectedReqPreview(URL.createObjectURL(f));
                                            }
                                            handleUploadRequirement(req.id, f);
                                          }
                                        }}
                                        className="hidden"
                                      />
                                    </label>

                                    {/* Upload Image from Files */}
                                    <label className="cursor-pointer inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-lg transition-all">
                                      <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                                      <span>Upload from Files</span>
                                      <input
                                        type="file"
                                        accept="image/*,application/pdf"
                                        onChange={(e) => {
                                          if (e.target.files?.[0]) {
                                            const f = e.target.files[0];
                                            setSelectedReqFile(f);
                                            if (f.type.startsWith('image/')) {
                                              setSelectedReqPreview(URL.createObjectURL(f));
                                            }
                                            handleUploadRequirement(req.id, f);
                                          }
                                        }}
                                        className="hidden"
                                      />
                                    </label>
                                  </div>
                                </div>
                              )}

                              {uploadError && <p className="text-[11px] text-rose-600 font-medium">{uploadError}</p>}

                              <div className="flex gap-2 pt-1 border-t border-slate-100">
                                <button
                                  type="button"
                                  disabled={!selectedReqFile || uploadSubmitting}
                                  onClick={() => handleUploadRequirement(req.id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-all"
                                >
                                  {uploadSubmitting ? 'Uploading...' : 'Confirm Upload'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUploadingReqId(null);
                                    setSelectedReqFile(null);
                                    setSelectedReqPreview(null);
                                    setUploadError(null);
                                  }}
                                  className="border border-slate-300 text-slate-600 text-xs px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setUploadingReqId(req.id);
                                setSelectedReqFile(null);
                                setSelectedReqPreview(null);
                                setUploadError(null);
                              }}
                              className="text-xs font-bold text-brand-blue hover:text-blue-700 flex items-center gap-1.5 transition-colors"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              {isSubmitted ? 'Replace Photo / Document' : isReupload ? 'Take New Photo / Replace' : 'Take Picture / Upload Document'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Official Rental Agreement & Help Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PDF Agreement */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
                <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-blue" /> Official Rental Agreement
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your electronic rental agreement terms and conditions. Generated officially by Custoworks Car Rental Naga City.
                </p>
                <button
                  onClick={handleDownloadAgreement}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4 text-blue-400" /> Download PDF Rental Agreement
                </button>
              </div>

              {/* Custoworks 24/7 Support */}
              <div className="bg-gradient-to-tr from-brand-navy to-brand-navy-light text-white rounded-2xl p-5 shadow-sm space-y-3">
                <h4 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-blue-400" /> Need Help with this Booking?
                </h4>
                <p className="text-xs text-blue-200 leading-relaxed">
                  Questions about your reservation schedule, payment, or requirements? Our dispatch team in Naga City is ready to assist.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <a
                    href="tel:09617225326"
                    className="bg-white text-slate-900 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-100 transition-colors shadow-md"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-brand-blue" /> 0961 722 5326 / 0995 382 7972
                  </a>
                  <a
                    href="https://www.facebook.com/search/top?q=Custoworks%20Car%20Rental%20Naga%20City"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-white/30 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    Message on Facebook
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Proof Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-base text-slate-900">
                  Upload Reservation Receipt ({formatPeso(booking?.reservationFee || 1000)})
                </h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Select Payment Method
                  </label>
                  <select
                    value={selectedPaymentMethodId}
                    onChange={(e) => setSelectedPaymentMethodId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                  >
                    {paymentMethods.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.accountNumber})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Method Details & QR */}
                {(() => {
                  const method = paymentMethods.find((m) => m.id === selectedPaymentMethodId);
                  if (!method) return null;
                  return (
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                      <div>
                        <span className="text-slate-400 uppercase font-bold text-[10px]">Payment Account</span>
                        <h4 className="font-extrabold text-sm text-slate-900">{method.name}</h4>
                        <p className="text-slate-600 mt-0.5">
                          Account Name: <strong>{method.accountName}</strong>
                        </p>
                        <p className="text-slate-600">
                          Account Number: <strong className="text-brand-navy font-mono text-sm">{method.accountNumber}</strong>
                        </p>
                      </div>

                      {method.instructions && (
                        <p className="text-slate-500 text-[11px] bg-white p-2.5 rounded-lg border border-slate-200">
                          {method.instructions}
                        </p>
                      )}

                      {method.qrImageUrl && (
                        <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
                          <img
                            src={method.qrImageUrl}
                            alt={`${method.name} QR Code`}
                            className="w-36 h-auto max-h-48 object-contain rounded-md border border-slate-200 shadow-sm shrink-0"
                          />
                          <div className="space-y-1 text-center sm:text-left">
                            <span className="inline-block bg-blue-100 text-brand-blue text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Scan to Pay
                            </span>
                            <p className="font-bold text-slate-800 text-xs">
                              Scan with {method.code === 'GCASH' ? 'GCash' : 'BDO / Bank'} App
                            </p>
                            <p className="text-slate-500 text-[11px]">
                              Send <strong>{formatPeso(booking?.reservationFee || 1000)}</strong> reservation fee, then upload the receipt screenshot below.
                            </p>
                            <a
                              href={method.qrImageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-brand-blue font-bold hover:underline"
                            >
                              Open QR full size ↗
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Reference / Transaction Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentRefNumber}
                    onChange={(e) => setPaymentRefNumber(e.target.value)}
                    placeholder="e.g. GCash Ref or Bank Ref"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Payment Receipt Proof ({formatPeso(booking?.reservationFee || 1000)} Reservation Fee) *
                  </label>
                  {paymentReceiptFile ? (
                    <div className="bg-slate-50 p-3 rounded-xl border border-blue-200 flex items-center gap-3">
                      {paymentReceiptPreview ? (
                        <img
                          src={paymentReceiptPreview}
                          alt="Receipt Preview"
                          className="w-20 h-14 object-cover rounded-lg border border-slate-200 shadow-sm shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-14 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-xs font-bold text-slate-900 truncate">{paymentReceiptFile.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentReceiptFile(null);
                              setPaymentReceiptPreview(null);
                            }}
                            className="text-[11px] text-rose-600 hover:underline"
                          >
                            Retake / Change
                          </button>
                          <button
                            type="button"
                            onClick={() => saveFileToGallery(paymentReceiptFile, 'Payment-Receipt.jpg')}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            title="Save copy to phone gallery"
                          >
                            <Download className="w-3 h-3" /> Save to Phone Gallery
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 bg-brand-blue hover:bg-blue-700 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-sm transition-all">
                        <Camera className="w-4 h-4 text-blue-200" />
                        <span>Tap to Picture Receipt</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setPaymentReceiptFile(e.target.files[0]);
                              setPaymentReceiptPreview(URL.createObjectURL(e.target.files[0]));
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      <label className="cursor-pointer inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl border border-slate-200 transition-all">
                        <ImageIcon className="w-4 h-4 text-slate-500" />
                        <span>Upload from Gallery</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setPaymentReceiptFile(e.target.files[0]);
                              if (e.target.files[0].type.startsWith('image/')) {
                                setPaymentReceiptPreview(URL.createObjectURL(e.target.files[0]));
                              }
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>

                {paymentError && <p className="text-rose-600">{paymentError}</p>}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="border border-slate-300 text-slate-600 font-bold px-4 py-2 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={paymentSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl"
                  >
                    {paymentSubmitting ? 'Submitting...' : 'Submit Receipt'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reschedule / Cancellation Request Modal */}
        {showRequestModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-base text-slate-900">
                  {requestType === 'RESCHEDULE' ? 'Request Schedule Change' : 'Request Cancellation'}
                </h3>
                <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {requestSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-2">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Request Submitted!
                  </p>
                  <p>{requestSuccess}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitCustomerRequest} className="space-y-4 text-xs">
                  {requestType === 'RESCHEDULE' && (
                    <>
                      <div>
                        <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Requested Pick-up Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          required
                          value={reqPickup}
                          onChange={(e) => setReqPickup(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Requested Return Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          required
                          value={reqReturn}
                          onChange={(e) => setReqReturn(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Reason for Request *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={requestReason}
                      onChange={(e) => setRequestReason(e.target.value)}
                      placeholder="Please explain why you need to reschedule or cancel..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                    />
                  </div>

                  <p className="text-[11px] text-slate-400">
                    * Rescheduling is subject to vehicle availability. Reservation fee policies apply.
                  </p>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowRequestModal(false)}
                      className="border border-slate-300 text-slate-600 font-bold px-4 py-2 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={requestSubmitting}
                      className="bg-brand-blue hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl"
                    >
                      {requestSubmitting ? 'Sending Request...' : 'Send Request'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
