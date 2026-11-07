import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  FileText,
  Mail,
  Phone,
  Copy,
  Check,
  Printer,
  Download,
  Send,
  Plus,
  Trash2,
  Sparkles,
  Clock,
  User,
  Car,
  MapPin,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Search,
  X,
  FileCheck2,
} from 'lucide-react';

export interface Quotation {
  id: string;
  templateType: 'STANDARD' | 'EXECUTIVE' | 'TOUR' | 'AIRPORT' | 'CUSTOM';
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupLocation: string;
  dropoffLocation: string;
  vehicleName: string;
  rentalType: 'SELF_DRIVE' | 'WITH_DRIVER';
  destinationName: string;
  pickupDate: string;
  returnDate: string;
  durationLabel: string;
  baseRate: number;
  driverFee: number;
  deliveryFee: number;
  discount: number;
  securityDeposit: number;
  reservationFee: number;
  totalRentalAmount: number;
  balanceUponRelease: number;
  validUntil: string;
  inclusions: string[];
  termsAndConditions: string[];
  notes?: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'EXPIRED';
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  inquiryType: string;
  preferredVehicle?: string;
  message: string;
  status: 'PENDING' | 'QUOTED' | 'RESOLVED';
  createdAt: string;
}

export interface QuotationTemplate {
  type: string;
  name: string;
  description: string;
  rentalType: 'SELF_DRIVE' | 'WITH_DRIVER';
  vehicleName: string;
  destinationName: string;
  durationLabel: string;
  baseRate: number;
  driverFee: number;
  deliveryFee: number;
  discount: number;
  securityDeposit: number;
  reservationFee: number;
  pickupLocation: string;
  dropoffLocation: string;
  inclusions: string[];
  termsAndConditions: string[];
}

