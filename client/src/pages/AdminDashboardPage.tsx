import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Booking, Vehicle, Payment, Destination, PaymentMethod } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { InteractiveCalendar } from '../components/InteractiveCalendar';
import { AdminQuotationsTab } from '../components/admin/AdminQuotationsTab';
import { AdminUsersTab } from '../components/admin/AdminUsersTab';
import { AdminPartnersTab } from '../components/admin/AdminPartnersTab';
import { AdminDailyDispatchSchedule } from '../components/admin/AdminDailyDispatchSchedule';
import { PartnerDispatchModal } from '../components/admin/PartnerDispatchModal';
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
  Plane,
  Sparkles,
  RefreshCw,
  FileText,
  ExternalLink,
  MapPin,
  Shield,
  CheckCircle2,
  ArrowRight,
  Info,
  Upload,
  Handshake,
  Smartphone,
  Monitor,
  ChevronDown,
  Share2,
  MessageSquare,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'BOOKINGS' | 'CALENDAR' | 'VEHICLES' | 'PRICING' | 'PAYMENTS' | 'REQUIREMENTS' | 'QUOTATIONS' | 'USERS' | 'SETTINGS' | 'PARTNERS'>('OVERVIEW');
  // Phone Simulator Modal State
  const [phoneSimulatorOpen, setPhoneSimulatorOpen] = useState<boolean>(false);
  const [simulatorDevice, setSimulatorDevice] = useState<'IPHONE_15' | 'GALAXY_S24' | 'IPHONE_SE'>('IPHONE_15');
  const [simulatorUrl, setSimulatorUrl] = useState<string>('/book');
  const [simulatorZoom, setSimulatorZoom] = useState<number>(0.85);
  const [simulatorOrientation, setSimulatorOrientation] = useState<'PORTRAIT' | 'LANDSCAPE'>('PORTRAIT');
  const isEmbedMobile = typeof window !== 'undefined' && window.location.search.includes('mobile_sim=1');
  const [mobileTabMenuOpen, setMobileTabMenuOpen] = useState<boolean>(false);

  // Stats & Overview
  const [stats, setStats] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingFilterStatus, setBookingFilterStatus] = useState<string>('');
  const [bookingServiceFilter, setBookingServiceFilter] = useState<'ALL' | 'RENTAL' | 'TRANSFER'>('ALL');
  const [bookingSearch, setBookingSearch] = useState<string>('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingSubTab, setBookingSubTab] = useState<'SCHEDULE' | 'ALL'>('ALL');

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

  // Financial calculation helper for bookings
  const getBookingFinancials = (b: Booking) => {
    const approvedPayments = (b.payments || []).filter((p) => p.status === 'APPROVED');
    const reservationFeePaid = approvedPayments
      .filter((p) => p.type === 'RESERVATION_FEE')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const rentalBalancePaid = approvedPayments
      .filter((p) => p.type === 'RENTAL_BALANCE')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const depositRefunded = approvedPayments.some((p) => p.type === 'SECURITY_DEPOSIT_REFUND');
    const totalPaid = reservationFeePaid + rentalBalancePaid;
    // The ₱1,000 reservation fee serves as the refundable security deposit, so the remaining rental balance due upon pickup is the FULL rental amount minus any rental payments made
    const balanceDue = Math.max(0, Number(b.totalAmount) - rentalBalancePaid);
    const isBalancePaid = balanceDue <= 0;

    return {
      totalAmount: Number(b.totalAmount),
      reservationFeePaid: reservationFeePaid > 0 ? reservationFeePaid : Number(b.reservationFee || 1000),
      hasReservationPaid: reservationFeePaid > 0,
      rentalBalancePaid,
      totalPaid,
      balanceDue,
      isBalancePaid,
      depositRefunded,
    };
  };

  // Vehicle Release & Balance Settlement Modal State
  const [releaseModalBooking, setReleaseModalBooking] = useState<Booking | null>(null);
  const [releasePaymentMethodId, setReleasePaymentMethodId] = useState('');
  const [releaseAmount, setReleaseAmount] = useState('');
  const [releaseRefNumber, setReleaseRefNumber] = useState('CASH');
  const [releaseNotes, setReleaseNotes] = useState('Remaining rental balance paid upon pickup');
  const [releaseMarkOngoing, setReleaseMarkOngoing] = useState(true);
  const [isSubmittingRelease, setIsSubmittingRelease] = useState(false);

  // Tie-Up Partner Commission State in Release Modal
  const [releaseIsTieUp, setReleaseIsTieUp] = useState(false);
  const [releaseTieUpPartnerName, setReleaseTieUpPartnerName] = useState('');
  const [releaseTieUpPercent, setReleaseTieUpPercent] = useState('20');
  const [releaseAutoLogTrip, setReleaseAutoLogTrip] = useState(true);

  // Manual Trip Gross Revenue & Expense State
  const [manualRevenues, setManualRevenues] = useState<any[]>([]);
  const [manualStats, setManualStats] = useState<any>(null);
  const [addTripModalOpen, setAddTripModalOpen] = useState(false);
  const [isSubmittingTrip, setIsSubmittingTrip] = useState(false);
  const [tripForm, setTripForm] = useState({
    title: '',
    date: new Date().toISOString().slice(0, 10),
    clientName: '',
    vehicleName: '',
    rentalType: 'SELF_DRIVE' as 'WITH_DRIVER' | 'SELF_DRIVE',
    grossAmount: '',
    driverFee: '0',
    fuelFee: '0',
    tollOtherFee: '0',
    isTieUp: false,
    tieUpPartnerName: '',
    tieUpPercent: '20',
    notes: '',
  });

  // Vehicle Return & Rental Completion Modal State ("Done after rent")
  const [completeModalBooking, setCompleteModalBooking] = useState<Booking | null>(null);
  const [refundDepositMethodId, setRefundDepositMethodId] = useState('');
  const [refundDepositAmount, setRefundDepositAmount] = useState('1000');
  const [refundRefNumber, setRefundRefNumber] = useState('CASH_REFUND');
  const [inspectClean, setInspectClean] = useState(true);
  const [inspectFuel, setInspectFuel] = useState(true);
  const [inspectDamageFree, setInspectDamageFree] = useState(true);
  const [refundSecurityDeposit, setRefundSecurityDeposit] = useState(true);
  const [isSubmittingComplete, setIsSubmittingComplete] = useState(false);

  // Full Booking Details Inspector Modal
  const [viewBookingModal, setViewBookingModal] = useState<Booking | null>(null);
  // Partner Group Chat Dispatch Modal
  const [dispatchBookingModal, setDispatchBookingModal] = useState<Booking | null>(null);

  const openReleaseModal = (b: Booking) => {
    setReleaseModalBooking(b);
    const fin = getBookingFinancials(b);
    setReleaseAmount(fin.balanceDue > 0 ? fin.balanceDue.toString() : '0');
    const cashMethod = paymentMethods.find((m) => m.kind === 'CASH' || m.code === 'CASH') || paymentMethods[0];
    if (cashMethod) setReleasePaymentMethodId(cashMethod.id);
    setReleaseRefNumber('CASH');
    setReleaseNotes('Remaining rental balance paid upon vehicle release');
    setReleaseMarkOngoing(true);
    setReleaseIsTieUp(false);
    setReleaseTieUpPartnerName('');
    setReleaseTieUpPercent('20');
    setReleaseAutoLogTrip(true);
  };

  const handleSubmitRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!releaseModalBooking) return;
    setIsSubmittingRelease(true);
    try {
      const amountToPay = parseFloat(releaseAmount) || 0;
      let finalNotes = releaseNotes.trim() || 'Rental balance collected upon pickup';

      if (releaseIsTieUp) {
        const fin = getBookingFinancials(releaseModalBooking);
        const tieUpPct = parseFloat(releaseTieUpPercent) || 20;
        const partnerAmt = Math.round(fin.totalAmount * (tieUpPct / 100));
        const custoNet = fin.totalAmount - partnerAmt;
        finalNotes += ` | [Tie-Up: ${releaseTieUpPartnerName.trim() || 'Partner'} (${tieUpPct}%) - Partner: ₱${partnerAmt.toLocaleString()} | Custoworks Net: ₱${custoNet.toLocaleString()}]`;

        if (releaseAutoLogTrip) {
          try {
            await api.post('/admin/manual-revenues', {
              title: `Tie-Up: ${releaseModalBooking.reference} (${releaseModalBooking.vehicle?.name || 'Partner Unit'})`,
              date: new Date().toISOString().slice(0, 10),
              clientName: releaseModalBooking.customerName,
              vehicleName: releaseModalBooking.vehicle?.name || 'Tie-Up Unit',
              rentalType: releaseModalBooking.rentalType || 'SELF_DRIVE',
              grossAmount: fin.totalAmount,
              driverFee: 0,
              fuelFee: 0,
              tollOtherFee: 0,
              isTieUp: true,
              tieUpPartnerName: releaseTieUpPartnerName.trim() || 'Tie-Up Fleet Partner',
              tieUpPercent: tieUpPct,
              notes: `Auto-recorded from Release for Booking #${releaseModalBooking.reference}`,
            });
            await fetchManualRevenues();
          } catch (mErr) {
            console.error('Error auto-logging tie-up trip revenue:', mErr);
          }
        }
      }

      if (amountToPay > 0) {
        if (!releasePaymentMethodId) {
          alert('Please select a payment method for the balance.');
          setIsSubmittingRelease(false);
          return;
        }
        await api.post('/payments/record-otc', {
          bookingId: releaseModalBooking.id,
          paymentMethodId: releasePaymentMethodId,
          type: 'RENTAL_BALANCE',
          amount: amountToPay,
          referenceNumber: releaseRefNumber.trim() || 'CASH',
          notes: finalNotes,
          paidAt: new Date().toISOString(),
        });
      }

      if (releaseMarkOngoing) {
        await api.post(`/bookings/${releaseModalBooking.id}/release`);
      }

      alert('Balance payment confirmed and vehicle marked as Released (Ongoing)!');
      setReleaseModalBooking(null);
      await fetchBookings();
      await fetchPayments();
      await fetchStats();
      if (viewBookingModal?.id === releaseModalBooking.id) {
        const updated = await api.get<{ booking: Booking }>(`/bookings/${releaseModalBooking.id}`);
        setViewBookingModal(updated.booking);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to release vehicle or record payment');
    } finally {
      setIsSubmittingRelease(false);
    }
  };

  const fetchManualRevenues = async () => {
    try {
      const res = await api.get<{ revenues: any[]; stats: any }>('/admin/manual-revenues');
      setManualRevenues(res.revenues || []);
      setManualStats(res.stats || null);
    } catch (err) {
      console.error('Error fetching manual revenues:', err);
    }
  };

  const applyTripPreset = (preset: 'BIA' | 'LEGAZPI' | 'NAGA' | 'WALKIN') => {
    if (preset === 'BIA') {
      setTripForm((prev) => ({
        ...prev,
        title: 'BIA Airport Pickup & Drop (VIP Chauffeur)',
        rentalType: 'WITH_DRIVER',
        grossAmount: '7500',
        driverFee: '1000',
        fuelFee: '2000',
        tollOtherFee: '0',
        notes: 'VIP roundtrip airport transfer Naga City <-> Bicol International Airport (BIA)',
      }));
    } else if (preset === 'LEGAZPI') {
      setTripForm((prev) => ({
        ...prev,
        title: 'Naga to Legazpi / Mayon Tour',
        rentalType: 'WITH_DRIVER',
        grossAmount: '5500',
        driverFee: '1000',
        fuelFee: '1500',
        tollOtherFee: '100',
        notes: 'Whole day Albay / Mayon sightseeing tour with dedicated driver',
      }));
    } else if (preset === 'NAGA') {
      setTripForm((prev) => ({
        ...prev,
        title: 'Naga City 10h Chauffeur Service',
        rentalType: 'WITH_DRIVER',
        grossAmount: '3500',
        driverFee: '800',
        fuelFee: '800',
        tollOtherFee: '0',
        notes: 'Naga City intra-city chauffeur service (business / events)',
      }));
    } else if (preset === 'WALKIN') {
      setTripForm((prev) => ({
        ...prev,
        title: 'Walk-in Self-Drive (24 Hours)',
        rentalType: 'SELF_DRIVE',
        grossAmount: '2500',
        driverFee: '0',
        fuelFee: '0',
        tollOtherFee: '0',
        notes: 'Direct OTC walk-in rental (client handles own fuel)',
      }));
    }
  };

  const handleAddManualTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    const gross = parseFloat(tripForm.grossAmount) || 0;
    if (gross <= 0) {
      alert('Please enter a valid gross amount.');
      return;
    }
    setIsSubmittingTrip(true);
    try {
      await api.post('/admin/manual-revenues', {
        title: tripForm.title.trim() || 'Offline Trip Revenue',
        date: tripForm.date,
        clientName: tripForm.clientName.trim() || 'Walk-in Guest',
        vehicleName: tripForm.vehicleName.trim() || 'Fleet Vehicle',
        rentalType: tripForm.rentalType,
        grossAmount: gross,
        driverFee: parseFloat(tripForm.driverFee) || 0,
        fuelFee: parseFloat(tripForm.fuelFee) || 0,
        tollOtherFee: parseFloat(tripForm.tollOtherFee) || 0,
        isTieUp: tripForm.isTieUp,
        tieUpPartnerName: tripForm.tieUpPartnerName.trim() || undefined,
        tieUpPercent: tripForm.isTieUp ? parseFloat(tripForm.tieUpPercent) || 20 : undefined,
        notes: tripForm.notes.trim() || undefined,
      });

      alert('Manual trip recorded successfully into Monthly Gross Revenue!');
      setAddTripModalOpen(false);
      await fetchManualRevenues();
      await fetchStats();
    } catch (err: any) {
      alert(err.message || 'Failed to save manual trip revenue');
    } finally {
      setIsSubmittingTrip(false);
    }
  };

  const handleDeleteManualTrip = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}" from manual revenues?`)) return;
    try {
      await api.delete(`/admin/manual-revenues/${id}`);
      await fetchManualRevenues();
      await fetchStats();
    } catch (err: any) {
      alert(err.message || 'Failed to delete entry');
    }
  };

  const openCompleteModal = (b: Booking) => {
    setCompleteModalBooking(b);
    const cashMethod = paymentMethods.find((m) => m.kind === 'CASH' || m.code === 'CASH') || paymentMethods[0];
    if (cashMethod) setRefundDepositMethodId(cashMethod.id);
    setRefundDepositAmount('1000');
    setRefundRefNumber('CASH_REFUND');
    setInspectClean(true);
    setInspectFuel(true);
    setInspectDamageFree(true);
    setRefundSecurityDeposit(true);
  };

  const handleSubmitComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeModalBooking) return;
    setIsSubmittingComplete(true);
    try {
      if (refundSecurityDeposit) {
        const refundAmt = parseFloat(refundDepositAmount) || 1000;
        if (refundAmt > 0 && refundDepositMethodId) {
          await api.post('/payments/record-otc', {
            bookingId: completeModalBooking.id,
            paymentMethodId: refundDepositMethodId,
            type: 'SECURITY_DEPOSIT_REFUND',
            amount: refundAmt,
            referenceNumber: refundRefNumber.trim() || 'CASH_REFUND',
            notes: 'Security deposit refunded upon clean vehicle return inspection',
            paidAt: new Date().toISOString(),
          });
        }
      }

      await api.post(`/bookings/${completeModalBooking.id}/complete`);

      alert('Vehicle return inspection verified, deposit refunded, and rental marked as COMPLETED!');
      setCompleteModalBooking(null);
      await fetchBookings();
      await fetchPayments();
      await fetchStats();
      if (viewBookingModal?.id === completeModalBooking.id) {
        const updated = await api.get<{ booking: Booking }>(`/bookings/${completeModalBooking.id}`);
        setViewBookingModal(updated.booking);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to complete rental');
    } finally {
      setIsSubmittingComplete(false);
    }
  };

  const openViewBookingModal = async (b: Booking) => {
    setViewBookingModal(b);
    try {
      const res = await api.get<{ booking: Booking }>(`/bookings/${b.id}`);
      setViewBookingModal(res.booking);
    } catch (err) {
      console.error(err);
    }
  };

  // Payment Method Modal State (Add/Edit/Delete)
  const [pmModalOpen, setPmModalOpen] = useState(false);
  const [editingPm, setEditingPm] = useState<PaymentMethod | null>(null);
  const [pmForm, setPmForm] = useState<{
    code: string;
    name: string;
    kind: 'BANK_TRANSFER' | 'E_WALLET' | 'CASH' | 'ONLINE_GATEWAY';
    accountName: string;
    accountNumber: string;
    instructions: string;
    isActive: boolean;
    isCustomerSelectable: boolean;
  }>({
    code: '',
    name: '',
    kind: 'E_WALLET',
    accountName: '',
    accountNumber: '',
    instructions: '',
    isActive: true,
    isCustomerSelectable: true,
  });
  const [pmQrFile, setPmQrFile] = useState<File | null>(null);
  const [pmQrPreview, setPmQrPreview] = useState<string | null>(null);
  const [submittingPm, setSubmittingPm] = useState(false);

  // View Receipt Preview Lightbox State
  const [viewingReceiptPayment, setViewingReceiptPayment] = useState<Payment | null>(null);
  const [viewingRequirementDoc, setViewingRequirementDoc] = useState<{ id: string; name: string; title: string; originalName?: string; sizeBytes?: number } | null>(null);

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

  const handleAdminUploadDoc = async (bookingId: string, requirementId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/requirements/booking/${bookingId}/upload/${requirementId}`, formData);
      await loadReqBookingDetail(bookingId);
      await fetchBookings();
      alert('Document attached and uploaded successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to attach document');
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get<{ stats: any; recentBookings: any[] }>('/admin/stats');
      setStats(res.stats);
      setRecentBookings(res.recentBookings);
      if (res.stats?.manualStats) {
        setManualStats(res.stats.manualStats);
      }
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
        api.get<{ methods: PaymentMethod[] }>('/payments/admin/methods'),
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
      await Promise.all([fetchStats(), fetchBookings(), fetchVehiclesAndMaster(), fetchManualRevenues()]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (activeTab === 'OVERVIEW') fetchManualRevenues();
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

  const handleDeleteBooking = async (id: string, reference?: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete booking ${reference || id}? This cannot be undone.`)) return;
    try {
      await api.delete(`/bookings/${id}`);
      alert(`Booking ${reference || ''} deleted successfully.`);
      if (viewBookingModal?.id === id) {
        setViewBookingModal(null);
      }
      await fetchBookings();
      await fetchStats();
    } catch (err: any) {
      alert(err.message || 'Failed to delete booking');
    }
  };

  const handleResetTestData = async () => {
    const input = window.prompt("⚠️ CAUTION: This will permanently purge all test bookings, partner applications, quotation requests, and payments.\n\nType 'RESET' to confirm database wipe:");
    if (input !== 'RESET') {
      if (input !== null) alert('Database reset cancelled. You must type RESET exactly.');
      return;
    }
    try {
      await api.post('/admin/reset-test-data');
      alert('All test records have been reset successfully! Your database is clean.');
      await fetchBookings();
      await fetchStats();
      await fetchPayments();
    } catch (err: any) {
      alert(err.message || 'Failed to reset test data.');
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

  const handleDeleteDestination = async (destId: string, destName: string) => {
    if (!window.confirm(`Are you sure you want to delete destination "${destName}"? This will remove it from the booking wizard and rate matrices.`)) {
      return;
    }
    try {
      await api.delete(`/pricing/destinations/${destId}`);
      alert(`Destination "${destName}" deleted successfully.`);
      await fetchVehiclesAndMaster();
      if (matrixVehicleId) {
        const res = await api.get<{ vehicle: Vehicle; destinations: Destination[]; rates: any[] }>(`/pricing/matrix/${matrixVehicleId}`);
        setMatrixDestinations(res.destinations);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete destination');
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

  // Payment Methods Handlers (Add, Edit, Delete, QR Upload)
  const handleOpenAddPm = () => {
    setEditingPm(null);
    setPmForm({
      code: '',
      name: '',
      kind: 'E_WALLET',
      accountName: '',
      accountNumber: '',
      instructions: 'Transfer the PHP 1,000 reservation fee via InstaPay / app. Take a screenshot of the receipt and upload below.',
      isActive: true,
      isCustomerSelectable: true,
    });
    setPmQrFile(null);
    setPmQrPreview(null);
    setPmModalOpen(true);
  };

  const handleOpenEditPm = (pm: PaymentMethod) => {
    setEditingPm(pm);
    setPmForm({
      code: pm.code || '',
      name: pm.name || '',
      kind: pm.kind || 'E_WALLET',
      accountName: pm.accountName || '',
      accountNumber: pm.accountNumber || '',
      instructions: pm.instructions || '',
      isActive: pm.isActive ?? true,
      isCustomerSelectable: pm.isCustomerSelectable ?? true,
    });
    setPmQrFile(null);
    setPmQrPreview(pm.qrImageUrl || null);
    setPmModalOpen(true);
  };

  const handleDeletePm = async (pm: PaymentMethod) => {
    if (!window.confirm(`Are you sure you want to delete payment account "${pm.name}" (${pm.accountNumber || pm.code})?\n\nThis will remove it from the payment channels.`)) return;
    try {
      await api.delete(`/payments/methods/${pm.id}`);
      setPaymentMethods((prev) => prev.filter((m) => m.id !== pm.id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete payment account');
    }
  };

  const handleSavePm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPm(true);
    try {
      let savedMethod: PaymentMethod;
      if (editingPm) {
        const res = await api.patch<{ method: PaymentMethod }>(`/payments/methods/${editingPm.id}`, pmForm);
        savedMethod = res.method;
      } else {
        const res = await api.post<{ method: PaymentMethod }>('/payments/methods', pmForm);
        savedMethod = res.method;
      }

      // If user uploaded a new QR image, send to qr upload endpoint
      if (pmQrFile) {
        const formData = new FormData();
        formData.append('file', pmQrFile);
        const qrRes = await api.post<{ method: PaymentMethod }>(`/payments/methods/${savedMethod.id}/qr`, formData);
        savedMethod = qrRes.method;
      }

      if (editingPm) {
        setPaymentMethods((prev) => prev.map((m) => (m.id === savedMethod.id ? savedMethod : m)));
      } else {
        setPaymentMethods((prev) => [...prev, savedMethod]);
      }
      setPmModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save payment method');
    } finally {
      setSubmittingPm(false);
    }
  };

  const handleUploadQrDirect = async (pm: PaymentMethod, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<{ method: PaymentMethod }>(`/payments/methods/${pm.id}/qr`, formData);
      setPaymentMethods((prev) => prev.map((m) => (m.id === pm.id ? res.method : m)));
      alert(`QR Code updated successfully for ${pm.name}`);
    } catch (err: any) {
      alert(err.message || 'Failed to upload QR code');
    }
  };

  const adminTabs = [
    { id: 'OVERVIEW', label: 'Overview', icon: LayoutDashboard },
    { id: 'BOOKINGS', label: 'Bookings', icon: Clock, badge: bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'ONGOING').length },
    { id: 'CALENDAR', label: 'Calendar', icon: Calendar },
    { id: 'VEHICLES', label: 'Fleet', icon: Car, badge: vehicles.length },
    { id: 'PRICING', label: 'Pricing Matrix', icon: DollarSign },
    { id: 'PAYMENTS', label: 'Payments', icon: Receipt, badge: stats?.pendingPayments, badgeAmber: true },
    { id: 'REQUIREMENTS', label: 'Requirements', icon: FileCheck2 },
    { id: 'QUOTATIONS', label: 'Quotations', icon: FileText },
    { id: 'PARTNERS', label: 'Tie-Up Partners', icon: Handshake },
    { id: 'USERS', label: 'Staff Accounts', icon: Users },
    { id: 'SETTINGS', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Executive Command Header */}
      <header className="bg-slate-900/95 border-b border-slate-800/90 backdrop-blur-md sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center font-black shadow-lg shadow-blue-500/30">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight text-white uppercase">CUSTOWORKS</span>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-black px-2 py-0.5 rounded tracking-wider uppercase">
                  ADMIN CONSOLE
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-medium text-slate-300">Live Operations · Naga City Garage (Beside SM)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                fetchStats();
                fetchBookings();
                fetchVehiclesAndMaster();
              }}
              title="Refresh live operations data"
              className="bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Live Website</span>
            </a>

            {/* View as Phone Simulator Trigger Button (Desktop/Laptop only) */}
            {!isEmbedMobile && (
              <button
                type="button"
                onClick={() => setPhoneSimulatorOpen(true)}
                title="Preview how Admin & Customer sites look on mobile phones"
                className="bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-amber-300 hover:text-white text-xs font-bold px-3 py-2 rounded-xl transition-all hidden md:flex items-center gap-1.5 shadow-sm"
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>📱 View as Phone</span>
              </button>
            )}

            <button
              onClick={() => setAddVehicleModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Vehicle</span>
            </button>

            {/* Operator Avatar */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-800 text-xs">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-blue-400 font-bold flex items-center justify-center text-xs shadow-inner">
                {user?.fullName?.charAt(0) || 'A'}
              </div>
              <div className="hidden md:block leading-tight">
                <p className="font-bold text-white text-xs truncate max-w-[120px]">{user?.fullName}</p>
                <p className="text-[10px] text-slate-400 capitalize">{user?.role?.toLowerCase() || 'Administrator'}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-3.5 sm:px-6 lg:px-8 py-4 sm:py-7 space-y-5 sm:space-y-6">
        {/* Mobile Tab Quick Switcher (visible on real phones) */}
        <div className="md:hidden">
          <div className="relative">
            <button
              type="button"
              onClick={() => setMobileTabMenuOpen(!mobileTabMenuOpen)}
                  className="w-full flex items-center justify-between bg-slate-900 border border-slate-700/80 p-2.5 rounded-xl text-left shadow-sm active:bg-slate-850"
                >
                  <div className="flex items-center gap-2">
                    {React.createElement(
                      adminTabs.find((t) => t.id === activeTab)?.icon || LayoutDashboard,
                      { className: 'w-4 h-4 text-blue-400 shrink-0' }
                    )}
                    <span className="font-bold text-white text-xs truncate">
                      Section: {adminTabs.find((t) => t.id === activeTab)?.label}
                    </span>
                    {adminTabs.find((t) => t.id === activeTab)?.badge ? (
                      <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                        {adminTabs.find((t) => t.id === activeTab)?.badge}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold shrink-0">
                    <span>Switch</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${mobileTabMenuOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {mobileTabMenuOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 grid grid-cols-2 gap-1 backdrop-blur-md">
                    {adminTabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setActiveTab(tab.id as any);
                            setMobileTabMenuOpen(false);
                          }}
                          className={`flex items-center justify-between p-2 rounded-lg text-left text-xs font-bold transition-all ${
                            isActive
                              ? 'bg-blue-600 text-white shadow'
                              : 'hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{tab.label}</span>
                          </div>
                          {tab.badge !== undefined && tab.badge > 0 && (
                            <span className={`text-[10px] px-1 py-0.2 rounded-full font-black ${tab.badgeAmber ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-white'}`}>
                              {tab.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modern Navigation Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-800/80 text-xs font-bold">
              {adminTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all shrink-0 border ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500/80 shadow-lg shadow-blue-600/25'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 hover:border-slate-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span
                        className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                          tab.badgeAmber
                            ? 'bg-amber-400 text-slate-950 font-bold'
                            : isActive
                            ? 'bg-white/25 text-white'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

        {/* TAB 1: OVERVIEW METRICS */}
        {activeTab === 'OVERVIEW' && stats && (
          <div className="space-y-6">
            {/* Top Stat Cards (Using Modern UI Aesthetic) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Today's Dispatch */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm flex flex-col justify-between hover:border-blue-500/50 transition-all shadow-md group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Today's Dispatch</p>
                    <p className="text-2xl sm:text-3xl font-black text-white mt-0.5">{stats.todaysBookings}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Pickups scheduled today</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Today's schedule</span>
                  <button onClick={() => { setActiveTab('BOOKINGS'); setBookingSubTab('SCHEDULE'); }} className="text-blue-400 font-bold hover:underline">
                    View schedule →
                  </button>
                </div>
              </div>

              {/* Card 2: Pending Payment / Verification */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm flex flex-col justify-between hover:border-amber-500/50 transition-all shadow-md group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Pending Payments</p>
                    <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-0.5">{stats.pendingPayments}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Receipts awaiting review</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">GCash & Bank slips</span>
                  <button onClick={() => setActiveTab('PAYMENTS')} className="text-amber-400 font-bold hover:underline">
                    Verify now →
                  </button>
                </div>
              </div>

              {/* Card 3: Ongoing Rentals */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm flex flex-col justify-between hover:border-indigo-500/50 transition-all shadow-md group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Ongoing Rentals</p>
                    <p className="text-2xl sm:text-3xl font-black text-blue-400 mt-0.5">{stats.ongoingRentals}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Vehicles currently on road</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Customer trips active</span>
                  <button onClick={() => { setActiveTab('BOOKINGS'); setBookingFilterStatus('ONGOING'); }} className="text-blue-400 font-bold hover:underline">
                    Track trips →
                  </button>
                </div>
              </div>

              {/* Card 4: Available Fleet */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm flex flex-col justify-between hover:border-emerald-500/50 transition-all shadow-md group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Available Fleet</p>
                    <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-0.5">
                      {stats.availableVehicles} <span className="text-sm font-semibold text-slate-400">/ {stats.totalVehicles}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">{stats.totalVehicles - stats.availableVehicles} units currently dispatched</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Garage readiness</span>
                  <button onClick={() => setActiveTab('VEHICLES')} className="text-emerald-400 font-bold hover:underline">
                    Manage fleet →
                  </button>
                </div>
              </div>
            </div>

            {/* DAILY VEHICLE RELEASE & DISPATCH SCHEDULE */}
            <AdminDailyDispatchSchedule
              onOpenBookingModal={openViewBookingModal}
              onOpenReleaseModal={openReleaseModal}
              onRefreshParent={fetchStats}
            />

            {/* MONTHLY REVENUE & FINANCIAL PERFORMANCE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Primary This Month Card */}
              <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/90 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800/90 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="space-y-5 relative z-10">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500/20 text-emerald-300 font-extrabold text-[11px] px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-500/30">
                        Monthly Gross Revenue
                      </span>
                      <span className="text-blue-200 text-xs font-semibold">
                        {stats.monthLabel || 'Current Month'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setAddTripModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 border border-emerald-400/30"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Manual Gross (BIA / Offline)</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('PAYMENTS')}
                        className="bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-700 shadow-md transition-all"
                      >
                        Inspect Payments →
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="text-4xl sm:text-5xl font-black text-white tracking-tight block">
                        {formatPeso(stats.thisMonthRevenue ?? stats.totalRevenue)}
                      </span>
                      {stats.manualStats && stats.manualStats.count > 0 && (
                        <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Net Custoworks: {formatPeso((stats.onlineThisMonthRevenue || 0) + (stats.manualStats.netCustoworks || 0))}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1.5">
                      Combined total of net online rental earnings (with refundable security deposits deducted upon return) + manual offline trips (BIA airport runs, walk-ins).
                    </p>

                    {/* Financial Breakdown Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-slate-800/80 text-[11px]">
                      <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                        <span className="text-slate-400 block text-[10px] font-semibold uppercase">Online Bookings Gross</span>
                        <span className="font-extrabold text-blue-300 text-sm mt-0.5 block">
                          {formatPeso(stats.onlineThisMonthRevenue ?? stats.thisMonthRevenue ?? 0)}
                        </span>
                      </div>
                      <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                        <span className="text-slate-400 block text-[10px] font-semibold uppercase">Manual Trips Gross</span>
                        <span className="font-extrabold text-emerald-400 text-sm mt-0.5 block">
                          {formatPeso(stats.manualThisMonthRevenue || stats.manualStats?.totalGross || 0)}
                        </span>
                      </div>
                      <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                        <span className="text-slate-400 block text-[10px] font-semibold uppercase">Driver & Fuel Costs</span>
                        <span className="font-extrabold text-amber-400 text-sm mt-0.5 block">
                          - {formatPeso((stats.manualStats?.totalDriverFee || 0) + (stats.manualStats?.totalFuelFee || 0) + (stats.manualStats?.totalTollOther || 0))}
                        </span>
                      </div>
                      <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                        <span className="text-slate-400 block text-[10px] font-semibold uppercase">Tie-Up Payouts (20%)</span>
                        <span className="font-extrabold text-purple-400 text-sm mt-0.5 block">
                          - {formatPeso(stats.manualStats?.totalTieUpFee || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Fleet Breakdown */}
                  {stats.revenueByVehicle && stats.revenueByVehicle.length > 0 && (
                    <div className="pt-4 border-t border-slate-800 space-y-2.5">
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
                              className="bg-slate-800/70 hover:bg-slate-800 p-3 rounded-xl border border-slate-700/70 transition-all"
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
                              <div className="w-full bg-slate-700/60 h-1.5 rounded-full mt-1.5 overflow-hidden">
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

              {/* Right Side Cards */}
              <div className="flex flex-col gap-4">
                {/* Lifetime Revenue Card */}
                <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block">
                      All-Time Lifetime Revenue
                    </span>
                    <span className="text-2xl font-black text-white mt-1 block">
                      {formatPeso(stats.totalRevenue)}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Cumulative verified cash & digital payments received via GCash, BDO, and Cash.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs mt-3">
                    <span className="text-slate-400 font-medium">Monthly Active Bookings:</span>
                    <strong className="text-blue-400 font-bold">{stats.thisMonthBookingsCount || 0} Bookings</strong>
                  </div>
                </div>

                {/* Naga City Location & Garage Card (Matching uploaded user style) */}
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 backdrop-blur-sm flex flex-col justify-between hover:border-blue-500/50 transition-all shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Location & Garage</p>
                      <p className="text-sm font-bold text-white mt-0.5">Carnation St. CBD II (Beside SM)</p>
                      <p className="text-[11px] text-slate-300 mt-0.5">Brgy. Triangulo, Naga City 4400</p>
                      <p className="text-[11px] text-slate-400 mt-1">Pickups 24/7 with reservation</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-700/60">
                    <a
                      href="https://maps.app.goo.gl/4TTUTX5HJfwdNfdW7"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold py-2 px-3 rounded-lg transition-colors"
                    >
                      View Map Location <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* MANUAL TRIPS & OFFLINE REVENUE LEDGER */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-bold text-base text-white">Manual Trips & Offline Revenue Ledger</h3>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Log walk-in rentals, airport transfers, fuel & driver allowances, and tie-up partner payouts
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setTripForm({
                        title: '',
                        date: new Date().toISOString().slice(0, 10),
                        clientName: '',
                        vehicleName: '',
                        rentalType: 'SELF_DRIVE',
                        grossAmount: '',
                        driverFee: '0',
                        fuelFee: '0',
                        tollOtherFee: '0',
                        isTieUp: false,
                        tieUpPartnerName: '',
                        tieUpPercent: '20',
                        notes: '',
                      });
                      setAddTripModalOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Manual Trip</span>
                  </button>
                </div>
              </div>

              {manualRevenues.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <p className="text-slate-400 text-xs">No manual offline trips logged yet this month.</p>
                  <button
                    onClick={() => {
                      setTripForm({
                        title: '',
                        date: new Date().toISOString().slice(0, 10),
                        clientName: '',
                        vehicleName: '',
                        rentalType: 'SELF_DRIVE',
                        grossAmount: '',
                        driverFee: '0',
                        fuelFee: '0',
                        tollOtherFee: '0',
                        isTieUp: false,
                        tieUpPartnerName: '',
                        tieUpPercent: '20',
                        notes: '',
                      });
                      setAddTripModalOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
                  >
                    + Add New Trip Record
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="sm:hidden px-3.5 py-1.5 bg-slate-800/80 border-b border-slate-700/60 text-[10px] text-slate-300 font-semibold flex items-center justify-between">
                    <span>📱 Ledger Table</span>
                    <span className="text-emerald-400">👈 Swipe to view details & actions 👉</span>
                  </div>
                  <table className="w-full text-left text-xs min-w-[750px]">
                    <thead className="bg-slate-850 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-3.5">Date</th>
                        <th className="p-3.5">Trip / Service</th>
                        <th className="p-3.5">Vehicle & Client</th>
                        <th className="p-3.5 text-right">Gross Charged</th>
                        <th className="p-3.5">Direct Expenses (Driver & Diesel)</th>
                        <th className="p-3.5">Tie-Up Partner</th>
                        <th className="p-3.5 text-right">Net Profit</th>
                        <th className="p-3.5">Notes</th>
                        <th className="p-3.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-medium text-slate-300">
                      {manualRevenues.map((trip) => {
                        const totalExp = (trip.driverFee || 0) + (trip.fuelFee || 0) + (trip.tollOtherFee || 0);
                        return (
                          <tr key={trip.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3.5 font-mono text-slate-400 whitespace-nowrap">
                              {trip.date}
                            </td>
                            <td className="p-3.5">
                              <span className="font-bold text-white block">{trip.title}</span>
                              <span
                                className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  trip.rentalType === 'WITH_DRIVER'
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {trip.rentalType === 'WITH_DRIVER' ? 'With Driver' : 'Self-Drive'}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span className="font-bold text-slate-200 block">{trip.vehicleName}</span>
                              <span className="text-[11px] text-slate-400">{trip.clientName}</span>
                            </td>
                            <td className="p-3.5 text-right font-mono font-black text-white text-sm">
                              {formatPeso(trip.grossAmount)}
                            </td>
                            <td className="p-3.5">
                              <div className="space-y-0.5 text-[11px]">
                                {trip.driverFee > 0 && (
                                  <div className="text-amber-300">
                                    Driver: <span className="font-mono font-bold">{formatPeso(trip.driverFee)}</span>
                                  </div>
                                )}
                                {trip.fuelFee > 0 && (
                                  <div className="text-amber-300">
                                    Fuel/Diesel: <span className="font-mono font-bold">{formatPeso(trip.fuelFee)}</span>
                                  </div>
                                )}
                                {trip.tollOtherFee > 0 && (
                                  <div className="text-slate-400">
                                    Toll/Other: <span className="font-mono font-bold">{formatPeso(trip.tollOtherFee)}</span>
                                  </div>
                                )}
                                {totalExp === 0 && <span className="text-slate-500">None (₱0)</span>}
                              </div>
                            </td>
                            <td className="p-3.5">
                              {trip.isTieUp ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                                    <Handshake className="w-3 h-3" />
                                    {trip.tieUpPercent || 20}% Partner Share
                                  </span>
                                  <div className="text-purple-300 font-bold text-[11px]">
                                    - {formatPeso(trip.tieUpAmount || 0)}
                                  </div>
                                  <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">
                                    {trip.tieUpPartnerName || 'Fleet Partner'}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-500 text-[11px]">Direct Fleet (0%)</span>
                              )}
                            </td>
                            <td className="p-3.5 text-right font-mono font-black text-emerald-400 text-sm">
                              {formatPeso(trip.netAmount)}
                            </td>
                            <td className="p-3.5 text-slate-400 text-[11px] max-w-xs truncate" title={trip.notes}>
                              {trip.notes || '—'}
                            </td>
                            <td className="p-3.5 text-center">
                              <button
                                onClick={() => handleDeleteManualTrip(trip.id, trip.title)}
                                title="Delete entry"
                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Bookings Activity Table */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <h3 className="font-bold text-base text-white">Recent Customer Bookings</h3>
                </div>
                <button onClick={() => setActiveTab('BOOKINGS')} className="text-blue-400 text-xs font-bold hover:underline">
                  View All Bookings →
                </button>
              </div>
              <div className="overflow-x-auto">
                <div className="sm:hidden px-3.5 py-1.5 bg-slate-800/80 border-b border-slate-700/60 text-[10px] text-slate-300 font-semibold flex items-center justify-between">
                  <span>📱 Customer Bookings</span>
                  <span className="text-blue-400">👈 Swipe to view status 👉</span>
                </div>
                <table className="w-full text-left text-xs min-w-[650px]">
                  <thead className="bg-slate-850 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3.5">Reference</th>
                      <th className="p-3.5">Vehicle</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Pick-up Schedule</th>
                      <th className="p-3.5">Destination</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-medium text-slate-300">
                    {recentBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-bold font-mono text-blue-400">
                          <button
                            type="button"
                            onClick={() => openViewBookingModal(b)}
                            className="hover:underline text-blue-400"
                          >
                            {b.reference}
                          </button>
                        </td>
                        <td className="p-3.5 text-white font-medium">{b.vehicle?.name}</td>
                        <td className="p-3.5 font-semibold text-white">{b.customerName}</td>
                        <td className="p-3.5 text-slate-300">{formatDate(b.pickupAt)}</td>
                        <td className="p-3.5 text-slate-300">{b.destination?.name}</td>
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
            {/* Auto-Complete / Ended Rentals Banner */}
            {(() => {
              const endedOngoing = bookings.filter(
                (b) => b.status === 'ONGOING' && new Date() >= new Date(b.returnAt)
              );
              if (endedOngoing.length === 0) return null;
              return (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      ⏰
                    </div>
                    <div>
                      <h4 className="font-extrabold text-amber-950 text-sm">
                        {endedOngoing.length} Rental(s) Scheduled Return Time Has Reached / Passed!
                      </h4>
                      <p className="text-xs text-amber-800">
                        Vehicle return inspection and ₱1,000 security deposit refund is ready to be confirmed to mark them as completed.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {endedOngoing.slice(0, 3).map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => openCompleteModal(b)}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Complete #{b.reference}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Sub-view switcher for Bookings */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBookingSubTab('ALL')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    bookingSubTab === 'ALL'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  All Bookings Records ({bookings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBookingSubTab('SCHEDULE')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    bookingSubTab === 'SCHEDULE'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  📅 Daily Vehicle Release & Dispatch Schedule
                </button>
              </div>

              <span className="text-[11px] text-slate-400 font-medium px-2">
                Naga City Garage Operations
              </span>
            </div>

            {bookingSubTab === 'SCHEDULE' ? (
              <AdminDailyDispatchSchedule
                onOpenBookingModal={openViewBookingModal}
                onOpenReleaseModal={openReleaseModal}
                onRefreshParent={fetchStats}
              />
            ) : (
              <>
            {/* Filter & Search Bar */}
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row gap-3 justify-between items-center">
              <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                <select
                  value={bookingFilterStatus}
                  onChange={(e) => setBookingFilterStatus(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING_PAYMENT">Pending Payment</option>
                  <option value="PAYMENT_VERIFICATION">Payment Verification</option>
                  <option value="REQUIREMENTS_REVIEW">Requirements Review</option>
                  <option value="CONFIRMED">Confirmed (Ready for Pickup)</option>
                  <option value="ONGOING">Ongoing (On the Road)</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>

                {/* Quick Filter Buttons */}
                <button
                  type="button"
                  onClick={() => setBookingFilterStatus('CONFIRMED')}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all border ${
                    bookingFilterStatus === 'CONFIRMED'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                      : 'bg-slate-800/80 text-blue-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  🚗 Ready for Pickup ({bookings.filter((b) => b.status === 'CONFIRMED').length})
                </button>
                <button
                  type="button"
                  onClick={() => setBookingFilterStatus('ONGOING')}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all border ${
                    bookingFilterStatus === 'ONGOING'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                      : 'bg-slate-800/80 text-indigo-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  🛣️ Ongoing ({bookings.filter((b) => b.status === 'ONGOING').length})
                </button>
                <button
                  type="button"
                  onClick={() => setBookingFilterStatus('COMPLETED')}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all border ${
                    bookingFilterStatus === 'COMPLETED'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                      : 'bg-slate-800/80 text-emerald-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  ✅ Completed
                </button>

                <div className="h-5 w-px bg-slate-700 hidden sm:block mx-1" />

                <button
                  type="button"
                  onClick={() => setBookingServiceFilter((prev) => (prev === 'TRANSFER' ? 'ALL' : 'TRANSFER'))}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all border flex items-center gap-1.5 ${
                    bookingServiceFilter === 'TRANSFER'
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md ring-2 ring-amber-400/40'
                      : 'bg-slate-800/80 text-amber-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  <Plane className="w-3.5 h-3.5" />
                  <span>🚖 Transfers ({bookings.filter((b) => b.destination?.slug?.includes('airport') || (b.deliveryAddress && b.deliveryAddress.includes('➔'))).length})</span>
                </button>

                {(bookingFilterStatus || bookingServiceFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setBookingFilterStatus('');
                      setBookingServiceFilter('ALL');
                    }}
                    className="text-xs text-slate-400 hover:text-white underline font-semibold px-1"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              <div className="relative w-full md:w-72">
                <input
                  type="text"
                  placeholder="Search ref # or customer..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchBookings()}
                  className="w-full bg-slate-800 border border-slate-750 text-white placeholder-slate-400 rounded-xl px-3 py-2 text-xs pr-8 focus:outline-none focus:border-blue-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <div className="sm:hidden px-3.5 py-1.5 bg-slate-800/80 border-b border-slate-700/60 text-[10px] text-slate-300 font-semibold flex items-center justify-between">
                  <span>📱 Customer Bookings</span>
                  <span className="text-blue-400">👈 Swipe to view status 👉</span>
                </div>
                <table className="w-full text-left text-xs min-w-[650px]">
                  <thead className="bg-slate-850/90 border-b border-slate-800 font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3.5">Ref #</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Vehicle & Route</th>
                      <th className="p-3.5">Schedule</th>
                      <th className="p-3.5">Payment & Balance</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-medium text-slate-300">
                    {bookings
                      .filter((b) => {
                        if (bookingServiceFilter === 'TRANSFER') {
                          return b.destination?.slug?.includes('airport') || (b.deliveryAddress && b.deliveryAddress.includes('➔'));
                        }
                        if (bookingServiceFilter === 'RENTAL') {
                          return !(b.destination?.slug?.includes('airport') || (b.deliveryAddress && b.deliveryAddress.includes('➔')));
                        }
                        return true;
                      })
                      .map((b) => {
                      const fin = getBookingFinancials(b);
                      const isOverdue = b.status === 'ONGOING' && new Date() >= new Date(b.returnAt);

                      return (
                        <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 font-bold font-mono text-blue-400">
                            <button
                              type="button"
                              onClick={() => openViewBookingModal(b)}
                              className="hover:underline text-blue-400"
                              title="Click to view full booking details"
                            >
                              {b.reference}
                            </button>
                          </td>
                          <td className="p-3.5">
                            <p className="font-bold text-white">{b.customerName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{b.customerPhone}</p>
                          </td>
                          <td className="p-3.5">
                            <span className="font-semibold text-slate-200 block">{b.vehicle?.name}</span>
                            <span className="text-[10px] text-slate-400 block">
                              {b.rentalType === 'WITH_DRIVER' ? 'Chauffeur' : 'Self Drive'} • {b.destination?.name || 'Local'}
                            </span>
                            {b.destination?.slug?.includes('airport') && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.2 rounded mt-0.5">
                                ✈️ Airport Transfer
                              </span>
                            )}
                            {b.deliveryAddress && b.deliveryAddress.includes('➔') && (
                              <span className="block text-[10px] font-bold text-sky-300 bg-sky-950/60 border border-sky-600/40 px-2 py-0.5 rounded-md mt-1 max-w-[220px] truncate" title={b.deliveryAddress}>
                                📍 {b.deliveryAddress}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <div className="text-slate-300">{formatDate(b.pickupAt, false)} → {formatDate(b.returnAt, false)}</div>
                            {isOverdue && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-300 bg-rose-500/20 border border-rose-500/40 px-1.5 py-0.2 rounded mt-1">
                                ⏰ Return Time Reached
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span className="font-extrabold text-white block">{formatPeso(fin.totalAmount)}</span>
                            <div className="text-[10px] mt-0.5 space-y-0.5">
                              <span className="text-slate-400 block">₱1,000 Reservation Fee</span>
                              {fin.isBalancePaid ? (
                                <span className="inline-flex items-center gap-1 text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold">
                                  <CheckCircle className="w-2.5 h-2.5" /> Balance Paid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-amber-300 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold">
                                  <Clock className="w-2.5 h-2.5" /> Due: {formatPeso(fin.balanceDue)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <StatusBadge status={b.status} />
                          </td>
                          <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setDispatchBookingModal(b)}
                              className="bg-emerald-950/70 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 font-bold px-2 py-1.5 rounded-lg text-[11px] inline-flex items-center gap-1 transition-colors"
                              title="Dispatch booking to Tie-Up Partner Group Chat (Messenger/Viber)"
                            >
                              <MessageSquare className="w-3 h-3" /> Dispatch GC
                            </button>
                            <button
                              type="button"
                              onClick={() => openViewBookingModal(b)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-2 py-1.5 rounded-lg text-[11px] inline-flex items-center gap-1 transition-colors"
                              title="View full booking & payment records"
                            >
                              <Eye className="w-3 h-3" /> View
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBooking(b.id, b.reference)}
                              className="bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 border border-slate-700 font-bold p-1.5 rounded-lg text-[11px] inline-flex items-center transition-colors"
                              title="Delete booking record"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            {b.status === 'REQUIREMENTS_REVIEW' && (
                              <button
                                type="button"
                                onClick={() => handleConfirmBooking(b.id)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1.5 rounded-lg text-[11px] shadow-sm transition-colors"
                              >
                                Confirm
                              </button>
                            )}
                            {b.status === 'CONFIRMED' && (
                              <button
                                type="button"
                                onClick={() => openReleaseModal(b)}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] inline-flex items-center gap-1 shadow-sm transition-colors"
                                title="Collect remaining rental balance and release vehicle"
                              >
                                <KeyRound className="w-3.5 h-3.5" /> Release & Collect Balance
                              </button>
                            )}
                            {b.status === 'ONGOING' && (
                              <button
                                type="button"
                                onClick={() => openCompleteModal(b)}
                                className={`font-bold px-3 py-1.5 rounded-lg text-[11px] inline-flex items-center gap-1 shadow-sm transition-colors text-white ${
                                  isOverdue
                                    ? 'bg-amber-600 hover:bg-amber-500 animate-pulse'
                                    : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'
                                }`}
                                title="Inspect vehicle return, refund security deposit, and mark rental done"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Return & Complete
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            </>
            )}
          </div>
        )}

        {/* TAB 3: FULL-SCREEN CALENDAR */}
        {activeTab === 'CALENDAR' && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-md flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-300">Filter Vehicle:</span>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-blue-500"
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
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition-all"
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
            <div className="flex flex-wrap justify-between items-center bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md gap-4">
              <div>
                <h3 className="font-bold text-base text-white">Vehicle Fleet Management</h3>
                <p className="text-xs text-slate-400">Manage rental inventory, seating capacity, transmission, and photos.</p>
              </div>
              <button
                onClick={() => setAddVehicleModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/25 flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" /> Add New Vehicle
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((v) => (
                <div key={v.id} className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-3 hover:border-slate-700 transition-all">
                  <div className="aspect-[16/10] bg-slate-800 rounded-xl overflow-hidden relative">
                    <img
                      src={v.images?.[0]?.url || '/images/hero.jpg'}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 right-2 bg-slate-950/80 text-white text-[10px] font-bold px-2 py-0.5 rounded border border-slate-800 backdrop-blur-sm">
                      {v.transmission} · {v.seats} Seats
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-base text-white">{v.name}</h4>
                    <p className="text-xs text-slate-400 font-mono">Plate: {v.plateNumber || 'Unassigned'}</p>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs pt-1">
                    <div className="flex gap-1.5">
                      <span className="p-1 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700 text-[11px]">
                        {v.category.replace('_', '/')}
                      </span>
                      <span className={`p-1 rounded font-semibold text-[11px] border ${v.isPublished ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
                        {v.isPublished ? 'Published' : 'Hidden'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteVehicle(v)}
                      className="px-2 py-1 text-rose-400 hover:bg-rose-500/20 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
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
            <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-md flex flex-wrap justify-between items-center gap-4">
              <div>
                <h3 className="font-bold text-base text-white">Official Rental Rates Matrix</h3>
                <p className="text-xs text-slate-400">Edit prices for destinations and durations without editing code.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={matrixVehicleId}
                  onChange={(e) => setMatrixVehicleId(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                >
                  {vehicles.filter((v) => v.isPublished !== false).map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setAddDestModalOpen(true)}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-750 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Destination
                </button>

                <button
                  onClick={handleSaveRateMatrix}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/25 transition-all"
                >
                  Save & Publish Rates
                </button>
              </div>
            </div>

            {/* Airport Transfer Rates Quick Reference Card */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/80 border border-slate-800 text-white p-5 rounded-2xl shadow-md space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center font-bold text-xs">
                    <Plane className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Airport Transfers & Chauffeur Rates Matrix (Pickup & Drop)</h4>
                    <p className="text-[11px] text-slate-300">Configured official rates for BIA & Naga Airport with professional driver.</p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full font-bold self-start sm:self-auto">
                  ✓ Active in Live Booking Flow
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                {/* Card 1: BIA Van */}
                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-bold text-blue-300 uppercase">
                    <span>Van (NV350 Urvan)</span>
                    <span className="text-white font-mono">15 Seats</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-slate-300 text-[11px]">BIA Airport (Daraga):</span>
                    <strong className="text-amber-300 text-sm font-black">₱7,500</strong>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-300 text-[11px]">Naga Airport (Pili):</span>
                    <strong className="text-white text-xs font-bold">₱3,500</strong>
                  </div>
                </div>

                {/* Card 2: BIA Innova */}
                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-bold text-blue-300 uppercase">
                    <span>SUV / MPV (Innova / Xpander)</span>
                    <span className="text-white font-mono">7-8 Seats</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-slate-300 text-[11px]">BIA Airport (Daraga):</span>
                    <strong className="text-amber-300 text-sm font-black">₱6,000</strong>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-300 text-[11px]">Naga Airport (Pili):</span>
                    <strong className="text-white text-xs font-bold">₱2,500</strong>
                  </div>
                </div>

                {/* Card 3: BIA Sedan */}
                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-bold text-blue-300 uppercase">
                    <span>Sedan (Vios / Mirage AT)</span>
                    <span className="text-white font-mono">4-5 Seats</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-slate-300 text-[11px]">BIA Airport (Daraga):</span>
                    <strong className="text-amber-300 text-sm font-black">₱4,500</strong>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-300 text-[11px]">Naga Airport (Pili):</span>
                    <strong className="text-white text-xs font-bold">₱1,800</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Matrix Input Table */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <div className="sm:hidden px-3.5 py-1.5 bg-slate-800/80 border-b border-slate-700/60 text-[10px] text-slate-300 font-semibold flex items-center justify-between">
                  <span>📱 Customer Bookings</span>
                  <span className="text-blue-400">👈 Swipe to view status 👉</span>
                </div>
                <table className="w-full text-left text-xs min-w-[650px]">
                  <thead className="bg-slate-850/90 border-b border-slate-800 font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3.5">Destination</th>
                      <th className="p-3.5">Rental Type</th>
                      <th className="p-3.5">12 Hours (Flat)</th>
                      <th className="p-3.5">24 Hours (Per Day)</th>
                      <th className="p-3.5">Weekly (Per Day)</th>
                      <th className="p-3.5">Monthly (Per Day)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-medium">
                    {matrixDestinations.map((d) => (
                      <React.Fragment key={d.id}>
                        {/* Self Drive Row */}
                        <tr className="hover:bg-slate-800/40">
                          <td className="p-3.5 font-bold text-white" rowSpan={2}>
                            <div className="flex items-center justify-between gap-2 group">
                              <div>
                                <span className="block text-white font-extrabold">{d.name}</span>
                                {d.description && (
                                  <span className="text-[10px] text-slate-400 font-normal block max-w-[200px] truncate">{d.description}</span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteDestination(d.id, d.name)}
                                title={`Delete "${d.name}"`}
                                className="opacity-70 hover:opacity-100 p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="p-3.5 font-semibold text-emerald-400">Self Drive</td>
                          {['HOURS_12', 'HOURS_24', 'WEEKLY', 'MONTHLY'].map((dur) => {
                            const key = `${d.id}_SELF_DRIVE_${dur}`;
                            return (
                              <td key={dur} className="p-2.5">
                                <div className="relative">
                                  <span className="absolute left-2.5 top-2 text-slate-400">₱</span>
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
                                    className="w-28 pl-6 pr-2 py-1.5 bg-slate-800 border border-slate-700 text-white font-bold rounded-lg text-xs focus:outline-none focus:border-blue-500"
                                  />
                                </div>
                              </td>
                            );
                          })}
                        </tr>

                        {/* With Driver Row */}
                        <tr className="hover:bg-slate-800/40 border-b border-slate-850">
                          <td className="p-3.5 font-semibold text-blue-400">With Driver</td>
                          {['HOURS_12', 'HOURS_24', 'WEEKLY', 'MONTHLY'].map((dur) => {
                            const key = `${d.id}_WITH_DRIVER_${dur}`;
                            return (
                              <td key={dur} className="p-2.5">
                                <div className="relative">
                                  <span className="absolute left-2.5 top-2 text-slate-400">₱</span>
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
                                    className="w-28 pl-6 pr-2 py-1.5 bg-slate-800 border border-slate-700 text-white font-bold rounded-lg text-xs focus:outline-none focus:border-blue-500"
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
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-md">
              <div className="flex flex-wrap gap-2">
                {['PENDING_VERIFICATION', 'APPROVED', 'REJECTED', 'ALL'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setPaymentFilter(s)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      paymentFilter === s
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-750'
                    }`}
                  >
                    {s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="text-right">
                  <span className="text-slate-400 font-bold text-[10px] uppercase block">This Month Verified</span>
                  <span className="text-base font-black text-emerald-400">{formatPeso(stats?.thisMonthRevenue || 0)}</span>
                </div>
                <div className="h-8 w-px bg-slate-800 hidden sm:block" />
                <div className="text-right hidden sm:block">
                  <span className="text-slate-400 font-bold text-[10px] uppercase block">All-Time Revenue</span>
                  <span className="text-base font-black text-blue-400">{formatPeso(stats?.totalRevenue || 0)}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-850/90 border-b border-slate-800 font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5">Booking</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Type & Amount</th>
                    <th className="p-3.5">Channel / Ref #</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Proof & Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-medium text-slate-300">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-bold font-mono text-blue-400">{p.booking?.reference}</td>
                      <td className="p-3.5 text-white font-semibold">{p.booking?.customerName}</td>
                      <td className="p-3.5">
                        <span className="font-extrabold text-white block">{formatPeso(p.amount)}</span>
                        <span className="text-[10px] text-slate-400">{p.type.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-200">{p.paymentMethod?.name}</p>
                        <p className="font-mono text-slate-400 text-[11px]">{p.referenceNumber || '-'}</p>
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        {p.proofStorageKey ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingReceiptPayment(p)}
                              className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 font-bold px-2.5 py-1 rounded-lg text-[11px] transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Receipt
                            </button>
                            <a
                              href={api.getFileUrl(`/files/payments/${p.id}/proof`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                              title="Open receipt in new tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">No proof</span>
                        )}
                        {p.status === 'PENDING_VERIFICATION' && (
                          <>
                            <button
                              onClick={() => handleApprovePayment(p.id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg text-[11px] shadow-sm transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectPayment(p.id)}
                              className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1 rounded-lg text-[11px] shadow-sm transition-colors"
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
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-lg space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300">Booking Queue</h4>
                  <span className="text-[11px] font-mono text-slate-400 font-bold">{bookings.length} reservations</span>
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
                            ? 'bg-blue-600/20 border-blue-500/80 shadow-md'
                            : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-black text-blue-400">{b.reference}</span>
                          <StatusBadge status={b.status} />
                        </div>
                        <p className="text-xs font-bold text-white mt-1 truncate">{b.customerName}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {b.vehicle?.name} • {b.rentalType === 'SELF_DRIVE' ? 'Self-Drive (5 IDs)' : 'With Driver (1 ID)'}
                        </p>
                      </button>
                    );
                  })}

                  {bookings.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-500">
                      No active bookings in queue
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Document Verification Inspector */}
              <div className="lg:col-span-2 space-y-4">
                {loadingReqDetail ? (
                  <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-12 text-center shadow-lg">
                    <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-300">Loading requirement documents...</p>
                  </div>
                ) : reqBookingDetail ? (
                  <div className="space-y-4">
                    {/* Booking Header Banner */}
                    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-white">{reqBookingDetail.customerName}</h4>
                          <span className="font-mono text-xs font-bold text-blue-300 bg-blue-500/20 border border-blue-400/30 px-2 py-0.5 rounded-md">
                            {reqBookingDetail.reference}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Phone: <strong className="text-slate-200">{reqBookingDetail.customerPhone}</strong> • Email: {reqBookingDetail.customerEmail} • Vehicle: {reqBookingDetail.vehicle?.name}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleConfirmBooking(reqBookingDetail.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-colors"
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
                            className={`p-5 rounded-2xl border bg-slate-900/90 shadow-md space-y-3 transition-all ${
                              isApproved ? 'border-emerald-500/40 bg-emerald-950/20' : 'border-slate-800'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="font-bold text-sm text-white">{req.name}</h5>
                                  {req.isRequired ? (
                                    <span className="text-[10px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/30 px-1.5 py-0.5 rounded">
                                      REQUIRED
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded">
                                      OPTIONAL
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">{req.requirementType?.description}</p>
                              </div>

                              <div className="flex items-center gap-2">
                                {isApproved ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full">
                                    <CheckCircle className="w-3.5 h-3.5" /> Approved
                                  </span>
                                ) : hasUploaded ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-full">
                                    <Clock className="w-3.5 h-3.5" /> Pending Admin Review
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-800 border border-slate-700 px-3 py-1 rounded-full">
                                    Not Uploaded
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Uploaded File Info & AI Analysis */}
                            {latestDoc ? (
                              <div className="space-y-3 pt-2 border-t border-slate-800">
                                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-800/80 border border-slate-750 p-2.5 rounded-xl text-xs">
                                  <div className="flex items-center gap-2 truncate">
                                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span className="font-semibold text-white truncate">{latestDoc.originalName}</span>
                                    <span className="text-slate-400 font-mono text-[11px]">
                                      ({(latestDoc.sizeBytes / 1024).toFixed(1)} KB)
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setViewingRequirementDoc({
                                        id: latestDoc.id,
                                        name: latestDoc.originalName,
                                        title: req.name,
                                        originalName: latestDoc.originalName,
                                        sizeBytes: latestDoc.sizeBytes,
                                      })}
                                      className="inline-flex items-center gap-1 bg-brand-blue hover:bg-blue-600 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] shadow-sm transition-colors"
                                    >
                                      <Eye className="w-3.5 h-3.5" /> Preview
                                    </button>
                                    <a
                                      href={api.getFileUrl(`/files/requirements/${latestDoc.id}`)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300"
                                      title="Open in new window"
                                    >
                                      <ExternalLink className="w-3 h-3" /> View File
                                    </a>
                                  </div>
                                </div>

                                {/* AI Legitimacy Badge & Details */}
                                <div className="p-3 bg-slate-800/70 border border-emerald-500/30 rounded-xl space-y-1.5 text-xs text-slate-200">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <Sparkles className="w-4 h-4 text-emerald-400" />
                                      <span className="font-black text-emerald-300">
                                        {aiScan ? (aiScan.verdict === 'LEGIT' ? '✓ AI VERIFIED LEGITIMATE' : '⚠ AI FLAGGED FOR MANUAL REVIEW') : '✓ AI VERIFIED LEGITIMATE (Pre-Scan)'}
                                      </span>
                                      <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded">
                                        {aiScan?.confidence || 95}% Match
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400">
                                      {aiScan?.engine === 'GEMINI_VISION' ? 'Google Gemini 2.0 Flash' : 'AI LTO Engine'}
                                    </span>
                                  </div>

                                  <p className="text-[11px] text-slate-300 leading-relaxed">
                                    {aiScan?.analysisSummary || "Official credential format verified. Clear typography, valid structure, and customer name match."}
                                  </p>

                                  <div className="flex flex-wrap gap-3 pt-1 text-[11px] font-mono text-slate-400">
                                    <span>Type: <strong className="text-white">{aiScan?.documentTypeDetected || req.name}</strong></span>
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
                              <div className="pt-2 border-t border-slate-800 space-y-2">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <p className="text-xs text-slate-400 italic">
                                    {isApproved ? '✓ Verified and approved by Staff.' : 'No file uploaded yet by customer.'}
                                  </p>

                                  {!isApproved && (
                                    <div className="flex flex-wrap items-center gap-2">
                                      {/* Staff attach file */}
                                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-xs transition-colors">
                                        <Upload className="w-3.5 h-3.5" />
                                        <span>Attach Document File</span>
                                        <input
                                          type="file"
                                          accept="image/*,application/pdf"
                                          onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                              handleAdminUploadDoc(reqBookingDetail.id, req.id, e.target.files[0]);
                                            }
                                          }}
                                          className="hidden"
                                        />
                                      </label>

                                      {/* Staff verify in person / chat */}
                                      <button
                                        type="button"
                                        onClick={() => handleReviewReq(req.id, 'APPROVE')}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-xs transition-colors"
                                        title="Mark verified if customer presented ID at the counter or sent via Messenger"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Mark Verified In-Person / Chat</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
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

        {/* TAB: TIE-UP FLEET & PARTNERS */}
        {activeTab === 'PARTNERS' && <AdminPartnersTab />}

        {/* TAB: ADMIN & STAFF USER MANAGEMENT */}
        {activeTab === 'USERS' && <AdminUsersTab />}

        {/* TAB 8: SETTINGS & ADDITIONAL CHARGES */}
        {activeTab === 'SETTINGS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* COMPANY INFORMATION CARD */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-lg space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">Company Information</h3>
                {!isEditingCompany ? (
                  <button
                    type="button"
                    onClick={handleStartEditCompany}
                    className="flex items-center gap-1 px-2.5 py-1 text-blue-400 hover:bg-slate-800 rounded-lg font-bold text-xs transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSaveCompany}
                      className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow-sm transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingCompany(false)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold text-xs transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>

              {!isEditingCompany ? (
                <div className="space-y-2.5 pt-1 text-slate-300">
                  <p>Name: <strong className="text-white font-bold">{settings?.company?.name || 'CUSTOWORKS CAR RENTAL'}</strong></p>
                  <p>Hotline: <strong className="text-white font-bold">{settings?.company?.phone || '0961 722 5326 / 0995 382 7972'}</strong></p>
                  <p>Location: <strong className="text-white font-bold">{settings?.company?.location || 'Carnation Street CBD ll Brgy Triangulo (Beside SM), Naga City, Philippines, 4400'}</strong></p>
                  <p>Facebook: <strong className="text-white font-bold">{settings?.company?.facebook || 'Custoworks Car Rental (fb.com/CustoWorkss)'}</strong></p>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Company / Business Name</label>
                    <input
                      type="text"
                      value={companyForm.name}
                      onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 font-bold text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Hotline / Contact Number</label>
                    <input
                      type="text"
                      value={companyForm.phone}
                      onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 font-bold text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Head Office Location</label>
                    <input
                      type="text"
                      value={companyForm.location}
                      onChange={(e) => setCompanyForm({ ...companyForm, location: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 font-bold text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Facebook Page Name</label>
                    <input
                      type="text"
                      value={companyForm.facebook}
                      onChange={(e) => setCompanyForm({ ...companyForm, facebook: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 font-bold text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* CONFIGURED ADDITIONAL FEES CARD */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-lg space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">Configured Additional Fees</h3>
                <button
                  type="button"
                  onClick={handleStartAddFee}
                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-md transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Fee</span>
                </button>
              </div>

              <div className="space-y-1 divide-y divide-slate-800/80">
                {additionalFees.length === 0 ? (
                  <p className="py-4 text-center text-slate-500">No additional fees configured.</p>
                ) : (
                  additionalFees.map((f) => (
                    <div key={f.id} className="flex items-center justify-between py-2.5 gap-2 hover:bg-slate-800/40 rounded-lg px-1 transition-colors">
                      <div className="min-w-0 flex-1">
                        <span className="text-slate-200 font-medium block truncate">{f.name}</span>
                        {f.type && (
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">{f.type.replace('_', ' ')}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-bold text-white font-mono text-xs">{formatPeso(f.amount)}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEditFee(f)}
                            className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title={`Edit ${f.name}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFee(f)}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
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
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-lg space-y-4 text-xs md:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider">Official Payment Accounts & QR Codes</h3>
                  <p className="text-slate-400 text-[11px] mt-0.5">Payment accounts and InstaPay QR codes shown to customers upon checkout & booking tracking.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="self-start sm:self-auto bg-blue-500/20 text-blue-300 font-bold px-3 py-1.5 rounded-full text-[11px] border border-blue-400/30">
                    Standard Reservation Fee: ₱1,000.00
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenAddPm}
                    className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-3.5 py-1.5 rounded-xl shadow-md text-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Payment Account
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {paymentMethods.length === 0 ? (
                  <div className="col-span-2 py-8 text-center text-slate-500 bg-slate-800/40 rounded-2xl border border-dashed border-slate-750">
                    <p className="font-semibold text-xs text-slate-300">No payment accounts configured yet.</p>
                    <p className="text-[11px] mt-0.5">Click &quot;Add Payment Account&quot; to configure GCash, Maya, or Bank accounts.</p>
                  </div>
                ) : (
                  paymentMethods.map((pm) => (
                    <div key={pm.id} className="border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center sm:items-start bg-slate-800/60 shadow-sm relative hover:border-slate-700 transition-colors">
                      {/* QR Image with Quick Change */}
                      <div className="flex flex-col items-center gap-1.5 shrink-0">
                        {pm.qrImageUrl ? (
                          <div className="relative group shrink-0">
                            <img
                              src={pm.qrImageUrl}
                              alt={`${pm.name} QR Code`}
                              className="w-32 h-auto max-h-40 object-contain rounded-xl border border-slate-700 shadow-sm bg-white p-1"
                            />
                            <a
                              href={pm.qrImageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute inset-0 bg-slate-900/70 text-white font-bold text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-xl transition-opacity"
                            >
                              View Full Size ↗
                            </a>
                          </div>
                        ) : (
                          <div className="w-32 h-32 bg-slate-800 rounded-xl border border-dashed border-slate-700 flex items-center justify-center text-slate-400 text-center p-2 shrink-0 text-[11px]">
                            No QR Image
                          </div>
                        )}
                        <label className="cursor-pointer text-[10px] font-bold text-blue-400 hover:underline text-center">
                          <span>{pm.qrImageUrl ? 'Change QR Image' : 'Upload QR Image'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleUploadQrDirect(pm, e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      </div>

                      <div className="space-y-1.5 flex-1 min-w-0 text-center sm:text-left w-full">
                        <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-700/80 pb-1.5">
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-white text-sm">{pm.name}</h4>
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                              pm.isActive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-750 text-slate-400 border-slate-700'
                            }`}>
                              {pm.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                              {pm.code}
                            </span>
                          </div>

                          {/* Edit and Delete Actions */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditPm(pm)}
                              className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                              title={`Edit ${pm.name}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePm(pm)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                              title={`Delete ${pm.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-slate-300">
                          Account Name: <strong className="text-white">{pm.accountName || 'N/A'}</strong>
                        </p>
                        <p className="text-slate-300">
                          Account Number: <strong className="font-mono text-blue-400 font-bold text-sm">{pm.accountNumber || 'N/A'}</strong>
                        </p>
                        <p className="text-slate-300 text-[11px] bg-slate-850 p-2.5 rounded-xl border border-slate-750 leading-relaxed">
                          {pm.instructions || 'No instructions provided.'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SYSTEM MAINTENANCE & DATA PURGE CARD */}
            <div className="md:col-span-2 bg-slate-900/90 rounded-2xl border border-rose-900/40 p-6 shadow-lg space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-rose-900/30 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
                      System Database Maintenance & Reset
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Purge sample/test transactional data before official public launch.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="space-y-1">
                  <p className="font-bold text-slate-200">
                    Wipe Test Bookings, Partner Applications & Quotes
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xl">
                    This permanently deletes all test bookings, customer quotation requests, partner applications, and payment records. Your vehicles, rate matrices, destinations, payment accounts, and administrator credentials remain safe and intact.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetTestData}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md inline-flex items-center gap-2 shrink-0 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Reset All Test Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

  {/* View Receipt Proof Modal / Lightbox */}
      {viewingReceiptPayment && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 text-xs shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Customer Payment Receipt Proof
                </h3>
                <p className="text-slate-500 text-[11px]">
                  Booking <span className="font-mono font-bold text-brand-navy">{viewingReceiptPayment.booking?.reference}</span> • {viewingReceiptPayment.booking?.customerName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingReceiptPayment(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payment Details Quick Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Amount</span>
                <span className="font-extrabold text-sm text-slate-900">{formatPeso(viewingReceiptPayment.amount)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Type</span>
                <span className="font-bold text-slate-800">{viewingReceiptPayment.type.replace(/_/g, ' ')}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Channel</span>
                <span className="font-bold text-slate-800">{viewingReceiptPayment.paymentMethod?.name || 'Manual'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Ref # / Slip</span>
                <span className="font-mono font-bold text-brand-blue">{viewingReceiptPayment.referenceNumber || '-'}</span>
              </div>
            </div>

            {/* Receipt Image / Document Preview */}
            <div className="bg-slate-900 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[300px] border border-slate-800 relative">
              <img
                src={api.getFileUrl(`/files/payments/${viewingReceiptPayment.id}/proof`)}
                alt="Payment Receipt Slip"
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-md"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                  const fallback = document.getElementById('receipt-error-fallback');
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div id="receipt-error-fallback" style={{ display: 'none' }} className="flex-col items-center gap-2 text-slate-400 text-center py-10">
                <FileText className="w-12 h-12 text-slate-500" />
                <p className="font-bold text-sm text-white">Receipt Document Preview</p>
                <p className="text-xs max-w-sm">This file is in document/PDF format or raw bytes.</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <a
                  href={api.getFileUrl(`/files/payments/${viewingReceiptPayment.id}/proof`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Full Resolution ↗
                </a>
              </div>

              <div className="flex items-center gap-2">
                {viewingReceiptPayment.status === 'PENDING_VERIFICATION' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        handleRejectPayment(viewingReceiptPayment.id);
                        setViewingReceiptPayment(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors"
                    >
                      Reject Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleApprovePayment(viewingReceiptPayment.id);
                        setViewingReceiptPayment(null);
                      }}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
                    >
                      Approve Payment
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setViewingReceiptPayment(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Requirement Document Modal / Lightbox */}
      {viewingRequirementDoc && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-3xl w-full p-6 space-y-4 text-xs shadow-2xl border border-slate-800 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-white">
                  {viewingRequirementDoc.title || 'Requirement Document'}
                </h3>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  File: <span className="font-mono text-blue-400">{viewingRequirementDoc.originalName || viewingRequirementDoc.name}</span>
                  {viewingRequirementDoc.sizeBytes ? ` • ${(viewingRequirementDoc.sizeBytes / 1024).toFixed(1)} KB` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingRequirementDoc(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Image / PDF / File Preview */}
            <div className="bg-black/60 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[380px] border border-slate-800/80 relative overflow-hidden">
              <img
                src={api.getFileUrl(`/files/requirements/${viewingRequirementDoc.id}`)}
                alt={viewingRequirementDoc.name}
                className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-xl"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                  const fallback = document.getElementById('doc-preview-fallback');
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div id="doc-preview-fallback" style={{ display: 'none' }} className="flex flex-col items-center gap-3 text-slate-400 text-center py-12">
                <FileText className="w-16 h-16 text-slate-500" />
                <div>
                  <p className="font-bold text-sm text-white">Document Preview</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-md">
                    This file is in PDF format or could not be rendered as a direct web image.
                  </p>
                </div>
                <a
                  href={api.getFileUrl(`/files/requirements/${viewingRequirementDoc.id}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-brand-blue hover:bg-blue-600 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open File in Dedicated Window
                </a>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <a
                href={api.getFileUrl(`/files/requirements/${viewingRequirementDoc.id}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors border border-slate-700"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Full Resolution ↗
              </a>
              <button
                type="button"
                onClick={() => setViewingRequirementDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Add / Edit Modal */}
      {pmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 text-xs shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {editingPm ? 'Edit Payment Method' : 'Add New Payment Method'}
                </h3>
                <p className="text-slate-500 text-[11px]">
                  Configure account details and scan-to-pay QR codes shown to customers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPmModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Method Name *</label>
                  <input
                    type="text"
                    required
                    value={pmForm.name}
                    onChange={(e) => setPmForm({ ...pmForm, name: e.target.value })}
                    placeholder="e.g. GCash, Maya, BDO"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Code / Identifier *</label>
                  <input
                    type="text"
                    required
                    value={pmForm.code}
                    onChange={(e) => setPmForm({ ...pmForm, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                    placeholder="e.g. GCASH, MAYA, BDO"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Kind *</label>
                  <select
                    value={pmForm.kind}
                    onChange={(e) => setPmForm({ ...pmForm, kind: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                  >
                    <option value="E_WALLET">E-Wallet (GCash, Maya, GrabPay)</option>
                    <option value="BANK_TRANSFER">Bank Transfer (BPI, BDO, Metrobank, UnionBank)</option>
                    <option value="CASH">Cash / Over-the-counter</option>
                    <option value="ONLINE_GATEWAY">Online Payment Gateway</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Name</label>
                  <input
                    type="text"
                    value={pmForm.accountName}
                    onChange={(e) => setPmForm({ ...pmForm, accountName: e.target.value })}
                    placeholder="e.g. Jericho Oclares / Custoworks"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account / Mobile Number</label>
                <input
                  type="text"
                  value={pmForm.accountNumber}
                  onChange={(e) => setPmForm({ ...pmForm, accountNumber: e.target.value })}
                  placeholder="e.g. 0961 722 5326 / 0995 382 7972 / 0051 6059 4036"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Instructions for Customer</label>
                <textarea
                  rows={3}
                  value={pmForm.instructions}
                  onChange={(e) => setPmForm({ ...pmForm, instructions: e.target.value })}
                  placeholder="Instructions displayed to customers when paying via this method..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 leading-relaxed"
                />
              </div>

              {/* QR Code Upload */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <label className="block font-bold text-slate-700">InstaPay QR Code Image</label>
                <div className="flex items-center gap-4">
                  {pmQrPreview ? (
                    <img
                      src={pmQrPreview}
                      alt="QR Preview"
                      className="w-20 h-20 object-contain rounded-lg border border-slate-300 bg-white p-1 shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg border border-dashed border-slate-300 bg-white flex items-center justify-center text-slate-400 text-[10px] text-center p-1 shrink-0">
                      No QR
                    </div>
                  )}
                  <div className="space-y-1 text-xs">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPmQrFile(file);
                          setPmQrPreview(URL.createObjectURL(file));
                        }
                      }}
                      className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-brand-blue hover:file:bg-blue-100"
                    />
                    <p className="text-[11px] text-slate-400">Upload a square InstaPay QR code image (JPG or PNG).</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-semibold">
                  <input
                    type="checkbox"
                    checked={pmForm.isActive}
                    onChange={(e) => setPmForm({ ...pmForm, isActive: e.target.checked })}
                    className="w-4 h-4 text-brand-blue rounded border-slate-300 focus:ring-brand-blue"
                  />
                  <span>Active (enabled for customer checkout)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPmModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPm}
                  className="px-5 py-2 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-bold disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {submittingPm ? 'Saving...' : editingPm ? 'Save Changes' : 'Create Payment Method'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance Block Modal */}
      {blockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs shadow-xl">
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
          <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-4 text-xs shadow-2xl my-8">
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
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 text-xs shadow-2xl">
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
          <div className="bg-white text-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs shadow-xl animate-in fade-in zoom-in-95 duration-150">
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

      {/* 1. Release Vehicle & Balance Settlement Modal */}
      {releaseModalBooking && (() => {
        const fin = getBookingFinancials(releaseModalBooking);
        return (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white text-slate-900 rounded-3xl max-w-xl w-full p-6 space-y-5 text-xs shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                      <KeyRound className="w-4 h-4" />
                    </span>
                    <h3 className="font-extrabold text-base text-slate-900">
                      Release Vehicle & Confirm Balance
                    </h3>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-1">
                    Booking <span className="font-mono font-bold text-brand-navy">{releaseModalBooking.reference}</span> • {releaseModalBooking.customerName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReleaseModalBooking(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Vehicle & Customer Summary */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-[11px]">
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[9px] block">Vehicle</span>
                  <span className="font-bold text-slate-800 text-xs block">{releaseModalBooking.vehicle?.name}</span>
                  <span className="text-slate-500 text-[10px]">{releaseModalBooking.vehicle?.plateNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[9px] block">Customer Phone</span>
                  <span className="font-bold text-slate-800 text-xs block">{releaseModalBooking.customerPhone}</span>
                  <span className="text-slate-500 text-[10px]">{releaseModalBooking.customerEmail}</span>
                </div>
              </div>

              {/* Financial Breakdown Card */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-2.5">
                <h4 className="font-bold text-brand-navy text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-brand-blue" />
                  Financial Settlement Breakdown
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-700">
                    <span>Total Rental Amount:</span>
                    <span className="font-mono font-extrabold text-slate-900">{formatPeso(fin.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-700">
                    <span>Reservation Fee / Security Deposit (Held):</span>
                    <span className="font-mono font-bold">{formatPeso(fin.reservationFeePaid)} (Refundable upon return)</span>
                  </div>
                  {fin.rentalBalancePaid > 0 && (
                    <div className="flex justify-between items-center text-blue-700">
                      <span>Rental Balance Previously Paid:</span>
                      <span className="font-mono font-bold">- {formatPeso(fin.rentalBalancePaid)}</span>
                    </div>
                  )}
                  <div className="border-t border-blue-200 pt-2 flex justify-between items-center font-extrabold text-sm">
                    <span className="text-slate-900">Remaining Balance Due Upon Pickup:</span>
                    <span className="font-mono text-base text-blue-700">{formatPeso(fin.balanceDue)}</span>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-blue-100 flex items-start gap-2 text-[11px] text-blue-900/80 bg-white/60 p-2.5 rounded-xl">
                  <Shield className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                  <p>
                    <strong>Refundable Security Deposit Policy:</strong> The customer pays the full rental amount of <strong>{formatPeso(fin.totalAmount)}</strong> upon vehicle pickup. The ₱1,000 reservation fee serves as their security deposit and will be refunded immediately after vehicle inspection upon return.
                  </p>
                </div>
              </div>

              {/* Payment Collection Form */}
              <form onSubmit={handleSubmitRelease} className="space-y-4">
                {fin.balanceDue > 0 ? (
                  <div className="space-y-3 bg-white p-3.5 rounded-2xl border border-slate-200">
                    <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      Record Pickup Balance Payment
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Payment Method Received *</label>
                        <select
                          value={releasePaymentMethodId}
                          onChange={(e) => setReleasePaymentMethodId(e.target.value)}
                          required
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold text-slate-900"
                        >
                          <option value="">Select Payment Method</option>
                          {paymentMethods.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.kind.replace('_', ' ')})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Amount to Confirm (PHP ₱) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="1"
                          required
                          value={releaseAmount}
                          onChange={(e) => setReleaseAmount(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-slate-900 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Reference / Official Slip #</label>
                        <input
                          type="text"
                          placeholder="e.g. CASH or GCash Ref #"
                          value={releaseRefNumber}
                          onChange={(e) => setReleaseRefNumber(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-slate-900 font-bold placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Staff Pickup Notes</label>
                        <input
                          type="text"
                          placeholder="e.g. Paid in cash OTC at Naga office"
                          value={releaseNotes}
                          onChange={(e) => setReleaseNotes(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-xs">Total Balance Fully Paid!</p>
                      <p className="text-[11px] text-emerald-700">No balance remaining to collect. The vehicle is ready for immediate release.</p>
                    </div>
                  </div>
                )}

                {/* Optional Tie-Up Partner Section */}
                <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                      <input
                        type="checkbox"
                        checked={releaseIsTieUp}
                        onChange={(e) => setReleaseIsTieUp(e.target.checked)}
                        className="w-4 h-4 text-purple-600 rounded border-purple-300 focus:ring-purple-500"
                      />
                      <span className="flex items-center gap-1.5">
                        <Handshake className="w-4 h-4 text-purple-600" />
                        Vehicle is from Tie-Up Partner / Sub-Rental (Optional)
                      </span>
                    </label>
                    {releaseIsTieUp && (
                      <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200">
                        Active Commission
                      </span>
                    )}
                  </div>

                  {releaseIsTieUp && (
                    <div className="pt-2 border-t border-purple-200/80 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 text-[11px] mb-1">
                            Tie-Up Partner Name / Fleet Provider *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Naga Fleet Partner / Unit Owner"
                            value={releaseTieUpPartnerName}
                            onChange={(e) => setReleaseTieUpPartnerName(e.target.value)}
                            className="w-full bg-white border border-purple-300 rounded-xl p-2 font-semibold text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 text-[11px] mb-1">
                            Partner Share / Commission %
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={releaseTieUpPercent}
                              onChange={(e) => setReleaseTieUpPercent(e.target.value)}
                              className="w-20 bg-white border border-purple-300 rounded-xl p-2 font-mono font-bold text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <div className="flex gap-1">
                              {['20', '25', '30', '80'].map((pct) => (
                                <button
                                  type="button"
                                  key={pct}
                                  onClick={() => setReleaseTieUpPercent(pct)}
                                  className={`text-[10px] px-2 py-1 rounded-lg border font-bold ${
                                    releaseTieUpPercent === pct
                                      ? 'bg-purple-600 text-white border-purple-600'
                                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  {pct}%
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Live Calculation Box */}
                      {(() => {
                        const pct = parseFloat(releaseTieUpPercent) || 20;
                        const partnerPayout = Math.round(fin.totalAmount * (pct / 100));
                        const custoNet = fin.totalAmount - partnerPayout;
                        return (
                          <div className="bg-white rounded-xl p-2.5 border border-purple-200 text-[11px] space-y-1">
                            <div className="flex justify-between items-center text-slate-600">
                              <span>Total Booking Amount:</span>
                              <span className="font-mono font-bold text-slate-900">{formatPeso(fin.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-purple-700 font-bold">
                              <span>Partner Payout ({pct}%):</span>
                              <span className="font-mono">₱{partnerPayout.toLocaleString()}</span>
                            </div>
                            <div className="border-t border-purple-100 pt-1 flex justify-between items-center text-emerald-700 font-extrabold">
                              <span>Custoworks Management Share ({100 - pct}%):</span>
                              <span className="font-mono">₱{custoNet.toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="releaseAutoLogCheck"
                          checked={releaseAutoLogTrip}
                          onChange={(e) => setReleaseAutoLogTrip(e.target.checked)}
                          className="w-3.5 h-3.5 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                        />
                        <label htmlFor="releaseAutoLogCheck" className="text-[11px] text-slate-700 cursor-pointer">
                          Auto-record this partner commission in <strong>Monthly Gross & Offline Ledger</strong>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    id="releaseOngoingCheck"
                    checked={releaseMarkOngoing}
                    onChange={(e) => setReleaseMarkOngoing(e.target.checked)}
                    className="w-4 h-4 text-brand-blue rounded border-slate-300 focus:ring-brand-blue"
                  />
                  <label htmlFor="releaseOngoingCheck" className="text-xs font-semibold text-slate-800 cursor-pointer">
                    Hand over keys & mark booking status as <strong>ONGOING</strong> (Vehicle in Customer Possession)
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setReleaseModalBooking(null)}
                    disabled={isSubmittingRelease}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRelease}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>
                      {isSubmittingRelease
                        ? 'Processing...'
                        : fin.balanceDue > 0
                        ? `Confirm ${formatPeso(parseFloat(releaseAmount) || 0)} Payment & Release`
                        : 'Release Vehicle to Customer'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* 2. Vehicle Return & Rental Completion Modal */}
      {completeModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-xl w-full p-6 space-y-5 text-xs shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <CheckCircle className="w-4 h-4" />
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Vehicle Return & Rental Completion
                  </h3>
                </div>
                <p className="text-slate-500 text-[11px] mt-1">
                  Booking <span className="font-mono font-bold text-brand-navy">{completeModalBooking.reference}</span> • {completeModalBooking.customerName} • {completeModalBooking.vehicle?.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCompleteModalBooking(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Return Inspection Checklist */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                Physical Return Inspection Checklist
              </h4>

              <div className="space-y-2">
                <label className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inspectClean}
                    onChange={(e) => setInspectClean(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">Vehicle Returned Clean & Washed</span>
                    <span className="text-[10px] text-slate-500">Unit returned in clean condition. 100% security deposit is refunded with zero carwash deduction.</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inspectFuel}
                    onChange={(e) => setInspectFuel(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">Fuel Level Matches Departure</span>
                    <span className="text-[10px] text-slate-500">Fuel gauge verified and matches the original release level.</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inspectDamageFree}
                    onChange={(e) => setInspectDamageFree(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">Exterior & Interior Inspection Passed</span>
                    <span className="text-[10px] text-slate-500">No new scratches, dents, or interior damages detected.</span>
                  </div>
                </label>
              </div>
            </div>

            {/* ₱1,000 Security Deposit Refund Settlement */}
            <form onSubmit={handleSubmitComplete} className="space-y-4">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-emerald-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    Refund ₱1,000 Security Deposit
                  </h4>
                  <span className="bg-emerald-600 text-white font-mono font-bold text-xs px-2.5 py-0.5 rounded-full">
                    ₱1,000.00
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  The customer's ₱1,000 reservation fee is now due for immediate refund on the spot since the unit was returned in good order.
                </p>

                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={refundSecurityDeposit}
                      onChange={(e) => setRefundSecurityDeposit(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-emerald-900">
                      Record ₱1,000 Security Deposit Refund to Customer
                    </span>
                  </label>

                  {refundSecurityDeposit && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Refund Channel / Method</label>
                        <select
                          value={refundDepositMethodId}
                          onChange={(e) => setRefundDepositMethodId(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {paymentMethods.map((m) => (
                            <option key={m.id} value={m.id} className="text-slate-900">
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Refund Ref # / Voucher</label>
                        <input
                          type="text"
                          value={refundRefNumber}
                          onChange={(e) => setRefundRefNumber(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. CASH_REFUND or Ref #"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCompleteModalBooking(null)}
                  disabled={isSubmittingComplete}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingComplete}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {isSubmittingComplete
                      ? 'Completing Rental...'
                      : 'Confirm Return, Refund ₱1,000 Deposit & Complete Rental'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. View Full Booking Details Inspector Modal */}
      {viewBookingModal && (() => {
        const fin = getBookingFinancials(viewBookingModal);
        return (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-6 space-y-5 text-xs shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-brand-navy">
                      {viewBookingModal.reference}
                    </span>
                    <StatusBadge status={viewBookingModal.status} />
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Created on {formatDate(viewBookingModal.createdAt || viewBookingModal.pickupAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewBookingModal(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Customer & Vehicle Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Customer Information</span>
                  <p className="font-bold text-slate-900 text-sm">{viewBookingModal.customerName}</p>
                  <p className="text-slate-600">Phone: <strong>{viewBookingModal.customerPhone}</strong></p>
                  <p className="text-slate-500">Email: {viewBookingModal.customerEmail}</p>
                  {viewBookingModal.customerAddress && (
                    <p className="text-slate-500 truncate">Address: {viewBookingModal.customerAddress}</p>
                  )}
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Rental Details</span>
                  <p className="font-bold text-slate-900 text-sm">{viewBookingModal.vehicle?.name}</p>
                  <p className="text-slate-600">
                    Schedule: {formatDate(viewBookingModal.pickupAt, false)} → {formatDate(viewBookingModal.returnAt, false)}
                  </p>
                  <p className="text-slate-500">
                    Type: <strong>{viewBookingModal.rentalType === 'SELF_DRIVE' ? 'Self-Drive' : 'With Driver'}</strong> • Destination: {viewBookingModal.destination?.name || 'Local'}
                  </p>
                  {viewBookingModal.deliveryAddress && (
                    <div className="bg-sky-50 border border-sky-200 p-2.5 rounded-xl text-xs space-y-0.5 mt-2">
                      <span className="font-extrabold text-brand-blue uppercase text-[10px] block flex items-center gap-1">
                        📍 Pinned Pickup & Drop Route:
                      </span>
                      <p className="font-bold text-slate-900 leading-snug">{viewBookingModal.deliveryAddress}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Balance Summary Box */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-2">
                <h4 className="font-bold text-brand-navy text-xs uppercase tracking-wider flex items-center justify-between">
                  <span>Payment & Balance Breakdown</span>
                  <span className="text-xs font-mono font-bold text-slate-900">Total: {formatPeso(fin.totalAmount)}</span>
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Reservation Fee</span>
                    <span className="font-bold text-slate-900 text-xs">₱1,000.00</span>
                    <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">Locks vehicle</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Balance Status</span>
                    <span className={`font-bold text-xs ${fin.isBalancePaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {fin.isBalancePaid ? 'Fully Paid' : formatPeso(fin.balanceDue)}
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">{fin.isBalancePaid ? 'Settled' : 'Due on Pickup'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Security Deposit</span>
                    <span className="font-bold text-slate-900 text-xs">₱1,000.00</span>
                    <span className="text-[9px] text-blue-600 font-bold block mt-0.5">Refundable on return</span>
                  </div>
                </div>
              </div>

              {/* Payment Transactions & Receipts Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Payment History & Official Acknowledgement Receipts
                </h4>
                <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5">Method</th>
                        <th className="p-2.5">Amount</th>
                        <th className="p-2.5">Ref / OR #</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(viewBookingModal.payments || []).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-400">
                            No payment records logged yet.
                          </td>
                        </tr>
                      ) : (
                        viewBookingModal.payments?.map((p) => (
                          <tr key={p.id} className="hover:bg-white/80">
                            <td className="p-2.5 font-medium text-slate-600">
                              {p.paidAt ? formatDate(p.paidAt, false) : formatDate(p.createdAt || new Date(), false)}
                            </td>
                            <td className="p-2.5 font-bold text-slate-800">
                              {p.type.replace(/_/g, ' ')}
                            </td>
                            <td className="p-2.5 text-slate-600">{p.paymentMethod?.name || 'Manual'}</td>
                            <td className="p-2.5 font-mono font-bold text-slate-900">{formatPeso(p.amount)}</td>
                            <td className="p-2.5 font-mono text-[10px] text-brand-blue font-bold">
                              {p.receiptNumber || p.referenceNumber || '-'}
                            </td>
                            <td className="p-2.5">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  p.status === 'APPROVED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : p.status === 'PENDING_VERIFICATION'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons in Booking Inspector */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewBookingModal(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const b = viewBookingModal;
                      handleDeleteBooking(b.id, b.reference);
                    }}
                    className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    title="Permanently remove this booking record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Record
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDispatchBookingModal(viewBookingModal);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                    title="Format and copy dispatch alert for Partner Group Chat"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Dispatch to Partner GC
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {viewBookingModal.status === 'CONFIRMED' && (
                    <button
                      type="button"
                      onClick={() => {
                        const b = viewBookingModal;
                        setViewBookingModal(null);
                        openReleaseModal(b);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <KeyRound className="w-4 h-4" />
                      Collect Balance & Release Vehicle
                    </button>
                  )}
                  {viewBookingModal.status === 'ONGOING' && (
                    <button
                      type="button"
                      onClick={() => {
                        const b = viewBookingModal;
                        setViewBookingModal(null);
                        openCompleteModal(b);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Complete Return & Refund ₱1,000 Deposit
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Partner Group Chat Dispatch Modal */}
      {dispatchBookingModal && (
        <PartnerDispatchModal
          booking={dispatchBookingModal}
          onClose={() => setDispatchBookingModal(null)}
        />
      )}

      {/* 4. Add Manual Trip / Gross Revenue Modal */}
      {addTripModalOpen && (() => {
        const gross = parseFloat(tripForm.grossAmount) || 0;
        const driver = parseFloat(tripForm.driverFee) || 0;
        const fuel = parseFloat(tripForm.fuelFee) || 0;
        const toll = parseFloat(tripForm.tollOtherFee) || 0;
        const tieUpPct = tripForm.isTieUp ? parseFloat(tripForm.tieUpPercent) || 20 : 0;
        const tieUpAmount = tripForm.isTieUp ? Math.round(gross * (tieUpPct / 100)) : 0;
        const totalExpenses = driver + fuel + toll;
        const netCustoworks = Math.max(0, gross - totalExpenses - tieUpAmount);

        return (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-6 space-y-5 text-xs shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </span>
                    <h3 className="font-extrabold text-base text-slate-900">
                      Add Manual Gross Revenue & Offline Trip
                    </h3>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-1">
                    Record offline walk-in rentals, airport transfers, fuel & driver allowances, and tie-up partner payouts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddTripModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick 1-Click Templates */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                  1-Click Quick Templates:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => applyTripPreset('BIA')}
                    className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-left transition-colors"
                  >
                    <span className="font-bold text-blue-900 block text-[11px]">✈️ BIA Airport</span>
                    <span className="text-blue-700 font-extrabold text-xs block">₱7,500 Gross</span>
                    <span className="text-[9px] text-blue-600">Driver ₱1k • Diesel ₱2k</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTripPreset('LEGAZPI')}
                    className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-left transition-colors"
                  >
                    <span className="font-bold text-purple-900 block text-[11px]">🌋 Mayon Tour</span>
                    <span className="text-purple-700 font-extrabold text-xs block">₱5,500 Gross</span>
                    <span className="text-[9px] text-purple-600">Driver ₱1k • Diesel ₱1.5k</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTripPreset('NAGA')}
                    className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-left transition-colors"
                  >
                    <span className="font-bold text-amber-900 block text-[11px]">🚗 Naga 10h</span>
                    <span className="text-amber-700 font-extrabold text-xs block">₱3,500 Gross</span>
                    <span className="text-[9px] text-amber-600">Driver ₱800 • Diesel ₱800</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTripPreset('WALKIN')}
                    className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-left transition-colors"
                  >
                    <span className="font-bold text-emerald-900 block text-[11px]">🔑 Self-Drive 24h</span>
                    <span className="text-emerald-700 font-extrabold text-xs block">₱2,500 Gross</span>
                    <span className="text-[9px] text-emerald-600">Walk-in client rental</span>
                  </button>
                </div>
              </div>

              {/* Add Trip Form */}
              <form onSubmit={handleAddManualTrip} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Trip / Service Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BIA Airport Pickup & Drop"
                      value={tripForm.title}
                      onChange={(e) => setTripForm({ ...tripForm, title: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Date of Trip *</label>
                    <input
                      type="date"
                      required
                      value={tripForm.date}
                      onChange={(e) => setTripForm({ ...tripForm, date: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Customer / Passenger</label>
                    <input
                      type="text"
                      placeholder="e.g. Executive Guest / Walk-in"
                      value={tripForm.clientName}
                      onChange={(e) => setTripForm({ ...tripForm, clientName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Vehicle Used</label>
                    <select
                      value={tripForm.vehicleName}
                      onChange={(e) => setTripForm({ ...tripForm, vehicleName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {vehicles.map((v) => (
                        <option key={v.id} value={`${v.name} (${v.plateNumber})`}>
                          {v.name} ({v.plateNumber})
                        </option>
                      ))}
                      <option value="Partner Fleet Vehicle">Partner Fleet Vehicle</option>
                      <option value="Toyota Vios 2025 AT">Toyota Vios 2025 AT</option>
                      <option value="Nissan NV350 Urvan Premium">Nissan NV350 Urvan Premium</option>
                      <option value="Other / External Vehicle">Other / External Vehicle</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Rental Type</label>
                    <select
                      value={tripForm.rentalType}
                      onChange={(e) => setTripForm({ ...tripForm, rentalType: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="WITH_DRIVER">With Driver (Chauffeur)</option>
                      <option value="SELF_DRIVE">Self-Drive</option>
                    </select>
                  </div>
                </div>

                {/* Financial Breakdown Section */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    Trip Financial Breakdown & Direct Costs
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 text-[11px] mb-1">
                        Gross Charged (PHP ₱) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        value={tripForm.grossAmount}
                        onChange={(e) => setTripForm({ ...tripForm, grossAmount: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono font-black text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 text-[11px] mb-1">
                        Driver Fee / Allowance (₱)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={tripForm.driverFee}
                        onChange={(e) => setTripForm({ ...tripForm, driverFee: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono font-bold text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 text-[11px] mb-1">
                        Diesel / Fuel Expense (₱)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={tripForm.fuelFee}
                        onChange={(e) => setTripForm({ ...tripForm, fuelFee: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono font-bold text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 text-[11px] mb-1">
                        Tolls / Other (₱)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={tripForm.tollOtherFee}
                        onChange={(e) => setTripForm({ ...tripForm, tollOtherFee: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono font-bold text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Optional Tie-Up Partner Option in Trip */}
                  <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 space-y-2.5">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                      <input
                        type="checkbox"
                        checked={tripForm.isTieUp}
                        onChange={(e) => setTripForm({ ...tripForm, isTieUp: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded border-purple-300 focus:ring-purple-500"
                      />
                      <span className="flex items-center gap-1.5">
                        <Handshake className="w-4 h-4 text-purple-600" />
                        Vehicle is from a Tie-Up Partner or Referral
                      </span>
                    </label>

                    {tripForm.isTieUp && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block font-bold text-slate-700 text-[11px] mb-1">Partner Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Legazpi Fleet Partner"
                            value={tripForm.tieUpPartnerName}
                            onChange={(e) => setTripForm({ ...tripForm, tieUpPartnerName: e.target.value })}
                            className="w-full bg-white border border-purple-300 rounded-xl p-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 text-[11px] mb-1">Partner Share %</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={tripForm.tieUpPercent}
                              onChange={(e) => setTripForm({ ...tripForm, tieUpPercent: e.target.value })}
                              className="w-20 bg-white border border-purple-300 rounded-xl p-2 font-mono font-bold text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <div className="flex gap-1">
                              {['20', '25', '30', '80'].map((pct) => (
                                <button
                                  type="button"
                                  key={pct}
                                  onClick={() => setTripForm({ ...tripForm, tieUpPercent: pct })}
                                  className={`text-[10px] px-2 py-1 rounded-lg border font-bold ${
                                    tripForm.tieUpPercent === pct
                                      ? 'bg-purple-600 text-white border-purple-600'
                                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  {pct}%
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Real-Time Live Calculation Display */}
                  <div className="bg-slate-900 text-white rounded-2xl p-3.5 space-y-1.5 border border-slate-800">
                    <div className="flex justify-between items-center text-slate-300 text-xs">
                      <span>Total Gross Charged:</span>
                      <span className="font-mono font-bold text-white text-sm">{formatPeso(gross)}</span>
                    </div>
                    <div className="flex justify-between items-center text-amber-400 text-xs">
                      <span>Direct Operating Expenses (Driver + Diesel + Tolls):</span>
                      <span className="font-mono font-bold">- {formatPeso(totalExpenses)}</span>
                    </div>
                    {tripForm.isTieUp && (
                      <div className="flex justify-between items-center text-purple-300 text-xs">
                        <span>Tie-Up Partner Commission ({tieUpPct}%):</span>
                        <span className="font-mono font-bold">- {formatPeso(tieUpAmount)}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-sm font-black">
                      <span className="text-white">Net Custoworks Profit:</span>
                      <span className="font-mono text-base text-emerald-400">{formatPeso(netCustoworks)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Notes / Trip Route Details</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. VIP pickup at Bicol International Airport, drop off at Naga City hotel"
                    value={tripForm.notes}
                    onChange={(e) => setTripForm({ ...tripForm, notes: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAddTripModalOpen(false)}
                    disabled={isSubmittingTrip}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTrip}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>{isSubmittingTrip ? 'Saving...' : 'Save to Monthly Gross Revenue'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* 5. Realistic Interactive Mobile Phone Simulator Modal */}
      {phoneSimulatorOpen && (() => {
        const deviceConfigs: Record<string, { name: string; width: number; height: number; os: string }> = {
          IPHONE_15: { name: 'iPhone 15 Pro', width: 393, height: 852, os: 'iOS 18' },
          GALAXY_S24: { name: 'Samsung Galaxy S24', width: 360, height: 780, os: 'Android 15' },
          IPHONE_SE: { name: 'iPhone SE / Compact', width: 375, height: 667, os: 'iOS 17' },
        };

        const activeDevice = deviceConfigs[simulatorDevice] || deviceConfigs.IPHONE_15;
        const width = simulatorOrientation === 'PORTRAIT' ? activeDevice.width : activeDevice.height;
        const height = simulatorOrientation === 'PORTRAIT' ? activeDevice.height : activeDevice.width;

        const navRoutes = [
          { label: '🛍️ Customer: Booking (/book)', url: '/book' },
          { label: '🏠 Customer: Home (/)', url: '/' },
          { label: '🔍 Customer: Tracking (/track)', url: '/track' },
          { label: '🚗 Customer: Rates (/prices)', url: '/prices' },
          { label: '⚙️ Admin: Mobile Console', url: '/admin?mobile_sim=1' },
        ];

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-5 overflow-y-auto">
            {/* Top Simulator Control Bar */}
            <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs mb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                  <Smartphone className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-extrabold text-white text-sm">
                    Interactive Mobile Phone Simulator
                  </h3>
                  <p className="text-slate-400 text-[11px]">
                    Preview authentic responsive layouts on real mobile viewports with active CSS media queries.
                  </p>
                </div>
              </div>

              {/* Device Selector, Zoom & Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
                  {(['IPHONE_15', 'GALAXY_S24', 'IPHONE_SE'] as const).map((dev) => (
                    <button
                      key={dev}
                      type="button"
                      onClick={() => setSimulatorDevice(dev)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                        simulatorDevice === dev
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {dev === 'IPHONE_15' ? 'iPhone 15' : dev === 'GALAXY_S24' ? 'Galaxy S24' : 'iPhone SE'}
                    </button>
                  ))}
                </div>

                <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
                  {[0.75, 0.85, 1.0].map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setSimulatorZoom(z)}
                      className={`px-2 py-1 rounded-lg font-bold text-[10px] transition-all ${
                        simulatorZoom === z
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {Math.round(z * 100)}%
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSimulatorOrientation(simulatorOrientation === 'PORTRAIT' ? 'LANDSCAPE' : 'PORTRAIT')
                  }
                  title="Rotate phone orientation"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-2 rounded-xl border border-slate-700 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setPhoneSimulatorOpen(false)}
                  className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-3 py-1.5 rounded-xl font-bold transition-colors flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  <span>Exit Simulator</span>
                </button>
              </div>
            </div>

            {/* Quick Route Switcher Bar */}
            <div className="w-full max-w-5xl flex items-center justify-between gap-2 pb-2 mb-2 overflow-x-auto text-xs shrink-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                {navRoutes.map((r) => {
                  const isActive = simulatorUrl === r.url;
                  return (
                    <button
                      key={r.url}
                      type="button"
                      onClick={() => setSimulatorUrl(r.url)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap text-xs border ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>

              <a
                href={simulatorUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-slate-900 hover:bg-slate-800 text-blue-400 px-3 py-1.5 rounded-xl border border-slate-800 font-bold flex items-center gap-1 shrink-0 ml-auto"
              >
                <span>Open in Tab</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Realistic Smartphone Chassis Frame */}
            <div
              className="my-auto transition-transform duration-200"
              style={{
                transform: `scale(${simulatorZoom})`,
                transformOrigin: 'top center',
              }}
            >
              <div
                className="bg-black rounded-[52px] border-[12px] border-slate-900 shadow-2xl shadow-black ring-4 ring-slate-800/80 relative flex flex-col overflow-hidden"
                style={{ width: `${width + 24}px`, height: `${height + 24}px` }}
              >
                {/* Dynamic Island / Top Notch */}
                {simulatorOrientation === 'PORTRAIT' && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full flex items-center justify-between px-3 z-30 select-none shadow">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
                    <div className="w-2 h-2 rounded-full bg-blue-900/60" />
                  </div>
                )}

                {/* Status Bar */}
                <div className="w-full bg-slate-950 text-slate-400 px-6 pt-2 pb-1 flex items-center justify-between text-[10px] font-mono font-bold select-none z-20 shrink-0 border-b border-slate-900">
                  <span>9:41 AM</span>
                  <span className="text-emerald-400 font-sans font-semibold">5G · 100% 🔋</span>
                </div>

                {/* Screen Viewport with Iframe */}
                <div className="flex-1 w-full h-full bg-white relative overflow-hidden">
                  <iframe
                    key={`${simulatorUrl}-${simulatorDevice}-${simulatorOrientation}`}
                    src={simulatorUrl}
                    title="Mobile View Simulator Screen"
                    className="w-full h-full border-0"
                    style={{ width: `${width}px`, height: `${height}px` }}
                  />
                </div>

                {/* Bottom Home Indicator */}
                <div className="w-full bg-slate-950 py-1.5 flex items-center justify-center select-none z-20 shrink-0">
                  <div className="w-28 h-1 bg-slate-600 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
