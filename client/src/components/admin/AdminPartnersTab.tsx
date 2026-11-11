import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { TieUpAgreementModal } from '../TieUpAgreementModal';
import {
  Car,
  Users,
  PhoneCall,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Percent,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Save,
  Loader2,
  DollarSign,
  ChevronDown,
  FileText,
  FileSignature,
  Printer,
  Trash2,
} from 'lucide-react';

interface PartnerApplication {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  vehicleMake: string;
  vehicleModel: string;
  year: number;
  transmission: string;
  category: string;
  plateNumber: string | null;
  rentalTypePreference: string;
  color?: string | null;
  chassisVin?: string | null;
  engineNumber?: string | null;
  gpsBrandImei?: string | null;
  insurancePolicy?: string | null;
  agreementAccepted?: boolean;
  partnerSharePercent: number | string;
  custoworksFeePercent: number | string;
  status: 'PENDING' | 'CONTACTED' | 'APPROVED' | 'REJECTED';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const AdminPartnersTab: React.FC = () => {
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<{ [id: string]: string }>({});
  const [selectedAppForAgreement, setSelectedAppForAgreement] = useState<PartnerApplication | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchApplications = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api.get<{ applications: PartnerApplication[] }>('/partners/applications', {
        forceRefresh: true,
      });
      const list = Array.isArray(res?.applications) ? res.applications : [];
      setApplications(list);
      const initialNotes: { [id: string]: string } = {};
      list.forEach((a) => {
        initialNotes[a.id] = a.notes || '';
      });
      setEditingNotes(initialNotes);
    } catch (err: any) {
      console.error('Failed to load partner applications:', err);
      setLoadError(err?.message || 'Failed to load partner applications. Please click Refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      await api.patch(`/partners/applications/${id}/status`, {
        status: newStatus,
        notes: editingNotes[id] || null,
      });
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: newStatus as any } : app))
      );
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveNotes = async (id: string) => {
    setUpdatingId(id);
    try {
      await api.patch(`/partners/applications/${id}/status`, {
        notes: editingNotes[id] || null,
      });
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, notes: editingNotes[id] } : app))
      );
      alert('Partner notes saved.');
    } catch (err) {
      console.error('Failed to save notes:', err);
      alert('Failed to save notes.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeletePartner = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the partner application for "${name}"?`)) {
      return;
    }
    setUpdatingId(id);
    try {
      await api.delete(`/partners/applications/${id}`);
      setApplications((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete partner application.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = applications.filter((app) => {
    if (statusFilter !== 'ALL' && app.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        app.fullName.toLowerCase().includes(q) ||
        app.phone.toLowerCase().includes(q) ||
        app.vehicleMake.toLowerCase().includes(q) ||
        app.vehicleModel.toLowerCase().includes(q) ||
        (app.plateNumber && app.plateNumber.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const counts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === 'PENDING').length,
    contacted: applications.filter((a) => a.status === 'CONTACTED').length,
    approved: applications.filter((a) => a.status === 'APPROVED').length,
    rejected: applications.filter((a) => a.status === 'REJECTED').length,
  };

  const formatCleanPhone = (p: string) => {
    const digits = p.replace(/\D/g, '');
    if (digits.startsWith('09')) return `639${digits.slice(2)}`;
    if (digits.startsWith('63')) return digits;
    return `63${digits}`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20">
              Fleet Consignment Program
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs font-bold text-emerald-400">80% Owner / 20% Custoworks Fee</span>
          </div>
          <h2 className="text-2xl font-black mt-2">Tie-Up Fleet & Partner Applications</h2>
          <p className="text-xs text-slate-400 mt-1">
            Review vehicle owner consignment applications, schedule garage inspections, and coordinate contracts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchApplications}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <a
            href="/partner"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View Public Partner Page
          </a>
        </div>
      </div>

      {/* Error Notice */}
      {loadError && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={fetchApplications}
            className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { id: 'ALL', label: 'All Inquiries', count: counts.all, color: 'text-slate-200 bg-slate-800/80 border-slate-700' },
          { id: 'PENDING', label: 'Pending Review', count: counts.pending, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
          { id: 'CONTACTED', label: 'Contacted / Meeting', count: counts.contacted, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
          { id: 'APPROVED', label: 'Approved Fleet', count: counts.approved, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
          { id: 'REJECTED', label: 'Declined', count: counts.rejected, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`p-3 rounded-xl border text-left transition-all ${tab.color} ${
              statusFilter === tab.id ? 'ring-2 ring-blue-500 scale-[1.02]' : 'opacity-80 hover:opacity-100'
            }`}
          >
            <p className="text-[11px] font-semibold opacity-75">{tab.label}</p>
            <p className="text-xl font-black mt-0.5">{tab.count}</p>
          </button>
        ))}
      </div>

      {/* 3. Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by owner name, phone, vehicle model or plate..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 4. Applications List */}
      {loading ? (
        <div className="py-16 text-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-xs">Loading partner applications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <Car className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">No partner applications found</h3>
          <p className="text-xs text-slate-500 mt-1">
            {search ? 'Try adjusting your search criteria.' : 'New applications will appear here as vehicle owners apply.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => (
            <div
              key={app.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all space-y-4"
            >
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-white">{app.fullName}</h3>
                    <span className="text-xs text-slate-400">• {app.city}</span>
                    <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                      Applied {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1">
                    <span className="text-slate-400">Phone: <strong className="text-white">{app.phone}</strong></span>
                    <span className="text-slate-400">Email: <strong className="text-white">{app.email}</strong></span>
                  </div>
                </div>

                {/* Status Selector & Split Badge */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-lg text-xs font-bold">
                    80% Partner / 20% Custoworks
                  </div>
                  <select
                    value={app.status}
                    disabled={updatingId === app.id}
                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    className={`text-xs font-bold rounded-lg px-3 py-1.5 border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      app.status === 'PENDING'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : app.status === 'CONTACTED'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        : app.status === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    <option value="PENDING" className="bg-slate-900 text-amber-300">PENDING</option>
                    <option value="CONTACTED" className="bg-slate-900 text-blue-300">CONTACTED</option>
                    <option value="APPROVED" className="bg-slate-900 text-emerald-300">APPROVED</option>
                    <option value="REJECTED" className="bg-slate-900 text-rose-300">REJECTED</option>
                  </select>
                </div>
              </div>

              {/* Vehicle Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 text-xs">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Vehicle Unit</p>
                  <p className="font-extrabold text-white mt-0.5">
                    {app.year} {app.vehicleMake} {app.vehicleModel}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Category & Transmission</p>
                  <p className="font-bold text-slate-300 mt-0.5">
                    {app.category.replace('_', '/')} • {app.transmission === 'AT' ? 'Automatic (AT)' : 'Manual (MT)'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Plate / Conduction #</p>
                  <p className="font-bold text-slate-300 mt-0.5">
                    {app.plateNumber || 'To Be Provided'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Rental Preference</p>
                  <p className="font-bold text-emerald-400 mt-0.5">
                    {app.rentalTypePreference === 'SELF_DRIVE' ? 'Self-Drive (Higher Utilization)' : 'With-Driver'}
                  </p>
                </div>
              </div>

              {/* Schedule A Fleet Details (If provided) */}
              {(app.color || app.chassisVin || app.engineNumber || app.gpsBrandImei || app.insurancePolicy) && (
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-400">
                  {app.color && (
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500">Color: </span>
                      <strong className="text-slate-200">{app.color}</strong>
                    </div>
                  )}
                  {app.chassisVin && (
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500">VIN: </span>
                      <strong className="text-slate-200">{app.chassisVin}</strong>
                    </div>
                  )}
                  {app.gpsBrandImei && (
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500">GPS: </span>
                      <strong className="text-slate-200">{app.gpsBrandImei}</strong>
                    </div>
                  )}
                  {app.insurancePolicy && (
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500">Policy: </span>
                      <strong className="text-slate-200">{app.insurancePolicy}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Communication, Notes & Print Agreement */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-1">
                <div className="flex-1 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingNotes[app.id] ?? ''}
                      onChange={(e) => setEditingNotes({ ...editingNotes, [app.id]: e.target.value })}
                      placeholder="Add dispatch notes (e.g. scheduled for inspection Friday 2PM)..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => handleSaveNotes(app.id)}
                      disabled={updatingId === app.id}
                      title="Save Staff Notes"
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Actions: View Agreement, Call, WhatsApp */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedAppForAgreement(app)}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
                    title="Generate and Print Pre-Filled 3-Page Consignment Agreement"
                  >
                    <FileSignature className="w-3.5 h-3.5 text-slate-950" /> Print Agreement
                  </button>

                  <a
                    href={`tel:${app.phone}`}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-slate-700"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-blue-400" /> Call
                  </a>
                  <a
                    href={`https://wa.me/${formatCleanPhone(app.phone)}?text=Hello%20${encodeURIComponent(
                      app.fullName
                    )},%20this%20is%20Custoworks%20Car%20Rental%20Naga%20City%20regarding%20your%20Tie-Up%20Partner%20application%20for%20your%20${encodeURIComponent(
                      `${app.year} ${app.vehicleMake} ${app.vehicleModel}`
                    )}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600/90 hover:bg-emerald-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                  </a>

                  <button
                    onClick={() => handleDeletePartner(app.id, app.fullName)}
                    disabled={updatingId === app.id}
                    className="bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 p-2 rounded-lg border border-slate-700 transition-colors"
                    title="Delete Partner Application"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tie-Up Consignment Agreement Modal for Printing / Review */}
      {selectedAppForAgreement && (
        <TieUpAgreementModal
          isOpen={!!selectedAppForAgreement}
          onClose={() => setSelectedAppForAgreement(null)}
          partnerDetails={{
            fullName: selectedAppForAgreement.fullName,
            phone: selectedAppForAgreement.phone,
            email: selectedAppForAgreement.email,
            city: selectedAppForAgreement.city,
            vehicleMake: selectedAppForAgreement.vehicleMake,
            vehicleModel: selectedAppForAgreement.vehicleModel,
            year: selectedAppForAgreement.year,
            transmission: selectedAppForAgreement.transmission,
            category: selectedAppForAgreement.category,
            plateNumber: selectedAppForAgreement.plateNumber || undefined,
            color: selectedAppForAgreement.color || undefined,
            chassisVin: selectedAppForAgreement.chassisVin || undefined,
            engineNumber: selectedAppForAgreement.engineNumber || undefined,
            gpsBrandImei: selectedAppForAgreement.gpsBrandImei || undefined,
            insurancePolicy: selectedAppForAgreement.insurancePolicy || undefined,
            partnerSharePercent: selectedAppForAgreement.partnerSharePercent,
            custoworksFeePercent: selectedAppForAgreement.custoworksFeePercent,
          }}
        />
      )}
    </div>
  );
};
