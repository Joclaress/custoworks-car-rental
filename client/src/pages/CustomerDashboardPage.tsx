import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Booking, BookingRequirement } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { formatPeso, formatDate } from '../lib/utils';
import {
  Calendar,
  Car,
  FileCheck2,
  Clock,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  PhoneCall,
  RotateCcw,
  XCircle,
  FileText,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  ReceiptText as Receipt,
} from 'lucide-react';

export const CustomerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals & Forms
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [targetRequirement, setTargetRequirement] = useState<BookingRequirement | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Reschedule / Cancellation Request Modal
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestType, setRequestType] = useState<'RESCHEDULE' | 'CANCELLATION'>('RESCHEDULE');
  const [requestReason, setRequestReason] = useState('');
  const [reqPickup, setReqPickup] = useState('');
  const [reqReturn, setReqReturn] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Missing Payment Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentRefNumber, setPaymentRefNumber] = useState('');
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  const fetchBookings = async () => {
    try {
      const q = statusFilter === 'ALL' ? '' : `?status=${statusFilter}`;
      const res = await api.get<{ bookings: Booking[] }>(`/bookings/my${q}`);
      setBookings(res.bookings);
      if (res.bookings.length > 0 && !selectedBooking) {
        // Load first booking full detail
        loadBookingDetail(res.bookings[0].id);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBookingDetail = async (id: string) => {
    try {
      const res = await api.get<{ booking: Booking }>(`/bookings/${id}`);
      setSelectedBooking(res.booking);
    } catch (err) {
      console.error('Failed to load booking details:', err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  useEffect(() => {
    api
      .get<{ methods: any[] }>('/payments/methods')
      .then((res) => {
        setPaymentMethods(res.methods);
        if (res.methods.length > 0) setPaymentMethodId(res.methods[0].id);
      })
      .catch((err) => console.error(err));
  }, []);

  // Upload Requirement File
  const handleRequirementUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !targetRequirement || !selectedBooking) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      await api.post(`/requirements/booking/${selectedBooking.id}/upload/${targetRequirement.id}`, formData);
      setUploadModalOpen(false);
      setUploadFile(null);
      await loadBookingDetail(selectedBooking.id);
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Submit Reschedule or Cancellation Request
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setSubmittingRequest(true);
    try {
      await api.post(`/bookings/${selectedBooking.id}/request`, {
        type: requestType,
        reason: requestReason,
        requestedPickupAt: requestType === 'RESCHEDULE' ? new Date(reqPickup).toISOString() : undefined,
        requestedReturnAt: requestType === 'RESCHEDULE' ? new Date(reqReturn).toISOString() : undefined,
      });
      setRequestModalOpen(false);
      setRequestReason('');
      await loadBookingDetail(selectedBooking.id);
      alert('Your request has been submitted to Custoworks team for approval.');
    } catch (err: any) {
      alert(err.message || 'Request failed');
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Download PDF Rental Agreement
  const handleDownloadAgreement = async () => {
    if (!selectedBooking) return;
    try {
      const blob = await api.get<Blob>(`/bookings/${selectedBooking.id}/agreement`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rental-agreement-${selectedBooking.reference}.pdf`;
      a.click();
    } catch (err: any) {
      alert(err.message || 'Failed to download agreement');
    }
  };

  // Download Payment Receipt
  const handleDownloadReceipt = async (paymentId: string, receiptNumber: string) => {
    try {
      const blob = await api.get<Blob>(`/payments/${paymentId}/receipt`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${receiptNumber}.pdf`;
      a.click();
    } catch (err: any) {
      alert(err.message || 'Failed to download receipt');
    }
  };

  // Upload Payment Proof
  const handleUploadPaymentProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !paymentFile || !paymentRefNumber || !paymentMethodId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('paymentMethodId', paymentMethodId);
      formData.append('referenceNumber', paymentRefNumber);
      formData.append('file', paymentFile);
      await api.post(`/payments/reservation/${selectedBooking.id}`, formData);
      setPaymentModalOpen(false);
      setPaymentFile(null);
      setPaymentRefNumber('');
      await loadBookingDetail(selectedBooking.id);
      alert('Payment receipt uploaded successfully! Awaiting admin verification.');
    } catch (err: any) {
      alert(err.message || 'Payment upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Profile Greeting */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">Customer Portal</span>
            <h1 className="text-2xl font-black text-slate-900 mt-0.5">Welcome, {user?.fullName}!</h1>
            <p className="text-xs text-slate-500 mt-1">Manage your active car rentals, track payments, and download rental agreements.</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="tel:09617225326"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-brand-blue" /> Hotline: 0961 722 5326 / 0995 382 7972
            </a>
            <a
              href="/vehicles"
              className="inline-flex items-center gap-2 text-xs font-bold bg-brand-blue hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl shadow-md transition-all"
            >
              <Car className="w-3.5 h-3.5" /> Book Another Car
            </a>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 text-xs font-bold">
          {['ALL', 'PENDING_PAYMENT', 'PAYMENT_VERIFICATION', 'CONFIRMED', 'ONGOING', 'COMPLETED', 'CANCELLED'].map(
            (s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-xl transition-all shrink-0 ${
                  statusFilter === s
                    ? 'bg-brand-navy text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {s.replace(/_/g, ' ')}
              </button>
            )
          )}
        </div>

        {/* Main Content: Left List + Right Detailed View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Bookings List */}
          <div className="lg:col-span-5 space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs text-slate-500">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700">No bookings found</p>
                <p className="mt-1">You don't have any reservations under this category.</p>
              </div>
            ) : (
              bookings.map((b) => {
                const isSelected = selectedBooking?.id === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => loadBookingDetail(b.id)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-brand-blue bg-white shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {b.reference}
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-900">{b.vehicle?.name}</h4>
                      </div>
                      <StatusBadge status={b.status} />
                    </div>

                    <div className="mt-3 text-xs text-slate-600 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-brand-blue" />
                        <span>{formatDate(b.pickupAt, false)} → {formatDate(b.returnAt, false)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[11px]">
                        <span className="font-semibold text-slate-500">Total: {formatPeso(b.totalAmount)}</span>
                        <span className="text-brand-blue font-bold flex items-center gap-0.5">
                          View Details <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Selected Booking Detailed Inspector */}
          <div className="lg:col-span-7">
            {selectedBooking ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
                {/* Detail Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand-blue bg-blue-50 px-2 py-0.5 rounded">
                        {selectedBooking.reference}
                      </span>
                      <StatusBadge status={selectedBooking.status} />
                    </div>
                    <h3 className="font-extrabold text-lg text-slate-900 mt-1">
                      {selectedBooking.vehicle?.name}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {/* Action Buttons based on status */}
                    {selectedBooking.status === 'PENDING_PAYMENT' && (
                      <button
                        onClick={() => setPaymentModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Upload Payment Proof
                      </button>
                    )}

                    {['CONFIRMED', 'REQUIREMENTS_REVIEW', 'ONGOING'].includes(selectedBooking.status) && (
                      <button
                        onClick={handleDownloadAgreement}
                        className="bg-brand-navy hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow"
                      >
                        <Download className="w-3.5 h-3.5" /> Rental Agreement
                      </button>
                    )}

                    {['PENDING_PAYMENT', 'PAYMENT_VERIFICATION', 'PENDING_REQUIREMENTS', 'REQUIREMENTS_REVIEW', 'CONFIRMED'].includes(selectedBooking.status) && (
                      <button
                        onClick={() => {
                          setRequestType('RESCHEDULE');
                          setRequestModalOpen(true);
                        }}
                        className="border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reschedule
                      </button>
                    )}
                  </div>
                </div>

                {/* Trip Logistics Snapshot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px] uppercase">Rental Schedule</span>
                    <p className="font-bold text-slate-800 mt-0.5">{formatDate(selectedBooking.pickupAt)}</p>
                    <p className="font-bold text-slate-800">to {formatDate(selectedBooking.returnAt)}</p>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Duration: {selectedBooking.rentalDays} day(s) / {selectedBooking.rentalHours} hours
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px] uppercase">Destination & Handover</span>
                    <p className="font-bold text-slate-800 mt-0.5">{selectedBooking.destination?.name}</p>
                    <p className="text-slate-600 mt-0.5">
                      {selectedBooking.pickupMethod === 'DELIVERY'
                        ? `Delivery: ${selectedBooking.deliveryAddress || 'Requested Zone'}`
                        : 'Office Pickup: Naga City'}
                    </p>
                  </div>
                </div>

                {/* Requirements Checklist Card */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-brand-blue" /> Rental Requirements Status
                    </h4>
                  </div>

                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {selectedBooking.requirements?.map((req) => {
                      const isApproved = req.status === 'APPROVED';
                      const isSubmitted = req.status === 'SUBMITTED';
                      const needsUpload = req.status === 'NOT_SUBMITTED' || req.status === 'REUPLOAD_REQUESTED';

                      return (
                        <div key={req.id} className="p-3.5 bg-white flex items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="font-bold text-slate-800 block">{req.name}</span>
                            {req.rejectionReason && (
                              <p className="text-[11px] text-rose-600 font-medium mt-0.5">
                                Reason: {req.rejectionReason}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isApproved ? (
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md">
                                Approved
                              </span>
                            ) : isSubmitted ? (
                              <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-md">
                                Under Review
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setTargetRequirement(req);
                                  setUploadModalOpen(true);
                                }}
                                className="bg-brand-blue hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm"
                              >
                                <Upload className="w-3 h-3" /> Upload Document
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Payment History & Balances */}
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-brand-blue" /> Payment & Charges Breakdown
                  </h4>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">Rental Fee:</span>
                      <span className="font-bold text-slate-900">{formatPeso(selectedBooking.rentalFee)}</span>
                    </div>
                    {selectedBooking.fees?.map((f, i) => (
                      <div key={i} className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-600">{f.name}:</span>
                        <span className="font-bold text-slate-900">{formatPeso(f.amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-1.5 font-extrabold text-slate-900 text-sm">
                      <span>Total Amount:</span>
                      <span>{formatPeso(selectedBooking.totalAmount)}</span>
                    </div>
                  </div>

                  {/* Payment Submissions List */}
                  {selectedBooking.payments && selectedBooking.payments.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-700 block">Payment Records</span>
                      {selectedBooking.payments.map((p) => (
                        <div
                          key={p.id}
                          className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {p.type.replace(/_/g, ' ')} – {formatPeso(p.amount)}
                            </span>
                            <span className="text-slate-500 text-[11px]">
                              {p.paymentMethod?.name} (Ref: {p.referenceNumber || 'N/A'})
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <StatusBadge status={p.status} />
                            {p.status === 'APPROVED' && p.receiptNumber && (
                              <button
                                onClick={() => handleDownloadReceipt(p.id, p.receiptNumber!)}
                                className="text-brand-blue hover:text-blue-800 text-[11px] font-bold underline flex items-center gap-1"
                              >
                                <Download className="w-3 h-3" /> Receipt
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
                Select a booking from the list to view its complete details.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Requirement Document Modal */}
      {uploadModalOpen && targetRequirement && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-slate-900">Upload {targetRequirement.name}</h3>
            <p className="text-xs text-slate-500">{targetRequirement.requirementType?.description}</p>

            <form onSubmit={handleRequirementUpload} className="space-y-4">
              <input
                type="file"
                required
                accept="image/*,application/pdf"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-brand-blue hover:file:bg-blue-100 cursor-pointer"
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-blue text-white shadow"
                >
                  {uploading ? 'Uploading...' : 'Confirm Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule / Cancellation Request Modal */}
      {requestModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl text-xs">
            <h3 className="font-bold text-base text-slate-900">
              Request {requestType === 'RESCHEDULE' ? 'Rescheduling' : 'Cancellation'}
            </h3>
            <p className="text-slate-500">
              Submit your request to Custoworks admin. Rescheduling is subject to vehicle availability.
            </p>

            <form onSubmit={handleSubmitRequest} className="space-y-3">
              {requestType === 'RESCHEDULE' && (
                <div className="space-y-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">New Requested Pick-up</label>
                    <input
                      type="datetime-local"
                      required
                      value={reqPickup}
                      onChange={(e) => setReqPickup(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">New Requested Return</label>
                    <input
                      type="datetime-local"
                      required
                      value={reqReturn}
                      onChange={(e) => setReqReturn(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Request *</label>
                <textarea
                  required
                  rows={3}
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="Please state why you need to reschedule or cancel..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-brand-blue focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRequestModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 text-slate-700"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-blue text-white shadow"
                >
                  {submittingRequest ? 'Submitting...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Payment Proof Modal */}
      {paymentModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl text-xs max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base text-slate-900">Upload ₱500 Reservation Fee Proof</h3>
            <p className="text-slate-500">
              Booking Ref: <strong>{selectedBooking.reference}</strong>
            </p>

            <form onSubmit={handleUploadPaymentProof} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethodId}
                  onChange={(e) => setPaymentMethodId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2"
                >
                  {paymentMethods.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.accountNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Payment Method Details & QR */}
              {(() => {
                const method = paymentMethods.find((m) => m.id === paymentMethodId);
                if (!method) return null;
                return (
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
                    <p className="text-slate-600">
                      Account Name: <strong>{method.accountName}</strong> | Account Number: <strong className="font-mono text-brand-navy">{method.accountNumber}</strong>
                    </p>
                    {method.instructions && (
                      <p className="text-slate-500 text-[11px] bg-white p-2 rounded-lg border border-slate-200">
                        {method.instructions}
                      </p>
                    )}
                    {method.qrImageUrl && (
                      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
                        <img
                          src={method.qrImageUrl}
                          alt={`${method.name} QR Code`}
                          className="w-32 h-auto max-h-44 object-contain rounded-md border border-slate-200 shadow-sm shrink-0"
                        />
                        <div className="space-y-1 text-center sm:text-left">
                          <span className="inline-block bg-blue-100 text-brand-blue text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Scan to Pay
                          </span>
                          <p className="font-bold text-slate-800 text-xs">
                            Scan with {method.code === 'GCASH' ? 'GCash' : 'BDO / Bank'} App
                          </p>
                          <p className="text-slate-500 text-[11px]">
                            Transfer <strong>₱500.00</strong> reservation fee, then upload the receipt screenshot below.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reference Number *</label>
                <input
                  type="text"
                  required
                  value={paymentRefNumber}
                  onChange={(e) => setPaymentRefNumber(e.target.value)}
                  placeholder="Enter GCash or Bank Reference #"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Screenshot / Receipt *</label>
                <input
                  type="file"
                  required
                  accept="image/*,application/pdf"
                  onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-blue-50 file:text-brand-blue cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow"
                >
                  {uploading ? 'Uploading...' : 'Submit Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
