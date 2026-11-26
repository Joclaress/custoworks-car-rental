import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Vehicle, Destination, PricingQuote, PaymentMethod, BookingRequirement } from '../types';
import { InteractiveCalendar } from '../components/InteractiveCalendar';
import { formatPeso, formatDate } from '../lib/utils';
import {
  Car,
  Calendar,
  MapPin,
  User,
  FileCheck2,
  Receipt,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Upload,
  ShieldCheck,
  Check,
  Info,
  Copy,
  Search,
  Camera,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  CalendarCheck2,
  Zap,
  Calculator,
  HeartHandshake,
  PhoneCall,
  Plane,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { format, addDays, differenceInCalendarDays, startOfDay, isSameDay } from 'date-fns';
import { ReservationConfirmationCard } from '../components/ReservationConfirmationCard';
import { saveFileToGallery } from '../lib/screenshot';
import { PointToPointTransferMap, LocationPoint } from '../components/PointToPointTransferMap';
import { MapRouteAdsCarousel } from '../components/MapRouteAdsCarousel';

interface DestinationTheme {
  icon: string;
  name: string;
  badgeClass: string;
}

const DESTINATION_THEMES: Record<string, DestinationTheme> = {
  'naga-city': {
    icon: '🏙️',
    name: 'Naga City',
    badgeClass: 'bg-emerald-100 text-emerald-950 border border-emerald-300',
  },
  'camarines-sur': {
    icon: '📍',
    name: 'CamSur',
    badgeClass: 'bg-sky-100 text-sky-950 border border-sky-300',
  },
  'naga-airport': {
    icon: '🛬',
    name: 'Naga Airport',
    badgeClass: 'bg-blue-100 text-blue-950 border border-blue-300',
  },
  'bicol-intl-airport': {
    icon: '✈️',
    name: 'BIA Airport',
    badgeClass: 'bg-amber-100 text-amber-950 border border-amber-300',
  },
  'albay-daet': {
    icon: '🌋',
    name: 'Albay / Daet',
    badgeClass: 'bg-purple-100 text-purple-950 border border-purple-300',
  },
  'sorsogon-labo': {
    icon: '🌊',
    name: 'Sorsogon / Labo',
    badgeClass: 'bg-teal-100 text-teal-950 border border-teal-300',
  },
  'manila': {
    icon: '🛣️',
    name: 'Manila Express',
    badgeClass: 'bg-rose-100 text-rose-950 border border-rose-300',
  },
  'baguio': {
    icon: '🌲',
    name: 'Baguio',
    badgeClass: 'bg-indigo-100 text-indigo-950 border border-indigo-300',
  },
};

export const BookingWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Streamlined 3-Step Flow:
  // Step 1: Trip & Vehicle Selection (All-in-One Configurator)
  // Step 2: Renter Details & Delivery Handover
  // Step 3: Payment & Confirm Hold
  // Step 4: Success & Tracking
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Master Data
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [rateMatrix, setRateMatrix] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [additionalFees, setAdditionalFees] = useState<any[]>([]);

  // Wizard State
  const [bookingMode, setBookingMode] = useState<'RENTAL' | 'TRANSFER'>('RENTAL');
  const [transferData, setTransferData] = useState<{
    pickup: LocationPoint;
    drop: LocationPoint;
    distanceKm: number;
    price: number;
  } | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(searchParams.get('vehicleId') || '');
  const [selectedRentalType, setSelectedRentalType] = useState<'SELF_DRIVE' | 'WITH_DRIVER'>('SELF_DRIVE');
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>('');

  // Schedule
  const defaultPickup = addDays(new Date(), 1);
  defaultPickup.setHours(9, 0, 0, 0);
  const defaultReturn = addDays(defaultPickup, 1);
  defaultReturn.setHours(9, 0, 0, 0);

  const [pickupAt, setPickupAt] = useState<string>(format(defaultPickup, "yyyy-MM-dd'T'HH:mm"));
  const [returnAt, setReturnAt] = useState<string>(format(defaultReturn, "yyyy-MM-dd'T'HH:mm"));
  const [calendarExpanded, setCalendarExpanded] = useState<boolean>(false);

  // Logistics
  const [pickupMethod, setPickupMethod] = useState<'OFFICE' | 'DELIVERY'>('OFFICE');
  const [deliveryZoneId, setDeliveryZoneId] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [surchargeIds, setSurchargeIds] = useState<string[]>([]);
  const [promoCode, setPromoCode] = useState<string>('');

  // Customer Information
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [emergencyName, setEmergencyName] = useState<string>('');
  const [emergencyPhone, setEmergencyPhone] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('Personal Vacation / Travel');
  const [flightNumber, setFlightNumber] = useState<string>('');
  const [passengerSignName, setPassengerSignName] = useState<string>('');
  const [showOptionalFields, setShowOptionalFields] = useState<boolean>(false);

  // Field validation
  const [renterErrors, setRenterErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    emergencyPhone?: string;
  }>({});
  const [renterTouched, setRenterTouched] = useState<{
    name?: boolean;
    email?: boolean;
    phone?: boolean;
    address?: boolean;
    emergencyPhone?: boolean;
  }>({});

  const validateRenterInfo = (fieldValues?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    emergencyPhone?: string;
  }) => {
    const nameVal = (fieldValues?.name !== undefined ? fieldValues.name : customerName).trim();
    const emailVal = (fieldValues?.email !== undefined ? fieldValues.email : customerEmail).trim();
    const phoneVal = (fieldValues?.phone !== undefined ? fieldValues.phone : customerPhone).replace(/[\s\-]/g, '');
    const addressVal = (fieldValues?.address !== undefined ? fieldValues.address : customerAddress).trim();
    const emerPhoneVal = (fieldValues?.emergencyPhone !== undefined ? fieldValues.emergencyPhone : emergencyPhone).replace(/[\s\-]/g, '');

    const errors: {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      emergencyPhone?: string;
    } = {};

    if (!nameVal) {
      errors.name = 'Full name is required as shown on your license or valid ID.';
    } else if (nameVal.length < 3) {
      errors.name = 'Please enter your complete legal name.';
    }

    if (!emailVal) {
      errors.email = 'Email address is required for booking confirmation & contract.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      errors.email = 'Please enter a valid email address (e.g. name@example.com).';
    }

    if (!phoneVal) {
      errors.phone = 'Philippine mobile number is required.';
    } else if (!/^09\d{9}$/.test(phoneVal)) {
      errors.phone = 'Must be an 11-digit Philippine mobile number starting with 09 (e.g. 09953827972).';
    }

    if (emerPhoneVal && !/^09\d{9}$/.test(emerPhoneVal)) {
      errors.emergencyPhone = 'Must be an 11-digit Philippine mobile number starting with 09 (e.g. 09953827972).';
    }

    return errors;
  };

  // Server Quote & Created Draft
  const [quote, setQuote] = useState<PricingQuote | null>(null);
  const [createdBooking, setCreatedBooking] = useState<any | null>(null);

  // Requirements Upload State (Flexible: upload now or send later)
  const [requirementFiles, setRequirementFiles] = useState<Record<string, File>>({});
  const [requirementPreviews, setRequirementPreviews] = useState<Record<string, string>>({});
  const [secondaryIdOption, setSecondaryIdOption] = useState<string>('Passport');
  const [uploadProgress, setUploadProgress] = useState<Record<string, boolean>>({});
  const [aiVerifications, setAiVerifications] = useState<Record<string, any>>({});
  const [submitLaterRequirements, setSubmitLaterRequirements] = useState<boolean>(false);

  // Payment State
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [paymentRefNumber, setPaymentRefNumber] = useState<string>('');
  const [paymentReceiptFile, setPaymentReceiptFile] = useState<File | null>(null);
  const [paymentReceiptPreview, setPaymentReceiptPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Calendar Busy Dates for Fleet Availability
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [step]);

  useEffect(() => {
    const initData = async () => {
      try {
        const [vRes, pListRes, pRes, fRes] = await Promise.all([
          api.get<{ data: Vehicle[] }>('/vehicles'),
          api.get<{ destinations: Destination[]; rates: any[] }>('/pricing/pricelist', { forceRefresh: true }),
          api.get<{ methods: PaymentMethod[] }>('/payments/methods'),
          api.get<{ fees: any[] }>('/pricing/additional-fees'),
        ]);

        const cleanDestinations = (pListRes.destinations || []).filter(
          (d) =>
            d.isActive !== false &&
            !d.name.toLowerCase().includes('test') &&
            !d.slug.toLowerCase().includes('test') &&
            !d.description?.toLowerCase().includes('test') &&
            !d.name.toLowerCase().includes('temporary')
        );

        // Sort fleet with Mirage G4 AT first
        const sortedVehicles = [...vRes.data].sort((a, b) => {
          const isAMirage = a.model === 'Mirage G4' || a.name.toLowerCase().includes('mirage');
          const isBMirage = b.model === 'Mirage G4' || b.name.toLowerCase().includes('mirage');
          if (isAMirage && !isBMirage) return -1;
          if (!isAMirage && isBMirage) return 1;
          return 0;
        });

        setVehicles(sortedVehicles);
        setDestinations(cleanDestinations);
        setRateMatrix(pListRes.rates || []);
        setPaymentMethods(pRes.methods);
        setAdditionalFees(fRes.fees);

        // URL Search Params pre-selection
        const paramDest = searchParams.get('destinationId');
        const paramRentalType = searchParams.get('rentalType');
        const paramCategory = searchParams.get('category');
        const paramTransfer = searchParams.get('transfer') || searchParams.get('serviceType');
        const paramMode = searchParams.get('mode') || searchParams.get('service');

        if (paramMode === 'transfer' || paramTransfer) {
          setBookingMode('TRANSFER');
          setSelectedRentalType('WITH_DRIVER');
        }

        if (paramRentalType === 'WITH_DRIVER' || paramRentalType === 'SELF_DRIVE') {
          setSelectedRentalType(paramRentalType);
        }

        if (paramTransfer?.toLowerCase().includes('bia') || paramTransfer?.toLowerCase().includes('airport')) {
          setSelectedRentalType('WITH_DRIVER');
          const biaDest = cleanDestinations.find((d) => d.slug === 'bicol-intl-airport');
          if (biaDest) setSelectedDestinationId(biaDest.id);
          if (paramCategory) {
            const matchVeh = sortedVehicles.find((v) => v.category === paramCategory);
            if (matchVeh) setSelectedVehicleId(matchVeh.id);
          }
        } else if (paramDest) {
          const matchDest = cleanDestinations.find((d) => d.id === paramDest || d.slug === paramDest);
          if (matchDest) setSelectedDestinationId(matchDest.id);
        } else if (cleanDestinations.length > 0) {
          setSelectedDestinationId(cleanDestinations[0].id);
        }

        const deliveryZones = fRes.fees.filter((f) => f.type === 'DELIVERY');
        if (deliveryZones.length > 0) {
          setDeliveryZoneId(deliveryZones[0].id);
        }

        if (pRes.methods.length > 0) {
          setSelectedPaymentMethodId(pRes.methods[0].id);
        }

        const paramVehId = searchParams.get('vehicleId');
        if (paramVehId) {
          setSelectedVehicleId(paramVehId);
        } else if (sortedVehicles.length > 0) {
          const mirage = sortedVehicles.find((v) => v.model === 'Mirage G4' || v.name.toLowerCase().includes('mirage'));
          setSelectedVehicleId(mirage ? mirage.id : sortedVehicles[0].id);
        }
      } catch (err) {
        console.error('Failed to initialize wizard data:', err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // Restore existing booking from URL query (?ref=...)
  useEffect(() => {
    const refParam = searchParams.get('ref') || searchParams.get('reference');
    if (refParam && !createdBooking) {
      api
        .get<{ booking: any }>(`/bookings/track/${refParam}`)
        .then((res) => {
          if (res.booking) {
            setCreatedBooking(res.booking);
            setStep(3); // Takes directly to payment & confirm hold
          }
        })
        .catch((err) => console.error('Failed to load referenced booking:', err));
    } else if (!createdBooking) {
      try {
        const saved = sessionStorage.getItem('cw_current_booking');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.reference) {
            api
              .get<{ booking: any }>(`/bookings/track/${parsed.reference}`)
              .then((res) => {
                if (res.booking) setCreatedBooking(res.booking);
              })
              .catch(() => setCreatedBooking(parsed));
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (createdBooking?.reference) {
      sessionStorage.setItem('cw_current_booking', JSON.stringify(createdBooking));
    }
  }, [createdBooking]);

  // Handle Point-to-Point Map Transfer Selection
  const handleConfirmTransfer = (data: {
    pickup: LocationPoint;
    drop: LocationPoint;
    vehicleId: string;
    distanceKm: number;
    price: number;
  }) => {
    setTransferData(data);
    setSelectedVehicleId(data.vehicleId);
    setSelectedRentalType('WITH_DRIVER');
    setPickupMethod('DELIVERY');
    const transferRouteLabel = `Pick-up: ${data.pickup.name} ➔ Drop-off: ${data.drop.name} (${data.distanceKm} km)`;
    setDeliveryAddress(transferRouteLabel);
    setPurpose(`Pickup & Drop Shuttle: ${data.pickup.name} to ${data.drop.name}`);

    const pName = data.pickup.name.toLowerCase();
    const dName = data.drop.name.toLowerCase();

    if (pName.includes('bia') || dName.includes('bia') || pName.includes('daraga') || dName.includes('daraga')) {
      const bia = destinations.find((d) => d.slug === 'bicol-intl-airport');
      if (bia) setSelectedDestinationId(bia.id);
    } else if (pName.includes('naga airport') || dName.includes('naga airport') || pName.includes('wnp') || dName.includes('wnp')) {
      const nagaAir = destinations.find((d) => d.slug === 'naga-airport');
      if (nagaAir) setSelectedDestinationId(nagaAir.id);
    } else {
      const nagaCity = destinations.find((d) => d.slug === 'naga-city');
      if (nagaCity) setSelectedDestinationId(nagaCity.id);
    }

    const todayTrip = new Date();
    todayTrip.setHours(9, 0, 0, 0);
    const todayDrop = new Date(todayTrip);
    todayDrop.setHours(21, 0, 0, 0);
    setPickupAt(format(todayTrip, "yyyy-MM-dd'T'HH:mm"));
    setReturnAt(format(todayDrop, "yyyy-MM-dd'T'HH:mm"));

    // Advance directly to Step 2 (Renter Details)
    setStep(2);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const incomingTransfer = (location.state as any)?.transferData;
    if (incomingTransfer && destinations.length > 0) {
      setBookingMode('TRANSFER');
      handleConfirmTransfer(incomingTransfer);
    } else if (searchParams.get('mode') === 'transfer') {
      setBookingMode('TRANSFER');
    }
  }, [location.state, searchParams, destinations]);

  // Load requirements when on Step 3
  useEffect(() => {
    if (step === 3 && createdBooking) {
      if (!createdBooking.requirements || createdBooking.requirements.length === 0) {
        const fetchRequirements = async () => {
          try {
            if (createdBooking.reference) {
              const res = await api.get<{ booking: any }>(`/bookings/track/${createdBooking.reference}`);
              if (res.booking?.requirements?.length) {
                setCreatedBooking(res.booking);
                return;
              }
            }
            if (createdBooking.id) {
              const res = await api.get<{ booking: any }>(`/bookings/${createdBooking.id}`);
              if (res.booking?.requirements?.length) {
                setCreatedBooking(res.booking);
              }
            }
          } catch (err) {
            console.error('Failed to load booking requirements in Step 3:', err);
          }
        };
        fetchRequirements();
      }
    }
  }, [step, createdBooking?.reference, createdBooking?.id, createdBooking?.requirements]);

  // Autofill logged-in user profile
  useEffect(() => {
    if (user) {
      setCustomerName(user.fullName || '');
      setCustomerEmail(user.email || '');
      setCustomerPhone(user.phone || '');
      setCustomerAddress(user.profile?.address || '');
      setEmergencyName(user.profile?.emergencyContactName || '');
      setEmergencyPhone(user.profile?.emergencyContactPhone || '');
    }
  }, [user]);

  // Fetch fleet calendar events for real-time live availability
  useEffect(() => {
    api
      .get<{ events: any[] }>('/calendar/fleet')
      .then((res) => {
        if (Array.isArray(res?.events)) {
          setCalendarEvents(res.events);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const getVehKey = (name?: string, model?: string) => {
    const combined = `${name || ''} ${model || ''}`.toLowerCase();
    if (combined.includes('mirage')) return 'mirage';
    if (combined.includes('vios')) return 'vios';
    if (combined.includes('xpander')) return 'xpander';
    if (combined.includes('innova')) return 'innova';
    if (combined.includes('nv350') || combined.includes('urvan')) return 'urvan';
    return combined.trim();
  };

  const checkVehicleAvailability = (v: Vehicle) => {
    if (!pickupAt || !returnAt) {
      const avail = (v as any).availableFleetCount ?? (v.status === 'AVAILABLE' ? 1 : 0);
      return { isAvailable: avail > 0, availableCount: avail, totalCount: Number((v as any).fleetCount) || 1 };
    }

    const pStart = startOfDay(new Date(pickupAt));
    const rStart = startOfDay(new Date(returnAt));
    if (isNaN(pStart.getTime()) || isNaN(rStart.getTime())) {
      return { isAvailable: true, availableCount: 1, totalCount: 1 };
    }

    const targetKey = getVehKey(v.name, v.model);
    const totalFleet = targetKey === 'mirage' ? 5 : Number((v as any).fleetCount) || 1;

    const overlapping = calendarEvents.filter((ev) => {
      if (ev.state === 'RETURNED' || ev.state === 'COMPLETED' || ev.state === 'CANCELLED') return false;

      const evStart = startOfDay(new Date(ev.start));
      const evEnd = startOfDay(new Date(ev.end));
      const overlaps = pStart <= evEnd && rStart >= evStart;
      if (!overlaps) return false;

      if (ev.resourceId === v.id) return true;
      const evKey = getVehKey(ev.extendedProps?.vehicleName || ev.title, ev.extendedProps?.model);
      return evKey === targetKey;
    });

    const isPermBlocked = v.status === 'MAINTENANCE' || v.status === 'UNAVAILABLE';
    const bookedCount = overlapping.length;
    const availableCount = isPermBlocked ? 0 : Math.max(0, totalFleet - bookedCount);

    return {
      isAvailable: availableCount > 0,
      availableCount,
      totalCount: totalFleet,
      bookedCount,
    };
  };

  useEffect(() => {
    if (vehicles.length > 0 && selectedVehicleId && pickupAt && returnAt) {
      const cur = vehicles.find((v) => v.id === selectedVehicleId);
      if (cur && !checkVehicleAvailability(cur).isAvailable) {
        const firstAvail = vehicles.find((v) => checkVehicleAvailability(v).isAvailable);
        if (firstAvail) {
          setSelectedVehicleId(firstAvail.id);
        }
      }
    }
  }, [pickupAt, returnAt, calendarEvents, vehicles]);

  // Recalculate quote
  const fetchQuote = async () => {
    if (!selectedVehicleId || !selectedDestinationId || !pickupAt || !returnAt) return;
    const pDate = new Date(pickupAt);
    const rDate = new Date(returnAt);
    if (isNaN(pDate.getTime()) || isNaN(rDate.getTime())) return;
    if (rDate <= pDate) return;

    try {
      const q = new URLSearchParams({
        vehicleId: selectedVehicleId,
        destinationId: selectedDestinationId,
        rentalType: selectedRentalType,
        pickupAt: pDate.toISOString(),
        returnAt: rDate.toISOString(),
        pickupMethod: isTransfer ? 'OFFICE' : pickupMethod,
      });
      if (!isTransfer && pickupMethod === 'DELIVERY' && deliveryZoneId) {
        q.set('deliveryZoneId', deliveryZoneId);
      }
      surchargeIds.forEach((id) => q.append('surchargeIds', id));
      if (promoCode) q.set('promoCode', promoCode);

      const res = await api.get<{ quote: PricingQuote }>(`/pricing/quote?${q.toString()}`);
      let finalQuote = res.quote;
      if (transferData && transferData.price && (!isAirportTransfer || transferData.price !== 4500)) {
        finalQuote = {
          ...res.quote,
          rentalFee: transferData.price,
          totalAmount: transferData.price,
          balanceDue: Math.max(0, transferData.price - res.quote.reservationFee),
        };
      }
      setQuote(finalQuote);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Unable to calculate quote for selected dates');
    }
  };

  useEffect(() => {
    fetchQuote();
  }, [
    selectedVehicleId,
    selectedDestinationId,
    selectedRentalType,
    pickupAt,
    returnAt,
    pickupMethod,
    deliveryZoneId,
    surchargeIds,
    promoCode,
  ]);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const selectedDestination = destinations.find((d) => d.id === selectedDestinationId);
  const isAirportTransfer = selectedDestination?.slug === 'bicol-intl-airport' || selectedDestination?.slug === 'naga-airport';
  const isTransfer = bookingMode === 'TRANSFER' || isAirportTransfer || Boolean(transferData);

  // STEP 1 -> 2: Proceed to Customer Details
  const handleProceedToStep2 = () => {
    setError(null);
    if (!selectedVehicleId) {
      setError('Please select an available vehicle from the fleet to continue.');
      return;
    }
    const sel = vehicles.find((v) => v.id === selectedVehicleId);
    if (!sel || !checkVehicleAvailability(sel).isAvailable) {
      setError('The selected vehicle is fully booked for your travel dates. Please choose another vehicle or date.');
      return;
    }
    if (!pickupAt || !returnAt) {
      setError('Please select both pick-up and return schedule.');
      return;
    }
    const pickupDate = new Date(pickupAt);
    const returnDate = new Date(returnAt);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    if (pickupDate < todayStart) {
      setError('Pick-up schedule must be today onwards.');
      return;
    }
    if (returnDate <= pickupDate) {
      setError('Return schedule must be after the pick-up schedule.');
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  // STEP 2 -> 3: Save Customer Info & Create Draft Hold (generates Tracking Number)
  const handleSaveCustomerInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setRenterTouched({
      name: true,
      email: true,
      phone: true,
      address: true,
      emergencyPhone: true,
    });

    const validationErrors = validateRenterInfo();
    setRenterErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setError('Please resolve the highlighted field errors below to proceed.');
      return;
    }
    setError(null);
    setSubmitting(true);

    const finalPurpose = flightNumber
      ? `${purpose || 'Airport Transfer'} (Flight: ${flightNumber}${passengerSignName ? `, Signboard: ${passengerSignName}` : ''})`
      : purpose;
    const finalDeliveryAddress =
      isTransfer
        ? deliveryAddress || (flightNumber ? `Airport Meetup - Flight ${flightNumber}` : null)
        : pickupMethod === 'DELIVERY'
        ? deliveryAddress
        : null;

    try {
      if (!createdBooking || createdBooking.status !== 'DRAFT') {
        const res = await api.post<{ booking: any }>('/bookings/draft', {
          vehicleId: selectedVehicleId,
          destinationId: selectedDestinationId,
          rentalType: selectedRentalType,
          pickupAt: new Date(pickupAt).toISOString(),
          returnAt: new Date(returnAt).toISOString(),
          pickupMethod: isTransfer ? 'DELIVERY' : pickupMethod,
          deliveryZoneId: (!isTransfer && pickupMethod === 'DELIVERY') ? deliveryZoneId : null,
          deliveryAddress: finalDeliveryAddress,
          surchargeIds,
          promoCode: promoCode || null,
          customer: {
            customerName,
            customerEmail,
            customerPhone,
            customerAddress: customerAddress || 'Naga City / Bicol Region',
            emergencyContactName: emergencyName || null,
            emergencyContactPhone: emergencyPhone || null,
            purpose: finalPurpose,
          },
        });
        setCreatedBooking(res.booking);
      } else {
        const res = await api.patch<{ booking: any }>(`/bookings/${createdBooking.id}/draft`, {
          destinationId: selectedDestinationId,
          rentalType: selectedRentalType,
          pickupAt: new Date(pickupAt).toISOString(),
          returnAt: new Date(returnAt).toISOString(),
          pickupMethod: isTransfer ? 'DELIVERY' : pickupMethod,
          deliveryZoneId: (!isTransfer && pickupMethod === 'DELIVERY') ? deliveryZoneId : null,
          deliveryAddress: finalDeliveryAddress,
          surchargeIds,
          promoCode: promoCode || null,
          customer: {
            customerName,
            customerEmail,
            customerPhone,
            customerAddress: customerAddress || 'Naga City / Bicol Region',
            emergencyContactName: emergencyName || null,
            emergencyContactPhone: emergencyPhone || null,
            purpose: finalPurpose,
          },
        });
        setCreatedBooking(res.booking);
      }
      setStep(3);
    } catch (err: any) {
      if (err?.message?.includes('Only draft bookings can be edited') || err?.message?.includes('NOT_EDITABLE')) {
        try {
          const res = await api.post<{ booking: any }>('/bookings/draft', {
            vehicleId: selectedVehicleId,
            destinationId: selectedDestinationId,
            rentalType: selectedRentalType,
            pickupAt: new Date(pickupAt).toISOString(),
            returnAt: new Date(returnAt).toISOString(),
            pickupMethod,
            deliveryZoneId: pickupMethod === 'DELIVERY' ? deliveryZoneId : null,
            deliveryAddress: finalDeliveryAddress,
            surchargeIds,
            promoCode: promoCode || null,
            customer: {
              customerName,
              customerEmail,
              customerPhone,
              customerAddress: customerAddress || 'Naga City / Bicol Region',
              emergencyContactName: emergencyName || null,
              emergencyContactPhone: emergencyPhone || null,
              purpose: finalPurpose,
            },
          });
          setCreatedBooking(res.booking);
          setError(null);
          setStep(3);
          return;
        } catch (retryErr: any) {
          setError(retryErr.message || 'Failed to place vehicle on hold and save reservation');
        }
      } else {
        setError(err.message || 'Failed to place vehicle on hold and save reservation');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Direct Auto-Upload of Requirement Document
  const handleUploadRequirementDirect = async (requirementId: string, file: File) => {
    if (!createdBooking?.id || !file) return;
    setError(null);
    setUploadProgress((prev) => ({ ...prev, [requirementId]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (secondaryIdOption) {
        formData.append('selectedOption', secondaryIdOption);
      }
      const uploadRes = await api.post<any>(`/requirements/booking/${createdBooking.id}/upload/${requirementId}`, formData);
      if (uploadRes?.aiVerification) {
        setAiVerifications((prev) => ({ ...prev, [requirementId]: uploadRes.aiVerification }));
      }
      if (createdBooking.reference) {
        const bRes = await api.get<{ booking: any }>(`/bookings/track/${createdBooking.reference}`);
        if (bRes.booking) setCreatedBooking(bRes.booking);
      } else {
        const bRes = await api.get<{ booking: any }>(`/bookings/${createdBooking.id}`);
        if (bRes.booking) setCreatedBooking(bRes.booking);
      }
    } catch (err: any) {
      console.error('Document upload error:', err);
      setError(err.message || 'Failed to upload document. Please check file format and size.');
    } finally {
      setUploadProgress((prev) => ({ ...prev, [requirementId]: false }));
    }
  };

  const handleSelectRequirementFile = async (requirementId: string, file: File) => {
    setRequirementFiles((prev) => ({ ...prev, [requirementId]: file }));
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setRequirementPreviews((prev) => ({ ...prev, [requirementId]: url }));
    }
    await handleUploadRequirementDirect(requirementId, file);
  };

  // STEP 3 -> 4: Submit Payment & Finish Booking
  const handleUploadPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentMethodId || !paymentRefNumber || !paymentReceiptFile) {
      setError('Please select a payment method, enter the reference number, and attach your screenshot receipt.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      // 1. Submit draft to mark it ready
      try {
        if (createdBooking?.id) {
          await api.post(`/bookings/${createdBooking.id}/submit`);
        }
      } catch (submitErr) {
        // may already be submitted, proceed
      }

      // 2. Upload payment receipt
      const formData = new FormData();
      formData.append('paymentMethodId', selectedPaymentMethodId);
      formData.append('referenceNumber', paymentRefNumber);
      formData.append('file', paymentReceiptFile);

      await api.post(`/payments/reservation/${createdBooking.id}`, formData);
      setStep(4); // Completed confirmation screen!
    } catch (err: any) {
      setError(err.message || 'Failed to submit payment receipt. Please check reference number and image size.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    { num: 1, title: 'Trip & Vehicle' },
    { num: 2, title: 'Renter Details' },
    { num: 3, title: 'Payment & Confirm' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-blue" />
      </div>
    );
  }

  const daysDifference = Math.max(1, differenceInCalendarDays(new Date(returnAt), new Date(pickupAt)));

  return (
    <div className="min-h-screen bg-slate-50 py-4 sm:py-8 lg:py-10">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Streamlined Stepper Progress Bar (Only 3 easy steps!) */}
        {step <= 3 && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-5 shadow-xs mb-4 sm:mb-6">
            <div className="sm:hidden space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-brand-blue text-white flex items-center justify-center text-[10px] font-bold">
                    {step}
                  </span>
                  <span>
                    Step {step} of 3: <strong className="text-brand-blue">{steps[step - 1]?.title}</strong>
                  </span>
                </span>
                <span className="font-mono text-slate-500 font-bold text-[11px]">
                  {Math.round((step / 3) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-brand-blue h-full rounded-full transition-all duration-300"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>

            <div className="hidden sm:flex items-center justify-between overflow-x-auto gap-4">
              {steps.map((s) => {
                const isPassed = step > s.num;
                const isCurrent = step === s.num;
                return (
                  <div key={s.num} className="flex items-center gap-2.5 shrink-0 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isPassed
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : isCurrent
                          ? 'bg-brand-blue text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-200'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isPassed ? <Check className="w-4 h-4" /> : s.num}
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Step {s.num}</p>
                      <p
                        className={`text-xs font-bold ${
                          isCurrent ? 'text-brand-navy' : isPassed ? 'text-emerald-700' : 'text-slate-400'
                        }`}
                      >
                        {s.title}
                      </p>
                    </div>
                    {s.num < 3 && (
                      <div
                        className={`h-0.5 flex-1 hidden md:block ${
                          isPassed ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 sm:p-4 rounded-2xl text-xs flex items-center gap-2 mb-4 sm:mb-6 shadow-xs animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 1: VEHICLE & TRIP DETAILS (All-in-One Configurator) */}
        {/* ============================================================== */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Service Switcher Tabs */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 max-w-md mx-auto shadow-inner">
              <button
                type="button"
                onClick={() => setBookingMode('RENTAL')}
                className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  bookingMode === 'RENTAL'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Car className="w-4 h-4 text-brand-blue" />
                <span>🚗 Daily Car Rental</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBookingMode('TRANSFER');
                  setSelectedRentalType('WITH_DRIVER');
                  const biaDest = destinations.find((d) => d.slug === 'bicol-intl-airport');
                  if (biaDest) setSelectedDestinationId(biaDest.id);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  bookingMode === 'TRANSFER'
                    ? 'bg-white text-brand-blue shadow-sm border border-slate-200/80 ring-2 ring-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plane className="w-4 h-4 text-amber-500" />
                <span>🚖 Pickup & Drop (Map)</span>
              </button>
            </div>

            {/* Mode A: Point-to-Point Transfer Map */}
            {bookingMode === 'TRANSFER' ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 md:p-8">
                <PointToPointTransferMap
                  vehicles={vehicles}
                  selectedVehicleId={selectedVehicleId}
                  onSelectVehicleId={setSelectedVehicleId}
                  onConfirmTransfer={handleConfirmTransfer}
                />
              </div>
            ) : (
              /* Mode B: Daily Car Rental Configurator */
              <div className="space-y-6">
                {/* 1. Trip Configurator Panel */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-slate-100">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-brand-blue" />
                        <span>Configure Your Rental Trip</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Choose your rental mode, destination, and travel dates to see instant rates and live car availability.
                      </p>
                    </div>
                    <span className="text-xs font-black text-brand-blue bg-blue-50 border border-blue-200 px-3 py-1 rounded-full self-start sm:self-auto">
                      {daysDifference} Day{daysDifference > 1 ? 's' : ''} Rental
                    </span>
                  </div>

                  {/* Mode & Destination Selectors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Rental Mode Toggle */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Rental Mode
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRentalType('SELF_DRIVE')}
                          className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                            selectedRentalType === 'SELF_DRIVE'
                              ? 'bg-brand-blue text-white border-brand-blue shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <Car className="w-3.5 h-3.5" />
                          <span>🔑 Self-Drive</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedRentalType('WITH_DRIVER')}
                          className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                            selectedRentalType === 'WITH_DRIVER'
                              ? 'bg-brand-blue text-white border-brand-blue shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>👨‍✈️ With Driver</span>
                        </button>
                      </div>
                    </div>

                    {/* Destination Selector */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Trip Destination / Area
                      </label>
                      <select
                        value={selectedDestinationId}
                        onChange={(e) => {
                          setSelectedDestinationId(e.target.value);
                          const dest = destinations.find((d) => d.id === e.target.value);
                          if (dest?.slug === 'bicol-intl-airport' || dest?.slug === 'naga-airport') {
                            setSelectedRentalType('WITH_DRIVER');
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue cursor-pointer"
                      >
                        {destinations.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} {d.description ? `— ${d.description}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Destination Quick Chips */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Popular Travel Destinations:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {destinations.map((d) => {
                        const isSelected = selectedDestinationId === d.id;
                        const theme = DESTINATION_THEMES[d.slug] || { icon: '📍', name: d.name };
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => {
                              setSelectedDestinationId(d.id);
                              if (d.slug === 'bicol-intl-airport' || d.slug === 'naga-airport') {
                                setSelectedRentalType('WITH_DRIVER');
                              }
                            }}
                            className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-1 ${
                              isSelected
                                ? 'bg-brand-blue text-white border-brand-blue shadow-xs scale-[1.02]'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span>{theme.icon}</span>
                            <span>{d.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Duration Presets & Date Pickers */}
                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <CalendarCheck2 className="w-4 h-4 text-brand-blue" />
                        <span>Quick Duration Buttons:</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {[
                        { days: 1, label: '1 Day (24h)' },
                        { days: 2, label: '2 Days' },
                        { days: 3, label: '3 Days' },
                        { days: 4, label: '4 Days' },
                        { days: 5, label: '5 Days' },
                        { days: 7, label: '1 Week (7 Days)' },
                        { days: 15, label: '15 Days' },
                        { days: 30, label: '1 Month' },
                      ].map((btn) => {
                        const daysDiff = differenceInCalendarDays(new Date(returnAt), new Date(pickupAt));
                        const isActive = daysDiff === btn.days;
                        return (
                          <button
                            key={btn.days}
                            type="button"
                            onClick={() => {
                              let start = pickupAt ? new Date(pickupAt) : addDays(new Date(), 1);
                              const todayStart = new Date();
                              todayStart.setHours(0, 0, 0, 0);
                              if (start < todayStart) {
                                start = new Date();
                              }
                              const newEnd = addDays(start, btn.days);
                              const currentStartHours = start.getHours() || 9;
                              newEnd.setHours(currentStartHours, 0, 0, 0);
                              setPickupAt(format(start, "yyyy-MM-dd'T'HH:mm"));
                              setReturnAt(format(newEnd, "yyyy-MM-dd'T'HH:mm"));
                            }}
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                              isActive
                                ? 'bg-brand-blue text-white border-brand-blue shadow-xs'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            {btn.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Exact Date & Time Pickers */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Pick-up Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={pickupAt}
                          min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) return;
                            setPickupAt(val);
                            const p = new Date(val);
                            const r = new Date(returnAt);
                            if (r <= p) {
                              const newR = addDays(p, 1);
                              setReturnAt(format(newR, "yyyy-MM-dd'T'HH:mm"));
                            }
                          }}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Return Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={returnAt}
                          min={pickupAt || format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) return;
                            const r = new Date(val);
                            const p = new Date(pickupAt);
                            if (r <= p) {
                              setError('Return schedule must be after the pick-up schedule.');
                              return;
                            }
                            setError(null);
                            setReturnAt(val);
                          }}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                        />
                      </div>
                    </div>

                    {/* Collapsible Fleet Calendar Visualizer */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setCalendarExpanded((prev) => !prev)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:text-blue-700 transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{calendarExpanded ? 'Hide Calendar Availability' : 'Show Fleet Availability Calendar'}</span>
                        {calendarExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {calendarExpanded && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                          <InteractiveCalendar
                            events={calendarEvents}
                            vehicles={vehicles}
                            selectedVehicleId={selectedVehicleId}
                            selectedPickup={pickupAt ? new Date(pickupAt) : undefined}
                            selectedReturn={returnAt ? new Date(returnAt) : undefined}
                            onSelectRange={(start, end) => {
                              const pTime = pickupAt ? new Date(pickupAt) : new Date();
                              const rTime = returnAt ? new Date(returnAt) : new Date();
                              const pHours = pTime.getHours() || 9;
                              const rHours = rTime.getHours() || pHours;

                              const newP = new Date(start);
                              newP.setHours(pHours, 0, 0, 0);

                              let newR = new Date(end);
                              if (isSameDay(start, end)) {
                                newR = addDays(newR, 1);
                              }
                              newR.setHours(rHours, 0, 0, 0);

                              setPickupAt(format(newP, "yyyy-MM-dd'T'HH:mm"));
                              setReturnAt(format(newR, "yyyy-MM-dd'T'HH:mm"));
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Choose Your Vehicle from Available Fleet */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Car className="w-5 h-5 text-brand-blue" />
                      <span>Select Your Vehicle:</span>
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">
                      Availability for: <strong className="text-brand-navy">{format(new Date(pickupAt), 'MMM dd')} - {format(new Date(returnAt), 'MMM dd, yyyy')}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vehicles.map((v) => {
                      const img = v.images?.find((i) => i.isPrimary)?.url || v.images?.[0]?.url;
                      const isSelected = selectedVehicleId === v.id;
                      const availInfo = checkVehicleAvailability(v);
                      const isAvail = availInfo.isAvailable;

                      return (
                        <div
                          key={v.id}
                          onClick={
                            isAvail
                              ? () => {
                                  setSelectedVehicleId(v.id);
                                  setError(null);
                                }
                              : undefined
                          }
                          style={{ cursor: isAvail ? 'pointer' : 'not-allowed' }}
                          className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row gap-3 sm:gap-4 select-none ${
                            !isAvail
                              ? 'opacity-40 bg-slate-100/90 border-slate-200 grayscale-[50%]'
                              : isSelected
                              ? 'border-brand-blue bg-blue-50/40 shadow-sm ring-2 ring-blue-500/20'
                              : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-xs'
                          }`}
                        >
                          <img
                            src={img}
                            alt={v.name}
                            className="w-full sm:w-28 h-36 sm:h-24 object-cover rounded-xl bg-slate-100 shrink-0"
                          />
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start">
                                <h4 className={`font-bold text-sm ${isAvail ? 'text-slate-900' : 'text-slate-500'}`}>
                                  {v.name}
                                </h4>
                                {isSelected && isAvail && (
                                  <CheckCircle className="w-4 h-4 text-brand-blue shrink-0" />
                                )}
                              </div>

                              <div className="mt-1">
                                {isAvail ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                                    <span>
                                      {availInfo.totalCount > 1
                                        ? `${availInfo.availableCount} of ${availInfo.totalCount} Units Available`
                                        : 'Available to Book'}
                                    </span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full">
                                    <XCircle className="w-3 h-3 text-rose-600" />
                                    <span>Fully Booked · Cannot Select</span>
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-slate-500 mt-1">
                                {v.transmission} · {v.seats} Seats · {v.category.replace('_', '/')}
                              </p>
                            </div>

                            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-xs font-extrabold text-brand-navy">
                                From {formatPeso(v.startingRates?.SELF_DRIVE || v.startingRates?.WITH_DRIVER || 0)} /24h
                              </span>
                              {isSelected && quote && (
                                <span className="text-xs font-black text-brand-blue bg-blue-50 px-2 py-0.5 rounded-md">
                                  Total: {formatPeso(quote.totalAmount)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Sticky Bottom Action Bar */}
                <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">
                      Trip Selection Summary
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-extrabold text-white">
                        {selectedVehicle?.name || 'Please select a vehicle'}
                      </span>
                      {selectedVehicle && (
                        <span className="text-xs text-blue-300 bg-blue-900/60 border border-blue-700/60 px-2 py-0.5 rounded-md font-bold">
                          {selectedRentalType === 'SELF_DRIVE' ? 'Self-Drive' : 'With Driver'} · {daysDifference} Day{daysDifference > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    {quote && (
                      <p className="text-xs text-slate-300">
                        Estimated Total: <strong className="text-emerald-400 text-sm">{formatPeso(quote.totalAmount)}</strong> (Reservation Fee to lock dates: <strong>{formatPeso(quote.reservationFee)}</strong>)
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleProceedToStep2}
                    disabled={!selectedVehicleId || !checkVehicleAvailability(vehicles.find((v) => v.id === selectedVehicleId) || ({} as any)).isAvailable}
                    className="w-full sm:w-auto bg-brand-blue hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm px-7 py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all cursor-pointer"
                  >
                    <span>Continue to Renter Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Local Sponsors & Partner Ads */}
                <div className="pt-2">
                  <MapRouteAdsCarousel />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 2: RENTER INFORMATION & HANDOVER PREFERENCES */}
        {/* ============================================================== */}
        {step === 2 && (
          <form onSubmit={handleSaveCustomerInfo} noValidate className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 md:p-8 space-y-6">
              <div>
                <span className="text-xs font-extrabold text-brand-blue uppercase tracking-wider">Step 2 of 3</span>
                <h2 className="text-2xl font-black text-slate-900">Renter Information</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your contact details for your official reservation and contract. No account or password required!
                </p>
              </div>

              {/* Renter Errors Banner */}
              {Object.keys(renterErrors).length > 0 && Object.values(renterErrors).some(Boolean) && (
                <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-red-800 text-xs font-bold flex items-center gap-3 shadow-xs animate-shake">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <div>
                    <span className="block font-black text-sm text-red-900">Please correct the highlighted fields below</span>
                    <span className="font-medium text-red-700">Valid name, email, and 11-digit Philippine mobile number starting with 09 are required.</span>
                  </div>
                </div>
              )}

              {/* Required Core Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Full Legal Name (As shown on ID) *</span>
                    {renterErrors.name && (
                      <span className="text-red-500 text-[11px] font-semibold lowercase tracking-normal">required</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (renterTouched.name) {
                        const errs = validateRenterInfo({ name: e.target.value });
                        setRenterErrors((prev) => ({ ...prev, name: errs.name }));
                      }
                    }}
                    onBlur={() => {
                      setRenterTouched((prev) => ({ ...prev, name: true }));
                      const errs = validateRenterInfo({ name: customerName });
                      setRenterErrors((prev) => ({ ...prev, name: errs.name }));
                    }}
                    placeholder="e.g. Juan Dela Cruz"
                    className={`w-full rounded-xl p-2.5 font-medium transition-all focus:outline-none ${
                      renterErrors.name
                        ? 'bg-red-50/50 border-2 border-red-500 focus:ring-2 focus:ring-red-400'
                        : 'bg-slate-50 border border-slate-300 focus:ring-2 focus:ring-brand-blue'
                    }`}
                  />
                  {renterErrors.name && (
                    <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1 font-bold">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {renterErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Philippine Mobile Number *</span>
                    {renterErrors.phone && (
                      <span className="text-red-500 text-[11px] font-semibold lowercase tracking-normal">09xx 11-digits</span>
                    )}
                  </label>
                  <input
                    type="tel"
                    maxLength={11}
                    value={customerPhone}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '').slice(0, 11);
                      setCustomerPhone(cleaned);
                      if (renterTouched.phone) {
                        const errs = validateRenterInfo({ phone: cleaned });
                        setRenterErrors((prev) => ({ ...prev, phone: errs.phone }));
                      }
                    }}
                    onBlur={() => {
                      setRenterTouched((prev) => ({ ...prev, phone: true }));
                      const errs = validateRenterInfo({ phone: customerPhone });
                      setRenterErrors((prev) => ({ ...prev, phone: errs.phone }));
                    }}
                    placeholder="e.g. 09953827972"
                    className={`w-full rounded-xl p-2.5 font-medium transition-all focus:outline-none ${
                      renterErrors.phone
                        ? 'bg-red-50/50 border-2 border-red-500 focus:ring-2 focus:ring-red-400'
                        : 'bg-slate-50 border border-slate-300 focus:ring-2 focus:ring-brand-blue'
                    }`}
                  />
                  {renterErrors.phone && (
                    <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1 font-bold">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {renterErrors.phone}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Email Address (For Confirmation & Contract) *</span>
                    {renterErrors.email && (
                      <span className="text-red-500 text-[11px] font-semibold lowercase tracking-normal">invalid email</span>
                    )}
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => {
                      setCustomerEmail(e.target.value);
                      if (renterTouched.email) {
                        const errs = validateRenterInfo({ email: e.target.value });
                        setRenterErrors((prev) => ({ ...prev, email: errs.email }));
                      }
                    }}
                    onBlur={() => {
                      setRenterTouched((prev) => ({ ...prev, email: true }));
                      const errs = validateRenterInfo({ email: customerEmail });
                      setRenterErrors((prev) => ({ ...prev, email: errs.email }));
                    }}
                    placeholder="e.g. juan@example.com"
                    className={`w-full rounded-xl p-2.5 font-medium transition-all focus:outline-none ${
                      renterErrors.email
                        ? 'bg-red-50/50 border-2 border-red-500 focus:ring-2 focus:ring-red-400'
                        : 'bg-slate-50 border border-slate-300 focus:ring-2 focus:ring-brand-blue'
                    }`}
                  />
                  {renterErrors.email && (
                    <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1 font-bold">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {renterErrors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Handover & Delivery Options */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-xs">
                  Pick-up & Handover Preference
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setPickupMethod('OFFICE')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      pickupMethod === 'OFFICE'
                        ? 'border-brand-blue bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">🏢 Free Office Pick-up</span>
                      {pickupMethod === 'OFFICE' && <CheckCircle className="w-4 h-4 text-brand-blue" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Custoworks Garage, Carnation St. CBD II, Naga City (Beside SM City Naga).
                    </p>
                  </div>

                  <div
                    onClick={() => setPickupMethod('DELIVERY')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      pickupMethod === 'DELIVERY'
                        ? 'border-brand-blue bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">🚚 Doorstep Delivery / Airport Meetup</span>
                      {pickupMethod === 'DELIVERY' && <CheckCircle className="w-4 h-4 text-brand-blue" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Vehicle delivered directly to your hotel, residence, or airport arrival terminal.
                    </p>
                  </div>
                </div>

                {pickupMethod === 'DELIVERY' && (
                  <div className="pt-2">
                    <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                      Delivery Address / Meetup Point *
                    </label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="e.g. Villa Caceres Hotel, Naga City or BIA Airport Arrival Terminal"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-brand-blue focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Optional Details Toggle */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOptionalFields((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <span>{showOptionalFields ? 'Hide Additional Details' : '+ Add Address, Emergency Contact, or Flight Info (Optional)'}</span>
                  {showOptionalFields ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showOptionalFields && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Home Address
                      </label>
                      <input
                        type="text"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        placeholder="Street, Barangay, City, Province"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-brand-blue focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Emergency Contact Person
                      </label>
                      <input
                        type="text"
                        value={emergencyName}
                        onChange={(e) => setEmergencyName(e.target.value)}
                        placeholder="Name of contact person"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-brand-blue focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Emergency Phone Number
                      </label>
                      <input
                        type="tel"
                        maxLength={11}
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                        placeholder="e.g. 09953827972"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-brand-blue focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Flight Number (If Airport Arrival)
                      </label>
                      <input
                        type="text"
                        value={flightNumber}
                        onChange={(e) => setFlightNumber(e.target.value)}
                        placeholder="e.g. 5J 323 / PR 2923"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-brand-blue focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Purpose of Rental
                      </label>
                      <input
                        type="text"
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        placeholder="e.g. Vacation, Business Meeting, Wedding"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-brand-blue focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Step Navigation Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full sm:w-auto border border-slate-300 text-slate-700 font-bold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Vehicle Selection
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto bg-brand-blue hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-xs px-7 py-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <span>{submitting ? 'Placing Hold...' : 'Proceed to Payment & Confirm Hold'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* STEP 3: PAYMENT, VERIFICATION & CONFIRMATION */}
        {/* ============================================================== */}
        {step === 3 && (
          <form onSubmit={handleUploadPayment} className="space-y-6">
            <div className="space-y-6">
              {/* Vehicle Hold Placed Banner */}
              {createdBooking?.reference && (
                <div className="bg-gradient-to-r from-brand-navy to-slate-900 text-white p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-blue-900/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 font-bold">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[11px] text-blue-200 uppercase font-semibold">Official Booking Reference #</p>
                      <p className="text-xl font-black font-mono tracking-wider text-amber-300">{createdBooking.reference}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3.5 py-1.5 rounded-full font-bold self-start sm:self-auto flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Schedule Locked (30-Minute Hold)</span>
                  </span>
                </div>
              )}

              {/* Two-Column Layout: Financials & Payment Verification */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Column (2 Cols): Financial Breakdown & Terms */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-4 text-xs flex flex-col justify-between">
                  <div className="space-y-3">
                    <h3 className="font-black text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-brand-blue" />
                      <span>Trip Summary & Financials</span>
                    </h3>

                    <div>
                      <span className="text-slate-400 uppercase font-bold text-[10px]">Vehicle Selected</span>
                      <p className="font-extrabold text-slate-900 text-sm">{selectedVehicle?.name}</p>
                      <p className="text-slate-500 text-[11px]">
                        {selectedRentalType === 'SELF_DRIVE' ? 'Self-Drive' : 'With Driver'} · {selectedVehicle?.seats} Seats
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-slate-400 uppercase font-bold text-[10px]">Destination & Dates</span>
                      <p className="font-bold text-slate-800">{selectedDestination?.name}</p>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        {formatDate(pickupAt)} ➔ {formatDate(returnAt)} ({daysDifference} Days)
                      </p>
                    </div>

                    {quote && (
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <div className="flex justify-between py-0.5">
                          <span className="text-slate-600">Base Rental:</span>
                          <span className="font-bold text-slate-900">{formatPeso(quote.rentalFee)}</span>
                        </div>
                        {quote.fees.map((f, i) => (
                          <div key={i} className="flex justify-between py-0.5">
                            <span className="text-slate-600">{f.name}:</span>
                            <span className="font-bold text-slate-900">{formatPeso(f.amount)}</span>
                          </div>
                        ))}
                        {quote.discount > 0 && (
                          <div className="flex justify-between py-0.5 text-emerald-700">
                            <span>Discount:</span>
                            <span className="font-bold">- {formatPeso(quote.discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between py-2 border-t border-slate-200 font-extrabold text-sm text-slate-900">
                          <span>Total Estimated Rental:</span>
                          <span className="text-brand-blue">{formatPeso(quote.totalAmount)}</span>
                        </div>
                      </div>
                    )}

                    {/* Due Now Badge */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-brand-navy">Reservation Fee Due Now:</span>
                        <span className="font-black text-brand-blue text-sm">{formatPeso(quote?.reservationFee || 1000)}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Remaining balance of <strong>{formatPeso(quote?.balanceDue || 0)}</strong> is paid upon vehicle turnover.
                      </p>
                    </div>
                  </div>

                  {/* Cleanliness Notice */}
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-[11px] text-slate-600 space-y-1">
                    <p className="font-bold text-slate-800 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-brand-blue" />
                      <span>Refundable Deposit & Clean Return</span>
                    </p>
                    <p>
                      Your ₱1,000 reservation fee serves as your security deposit upon handover. Return the car in clean condition with matched fuel for 100% on-the-spot deposit refund!
                    </p>
                  </div>
                </div>

                {/* Right Column (3 Cols): Payment Verification & Document Upload */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-5 text-xs">
                  <div>
                    <h3 className="font-black text-sm text-slate-900 pb-1 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-brand-blue" />
                      <span>Send Reservation Fee ({formatPeso(quote?.reservationFee || 1000)})</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Send the ₱1,000 reservation fee via GCash or Maya to lock your vehicle schedule immediately.
                    </p>
                  </div>

                  {/* GCash / Maya Quick Account Box */}
                  <div className="bg-gradient-to-r from-blue-50 via-indigo-50/40 to-slate-50 border border-blue-200 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-blue block">
                          Verified Payment Account
                        </span>
                        <p className="font-black text-base text-slate-900">GCash / Maya / Bank Transfer</p>
                        <p className="text-slate-600 font-semibold mt-0.5">
                          Account Name: <strong>Jericho Oclares / Custoworks Dispatch</strong>
                        </p>
                      </div>
                      <span className="font-extrabold text-xs bg-brand-blue text-white px-3 py-1.5 rounded-lg shadow-xs">
                        Amount: {formatPeso(quote?.reservationFee || 1000)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <div className="bg-white px-3 py-2 rounded-xl border border-blue-200 font-mono font-bold text-sm text-brand-navy flex items-center gap-2">
                        <span>0995 382 7972</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('09953827972')}
                        className="inline-flex items-center gap-1 text-xs font-bold bg-white hover:bg-slate-50 text-brand-blue border border-blue-200 px-3 py-2 rounded-xl transition-all shadow-2xs"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied!' : 'Copy GCash Number'}</span>
                      </button>
                      <span className="text-[11px] text-slate-500 font-medium">
                        (Secondary: 0961 722 5326)
                      </span>
                    </div>
                  </div>

                  {/* Payment Proof Fields */}
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Bank / GCash Reference Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={paymentRefNumber}
                        onChange={(e) => setPaymentRefNumber(e.target.value)}
                        placeholder="e.g. 1029384756 or Ref # from receipt"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-brand-blue focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Payment Receipt Screenshot ({formatPeso(quote?.reservationFee || 1000)} Fee) *
                      </label>
                      {paymentReceiptFile ? (
                        <div className="bg-slate-50 p-3 rounded-xl border border-blue-200 flex items-center gap-3">
                          {paymentReceiptPreview ? (
                            <img
                              src={paymentReceiptPreview}
                              alt="Receipt Preview"
                              className="w-16 h-16 object-cover rounded-lg border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center shrink-0">
                              <ImageIcon className="w-6 h-6 text-slate-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 truncate">{paymentReceiptFile.name}</p>
                            <p className="text-[11px] text-slate-500">{(paymentReceiptFile.size / 1024).toFixed(1)} KB · Attached</p>
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentReceiptFile(null);
                                setPaymentReceiptPreview(null);
                              }}
                              className="text-rose-600 font-bold text-[11px] hover:underline mt-0.5"
                            >
                              Remove & Retake
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 bg-brand-blue hover:bg-blue-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all">
                            <Camera className="w-4 h-4" />
                            <span>Capture Receipt Photo</span>
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

                          <label className="cursor-pointer inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-300 transition-all">
                            <ImageIcon className="w-4 h-4 text-slate-500" />
                            <span>Upload from Files</span>
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
                  </div>

                  {/* Flexible Driver's License & Valid ID Section */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <FileCheck2 className="w-4 h-4 text-brand-blue" />
                        <span>Driver&apos;s License & Valid ID Verification:</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Flexible Submission
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                      <label className="flex items-start gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={submitLaterRequirements}
                          onChange={(e) => setSubmitLaterRequirements(e.target.checked)}
                          className="mt-0.5 rounded text-brand-blue focus:ring-brand-blue"
                        />
                        <span className="text-[11px] text-slate-700 font-semibold leading-relaxed">
                          I will submit my Driver&apos;s License later via <strong>Messenger / WhatsApp</strong> or present my physical card during vehicle release.
                        </span>
                      </label>

                      {!submitLaterRequirements && (
                        <div className="pt-2 border-t border-slate-200/80 space-y-2">
                          <p className="text-[11px] text-slate-500">
                            Want to speed up release? Snap a quick photo of your Driver&apos;s License now:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {createdBooking?.requirements?.slice(0, 2).map((req: any) => {
                              const hasDoc = req.status === 'SUBMITTED' || req.status === 'APPROVED' || requirementFiles[req.id];
                              return (
                                <label
                                  key={req.id}
                                  className={`cursor-pointer text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
                                    hasDoc
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-2xs'
                                  }`}
                                >
                                  {hasDoc ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <Upload className="w-3.5 h-3.5 text-slate-500" />}
                                  <span>{hasDoc ? `${req.name} (Ready)` : `Upload ${req.name}`}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      if (e.target.files?.[0]) handleSelectRequirementFile(req.id, e.target.files[0]);
                                    }}
                                    className="hidden"
                                  />
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submission Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-full sm:w-auto border border-slate-300 text-slate-700 font-bold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to Details
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-7 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                    >
                      <span>{submitting ? 'Submitting Reservation...' : 'Lock My Reservation & Complete ➔'}</span>
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* STEP 4: SUCCESS & TRACKING SCREEN */}
        {/* ============================================================== */}
        {step === 4 && (
          <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Reservation Successfully Submitted!</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-lg mx-auto">
                Thank you! Your {formatPeso(quote?.reservationFee || 1000)} reservation fee receipt has been received and your vehicle schedule is reserved.
              </p>
            </div>

            {/* Official Confirmation Card with 1-Click Screenshot & Dispatch Chat */}
            <ReservationConfirmationCard
              reference={createdBooking?.reference || 'CW-PENDING'}
              vehicleName={selectedVehicle?.name}
              rentalType={selectedRentalType}
              destinationName={selectedDestination?.name}
              pickupAt={pickupAt}
              returnAt={returnAt}
              status={createdBooking?.status || 'PAYMENT_VERIFICATION'}
              reservationFee={quote?.reservationFee || 1000}
              customerName={customerName}
              customerPhone={customerPhone}
              onTrackClick={() => navigate(`/track?ref=${createdBooking?.reference}`)}
            />

            {/* What Happens Next Checklist */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-xl mx-auto text-left text-xs space-y-3 shadow-xs">
              <h4 className="font-extrabold text-slate-900 text-sm">What Happens Next?</h4>
              <ol className="space-y-2 list-decimal list-inside text-slate-600">
                <li>Our Naga City dispatch team verifies your {formatPeso(quote?.reservationFee || 1000)} reservation receipt.</li>
                <li>Your booking status automatically updates to <strong>Confirmed & Accepted</strong>.</li>
                <li>Pay the remaining balance upon pickup or handover beside SM City Naga.</li>
              </ol>
            </div>

            {/* Navigation Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2 max-w-xl mx-auto">
              <button
                onClick={() => navigate(`/track?ref=${createdBooking?.reference}`)}
                className="bg-brand-blue hover:bg-blue-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Search className="w-4 h-4" /> Track Booking Status Now
              </button>
              <button
                onClick={() => navigate('/')}
                className="border border-slate-300 text-slate-700 font-bold text-sm px-5 py-3.5 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
              >
                Return to Home
              </button>
            </div>

            <div className="pt-4 max-w-xl mx-auto">
              <MapRouteAdsCarousel />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
