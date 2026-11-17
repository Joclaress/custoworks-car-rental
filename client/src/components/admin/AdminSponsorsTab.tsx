import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import {
  Megaphone,
  CheckCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  DollarSign,
  PhoneCall,
  MessageCircle,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Eye,
  EyeOff,
  Copy,
  Calendar,
  Building2,
  Trash2,
  X,
  Send,
  Sparkles,
  ShieldCheck,
  Check,
  Upload,
  Camera,
  Image as ImageIcon,
  Edit3,
} from 'lucide-react';

export interface SponsorPaymentRecord {
  id: string;
  amount: number;
  paidAt: string;
  method: 'GCASH' | 'MAYA' | 'BANK_TRANSFER' | 'CASH';
  referenceNo: string;
  daysAdded: number;
  recordedBy?: string;
  notes?: string;
}

export interface Sponsor {
  id: string;
  businessName: string;
  category: 'HOTEL' | 'FOOD' | 'ADVENTURE' | 'AUTOCARE' | 'RETAIL' | 'OTHER';
  categoryLabel: string;
  contactPerson: string;
  phone: string;
  email?: string | null;
  placementSlot: string;
  adHeadline?: string | null;
  tagline?: string | null;
  location: string;
  imageUrl?: string | null;
  websiteUrl?: string | null;
  proposedPerk?: string | null;
  monthlyFee: number;
  status: 'TRIAL_ACTIVE' | 'TRIAL_EXPIRED' | 'PAID_ACTIVE' | 'PAID_EXPIRED' | 'PAUSED' | 'CANCELLED';
  trialStartsAt: string;
  trialEndsAt: string;
  paidUntil?: string | null;
  isActiveOnWebsite: boolean;
  paymentHistory: SponsorPaymentRecord[];
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  effectiveStatus?: 'TRIAL_ACTIVE' | 'TRIAL_EXPIRED' | 'PAID_ACTIVE' | 'PAID_EXPIRED' | 'PAUSED' | 'CANCELLED';
  daysRemaining?: number;
  daysOverdue?: number;
  isExpired?: boolean;
}

export interface SponsorSummary {
  totalSponsors: number;
  activeTrials: number;
  expiredTrials: number;
  paidActive: number;
  paidExpired: number;
  actionRequiredCount: number;
  totalRevenueCollected: number;
  monthlySubscriptionRate: number;
  paymentInstructions: {
    gcash: { number: string; name: string };
    maya: { number: string; name: string };
    bank: { bankName: string; accountName: string; branch: string };
    cash: string;
  };
}

