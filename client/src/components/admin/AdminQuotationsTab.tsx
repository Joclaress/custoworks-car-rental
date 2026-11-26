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
  ccEmail?: string;
  pickupLocation: string;
  dropoffLocation: string;
  vehicleName: string;
  rentalType: 'SELF_DRIVE' | 'WITH_DRIVER';
  destinationName: string;
  pickupDate: string;
  returnDate: string;
  durationLabel: string;
  numberOfDays?: number;
  dailyRate?: number;
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
  const [lastAttemptedQuote, setLastAttemptedQuote] = useState<Quotation | null>(null);

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
    ccEmail: '',
    pickupLocation: 'Custoworks Garage, Naga City',
    dropoffLocation: 'Custoworks Garage, Naga City',
    vehicleName: 'Toyota Vios 2025 AT (Dual VVT-i)',
    rentalType: 'SELF_DRIVE',
    destinationName: 'Naga City & Camarines Sur',
    pickupDate: tomorrow.toISOString().slice(0, 16),
    returnDate: returnD.toISOString().slice(0, 16),
    numberOfDays: 1,
    dailyRate: 1800,
    durationLabel: '24 Hours (1 Day)',
    baseRate: 1800,
    driverFee: 0,
    deliveryFee: 0,
    discount: 0,
    securityDeposit: 1000,
    reservationFee: 1000,
    totalRentalAmount: 1800,
    balanceUponRelease: 800,
    validUntil: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
    inclusions: [
      'Comprehensive Third-Party Liability Insurance',
      '24/7 Bicol Roadside Assistance Support',
      'Full AC & Sanitized Interior upon release',
      'Free Naga City Garage pickup & return',
    ],
    termsAndConditions: [
      'Valid Philippine Driver’s License and verified LTMS QR code required upon turnover.',
      '₱1,000 reservation fee required to confirm and block calendar dates (GCash 0995 382 7972). Non-refundable upon cancellation (rescheduling permitted only).',
      'The ₱1,000 reservation fee serves as security deposit, refundable on the spot upon clean return.',
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

  // Days and Date calculations
  const handleDaysChange = (days: number) => {
    const validDays = Math.max(1, Math.floor(days) || 1);
    const pDate = new Date(form.pickupDate || Date.now());
    const newReturnDate = new Date(pDate.getTime() + validDays * 86400000).toISOString().slice(0, 16);
    const dRate = Number(form.dailyRate) > 0 ? Number(form.dailyRate) : (Number(form.baseRate) > 0 ? Number(form.baseRate) : 1800);
    const computedBase = dRate * validDays;
    const label = validDays === 1 ? '24 Hours (1 Day)' : `${validDays} Days (${validDays * 24} Hours)`;

    setForm((prev) => ({
      ...prev,
      numberOfDays: validDays,
      dailyRate: dRate,
      returnDate: newReturnDate,
      durationLabel: label,
      baseRate: computedBase,
    }));
  };

  const handleDailyRateChange = (rate: number) => {
    const validRate = Math.max(0, rate);
    const days = Math.max(1, Number(form.numberOfDays) || 1);
    setForm((prev) => ({
      ...prev,
      dailyRate: validRate,
      baseRate: validRate * days,
    }));
  };

  const handleDateChange = (field: 'pickupDate' | 'returnDate', value: string) => {
    const newPickup = field === 'pickupDate' ? value : form.pickupDate;
    const newReturn = field === 'returnDate' ? value : form.returnDate;

    let computedDays = form.numberOfDays || 1;
    if (newPickup && newReturn) {
      const start = new Date(newPickup).getTime();
      const end = new Date(newReturn).getTime();
      if (end > start) {
        computedDays = Math.max(1, Math.ceil((end - start) / 86400000));
      }
    }

    const dRate = Number(form.dailyRate) > 0 ? Number(form.dailyRate) : 1800;
    const computedBase = dRate * computedDays;
    const label = computedDays === 1 ? '24 Hours (1 Day)' : `${computedDays} Days (${computedDays * 24} Hours)`;

    setForm((prev) => ({
      ...prev,
      [field]: value,
      numberOfDays: computedDays,
      durationLabel: label,
      baseRate: computedBase,
    }));
  };

  // Apply a template to the builder form
  const applyTemplate = (t: QuotationTemplate) => {
    const days = 1;
    setForm((prev) => ({
      ...prev,
      templateType: t.type as any,
      rentalType: t.rentalType,
      vehicleName: t.vehicleName,
      destinationName: t.destinationName,
      durationLabel: t.durationLabel,
      dailyRate: t.baseRate,
      numberOfDays: days,
      baseRate: t.baseRate * days,
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
        const sendRes = await api.post<{ success: boolean; message?: string }>(`/contact/admin/quotations/${savedQuote.id}/send`, savedQuote);
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

  const getGmailComposeUrl = (q: Quotation) => {
    const subject = encodeURIComponent(`[Custoworks Car Rental] Official Rental Quotation #${q.id} for ${q.customerName}`);
    const daysText = q.numberOfDays && q.numberOfDays > 1 && q.dailyRate
      ? `${q.durationLabel} (${q.numberOfDays} Days @ ₱${q.dailyRate.toLocaleString()}/day)`
      : q.durationLabel;

    const body = encodeURIComponent(
      `Dear ${q.customerName},\n\nThank you for choosing Custoworks Car Rental Services Naga City!\n\nPlease find your official quotation summary below:\n\n` +
      `• Quotation #: ${q.id}\n` +
      `• Vehicle: ${q.vehicleName}\n` +
      `• Rental Mode: ${q.rentalType === 'WITH_DRIVER' ? 'With Driver (Chauffeur)' : 'Self-Drive (LTMS Verified)'}\n` +
      `• Destination: ${q.destinationName}\n` +
      `• Duration: ${daysText}\n` +
      `• Pickup: ${new Date(q.pickupDate).toLocaleString()} (${q.pickupLocation})\n` +
      `• Return: ${new Date(q.returnDate).toLocaleString()} (${q.dropoffLocation})\n` +
      `• Base Vehicle Rental: PHP ${q.baseRate.toLocaleString()}${q.numberOfDays && q.numberOfDays > 1 ? ` (₱${(q.dailyRate || q.baseRate / q.numberOfDays).toLocaleString()}/day × ${q.numberOfDays} days)` : ''}\n` +
      `• Total Estimated Rental: PHP ${q.totalRentalAmount.toLocaleString()}\n` +
      `• Required Reservation Fee: PHP ${q.reservationFee.toLocaleString()} (to lock dates & vehicle)\n` +
      `• Balance Upon Release: PHP ${q.balanceUponRelease.toLocaleString()}\n\n` +
      `Payment Options to Lock Dates:\n` +
      `• GCash: 0995 382 7972 (Jericho Oclares)\n` +
      `• Maya: 0961 722 5326 (Custoworks)\n` +
      `• Bank: BDO Unibank Naga City\n` +
      `• Office: Carnation St. CBD II Brgy. Triangulo (Beside SM City), Naga City\n\n` +
      `Please find the official quotation PDF attached.\n\n` +
      `Best regards,\nCustoworks Car Rental Services\nHotlines: 0961 722 5326 / 0995 382 7972\nFacebook: https://facebook.com/CustoWorkss`
    );
    const ccParam = q.ccEmail ? `&cc=${encodeURIComponent(q.ccEmail)}` : '';
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(q.customerEmail)}${ccParam}&su=${subject}&body=${body}`;
  };

  const handleSendEmail = async (quote: Quotation) => {
    setSendingEmailId(quote.id);
    setLastAttemptedQuote(quote);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await api.post<{ success: boolean; message: string }>(`/contact/admin/quotations/${quote.id}/send`, quote);
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
• Base Rental Rate: ₱${quote.baseRate.toLocaleString()}${quote.numberOfDays && quote.numberOfDays > 1 && quote.dailyRate ? ` (₱${quote.dailyRate.toLocaleString()}/day × ${quote.numberOfDays} Days)` : ''}
${quote.driverFee > 0 ? `• Professional Driver Fee: ₱${quote.driverFee.toLocaleString()}\n` : ''}${quote.deliveryFee > 0 ? `• Delivery/Meetup Fee: ₱${quote.deliveryFee.toLocaleString()}\n` : ''}${quote.discount > 0 ? `• Special Discount: -₱${quote.discount.toLocaleString()}\n` : ''}--------------------------------
⭐ *Total Estimated Rental:* ₱${quote.totalRentalAmount.toLocaleString()}
🔒 *Reservation Fee to Hold:* ₱${quote.reservationFee.toLocaleString()} (Deducted from balance)
💵 *Balance Upon Turnover:* ₱${quote.balanceUponRelease.toLocaleString()}
🛡️ *Security Deposit:* ${quote.securityDeposit > 0 ? `₱${quote.securityDeposit.toLocaleString()} (Refundable on the spot)` : '₱0 (No deposit needed for with-driver)'}

📋 *INCLUSIONS:*
${quote.inclusions.map((i) => `✓ ${i}`).join('\n')}

📌 *HOW TO CONFIRM:*
Send ₱${quote.reservationFee.toLocaleString()} reservation fee via GCash (0995 382 7972 - Jericho Oclares / 0961 722 5326) or Bank Transfer to block your vehicle schedule.
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
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-3 text-xs text-rose-300 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white text-sm">{actionError}</p>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  Render cloud servers block outbound SMTP ports (465/587) by default. You can instantly open Gmail Web to send the quote to the client now, or download the PDF file.
                </p>
              </div>
            </div>
            <button onClick={() => setActionError(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>

          {lastAttemptedQuote && (
            <div className="pt-2 border-t border-rose-500/20 flex flex-wrap items-center justify-between gap-2.5">
              <span className="text-[11px] text-rose-200 font-semibold">
                Client: {lastAttemptedQuote.customerName} ({lastAttemptedQuote.customerEmail})
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={getGmailComposeUrl(lastAttemptedQuote)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow transition"
                  title="Open Gmail with quotation message pre-loaded"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Open in Gmail (Web)</span>
                </a>
                <a
                  href={`mailto:${lastAttemptedQuote.customerEmail}?subject=${encodeURIComponent(
                    `[Custoworks Car Rental] Official Rental Quotation #${lastAttemptedQuote.id}`
                  )}`}
                  className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3 py-1.5 rounded-xl border border-slate-700 transition"
                  title="Open default email application"
                >
                  <span>Mail App</span>
                </a>
                <a
                  href={api.getFileUrl(`/contact/admin/quotations/${lastAttemptedQuote.id}/pdf`)}
                  download={`Custoworks-Quotation-${lastAttemptedQuote.id}.pdf`}
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow transition"
                  title="Download quotation PDF to your device"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Header & Main Controls */}
      <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Official Quotations & Customer Inquiries</h2>
              <p className="text-xs text-slate-400">
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
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Create New Quotation
          </button>
        </div>
      </div>

      {/* Sub Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-bold">
        <button
          type="button"
          onClick={() => setSubTab('QUOTATIONS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border ${
            subTab === 'QUOTATIONS'
              ? 'bg-blue-600 text-white border-blue-500 shadow-md'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Saved Quotations ({quotations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('INQUIRIES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border relative ${
            subTab === 'INQUIRIES'
              ? 'bg-blue-600 text-white border-blue-500 shadow-md'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
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
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border ${
            subTab === 'TEMPLATES'
              ? 'bg-blue-600 text-white border-blue-500 shadow-md'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
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
                        <span className="font-semibold text-slate-800">
                          {q.durationLabel} {q.numberOfDays && q.numberOfDays > 1 ? `(${q.numberOfDays} Days)` : ''}
                        </span>
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
                      href={api.getFileUrl(`/contact/admin/quotations/${q.id}/pdf`)}
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
                      title="Send quotation & PDF via automated server email"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                    <a
                      href={getGmailComposeUrl(q)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs p-2 rounded-lg transition-colors"
                      title="Open and send directly via Gmail Web"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-0 sm:p-4 sm:items-center">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-4xl w-full max-h-[95vh] sm:max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header (Sticky) */}
            <div className="p-4 sm:p-5 border-b border-slate-200 shrink-0 bg-white flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">Quotation Generator & Editor</h3>
                <p className="text-[11px] sm:text-xs text-slate-500">Calculate total rental days, customize rates, and client details.</p>
              </div>
              <button
                type="button"
                onClick={() => setBuilderOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 overscroll-contain">
              {/* Template Selector Bar (Swipeable on Mobile) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Choose / Switch Base Template
                </label>
                <div className="flex sm:grid sm:grid-cols-5 gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                  {templates.map((t) => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => applyTemplate(t)}
                      className={`min-w-[140px] sm:min-w-0 p-2.5 rounded-xl text-left border text-xs transition-all shrink-0 sm:shrink ${
                        form.templateType === t.type
                          ? 'bg-blue-50 border-brand-blue text-brand-navy font-bold shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <p className="truncate font-semibold">{t.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">₱{t.baseRate.toLocaleString()}/day</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Fields Grid */}
              <div className="space-y-5">
                {/* 1. Customer Info with Optional CC */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">1. Customer Information</h4>
                    <span className="text-[11px] text-slate-400 font-medium">* Required fields</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Customer Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Maria Santos"
                        value={form.customerName}
                        onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-blue"
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
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center justify-between">
                        <span>Optional CC Email</span>
                        <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">Optional</span>
                      </label>
                      <input
                        type="email"
                        placeholder="manager@cementaid.com"
                        value={form.ccEmail || ''}
                        onChange={(e) => setForm({ ...form, ccEmail: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile Phone Number</label>
                      <input
                        type="text"
                        placeholder="0995 123 4567"
                        value={form.customerPhone}
                        onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-blue"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Vehicle & Schedule with Days Counter */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">2. Vehicle & Schedule</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Vehicle Description</label>
                      <input
                        type="text"
                        value={form.vehicleName}
                        onChange={(e) => setForm({ ...form, vehicleName: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold"
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
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Destination / Coverage</label>
                      <input
                        type="text"
                        value={form.destinationName}
                        onChange={(e) => setForm({ ...form, destinationName: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Schedule Dates & Days Calculator */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Pickup Date & Time</label>
                      <input
                        type="datetime-local"
                        value={form.pickupDate}
                        onChange={(e) => handleDateChange('pickupDate', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Return Date & Time</label>
                      <input
                        type="datetime-local"
                        value={form.returnDate}
                        onChange={(e) => handleDateChange('returnDate', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Total Rental Days
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDaysChange((form.numberOfDays || 1) - 1)}
                          className="w-9 h-9 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-black flex items-center justify-center shrink-0 transition"
                          title="Minus 1 day"
                        >
                          -
                        </button>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min="1"
                            max="90"
                            value={form.numberOfDays || 1}
                            onChange={(e) => handleDaysChange(Number(e.target.value))}
                            className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2 text-center text-sm font-black text-brand-navy"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold pointer-events-none">
                            days
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDaysChange((form.numberOfDays || 1) + 1)}
                          className="w-9 h-9 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-black flex items-center justify-center shrink-0 transition"
                          title="Plus 1 day"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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

                {/* 3. Pricing Matrix with Auto-Multiplied Days */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">3. Pricing & Financial Breakdown</h4>
                    <span className="text-[11px] font-bold text-brand-blue bg-blue-50 px-2 py-0.5 rounded-full">
                      {form.numberOfDays || 1} Day{(form.numberOfDays || 1) > 1 ? 's' : ''} Rental
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Daily Rate (₱)
                      </label>
                      <input
                        type="number"
                        value={form.dailyRate || form.baseRate}
                        onChange={(e) => handleDailyRateChange(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Total Days
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={form.numberOfDays || 1}
                        onChange={(e) => handleDaysChange(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-brand-navy font-black text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Base Rental (₱)
                      </label>
                      <input
                        type="number"
                        value={form.baseRate}
                        onChange={(e) => setForm({ ...form, baseRate: Number(e.target.value) })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-brand-navy font-black"
                      />
                      <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                        ₱{(form.dailyRate || form.baseRate).toLocaleString()} × {form.numberOfDays || 1}d
                      </span>
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
                  </div>

                  {/* Live Formula Banner */}
                  <div className="bg-blue-50/90 border border-blue-200/90 rounded-xl p-3 text-xs text-blue-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
                    <span className="font-semibold flex items-center gap-1.5 flex-wrap">
                      <span>💡 Breakdown:</span>
                      <span className="text-slate-700">
                        (₱{(form.dailyRate || form.baseRate).toLocaleString()}/day × {form.numberOfDays || 1} day{(form.numberOfDays || 1) > 1 ? 's' : ''} = <strong>₱{form.baseRate.toLocaleString()}</strong>)
                        {form.driverFee > 0 ? ` + ₱${form.driverFee.toLocaleString()} Driver` : ''}
                        {form.deliveryFee > 0 ? ` + ₱${form.deliveryFee.toLocaleString()} Delivery` : ''}
                        {form.discount > 0 ? ` - ₱${form.discount.toLocaleString()} Discount` : ''}
                      </span>
                    </span>
                    <span className="font-black text-brand-navy text-sm shrink-0">
                      = ₱{form.totalRentalAmount.toLocaleString()} Total
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-400 block uppercase font-bold">Reservation Fee to Lock</span>
                      <input
                        type="number"
                        value={form.reservationFee}
                        onChange={(e) => setForm({ ...form, reservationFee: Number(e.target.value) })}
                        className="w-full mt-1 font-bold text-sm text-brand-blue focus:outline-none"
                      />
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-400 block uppercase font-bold">Total Estimated Rental</span>
                      <span className="text-base sm:text-lg font-black text-brand-navy mt-1 block">
                        ₱{form.totalRentalAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-400 block uppercase font-bold">Balance Due Upon Release</span>
                      <span className="text-base sm:text-lg font-black text-slate-900 mt-1 block">
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
                        className="bg-brand-blue text-white text-xs px-3 py-1 rounded-lg font-bold"
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
            </div>

            {/* Modal Action Buttons (Sticky at bottom on Mobile) */}
            <div className="p-3.5 sm:p-4 border-t border-slate-200 shrink-0 bg-slate-50 flex flex-wrap items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setBuilderOpen(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl transition"
              >
                Cancel
              </button>
              <div className="flex items-center gap-2 sm:gap-3 flex-1 sm:flex-initial justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveQuotation(false)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-4 sm:px-5 rounded-xl shadow-sm transition-all"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveQuotation(true)}
                  disabled={sendingEmailId !== null}
                  className="inline-flex items-center gap-1.5 sm:gap-2 bg-brand-blue hover:bg-blue-600 text-white text-xs font-bold py-2.5 px-4 sm:px-5 rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingEmailId ? 'Sending...' : 'Save & Email'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW / PRINT / SHARE OFFICIAL QUOTATION MODAL */}
      {viewingQuotation && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-0 sm:p-4 sm:items-center">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-3xl w-full max-h-[95vh] sm:max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            {/* Pinned Modal Top Header */}
            <div className="p-4 sm:p-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-brand-blue bg-blue-50 px-2.5 py-1 rounded-lg">
                  #{viewingQuotation.id}
                </span>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">Official Rental Quotation</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <a
                  href={api.getFileUrl(`/contact/admin/quotations/${viewingQuotation.id}/pdf`)}
                  download={`Custoworks-Quotation-${viewingQuotation.id}.pdf`}
                  className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-brand-blue text-xs font-bold py-1.5 px-2.5 sm:px-3 rounded-lg border border-blue-200 transition-colors"
                  title="Download official PDF copy"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download PDF</span>
                </a>
                <button
                  type="button"
                  onClick={() => copyForMessenger(viewingQuotation)}
                  className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold py-1.5 px-2.5 sm:px-3 rounded-lg border border-emerald-200 transition-colors"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{copiedText ? 'Copied!' : 'Copy for Messenger'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="hidden md:inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-1.5 px-3 rounded-lg border border-slate-200 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
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

            {/* Scrollable Body */}
            <div className="overflow-y-auto flex-1 p-4 sm:p-8 space-y-6 text-slate-800 overscroll-contain">
              {/* PDF Attachment Notice Banner */}
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs text-blue-900 print:hidden">
                <span className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>PDF Ready: Official PDF will be attached automatically when sending to <strong>{viewingQuotation.customerEmail}</strong>{viewingQuotation.ccEmail ? ` (CC: ${viewingQuotation.ccEmail})` : ''}.</span>
                </span>
                <a
                  href={api.getFileUrl(`/contact/admin/quotations/${viewingQuotation.id}/pdf`)}
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
                    Naga City, Camarines Sur, Philippines • 24/7 Hotline: 0995 382 7972 • custoworks1@gmail.com
                  </p>
                  <span className="inline-block mt-2 bg-blue-100 text-brand-blue font-extrabold text-[11px] px-3 py-1 rounded-full uppercase tracking-wider">
                    Official Rental Quotation
                  </span>
                </div>

                {/* Client & Metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <p><strong className="text-slate-900">Quotation #:</strong> {viewingQuotation.id}</p>
                    <p><strong className="text-slate-900">Client Name:</strong> {viewingQuotation.customerName}</p>
                    <p><strong className="text-slate-900">Email:</strong> {viewingQuotation.customerEmail}</p>
                    {viewingQuotation.ccEmail && (
                      <p><strong className="text-slate-900">CC:</strong> {viewingQuotation.ccEmail}</p>
                    )}
                    <p><strong className="text-slate-900">Phone:</strong> {viewingQuotation.customerPhone || 'N/A'}</p>
                  </div>
                  <div className="sm:text-right">
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
                    <span className="font-semibold">
                      {viewingQuotation.durationLabel} {viewingQuotation.numberOfDays && viewingQuotation.numberOfDays > 1 ? `(${viewingQuotation.numberOfDays} Days)` : ''}
                    </span>
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
                      <td className="py-2 px-3">
                        Base Rental ({viewingQuotation.durationLabel}
                        {viewingQuotation.numberOfDays && viewingQuotation.numberOfDays > 1 && viewingQuotation.dailyRate
                          ? ` • ₱${viewingQuotation.dailyRate.toLocaleString()}/day × ${viewingQuotation.numberOfDays} Days`
                          : ''})
                      </td>
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
                  <p><strong>Reservation Fee to Lock Dates:</strong> ₱{viewingQuotation.reservationFee.toLocaleString()} (GCash: Primary 0995 382 7972 / Secondary 0961 722 5326)</p>
                  <p><strong>Balance Due Upon Release:</strong> ₱{viewingQuotation.balanceUponRelease.toLocaleString()}</p>
                  <p><strong>Security Deposit:</strong> {viewingQuotation.securityDeposit > 0 ? `₱${viewingQuotation.securityDeposit.toLocaleString()} (Refunded on the spot upon clean return)` : '₱0 (No deposit required for with-driver)'}</p>
                </div>

                {/* Inclusions */}
                <div className="text-xs text-slate-600">
                  <p className="font-bold text-slate-900 mb-1">Inclusions:</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 list-disc list-inside">
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
            </div>

            {/* Pinned Bottom Actions Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 shrink-0 flex flex-wrap justify-between items-center gap-2 print:hidden">
              <button
                type="button"
                onClick={() => setViewingQuotation(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl"
              >
                Close
              </button>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <a
                  href={api.getFileUrl(`/contact/admin/quotations/${viewingQuotation.id}/pdf`)}
                  download={`Custoworks-Quotation-${viewingQuotation.id}.pdf`}
                  className="hidden sm:inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold py-2 px-3 rounded-xl border border-slate-300 transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-brand-blue" />
                  <span>PDF</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleSendEmail(viewingQuotation)}
                  disabled={sendingEmailId === viewingQuotation.id}
                  className="inline-flex items-center gap-1.5 bg-brand-blue hover:bg-blue-600 text-white text-xs font-bold py-2 px-3.5 rounded-xl shadow-md transition-all"
                  title="Sends email with the generated PDF attached via server"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{sendingEmailId === viewingQuotation.id ? 'Sending...' : 'Server Email'}</span>
                </button>
                <a
                  href={getGmailComposeUrl(viewingQuotation)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2 px-3.5 rounded-xl shadow-md transition-all"
                  title="Open directly in Gmail Web in your browser"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Gmail</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
