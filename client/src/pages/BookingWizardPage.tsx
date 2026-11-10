import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
} from 'lucide-react';
import { format, addDays, differenceInCalendarDays } from 'date-fns';
import { ReservationConfirmationCard } from '../components/ReservationConfirmationCard';
import { saveFileToGallery } from '../lib/screenshot';

interface DestinationMeta {
  badgeText: string;
  badgeClass: string;
  rateSedan: string;
  rateSuv: string;
  rateVan: string;
}

const DESTINATION_META: Record<string, DestinationMeta> = {
  'naga-city': {
    badgeText: '🏙️ Naga City · Sedan ₱1.5k • SUV ₱2k • Van ₱3.5k',
    badgeClass: 'bg-emerald-100 text-emerald-950 border border-emerald-300',
    rateSedan: '₱1,500 (12h) / ₱2,000 (24h)',
    rateSuv: '₱2,000 (12h) / ₱2,500 (24h)',
    rateVan: '₱3,500 (12h) / ₱4,500 (24h)',
  },
  'camarines-sur': {
    badgeText: '📍 CamSur · Sedan ₱1.7k • SUV ₱2.2k • Van ₱3.8k',
    badgeClass: 'bg-sky-100 text-sky-950 border border-sky-300',
    rateSedan: '₱1,700 (12h) / ₱2,200 (24h)',
    rateSuv: '₱2,200 (12h) / ₱2,700 (24h)',
    rateVan: '₱3,800 (12h) / ₱4,800 (24h)',
  },
  'naga-airport': {
    badgeText: '🛬 Naga Airport · Sedan ₱1.8k • Innova ₱2.5k • Van ₱3.5k',
    badgeClass: 'bg-blue-100 text-blue-950 border border-blue-300',
    rateSedan: '₱1,800 (Pickup & Drop)',
    rateSuv: '₱2,500 (Pickup & Drop)',
    rateVan: '₱3,500 (Pickup & Drop)',
  },
  'bicol-intl-airport': {
    badgeText: '✈️ BIA Airport · Sedan ₱4.5k • Innova ₱6k • Van ₱7.5k',
    badgeClass: 'bg-amber-100 text-amber-950 border border-amber-300',
    rateSedan: '₱4,500 (Pickup & Drop)',
    rateSuv: '₱6,000 (Pickup & Drop)',
    rateVan: '₱7,500 (Pickup & Drop)',
  },
  'albay-daet': {
    badgeText: '🌋 Albay / Daet · Sedan ₱2k • SUV ₱2.5k • Van ₱4.2k',
    badgeClass: 'bg-purple-100 text-purple-950 border border-purple-300',
    rateSedan: '₱2,000 (12h) / ₱2,500 (24h)',
    rateSuv: '₱2,500 (12h) / ₱3,000 (24h)',
    rateVan: '₱4,200 (12h) / ₱5,200 (24h)',
  },
  'sorsogon-labo': {
    badgeText: '🌊 Sorsogon / Labo · Sedan ₱2.5k • SUV ₱3k • Van ₱5.8k',
    badgeClass: 'bg-teal-100 text-teal-950 border border-teal-300',
    rateSedan: '₱2,500 (12h) / ₱3,000 (24h)',
    rateSuv: '₱3,000 (12h) / ₱3,500 (24h)',
    rateVan: '₱7,000 (12h) / ₱5,800 (24h)',
  },
  'manila': {
    badgeText: '🛣️ Manila Express · Sedan ₱4.5k • SUV ₱5.5k • Van ₱7.5k',
    badgeClass: 'bg-rose-100 text-rose-950 border border-rose-300',
    rateSedan: '₱4,500 (12h) / ₱5,000 (24h)',
    rateSuv: '₱5,500 (12h) / ₱6,000 (24h)',
    rateVan: '₱9,000 (12h) / ₱7,500 (24h)',
  },
  'baguio': {
    badgeText: '🌲 Baguio · Sedan ₱5.5k • SUV ₱6.5k • Van ₱9k',
    badgeClass: 'bg-indigo-100 text-indigo-950 border border-indigo-300',
    rateSedan: '₱5,500 (12h)',
    rateSuv: '₱6,500 (12h) / ₱7,000 (24h)',
    rateVan: '₱10,000 (12h) / ₱9,000 (24h)',
  },
};