export const AdminSponsorsTab: React.FC = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [summary, setSummary] = useState<SponsorSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [paymentModalSponsor, setPaymentModalSponsor] = useState<Sponsor | null>(null);
  const [reminderModalSponsor, setReminderModalSponsor] = useState<Sponsor | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [historyModalSponsor, setHistoryModalSponsor] = useState<Sponsor | null>(null);

  // Form states
  const [paymentForm, setPaymentForm] = useState({
    amount: 3000,
    method: 'GCASH' as 'GCASH' | 'MAYA' | 'BANK_TRANSFER' | 'CASH',
    referenceNo: '',
    daysToAdd: 30,
    notes: '',
  });

  const [newSponsorForm, setNewSponsorForm] = useState({
    businessName: '',
    contactPerson: '',
    phone: '',
    email: '',
    category: 'HOTEL' as const,
    placementSlot: 'Top Header Sticky Banner',
    location: 'Naga City, Camarines Sur',
    websiteUrl: '',
    proposedPerk: '',
    imageUrl: '',
    notes: '',
  });

  const [newSponsorPhotoFile, setNewSponsorPhotoFile] = useState<File | null>(null);
  const [newSponsorPhotoPreview, setNewSponsorPhotoPreview] = useState<string | null>(null);
  const [viewPhotoUrl, setViewPhotoUrl] = useState<{ url: string; title: string } | null>(null);
  const [uploadingSponsorId, setUploadingSponsorId] = useState<string | null>(null);
  const [isSubmittingNewSponsor, setIsSubmittingNewSponsor] = useState(false);

  // Edit Days modal state
  const [editDaysModalSponsor, setEditDaysModalSponsor] = useState<Sponsor | null>(null);
  const [editDaysValue, setEditDaysValue] = useState<number>(30);
  const [editExpiryDate, setEditExpiryDate] = useState<string>('');
  const [editSubscriptionType, setEditSubscriptionType] = useState<'PAID' | 'TRIAL'>('PAID');
  const [isSavingDays, setIsSavingDays] = useState(false);

  const [copiedText, setCopiedText] = useState<string | null>(null);

  const fetchSponsors = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; sponsors: Sponsor[]; summary: SponsorSummary }>(
        '/sponsors/admin/all',
        { forceRefresh: true }
      );
      if (res?.sponsors) {
        setSponsors(res.sponsors);
        setSummary(res.summary);
      }
    } catch (err: any) {
      console.error('Failed to load sponsors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSponsors();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalSponsor) return;

    try {
      await api.post(`/sponsors/admin/${paymentModalSponsor.id}/record-payment`, {
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
        referenceNo: paymentForm.referenceNo,
        daysToAdd: Number(paymentForm.daysToAdd),
        notes: paymentForm.notes,
      });

      alert(`✅ Success: Recorded ₱${paymentForm.amount.toLocaleString()} payment for ${paymentModalSponsor.businessName}! Subscription extended.`);
      setPaymentModalSponsor(null);
      setPaymentForm({
        amount: 3000,
        method: 'GCASH',
        referenceNo: '',
        daysToAdd: 30,
        notes: '',
      });
      fetchSponsors();
    } catch (err: any) {
      alert(`Error recording payment: ${err.message || 'Unknown error'}`);
    }
  };

  const handleToggleActive = async (sponsor: Sponsor) => {
    const nextState = !sponsor.isActiveOnWebsite;
    try {
      await api.patch(`/sponsors/admin/${sponsor.id}/toggle-active`, { isActive: nextState });
      fetchSponsors();
    } catch (err: any) {
      alert(`Failed to update banner state: ${err.message}`);
    }
  };

  const handleDeleteSponsor = async (sponsor: Sponsor) => {
    if (!window.confirm(`Are you sure you want to remove ${sponsor.businessName}?`)) return;
    try {
      await api.delete(`/sponsors/admin/${sponsor.id}`);
      fetchSponsors();
    } catch (err: any) {
      alert(`Failed to delete sponsor: ${err.message}`);
    }
  };

  const handlePhotoUploadForExistingSponsor = async (sponsorId: string, file: File) => {
    try {
      setUploadingSponsorId(sponsorId);
      const formData = new FormData();
      formData.append('photo', file);
      await api.post(`/sponsors/admin/${sponsorId}/photo`, formData);
      await fetchSponsors();
    } catch (err: any) {
      alert(`Failed to upload photo: ${err.message || 'Unknown error'}`);
    } finally {
      setUploadingSponsorId(null);
    }
  };

  const handleCreateSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingNewSponsor(true);
    try {
      let finalImageUrl = newSponsorForm.imageUrl || '';
      if (newSponsorPhotoFile) {
        const formData = new FormData();
        formData.append('photo', newSponsorPhotoFile);
        const uploadRes = await api.post<{ success: boolean; url: string }>('/sponsors/upload-photo', formData);
        if (uploadRes?.url) {
          finalImageUrl = uploadRes.url;
        }
      }

      await api.post('/sponsors/admin/create', {
        ...newSponsorForm,
        imageUrl: finalImageUrl || undefined,
      });
      alert('✅ Sponsor created with 14-day free trial active!');
      setAddModalOpen(false);
      setNewSponsorPhotoFile(null);
      setNewSponsorPhotoPreview(null);
      setNewSponsorForm({
        businessName: '',
        contactPerson: '',
        phone: '',
        email: '',
        category: 'HOTEL',
        placementSlot: 'Top Header Sticky Banner',
        location: 'Naga City, Camarines Sur',
        websiteUrl: '',
        proposedPerk: '',
        imageUrl: '',
        notes: '',
      });
      fetchSponsors();
    } catch (err: any) {
      alert(`Failed to create sponsor: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmittingNewSponsor(false);
    }
  };

  const openEditDaysModal = (sponsor: Sponsor) => {
    setEditDaysModalSponsor(sponsor);
    const days = sponsor.daysRemaining ?? (sponsor.isExpired ? 0 : 14);
    setEditDaysValue(days);
    const isPaid =
      sponsor.effectiveStatus === 'PAID_ACTIVE' ||
      sponsor.effectiveStatus === 'PAID_EXPIRED' ||
      Boolean(sponsor.paidUntil);
    setEditSubscriptionType(isPaid ? 'PAID' : 'TRIAL');

    const expiryTimestamp = isPaid
      ? (sponsor.paidUntil ? new Date(sponsor.paidUntil).getTime() : Date.now() + days * 86400000)
      : new Date(sponsor.trialEndsAt).getTime();

    const d = new Date(expiryTimestamp);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setEditExpiryDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleDaysValueChange = (newDays: number) => {
    const days = Math.max(0, newDays);
    setEditDaysValue(days);
    const targetDate = new Date(Date.now() + days * 86400000);
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    setEditExpiryDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleExpiryDateChange = (dateStr: string) => {
    setEditExpiryDate(dateStr);
    if (dateStr) {
      const target = new Date(`${dateStr}T23:59:59`).getTime();
      const diffDays = Math.max(0, Math.ceil((target - Date.now()) / 86400000));
      setEditDaysValue(diffDays);
    }
  };

  const handleSaveDaysAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDaysModalSponsor) return;
    setIsSavingDays(true);
    try {
      const res = await api.patch<{ success: boolean; message: string; sponsor: Sponsor }>(
        `/sponsors/admin/${editDaysModalSponsor.id}/adjust-days`,
        {
          daysRemaining: editDaysValue,
          subscriptionType: editSubscriptionType,
          newExpiryDate: editExpiryDate ? new Date(`${editExpiryDate}T23:59:59`).toISOString() : undefined,
        }
      );
      alert(`✅ Success: ${res?.message || 'Days remaining updated successfully!'}`);
      setEditDaysModalSponsor(null);
      fetchSponsors();
    } catch (err: any) {
      alert(`Failed to update days: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSavingDays(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Filtered sponsors
  const filtered = sponsors.filter((s) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      s.businessName.toLowerCase().includes(term) ||
      s.contactPerson.toLowerCase().includes(term) ||
      s.phone.includes(term) ||
      s.categoryLabel.toLowerCase().includes(term);

    if (!matchSearch) return false;

    if (statusFilter === 'EXPIRED') {
      return s.effectiveStatus === 'TRIAL_EXPIRED' || s.effectiveStatus === 'PAID_EXPIRED';
    }
    if (statusFilter === 'TRIAL') {
      return s.effectiveStatus === 'TRIAL_ACTIVE';
    }
    if (statusFilter === 'PAID') {
      return s.effectiveStatus === 'PAID_ACTIVE';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black tracking-wider text-amber-400 uppercase mb-1">
            <Megaphone className="w-3.5 h-3.5" />
            <span>Monetization & Partner Advertising</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Sponsors & 14-Day Free Trial Tracker
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Track business banner placements, 14-day free trial expirations, and collect ₱3,000 monthly sponsor subscriptions via GCash, Maya, or Bank.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchSponsors}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Sponsor</span>
          </button>
        </div>
      </div>

      {/* 2. Top Executive Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total Sponsors
          </span>
          <div className="text-2xl font-black text-white">{summary?.totalSponsors ?? sponsors.length}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Registered in system</span>
        </div>

        <div className="bg-slate-900/80 border border-blue-500/30 rounded-2xl p-4">
          <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block mb-1">
            🎁 Active Trials
          </span>
          <div className="text-2xl font-black text-blue-300">{summary?.activeTrials ?? 0}</div>
          <span className="text-[10px] text-blue-400/70 mt-1 block">In 14-day free trial</span>
        </div>

        <div className="bg-slate-900/80 border border-amber-500/40 rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
            ⚠️ Trials Expired
          </span>
          <div className="text-2xl font-black text-amber-300">
            {summary?.expiredTrials ?? 0}
          </div>
          <span className="text-[10px] text-amber-400/90 font-bold mt-1 block">
            Payment Due: ₱3,000/mo
          </span>
        </div>

        <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-4">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
            💎 Paid Active
          </span>
          <div className="text-2xl font-black text-emerald-300">{summary?.paidActive ?? 0}</div>
          <span className="text-[10px] text-emerald-400/70 mt-1 block">₱3k/mo Recurring</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 col-span-2 lg:col-span-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total Revenue
          </span>
          <div className="text-2xl font-black text-white">
            ₱{(summary?.totalRevenueCollected ?? 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-400 mt-1 block">All-time collected</span>
        </div>
      </div>

      {/* 3. Payment Instructions & Action Guide Box */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h4 className="text-xs sm:text-sm font-black text-white">
              Where will sponsors pay after their 14-day free trial?
            </h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sponsors pay flat <strong className="text-white">₱3,000 / month</strong> to keep their banner active. They can pay via{' '}
            <strong className="text-cyan-400">GCash: 0995 382 7972 | Maya: 0961 722 5326</strong>, BDO Bank Transfer, or Cash at our Naga Office (Beside SM City Naga).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() =>
              copyToClipboard(
                `Custoworks Car Rental Official Sponsor Payment Details:\n• GCash: 0995 382 7972 (Jericho Oclares)\n• Maya / Hotline: 0961 722 5326 (Custoworks / Charleine Oclares)\n• Monthly Rate: ₱3,000/month\n• Office: Carnation St. CBD II Brgy. Triangulo (Beside SM City), Naga City`,
                'all-details'
              )
            }
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all border border-slate-700"
          >
            {copiedText === 'all-details' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedText === 'all-details' ? 'Copied Details!' : 'Copy Payment Accounts'}</span>
          </button>
        </div>
      </div>

      {/* 4. Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search business name, contact person, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: `All (${sponsors.length})` },
            { id: 'EXPIRED', label: `⚠️ Payment Due (${summary?.expiredTrials ?? 0})` },
            { id: 'TRIAL', label: `🎁 Active Trials (${summary?.activeTrials ?? 0})` },
            { id: 'PAID', label: `✅ Paid Active (${summary?.paidActive ?? 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Sponsors Table / Cards */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
          <Megaphone className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-300">No sponsors found</h4>
          <p className="text-xs text-slate-500 mt-1">Try clearing your filters or create a new sponsor.</p>
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[950px]">
              <thead className="bg-slate-800/80 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-700/60">
                <tr>
                  <th className="py-3 px-4">Sponsor Business</th>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">14-Day Trial & Expiry Status</th>
                  <th className="py-3 px-4">Website Banner</th>
                  <th className="py-3 px-4">Payments</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((s) => {
                  const isTrialActive = s.effectiveStatus === 'TRIAL_ACTIVE';
                  const isTrialExpired = s.effectiveStatus === 'TRIAL_EXPIRED';
                  const isPaidActive = s.effectiveStatus === 'PAID_ACTIVE';
                  const isPaidExpired = s.effectiveStatus === 'PAID_EXPIRED';

                  return (
                    <tr key={s.id} className="hover:bg-slate-850/50 transition-colors">
                      {/* Business Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-3">
                          {/* Photo Thumbnail */}
                          <div className="relative group shrink-0">
                            {s.imageUrl ? (
                              <button
                                type="button"
                                onClick={() => setViewPhotoUrl({ url: s.imageUrl!, title: s.businessName })}
                                className="w-12 h-12 rounded-xl overflow-hidden border border-slate-700 bg-slate-800 cursor-pointer group-hover:border-blue-500 transition shadow block relative"
                                title="Click to view full photo"
                              >
                                <img
                                  src={s.imageUrl}
                                  alt={s.businessName}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                  <Eye className="w-4 h-4 text-white" />
                                </div>
                              </button>
                            ) : (
                              <div className="w-12 h-12 rounded-xl border border-dashed border-slate-700 bg-slate-800/60 flex flex-col items-center justify-center text-slate-500">
                                <ImageIcon className="w-5 h-5 text-slate-500" />
                              </div>
                            )}

                            {/* Quick upload / change photo button */}
                            <label className="block mt-1 text-[10px] text-blue-400 hover:text-blue-300 cursor-pointer text-center font-medium">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingSponsorId === s.id}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handlePhotoUploadForExistingSponsor(s.id, file);
                                }}
                              />
                              {uploadingSponsorId === s.id ? (
                                <span className="text-amber-400">Saving...</span>
                              ) : s.imageUrl ? (
                                'Change'
                              ) : (
                                '+ Photo'
                              )}
                            </label>
                          </div>

                          <div className="min-w-0">
                            <div className="font-bold text-white text-sm">{s.businessName}</div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-semibold border border-slate-700">
                                {s.categoryLabel}
                              </span>
                              <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                                {s.placementSlot}
                              </span>
                            </div>
                            {s.websiteUrl && (
                              <a
                                href={s.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 mt-1"
                              >
                                <span>Visit Link / Page</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200">{s.contactPerson}</div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-0.5">
                          <PhoneCall className="w-3 h-3 text-emerald-400 shrink-0" />
                          <a href={`tel:${s.phone}`} className="hover:text-white">
                            {s.phone}
                          </a>
                        </div>
                        {s.email && (
                          <div className="text-slate-500 text-[10px] mt-0.5 truncate max-w-[150px]">
                            {s.email}
                          </div>
                        )}
                      </td>

                      {/* Expiration Tracker & Countdown */}
                      <td className="py-3.5 px-4">
                        {isTrialActive && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              <Sparkles className="w-3 h-3 text-cyan-300" />
                              <span>Free Trial: {s.daysRemaining} days left</span>
                            </span>
                            <div className="text-[10px] text-slate-400 mt-1">
                              Expires on: <strong>{new Date(s.trialEndsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                            </div>
                          </div>
                        )}

                        {isTrialExpired && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              <span>⚠️ Trial Expired ({s.daysOverdue}d ago)</span>
                            </span>
                            <div className="text-[10px] text-amber-400 font-bold mt-1">
                              Payment Due: ₱3,000 / month
                            </div>
                          </div>
                        )}

                        {isPaidActive && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                              <span>✅ Paid Active ({s.daysRemaining}d left)</span>
                            </span>
                            <div className="text-[10px] text-slate-400 mt-1">
                              Valid until:{' '}
                              <strong>
                                {s.paidUntil ? new Date(s.paidUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                              </strong>
                            </div>
                          </div>
                        )}

                        {isPaidExpired && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-red-500/20 text-red-300 border border-red-500/40">
                              <AlertTriangle className="w-3 h-3 text-red-400" />
                              <span>⚠️ Subscription Overdue</span>
                            </span>
                            <div className="text-[10px] text-red-400 font-bold mt-1">
                              Renewal Due: ₱3,000
                            </div>
                          </div>
                        )}

                        {/* Quick Edit Days Left / Custom Expiration Button */}
                        <div className="mt-1.5">
                          <button
                            type="button"
                            onClick={() => openEditDaysModal(s)}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 px-2 py-0.5 rounded-md border border-cyan-500/30 transition shadow-sm"
                            title="Edit remaining days or change expiration date"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit Days Left</span>
                          </button>
                        </div>
                      </td>

                      {/* Banner Display Toggle */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleActive(s)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                            s.isActiveOnWebsite
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {s.isActiveOnWebsite ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span>{s.isActiveOnWebsite ? 'Live on Site' : 'Hidden'}</span>
                        </button>
                      </td>

                      {/* Payment History Link */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => setHistoryModalSponsor(s)}
                          className="text-[11px] text-slate-300 hover:text-white font-medium flex items-center gap-1"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{s.paymentHistory?.length || 0} payment(s)</span>
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* 1. Record Payment Button */}
                          <button
                            onClick={() => {
                              setPaymentModalSponsor(s);
                              setPaymentForm({
                                amount: 3000,
                                method: 'GCASH',
                                referenceNo: '',
                                daysToAdd: 30,
                                notes: '',
                              });
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
                            title="Record ₱3,000 payment from sponsor"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Record Pay</span>
                          </button>

                          {/* 2. Send Reminder Button */}
                          <button
                            onClick={() => setReminderModalSponsor(s)}
                            className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs px-2.5 py-1.5 rounded-xl border border-slate-700 transition-all flex items-center gap-1"
                            title="Send GCash / Payment Reminder"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Remind</span>
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteSponsor(s)}
                            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                            title="Delete sponsor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: RECORD PAYMENT (₱3,000 via GCash, Maya, Bank, Cash) */}
      {paymentModalSponsor && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setPaymentModalSponsor(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-xs font-black text-emerald-400 uppercase tracking-wider mb-1">
                <CreditCard className="w-4 h-4" />
                <span>Record Sponsor Subscription Payment</span>
              </div>
              <h3 className="text-xl font-black text-white">{paymentModalSponsor.businessName}</h3>
              <p className="text-xs text-slate-400 mt-1">
                Recording a payment automatically sets status to <strong>PAID ACTIVE</strong> and adds days to banner display.
              </p>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              {/* Payment Amount & Days */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Amount Received (PHP) *
                  </label>
                  <input
                    type="number"
                    required
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-black text-emerald-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Extension Duration *
                  </label>
                  <select
                    value={paymentForm.daysToAdd}
                    onChange={(e) => setPaymentForm({ ...paymentForm, daysToAdd: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value={30}>+1 Month (30 Days)</option>
                    <option value={60}>+2 Months (60 Days)</option>
                    <option value={90}>+3 Months (90 Days)</option>
                    <option value={180}>+6 Months (180 Days)</option>
                    <option value={365}>+1 Year (365 Days)</option>
                  </select>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Payment Method *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'GCASH', label: 'GCash' },
                    { id: 'MAYA', label: 'Maya' },
                    { id: 'BANK_TRANSFER', label: 'Bank (BDO)' },
                    { id: 'CASH', label: 'Cash / Office' },
                  ].map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setPaymentForm({ ...paymentForm, method: m.id as any })}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                        paymentForm.method === m.id
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Reference / Receipt Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GCash Ref # 100293848123 or BDO Deposit slip"
                  value={paymentForm.referenceNo}
                  onChange={(e) => setPaymentForm({ ...paymentForm, referenceNo: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid in full for December 2026 banner"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentModalSponsor(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirm & Activate Subscription</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SEND PAYMENT REMINDER (PRE-WRITTEN MESSAGE WITH GCASH DETAILS) */}
      {reminderModalSponsor && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setReminderModalSponsor(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wider mb-1">
                <MessageCircle className="w-4 h-4" />
                <span>Send Payment Collection Reminder</span>
              </div>
              <h3 className="text-xl font-black text-white">{reminderModalSponsor.businessName}</h3>
              <p className="text-xs text-slate-400 mt-1">
                Contact: <strong className="text-white">{reminderModalSponsor.contactPerson}</strong> ({reminderModalSponsor.phone})
              </p>
            </div>

            {/* Ready-to-copy message */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Pre-Written Reminder Message:
              </label>
              {(() => {
                const reminderText = `Good day ${reminderModalSponsor.contactPerson}! This is Custoworks Car Rental Naga City.\n\nYour 14-day free trial banner on our website (custoworkscarrental.online) for ${reminderModalSponsor.businessName} is expiring/due for renewal.\n\nTo keep your banner active and reaching over 5,000+ monthly incoming tourists and car renters in Naga City:\n• Monthly Sponsor Fee: ₱3,000 / month\n• GCash: 0995 382 7972 (Jericho Oclares) | Maya: 0961 722 5326\n• Bank Transfer: BDO Naga\n• Or visit our Naga Garage beside SM City Naga.\n\nOnce paid, please reply with your screenshot or reference number so we can extend your active banner immediately. Thank you!`;

                return (
                  <div className="space-y-3">
                    <textarea
                      readOnly
                      rows={9}
                      value={reminderText}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-300 font-mono leading-relaxed"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={() => copyToClipboard(reminderText, 'reminder-msg')}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
                      >
                        {copiedText === 'reminder-msg' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedText === 'reminder-msg' ? 'Copied to Clipboard!' : 'Copy Message'}</span>
                      </button>

                      <a
                        href={`sms:${reminderModalSponsor.phone}?body=${encodeURIComponent(reminderText)}`}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all text-center"
                      >
                        <Send className="w-4 h-4" />
                        <span>Open in SMS / Messenger</span>
                      </a>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PAYMENT HISTORY */}
      {historyModalSponsor && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setHistoryModalSponsor(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-black text-white">Payment Ledger</h3>
              <p className="text-xs text-slate-400">{historyModalSponsor.businessName}</p>
            </div>

            {historyModalSponsor.paymentHistory && historyModalSponsor.paymentHistory.length > 0 ? (
              <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto">
                {historyModalSponsor.paymentHistory.map((pm) => (
                  <div key={pm.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-sm text-emerald-400">₱{pm.amount.toLocaleString()}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {pm.method} • Ref: <span className="text-slate-200">{pm.referenceNo}</span>
                      </div>
                      {pm.notes && <div className="text-[10px] text-slate-500 mt-0.5 italic">{pm.notes}</div>}
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-300">+{pm.daysAdded} days</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(pm.paidAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No payment history yet (currently in free trial).</p>
            )}
          </div>
        </div>
      )}

      {/* MODAL 4: ADD NEW SPONSOR */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setAddModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-black text-white">Add New Sponsor Partner</h3>
              <p className="text-xs text-slate-400 mt-1">
                Starts with an automatic <strong>14-day free trial</strong> (₱3,000/mo thereafter).
              </p>
            </div>

            <form onSubmit={handleCreateSponsor} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Villa Caceres Hotel"
                    value={newSponsorForm.businessName}
                    onChange={(e) => setNewSponsorForm({ ...newSponsorForm, businessName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={newSponsorForm.category}
                    onChange={(e) => setNewSponsorForm({ ...newSponsorForm, category: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="HOTEL">Hotels & Lodging</option>
                    <option value="FOOD">Restaurants & Cafes</option>
                    <option value="ADVENTURE">Tours & Adventure</option>
                    <option value="AUTOCARE">Auto Care & Gas</option>
                    <option value="RETAIL">Pasalubong & Shopping</option>
                    <option value="OTHER">Other Partner</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Juan Dela Cruz"
                    value={newSponsorForm.contactPerson}
                    onChange={(e) => setNewSponsorForm({ ...newSponsorForm, contactPerson: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0917 123 4567"
                    value={newSponsorForm.phone}
                    onChange={(e) => setNewSponsorForm({ ...newSponsorForm, phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Facebook Page or Website Link
                </label>
                <input
                  type="text"
                  placeholder="https://facebook.com/..."
                  value={newSponsorForm.websiteUrl}
                  onChange={(e) => setNewSponsorForm({ ...newSponsorForm, websiteUrl: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Location / Address
                </label>
                <input
                  type="text"
                  placeholder="Magsaysay Ave, Naga City"
                  value={newSponsorForm.location}
                  onChange={(e) => setNewSponsorForm({ ...newSponsorForm, location: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Photo Upload Attachment */}
              <div className="border border-slate-800 bg-slate-800/40 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Sponsor Photo / Logo / Storefront
                  </label>
                  <span className="text-[10px] text-slate-500">Optional</span>
                </div>

                {newSponsorPhotoPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black/40">
                    <img
                      src={newSponsorPhotoPreview}
                      alt="Preview"
                      className="w-full h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setNewSponsorPhotoFile(null);
                        setNewSponsorPhotoPreview(null);
                      }}
                      className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-600 text-white p-1.5 rounded-lg text-xs font-bold shadow flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-900/50 hover:bg-slate-900 transition text-center group">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewSponsorPhotoFile(file);
                          const reader = new FileReader();
                          reader.onload = () => setNewSponsorPhotoPreview(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-400 mb-1.5 transition" />
                    <span className="text-xs font-semibold text-slate-300 group-hover:text-white">
                      Click to attach photo / banner logo
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      PNG, JPG, WebP up to 10MB
                    </span>
                  </label>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  disabled={isSubmittingNewSponsor}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewSponsor}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmittingNewSponsor && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmittingNewSponsor ? 'Uploading & Creating...' : 'Create Sponsor (Start 14-Day Trial)'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: FULL PHOTO VIEWER */}
      {viewPhotoUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setViewPhotoUrl(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl p-4 max-w-2xl w-full shadow-2xl relative space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-400" />
                <h4 className="font-bold text-white text-sm">{viewPhotoUrl.title} - Sponsor Photo</h4>
              </div>
              <button
                onClick={() => setViewPhotoUrl(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[70vh]">
              <img
                src={viewPhotoUrl.url}
                alt={viewPhotoUrl.title}
                className="max-h-[70vh] w-auto max-w-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <a
                href={viewPhotoUrl.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open original image in new tab</span>
              </a>
              <button
                onClick={() => setViewPhotoUrl(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 6: EDIT DAYS LEFT / CUSTOM EXPIRATION */}
      {editDaysModalSponsor && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setEditDaysModalSponsor(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-xs font-black text-cyan-400 uppercase tracking-wider mb-1">
                <Edit3 className="w-4 h-4" />
                <span>Adjust Expiration & Days Left</span>
              </div>
              <h3 className="text-xl font-black text-white">{editDaysModalSponsor.businessName}</h3>
              <p className="text-xs text-slate-400 mt-1">
                Manually edit how many days remain before this sponsor's banner expires.
              </p>
            </div>

            <form onSubmit={handleSaveDaysAdjustment} className="space-y-4">
              {/* Subscription Tier Toggle */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Subscription Tier
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditSubscriptionType('PAID')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                      editSubscriptionType === 'PAID'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    💎 Paid Partner (₱3k/mo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditSubscriptionType('TRIAL')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                      editSubscriptionType === 'TRIAL'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    ✨ Free Trial (14 Days)
                  </button>
                </div>
              </div>

              {/* Days Left Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Days Left (Count Down)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="3650"
                    required
                    value={editDaysValue}
                    onChange={(e) => handleDaysValueChange(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-lg font-black text-white focus:outline-none focus:border-cyan-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    days left
                  </span>
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Quick Presets:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: '7 Days', days: 7 },
                    { label: '14 Days', days: 14 },
                    { label: '30 Days (1m)', days: 30 },
                    { label: '60 Days (2m)', days: 60 },
                    { label: '90 Days (3m)', days: 90 },
                    { label: '180 Days (6m)', days: 180 },
                    { label: '365 Days (1y)', days: 365 },
                    { label: 'Expired (0d)', days: 0 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleDaysValueChange(p.days)}
                      className={`text-[10px] font-semibold py-1.5 px-2 rounded-lg border transition ${
                        editDaysValue === p.days
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculated Expiration Date Picker */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Calculated Expiration Date
                </label>
                <input
                  type="date"
                  required
                  value={editExpiryDate}
                  onChange={(e) => handleExpiryDateChange(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Changing the date or days will automatically synchronize both.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditDaysModalSponsor(null)}
                  disabled={isSavingDays}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDays}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-cyan-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSavingDays && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSavingDays ? 'Saving...' : 'Save Days Left'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