export const AdminQuotationsTab: React.FC = () => {
  const [subTab, setSubTab] = useState<'QUOTATIONS' | 'INQUIRIES' | 'TEMPLATES'>('QUOTATIONS');
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Builder Modal State
  const [builderOpen, setBuilderOpen] = useState(false);
  const [viewingQuotation, setViewingQuotation] = useState<Quotation | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Form State for Quotation
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  const returnD = new Date(tomorrow);
  returnD.setDate(returnD.getDate() + 1);

  const [form, setForm] = useState<Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'>>({
    templateType: 'STANDARD',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    pickupLocation: 'Custoworks Garage, Naga City',
    dropoffLocation: 'Custoworks Garage, Naga City',
    vehicleName: 'Toyota Vios 2025 AT (Dual VVT-i)',
    rentalType: 'SELF_DRIVE',
    destinationName: 'Naga City & Camarines Sur',
    pickupDate: tomorrow.toISOString().slice(0, 16),
    returnDate: returnD.toISOString().slice(0, 16),
    durationLabel: '24 Hours (1 Day)',
    baseRate: 1800,
    driverFee: 0,
    deliveryFee: 0,
    discount: 0,
    securityDeposit: 3000,
    reservationFee: 500,
    totalRentalAmount: 1800,
    balanceUponRelease: 1300,
    validUntil: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
    inclusions: [
      'Comprehensive Third-Party Liability Insurance',
      '24/7 Bicol Roadside Assistance Support',
      'Full AC & Sanitized Interior upon release',
      'Free Naga City Garage pickup & return',
    ],
    termsAndConditions: [
      'Valid Philippine Driver’s License and verified LTMS QR code required upon turnover.',
      '₱500 reservation fee required to confirm and block calendar dates (GCash 0995 382 7972).',
      'Refundable security deposit of ₱3,000 returned on the spot upon clean return.',
    ],
    notes: '',
    status: 'DRAFT',
  });

  const [newInclusionText, setNewInclusionText] = useState('');
  const [newTermText, setNewTermText] = useState('');

  // Load Initial Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [quotesRes, inqRes, tempRes] = await Promise.all([
        api.get<{ success: boolean; data: Quotation[] }>('/contact/admin/quotations'),
        api.get<{ success: boolean; data: CustomerInquiry[] }>('/contact/admin/inquiries'),
        api.get<{ success: boolean; data: QuotationTemplate[] }>('/contact/admin/templates'),
      ]);
      setQuotations(quotesRes.data || []);
      setInquiries(inqRes.data || []);
      setTemplates(tempRes.data || []);
    } catch (err) {
      console.error('Failed to load quotations data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Recalculate totals whenever financial inputs change
  useEffect(() => {
    const total = Math.max(0, Number(form.baseRate || 0) + Number(form.driverFee || 0) + Number(form.deliveryFee || 0) - Number(form.discount || 0));
    const balance = Math.max(0, total - Number(form.reservationFee || 0));
    setForm((prev) => ({
      ...prev,
      totalRentalAmount: total,
      balanceUponRelease: balance,
    }));
  }, [form.baseRate, form.driverFee, form.deliveryFee, form.discount, form.reservationFee]);

  // Apply a template to the builder form
  const applyTemplate = (t: QuotationTemplate) => {
    setForm((prev) => ({
      ...prev,
      templateType: t.type as any,
      rentalType: t.rentalType,
      vehicleName: t.vehicleName,
      destinationName: t.destinationName,
      durationLabel: t.durationLabel,
      baseRate: t.baseRate,
      driverFee: t.driverFee,
      deliveryFee: t.deliveryFee,
      discount: t.discount,
      securityDeposit: t.securityDeposit,
      reservationFee: t.reservationFee,
      pickupLocation: t.pickupLocation,
      dropoffLocation: t.dropoffLocation,
      inclusions: [...t.inclusions],
      termsAndConditions: [...t.termsAndConditions],
    }));
  };

  // Convert inquiry to quotation
  const handleInquiryToQuotation = (inq: CustomerInquiry) => {
    // Determine reasonable defaults based on preferred vehicle or category
    const isVanOrWithDriver = inq.message.toLowerCase().includes('driver') || inq.subject.toLowerCase().includes('driver');
    const matchedTemplate = templates.find((t) => isVanOrWithDriver ? t.type === 'EXECUTIVE' : t.type === 'STANDARD') || templates[0];

    if (matchedTemplate) {
      applyTemplate(matchedTemplate);
    }

    setForm((prev) => ({
      ...prev,
      customerName: inq.name,
      customerEmail: inq.email,
      customerPhone: inq.phone,
      vehicleName: inq.preferredVehicle || prev.vehicleName,
      notes: `Inquiry #${inq.id}: "${inq.message}"`,
    }));

    setBuilderOpen(true);
  };

  const handleSaveQuotation = async (sendEmailAfterSave: boolean = false) => {
    setActionError(null);
    setActionSuccess(null);

    if (!form.customerName.trim() || !form.customerEmail.trim()) {
      setActionError('Customer name and email are required to save a quotation.');
      return;
    }

    try {
      const res = await api.post<{ success: boolean; data: Quotation }>('/contact/admin/quotations', form);
      const savedQuote = res.data;
      setQuotations((prev) => [savedQuote, ...prev.filter((q) => q.id !== savedQuote.id)]);

      if (sendEmailAfterSave) {
        setSendingEmailId(savedQuote.id);
        const sendRes = await api.post<{ success: boolean; message?: string }>(`/contact/admin/quotations/${savedQuote.id}/send`, {});
        if (sendRes.success) {
          setActionSuccess(`Quotation #${savedQuote.id} saved and emailed to ${savedQuote.customerEmail}!`);
        } else {
          setActionError(`Quotation saved, but email failed: ${sendRes.message || 'SMTP Authentication failed. Verify Gmail App Password.'}`);
        }
        // Refresh list
        fetchData();
      } else {
        setActionSuccess(`Quotation #${savedQuote.id} created successfully.`);
      }

      setBuilderOpen(false);
      setViewingQuotation(savedQuote);
    } catch (err: any) {
      console.error('Failed to save quotation:', err);
      setActionError(err?.response?.data?.error || 'Failed to save quotation.');
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleSendEmail = async (quote: Quotation) => {
    setSendingEmailId(quote.id);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await api.post<{ success: boolean; message: string }>(`/contact/admin/quotations/${quote.id}/send`, {});
      if (res.success) {
        setActionSuccess(`Quotation #${quote.id} emailed to ${quote.customerEmail}!`);
        setQuotations((prev) =>
          prev.map((q) => (q.id === quote.id ? { ...q, status: 'SENT' } : q))
        );
        if (viewingQuotation && viewingQuotation.id === quote.id) {
          setViewingQuotation({ ...viewingQuotation, status: 'SENT' });
        }
      } else {
        setActionError(res.message || 'Failed to send email. Check SMTP credentials or App Password.');
      }
    } catch (err: any) {
      setActionError(err?.response?.data?.error || 'Failed to send email. Check SMTP settings or console logs.');
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleDeleteQuotation = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete quotation #${id}?`)) return;
    try {
      await api.delete(`/contact/admin/quotations/${id}`);
      setQuotations((prev) => prev.filter((q) => q.id !== id));
      if (viewingQuotation?.id === id) setViewingQuotation(null);
      setActionSuccess(`Quotation #${id} deleted.`);
    } catch (err) {
      setActionError('Failed to delete quotation.');
    }
  };

  const handleInquiryStatusChange = async (id: string, newStatus: CustomerInquiry['status']) => {
    try {
      await api.patch(`/contact/admin/inquiries/${id}/status`, { status: newStatus });
      setInquiries((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i))
      );
    } catch (err) {
      console.error('Failed to update inquiry status:', err);
    }
  };

  const copyForMessenger = (quote: Quotation) => {
    const text = `🚗 *CUSTOWORKS CAR RENTAL NAGA CITY*
Official Rental Quotation #${quote.id}

👤 *Customer:* ${quote.customerName}
🚘 *Vehicle:* ${quote.vehicleName}
📍 *Destination:* ${quote.destinationName}
⏱️ *Duration:* ${quote.durationLabel}
🗓️ *Rental Mode:* ${quote.rentalType === 'WITH_DRIVER' ? 'With Driver (Chauffeur)' : 'Self-Drive (LTMS Verified)'}

💰 *FINANCIAL BREAKDOWN:*
• Base Rental Rate: ₱${quote.baseRate.toLocaleString()}
${quote.driverFee > 0 ? `• Professional Driver Fee: ₱${quote.driverFee.toLocaleString()}\n` : ''}${quote.deliveryFee > 0 ? `• Delivery/Meetup Fee: ₱${quote.deliveryFee.toLocaleString()}\n` : ''}${quote.discount > 0 ? `• Special Discount: -₱${quote.discount.toLocaleString()}\n` : ''}--------------------------------
⭐ *Total Estimated Rental:* ₱${quote.totalRentalAmount.toLocaleString()}
🔒 *Reservation Fee to Hold:* ₱${quote.reservationFee.toLocaleString()} (Deducted from balance)
💵 *Balance Upon Turnover:* ₱${quote.balanceUponRelease.toLocaleString()}
🛡️ *Security Deposit:* ${quote.securityDeposit > 0 ? `₱${quote.securityDeposit.toLocaleString()} (Refundable on the spot)` : '₱0 (No deposit needed for with-driver)'}

📋 *INCLUSIONS:*
${quote.inclusions.map((i) => `✓ ${i}`).join('\n')}

📌 *HOW TO CONFIRM:*
Send ₱${quote.reservationFee.toLocaleString()} reservation fee via GCash (Primary: 0961 722 5326 / Secondary: 0995 382 7972) or Bank Transfer to block your vehicle schedule.
📞 Hotlines: 0961 722 5326 / 0995 382 7972 (Naga City, CamSur)
📧 Email: custoworks1@gmail.com`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const filteredQuotes = quotations.filter((q) => {
    const s = searchQuery.toLowerCase();
    return (
      q.id.toLowerCase().includes(s) ||
      q.customerName.toLowerCase().includes(s) ||
      q.customerEmail.toLowerCase().includes(s) ||
      q.vehicleName.toLowerCase().includes(s)
    );
  });

  const pendingInquiriesCount = inquiries.filter((i) => i.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Notifications Banner */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {actionError && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-700 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Main Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Official Quotations & Customer Inquiries</h2>
              <p className="text-xs text-slate-500">
                Generate professional customer quotations, choose from pre-built templates, and manage direct inquiries.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (templates.length > 0) applyTemplate(templates[0]);
              setBuilderOpen(true);
            }}
            className="inline-flex items-center gap-2 bg-brand-blue hover:bg-blue-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all"
          >
            <Plus className="w-4 h-4" /> Create New Quotation
          </button>
        </div>
      </div>

      {/* Sub Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          type="button"
          onClick={() => setSubTab('QUOTATIONS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            subTab === 'QUOTATIONS'
              ? 'bg-brand-navy text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Saved Quotations ({quotations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('INQUIRIES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all relative ${
            subTab === 'INQUIRIES'
              ? 'bg-brand-navy text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Direct Inquiries ({inquiries.length})</span>
          {pendingInquiriesCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-extrabold animate-pulse">
              {pendingInquiriesCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSubTab('TEMPLATES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            subTab === 'TEMPLATES'
              ? 'bg-brand-navy text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Quotation Templates ({templates.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: SAVED QUOTATIONS */}
      {subTab === 'QUOTATIONS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by quote #, customer, or car..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <span className="text-xs text-slate-500">Showing {filteredQuotes.length} quotations</span>
          </div>

          {filteredQuotes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 text-sm">No quotations found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Create a new quotation using one of the 5 official Custoworks templates, or generate one directly from incoming customer inquiries.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (templates.length > 0) applyTemplate(templates[0]);
                  setBuilderOpen(true);
                }}
                className="bg-brand-blue text-white font-bold text-xs px-4 py-2 rounded-xl"
              >
                Create Quotation
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredQuotes.map((q) => (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-extrabold text-brand-blue bg-blue-50 px-2 py-0.5 rounded">
                        #{q.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          q.status === 'SENT'
                            ? 'bg-blue-100 text-blue-700'
                            : q.status === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {q.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 truncate">{q.customerName}</h4>
                    <p className="text-xs text-slate-500 truncate">{q.customerEmail} • {q.customerPhone}</p>

                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Vehicle:</span>
                        <span className="font-semibold text-slate-800 truncate max-w-[170px]">{q.vehicleName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Rental Mode:</span>
                        <span className="font-semibold text-slate-800">
                          {q.rentalType === 'WITH_DRIVER' ? 'With Driver' : 'Self-Drive'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Duration:</span>
                        <span className="font-semibold text-slate-800">{q.durationLabel}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 font-bold text-slate-900">
                        <span>Total Estimated:</span>
                        <span className="text-brand-blue text-sm">₱{q.totalRentalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setViewingQuotation(q)}
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs py-2 px-3 rounded-lg border border-slate-200 text-center transition-colors"
                    >
                      View Quote
                    </button>
                    <a
                      href={`/api/contact/admin/quotations/${q.id}/pdf`}
                      download={`Custoworks-Quotation-${q.id}.pdf`}
                      className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs p-2 rounded-lg border border-slate-200 transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4 text-brand-blue" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleSendEmail(q)}
                      disabled={sendingEmailId === q.id}
                      className="bg-blue-50 hover:bg-blue-100 text-brand-blue font-bold text-xs p-2 rounded-lg transition-colors"
                      title="Send quotation & PDF via email"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => copyForMessenger(q)}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs p-2 rounded-lg transition-colors"
                      title="Copy formatted for Messenger / SMS"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuotation(q.id)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs p-2 rounded-lg transition-colors"
                      title="Delete quotation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: DIRECT CUSTOMER INQUIRIES */}
      {subTab === 'INQUIRIES' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
              <span>Customer Inquiries from Contact Form & Hotline</span>
              <span>Total: {inquiries.length}</span>
            </div>

            <div className="divide-y divide-slate-100">
              {inquiries.map((inq) => (
                <div key={inq.id} className="p-5 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-slate-500">#{inq.id}</span>
                      <span className="font-extrabold text-sm text-slate-900">{inq.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          inq.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : inq.status === 'QUOTED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {inq.status}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(inq.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> {inq.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {inq.phone}
                      </span>
                      {inq.preferredVehicle && (
                        <span className="flex items-center gap-1 font-semibold text-brand-blue">
                          <Car className="w-3.5 h-3.5" /> {inq.preferredVehicle}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 bg-slate-100/70 p-3 rounded-xl border border-slate-200/60 mt-2 font-normal leading-relaxed">
                      "{inq.message}"
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleInquiryToQuotation(inq)}
                      className="inline-flex items-center gap-1.5 bg-brand-blue hover:bg-blue-600 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-sm transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Create Quotation
                    </button>
                    <select
                      value={inq.status}
                      onChange={(e) => handleInquiryStatusChange(inq.id, e.target.value as any)}
                      className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none"
                    >
                      <option value="PENDING">Status: PENDING</option>
                      <option value="QUOTED">Status: QUOTED</option>
                      <option value="RESOLVED">Status: RESOLVED</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: PRE-BUILT QUOTATION TEMPLATES */}
      {subTab === 'TEMPLATES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => (
            <div
              key={tpl.type}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:border-brand-blue/50 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 text-brand-blue px-2 py-0.5 rounded">
                    {tpl.type} TEMPLATE
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {tpl.rentalType === 'WITH_DRIVER' ? 'With Driver' : 'Self-Drive'}
                  </span>
                </div>

                <h3 className="font-extrabold text-base text-slate-900 mb-1">{tpl.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">{tpl.description}</p>

                <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Default Car:</span>
                    <span className="font-bold">{tpl.vehicleName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Route:</span>
                    <span className="font-semibold">{tpl.destinationName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Duration:</span>
                    <span className="font-semibold">{tpl.durationLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Base Rate:</span>
                    <span className="font-bold text-brand-blue">₱{tpl.baseRate.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Security Deposit:</span>
                    <span className="font-semibold">{tpl.securityDeposit > 0 ? `₱${tpl.securityDeposit.toLocaleString()}` : '₱0 (None)'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    applyTemplate(tpl);
                    setBuilderOpen(true);
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-brand-navy hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Use This Template
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QUOTATION BUILDER MODAL */}
      {builderOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm overflow-y-auto p-4 flex items-center justify-center">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">Quotation Generator & Editor</h3>
                <p className="text-xs text-slate-500">Customize line items, inclusions, and client details.</p>
              </div>
              <button
                type="button"
                onClick={() => setBuilderOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Selector Bar */}
            <div className="mb-6">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Choose / Switch Base Template
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {templates.map((t) => (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className={`p-2.5 rounded-xl text-left border text-xs transition-all ${
                      form.templateType === t.type
                        ? 'bg-blue-50 border-brand-blue text-brand-navy font-bold shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <p className="truncate font-semibold">{t.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">₱{t.baseRate.toLocaleString()}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">1. Customer Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Customer Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maria Santos"
                      value={form.customerName}
                      onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="client@example.com"
                      value={form.customerEmail}
                      onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile Phone Number</label>
                    <input
                      type="text"
                      placeholder="0995 123 4567"
                      value={form.customerPhone}
                      onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Rental Details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">2. Vehicle & Schedule</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Vehicle Description</label>
                    <input
                      type="text"
                      value={form.vehicleName}
                      onChange={(e) => setForm({ ...form, vehicleName: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Rental Mode</label>
                    <select
                      value={form.rentalType}
                      onChange={(e) => setForm({ ...form, rentalType: e.target.value as any })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold"
                    >
                      <option value="SELF_DRIVE">Self-Drive (LTMS Verified)</option>
                      <option value="WITH_DRIVER">With Driver (Chauffeur)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Duration Description</label>
                    <input
                      type="text"
                      value={form.durationLabel}
                      onChange={(e) => setForm({ ...form, durationLabel: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Destination / Coverage</label>
                    <input
                      type="text"
                      value={form.destinationName}
                      onChange={(e) => setForm({ ...form, destinationName: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Pickup Location</label>
                    <input
                      type="text"
                      value={form.pickupLocation}
                      onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Drop-off Location</label>
                    <input
                      type="text"
                      value={form.dropoffLocation}
                      onChange={(e) => setForm({ ...form, dropoffLocation: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Financial Matrix */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">3. Pricing & Financial Breakdown</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Base Rate (₱)</label>
                    <input
                      type="number"
                      value={form.baseRate}
                      onChange={(e) => setForm({ ...form, baseRate: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Driver Fee (₱)</label>
                    <input
                      type="number"
                      value={form.driverFee}
                      onChange={(e) => setForm({ ...form, driverFee: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Delivery Fee (₱)</label>
                    <input
                      type="number"
                      value={form.deliveryFee}
                      onChange={(e) => setForm({ ...form, deliveryFee: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Discount (₱)</label>
                    <input
                      type="number"
                      value={form.discount}
                      onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-emerald-700 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Security Deposit (₱)</label>
                    <input
                      type="number"
                      value={form.securityDeposit}
                      onChange={(e) => setForm({ ...form, securityDeposit: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-200">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-400 block uppercase">Reservation Fee to Lock</span>
                    <input
                      type="number"
                      value={form.reservationFee}
                      onChange={(e) => setForm({ ...form, reservationFee: Number(e.target.value) })}
                      className="w-full mt-1 font-bold text-sm text-brand-blue"
                    />
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-400 block uppercase">Total Estimated Rental</span>
                    <span className="text-base font-black text-brand-navy mt-1 block">
                      ₱{form.totalRentalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-400 block uppercase">Balance Due Upon Release</span>
                    <span className="text-base font-black text-slate-900 mt-1 block">
                      ₱{form.balanceUponRelease.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Inclusions & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Inclusions (Bullets)</h4>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {form.inclusions.map((inc, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-200">
                        <span className="truncate">{inc}</span>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, inclusions: form.inclusions.filter((_, idx) => idx !== i) })}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add custom inclusion..."
                      value={newInclusionText}
                      onChange={(e) => setNewInclusionText(e.target.value)}
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newInclusionText.trim()) {
                          setForm({ ...form, inclusions: [...form.inclusions, newInclusionText.trim()] });
                          setNewInclusionText('');
                        }
                      }}
                      className="bg-brand-blue text-white text-xs px-3 py-1 rounded-lg"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Special Notes / Remarks</h4>
                  <textarea
                    rows={4}
                    placeholder="e.g. Flight delay buffer, car seat requested, special meetup instructions..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setBuilderOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl"
              >
                Cancel
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSaveQuotation(false)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-sm transition-all"
                >
                  Save Draft Quotation
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveQuotation(true)}
                  disabled={sendingEmailId !== null}
                  className="inline-flex items-center gap-2 bg-brand-blue hover:bg-blue-600 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-md transition-all"
                >
                  <Send className="w-3.5 h-3.5" /> Save & Email to Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW / PRINT / SHARE OFFICIAL QUOTATION MODAL */}
      {viewingQuotation && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm overflow-y-auto p-4 flex items-center justify-center">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-10 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 print:hidden">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-brand-blue bg-blue-50 px-2.5 py-1 rounded-lg">
                  #{viewingQuotation.id}
                </span>
                <span className="text-xs text-slate-500">Official Rental Quotation</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/contact/admin/quotations/${viewingQuotation.id}/pdf`}
                  download={`Custoworks-Quotation-${viewingQuotation.id}.pdf`}
                  className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-brand-blue text-xs font-bold py-1.5 px-3 rounded-lg border border-blue-200 transition-colors"
                  title="Download official PDF copy"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </a>
                <button
                  type="button"
                  onClick={() => copyForMessenger(viewingQuotation)}
                  className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold py-1.5 px-3 rounded-lg border border-emerald-200 transition-colors"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText ? 'Copied!' : 'Copy for Messenger/SMS'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-1.5 px-3 rounded-lg border border-slate-200 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / PDF
                </button>
                <button
                  type="button"
                  onClick={() => setViewingQuotation(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PDF Attachment Notice Banner */}
            <div className="mb-6 p-3 bg-blue-50/80 border border-blue-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs text-blue-900 print:hidden">
              <span className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>PDF Ready: Official PDF will be attached automatically when sending to <strong>{viewingQuotation.customerEmail}</strong>.</span>
              </span>
              <a
                href={`/api/contact/admin/quotations/${viewingQuotation.id}/pdf`}
                download={`Custoworks-Quotation-${viewingQuotation.id}.pdf`}
                className="inline-flex items-center gap-1 font-bold text-brand-blue hover:text-blue-700 underline text-xs"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF File
              </a>
            </div>

            {/* Printable Document Sheet */}
            <div className="space-y-6 text-slate-800">
              {/* Header */}
              <div className="text-center border-b-2 border-brand-blue pb-4">
                <h1 className="text-2xl font-black text-brand-navy tracking-wider">CUSTOWORKS CAR RENTAL</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Naga City, Camarines Sur, Philippines • 24/7 Hotline: 0995 382 7972 • admin@custoworks.ph
                </p>
                <span className="inline-block mt-2 bg-blue-100 text-brand-blue font-extrabold text-[11px] px-3 py-1 rounded-full uppercase tracking-wider">
                  Official Rental Quotation
                </span>
              </div>

              {/* Client & Metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p><strong className="text-slate-900">Quotation #:</strong> {viewingQuotation.id}</p>
                  <p><strong className="text-slate-900">Client Name:</strong> {viewingQuotation.customerName}</p>
                  <p><strong className="text-slate-900">Email:</strong> {viewingQuotation.customerEmail}</p>
                  <p><strong className="text-slate-900">Phone:</strong> {viewingQuotation.customerPhone || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p><strong className="text-slate-900">Date Issued:</strong> {new Date(viewingQuotation.createdAt).toLocaleDateString()}</p>
                  <p><strong className="text-slate-900 text-rose-600">Valid Until:</strong> {new Date(viewingQuotation.validUntil).toLocaleDateString()}</p>
                  <p><strong className="text-slate-900">Rental Type:</strong> {viewingQuotation.rentalType === 'WITH_DRIVER' ? 'With Driver (Chauffeur)' : 'Self-Drive (LTMS Verified)'}</p>
                </div>
              </div>

              {/* Vehicle & Trip Details */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Reserved Vehicle:</span>
                  <span className="font-bold text-brand-blue">{viewingQuotation.vehicleName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Declared Destination:</span>
                  <span className="font-semibold">{viewingQuotation.destinationName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-semibold">{viewingQuotation.durationLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pickup Location:</span>
                  <span>{viewingQuotation.pickupLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Drop-off Location:</span>
                  <span>{viewingQuotation.dropoffLocation}</span>
                </div>
              </div>

              {/* Itemized Table */}
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="py-2.5 px-3 rounded-l-lg">Item Description</th>
                    <th className="py-2.5 px-3 text-right rounded-r-lg">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2 px-3">Base Rental ({viewingQuotation.durationLabel})</td>
                    <td className="py-2 px-3 text-right font-bold">₱{viewingQuotation.baseRate.toLocaleString()}</td>
                  </tr>
                  {viewingQuotation.driverFee > 0 && (
                    <tr>
                      <td className="py-2 px-3">Professional Driver Allowance & Chauffeur Service</td>
                      <td className="py-2 px-3 text-right font-bold">₱{viewingQuotation.driverFee.toLocaleString()}</td>
                    </tr>
                  )}
                  {viewingQuotation.deliveryFee > 0 && (
                    <tr>
                      <td className="py-2 px-3">Vehicle Delivery / Airport Meetup Fee</td>
                      <td className="py-2 px-3 text-right font-bold">₱{viewingQuotation.deliveryFee.toLocaleString()}</td>
                    </tr>
                  )}
                  {viewingQuotation.discount > 0 && (
                    <tr className="text-emerald-700">
                      <td className="py-2 px-3">Package / Promotional Discount</td>
                      <td className="py-2 px-3 text-right font-bold">-₱{viewingQuotation.discount.toLocaleString()}</td>
                    </tr>
                  )}
                  <tr className="bg-slate-100 font-extrabold text-sm text-slate-900">
                    <td className="py-3 px-3">Total Estimated Rental</td>
                    <td className="py-3 px-3 text-right text-brand-blue">₱{viewingQuotation.totalRentalAmount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              {/* Terms Box */}
              <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-1">
                <p><strong>Reservation Fee to Lock Dates:</strong> ₱{viewingQuotation.reservationFee.toLocaleString()} (GCash: Primary 0961 722 5326 / Secondary 0995 382 7972)</p>
                <p><strong>Balance Due Upon Release:</strong> ₱{viewingQuotation.balanceUponRelease.toLocaleString()}</p>
                <p><strong>Security Deposit:</strong> {viewingQuotation.securityDeposit > 0 ? `₱${viewingQuotation.securityDeposit.toLocaleString()} (Refunded on the spot upon clean return)` : '₱0 (No deposit required for with-driver)'}</p>
              </div>

              {/* Inclusions */}
              <div className="text-xs text-slate-600">
                <p className="font-bold text-slate-900 mb-1">Inclusions:</p>
                <ul className="grid grid-cols-2 gap-1 list-disc list-inside">
                  {viewingQuotation.inclusions.map((inc, i) => (
                    <li key={i}>{inc}</li>
                  ))}
                </ul>
              </div>

              {viewingQuotation.notes && (
                <div className="text-xs bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-amber-900">
                  <strong>Notes:</strong> {viewingQuotation.notes}
                </div>
              )}
            </div>

            {/* Bottom Modal Actions */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex flex-wrap justify-between items-center gap-3 print:hidden">
              <button
                type="button"
                onClick={() => setViewingQuotation(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl"
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/contact/admin/quotations/${viewingQuotation.id}/pdf`}
                  download={`Custoworks-Quotation-${viewingQuotation.id}.pdf`}
                  className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2 px-4 rounded-xl border border-slate-300 transition-all shadow-sm"
                >
                  <Download className="w-4 h-4 text-brand-blue" />
                  <span>Download PDF</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleSendEmail(viewingQuotation)}
                  disabled={sendingEmailId === viewingQuotation.id}
                  className="inline-flex items-center gap-2 bg-brand-blue hover:bg-blue-600 text-white text-xs font-bold py-2 px-5 rounded-xl shadow-md transition-all"
                  title="Sends email with the generated PDF attached"
                >
                  <Mail className="w-4 h-4" />
                  <span>{sendingEmailId === viewingQuotation.id ? 'Sending Email & PDF...' : 'Send PDF to Customer Email'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