export const BookingWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Master Data
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [additionalFees, setAdditionalFees] = useState<any[]>([]);

  // Wizard State
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

  // Renter Information Field-level Validation Errors & Touched State
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

    // Philippine mobile number validation: must start with 09 and be exactly 11 digits
    if (!phoneVal) {
      errors.phone = 'Philippine mobile number is required.';
    } else if (!/^09\d{9}$/.test(phoneVal)) {
      errors.phone = 'Must be an 11-digit Philippine mobile number starting with 09 (e.g. 09953827972).';
    }

    if (!addressVal) {
      errors.address = 'Complete address is required.';
    } else if (addressVal.length < 5) {
      errors.address = 'Please provide your street/barangay, city, and province.';
    }

    if (emerPhoneVal && !/^09\d{9}$/.test(emerPhoneVal)) {
      errors.emergencyPhone = 'Must be an 11-digit Philippine mobile number starting with 09 (e.g. 09953827972).';
    }

    return errors;
  };

  // Server Quote & Created Draft
  const [quote, setQuote] = useState<PricingQuote | null>(null);
  const [createdBooking, setCreatedBooking] = useState<any | null>(null);

  // Requirements Upload State
  const [requirementFiles, setRequirementFiles] = useState<Record<string, File>>({});
  const [requirementPreviews, setRequirementPreviews] = useState<Record<string, string>>({});
  const [secondaryIdOption, setSecondaryIdOption] = useState<string>('Passport');
  const [uploadProgress, setUploadProgress] = useState<Record<string, boolean>>({});
  const [aiVerifications, setAiVerifications] = useState<Record<string, any>>({});

  // Payment State
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [paymentRefNumber, setPaymentRefNumber] = useState<string>('');
  const [paymentReceiptFile, setPaymentReceiptFile] = useState<File | null>(null);
  const [paymentReceiptPreview, setPaymentReceiptPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Calendar Busy Dates for Selected Vehicle
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);

  // Automatically scroll to the top of the page when changing steps (e.g. after clicking "Proceed to Customer Details" on Calendar step)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [step]);

  useEffect(() => {
    const initData = async () => {
      try {
        const [vRes, dRes, pRes, fRes] = await Promise.all([
          api.get<{ data: Vehicle[] }>('/vehicles'),
          api.get<{ destinations: Destination[] }>('/pricing/destinations'),
          api.get<{ methods: PaymentMethod[] }>('/payments/methods'),
          api.get<{ fees: any[] }>('/pricing/additional-fees'),
        ]);

        setVehicles(vRes.data);
        setDestinations(dRes.destinations);
        setPaymentMethods(pRes.methods);
        setAdditionalFees(fRes.fees);

        // URL Search Params pre-selection
        const paramDest = searchParams.get('destinationId');
        const paramRentalType = searchParams.get('rentalType');
        const paramCategory = searchParams.get('category');
        const paramTransfer = searchParams.get('transfer') || searchParams.get('serviceType');

        if (paramRentalType === 'WITH_DRIVER' || paramRentalType === 'SELF_DRIVE') {
          setSelectedRentalType(paramRentalType);
        }

        if (paramTransfer?.toLowerCase().includes('bia') || paramTransfer?.toLowerCase().includes('airport')) {
          setSelectedRentalType('WITH_DRIVER');
          const biaDest = dRes.destinations.find((d) => d.slug === 'bicol-intl-airport');
          if (biaDest) setSelectedDestinationId(biaDest.id);
          if (paramCategory) {
            const matchVeh = vRes.data.find((v) => v.category === paramCategory);
            if (matchVeh) setSelectedVehicleId(matchVeh.id);
          }
        } else if (paramDest) {
          const matchDest = dRes.destinations.find((d) => d.id === paramDest || d.slug === paramDest);
          if (matchDest) setSelectedDestinationId(matchDest.id);
        } else if (dRes.destinations.length > 0) {
          setSelectedDestinationId(dRes.destinations[0].id);
        }

        const deliveryZones = fRes.fees.filter((f) => f.type === 'DELIVERY');
        if (deliveryZones.length > 0) {
          setDeliveryZoneId(deliveryZones[0].id);
        }

        if (pRes.methods.length > 0) {
          setSelectedPaymentMethodId(pRes.methods[0].id);
        }

        if (!selectedVehicleId && vRes.data.length > 0) {
          setSelectedVehicleId(vRes.data[0].id);
        }
      } catch (err) {
        console.error('Failed to initialize wizard data:', err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // Restore existing booking from URL query (?ref=...) or sessionStorage
  useEffect(() => {
    const refParam = searchParams.get('ref') || searchParams.get('reference');
    if (refParam && !createdBooking) {
      api
        .get<{ booking: any }>(`/bookings/track/${refParam}`)
        .then((res) => {
          if (res.booking) {
            setCreatedBooking(res.booking);
            setStep(6);
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

  // Persist current booking in session
  useEffect(() => {
    if (createdBooking?.reference) {
      sessionStorage.setItem('cw_current_booking', JSON.stringify(createdBooking));
    }
  }, [createdBooking]);

  // Auto-fetch or refresh requirements when on Step 6
  useEffect(() => {
    if (step === 6 && createdBooking) {
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
            console.error('Failed to load booking requirements in Step 6:', err);
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

  // Fetch calendar events when vehicle changes
  useEffect(() => {
    if (!selectedVehicleId) return;
    api
      .get<{ events: any[] }>(`/calendar/vehicle/${selectedVehicleId}`)
      .then((res) => setCalendarEvents(res.events))
      .catch((err) => console.error(err));
  }, [selectedVehicleId]);

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
        pickupMethod,
      });
      if (pickupMethod === 'DELIVERY' && deliveryZoneId) {
        q.set('deliveryZoneId', deliveryZoneId);
      }
      surchargeIds.forEach((id) => q.append('surchargeIds', id));
      if (promoCode) q.set('promoCode', promoCode);

      const res = await api.get<{ quote: PricingQuote }>(`/pricing/quote?${q.toString()}`);
      setQuote(res.quote);
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

  // STEP 4 -> 5: Proceed to Customer Information (no customer account required)
  const handleProceedToCustomerInfo = () => {
    setError(null);
    if (!pickupAt || !returnAt) {
      setError('Please select both pick-up and return schedule.');
      return;
    }
    const pickupDate = new Date(pickupAt);
    const returnDate = new Date(returnAt);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    if (pickupDate < todayStart) {
      setError('You cannot book previous dates. Pick-up schedule is available today onwards only.');
      return;
    }
    if (returnDate <= pickupDate) {
      setError('Return schedule must be after the pick-up schedule.');
      return;
    }
    setStep(5);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  // STEP 5 -> 6: Save Customer Info & Create Draft Hold (generates Tracking Number)
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
      ? `${purpose || 'Airport Transfer'} (Flight: ${flightNumber})`
      : purpose;
    const finalDeliveryAddress =
      pickupMethod === 'DELIVERY'
        ? deliveryAddress
        : isAirportTransfer && flightNumber
        ? `Airport Meetup - Flight ${flightNumber}`
        : null;

    try {
      if (!createdBooking || createdBooking.status !== 'DRAFT') {
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
            customerAddress,
            emergencyContactName: emergencyName,
            emergencyContactPhone: emergencyPhone,
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
          pickupMethod,
          deliveryZoneId: pickupMethod === 'DELIVERY' ? deliveryZoneId : null,
          deliveryAddress: finalDeliveryAddress,
          surchargeIds,
          promoCode: promoCode || null,
          customer: {
            customerName,
            customerEmail,
            customerPhone,
            customerAddress,
            emergencyContactName: emergencyName,
            emergencyContactPhone: emergencyPhone,
            purpose: finalPurpose,
          },
        });
        setCreatedBooking(res.booking);
      }
      setStep(6);
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
              customerAddress,
              emergencyContactName: emergencyName,
              emergencyContactPhone: emergencyPhone,
              purpose: finalPurpose,
            },
          });
          setCreatedBooking(res.booking);
          setError(null);
          setStep(6);
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

  // STEP 6: Direct Auto-Upload of Requirement Document
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
      // Reload booking with updated requirements and documents
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
    // Automatically upload immediately upon photo selection!
    await handleUploadRequirementDirect(requirementId, file);
  };

  const handleClearRequirementFile = (requirementId: string) => {
    setRequirementFiles((prev) => {
      const copy = { ...prev };
      delete copy[requirementId];
      return copy;
    });
    setRequirementPreviews((prev) => {
      const copy = { ...prev };
      delete copy[requirementId];
      return copy;
    });
  };

  // STEP 6: Upload individual requirement document (fallback manual retry)
  const handleUploadRequirement = async (requirementId: string) => {
    const file = requirementFiles[requirementId];
    if (!file) {
      setError('Please choose a file to upload');
      return;
    }
    await handleUploadRequirementDirect(requirementId, file);
  };

  // Safe navigation from Step 6 to Step 7 (ensures all pending files are uploaded)
  const handleProceedToSummary = async () => {
    const isAnyUploading = Object.values(uploadProgress).some(Boolean);
    if (isAnyUploading) {
      setError('Please wait a moment while your document upload finishes.');
      return;
    }

    // Check if any selected files are still waiting to be uploaded
    const pendingReqIds = Object.keys(requirementFiles).filter((reqId) => {
      const slot = createdBooking?.requirements?.find((r: any) => r.id === reqId);
      return !slot?.documents?.length && slot?.status !== 'SUBMITTED' && slot?.status !== 'APPROVED';
    });

    if (pendingReqIds.length > 0) {
      setSubmitting(true);
      try {
        for (const reqId of pendingReqIds) {
          const file = requirementFiles[reqId];
          if (file) {
            await handleUploadRequirementDirect(reqId, file);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to upload document');
        setSubmitting(false);
        return;
      } finally {
        setSubmitting(false);
      }
    }

    setError(null);
    setStep(7);
  };

  // STEP 7 -> 8: Submit Draft to Pending Payment
  const handleSubmitBooking = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post<{ booking: any }>(`/bookings/${createdBooking.id}/submit`);
      setCreatedBooking(res.booking);
      setStep(8);
    } catch (err: any) {
      setError(err.message || 'Failed to submit booking');
    } finally {
      setSubmitting(false);
    }
  };

  // STEP 8: Upload Payment Proof & Finish
  const handleUploadPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentMethodId || !paymentRefNumber || !paymentReceiptFile) {
      setError('Please select a payment method, enter the reference number, and upload the screenshot receipt');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('paymentMethodId', selectedPaymentMethodId);
      formData.append('referenceNumber', paymentRefNumber);
      formData.append('file', paymentReceiptFile);

      await api.post(`/payments/reservation/${createdBooking.id}`, formData);
      setStep(9); // Completed confirmation screen!
    } catch (err: any) {
      setError(err.message || 'Failed to submit payment receipt');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { num: 1, title: 'Vehicle' },
    { num: 2, title: 'Rental Type' },
    { num: 3, title: 'Destination' },
    { num: 4, title: 'Schedule' },
    { num: 5, title: 'Customer' },
    { num: 6, title: 'Requirements' },
    { num: 7, title: 'Summary' },
    { num: 8, title: 'Payment' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-blue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-4 sm:py-8 lg:py-10">
      <div className="max-w-5xl mx-auto px-2.5 sm:px-6 lg:px-8">
        {/* Wizard Progress Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-5 shadow-sm mb-4 sm:mb-8">
          {/* Mobile Step Header (Visible on phone screens) */}
          <div className="sm:hidden space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-brand-blue text-white flex items-center justify-center text-[10px] font-bold">
                  {step}
                </span>
                <span>
                  Step {step} of {steps.length}: <strong className="text-brand-blue">{steps[step - 1]?.title}</strong>
                </span>
              </span>
              <span className="font-mono text-slate-500 font-bold text-[11px]">{Math.round((step / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-brand-blue h-full rounded-full transition-all duration-300"
                style={{ width: `${(step / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Desktop Step Tracker (Hidden on small phones) */}
          <div className="hidden sm:flex items-center justify-between overflow-x-auto pb-2 gap-2">
            {steps.map((s) => {
              const isPassed = step > s.num;
              const isCurrent = step === s.num;
              return (
                <div key={s.num} className="flex items-center gap-2 shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isPassed
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-brand-blue text-white shadow-md shadow-blue-500/30'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isPassed ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <span
                    className={`text-xs font-semibold hidden md:inline ${
                      isCurrent ? 'text-slate-900 font-bold' : isPassed ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {s.title}
                  </span>
                  {s.num < steps.length && (
                    <div
                      className={`h-0.5 w-4 lg:w-8 hidden sm:block ${
                        isPassed ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 sm:p-4 rounded-2xl text-xs flex items-center gap-2 mb-4 sm:mb-6">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Wizard Container */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 md:p-8">
          {/* STEP 1: SELECT VEHICLE */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-extrabold text-brand-blue uppercase tracking-wider">Step 1 of 8</span>
                <h2 className="text-2xl font-black text-slate-900">Choose Your Vehicle</h2>
                <p className="text-xs text-slate-500 mt-1">Select from our fleet based in Naga City, Camarines Sur.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vehicles.map((v) => {
                  const img = v.images?.find((i) => i.isPrimary)?.url || v.images?.[0]?.url;
                  const isSelected = selectedVehicleId === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVehicleId(v.id)}
                      className={`p-3.5 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col sm:flex-row gap-3 sm:gap-4 ${
                        isSelected
                          ? 'border-brand-blue bg-blue-50/40 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <img src={img} alt={v.name} className="w-full sm:w-28 h-36 sm:h-20 object-cover rounded-xl bg-slate-100 shrink-0" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-sm text-slate-900">{v.name}</h4>
                          {isSelected && <CheckCircle className="w-4 h-4 text-brand-blue shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {v.transmission} · {v.seats} Seats · {v.category.replace('_', '/')}
                          {(v as any).fleetCount > 1 && (
                            <span className="ml-2 font-bold text-blue-700 bg-blue-100/70 border border-blue-200/60 px-1.5 py-0.2 rounded text-[10px]">
                              {(v as any).fleetCount} Units in Fleet ({(v as any).availableFleetCount} Avail)
                            </span>
                          )}
                        </p>
                        <div className="mt-2 text-xs font-extrabold text-brand-navy">
                          From {formatPeso(v.startingRates?.SELF_DRIVE || v.startingRates?.WITH_DRIVER || 0)} /24h
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Vehicle Rate Features & Smart Suggestions */}
              {(() => {
                const selVeh = vehicles.find((v) => v.id === selectedVehicleId);
                if (!selVeh) return null;

                const s12 = selVeh.startingRates?.SELF_DRIVE_12 || (selVeh.category === 'SEDAN' ? 1500 : selVeh.category === 'SUV_MPV' ? 2000 : 4000);
                const s24 = selVeh.startingRates?.SELF_DRIVE || (selVeh.category === 'SEDAN' ? 2000 : selVeh.category === 'SUV_MPV' ? 2500 : 5000);

                return (
                  <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50 border border-blue-200/80 rounded-2xl p-4 sm:p-5 space-y-3 mt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-blue-200/60">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-brand-blue text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                            <span>Pricelist Features & Suggestions for {selVeh.name}</span>
                            {(selVeh as any).fleetCount > 1 && (
                              <span className="text-[10px] font-extrabold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                                {(selVeh as any).fleetCount} Units in Fleet
                              </span>
                            )}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            {selVeh.category.replace('_', '/')} • {selVeh.transmission} • {selVeh.seats} Seats • {selVeh.fuelType || 'Gasoline'}
                          </p>
                        </div>
                      </div>

                      <a
                        href={`/rates?vehicleId=${selVeh.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-brand-blue hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Interactive Rate Calculator</span>
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>

                    {/* Rate Tier Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-2xs">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">12-Hour Flat</span>
                        <span className="font-extrabold text-slate-900 text-sm">
                          {formatPeso(s12)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">Naga Area quick errands</span>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-2xs">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">24-Hour Whole Day</span>
                        <span className="font-extrabold text-brand-blue text-sm">
                          {formatPeso(s24)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">Full 24h flexibility</span>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-2xs">
                        <span className="text-[10px] text-amber-600 font-bold uppercase block">Weekly Saver</span>
                        <span className="font-extrabold text-amber-600 text-sm">
                          Discounted
                        </span>
                        <span className="text-[10px] text-slate-500 block">Automatic on 7+ days</span>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-2xs">
                        <span className="text-[10px] text-emerald-600 font-bold uppercase block">Monthly Package</span>
                        <span className="font-extrabold text-emerald-600 text-sm">
                          Unli Mileage
                        </span>
                        <span className="text-[10px] text-slate-500 block">30+ days lease plan</span>
                      </div>
                    </div>

                    {/* Destination Rates Pill Row */}
                    <div className="pt-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1.5 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-500" />
                        Reference Destination Rates (Self-Drive):
                      </span>
                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 font-medium text-slate-700">
                          📍 <strong>Naga:</strong> {formatPeso(s12)} (12h) / {formatPeso(s24)} (24h)
                        </span>
                        <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 font-medium text-slate-700">
                          📍 <strong>CamSur:</strong> {formatPeso(s12 + 200)} (12h) / {formatPeso(s24 + 200)} (24h)
                        </span>
                        <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 font-medium text-slate-700">
                          📍 <strong>Albay / Daet:</strong> {formatPeso(s12 + 500)} (12h) / {formatPeso(s24 + 500)} (24h)
                        </span>
                        <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 font-medium text-slate-700">
                          📍 <strong>Sorsogon / Labo:</strong> {formatPeso(s12 + 1000)} (12h) / {formatPeso(s24 + 1000)} (24h)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    if (!selectedVehicleId) setError('Please select a vehicle to proceed');
                    else {
                      setError(null);
                      setStep(2);
                    }
                  }}
                  className="bg-brand-blue hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 shadow-md shadow-blue-500/20"
                >
                  Next: Select Rental Option <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SELECT RENTAL TYPE */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-extrabold text-brand-blue uppercase tracking-wider">Step 2 of 8</span>
                <h2 className="text-2xl font-black text-slate-900">Select Rental Type</h2>
                <p className="text-xs text-slate-500 mt-1">Choose between self-drive or executive with-driver service.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {selectedVehicle?.allowSelfDrive && (
                  <div
                    onClick={() => setSelectedRentalType('SELF_DRIVE')}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedRentalType === 'SELF_DRIVE'
                        ? 'border-brand-blue bg-blue-50/50 shadow-md ring-1 ring-brand-blue'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="p-2 rounded-xl bg-blue-100 text-brand-blue font-bold text-xs uppercase tracking-wider">
                        Self Drive
                      </span>
                      {selectedRentalType === 'SELF_DRIVE' && <CheckCircle className="w-5 h-5 text-brand-blue" />}
                    </div>
                    <h3 className="font-extrabold text-lg text-slate-900 mb-1">Drive Yourself</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                      Complete freedom and privacy. Requires valid driver's license & secondary valid ID.
                    </p>
                    <div className="text-xs text-slate-700 space-y-1.5 border-t border-slate-200/60 pt-3">
                      <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> 12h, 24h, weekly, monthly rates</div>
                      <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Upload physical ID & selfie online</div>
                    </div>
                  </div>
                )}

                {selectedVehicle?.allowWithDriver && (
                  <div
                    onClick={() => setSelectedRentalType('WITH_DRIVER')}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedRentalType === 'WITH_DRIVER' && !isAirportTransfer
                        ? 'border-brand-blue bg-blue-50/50 shadow-md ring-1 ring-brand-blue'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="p-2 rounded-xl bg-blue-100 text-brand-blue font-bold text-xs uppercase tracking-wider">
                        With Driver
                      </span>
                      {selectedRentalType === 'WITH_DRIVER' && !isAirportTransfer && <CheckCircle className="w-5 h-5 text-brand-blue" />}
                    </div>
                    <h3 className="font-extrabold text-lg text-slate-900 mb-1">Chauffeur Service</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                      Relax and let our courteous, route-familiar driver handle Bicol or long-haul highway traffic.
                    </p>
                    <div className="text-xs text-slate-700 space-y-1.5 border-t border-slate-200/60 pt-3">
                      <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Stress-free for out-of-town trips</div>
                      <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> 12h, 24h & regional tour rates</div>
                    </div>
                  </div>
                )}

                {/* 3rd Option: Airport Pickup & Drop */}
                {selectedVehicle?.allowWithDriver && (
                  <div
                    onClick={() => {
                      setSelectedRentalType('WITH_DRIVER');
                      const biaDest = destinations.find((d) => d.slug === 'bicol-intl-airport');
                      if (biaDest) setSelectedDestinationId(biaDest.id);
                    }}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all relative ${
                      selectedRentalType === 'WITH_DRIVER' && isAirportTransfer
                        ? 'border-amber-400 bg-amber-50/50 shadow-md ring-2 ring-amber-300'
                        : 'border-amber-200 hover:border-amber-300 bg-gradient-to-b from-amber-50/30 to-white'
                    }`}
                  >
                    <span className="absolute -top-2.5 right-4 text-[9px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase">
                      Fixed Airport Rate
                    </span>
                    <div className="flex justify-between items-center mb-3">
                      <span className="p-2 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                        <Plane className="w-3.5 h-3.5" /> Airport Transfer
                      </span>
                      {selectedRentalType === 'WITH_DRIVER' && isAirportTransfer && <CheckCircle className="w-5 h-5 text-amber-600" />}
                    </div>
                    <h3 className="font-extrabold text-lg text-slate-900 mb-1">Airport Pickup & Drop</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                      Direct terminal pickup & drop for <strong>Bicol International Airport (BIA / Daraga)</strong> or <strong>Naga Airport</strong>.
                    </p>
                    <div className="text-xs text-slate-800 space-y-1.5 border-t border-amber-200/60 pt-3 font-semibold">
                      <div className="flex items-center justify-between text-brand-blue">
                        <span>BIA Airport Rate:</span>
                        <strong className="text-slate-900">
                          {selectedVehicle?.category === 'VAN'
                            ? '₱7,500'
                            : selectedVehicle?.category === 'SUV_MPV'
                            ? '₱6,000'
                            : '₱4,500'}
                        </strong>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-700 text-[11px]">
                        <Check className="w-3 h-3 shrink-0" /> Chauffeur & flight tracking included
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setStep(1)}
                  className="border border-slate-300 text-slate-700 font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="bg-brand-blue hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 shadow-md shadow-blue-500/20"
                >
                  Next: Select Destination <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SELECT DESTINATION */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-extrabold text-brand-blue uppercase tracking-wider">Step 3 of 8</span>
                <h2 className="text-2xl font-black text-slate-900">Select Travel Destination</h2>
                <p className="text-xs text-slate-500 mt-1">Official rental rates vary based on your trip destination.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {destinations.map((d) => {
                  const isSelected = selectedDestinationId === d.id;
                  const isBia = d.slug === 'bicol-intl-airport';
                  const isNagaAirport = d.slug === 'naga-airport';
                  const isAirport = isBia || isNagaAirport;
                  const meta = DESTINATION_META[d.slug] || {
                    badgeText: `📍 ${d.name}`,
                    badgeClass: 'bg-slate-100 text-slate-800 border border-slate-300',
                    rateSedan: 'From ₱1,500',
                    rateSuv: 'From ₱2,000',
                    rateVan: 'From ₱3,500',
                  };

                  let vehicleRate = meta.rateSedan;
                  if (selectedVehicle?.category === 'VAN') {
                    vehicleRate = meta.rateVan;
                  } else if (selectedVehicle?.category === 'SUV_MPV') {
                    vehicleRate = meta.rateSuv;
                  }

                  return (
                    <div
                      key={d.id}
                      onClick={() => {
                        setSelectedDestinationId(d.id);
                        if (isAirport) {
                          setSelectedRentalType('WITH_DRIVER');
                        }
                      }}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-brand-blue bg-blue-50/50 shadow-sm ring-1 ring-brand-blue'
                          : isAirport
                          ? 'border-blue-200 bg-gradient-to-b from-blue-50/40 to-white hover:border-brand-blue'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider mb-2.5 ${meta.badgeClass}`}>
                          {meta.badgeText}
                        </span>
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-extrabold text-base text-slate-900">{d.name}</h4>
                          {isSelected && <CheckCircle className="w-5 h-5 text-brand-blue shrink-0" />}
                        </div>
                        <p className="text-xs text-slate-500">
                          {d.description || `Applicable for travels within ${d.name} and neighboring areas.`}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-semibold truncate max-w-[130px]" title={selectedVehicle?.name}>
                          {selectedVehicle ? `${selectedVehicle.name}:` : 'Official Rate:'}
                        </span>
                        <span className="font-extrabold text-brand-blue bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/80">
                          {vehicleRate}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setStep(2)}
                  className="border border-slate-300 text-slate-700 font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="bg-brand-blue hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 shadow-md shadow-blue-500/20"
                >
                  Next: Choose Schedule <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SELECT SCHEDULE & CALENDAR */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-extrabold text-brand-blue uppercase tracking-wider">Step 4 of 8</span>
                <h2 className="text-2xl font-black text-slate-900">Schedule & Calendar Availability</h2>
                <p className="text-xs text-slate-500 mt-1">Select your exact pickup and return dates and times.</p>
              </div>

              {/* Quick Duration Shortcuts */}
              {isAirportTransfer ? (
                <div className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                  <div>
                    <span className="text-xs font-black text-amber-950 flex items-center gap-1.5 uppercase tracking-wider">
                      ✈️ {selectedDestination?.name || 'Airport Transfer'} (Pickup & Drop)
                    </span>
                    <p className="text-slate-600 mt-0.5 font-medium">
                      Airport transfers are scheduled as a dedicated <strong>1-Day Chauffeur Service</strong>. Simply tap your desired flight/trip date on the calendar below!
                    </p>
                  </div>
                  <span className="font-extrabold text-brand-blue bg-white px-3 py-1.5 rounded-xl border border-amber-300 shrink-0 text-center shadow-xs">
                    1-Day Trip (Tap Date)
                  </span>
                </div>
              ) : (
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <CalendarCheck2 className="w-4 h-4 text-brand-blue" />
                      Quick Duration Preset (or select on Calendar):
                    </span>
                    <span className="text-xs font-black text-brand-blue bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                      {Math.max(1, differenceInCalendarDays(new Date(returnAt), new Date(pickupAt)))} Day{differenceInCalendarDays(new Date(returnAt), new Date(pickupAt)) > 1 ? 's' : ''} Rental
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
                            const end = addDays(start, btn.days);
                            setPickupAt(format(start, "yyyy-MM-dd'T'HH:mm"));
                            setReturnAt(format(end, "yyyy-MM-dd'T'HH:mm"));
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            isActive
                              ? 'bg-brand-blue text-white shadow-xs ring-2 ring-blue-300'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {btn.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Date Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Pick-up Date & Time
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.2 rounded-full">
                      Today Onwards Only
                    </span>
                  </div>
                  <input
                    type="datetime-local"
                    value={pickupAt}
                    min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      const d = new Date(val);
                      const todayStart = new Date();
                      todayStart.setHours(0, 0, 0, 0);
                      if (d < todayStart) {
                        setError('Previous dates cannot be selected. Pick-up is available today onwards only.');
                        return;
                      }
                      setError(null);
                      setPickupAt(val);
                      if (isAirportTransfer || (returnAt && new Date(returnAt) <= d)) {
                        setReturnAt(format(addDays(d, 1), "yyyy-MM-dd'T'HH:mm"));
                      }
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-blue focus:outline-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Return Date & Time
                    </label>
                    <span className="text-[10px] font-bold text-slate-500">
                      {isAirportTransfer ? '1-Day Chauffeur Trip' : 'Must be after pick-up'}
                    </span>
                  </div>
                  <input
                    type="datetime-local"
                    value={returnAt}
                    disabled={isAirportTransfer}
                    min={pickupAt || format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      const d = new Date(val);
                      if (pickupAt && d <= new Date(pickupAt)) {
                        setError('Return date and time must be after the pick-up schedule.');
                        return;
                      }
                      setError(null);
                      setReturnAt(val);
                    }}
                    className={`w-full border rounded-xl p-2.5 text-xs font-semibold focus:outline-none ${
                      isAirportTransfer
                        ? 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed'
                        : 'bg-white border-slate-300 focus:ring-2 focus:ring-brand-blue'
                    }`}
                  />
                </div>
              </div>

              {/* Interactive Calendar Visualizer */}
              <InteractiveCalendar
                events={calendarEvents}
                vehicles={vehicles}
                selectedVehicleId={selectedVehicleId}
                selectedPickup={new Date(pickupAt)}
                selectedReturn={new Date(returnAt)}
                singleDayMode={isAirportTransfer}
                onSelectRange={(p, r) => {
                  const todayStart = new Date();
                  todayStart.setHours(0, 0, 0, 0);
                  if (p < todayStart) {
                    setError('You cannot book previous dates. Pick-up is available today onwards only.');
                    return;
                  }
                  setError(null);
                  setPickupAt(format(p, "yyyy-MM-dd'T'HH:mm"));
                  const returnDate = isAirportTransfer ? addDays(p, 1) : r;
                  setReturnAt(format(returnDate, "yyyy-MM-dd'T'HH:mm"));
                }}
              />

              {/* Delivery or Office Pickup Selection */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4 text-xs">
                <span className="font-bold text-sm text-slate-800 block">Vehicle Handover Option</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="pickupMethod"
                      checked={pickupMethod === 'OFFICE'}
                      onChange={() => setPickupMethod('OFFICE')}
                    />
                    <span className="font-semibold text-slate-800">Office Pickup (Naga City) – Free</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="pickupMethod"
                      checked={pickupMethod === 'DELIVERY'}
                      onChange={() => setPickupMethod('DELIVERY')}
                    />
                    <span className="font-semibold text-slate-800">Doorstep Delivery / Airport Drop</span>
                  </label>
                </div>

                {pickupMethod === 'DELIVERY' && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Select Delivery Zone</label>
                      <select
                        value={deliveryZoneId}
                        onChange={(e) => setDeliveryZoneId(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-medium"
                      >
                        {additionalFees
                          .filter((f) => f.type === 'DELIVERY')
                          .map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} ({formatPeso(f.amount)})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Delivery Address / Hotel / Terminal</label>
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="e.g. Naga City Airport, Pili, or Hotel name..."
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Airport Flight Details & Meetup */}
              {isAirportTransfer && (
                <div className="bg-gradient-to-r from-blue-50/90 to-indigo-50/70 border-2 border-blue-200/90 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black text-brand-blue uppercase tracking-wider">
                    <Plane className="w-4 h-4 text-brand-blue" />
                    <span>Airport Meetup & Flight Tracking Details</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Airline & Flight Number (e.g. 5J 327 / PR 2923)
                      </label>
                      <input
                        type="text"
                        value={flightNumber}
                        onChange={(e) => setFlightNumber(e.target.value)}
                        placeholder="e.g. Cebu Pacific 5J 327"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-blue focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Terminal Meetup / Passenger Sign Name
                      </label>
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="e.g. BIA Arrival Exit Gate (Name on signboard)"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-blue focus:outline-none"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    💡 Our chauffeur monitors your flight arrival in real-time. Delayed flights are accommodated without extra fee.
                  </p>
                </div>
              )}

              {/* Instant Quote Preview */}
              {quote && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-extrabold text-emerald-900 block text-sm">
                      {quote.rentalDays} Day(s) / {quote.rentalHours} Hours ({quote.ratePlanLabel})
                    </span>
                    <span className="text-emerald-700">Estimated Total: {formatPeso(quote.totalAmount)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">Due Now (Reservation)</span>
                    <span className="text-base font-extrabold text-emerald-950">{formatPeso(quote.reservationFee)}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setStep(3)}
                  className="border border-slate-300 text-slate-700 font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  disabled={submitting}
                  onClick={handleProceedToCustomerInfo}
                  className="bg-brand-blue hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 shadow-md shadow-blue-500/20"
                >
                  Proceed to Customer Details <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: CUSTOMER INFORMATION */}
          {step === 5 && (
            <form onSubmit={handleSaveCustomerInfo} noValidate className="space-y-6">
              <div>
                <span className="text-xs font-extrabold text-brand-blue uppercase tracking-wider">Step 5 of 8</span>
                <h2 className="text-2xl font-black text-slate-900">Renter Information</h2>
                <p className="text-xs text-slate-500 mt-1">Please provide accurate contact details for booking verification.</p>
              </div>

              {/* Error Summary Banner */}
              {Object.keys(renterErrors).length > 0 && Object.values(renterErrors).some(Boolean) && (
                <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-red-800 text-xs font-bold flex items-center gap-3 shadow-xs animate-shake">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <div>
                    <span className="block font-black text-sm text-red-900">Please correct the required fields below</span>
                    <span className="font-medium text-red-700">All fields marked with an asterisk (*) and valid Philippine mobile number are required to proceed.</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Full Name (As shown on License / ID) *</span>
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
                    <span>Email Address *</span>
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

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Philippine Mobile Number *</span>
                    <span className="text-slate-400 text-[11px] font-normal normal-case">11 digits (09XXXXXXXXX)</span>
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
                  {renterErrors.phone ? (
                    <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1 font-bold">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {renterErrors.phone}
                    </p>
                  ) : (
                    <p className="text-slate-500 text-[11px] mt-1 font-medium">
                      Example: <strong className="text-brand-blue font-bold">09953827972</strong> (Used for booking SMS & confirmation updates)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Complete Address *</span>
                    {renterErrors.address && (
                      <span className="text-red-500 text-[11px] font-semibold lowercase tracking-normal">required</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => {
                      setCustomerAddress(e.target.value);
                      if (renterTouched.address) {
                        const errs = validateRenterInfo({ address: e.target.value });
                        setRenterErrors((prev) => ({ ...prev, address: errs.address }));
                      }
                    }}
                    onBlur={() => {
                      setRenterTouched((prev) => ({ ...prev, address: true }));
                      const errs = validateRenterInfo({ address: customerAddress });
                      setRenterErrors((prev) => ({ ...prev, address: errs.address }));
                    }}
                    placeholder="Street, Barangay, City, Province"
                    className={`w-full rounded-xl p-2.5 font-medium transition-all focus:outline-none ${
                      renterErrors.address
                        ? 'bg-red-50/50 border-2 border-red-500 focus:ring-2 focus:ring-red-400'
                        : 'bg-slate-50 border border-slate-300 focus:ring-2 focus:ring-brand-blue'
                    }`}
                  />
                  {renterErrors.address && (
                    <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1 font-bold">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {renterErrors.address}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Emergency Contact Person</span>
                    <span className="text-slate-400 text-[11px] font-normal normal-case">Optional</span>
                  </label>
                  <input
                    type="text"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder="Name of contact person"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-brand-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Emergency Contact Phone</span>
                    <span className="text-slate-400 text-[11px] font-normal normal-case">Optional</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={11}
                    value={emergencyPhone}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '').slice(0, 11);
                      setEmergencyPhone(cleaned);
                      if (renterTouched.emergencyPhone) {
                        const errs = validateRenterInfo({ emergencyPhone: cleaned });
                        setRenterErrors((prev) => ({ ...prev, emergencyPhone: errs.emergencyPhone }));
                      }
                    }}
                    onBlur={() => {
                      setRenterTouched((prev) => ({ ...prev, emergencyPhone: true }));
                      const errs = validateRenterInfo({ emergencyPhone: emergencyPhone });
                      setRenterErrors((prev) => ({ ...prev, emergencyPhone: errs.emergencyPhone }));
                    }}
                    placeholder="e.g. 09953827972"
                    className={`w-full rounded-xl p-2.5 font-medium transition-all focus:outline-none ${
                      renterErrors.emergencyPhone
                        ? 'bg-red-50/50 border-2 border-red-500 focus:ring-2 focus:ring-red-400'
                        : 'bg-slate-50 border border-slate-300 focus:ring-2 focus:ring-brand-blue'
                    }`}
                  />
                  {renterErrors.emergencyPhone && (
                    <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1 font-bold">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {renterErrors.emergencyPhone}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Purpose of Rental
                  </label>
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g. Vacation, Business Meeting, Wedding, Airport Transfer..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-brand-blue focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="border border-slate-300 text-slate-700 font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-brand-blue hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 shadow-md shadow-blue-500/20"
                >
                  {submitting ? 'Saving...' : 'Next: Upload Requirements'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 6: RENTAL REQUIREMENTS UPLOAD */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-extrabold text-brand-blue uppercase tracking-wider">Step 6 of 8</span>
                <h2 className="text-2xl font-black text-slate-900">Rental Requirements</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Upload your documents for verification. Documents are securely stored and reviewed by our administrators.
                </p>
              </div>

              {/* Official Tracking Number Banner */}
              {createdBooking?.reference && (
                <div className="bg-gradient-to-r from-brand-navy to-brand-navy-light text-white p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm border border-blue-900/40">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[11px] text-blue-200 uppercase font-semibold">Booking Reference / Tracking #</p>
                      <p className="text-lg font-black font-mono tracking-wider text-amber-300">{createdBooking.reference}</p>
                    </div>
                  </div>
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full font-bold self-start sm:self-auto">
                    Vehicle Reserved (15-Min Hold)
                  </span>
                </div>
              )}

              {/* No LTMS Portal? Helpful Friendly Notice */}
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50/40 to-slate-50 border border-blue-200/80 rounded-2xl p-4 text-xs flex items-start gap-3 shadow-2xs">
                <div className="p-2 bg-brand-blue/10 rounded-xl text-brand-blue shrink-0 mt-0.5">
                  <Info className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <p className="font-extrabold text-slate-900 text-sm">
                    No LTMS Portal or Digital License? No Problem!
                  </p>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Only your <strong className="text-slate-800">Physical Driver's License</strong>, <strong className="text-slate-800">Secondary Government ID</strong>, and <strong className="text-slate-800">Selfie Holding License</strong> are required. 
                    The <em>LTMS Portal QR Code</em> and <em>Digital License</em> are <span className="text-emerald-700 font-bold">100% Optional</span> and can be safely skipped if you only carry your physical card.
                  </p>
                </div>
              </div>

              {/* Requirement Slots */}
              <div className="space-y-4">
                {(!createdBooking?.requirements || createdBooking.requirements.length === 0) && (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <Loader2 className="w-8 h-8 text-brand-blue animate-spin mx-auto" />
                    <p className="text-sm font-bold text-slate-800">Loading Document Requirements...</p>
                    <p className="text-xs text-slate-500">Retrieving required document slots for this booking.</p>
                    {createdBooking?.reference && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await api.get<{ booking: any }>(`/bookings/track/${createdBooking.reference}`);
                            if (res.booking?.requirements?.length) setCreatedBooking(res.booking);
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-blue hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                      >
                        Refresh Requirements List
                      </button>
                    )}
                  </div>
                )}

                {createdBooking?.requirements?.map((req: BookingRequirement) => {
                  const hasUploaded = req.status === 'SUBMITTED' || req.status === 'APPROVED';
                  const isUploading = uploadProgress[req.id];
                  const options = req.requirementType?.options || [];

                  return (
                    <div
                      key={req.id}
                      className={`p-5 rounded-2xl border transition-all space-y-3 ${
                        req.isRequired
                          ? 'border-slate-200 bg-slate-50/50'
                          : 'border-slate-200/70 bg-white/90'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">{req.name}</h4>
                            {req.isRequired ? (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                REQUIRED
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                                OPTIONAL · CAN SKIP
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{req.requirementType?.description}</p>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {hasUploaded ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                              <CheckCircle className="w-3.5 h-3.5" /> Uploaded
                            </span>
                          ) : req.isRequired ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                              <Clock className="w-3.5 h-3.5" /> Pending Upload
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                              Optional · Can Skip
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Document on file indicator */}
                      {hasUploaded && req.documents && req.documents.length > 0 && (
                        <div className="flex items-center gap-2 p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-semibold truncate">Uploaded File: {req.documents[0].originalName}</span>
                          {req.documents[0].selectedOption && (
                            <span className="ml-auto text-[10px] bg-emerald-200/80 text-emerald-950 px-2 py-0.5 rounded font-bold">
                              {req.documents[0].selectedOption}
                            </span>
                          )}
                        </div>
                      )}

                      {/* AI Legitimacy Detection Result */}
                      {aiVerifications[req.id] && (
                        <div
                          className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                            aiVerifications[req.id].verdict === 'LEGIT'
                              ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                              : 'bg-amber-50/90 border-amber-300 text-amber-950'
                          }`}
                        >
                          <Sparkles
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              aiVerifications[req.id].verdict === 'LEGIT'
                                ? 'text-emerald-600'
                                : 'text-amber-600'
                            }`}
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-1">
                              <span className="font-extrabold flex items-center gap-1.5">
                                {aiVerifications[req.id].verdict === 'LEGIT' ? (
                                  <span className="text-emerald-700">✓ AI Verified Legitimate</span>
                                ) : (
                                  <span className="text-amber-700">⚠ AI Flagged for Review</span>
                                )}
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/80 border border-slate-200">
                                  {aiVerifications[req.id].confidence}% Match
                                </span>
                              </span>
                              <span className="text-[10px] font-mono font-semibold text-slate-500">
                                {aiVerifications[req.id].engine === 'GEMINI_VISION'
                                  ? 'Gemini 2.0 Flash'
                                  : 'AI Verification Engine'}
                              </span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-slate-700">
                              {aiVerifications[req.id].analysisSummary}
                            </p>
                            {aiVerifications[req.id].extractedNumber && (
                              <p className="text-[10px] font-mono text-slate-600">
                                Document ID: <strong className="text-slate-900">{aiVerifications[req.id].extractedNumber}</strong>
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Dropdown if secondary ID */}
                      {options.length > 0 && !hasUploaded && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Choose Secondary ID Type:
                          </label>
                          <select
                            value={secondaryIdOption}
                            onChange={(e) => setSecondaryIdOption(e.target.value)}
                            className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium"
                          >
                            {options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Upload & Camera Controls with Automatic Immediate Upload */}
                      {requirementFiles[req.id] || hasUploaded ? (
                        <div className="bg-white p-3.5 rounded-xl border border-blue-200 flex flex-col sm:flex-row items-center gap-4">
                          {requirementPreviews[req.id] ? (
                            <img
                              src={requirementPreviews[req.id]}
                              alt="Captured document"
                              className="w-28 h-20 object-cover rounded-lg border border-slate-200 shadow-sm shrink-0"
                            />
                          ) : (
                            <div className="w-28 h-20 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                              <ImageIcon className="w-8 h-8" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 text-left w-full sm:w-auto space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 truncate">
                              {isUploading ? (
                                <>
                                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                                  <span className="text-blue-700">Uploading & Verifying Document...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span className="text-emerald-800 font-extrabold truncate">
                                    {requirementFiles[req.id]?.name || 'Document Saved & Verified on File'}
                                  </span>
                                </>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {isUploading
                                ? 'Sending to secure server and running authenticity scan...'
                                : '✓ Successfully uploaded and attached to your reservation.'}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <label className="cursor-pointer border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
                                <Camera className="w-3.5 h-3.5 text-slate-500" />
                                <span>Replace / Re-take</span>
                                <input
                                  type="file"
                                  accept="image/*,application/pdf"
                                  capture={req.name.toLowerCase().includes('selfie') ? 'user' : 'environment'}
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) handleSelectRequirementFile(req.id, e.target.files[0]);
                                  }}
                                  className="hidden"
                                />
                              </label>

                              {requirementFiles[req.id] && (
                                <button
                                  type="button"
                                  onClick={() => saveFileToGallery(requirementFiles[req.id], `${req.name.replace(/\s+/g, '-')}.jpg`)}
                                  className="border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                                  title="Save copy of this photo to your phone gallery / photos"
                                >
                                  <Download className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Save to Phone Gallery</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2.5">
                            {/* Tap to Picture / Camera */}
                            <label className="cursor-pointer inline-flex items-center gap-1.5 bg-gradient-to-r from-brand-blue to-blue-600 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-95">
                              <Camera className="w-4 h-4 text-blue-200" />
                              <span>Take Picture with Camera</span>
                              <input
                                type="file"
                                accept="image/*"
                                capture={req.name.toLowerCase().includes('selfie') ? 'user' : 'environment'}
                                onChange={(e) => {
                                  if (e.target.files?.[0]) handleSelectRequirementFile(req.id, e.target.files[0]);
                                }}
                                className="hidden"
                              />
                            </label>

                            {/* Upload Image / File */}
                            <label className="cursor-pointer inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-300 shadow-sm transition-all hover:scale-[1.02] active:scale-95">
                              <ImageIcon className="w-4 h-4 text-slate-500" />
                              <span>Upload from Gallery / Files</span>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) handleSelectRequirementFile(req.id, e.target.files[0]);
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Documents are automatically saved and verified upon capture. You can also update documents anytime from the <strong>Track Booking</strong> page using your Tracking Number.
                </span>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setStep(5)}
                  className="border border-slate-300 text-slate-700 font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={handleProceedToSummary}
                  className="bg-brand-blue hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 shadow-md shadow-blue-500/20"
                >
                  Next: Booking Summary <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 7: BOOKING SUMMARY */}
          {step === 7 && quote && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-extrabold text-brand-blue uppercase tracking-wider">Step 7 of 8</span>
                <h2 className="text-2xl font-black text-slate-900">Review Booking Summary</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Verify your trip details, vehicle charges, and terms before proceeding to payment.
                </p>
              </div>

              {/* Summary Cards */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[10px]">Vehicle Selected</span>
                    <span className="text-base font-extrabold text-slate-900">{selectedVehicle?.name}</span>
                    <span className="text-slate-500 block">
                      {selectedRentalType === 'SELF_DRIVE' ? 'Self Drive' : 'With Driver'} · {selectedVehicle?.seats} Seats
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[10px]">Destination & Service</span>
                    <span className="text-base font-extrabold text-slate-900">{selectedDestination?.name}</span>
                    <span className="text-slate-500 block">
                      Handover: {pickupMethod === 'DELIVERY' ? `Delivery (${deliveryAddress || 'Selected Zone'})` : 'Office Pick-up'}
                    </span>
                    {flightNumber && (
                      <span className="text-[11px] font-bold text-brand-blue block mt-0.5">
                        ✈️ Flight Tracked: {flightNumber}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[10px]">Pick-up Schedule</span>
                    <span className="font-bold text-slate-900">{formatDate(pickupAt)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[10px]">Return Schedule</span>
                    <span className="font-bold text-slate-900">{formatDate(returnAt)}</span>
                  </div>
                </div>

                {/* Uploaded Requirements Confirmation in Summary */}
                {createdBooking?.requirements && createdBooking.requirements.length > 0 && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200/90 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        Driver Requirements Verification
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Saved in Database
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {createdBooking.requirements.map((r: any) => {
                        const isSaved =
                          r.status === 'SUBMITTED' ||
                          r.status === 'APPROVED' ||
                          (r.documents && r.documents.length > 0);
                        return (
                          <div key={r.id} className="flex items-center gap-1.5 truncate">
                            {isSaved ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-1 truncate">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="truncate">{r.name}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 flex items-center gap-1 truncate">
                                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span className="truncate">{r.name} (Upload anytime)</span>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Financial Breakdown Table */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">Rental Fee ({quote.rentalFeeLabel}):</span>
                    <span className="font-bold text-slate-900">{formatPeso(quote.rentalFee)}</span>
                  </div>
                  {quote.fees.map((fee, idx) => (
                    <div key={idx} className="flex justify-between py-1">
                      <span className="text-slate-600">{fee.name}:</span>
                      <span className="font-bold text-slate-900">{formatPeso(fee.amount)}</span>
                    </div>
                  ))}
                  {quote.discount > 0 && (
                    <div className="flex justify-between py-1 text-emerald-700">
                      <span>Promo Discount ({quote.promotion?.name || 'Discount'}):</span>
                      <span className="font-bold">- {formatPeso(quote.discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between py-2 border-t border-slate-300 font-extrabold text-sm text-slate-900">
                    <span>Total Rental Amount:</span>
                    <span>{formatPeso(quote.totalAmount)}</span>
                  </div>

                  <div className="flex justify-between py-2 bg-blue-100/70 p-3 rounded-xl border border-blue-200 font-bold text-brand-navy">
                    <span>Reservation Fee (Due Now to Block Schedule):</span>
                    <span className="text-base">{formatPeso(quote.reservationFee)}</span>
                  </div>

                  <div className="flex justify-between py-1 text-[11px] text-slate-500">
                    <span>Remaining Balance (Due Upon Vehicle Pick-up):</span>
                    <span className="font-bold text-slate-800">{formatPeso(quote.balanceDue)}</span>
                  </div>
                </div>
              </div>

              {/* Policies Acknowledgement & Cleanliness Notice */}
              <div className="bg-slate-50 border border-slate-200/90 p-4 rounded-xl text-xs space-y-3 text-slate-700">
                <span className="font-extrabold text-slate-900 block text-sm">
                  Important Rental Notices & Policies:
                </span>
                <div className="space-y-1.5 leading-relaxed">
                  <p>• <strong>{formatPeso(quote?.reservationFee || 1000)} Reservation Fee / Security Deposit:</strong> Paid now to lock your vehicle schedule immediately. This amount serves as your <strong>Refundable Security Deposit</strong>, which is 100% refunded to you after return inspection in clean condition with matched fuel levels.</p>
                  <p>• <strong>Full Rental Balance ({formatPeso(quote?.totalAmount || 2500)}):</strong> Paid upon vehicle pick-up at our Naga City office (or handover upon delivery).</p>
                  <p>• <strong>Security Deposit Refund:</strong> Your {formatPeso(quote?.reservationFee || 1000)} deposit is refunded immediately upon vehicle return.</p>
                </div>

                {/* Carwash & Cleanliness Highlight */}
                <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl space-y-1.5 text-slate-700">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                    <Sparkles className="w-4 h-4 text-brand-blue" />
                    <span>Vehicle Cleanliness & Carwash Return Policy</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Units are handed over thoroughly cleaned. <strong>If you return the vehicle washed and clean, NO carwash fee is charged</strong> and your security deposit is refunded 100% in full.
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    If the vehicle is returned unwashed and requires post-rental cleaning, the standard carwash charge will be deducted directly from your security deposit:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
                    <span className="bg-white border border-slate-200 px-2 py-0.5 rounded font-bold text-slate-800">
                      🚗 Sedan: ₱300
                    </span>
                    <span className="bg-white border border-slate-200 px-2 py-0.5 rounded font-bold text-slate-800">
                      🚙 MPV / SUV: ₱400
                    </span>
                    <span className="bg-white border border-slate-200 px-2 py-0.5 rounded font-bold text-slate-800">
                      🚐 Van: ₱400
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setStep(6)}
                  className="border border-slate-300 text-slate-700 font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  disabled={submitting}
                  onClick={handleSubmitBooking}
                  className="bg-brand-blue hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 shadow-md shadow-blue-500/20"
                >
                  {submitting ? 'Confirming...' : 'Confirm & Proceed to Payment'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 8: PAYMENT */}
          {step === 8 && (
            <form onSubmit={handleUploadPayment} className="space-y-6">
              <div>
                <span className="text-xs font-extrabold text-brand-blue uppercase tracking-wider">Step 8 of 8</span>
                <h2 className="text-2xl font-black text-slate-900">Pay Reservation Fee</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Send the <strong>{formatPeso(quote?.reservationFee || 1000)} reservation fee</strong> using any of our verified payment channels below.
                </p>
              </div>

              {/* Payment Method Tabs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {paymentMethods.map((m) => {
                  const isSelected = selectedPaymentMethodId === m.id;
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setSelectedPaymentMethodId(m.id)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-brand-blue bg-blue-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <h4 className="font-extrabold text-sm text-slate-900">{m.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{m.accountName}</p>
                    </button>
                  );
                })}
              </div>

              {/* Selected Method Details */}
              {(() => {
                const method = paymentMethods.find((m) => m.id === selectedPaymentMethodId);
                if (!method) return null;
                return (
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-slate-400 uppercase font-bold text-[10px]">Payment Account</span>
                        <h4 className="font-extrabold text-base text-slate-900">{method.name}</h4>
                        <p className="text-slate-600 mt-1">
                          Account Name: <strong>{method.accountName}</strong>
                        </p>
                        <p className="text-slate-600">
                          Account Number: <strong className="text-brand-navy text-sm font-mono">{method.accountNumber}</strong>
                        </p>
                      </div>
                      <span className="bg-brand-navy text-white font-extrabold text-xs px-3 py-1.5 rounded-lg">
                        AMOUNT: {formatPeso(quote?.reservationFee || 1000)}
                      </span>
                    </div>

                    <p className="text-slate-500 text-[11px] bg-white p-3 rounded-xl border border-slate-200">
                      {method.instructions}
                    </p>

                    {method.qrImageUrl && (
                      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                        <img
                          src={method.qrImageUrl}
                          alt={`${method.name} QR Code`}
                          className="w-48 h-auto max-h-64 object-contain rounded-lg border border-slate-200 shadow-sm bg-white"
                        />
                        <div className="space-y-1.5 text-center sm:text-left">
                          <span className="inline-block bg-blue-100 text-brand-blue text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Scan to Pay (InstaPay QR)
                          </span>
                          <p className="font-bold text-slate-800 text-xs">
                            Scan this QR code using your {method.code === 'GCASH' ? 'GCash app' : 'BDO / banking app'}
                          </p>
                          <p className="text-slate-500 text-[11px] leading-relaxed">
                            Open your app, choose &quot;Scan QR&quot;, and scan the code. Transfer <strong>{formatPeso(quote?.reservationFee || 1000)}</strong>, then upload the receipt below.
                          </p>
                          <a
                            href={method.qrImageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-brand-blue font-bold hover:underline pt-1"
                          >
                            Open QR in full size ↗
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Upload Proof Fields */}
              <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 text-xs">
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
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Payment Receipt Proof ({formatPeso(quote?.reservationFee || 1000)} Reservation Fee) *
                  </label>
                  {paymentReceiptFile ? (
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-blue-200 flex flex-col sm:flex-row items-center gap-4">
                      {paymentReceiptPreview ? (
                        <img
                          src={paymentReceiptPreview}
                          alt="Receipt Preview"
                          className="w-28 h-20 object-cover rounded-lg border border-slate-200 shadow-sm shrink-0"
                        />
                      ) : (
                        <div className="w-28 h-20 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 text-left w-full sm:w-auto">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 truncate">
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate">{paymentReceiptFile.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {(paymentReceiptFile.size / 1024).toFixed(1)} KB • Receipt captured & attached
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentReceiptFile(null);
                              setPaymentReceiptPreview(null);
                            }}
                            className="text-xs font-medium text-rose-600 hover:text-rose-700 border border-rose-200 bg-white px-2.5 py-1 rounded-lg"
                          >
                            Retake / Change Receipt
                          </button>
                          <button
                            type="button"
                            onClick={() => saveFileToGallery(paymentReceiptFile, 'Custoworks-Payment-Receipt.jpg')}
                            className="text-xs font-bold text-blue-700 hover:text-blue-800 border border-blue-200 bg-blue-50 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors shadow-2xs"
                            title="Save captured receipt directly to your phone gallery"
                          >
                            <Download className="w-3.5 h-3.5 text-blue-600" />
                            <span>Save Receipt to Phone Gallery</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <label className="cursor-pointer inline-flex items-center gap-1.5 bg-gradient-to-r from-brand-blue to-blue-600 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm transition-all">
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
                        <label className="cursor-pointer inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-300 shadow-sm transition-all">
                          <ImageIcon className="w-4 h-4 text-slate-500" />
                          <span>Upload Receipt from Gallery</span>
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
                      <p className="text-[11px] text-slate-400">
                        Accepted formats: JPG, PNG, PDF. Maximum file size: 5MB.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(7)}
                  className="border border-slate-300 text-slate-700 font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  {submitting ? 'Submitting Receipt...' : 'Submit Payment for Verification'} <Check className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 9: SUCCESS & TRACKING SCREEN */}
          {step === 9 && (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Reservation Successfully Submitted!</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-lg mx-auto">
                  Thank you! Your {formatPeso(quote?.reservationFee || 1000)} reservation fee receipt and rental requirements have been received. No customer login or account needed!
                </p>
              </div>

              {/* Official Confirmation Card with 1-Click Screenshot, Senior Guide & Direct Dispatch Chat */}
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
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-w-xl mx-auto text-left text-xs space-y-3">
                <h4 className="font-extrabold text-slate-900 text-sm">What Happens Next?</h4>
                <ol className="space-y-2 list-decimal list-inside text-slate-600">
                  <li>Our Naga City dispatch team verifies your {formatPeso(quote?.reservationFee || 1000)} reservation fee receipt.</li>
                  <li>Our team reviews your uploaded driver license & LTMS portal requirements.</li>
                  <li>Once approved, your reservation status will automatically change to <strong>Confirmed & Accepted</strong>.</li>
                  <li>Pay the remaining rental balance upon vehicle pickup at our office beside SM City Naga.</li>
                </ol>
              </div>

              {/* Navigation Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2 max-w-xl mx-auto">
                <button
                  onClick={() => navigate(`/track?ref=${createdBooking?.reference}`)}
                  className="bg-brand-blue hover:bg-blue-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <Search className="w-4 h-4" /> Track Status & Approvals Now
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="border border-slate-300 text-slate-700 font-bold text-sm px-5 py-3.5 rounded-xl hover:bg-slate-50 transition-all"
                >
                  Return to Home
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

