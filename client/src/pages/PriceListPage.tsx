import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Vehicle, Destination, VehicleCategory, RentalType, RateDuration } from '../types';
import { formatPeso } from '../lib/utils';
import {
  Car,
  Calculator,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Filter,
  Users,
  Gauge,
  Fuel,
  Info,
  ArrowRight,
  ChevronRight,
  HelpCircle,
  PhoneCall,
  MapPin,
  Check,
  Calendar,
  AlertTriangle,
  FileCheck2,
  Zap,
  Plane,
} from 'lucide-react';

interface PricelistResponse {
  destinations: Destination[];
  vehicles: Vehicle[];
  rates: Array<{
    id: string;
    vehicleId: string;
    destinationId: string;
    rentalType: RentalType;
    duration: RateDuration;
    amount: number | null;
    pricingUnit: string;
    notes?: string | null;
    destination?: Destination;
  }>;
  additionalFees: Array<{
    id: string;
    code: string;
    name: string;
    description?: string | null;
    type: string;
    amount: string | number;
    vehicleCategory?: string | null;
  }>;
  policies: {
    reservationFee: number;
    reservationFeeNote: string;
    cleanlinessPolicy: string;
    overtimePerHour: Record<string, number>;
    fuelPolicy: string;
    driverTerms: string;
  };
}

