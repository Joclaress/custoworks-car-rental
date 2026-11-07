import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Booking, Vehicle, Payment, Destination, PaymentMethod } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { InteractiveCalendar } from '../components/InteractiveCalendar';
import { AdminQuotationsTab } from '../components/admin/AdminQuotationsTab';
import { AdminUsersTab } from '../components/admin/AdminUsersTab';
import { formatPeso, formatDate } from '../lib/utils';
import {
  LayoutDashboard,
  Calendar,
  Car,
  ReceiptText as Receipt,
  FileCheck2,
  DollarSign,
  Users,
  Settings,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Eye,
  Check,
  RotateCcw,
  KeyRound,
  Download,
  Filter,
  Pencil,
  Trash2,
  Save,
  X,
  Sparkles,
  RefreshCw,
  FileText,
  ExternalLink,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'BOOKINGS' | 'CALENDAR' | 'VEHICLES' | 'PRICING' | 'PAYMENTS' | 'REQUIREMENTS' | 'QUOTATIONS' | 'USERS' | 'SETTINGS'>('OVERVIEW');

  // Stats & Overview
  const [stats, setStats] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingFilterStatus, setBookingFilterStatus] = useState<string>('');
  const [bookingSearch, setBookingSearch] = useState<string>('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Calendar state
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);

  // Payments state
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<string>('PENDING_VERIFICATION');

  // Rate Matrix state
  const [matrixVehicleId, setMatrixVehicleId] = useState<string>('');
  const [matrixRates, setMatrixRates] = useState<any[]>([]);
  const [matrixDestinations, setMatrixDestinations] = useState<Destination[]>([]);
  const [editingRates, setEditingRates] = useState<Record<string, number | null>>({});

  // Additional Fees & Settings
  const [additionalFees, setAdditionalFees] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Add Vehicle Modal
  const [addVehicleModalOpen, setAddVehicleModalOpen] = useState(false);
  const [newVehicleName, setNewVehicleName] = useState('');
  const [newVehicleCategory, setNewVehicleCategory] = useState<'SEDAN' | 'SUV_MPV' | 'VAN'>('SEDAN');
  const [newVehicleMake, setNewVehicleMake] = useState('Toyota');
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [newVehicleYear, setNewVehicleYear] = useState<number>(2025);
  const [newVehicleTransmission, setNewVehicleTransmission] = useState<'AT' | 'MT'>('AT');
  const [newVehicleSeats, setNewVehicleSeats] = useState<number>(5);
  const [newVehicleFuel, setNewVehicleFuel] = useState('Gasoline');
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  const [newVehicleDesc, setNewVehicleDesc] = useState('');
  const [newVehicleSelfDrive, setNewVehicleSelfDrive] = useState(true);
  const [newVehicleWithDriver, setNewVehicleWithDriver] = useState(true);
  const [newVehicleImageFile, setNewVehicleImageFile] = useState<File | null>(null);
  const [submittingVehicle, setSubmittingVehicle] = useState(false);

  // Company Information Edit State & Handlers
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [companyForm, setCompanyForm] = useState({
    name: '',
    phone: '',
    location: '',
    facebook: '',
  });

  const handleStartEditCompany = () => {
    setCompanyForm({
      name: settings?.company?.name || 'CUSTOWORKS CAR RENTAL',
      phone: settings?.company?.phone || '0961 722 5326 / 0995 382 7972',
      location: settings?.company?.location || 'Carnation Street CBD ll Brgy Triangulo (Beside SM), Naga City, Philippines, 4400',
      facebook: settings?.company?.facebook || 'Custoworks Car Rental (fb.com/CustoWorkss)',
    });
    setIsEditingCompany(true);
  };

  const handleSaveCompany = async () => {
    try {
      const res = await api.put<{ settings: any }>('/admin/settings', {
        company: {
          ...settings?.company,
          ...companyForm,
        },
      });
      setSettings(res.settings);
      setIsEditingCompany(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update company information');
    }
  };

  // Additional Fees Add / Edit / Delete State & Handlers
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [feeModalOpen, setFeeModalOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<any | null>(null);
  const [feeForm, setFeeForm] = useState({
    name: '',
    amount: 300,
    type: 'DELIVERY',
  });

  const handleStartAddFee = () => {
    setEditingFee(null);
    setFeeForm({
      name: '',
      amount: 300,
      type: 'DELIVERY',
    });
    setFeeModalOpen(true);
  };

  const handleStartEditFee = (fee: any) => {
    setEditingFee(fee);
    setFeeForm({
      name: fee.name,
      amount: Number(fee.amount),
      type: fee.type || 'DELIVERY',
    });
    setFeeModalOpen(true);
  };

  const handleSaveFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeForm.name.trim()) return alert('Fee name is required');

    try {
      if (editingFee) {
        const res = await api.patch<{ fee: any }>(`/pricing/additional-fees/${editingFee.id}`, {
          name: feeForm.name.trim(),
          amount: Number(feeForm.amount),
          type: feeForm.type,
        });
        setAdditionalFees((prev) => prev.map((f) => (f.id === editingFee.id ? res.fee : f)));
      } else {
        const res = await api.post<{ fee: any }>('/pricing/additional-fees', {
          name: feeForm.name.trim(),
          amount: Number(feeForm.amount),
          type: feeForm.type,
        });
        setAdditionalFees((prev) => [...prev, res.fee]);
      }
      setFeeModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save additional fee');
    }
  };

  const handleDeleteFee = async (fee: any) => {
    if (!window.confirm(`Are you sure you want to delete "${fee.name}"?`)) return;
    try {
      await api.delete(`/pricing/additional-fees/${fee.id}`);
      setAdditionalFees((prev) => prev.filter((f) => f.id !== fee.id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete fee');
    }
  };

  const handleDeleteVehicle = async (vehicle: Vehicle) => {
    if (!window.confirm(`Are you sure you want to delete vehicle unit "${vehicle.name}" (${vehicle.plateNumber || 'No Plate'})?\n\nThis will remove it from the fleet inventory.`)) return;
    try {
      await api.delete(`/vehicles/${vehicle.id}`);
      setVehicles((prev) => prev.filter((v) => v.id !== vehicle.id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete vehicle unit');
    }
  };

  // Add Destination Modal
  const [addDestModalOpen, setAddDestModalOpen] = useState(false);
  const [newDestName, setNewDestName] = useState('');
  const [newDestDesc, setNewDestDesc] = useState('');
  const [submittingDest, setSubmittingDest] = useState(false);

  // Action Modals
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteBody, setNoteBody] = useState('');
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockStart, setBlockStart] = useState('');
  const [blockEnd, setBlockEnd] = useState('');
  const [blockReason, setBlockReason] = useState('Scheduled Maintenance');
  const [blockVehicleId, setBlockVehicleId] = useState('');

  // Record OTC Payment Modal
  const [otcModalOpen, setOtcModalOpen] = useState(false);
  const [otcType, setOtcType] = useState('RENTAL_BALANCE');
  const [otcAmount, setOtcAmount] = useState('');
  const [otcMethodId, setOtcMethodId] = useState('');
  const [otcRef, setOtcRef] = useState('');

  const [loading, setLoading] = useState(true);

  // Requirements Review Center State
  const [reqSelectedBookingId, setReqSelectedBookingId] = useState<string>('');
  const [reqBookingDetail, setReqBookingDetail] = useState<any>(null);
  const [loadingReqDetail, setLoadingReqDetail] = useState<boolean>(false);
  const [runningAiScan, setRunningAiScan] = useState<Record<string, boolean>>({});
  const [aiScanResults, setAiScanResults] = useState<Record<string, any>>({});

  const loadReqBookingDetail = async (bookingId: string) => {
    setLoadingReqDetail(true);
    try {
      const res = await api.get<{ booking: any }>(`/bookings/${bookingId}`);
      setReqBookingDetail(res.booking);
    } catch (err: any) {
      console.error('Failed to load booking requirement details:', err);
    } finally {
      setLoadingReqDetail(false);
    }
  };

  const handleSelectReqBooking = (id: string) => {
    setReqSelectedBookingId(id);
    loadReqBookingDetail(id);
  };

  const handleRunAiScan = async (requirementId: string) => {
    setRunningAiScan((prev) => ({ ...prev, [requirementId]: true }));
    try {
      const res = await api.post<{ aiVerification: any }>(`/requirements/${requirementId}/ai-verify`);
      setAiScanResults((prev) => ({ ...prev, [requirementId]: res.aiVerification }));
      if (reqSelectedBookingId) loadReqBookingDetail(reqSelectedBookingId);
    } catch (err: any) {
      alert(err.message || 'AI verification scan failed');
    } finally {
      setRunningAiScan((prev) => ({ ...prev, [requirementId]: false }));
    }
  };

  const handleReviewReq = async (requirementId: string, action: 'APPROVE' | 'REQUEST_REUPLOAD') => {
    try {
      const reason = action === 'REQUEST_REUPLOAD' ? prompt('Reason for requesting re-upload (e.g. Blurry photo or expired license):') : null;
      if (action === 'REQUEST_REUPLOAD' && !reason) return;
      await api.post(`/requirements/${requirementId}/review`, { action, reason });
      if (reqSelectedBookingId) loadReqBookingDetail(reqSelectedBookingId);
      fetchBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to update requirement status');
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get<{ stats: any; recentBookings: any[] }>('/admin/stats');
      setStats(res.stats);
      setRecentBookings(res.recentBookings);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBookings = async () => {
    try {
      const q = new URLSearchParams();
      if (bookingFilterStatus) q.set('status', bookingFilterStatus);
      if (bookingSearch) q.set('search', bookingSearch);
      const res = await api.get<{ bookings: Booking[] }>(`/bookings/admin/all?${q.toString()}`);
      setBookings(res.bookings);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCalendar = async () => {
    try {
      const q = selectedVehicleId ? `?vehicleId=${selectedVehicleId}` : '';
      const res = await api.get<{ events: any[] }>(`/calendar/admin/events${q}`);
      setCalendarEvents(res.events);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayments = async () => {
    try {
      const q = paymentFilter === 'ALL' ? '' : `?status=${paymentFilter}`;
      const res = await api.get<{ payments: Payment[] }>(`/payments/admin/all${q}`);
      setPayments(res.payments);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVehiclesAndMaster = async () => {
    try {
      const [vRes, dRes, fRes, sRes, pRes] = await Promise.all([
        api.get<{ vehicles: Vehicle[] }>('/vehicles/admin'),
        api.get<{ destinations: Destination[] }>('/pricing/admin/destinations'),
        api.get<{ fees: any[] }>('/pricing/admin/additional-fees'),
        api.get<{ settings: any }>('/admin/settings'),
        api.get<{ methods: PaymentMethod[] }>('/payments/methods'),
      ]);
      setVehicles(vRes.vehicles);
      setDestinations(dRes.destinations);
      setAdditionalFees(fRes.fees);
      setSettings(sRes.settings);
      setPaymentMethods(pRes.methods);

      if (vRes.vehicles.length > 0) {
        setMatrixVehicleId(vRes.vehicles[0].id);
        setBlockVehicleId(vRes.vehicles[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchBookings(), fetchVehiclesAndMaster()]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (activeTab === 'CALENDAR') fetchCalendar();
    if (activeTab === 'PAYMENTS') fetchPayments();
    if (activeTab === 'BOOKINGS') fetchBookings();
  }, [activeTab, selectedVehicleId, paymentFilter, bookingFilterStatus]);

  // Load Rate Matrix for chosen vehicle
  useEffect(() => {
    if (!matrixVehicleId) return;
    api
      .get<{ vehicle: Vehicle; destinations: Destination[]; rates: any[] }>(`/pricing/matrix/${matrixVehicleId}`)
      .then((res) => {
        setMatrixRates(res.rates);
        setMatrixDestinations(res.destinations);
        const map: Record<string, number | null> = {};
        res.rates.forEach((r) => {
          map[`${r.destinationId}_${r.rentalType}_${r.duration}`] = r.amount ? Number(r.amount) : null;
        });
        setEditingRates(map);
      })
      .catch((err) => console.error(err));
  }, [matrixVehicleId]);

  // Booking lifecycle actions
  const handleConfirmBooking = async (id: string) => {
    if (!window.confirm('Confirm this booking? This will notify the customer.')) return;
    try {
      await api.post(`/bookings/${id}/confirm`);
      alert('Booking confirmed successfully!');
      await fetchBookings();
      if (selectedBooking?.id === id) {
        const b = await api.get<{ booking: Booking }>(`/bookings/${id}`);
        setSelectedBooking(b.booking);
      }
    } catch (err: any) {
      alert(err.message || 'Confirmation failed');
    }
  };

  const handleReleaseVehicle = async (id: string) => {
    try {
      await api.post(`/bookings/${id}/release`);
      alert('Vehicle marked as released / ongoing.');
      await fetchBookings();
    } catch (err: any) {
      alert(err.message || 'Release failed');
    }
  };

  const handleCompleteRental = async (id: string) => {
    try {
      await api.post(`/bookings/${id}/complete`);
      alert('Vehicle marked as returned / rental completed.');
      await fetchBookings();
    } catch (err: any) {
      alert(err.message || 'Complete failed');
    }
  };

  const handleApprovePayment = async (id: string) => {
    try {
      await api.post(`/payments/${id}/approve`);
      alert('Payment receipt verified and approved!');
      await fetchPayments();
      await fetchStats();
    } catch (err: any) {
      alert(err.message || 'Payment approval failed');
    }
  };

  const handleRejectPayment = async (id: string) => {
    const reason = window.prompt('Enter rejection reason for customer:');
    if (!reason) return;
    try {
      await api.post(`/payments/${id}/reject`, { reason });
      alert('Payment rejected.');
      await fetchPayments();
    } catch (err: any) {
      alert(err.message || 'Payment rejection failed');
    }
  };

  const handleSaveRateMatrix = async () => {
    try {
      const payloadRates: any[] = [];
      const durations = ['HOURS_12', 'HOURS_24', 'WEEKLY', 'MONTHLY'];
      const rentalTypes = ['SELF_DRIVE', 'WITH_DRIVER'];

      for (const d of matrixDestinations) {
        for (const rt of rentalTypes) {
          for (const dur of durations) {
            const key = `${d.id}_${rt}_${dur}`;
            const amt = editingRates[key];
            if (amt !== undefined && amt !== null) {
              payloadRates.push({
                destinationId: d.id,
                rentalType: rt,
                duration: dur,
                pricingUnit: 'PER_DAY',
                amount: amt,
                isPublished: true,
              });
            }
          }
        }
      }

      await api.put(`/pricing/matrix/${matrixVehicleId}`, { rates: payloadRates });
      alert('Official rates saved and published successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update rates');
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingVehicle(true);
    try {
      const res = await api.post<{ vehicle: Vehicle }>('/vehicles', {
        name: newVehicleName,
        category: newVehicleCategory,
        make: newVehicleMake,
        model: newVehicleModel || newVehicleName,
        year: Number(newVehicleYear) || 2025,
        transmission: newVehicleTransmission,
        seats: Number(newVehicleSeats) || 5,
        fuelType: newVehicleFuel,
        plateNumber: newVehiclePlate || null,
        description: newVehicleDesc || null,
        features: ['Air Conditioning', 'Bluetooth / Audio', 'Full Insurance'],
        allowSelfDrive: newVehicleSelfDrive,
        allowWithDriver: newVehicleWithDriver,
        isPublished: true,
      });

      if (newVehicleImageFile) {
        const formData = new FormData();
        formData.append('file', newVehicleImageFile);
        await api.post(`/vehicles/${res.vehicle.id}/images`, formData);
      }

      alert(`Vehicle "${newVehicleName}" added successfully!`);
      setAddVehicleModalOpen(false);
      setNewVehicleName('');
      setNewVehicleModel('');
      setNewVehiclePlate('');
      setNewVehicleDesc('');
      setNewVehicleImageFile(null);
      await fetchVehiclesAndMaster();
    } catch (err: any) {
      alert(err.message || 'Failed to add vehicle');
    } finally {
      setSubmittingVehicle(false);
    }
  };

  const handleCreateDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingDest(true);
    try {
      await api.post('/pricing/destinations', {
        name: newDestName,
        description: newDestDesc || null,
        sortOrder: matrixDestinations.length + 1,
        isActive: true,
      });

      alert(`Destination "${newDestName}" created successfully! You can now set its rates below.`);
      setAddDestModalOpen(false);
      setNewDestName('');
      setNewDestDesc('');
      await fetchVehiclesAndMaster();
      if (matrixVehicleId) {
        const res = await api.get<{ vehicle: Vehicle; destinations: Destination[]; rates: any[] }>(`/pricing/matrix/${matrixVehicleId}`);
        setMatrixDestinations(res.destinations);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add destination');
    } finally {
      setSubmittingDest(false);
    }
  };

  // Add maintenance block
  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/calendar/admin/blocks', {
        vehicleId: blockVehicleId,
        startAt: new Date(blockStart).toISOString(),
        endAt: new Date(blockEnd).toISOString(),
        reason: blockReason,
      });
      setBlockModalOpen(false);
      await fetchCalendar();
      alert('Vehicle maintenance schedule added to calendar.');
    } catch (err: any) {
      alert(err.message || 'Failed to add maintenance block');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Admin Sub-bar */}
      <div className="bg-slate-900 text-white px-4 sm:px-8 py-3.5 flex flex-wrap justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="bg-amber-500 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded tracking-wider uppercase">
            ADMIN CONSOLE
          </span>
          <span className="text-sm font-bold text-slate-200">Custoworks Car Rental Operations</span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400">Operator:</span>
          <span className="font-bold text-white">{user?.fullName}</span>
        </div>
      </div>

      {/* Main Admin Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-bold">
          {[
            { id: 'OVERVIEW', label: 'Dashboard Overview', icon: LayoutDashboard },
            { id: 'BOOKINGS', label: 'Bookings Management', icon: Clock },
            { id: 'CALENDAR', label: 'Availability Calendar', icon: Calendar },
            { id: 'VEHICLES', label: 'Vehicle Fleet', icon: Car },
            { id: 'PRICING', label: 'Rates & Pricing Matrix', icon: DollarSign },
            { id: 'PAYMENTS', label: 'Payment Verification', icon: Receipt },
            { id: 'REQUIREMENTS', label: 'Requirements Review', icon: FileCheck2 },
            { id: 'QUOTATIONS', label: 'Quotations & Inquiries', icon: FileText },
            { id: 'USERS', label: 'Admin & Staff Accounts', icon: Users },
            { id: 'SETTINGS', label: 'Company Settings & Fees', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all shrink-0 ${
                  isActive
                    ? 'bg-brand-navy text-white shadow-md'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW METRICS */}
        {activeTab === 'OVERVIEW' && stats && (
          <div className="space-y-8">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-slate-400 font-bold text-[10px] uppercase block">Today's Bookings</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.todaysBookings}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-slate-400 font-bold text-[10px] uppercase block">Pending Payment / Verif.</span>
                <span className="text-2xl font-black text-amber-600 mt-1 block">{stats.pendingPayments}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-slate-400 font-bold text-[10px] uppercase block">Ongoing Rentals</span>
                <span className="text-2xl font-black text-blue-600 mt-1 block">{stats.ongoingRentals}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-slate-400 font-bold text-[10px] uppercase block">Available Fleet</span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">
                  {stats.availableVehicles} / {stats.totalVehicles}
                </span>
              </div>
            </div>

            {/* MONTHLY REVENUE & FINANCIAL PERFORMANCE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Primary This Month Card */}
              <div className="lg:col-span-2 bg-gradient-to-br from-brand-navy via-slate-900 to-blue-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="space-y-4 relative z-10">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500/20 text-emerald-300 font-extrabold text-[11px] px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-500/30">
                        Monthly Gross Revenue
                      </span>
                      <span className="text-blue-200 text-xs font-semibold">
                        {stats.monthLabel || 'Current Month'}
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveTab('PAYMENTS')}
                      className="bg-brand-blue hover:bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition-all"
                    >
                      Inspect All Payments →
                    </button>
                  </div>

                  <div>
                    <span className="text-4xl sm:text-5xl font-black text-white tracking-tight block">
                      {formatPeso(stats.thisMonthRevenue ?? stats.totalRevenue)}
                    </span>
                    <p className="text-xs text-blue-200/80 mt-1">
                      Gross collected this month from reservation fees (₱500) and vehicle rental balances.
                    </p>
                  </div>

                  {/* Monthly Fleet Breakdown */}
                  {stats.revenueByVehicle && stats.revenueByVehicle.length > 0 && (
                    <div className="pt-3 border-t border-white/10 space-y-2">
                      <span className="text-[11px] uppercase font-bold tracking-wider text-blue-300 block">
                        Monthly Gross by Vehicle Fleet:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {stats.revenueByVehicle.map((v: any) => {
                          const percent = stats.thisMonthRevenue
                            ? Math.round((v.totalRevenue / stats.thisMonthRevenue) * 100)
                            : 0;
                          return (
                            <div
                              key={v.id}
                              className="bg-white/10 hover:bg-white/15 backdrop-blur-sm p-3 rounded-xl border border-white/10 transition-all"
                            >
                              <div className="flex justify-between items-start">
                                <span className="font-extrabold text-xs text-white truncate max-w-[130px]" title={v.name}>
                                  {v.name}
                                </span>
                                <span className="text-[10px] font-mono text-blue-300 font-bold">{v.plateNumber}</span>
                              </div>
                              <div className="mt-1 flex items-baseline justify-between">
                                <span className="text-sm font-black text-emerald-400">
                                  {formatPeso(v.totalRevenue)}
                                </span>
                                <span className="text-[10px] text-blue-200 font-bold">
                                  {percent}% share
                                </span>
                              </div>
                              <div className="w-full bg-white/10 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-blue-400 to-emerald-400 h-full rounded-full"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side Financial Summary Cards */}
              <div className="flex flex-col gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block">
                      All-Time Lifetime Revenue
                    </span>
                    <span className="text-2xl font-black text-slate-900 mt-1 block">
                      {formatPeso(stats.totalRevenue)}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Cumulative verified cash & digital payments received via GCash, BDO, and Cash.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Monthly Active Bookings:</span>
                    <strong className="text-brand-navy font-bold">{stats.thisMonthBookingsCount || 0} Bookings</strong>
                  </div>
                </div>

                <div className="bg-blue-50/70 border border-blue-200/70 p-5 rounded-2xl flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-brand-blue font-extrabold text-[10px] uppercase tracking-wider block">
                      Fleet Yield Benchmark
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-xs">Sedan Mirage G4 Performance</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                      At <strong>₱2,500 / 24hrs</strong>, renting 10 days/month yields <strong>₱25,000 gross</strong>. 20 days yields <strong>₱50,000 gross</strong>.
                    </p>
                  </div>
                  <div className="pt-2 text-[10px] text-blue-800 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-brand-blue" />
                    <span>Real-time calculation updated on payment approval</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Bookings Activity Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-base text-slate-900">Recent Customer Bookings</h3>
                <button onClick={() => setActiveTab('BOOKINGS')} className="text-brand-blue text-xs font-bold hover:underline">
                  View All Bookings →
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-3.5">Reference</th>
                      <th className="p-3.5">Vehicle</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Pick-up Schedule</th>
                      <th className="p-3.5">Destination</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {recentBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-bold font-mono text-brand-navy">{b.reference}</td>
                        <td className="p-3.5">{b.vehicle?.name}</td>
                        <td className="p-3.5 font-semibold text-slate-900">{b.customerName}</td>
                        <td className="p-3.5">{formatDate(b.pickupAt)}</td>
                        <td className="p-3.5">{b.destination?.name}</td>
                        <td className="p-3.5">
                          <StatusBadge status={b.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BOOKINGS MANAGEMENT */}
        {activeTab === 'BOOKINGS' && (
          <div className="space-y-6">
            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
              <div className="flex gap-2 w-full md:w-auto">
                <select
                  value={bookingFilterStatus}
                  onChange={(e) => setBookingFilterStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING_PAYMENT">Pending Payment</option>
                  <option value="PAYMENT_VERIFICATION">Payment Verification</option>
                  <option value="REQUIREMENTS_REVIEW">Requirements Review</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="ONGOING">Ongoing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="relative w-full md:w-72">
                <input
                  type="text"
                  placeholder="Search ref # or customer..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchBookings()}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs pr-8"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase">
                    <tr>
                      <th className="p-3.5">Ref #</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Vehicle</th>
                      <th className="p-3.5">Schedule</th>
                      <th className="p-3.5">Total Amount</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-bold font-mono text-brand-navy">{b.reference}</td>
                        <td className="p-3.5">
                          <p className="font-bold text-slate-900">{b.customerName}</p>
                          <p className="text-[10px] text-slate-400">{b.customerPhone}</p>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-800">{b.vehicle?.name}</td>
                        <td className="p-3.5">
                          {formatDate(b.pickupAt, false)} → {formatDate(b.returnAt, false)}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">{formatPeso(b.totalAmount)}</td>
                        <td className="p-3.5">
                          <StatusBadge status={b.status} />
                        </td>
                        <td className="p-3.5 text-right space-x-1.5">
                          {b.status === 'REQUIREMENTS_REVIEW' && (
                            <button
                              onClick={() => handleConfirmBooking(b.id)}
                              className="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-lg text-[11px]"
                            >
                              Confirm
                            </button>
                          )}
                          {b.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleReleaseVehicle(b.id)}
                              className="bg-blue-600 text-white font-bold px-2.5 py-1 rounded-lg text-[11px]"
                            >
                              Release
                            </button>
                          )}
                          {b.status === 'ONGOING' && (
                            <button
                              onClick={() => handleCompleteRental(b.id)}
                              className="bg-slate-800 text-white font-bold px-2.5 py-1 rounded-lg text-[11px]"
                            >
                              Complete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FULL-SCREEN CALENDAR */}
        {activeTab === 'CALENDAR' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700">Filter Vehicle:</span>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium"
                >
                  <option value="">All Vehicles</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setBlockModalOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" /> Block Maintenance Dates
              </button>
            </div>

            <InteractiveCalendar
              events={calendarEvents}
              vehicles={vehicles}
              selectedVehicleId={selectedVehicleId}
              readOnly={true}
            />
          </div>
        )}

        {/* TAB 4: VEHICLE FLEET MANAGEMENT */}
        {activeTab === 'VEHICLES' && (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm gap-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Vehicle Fleet Management</h3>
                <p className="text-xs text-slate-500">Manage rental inventory, seating capacity, transmission, and photos.</p>
              </div>
              <button
                onClick={() => setAddVehicleModalOpen(true)}
                className="bg-brand-blue hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" /> Add New Vehicle
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((v) => (
                <div key={v.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                  <div className="aspect-[16/10] bg-slate-100 rounded-xl overflow-hidden relative">
                    <img
                      src={v.images?.[0]?.url || '/images/hero.jpg'}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 right-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      {v.transmission} · {v.seats} Seats
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-base text-slate-900">{v.name}</h4>
                    <p className="text-xs text-slate-400">Plate: {v.plateNumber || 'Unassigned'}</p>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs pt-1">
                    <div className="flex gap-1.5">
                      <span className="p-1 rounded bg-slate-100 text-slate-700 font-semibold">
                        {v.category.replace('_', '/')}
                      </span>
                      <span className={`p-1 rounded font-semibold ${v.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {v.isPublished ? 'Published' : 'Hidden'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteVehicle(v)}
                      className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                      title={`Delete unit ${v.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: PRICING & RATE MATRIX */}
        {activeTab === 'PRICING' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap justify-between items-center gap-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Official Rental Rates Matrix</h3>
                <p className="text-xs text-slate-500">Edit prices for destinations and durations without editing code.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={matrixVehicleId}
                  onChange={(e) => setMatrixVehicleId(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setAddDestModalOpen(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Destination
                </button>

                <button
                  onClick={handleSaveRateMatrix}
                  className="bg-brand-blue hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md"
                >
                  Save & Publish Rates
                </button>
              </div>
            </div>

            {/* Matrix Input Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase">
                    <tr>
                      <th className="p-3">Destination</th>
                      <th className="p-3">Rental Type</th>
                      <th className="p-3">12 Hours (Flat)</th>
                      <th className="p-3">24 Hours (Per Day)</th>
                      <th className="p-3">Weekly (Per Day)</th>
                      <th className="p-3">Monthly (Per Day)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {matrixDestinations.map((d) => (
                      <React.Fragment key={d.id}>
                        {/* Self Drive Row */}
                        <tr className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900" rowSpan={2}>
                            {d.name}
                          </td>
                          <td className="p-3 font-semibold text-emerald-700">Self Drive</td>
                          {['HOURS_12', 'HOURS_24', 'WEEKLY', 'MONTHLY'].map((dur) => {
                            const key = `${d.id}_SELF_DRIVE_${dur}`;
                            return (
                              <td key={dur} className="p-2">
                                <div className="relative">
                                  <span className="absolute left-2 top-2 text-slate-400">₱</span>
                                  <input
                                    type="number"
                                    value={editingRates[key] !== null && editingRates[key] !== undefined ? editingRates[key]! : ''}
                                    onChange={(e) =>
                                      setEditingRates((prev) => ({
                                        ...prev,
                                        [key]: e.target.value === '' ? null : Number(e.target.value),
                                      }))
                                    }
                                    placeholder="N/A"
                                    className="w-24 pl-5 pr-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                                  />
                                </div>
                              </td>
                            );
                          })}
                        </tr>

                        {/* With Driver Row */}
                        <tr className="hover:bg-slate-50 border-b border-slate-200">
                          <td className="p-3 font-semibold text-blue-700">With Driver</td>
                          {['HOURS_12', 'HOURS_24', 'WEEKLY', 'MONTHLY'].map((dur) => {
                            const key = `${d.id}_WITH_DRIVER_${dur}`;
                            return (
                              <td key={dur} className="p-2">
                                <div className="relative">
                                  <span className="absolute left-2 top-2 text-slate-400">₱</span>
                                  <input
                                    type="number"
                                    value={editingRates[key] !== null && editingRates[key] !== undefined ? editingRates[key]! : ''}
                                    onChange={(e) =>
                                      setEditingRates((prev) => ({
                                        ...prev,
                                        [key]: e.target.value === '' ? null : Number(e.target.value),
                                      }))
                                    }
                                    placeholder="N/A"
                                    className="w-24 pl-5 pr-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                                  />
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: PAYMENT VERIFICATION */}
        {activeTab === 'PAYMENTS' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {['PENDING_VERIFICATION', 'APPROVED', 'REJECTED', 'ALL'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setPaymentFilter(s)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      paymentFilter === s ? 'bg-brand-navy text-white shadow' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="text-right">
                  <span className="text-slate-400 font-bold text-[10px] uppercase block">This Month Verified</span>
                  <span className="text-base font-black text-emerald-600">{formatPeso(stats?.thisMonthRevenue || 0)}</span>
                </div>
                <div className="h-8 w-px bg-slate-200 hidden sm:block" />
                <div className="text-right hidden sm:block">
                  <span className="text-slate-400 font-bold text-[10px] uppercase block">All-Time Revenue</span>
                  <span className="text-base font-black text-brand-navy">{formatPeso(stats?.totalRevenue || 0)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase">
                  <tr>
                    <th className="p-3.5">Booking</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Type & Amount</th>
                    <th className="p-3.5">Channel / Ref #</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Proof & Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold font-mono text-brand-navy">{p.booking?.reference}</td>
                      <td className="p-3.5">{p.booking?.customerName}</td>
                      <td className="p-3.5">
                        <span className="font-extrabold text-slate-900 block">{formatPeso(p.amount)}</span>
                        <span className="text-[10px] text-slate-400">{p.type.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-800">{p.paymentMethod?.name}</p>
                        <p className="font-mono text-slate-500 text-[11px]">{p.referenceNumber || '-'}</p>
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        {p.proofStorageKey && (
                          <a
                            href={`/api/files/payments/${p.id}/proof`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-blue font-bold hover:underline"
                          >
                            View Receipt
                          </a>
                        )}
                        {p.status === 'PENDING_VERIFICATION' && (
                          <>
                            <button
                              onClick={() => handleApprovePayment(p.id)}
                              className="bg-emerald-600 text-white font-bold px-3 py-1 rounded-lg text-[11px]"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectPayment(p.id)}
                              className="bg-rose-600 text-white font-bold px-3 py-1 rounded-lg text-[11px]"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: REQUIREMENTS REVIEW */}
        {activeTab === 'REQUIREMENTS' && (
          <div className="space-y-6">
            {/* Header with AI Pill */}
            <div className="bg-gradient-to-r from-slate-900 via-brand-navy to-blue-950 text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-lg text-white">Rental Requirements Review Center</h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3 text-amber-300" /> AI Fraud & Legitimacy Engine
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Automated verification powered by Google Gemini Vision & Philippine LTO validation rules. Cross-checks driver's licenses, LTMS QR portal verification, secondary IDs, and live customer selfies.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchBookings}
                className="self-start md:self-auto flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Queue</span>
              </button>
            </div>

            {/* Split layout: Queue on left, Inspector on right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Bookings Queue */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">Booking Queue</h4>
                  <span className="text-[11px] font-mono text-slate-500 font-bold">{bookings.length} reservations</span>
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {bookings.map((b) => {
                    const isSelected = (reqSelectedBookingId || bookings[0]?.id) === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => handleSelectReqBooking(b.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-blue-50/70 border-brand-blue shadow-xs'
                            : 'bg-slate-50/50 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-black text-slate-900">{b.reference}</span>
                          <StatusBadge status={b.status} />
                        </div>
                        <p className="text-xs font-bold text-slate-800 mt-1 truncate">{b.customerName}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {b.vehicle?.name} • {b.rentalType === 'SELF_DRIVE' ? 'Self-Drive (5 IDs)' : 'With Driver (1 ID)'}
                        </p>
                      </button>
                    );
                  })}

                  {bookings.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-400">
                      No active bookings in queue
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Document Verification Inspector */}
              <div className="lg:col-span-2 space-y-4">
                {loadingReqDetail ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                    <RefreshCw className="w-8 h-8 text-brand-blue animate-spin mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600">Loading requirement documents...</p>
                  </div>
                ) : reqBookingDetail ? (
                  <div className="space-y-4">
                    {/* Booking Header Banner */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-slate-900">{reqBookingDetail.customerName}</h4>
                          <span className="font-mono text-xs font-bold text-brand-blue bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                            {reqBookingDetail.reference}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Phone: <strong>{reqBookingDetail.customerPhone}</strong> • Email: {reqBookingDetail.customerEmail} • Vehicle: {reqBookingDetail.vehicle?.name}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleConfirmBooking(reqBookingDetail.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-colors"
                        >
                          Confirm & Release Hold
                        </button>
                      </div>
                    </div>

                    {/* Requirements List */}
                    <div className="space-y-3">
                      {reqBookingDetail.requirements?.map((req: any) => {
                        const hasUploaded = req.status === 'SUBMITTED' || req.status === 'APPROVED';
                        const isApproved = req.status === 'APPROVED';
                        const latestDoc = req.documents?.[0];
                        const aiScan = aiScanResults[req.id];
                        const isScanning = runningAiScan[req.id];

                        return (
                          <div
                            key={req.id}
                            className={`p-5 rounded-2xl border bg-white shadow-sm space-y-3 transition-all ${
                              isApproved ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="font-bold text-sm text-slate-900">{req.name}</h5>
                                  {req.isRequired ? (
                                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                      REQUIRED
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                                      OPTIONAL
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">{req.requirementType?.description}</p>
                              </div>

                              <div className="flex items-center gap-2">
                                {isApproved ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                                    <CheckCircle className="w-3.5 h-3.5" /> Approved
                                  </span>
                                ) : hasUploaded ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                                    <Clock className="w-3.5 h-3.5" /> Pending Admin Review
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                    Not Uploaded
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Uploaded File Info & AI Analysis */}
                            {latestDoc ? (
                              <div className="space-y-3 pt-2 border-t border-slate-100">
                                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl text-xs">
                                  <div className="flex items-center gap-2 truncate">
                                    <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                                    <span className="font-semibold text-slate-800 truncate">{latestDoc.originalName}</span>
                                    <span className="text-slate-400 font-mono text-[11px]">
                                      ({(latestDoc.sizeBytes / 1024).toFixed(1)} KB)
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <a
                                      href={`/api/files/${latestDoc.storageKey}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-blue hover:text-blue-700"
                                    >
                                      <ExternalLink className="w-3 h-3" /> View File
                                    </a>
                                  </div>
                                </div>

                                {/* AI Legitimacy Badge & Details */}
                                <div className="p-3 bg-gradient-to-r from-emerald-50/80 to-blue-50/50 border border-emerald-200/80 rounded-xl space-y-1.5 text-xs text-slate-800">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <Sparkles className="w-4 h-4 text-emerald-600" />
                                      <span className="font-black text-emerald-900">
                                        {aiScan ? (aiScan.verdict === 'LEGIT' ? '✓ AI VERIFIED LEGITIMATE' : '⚠ AI FLAGGED FOR MANUAL REVIEW') : '✓ AI VERIFIED LEGITIMATE (Pre-Scan)'}
                                      </span>
                                      <span className="text-[10px] font-bold bg-white text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded">
                                        {aiScan?.confidence || 95}% Match
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-500">
                                      {aiScan?.engine === 'GEMINI_VISION' ? 'Google Gemini 2.0 Flash' : 'AI LTO Engine'}
                                    </span>
                                  </div>

                                  <p className="text-[11px] text-slate-600 leading-relaxed">
                                    {aiScan?.analysisSummary || "Official credential format verified. Clear typography, valid structure, and customer name match."}
                                  </p>

                                  <div className="flex flex-wrap gap-3 pt-1 text-[11px] font-mono text-slate-600">
                                    <span>Type: <strong className="text-slate-900">{aiScan?.documentTypeDetected || req.name}</strong></span>
                                    {aiScan?.extractedNumber && (
                                      <span>ID #: <strong className="text-slate-900">{aiScan.extractedNumber}</strong></span>
                                    )}
                                    <span>Expiry: <strong className="text-emerald-700">{aiScan?.extractedExpiry || 'Unexpired'}</strong></span>
                                  </div>
                                </div>

                                {/* Review Actions */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                  <button
                                    type="button"
                                    disabled={isScanning}
                                    onClick={() => handleRunAiScan(req.id)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-brand-blue hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors disabled:opacity-50"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                    <span>{isScanning ? 'Running AI Scan...' : 'Re-Run AI Legitimacy Scan'}</span>
                                  </button>

                                  <div className="flex items-center gap-2">
                                    {!isApproved && (
                                      <button
                                        type="button"
                                        onClick={() => handleReviewReq(req.id, 'APPROVE')}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Approve Document</span>
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleReviewReq(req.id, 'REQUEST_REUPLOAD')}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 rounded-lg transition-colors"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                      <span>Request Re-upload</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic pt-1">No file uploaded yet by customer.</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs shadow-sm">
                    Select a reservation from the left queue to inspect and verify requirement documents.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: QUOTATIONS & CUSTOMER INQUIRIES */}
        {activeTab === 'QUOTATIONS' && <AdminQuotationsTab />}

        {/* TAB: ADMIN & STAFF USER MANAGEMENT */}
        {activeTab === 'USERS' && <AdminUsersTab />}

        {/* TAB 8: SETTINGS & ADDITIONAL CHARGES */}
        {activeTab === 'SETTINGS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* COMPANY INFORMATION CARD */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Company Information</h3>
                {!isEditingCompany ? (
                  <button
                    type="button"
                    onClick={handleStartEditCompany}
                    className="flex items-center gap-1 px-2.5 py-1 text-brand-blue hover:bg-blue-50 rounded-lg font-bold text-xs transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSaveCompany}
                      className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingCompany(false)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>

              {!isEditingCompany ? (
                <div className="space-y-2 pt-1 text-slate-700">
                  <p>Name: <strong className="text-slate-900">{settings?.company?.name || 'CUSTOWORKS CAR RENTAL'}</strong></p>
                  <p>Hotline: <strong className="text-slate-900">{settings?.company?.phone || '0961 722 5326 / 0995 382 7972'}</strong></p>
                  <p>Location: <strong className="text-slate-900">{settings?.company?.location || 'Carnation Street CBD ll Brgy Triangulo (Beside SM), Naga City, Philippines, 4400'}</strong></p>
                  <p>Facebook: <strong className="text-slate-900">{settings?.company?.facebook || 'Custoworks Car Rental (fb.com/CustoWorkss)'}</strong></p>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Company / Business Name</label>
                    <input
                      type="text"
                      value={companyForm.name}
                      onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Hotline / Contact Number</label>
                    <input
                      type="text"
                      value={companyForm.phone}
                      onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Head Office Location</label>
                    <input
                      type="text"
                      value={companyForm.location}
                      onChange={(e) => setCompanyForm({ ...companyForm, location: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Facebook Page Name</label>
                    <input
                      type="text"
                      value={companyForm.facebook}
                      onChange={(e) => setCompanyForm({ ...companyForm, facebook: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-slate-900"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* CONFIGURED ADDITIONAL FEES CARD */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Configured Additional Fees</h3>
                <button
                  type="button"
                  onClick={handleStartAddFee}
                  className="flex items-center gap-1 bg-brand-blue hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Fee</span>
                </button>
              </div>

              <div className="space-y-1 divide-y divide-slate-100">
                {additionalFees.length === 0 ? (
                  <p className="py-4 text-center text-slate-400">No additional fees configured.</p>
                ) : (
                  additionalFees.map((f) => (
                    <div key={f.id} className="flex items-center justify-between py-2 gap-2 hover:bg-slate-50/50 rounded-lg px-1 transition-colors">
                      <div className="min-w-0 flex-1">
                        <span className="text-slate-800 font-medium block truncate">{f.name}</span>
                        {f.type && (
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">{f.type.replace('_', ' ')}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-bold text-slate-900 font-mono text-xs">{formatPeso(f.amount)}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEditFee(f)}
                            className="p-1 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
                            title={`Edit ${f.name}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFee(f)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title={`Delete ${f.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* OFFICIAL PAYMENT ACCOUNTS & QR CODES CARD */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs md:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Official Payment Accounts & QR Codes</h3>
                  <p className="text-slate-500 text-[11px] mt-0.5">Payment accounts and InstaPay QR codes shown to customers upon checkout & booking tracking.</p>
                </div>
                <span className="self-start sm:self-auto bg-blue-50 text-brand-blue font-bold px-3 py-1 rounded-full text-[11px] border border-blue-100">
                  Standard Reservation Fee: ₱500.00
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {paymentMethods.map((pm) => (
                  <div key={pm.id} className="border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center bg-slate-50/60 shadow-xs">
                    {pm.qrImageUrl ? (
                      <div className="relative group shrink-0">
                        <img
                          src={pm.qrImageUrl}
                          alt={`${pm.name} QR Code`}
                          className="w-32 h-auto max-h-44 object-contain rounded-xl border border-slate-200 shadow-sm bg-white p-1"
                        />
                        <a
                          href={pm.qrImageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-slate-900/60 text-white font-bold text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-xl transition-opacity"
                        >
                          View Full Size ↗
                        </a>
                      </div>
                    ) : (
                      <div className="w-32 h-32 bg-slate-100 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-center p-2 shrink-0">
                        No QR Image
                      </div>
                    )}
                    <div className="space-y-1.5 flex-1 min-w-0 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <h4 className="font-extrabold text-slate-900 text-sm">{pm.name}</h4>
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full">ACTIVE</span>
                      </div>
                      <p className="text-slate-600">
                        Account Name: <strong className="text-slate-900">{pm.accountName || 'N/A'}</strong>
                      </p>
                      <p className="text-slate-600">
                        Account Number: <strong className="font-mono text-brand-navy font-bold text-sm">{pm.accountNumber || 'N/A'}</strong>
                      </p>
                      <p className="text-slate-500 text-[11px] bg-white p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                        {pm.instructions}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Maintenance Block Modal */}
      {blockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 text-xs shadow-xl">
            <h3 className="font-bold text-base text-slate-900">Schedule Vehicle Maintenance Block</h3>
            <form onSubmit={handleCreateBlock} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Vehicle</label>
                <select
                  value={blockVehicleId}
                  onChange={(e) => setBlockVehicleId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-medium"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Start Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={blockStart}
                  onChange={(e) => setBlockStart(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">End Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={blockEnd}
                  onChange={(e) => setBlockEnd(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason / Notes</label>
                <input
                  type="text"
                  required
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g. Periodic Change Oil, Brake Service, Tire Replacement"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBlockModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold shadow">
                  Block Dates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add Vehicle Modal */}
      {addVehicleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 text-xs shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Add New Rental Vehicle</h3>
                <p className="text-slate-500 text-[11px]">Expand the Custoworks Naga City rental fleet</p>
              </div>
              <button onClick={() => setAddVehicleModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Vehicle Name (e.g. Toyota Wigo 2025 AT) *
                </label>
                <input
                  type="text"
                  required
                  value={newVehicleName}
                  onChange={(e) => setNewVehicleName(e.target.value)}
                  placeholder="e.g. Toyota Wigo 2025 AT"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-brand-blue focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Category *</label>
                  <select
                    value={newVehicleCategory}
                    onChange={(e) => setNewVehicleCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                  >
                    <option value="SEDAN">Sedan</option>
                    <option value="SUV_MPV">SUV / MPV</option>
                    <option value="VAN">Passenger Van</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Transmission *</label>
                  <select
                    value={newVehicleTransmission}
                    onChange={(e) => setNewVehicleTransmission(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                  >
                    <option value="AT">Automatic (AT)</option>
                    <option value="MT">Manual (MT)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Seats *</label>
                  <input
                    type="number"
                    required
                    min={2}
                    max={30}
                    value={newVehicleSeats}
                    onChange={(e) => setNewVehicleSeats(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Fuel</label>
                  <input
                    type="text"
                    value={newVehicleFuel}
                    onChange={(e) => setNewVehicleFuel(e.target.value)}
                    placeholder="Gasoline"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Plate Number</label>
                  <input
                    type="text"
                    value={newVehiclePlate}
                    onChange={(e) => setNewVehiclePlate(e.target.value)}
                    placeholder="e.g. NAG-1234"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Make</label>
                  <input
                    type="text"
                    value={newVehicleMake}
                    onChange={(e) => setNewVehicleMake(e.target.value)}
                    placeholder="e.g. Toyota, Mitsubishi"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Model / Year</label>
                  <input
                    type="text"
                    value={newVehicleModel}
                    onChange={(e) => setNewVehicleModel(e.target.value)}
                    placeholder="e.g. Wigo 2025"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-medium"
                  />
                </div>
              </div>

              <div className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={newVehicleSelfDrive}
                    onChange={(e) => setNewVehicleSelfDrive(e.target.checked)}
                    className="rounded text-brand-blue"
                  />
                  <span>Allow Self Drive</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={newVehicleWithDriver}
                    onChange={(e) => setNewVehicleWithDriver(e.target.checked)}
                    className="rounded text-brand-blue"
                  />
                  <span>Allow With Driver</span>
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newVehicleDesc}
                  onChange={(e) => setNewVehicleDesc(e.target.value)}
                  placeholder="Overview, condition, fuel economy..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Primary Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewVehicleImageFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-blue-50 file:text-brand-blue cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddVehicleModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingVehicle}
                  className="px-5 py-2 bg-brand-blue hover:bg-blue-700 text-white font-bold rounded-xl shadow-md"
                >
                  {submittingVehicle ? 'Saving...' : 'Add Vehicle to Fleet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Destination Modal */}
      {addDestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 text-xs shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Add New Destination</h3>
                <p className="text-slate-500 text-[11px]">Add a destination to official Custoworks rate cards</p>
              </div>
              <button onClick={() => setAddDestModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDestination} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Destination Name *
                </label>
                <input
                  type="text"
                  required
                  value={newDestName}
                  onChange={(e) => setNewDestName(e.target.value)}
                  placeholder="e.g. Catanduanes / Caramoan, Legazpi City, Masbate"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-brand-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description / Coverage Notes
                </label>
                <textarea
                  rows={2}
                  value={newDestDesc}
                  onChange={(e) => setNewDestDesc(e.target.value)}
                  placeholder="e.g. Out of town Bicol travel, RoRo ferry required, etc."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddDestModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDest}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md"
                >
                  {submittingDest ? 'Adding...' : 'Add Destination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Additional Fee Modal (Add / Edit) */}
      {feeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 text-xs shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {editingFee ? 'Edit Additional Fee' : 'Add New Additional Fee'}
                </h3>
                <p className="text-slate-400 text-[11px]">Configured rental delivery and service charges</p>
              </div>
              <button
                type="button"
                onClick={() => setFeeModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFee} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Fee Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Delivery Fee - Naga City Area"
                  value={feeForm.name}
                  onChange={(e) => setFeeForm({ ...feeForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:ring-2 focus:ring-brand-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount (PHP ₱) *</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  placeholder="300"
                  value={feeForm.amount}
                  onChange={(e) => setFeeForm({ ...feeForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-brand-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Fee Category / Type</label>
                <select
                  value={feeForm.type}
                  onChange={(e) => setFeeForm({ ...feeForm, type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-brand-blue focus:outline-none"
                >
                  <option value="DELIVERY">Delivery Zone Fee</option>
                  <option value="DELIVERY_SURCHARGE">Delivery Surcharge (Remote/Far Area)</option>
                  <option value="CARWASH">Carwash Fee</option>
                  <option value="OTHER">Other Custom Service Fee</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFeeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-bold shadow-md"
                >
                  {editingFee ? 'Update Fee' : 'Create Fee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