export const PriceListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PricelistResponse | null>(null);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedRentalType, setSelectedRentalType] = useState<string>('ALL');
  const [selectedDuration, setSelectedDuration] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');

  // Standard Calculator State
  const [calcVehicleId, setCalcVehicleId] = useState<string>('');
  const [calcDestinationId, setCalcDestinationId] = useState<string>('');
  const [calcRentalType, setCalcRentalType] = useState<RentalType>('SELF_DRIVE');
  const [calcDurationType, setCalcDurationType] = useState<'12H' | 'DAYS'>('DAYS');
  const [calcDays, setCalcDays] = useState<number>(1);
  const [calcDeliveryFeeId, setCalcDeliveryFeeId] = useState<string>('OFFICE');

  // Calculator Mode: STANDARD vs AIRPORT_KM
  const [calculatorMode, setCalculatorMode] = useState<'STANDARD' | 'AIRPORT_KM'>(() => {
    return searchParams.get('mode') === 'airport' ? 'AIRPORT_KM' : 'STANDARD';
  });

  // Airport & Chauffeur Transfer Calculator State
  const [transferRouteKey, setTransferRouteKey] = useState<string>('BIA_AIRPORT');
  const [transferCustomKm, setTransferCustomKm] = useState<number>(95);
  const [transferTripType, setTransferTripType] = useState<'ROUNDTRIP' | 'ONEWAY'>('ROUNDTRIP');

  // Compute Airport & Transfer Matrix
  const transferMatrix = useMemo(() => {
    const isCustom = transferRouteKey === 'CUSTOM_KM';
    const km = isCustom
      ? transferCustomKm
      : transferRouteKey === 'BIA_AIRPORT'
      ? 95
      : transferRouteKey === 'NAGA_AIRPORT'
      ? 15
      : transferRouteKey === 'LEGAZPI'
      ? 85
      : transferRouteKey === 'DAET'
      ? 140
      : transferRouteKey === 'SORSOGON'
      ? 180
      : 420; // MANILA

    const routeInfo = {
      BIA_AIRPORT: {
        id: 'BIA_AIRPORT',
        name: 'Bicol International Airport (BIA / Daraga, Albay)',
        oneWayKm: 95,
        roundtripKm: 190,
        estDriveTime: '~2 Hours 15 Mins',
        desc: 'Official Naga City ⇆ Bicol International Airport (BIA) Chauffeur Transfer (Pickup & Drop / Arrival Meetup)',
        badge: '✈️ Most Popular Airport Route',
      },
      NAGA_AIRPORT: {
        id: 'NAGA_AIRPORT',
        name: 'Naga Airport (WNP / Pili, Camarines Sur)',
        oneWayKm: 15,
        roundtripKm: 30,
        estDriveTime: '~25 Mins',
        desc: 'Local Naga / Pili Airport terminal pickup, drop-off & flight arrival shuttle',
        badge: '🛬 Local Airport',
      },
      LEGAZPI: {
        id: 'LEGAZPI',
        name: 'Legazpi City / Mayon Sightseeing (Albay)',
        oneWayKm: 85,
        roundtripKm: 170,
        estDriveTime: '~2 Hours',
        desc: 'Direct travel to Cagsawa Ruins, Embarcadero de Legazpi, and Albay attractions',
        badge: '🌋 Scenic Tour',
      },
      DAET: {
        id: 'DAET',
        name: 'Daet / Bagasbas Beach (Camarines Norte)',
        oneWayKm: 140,
        roundtripKm: 280,
        estDriveTime: '~3 Hours',
        desc: 'Provincial travel to Daet commercial center, Bagasbas surfing, and Calaguas jump-off',
        badge: '🏖️ Coastal Route',
      },
      SORSOGON: {
        id: 'SORSOGON',
        name: 'Sorsogon City / Matnog Port Jump-off',
        oneWayKm: 180,
        roundtripKm: 360,
        estDriveTime: '~4 Hours',
        desc: 'Southern Bicol transfers, Irosin hot springs, or Matnog Samar/Leyte RORO ferry port',
        badge: '🌊 South Bicol',
      },
      MANILA: {
        id: 'MANILA',
        name: 'Metro Manila / NAIA Terminals 1-4 (NCR)',
        oneWayKm: 420,
        roundtripKm: 840,
        estDriveTime: '~8-10 Hours',
        desc: 'Private inter-provincial door-to-door charter from Naga City directly to Metro Manila / NAIA',
        badge: '🏙️ Direct Capital Express',
      },
      CUSTOM_KM: {
        id: 'CUSTOM_KM',
        name: `Custom Distance Route (${km} km from Naga City)`,
        oneWayKm: km,
        roundtripKm: km * 2,
        estDriveTime: `~${Math.round((km / 45) * 10) / 10} Hours`,
        desc: `Distance-based matrix calculation calibrated for ${km} km radius around Naga City`,
        badge: '📏 Matrix by KM',
      },
    }[transferRouteKey as 'BIA_AIRPORT' | 'NAGA_AIRPORT' | 'LEGAZPI' | 'DAET' | 'SORSOGON' | 'MANILA' | 'CUSTOM_KM'] || {
      id: 'CUSTOM_KM',
      name: 'Custom Distance Route',
      oneWayKm: km,
      roundtripKm: km * 2,
      estDriveTime: `~${Math.round((km / 45) * 10) / 10} Hours`,
      desc: 'Distance-based matrix calculation',
      badge: '📏 By KM',
    };

    let vanRoundtrip = 7500;
    let innovaRoundtrip = 6000;
    let sedanRoundtrip = 4500;

    if (transferRouteKey === 'BIA_AIRPORT') {
      vanRoundtrip = 7500;
      innovaRoundtrip = 6000;
      sedanRoundtrip = 4500;
    } else if (transferRouteKey === 'NAGA_AIRPORT') {
      vanRoundtrip = 3500;
      innovaRoundtrip = 2500;
      sedanRoundtrip = 1800;
    } else if (transferRouteKey === 'LEGAZPI') {
      vanRoundtrip = 7000;
      innovaRoundtrip = 5300;
      sedanRoundtrip = 4300;
    } else if (transferRouteKey === 'DAET') {
      vanRoundtrip = 7000;
      innovaRoundtrip = 5300;
      sedanRoundtrip = 4300;
    } else if (transferRouteKey === 'SORSOGON') {
      vanRoundtrip = 8500;
      innovaRoundtrip = 6300;
      sedanRoundtrip = 4800;
    } else if (transferRouteKey === 'MANILA') {
      vanRoundtrip = 9500;
      innovaRoundtrip = 8800;
      sedanRoundtrip = 6800;
    } else {
      // CUSTOM_KM calculation
      if (km <= 15) {
        vanRoundtrip = 3500;
        innovaRoundtrip = 2500;
        sedanRoundtrip = 1800;
      } else {
        const extraKm = km - 15;
        vanRoundtrip = Math.round((3500 + extraKm * 50.0) / 50) * 50;
        innovaRoundtrip = Math.round((2500 + extraKm * 43.75) / 50) * 50;
        sedanRoundtrip = Math.round((1800 + extraKm * 33.75) / 50) * 50;
      }
    }

    const isRoundtrip = transferTripType === 'ROUNDTRIP';
    const vanFinal = isRoundtrip ? vanRoundtrip : Math.round((vanRoundtrip * 0.7) / 100) * 100;
    const innovaFinal = isRoundtrip ? innovaRoundtrip : Math.round((innovaRoundtrip * 0.7) / 100) * 100;
    const sedanFinal = isRoundtrip ? sedanRoundtrip : Math.round((sedanRoundtrip * 0.7) / 100) * 100;

    return {
      routeInfo,
      km,
      isRoundtrip,
      rates: {
        van: vanFinal,
        innova: innovaFinal,
        sedan: sedanFinal,
      },
      rawRoundtrip: {
        van: vanRoundtrip,
        innova: innovaRoundtrip,
        sedan: sedanRoundtrip,
      },
    };
  }, [transferRouteKey, transferCustomKm, transferTripType]);

  useEffect(() => {
    const fetchPricelist = async () => {
      try {
        const res = await api.get<PricelistResponse>('/pricing/pricelist');
        setData(res);

        if (res.vehicles.length > 0) {
          const preVehicle = searchParams.get('vehicleId') || res.vehicles[0].id;
          setCalcVehicleId(preVehicle);
        }
        if (res.destinations.length > 0) {
          const preDest = searchParams.get('destinationId') || res.destinations[0].id;
          setCalcDestinationId(preDest);
        }
      } catch (err) {
        console.error('Failed to load pricelist:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPricelist();
  }, [searchParams]);

  // Selected vehicle for calculator
  const calcSelectedVehicle = useMemo(() => {
    return data?.vehicles.find((v) => v.id === calcVehicleId) || data?.vehicles[0] || null;
  }, [data, calcVehicleId]);

  // Sync rental type if vehicle doesn't allow self drive
  useEffect(() => {
    if (calcSelectedVehicle) {
      if (!calcSelectedVehicle.allowSelfDrive && calcRentalType === 'SELF_DRIVE') {
        setCalcRentalType('WITH_DRIVER');
      }
    }
  }, [calcSelectedVehicle]);

  // Auto-switch to valid destination if current destination is not offered for vehicle
  useEffect(() => {
    if (data && calcSelectedVehicle && calcDestinationId) {
      const hasRate = data.rates.some(
        (r) =>
          r.vehicleId === calcSelectedVehicle.id &&
          r.destinationId === calcDestinationId &&
          r.rentalType === calcRentalType &&
          r.amount !== null
      );
      if (!hasRate) {
        const firstValid = data.destinations.find((d) =>
          data.rates.some(
            (r) =>
              r.vehicleId === calcSelectedVehicle.id &&
              r.destinationId === d.id &&
              r.rentalType === calcRentalType &&
              r.amount !== null
          )
        );
        if (firstValid) {
          setCalcDestinationId(firstValid.id);
        }
      }
    }
  }, [calcSelectedVehicle, calcRentalType, data]);

  // Calculate live estimate
  const liveCalculation = useMemo(() => {
    if (!data || !calcSelectedVehicle || !calcDestinationId) return null;

    const applicableRates = data.rates.filter(
      (r) =>
        r.vehicleId === calcSelectedVehicle.id &&
        r.destinationId === calcDestinationId &&
        r.rentalType === calcRentalType &&
        r.amount !== null
    );

    let planLabel = 'Daily 24-Hour Rate';
    let dailyRate = 0;
    let totalBaseRate = 0;
    let discountNote = '';
    let isAvailable = true;
    let unavailabilityReason = '';

    if (calcDurationType === '12H') {
      const rate12 = applicableRates.find((r) => r.duration === 'HOURS_12');
      if (rate12 && rate12.amount) {
        dailyRate = Number(rate12.amount);
        totalBaseRate = dailyRate;
        planLabel = '12 Hours Flat Rate';
      } else {
        const rate24 = applicableRates.find((r) => r.duration === 'HOURS_24');
        if (rate24 && rate24.amount) {
          isAvailable = false;
          unavailabilityReason = '12-Hour rental is not offered for this destination in the official pricing matrix. Please choose 24-Hour Daily.';
        } else {
          isAvailable = false;
          unavailabilityReason = 'This destination is not offered for this vehicle in the pricing matrix.';
        }
      }
    } else {
      // Days-based
      const rate24 = applicableRates.find((r) => r.duration === 'HOURS_24');
      const rateWeekly = applicableRates.find((r) => r.duration === 'WEEKLY');
      const rateMonthly = applicableRates.find((r) => r.duration === 'MONTHLY');

      if (!rate24 || !rate24.amount) {
        isAvailable = false;
        unavailabilityReason = 'This destination is not offered for this vehicle in the pricing matrix (e.g. Baguio is only available with Nissan NV350 Van).';
      } else {
        const r24Amt = Number(rate24.amount);
        const rWeeklyAmt = rateWeekly?.amount ? Number(rateWeekly.amount) : r24Amt * 0.9;
        const rMonthlyAmt = rateMonthly?.amount ? Number(rateMonthly.amount) : r24Amt * 0.75;

        if (calcDays >= 30 && rateMonthly) {
          if (rateMonthly.pricingUnit === 'FLAT') {
            dailyRate = Math.round(rMonthlyAmt / 30);
            totalBaseRate = Math.round(rMonthlyAmt * (calcDays / 30));
            planLabel = `Monthly Unlimited Mileage Plan (${calcDays} Days)`;
            discountNote = 'Flat Monthly Unlimited Mileage Package Applied!';
          } else {
            dailyRate = rMonthlyAmt;
            totalBaseRate = dailyRate * calcDays;
            planLabel = 'Monthly Long-Term Plan (30+ Days)';
            discountNote = 'Discounted Monthly Daily Rate Applied!';
          }
        } else if (calcDays >= 7 && rateWeekly) {
          dailyRate = rWeeklyAmt;
          totalBaseRate = dailyRate * calcDays;
          planLabel = 'Weekly Saver Plan (7+ Days)';
          discountNote = 'Weekly Discount Applied!';
        } else {
          dailyRate = r24Amt;
          totalBaseRate = dailyRate * calcDays;
          planLabel = `${calcDays} Day(s) Standard 24h Rate`;
        }
      }
    }

    // Delivery fee
    let deliveryFee = 0;
    let deliveryLabel = 'Office Pickup (CBD II Triangulo) - FREE';
    if (calcDeliveryFeeId !== 'OFFICE') {
      const feeObj = data.additionalFees.find((f) => f.id === calcDeliveryFeeId);
      if (feeObj) {
        deliveryFee = Number(feeObj.amount);
        deliveryLabel = feeObj.name;
      }
    }

    const reservationFee = data.policies?.reservationFee || 1000;
    const grandTotal = totalBaseRate + deliveryFee;
    // Full rental amount payable upon pickup; reservation fee is held as refundable security deposit
    const balanceDue = grandTotal;

    return {
      isAvailable,
      unavailabilityReason,
      dailyRate,
      totalBaseRate,
      planLabel,
      discountNote,
      deliveryFee,
      deliveryLabel,
      reservationFee,
      grandTotal,
      balanceDue,
    };
  }, [data, calcSelectedVehicle, calcDestinationId, calcRentalType, calcDurationType, calcDays, calcDeliveryFeeId]);

  // Filtered vehicles for display
  const displayedVehicles = useMemo(() => {
    if (!data) return [];
    return data.vehicles.filter((v) => {
      if (selectedCategory !== 'ALL' && v.category !== selectedCategory) return false;
      if (selectedRentalType === 'SELF_DRIVE' && !v.allowSelfDrive) return false;
      if (selectedRentalType === 'WITH_DRIVER' && !v.allowWithDriver) return false;
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const matchesName = v.name.toLowerCase().includes(q);
        const matchesModel = v.model.toLowerCase().includes(q);
        const matchesMake = v.make.toLowerCase().includes(q);
        if (!matchesName && !matchesModel && !matchesMake) return false;
      }
      return true;
    });
  }, [data, selectedCategory, selectedRentalType, searchKeyword]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-blue mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading official Custoworks rate cards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* 1. Header Banner */}
      <section className="bg-gradient-to-b from-brand-navy via-brand-navy to-brand-navy-dark text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-brand-navy-light/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                Transparent Pricing Guarantee
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                Official Car Rental Rates & Pricelist
              </h1>
              <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
                Clear, all-inclusive rental rates for Naga City, Camarines Sur, Albay, Sorsogon, Manila, and North Luzon. 
                Fixed destination rate tiers, no hidden add-ons.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#calculator"
                className="inline-flex items-center gap-2 bg-brand-blue hover:bg-blue-600 text-white px-5 py-3 rounded-xl font-bold text-xs shadow-lg shadow-blue-500/20 transition-all"
              >
                <Calculator className="w-4 h-4" />
                Instant Rate Estimator
              </a>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-3 rounded-xl font-bold text-xs backdrop-blur-sm transition-all"
              >
                <Printer className="w-4 h-4 text-blue-300" />
                Print Rate Sheet
              </button>
            </div>
          </div>

          {/* Quick Stat Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 pt-8 border-t border-white/10 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold shrink-0">
                12h
              </div>
              <div>
                <p className="text-white font-bold">12-Hour Tier</p>
                <p className="text-slate-400 text-[11px]">Starts from ₱1,200</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold shrink-0">
                24h
              </div>
              <div>
                <p className="text-white font-bold">24-Hour Whole Day</p>
                <p className="text-slate-400 text-[11px]">Sedans from ₱1,800</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                %
              </div>
              <div>
                <p className="text-white font-bold">Weekly Discount</p>
                <p className="text-slate-400 text-[11px]">7+ Days automatic savings</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold shrink-0">
                🛡️
              </div>
              <div>
                <p className="text-white font-bold">Refundable Deposit</p>
                <p className="text-slate-400 text-[11px]">₱1,000 Reservation Hold</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Live Rate Estimator Widget */}
      <section id="calculator" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-brand-blue flex items-center justify-center text-white">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Interactive Rate & Trip Cost Calculator</h2>
                <p className="text-[11px] text-slate-400">Calculate exact rental and airport transfer costs</p>
              </div>
            </div>
            <span className="text-[11px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full font-semibold">
              Live Real-Time Pricing
            </span>
          </div>

          {/* Calculator Mode Switcher Tabs */}
          <div className="bg-slate-100 p-2 border-b border-slate-200 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCalculatorMode('STANDARD')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
                calculatorMode === 'STANDARD'
                  ? 'bg-brand-blue text-white shadow-md'
                  : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Calendar className="w-4 h-4 text-amber-300" />
              <span>Standard Daily / Multi-Day Rental</span>
            </button>
            <button
              type="button"
              onClick={() => setCalculatorMode('AIRPORT_KM')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
                calculatorMode === 'AIRPORT_KM'
                  ? 'bg-brand-blue text-white shadow-md'
                  : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Plane className="w-4 h-4 text-brand-blue" />
              <span>✈️ BIA Airport & Chauffeur Matrix (By KM)</span>
              <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
                Van ₱7.5k • Innova ₱6k • Sedan ₱4.5k
              </span>
            </button>
          </div>

          {calculatorMode === 'AIRPORT_KM' ? (
            <div className="p-6 lg:p-8 space-y-8 animate-fadeIn">
              {/* Top Row: Route Selection & Presets */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-brand-blue flex items-center gap-1.5">
                      <Plane className="w-4 h-4" /> Destination & Transfer Hub
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                      Naga City Chauffeur & Airport Transfer Matrix
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pick your destination or use the distance slider to calculate transfer rates by kilometer with professional driver.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setTransferTripType('ROUNDTRIP')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        transferTripType === 'ROUNDTRIP'
                          ? 'bg-brand-blue text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🔁 Pickup & Drop (Roundtrip)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransferTripType('ONEWAY')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        transferTripType === 'ONEWAY'
                          ? 'bg-brand-blue text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ➡️ One-Way Drop / Meetup
                    </button>
                  </div>
                </div>

                {/* Popular Route Presets */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {[
                    {
                      key: 'BIA_AIRPORT',
                      label: '✈️ BIA Airport (Daraga)',
                      km: '95 km',
                      highlight: true,
                      tag: 'Van ₱7.5k • Innova ₱6k • Sedan ₱4.5k',
                    },
                    {
                      key: 'NAGA_AIRPORT',
                      label: '🛬 Naga Airport (Pili)',
                      km: '15 km',
                      highlight: false,
                      tag: 'Van ₱3.5k • Innova ₱2.5k • Sedan ₱1.8k',
                    },
                    {
                      key: 'LEGAZPI',
                      label: '🌋 Legazpi / Mayon',
                      km: '85 km',
                      highlight: false,
                      tag: 'Van ₱7k • Innova ₱5.3k • Sedan ₱4.3k',
                    },
                    {
                      key: 'DAET',
                      label: '🏖️ Daet / Bagasbas',
                      km: '140 km',
                      highlight: false,
                      tag: 'Van ₱7k • Innova ₱5.3k • Sedan ₱4.3k',
                    },
                    {
                      key: 'SORSOGON',
                      label: '🌊 Sorsogon / Matnog',
                      km: '180 km',
                      highlight: false,
                      tag: 'Van ₱8.5k • Innova ₱6.3k • Sedan ₱4.8k',
                    },
                    {
                      key: 'CUSTOM_KM',
                      label: '📏 Custom Matrix by KM',
                      km: 'Slider',
                      highlight: false,
                      tag: 'Enter any distance',
                    },
                  ].map((preset) => {
                    const isSelected = transferRouteKey === preset.key;
                    return (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => {
                          setTransferRouteKey(preset.key);
                          if (preset.key === 'CUSTOM_KM' && transferCustomKm === 95) {
                            setTransferCustomKm(100);
                          }
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all relative ${
                          isSelected
                            ? 'bg-blue-50/80 border-brand-blue ring-2 ring-brand-blue/30 shadow-sm'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        } ${preset.highlight ? 'border-amber-300' : ''}`}
                      >
                        {preset.highlight && (
                          <span className="absolute -top-2 right-2 text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full uppercase">
                            Official
                          </span>
                        )}
                        <p className="text-xs font-black text-slate-900 truncate">{preset.label}</p>
                        <p className="text-[11px] font-bold text-brand-blue mt-0.5">{preset.km}</p>
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{preset.tag}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Distance & Route Details Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-brand-navy to-slate-900 text-white p-5 rounded-2xl shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full border border-blue-400/30">
                          {transferMatrix.routeInfo.badge}
                        </span>
                        <span className="text-xs text-slate-300">
                          Estimated Drive: <strong className="text-white">{transferMatrix.routeInfo.estDriveTime}</strong>
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-white">{transferMatrix.routeInfo.name}</h4>
                      <p className="text-xs text-slate-300">{transferMatrix.routeInfo.desc}</p>
                    </div>

                    <div className="flex items-center gap-3 bg-white/10 px-4 py-2.5 rounded-xl border border-white/15 self-start md:self-auto">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-blue-300 block">Total Distance</span>
                        <span className="text-base font-black text-white">
                          {transferMatrix.isRoundtrip
                            ? `${transferMatrix.km * 2} KM Roundtrip`
                            : `${transferMatrix.km} KM One-Way`}
                        </span>
                      </div>
                      <span className="text-xl">📍</span>
                    </div>
                  </div>

                  {/* Custom Distance Slider */}
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-bold flex items-center gap-1.5">
                        <Gauge className="w-4 h-4 text-blue-400" />
                        Adjust Distance from Naga City:
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={10}
                          max={500}
                          value={transferCustomKm}
                          onChange={(e) => {
                            setTransferRouteKey('CUSTOM_KM');
                            setTransferCustomKm(Math.max(10, Math.min(500, Number(e.target.value) || 10)));
                          }}
                          className="w-20 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-xs font-black text-amber-300 text-center focus:outline-none focus:border-brand-blue"
                        />
                        <span className="font-extrabold text-amber-300">KM One-Way</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={500}
                      step={5}
                      value={transferCustomKm}
                      onChange={(e) => {
                        setTransferRouteKey('CUSTOM_KM');
                        setTransferCustomKm(Number(e.target.value));
                      }}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>15 km (Pili Airport)</span>
                      <span>95 km (Bicol Int'l Airport)</span>
                      <span>140 km (Daet)</span>
                      <span>180 km (Sorsogon)</span>
                      <span>420 km (Manila)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Vehicle Categories Side-by-Side Comparison */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-brand-blue" />
                    Available Chauffeur Vehicles & All-In Rates
                  </h4>
                  <span className="text-xs text-slate-500 font-semibold">
                    {transferTripType === 'ROUNDTRIP' ? 'Roundtrip (Pickup & Drop)' : 'One-Way Transfer'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1: Sedan */}
                  <div className="bg-white rounded-3xl border-2 border-slate-200 hover:border-brand-blue p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                    <div className="space-y-4">
                      <div className="h-36 rounded-2xl overflow-hidden bg-slate-100 relative">
                        <img
                          src="/images/vehicle-vios.jpg"
                          alt="Sedan Type"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2.5 left-2.5 text-[10px] font-black bg-slate-900/80 text-white px-2.5 py-1 rounded-full backdrop-blur-xs">
                          SEDAN TYPE
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <h5 className="font-black text-lg text-slate-900">Toyota Vios / Mirage G4</h5>
                          <span className="text-[11px] font-bold text-slate-500">Automatic</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">Ideal for individuals, couples, or light business travel.</p>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-semibold">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-brand-blue" /> 4-5 Seats
                        </span>
                        <span>•</span>
                        <span>🧳 2-3 Suitcases</span>
                        <span>•</span>
                        <span>❄️ Aircon</span>
                      </div>

                      <ul className="space-y-1.5 text-xs text-slate-600">
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Professional uniformed driver included</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Flight tracking & terminal meetup</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Fuel-efficient smooth sedan ride</span>
                        </li>
                      </ul>
                    </div>

                    <div className="pt-5 mt-5 border-t border-slate-100 space-y-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Chauffeur Transfer Rate
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-black text-slate-900">
                            {formatPeso(transferMatrix.rates.sedan)}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            {transferTripType === 'ROUNDTRIP' ? '/ roundtrip' : '/ one-way'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          ~₱{(transferMatrix.rates.sedan / (transferMatrix.km * (transferMatrix.isRoundtrip ? 2 : 1))).toFixed(2)} / km
                        </p>
                      </div>

                      <Link
                        to={`/book?category=SEDAN&rentalType=WITH_DRIVER`}
                        className="w-full bg-slate-900 hover:bg-brand-navy text-white font-extrabold py-3 rounded-xl flex items-center justify-center gap-2 text-xs transition-all shadow-sm active:scale-95"
                      >
                        <span>Book Sedan ({formatPeso(transferMatrix.rates.sedan)})</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Card 2: SUV / MPV (Innova) - Featured */}
                  <div className="bg-gradient-to-b from-blue-50/50 via-white to-white rounded-3xl border-2 border-brand-blue p-6 shadow-md hover:shadow-lg transition-all flex flex-col justify-between relative group">
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black bg-brand-blue text-white px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-300" /> Recommended for Airport
                    </span>

                    <div className="space-y-4">
                      <div className="h-36 rounded-2xl overflow-hidden bg-slate-100 relative">
                        <img
                          src="/images/vehicle-innova.jpg"
                          alt="SUV / MPV Type"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2.5 left-2.5 text-[10px] font-black bg-brand-blue text-white px-2.5 py-1 rounded-full">
                          SUV / MPV TYPE
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <h5 className="font-black text-lg text-slate-900">Toyota Innova AT / Xpander</h5>
                          <span className="text-[11px] font-bold text-brand-blue font-mono">Captain Seats</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">Best family choice with spacious 3 rows & luggage room.</p>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-600 bg-blue-50/60 p-2.5 rounded-xl border border-blue-100 font-semibold">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-brand-blue" /> 7-8 Seats
                        </span>
                        <span>•</span>
                        <span>🧳 4-5 Large Bags</span>
                        <span>•</span>
                        <span>💪 Powerful Diesel/AT</span>
                      </div>

                      <ul className="space-y-1.5 text-xs text-slate-600">
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Professional uniformed driver included</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Higher road clearance for Bicol highways</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Generous trunk space for balikbayan boxes</span>
                        </li>
                      </ul>
                    </div>

                    <div className="pt-5 mt-5 border-t border-slate-100 space-y-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-blue block">
                          Chauffeur Transfer Rate
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-black text-brand-blue">
                            {formatPeso(transferMatrix.rates.innova)}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            {transferTripType === 'ROUNDTRIP' ? '/ roundtrip' : '/ one-way'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          ~₱{(transferMatrix.rates.innova / (transferMatrix.km * (transferMatrix.isRoundtrip ? 2 : 1))).toFixed(2)} / km
                        </p>
                      </div>

                      <Link
                        to={`/book?category=SUV_MPV&rentalType=WITH_DRIVER`}
                        className="w-full bg-brand-blue hover:bg-blue-600 text-white font-extrabold py-3 rounded-xl flex items-center justify-center gap-2 text-xs transition-all shadow-md shadow-blue-500/25 active:scale-95"
                      >
                        <span>Book Innova ({formatPeso(transferMatrix.rates.innova)})</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Card 3: Van */}
                  <div className="bg-white rounded-3xl border-2 border-slate-200 hover:border-brand-blue p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                    <div className="space-y-4">
                      <div className="h-36 rounded-2xl overflow-hidden bg-slate-100 relative">
                        <img
                          src="/images/vehicle-nv350.jpg"
                          alt="Van Type"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2.5 left-2.5 text-[10px] font-black bg-indigo-900 text-white px-2.5 py-1 rounded-full">
                          VAN TYPE
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <h5 className="font-black text-lg text-slate-900">Nissan NV350 Urvan</h5>
                          <span className="text-[11px] font-bold text-slate-500">15-Seater</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">Maximum seating and cargo space for tourist groups & barkada.</p>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-semibold">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-brand-blue" /> 12-15 Seats
                        </span>
                        <span>•</span>
                        <span>🧳 8-10 Suitcases</span>
                        <span>•</span>
                        <span>❄️ Dual Cold A/C</span>
                      </div>

                      <ul className="space-y-1.5 text-xs text-slate-600">
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Professional uniformed driver included</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Accommodates large group transfers together</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Dual high-output airconditioning</span>
                        </li>
                      </ul>
                    </div>

                    <div className="pt-5 mt-5 border-t border-slate-100 space-y-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Chauffeur Transfer Rate
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-black text-slate-900">
                            {formatPeso(transferMatrix.rates.van)}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            {transferTripType === 'ROUNDTRIP' ? '/ roundtrip' : '/ one-way'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          ~₱{(transferMatrix.rates.van / (transferMatrix.km * (transferMatrix.isRoundtrip ? 2 : 1))).toFixed(2)} / km
                        </p>
                      </div>

                      <Link
                        to={`/book?category=VAN&rentalType=WITH_DRIVER`}
                        className="w-full bg-slate-900 hover:bg-brand-navy text-white font-extrabold py-3 rounded-xl flex items-center justify-center gap-2 text-xs transition-all shadow-sm active:scale-95"
                      >
                        <span>Book Van ({formatPeso(transferMatrix.rates.van)})</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms & Notes Banner (From Owner's Official Rate Sheets) */}
              <div className="bg-amber-50/80 border-2 border-amber-200/80 rounded-2xl p-5 text-xs text-amber-950 space-y-3">
                <div className="flex items-center gap-2 font-black text-sm text-amber-900">
                  <Info className="w-4 h-4 text-amber-700" />
                  <span>Official Policy on With-Driver & Airport Chauffeur Trips:</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-amber-900/90 leading-relaxed">
                  <div className="bg-white/80 p-3 rounded-xl border border-amber-200">
                    <strong className="block text-slate-900 mb-1">⛽ Gas & Driver Expenses:</strong>
                    If rented with a driver, the renter is responsible for covering the driver's expenses, including gas, toll fees, and food/meals (and accommodation for multi-day trips).
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-amber-200">
                    <strong className="block text-slate-900 mb-1">🛡️ Reservation Hold Fee:</strong>
                    A ₱1,000 reservation fee locks the vehicle and driver on our live calendar via GCash or Bank Transfer (convertible to security deposit).
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-amber-200">
                    <strong className="block text-rose-800 mb-1">⚠️ Strict Legal Policy:</strong>
                    Strictly no use for illegal activities (e.g. unauthorized carpooling / colorum). A penalty of ₱10,000 will be imposed and reported to the LTO.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Input Controls */}
            <div className="lg:col-span-7 space-y-5">
              {/* Vehicle Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Select Vehicle
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {data?.vehicles.map((v) => {
                    const isSelected = v.id === calcVehicleId;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setCalcVehicleId(v.id)}
                        className={`text-left p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'border-brand-blue bg-blue-50/60 shadow-sm ring-1 ring-brand-blue'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                          <img
                            src={v.images[0]?.url || '/images/hero.jpg'}
                            alt={v.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">{v.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {v.category.replace('_', '/')} • {v.transmission}
                          </p>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-blue shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Vehicle Rate Features & Smart Suggestions */}
                {calcSelectedVehicle && (
                  <div className="mt-4 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 border border-blue-200/80 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-blue-200/60">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-brand-blue text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                            <span>Official Rate Features for {calcSelectedVehicle.name}</span>
                            {(calcSelectedVehicle as any).fleetCount > 1 && (
                              <span className="text-[10px] font-extrabold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                                {(calcSelectedVehicle as any).fleetCount} Units in Fleet
                              </span>
                            )}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            {calcSelectedVehicle.transmission} • {calcSelectedVehicle.seats} Seats • {calcSelectedVehicle.fuelType || 'Gasoline'}
                          </p>
                        </div>
                      </div>

                      <Link
                        to={`/vehicles/${calcSelectedVehicle.slug}`}
                        className="text-[11px] font-bold text-brand-blue hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto"
                      >
                        <span>Full Vehicle Specs</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>

                    {/* Smart Suggestion Preset Chips */}
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1.5 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-500" />
                        Smart Pricelist Suggestions (Click Any to Auto-Calculate):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          {
                            label: '⚡ 12h Naga Errands',
                            destSlug: 'naga-city',
                            durType: '12H' as const,
                            days: 1,
                            type: 'SELF_DRIVE' as const,
                            desc: '12-Hour flat city errands',
                          },
                          {
                            label: '⚡ 1-Day Naga City Tour',
                            destSlug: 'naga-city',
                            durType: 'DAYS' as const,
                            days: 1,
                            type: 'SELF_DRIVE' as const,
                            desc: 'Standard 24h whole day',
                          },
                          {
                            label: '⚡ 2-Day Albay / Mayon Trip',
                            destSlug: 'albay-daet',
                            durType: 'DAYS' as const,
                            days: 2,
                            type: 'SELF_DRIVE' as const,
                            desc: '2-Day sightseeing',
                          },
                          {
                            label: '⚡ 3-Day Sorsogon Coast',
                            destSlug: 'sorsogon-labo',
                            durType: 'DAYS' as const,
                            days: 3,
                            type: 'SELF_DRIVE' as const,
                            desc: 'Beach & coastal tour',
                          },
                          {
                            label: '⭐ 7-Day Weekly Saver',
                            destSlug: 'naga-city',
                            durType: 'DAYS' as const,
                            days: 7,
                            type: 'SELF_DRIVE' as const,
                            desc: 'Discounted daily rate',
                          },
                          {
                            label: '🏆 30-Day Monthly Package',
                            destSlug: 'naga-city',
                            durType: 'DAYS' as const,
                            days: 30,
                            type: 'SELF_DRIVE' as const,
                            desc: 'Flat unlimited mileage',
                          },
                          ...(calcSelectedVehicle.allowWithDriver
                            ? [
                                {
                                  label: '🚘 24h With-Driver Tour',
                                  destSlug: 'naga-city',
                                  durType: 'DAYS' as const,
                                  days: 1,
                                  type: 'WITH_DRIVER' as const,
                                  desc: 'Chauffeur included',
                                },
                              ]
                            : []),
                        ].map((sugg, idx) => {
                          const targetDest = data?.destinations.find((d) => d.slug === sugg.destSlug);
                          if (!targetDest) return null;

                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setCalcDestinationId(targetDest.id);
                                setCalcRentalType(sugg.type);
                                setCalcDurationType(sugg.durType);
                                setCalcDays(sugg.days);
                              }}
                              className="bg-white hover:bg-brand-blue hover:text-white border border-slate-200/90 hover:border-brand-blue rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-700 shadow-2xs transition-all flex items-center gap-1 active:scale-95"
                              title={sugg.desc}
                            >
                              <span>{sugg.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Destination & Rental Type Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Destination */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    2. Destination Tier
                  </label>
                  <select
                    value={calcDestinationId}
                    onChange={(e) => setCalcDestinationId(e.target.value)}
                    className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                  >
                    {data?.destinations.map((d) => {
                      const hasRate = data.rates.some(
                        (r) =>
                          r.vehicleId === calcSelectedVehicle?.id &&
                          r.destinationId === d.id &&
                          r.rentalType === calcRentalType &&
                          r.amount !== null
                      );
                      return (
                        <option key={d.id} value={d.id}>
                          {d.name} {!hasRate ? '— (Not offered for this unit)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Rental Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    3. Rental Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={!calcSelectedVehicle?.allowSelfDrive}
                      onClick={() => setCalcRentalType('SELF_DRIVE')}
                      className={`text-xs font-bold py-2.5 px-3 rounded-xl border text-center transition-all ${
                        calcRentalType === 'SELF_DRIVE'
                          ? 'bg-brand-navy text-white border-brand-navy shadow-sm'
                          : calcSelectedVehicle?.allowSelfDrive
                          ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                      }`}
                    >
                      Self-Drive
                    </button>
                    <button
                      type="button"
                      disabled={!calcSelectedVehicle?.allowWithDriver}
                      onClick={() => setCalcRentalType('WITH_DRIVER')}
                      className={`text-xs font-bold py-2.5 px-3 rounded-xl border text-center transition-all ${
                        calcRentalType === 'WITH_DRIVER'
                          ? 'bg-brand-navy text-white border-brand-navy shadow-sm'
                          : calcSelectedVehicle?.allowWithDriver
                          ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                      }`}
                    >
                      With Driver
                    </button>
                  </div>
                </div>
              </div>

              {/* Duration Plan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  4. Duration Plan
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCalcDurationType('12H');
                      setCalcDays(1);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      calcDurationType === '12H'
                        ? 'bg-brand-blue text-white border-brand-blue shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    12 Hours Flat
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCalcDurationType('DAYS');
                      if (calcDays >= 7) setCalcDays(1);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      calcDurationType === 'DAYS' && calcDays < 7
                        ? 'bg-brand-blue text-white border-brand-blue shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Daily (1-6 Days)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCalcDurationType('DAYS');
                      setCalcDays(7);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      calcDurationType === 'DAYS' && calcDays >= 7
                        ? 'bg-brand-blue text-white border-brand-blue shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Weekly (7+ Days)
                  </button>
                </div>

                {calcDurationType === 'DAYS' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">Number of Rental Days:</span>
                      <span className="text-sm font-extrabold text-brand-blue">{calcDays} Day(s)</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={30}
                      value={calcDays}
                      onChange={(e) => setCalcDays(Number(e.target.value))}
                      className="w-full accent-brand-blue cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                      <span>1 Day</span>
                      <span>7 Days (Weekly Plan)</span>
                      <span>14 Days</span>
                      <span>30 Days (Monthly Plan)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery / Pickup Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  5. Delivery & Pick-up Option
                </label>
                <select
                  value={calcDeliveryFeeId}
                  onChange={(e) => setCalcDeliveryFeeId(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                >
                  <option value="OFFICE">Office Pickup (CBD II Triangulo, Naga City - Beside SM) - FREE</option>
                  {data?.additionalFees
                    .filter((f) => f.type === 'DELIVERY')
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} (+{formatPeso(Number(f.amount))})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Live Breakdown Card */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-gradient-to-br from-slate-900 to-brand-navy-dark text-white rounded-3xl p-6 sm:p-7 shadow-lg">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[11px] text-blue-400 font-bold uppercase tracking-wider">Estimated Quotation</span>
                    <h3 className="text-xl font-black text-white">{calcSelectedVehicle?.name}</h3>
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-white/10 rounded-full font-bold uppercase text-slate-300">
                    {calcRentalType === 'SELF_DRIVE' ? 'Self-Drive' : 'With Driver'}
                  </span>
                </div>

                {liveCalculation && !liveCalculation.isAvailable ? (
                  <div className="bg-amber-500/20 border border-amber-400/40 rounded-2xl p-4 text-xs text-amber-200 space-y-1.5">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      Rate Plan Not Published for this Route
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {liveCalculation.unavailabilityReason}
                    </p>
                  </div>
                ) : (
                  <>
                    {liveCalculation?.discountNote && (
                      <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-xl px-3.5 py-2 text-xs font-bold text-emerald-300 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <span>{liveCalculation.discountNote}</span>
                      </div>
                    )}

                    {/* Calculation Rows */}
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>{liveCalculation?.planLabel}</span>
                        <span className="font-semibold text-white">
                          {liveCalculation ? formatPeso(liveCalculation.totalBaseRate) : '—'}
                        </span>
                      </div>

                      {liveCalculation && liveCalculation.deliveryFee > 0 && (
                        <div className="flex justify-between items-center text-slate-300">
                          <span>Delivery / Pickup Service</span>
                          <span className="font-semibold text-white">
                            +{formatPeso(liveCalculation.deliveryFee)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <span>Refundable Security Deposit</span>
                          <Info className="w-3.5 h-3.5 text-slate-400" />
                        </span>
                        <span className="font-semibold text-emerald-400">
                          ₱1,000.00 (Serves as Res Fee)
                        </span>
                      </div>

                      <div className="border-t border-white/10 pt-3">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Total Rental Amount</span>
                          <span className="text-2xl sm:text-3xl font-black text-white">
                            {liveCalculation ? formatPeso(liveCalculation.grandTotal) : '₱0.00'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Pay <strong>₱1,000 reservation fee</strong> online to secure dates; balance of{' '}
                          <strong>{liveCalculation ? formatPeso(liveCalculation.balanceDue) : '₱0.00'}</strong> payable on vehicle handoff.
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Notes & Inclusions preview */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-2 text-[11px] text-slate-300">
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>24/7 Roadside Assistance & Customer Support included</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>LTMS Registered & Fully Comprehensive Insured fleet</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Same-to-same fuel policy & 100% refundable security deposit</span>
                  </div>
                </div>
              </div>

              {/* Proceed Button */}
              <div className="pt-6">
                {liveCalculation?.isAvailable ? (
                  <Link
                    to={`/book?vehicleId=${calcVehicleId}&destinationId=${calcDestinationId}&rentalType=${calcRentalType}`}
                    className="w-full bg-brand-blue hover:bg-blue-600 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-xs transition-all tracking-wide"
                  >
                    <span>Book This Vehicle at This Rate</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <a
                    href="tel:09617225326"
                    className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 rounded-xl text-center block text-xs border border-white/20 transition-all"
                  >
                    Inquire Route with Custoworks (0961 722 5326)
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>

      {/* 3. Comprehensive Rate Matrix & Fleet Pricelist */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-brand-blue">
              Official Rate Sheets
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              Custoworks Fleet Pricelist by Destination
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select your vehicle category and rental mode to explore published rates.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm shrink-0">
            <button
              onClick={() => setViewMode('CARDS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'CARDS'
                  ? 'bg-brand-navy text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vehicle Cards View
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'TABLE'
                  ? 'bg-brand-navy text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Comparison Matrix Table
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search model (e.g. Vios, Innova)..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full text-xs font-medium pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full text-xs font-medium px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
              >
                <option value="ALL">All Vehicle Categories</option>
                <option value="SEDAN">Sedan (Mirage G4, Vios)</option>
                <option value="SUV_MPV">SUV / MPV (Innova, Xpander)</option>
                <option value="VAN">Passenger Van (NV350 Urvan)</option>
              </select>
            </div>

            {/* Rental Type Filter */}
            <div>
              <select
                value={selectedRentalType}
                onChange={(e) => setSelectedRentalType(e.target.value)}
                className="w-full text-xs font-medium px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
              >
                <option value="ALL">All Rental Modes</option>
                <option value="SELF_DRIVE">Self-Drive Only</option>
                <option value="WITH_DRIVER">With Driver Only</option>
              </select>
            </div>

            {/* Duration Plan */}
            <div>
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value)}
                className="w-full text-xs font-medium px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
              >
                <option value="ALL">All Duration Plans</option>
                <option value="HOURS_12">12-Hour Tier</option>
                <option value="HOURS_24">24-Hour Whole Day Tier</option>
                <option value="WEEKLY">Weekly Tier (7+ Days)</option>
                <option value="MONTHLY">Monthly Tier (30+ Days)</option>
              </select>
            </div>
          </div>
        </div>

        {/* View Mode: Cards */}
        {viewMode === 'CARDS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedVehicles.map((vehicle) => {
              const vehicleRates = data?.rates.filter(
                (r) =>
                  r.vehicleId === vehicle.id &&
                  (selectedRentalType === 'ALL' || r.rentalType === selectedRentalType) &&
                  (selectedDuration === 'ALL' || r.duration === selectedDuration) &&
                  r.amount !== null
              ) || [];

              return (
                <div
                  key={vehicle.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Vehicle Photo & Badges */}
                    <div className="relative aspect-video bg-slate-100 overflow-hidden">
                      <img
                        src={vehicle.images[0]?.url || '/images/hero.jpg'}
                        alt={vehicle.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-brand-navy/90 text-white backdrop-blur-sm">
                          {vehicle.category.replace('_', '/')}
                        </span>
                        {vehicle.isFeatured && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-white shadow-sm">
                            ★ Popular
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-extrabold text-base text-slate-900">{vehicle.name}</h3>
                          <p className="text-xs text-slate-500">
                            {vehicle.make} {vehicle.model} {vehicle.year || ''}
                          </p>
                        </div>
                      </div>

                      {/* Specs */}
                      <div className="flex items-center gap-4 text-xs text-slate-600 mb-4 pb-4 border-b border-slate-100">
                        <span className="flex items-center gap-1 font-semibold">
                          <Gauge className="w-3.5 h-3.5 text-brand-blue" />
                          {vehicle.transmission}
                        </span>
                        <span className="flex items-center gap-1 font-semibold">
                          <Users className="w-3.5 h-3.5 text-brand-blue" />
                          {vehicle.seats} Seats
                        </span>
                        <span className="flex items-center gap-1 font-semibold">
                          <Fuel className="w-3.5 h-3.5 text-brand-blue" />
                          {vehicle.fuelType || 'Gas'}
                        </span>
                      </div>

                      {/* Rates Breakdown by Destination */}
                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Published Rates Matrix:
                        </h4>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {vehicleRates.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No published rates match current filter.</p>
                          ) : (
                            vehicleRates.slice(0, 5).map((r) => (
                              <div
                                key={r.id}
                                className="flex justify-between items-center text-xs p-2 rounded-xl bg-slate-50 border border-slate-100"
                              >
                                <div>
                                  <span className="font-bold text-slate-800">{r.destination?.name}</span>
                                  <span className="text-[10px] text-slate-500 block">
                                    {r.rentalType === 'SELF_DRIVE' ? 'Self-Drive' : 'With Driver'} •{' '}
                                    {r.duration === 'HOURS_12' ? '12 Hours' : r.duration === 'HOURS_24' ? '24 Hours' : r.duration}
                                  </span>
                                </div>
                                <span className="font-extrabold text-brand-blue text-sm">
                                  {r.amount ? formatPeso(Number(r.amount)) : '—'}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-5 pt-0 border-t border-slate-100 flex items-center gap-2 mt-4">
                    <Link
                      to={`/vehicles/${vehicle.slug}`}
                      className="flex-1 text-center py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-all"
                    >
                      View Specs & Full Rates
                    </Link>
                    <Link
                      to={`/book?vehicleId=${vehicle.id}`}
                      className="flex-1 text-center py-2.5 px-3 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View Mode: Comparison Matrix Table */}
        {viewMode === 'TABLE' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Destination Rates Comparison Matrix</h3>
                <p className="text-[11px] text-slate-500">Official reference rates across all active destinations</p>
              </div>
              <span className="text-xs text-slate-400">All prices in Philippine Peso (PHP)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Vehicle Model</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Mode</th>
                    <th className="py-3.5 px-4">Plan</th>
                    {data?.destinations.map((d) => (
                      <th key={d.id} className="py-3.5 px-4 font-bold text-slate-900">
                        {d.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {displayedVehicles.map((vehicle) => {
                    const modes: RentalType[] = [];
                    if (vehicle.allowSelfDrive) modes.push('SELF_DRIVE');
                    if (vehicle.allowWithDriver) modes.push('WITH_DRIVER');

                    return modes.map((mode) => {
                      return (
                        <tr key={`${vehicle.id}-${mode}`} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <Link to={`/vehicles/${vehicle.slug}`} className="hover:text-brand-blue">
                              {vehicle.name}
                            </Link>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 font-bold">
                              {vehicle.category.replace('_', '/')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-600">
                            {mode === 'SELF_DRIVE' ? 'Self-Drive' : 'With Driver'}
                          </td>
                          <td className="py-3.5 px-4 text-brand-blue font-bold">24-Hour Daily</td>
                          {data?.destinations.map((d) => {
                            const rate = data?.rates.find(
                              (r) =>
                                r.vehicleId === vehicle.id &&
                                r.destinationId === d.id &&
                                r.rentalType === mode &&
                                r.duration === 'HOURS_24'
                            );
                            return (
                              <td key={d.id} className="py-3.5 px-4 font-extrabold text-slate-900">
                                {rate && rate.amount ? formatPeso(Number(rate.amount)) : '—'}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* 4. Special Savings & Long-Term Packages */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-extrabold uppercase tracking-widest text-brand-blue">
            Special Plans & Savings
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            Extended Rental Packages & Corporate Solutions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Discounted tier pricing for weekly trips, monthly expat leases, and official airport transfers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Package 1 */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-brand-blue font-bold">
                7d
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">Weekly Saver Plan</h3>
                <p className="text-xs text-slate-500 mt-0.5">Rent for 7 days or more and enjoy automatic discounted rates.</p>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Up to 15% discount off standard 24h rates</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Free doorstep vehicle delivery within Naga City</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Flexible rescheduling if travel plans change</span>
                </li>
              </ul>
            </div>
            <Link
              to="/book"
              className="mt-6 w-full text-center py-3 bg-slate-900 hover:bg-brand-navy text-white font-bold text-xs rounded-xl transition-all"
            >
              Book Weekly Rental
            </Link>
          </div>

          {/* Package 2 */}
          <div className="bg-gradient-to-br from-brand-navy to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-4 right-4 bg-brand-blue text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full shadow-sm">
              Best Value
            </div>
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-blue-400 font-bold">
                30d
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-white">Monthly Corporate & Expat Lease</h3>
                <p className="text-xs text-slate-300 mt-0.5">Worry-free 30-day lease with full maintenance & priority support.</p>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-200">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Up to 30% discount on long-term monthly rentals</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Routine maintenance & oil changes fully covered</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Free replacement vehicle in case of servicing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Official BIR VAT / Non-VAT receipts available</span>
                </li>
              </ul>
            </div>
            <Link
              to="/contact?inquiry=monthly"
              className="mt-6 w-full text-center py-3 bg-brand-blue hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              Inquire Corporate Rates
            </Link>
          </div>

          {/* Package 3 */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 font-bold">
                ✈️
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">Airport & Tour Chauffeur Service</h3>
                <p className="text-xs text-slate-500 mt-0.5">Stress-free with-driver airport transfers and scenic Bicol day tours.</p>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Naga Airport (Pili) pickup & drop-off</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Bicol International Airport (Daraga) transfers</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Cagsawa / Mayon & Calaguas jump-off day trips</span>
                </li>
              </ul>
            </div>
            <Link
              to="/book?rentalType=WITH_DRIVER"
              className="mt-6 w-full text-center py-3 bg-slate-900 hover:bg-brand-navy text-white font-bold text-xs rounded-xl transition-all"
            >
              Book Chauffeur Transfer
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Clear Additional Fees & Rental Policies Matrix */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="border-b border-slate-100 pb-5 mb-6">
            <span className="text-xs font-extrabold uppercase tracking-widest text-brand-blue">
              Transparency First
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Additional Surcharges & Rental Guidelines
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Everything is disclosed upfront so you know exactly what to expect.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
            {/* Policy 1 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-brand-blue" />
                <span>₱1,000 Reservation Fee</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Secures your chosen dates on the live calendar. Non-refundable upon cancellation (rescheduling permitted), and acts as your refundable security deposit when the unit is returned.
              </p>
            </div>

            {/* Policy 2 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Clock className="w-4 h-4 text-brand-blue" />
                <span>Overtime / Hourly Extension</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Sedans: <strong>₱150/hr</strong> • SUVs/MPVs: <strong>₱200/hr</strong> • Vans: <strong>₱250/hr</strong>. Extensions exceeding 5 hours are automatically billed as a full 24-hour day.
              </p>
            </div>

            {/* Policy 3 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Sparkles className="w-4 h-4 text-brand-blue" />
                <span>Cleanliness & Carwash Policy</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Return unit clean for 100% full deposit refund. If returned unwashed, <strong>₱300</strong> (Sedan) or <strong>₱400</strong> (MPV/Van) is deducted for post-rental carwash.
              </p>
            </div>

            {/* Policy 4 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Fuel className="w-4 h-4 text-brand-blue" />
                <span>Same-to-Same Fuel Policy</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Vehicles are released with a full or recorded fuel level and must be returned with the same fuel level. Missing fuel is charged at current retail pump prices.
              </p>
            </div>
          </div>

          {/* Delivery Fee List */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-3">
              Delivery & Pickup Zone Surcharges
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                <span className="text-slate-700">Office Pickup (CBD II Triangulo)</span>
                <span className="font-bold text-emerald-600">FREE</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                <span className="text-slate-700">Naga City Proper Doorstep Delivery</span>
                <span className="font-bold text-slate-900">₱300.00</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                <span className="text-slate-700">Pili Area & Naga Airport</span>
                <span className="font-bold text-slate-900">₱400.00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Pricing FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="text-center mb-8">
          <span className="text-xs font-extrabold uppercase tracking-widest text-brand-blue">
            Frequently Asked Questions
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">Car Rental Pricing Questions</h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'How does the ₱1,000 reservation fee work?',
              a: 'The ₱1,000 reservation fee reserves and locks your dates exclusively on our fleet calendar so no other customer can book that unit. Upon returning the car in clean and good order, this ₱1,000 is fully refunded to your GCash or Bank account.',
            },
            {
              q: 'Can I rent a car for just 12 hours?',
              a: 'Yes! We offer official 12-hour rental tiers for quick business errands, local visits, or day trips starting at ₱1,500 for Sedans, ₱2,000 for SUVs, and ₱4,000 for Passenger Vans.',
            },
            {
              q: 'What is included in the "With Driver" rental rates?',
              a: 'With-Driver rentals include a professional, licensed, and courteous chauffeur for up to 12 or 24 hours of driving duty. Fuel, toll fees, and chauffeur meals during out-of-town trips are shouldered by the renter.',
            },
            {
              q: 'Can I pay using GCash or BDO bank transfer?',
              a: 'Yes, we accept instant digital payments via InstaPay QR code, GCash, BDO Unibank transfer, and cash upon office pickup.',
            },
          ].map((faq, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-brand-blue shrink-0" />
                {faq.q}
              </h4>
              <p className="text-xs text-slate-600 mt-2 pl-6 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Bottom CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="bg-gradient-to-r from-brand-navy-dark via-brand-navy to-slate-900 text-white rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-xl">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black">Ready to Reserve Your Vehicle?</h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Pick your ride, review instant rates, and lock your dates in less than 3 minutes.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/book"
                className="bg-brand-blue hover:bg-blue-600 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-blue-500/25 text-xs transition-all"
              >
                Start Instant Online Reservation
              </Link>
              <Link
                to="/contact"
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3.5 rounded-xl font-bold text-xs transition-all"
              >
                Inquire via Hotline (0961 722 5326)
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
