import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Destination, Vehicle } from '../types';
import { VehicleCard } from '../components/VehicleCard';
import { ContactSection } from '../components/ContactSection';
import { LocalSponsorBanner } from '../components/LocalSponsorBanner';
import {
  Calendar,
  MapPin,
  Car,
  ShieldCheck,
  Clock,
  Sparkles,
  PhoneCall,
  Search,
  CheckCircle,
  CheckCircle2,
  Star,
  Users,
  Compass,
  FileCheck2,
  CreditCard,
  KeyRound,
  ArrowRight,
  ListChecks,
  UserCheck,
  ChevronRight,
  Wrench,
  HelpCircle,
  Info,
  HeartHandshake,
  Plane,
} from 'lucide-react';
import { format } from 'date-fns';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [rateGuideRates, setRateGuideRates] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Search Availability Form State
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const [pickupDate, setPickupDate] = useState(format(tomorrow, "yyyy-MM-dd'T'HH:mm"));
  const [returnDate, setReturnDate] = useState(format(dayAfter, "yyyy-MM-dd'T'HH:mm"));
  const [destinationId, setDestinationId] = useState('');
  const [rentalType, setRentalType] = useState('SELF_DRIVE');

  // Interactive "How It Works" State
  const [activeProcessTab, setActiveProcessTab] = useState<'steps' | 'requirements' | 'comparison' | 'policies'>('steps');
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const [checklist, setChecklist] = useState({
    license: true,
    ltms: true,
    secondaryId: false,
    fee: true,
  });

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        // Fast decoupled fetch: fleet renders immediately as soon as vehicles arrive
        const vehiclesPromise = api.get<{ data: Vehicle[] }>('/vehicles', { forceRefresh: true }).then((res) => {
          if (isMounted) {
            setVehicles(res.data);
            setLoading(false);
          }
          return res;
        });

        const pricelistPromise = api
          .get<{ destinations: Destination[]; vehicles: Vehicle[]; rates: any[] }>('/pricing/pricelist', { forceRefresh: true })
          .then((res) => {
            if (isMounted) {
              setDestinations(res.destinations);
              setRateGuideRates(res.rates);
              if (res.destinations.length > 0) {
                setDestinationId((prev) => prev || res.destinations[0].id);
              }
            }
            return res;
          });

        await Promise.allSettled([vehiclesPromise, pricelistPromise]);
      } catch (err) {
        console.error('Failed to load home page data:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      pickupAt: new Date(pickupDate).toISOString(),
      returnAt: new Date(returnDate).toISOString(),
      destinationId,
      rentalType,
    });
    navigate(`/vehicles?${params.toString()}`);
  };

  const filteredVehicles =
    selectedCategory === 'ALL'
      ? vehicles
      : vehicles.filter((v) => v.category === selectedCategory);

  const getDynamicRatesForDestination = (destId: string) => {
    // Sedans
    const sedanIds = vehicles.filter((v) => v.category === 'SEDAN').map((v) => v.id);
    const sedan12 = rateGuideRates.filter(
      (r) => sedanIds.includes(r.vehicleId) && r.destinationId === destId && r.rentalType === 'SELF_DRIVE' && r.duration === 'HOURS_12' && r.amount != null
    );
    const sedan24 = rateGuideRates.filter(
      (r) => sedanIds.includes(r.vehicleId) && r.destinationId === destId && r.rentalType === 'SELF_DRIVE' && r.duration === 'HOURS_24' && r.amount != null
    );

    // SUV / MPV
    const suvIds = vehicles.filter((v) => v.category === 'SUV_MPV').map((v) => v.id);
    const suv12 = rateGuideRates.filter(
      (r) => suvIds.includes(r.vehicleId) && r.destinationId === destId && r.rentalType === 'SELF_DRIVE' && r.duration === 'HOURS_12' && r.amount != null
    );
    const suv24 = rateGuideRates.filter(
      (r) => suvIds.includes(r.vehicleId) && r.destinationId === destId && r.rentalType === 'SELF_DRIVE' && r.duration === 'HOURS_24' && r.amount != null
    );

    // Van (NV350)
    const vanIds = vehicles.filter((v) => v.category === 'VAN').map((v) => v.id);
    const van12 = rateGuideRates.filter(
      (r) => vanIds.includes(r.vehicleId) && r.destinationId === destId && r.rentalType === 'WITH_DRIVER' && r.duration === 'HOURS_12' && r.amount != null
    );
    const van24 = rateGuideRates.filter(
      (r) => vanIds.includes(r.vehicleId) && r.destinationId === destId && r.rentalType === 'WITH_DRIVER' && r.duration === 'HOURS_24' && r.amount != null
    );

    const formatTier = (rList: any[]): string => {
      const amounts = rList.map((r) => Number(r.amount)).filter((a) => !isNaN(a) && a > 0);
      if (amounts.length === 0) return '-';
      const min = Math.min(...amounts);
      const max = Math.max(...amounts);
      if (min === max) {
        return `₱${Math.round(min).toLocaleString('en-PH')}`;
      }
      return `₱${Math.round(min).toLocaleString('en-PH')} - ₱${Math.round(max).toLocaleString('en-PH')}`;
    };

    const v12Amounts = van12.map((r) => Number(r.amount)).filter((a) => !isNaN(a) && a > 0);
    const v24Amounts = van24.map((r) => Number(r.amount)).filter((a) => !isNaN(a) && a > 0);
    const v12 = v12Amounts.length > 0 ? Math.min(...v12Amounts) : null;
    const v24 = v24Amounts.length > 0 ? Math.min(...v24Amounts) : null;

    let vanText = '-';
    if (v12 && v24) {
      vanText = `₱${Math.round(v12).toLocaleString('en-PH')} (12h) / ₱${Math.round(v24).toLocaleString('en-PH')} (24h)`;
    } else if (v24) {
      vanText = `₱${Math.round(v24).toLocaleString('en-PH')} (24h)`;
    } else if (v12) {
      vanText = `₱${Math.round(v12).toLocaleString('en-PH')} (12h)`;
    }

    return {
      sedan12: formatTier(sedan12),
      sedan24: formatTier(sedan24),
      suv12: formatTier(suv12),
      suv24: formatTier(suv24),
      van: vanText,
    };
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* 1. Hero Section */}
      <section className="relative bg-brand-navy min-h-[580px] lg:min-h-[640px] flex items-center overflow-hidden">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero.jpg"
            alt="Custoworks Car Rental Fleet in Bicol"
            className="w-full h-full object-cover object-center opacity-40 scale-105 animate-pulse duration-[10000ms]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/95 to-brand-navy/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-transparent to-black/30" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-2xl text-white space-y-6">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/40 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-blue-300 uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Naga City & Camarines Sur Car Rental
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] drop-shadow-sm">
              Drive Naga & Bicol with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-white">Complete Peace of Mind.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              Book brand-new sedans, spacious MPVs, and 15-passenger vans online in minutes. Enjoy instant price calculations, verified LTMS compliance, and guaranteed vehicle availability.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#search-bar"
                className="bg-brand-blue hover:bg-blue-600 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all hover:translate-y-[-2px]"
              >
                <Search className="w-4 h-4" /> Check Availability & Rates
              </a>
              <Link
                to="/vehicles"
                className="bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm px-6 py-3.5 rounded-xl backdrop-blur-sm transition-all"
              >
                Browse Fleet
              </Link>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> ₱1,000 Reservation Fee
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Self-Drive & With-Driver
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> 24/7 Bicol Roadside Assistance
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Search & Availability Floating Bar */}
      <section id="search-bar" className="relative z-20 -mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-5 md:p-6">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Rental Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Rental Option
              </label>
              <div className="relative">
                <select
                  value={rentalType}
                  onChange={(e) => setRentalType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-brand-blue focus:outline-none"
                >
                  <option value="SELF_DRIVE">Self Drive (LTMS Verified)</option>
                  <option value="WITH_DRIVER">With Driver</option>
                </select>
                <Car className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Destination */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Destination
              </label>
              <div className="relative">
                <select
                  value={destinationId}
                  onChange={(e) => setDestinationId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-brand-blue focus:outline-none"
                >
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Pick-up Date & Time */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Pick-up Schedule
              </label>
              <input
                type="datetime-local"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-brand-blue focus:outline-none"
              />
            </div>

            {/* Return Date & Time */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Return Schedule
              </label>
              <input
                type="datetime-local"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-brand-blue focus:outline-none"
              />
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full h-[42px] bg-brand-blue hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
              >
                <Search className="w-4 h-4" /> Search Vehicles
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 3. Featured Rental Vehicles Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-brand-blue">
              Our Rental Fleet
            </span>
            <h2 className="text-3xl font-black text-slate-900 mt-1">Available Rental Vehicles</h2>
            <p className="text-sm text-slate-500 mt-1">
              Maintained to strict safety standards, cold air conditioning, and full comprehensive insurance.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'ALL', label: 'All Fleet' },
              { id: 'SEDAN', label: 'Sedans (Vios / Mirage)' },
              { id: 'SUV_MPV', label: '7-8 Seater MPVs' },
              { id: 'VAN', label: '15-Seater Van' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-brand-navy text-white shadow-md'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-slate-200 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            to="/vehicles"
            className="inline-flex items-center gap-2 text-sm font-bold text-brand-blue hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-6 py-3 rounded-xl transition-all"
          >
            Explore Complete Vehicle Fleet & Custom Durations <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 4. Why Choose Custoworks? */}
      <section className="bg-slate-900 text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-400">
              The Custoworks Advantage
            </span>
            <h2 className="text-3xl font-black mt-2">Why Rent with Custoworks Naga?</h2>
            <p className="text-slate-400 text-sm mt-2">
              We make renting a car in Naga City straightforward, safe, and 100% digital.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <FileCheck2 className="w-7 h-7 text-blue-400" />,
                title: 'Official Rate Cards & Transparent Pricing',
                desc: 'Fixed rental rates by destination and duration. No surprise surcharges or hidden fuel markups.',
              },
              {
                icon: <ShieldCheck className="w-7 h-7 text-emerald-400" />,
                title: 'LTMS QR Code Verification',
                desc: 'Compliant with Philippine LTO digital driver verification, protecting both renters and vehicles.',
              },
              {
                icon: <Calendar className="w-7 h-7 text-amber-400" />,
                title: 'Real-Time Availability Calendar',
                desc: 'Interactive live calendar prevents double bookings and guarantees your reserved vehicle on pickup day.',
              },
              {
                icon: <PhoneCall className="w-7 h-7 text-purple-400" />,
                title: '24/7 Local Naga Roadside Support',
                desc: 'Assistance across Naga City, Pili, Camarines Sur, Albay, and Sorsogon anytime during your trip.',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 backdrop-blur-sm hover:border-blue-500/50 transition-all group"
              >
                <div className="w-14 h-14 rounded-xl bg-slate-900 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-inner">
                  {feature.icon}
                </div>
                <h3 className="font-extrabold text-base mb-2 group-hover:text-blue-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Comprehensive Interactive "How It Works" Section */}
      <section id="process" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-full text-xs font-bold text-brand-blue uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Simple, Modern & Verified Booking
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            How It Works & Rental Guide
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Everything you need to know about booking, requirements, deposit refunds, and driver options in Naga City.
          </p>

          {/* Interactive Feature Tabs */}
          <div className="mt-8 flex flex-wrap justify-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200 max-w-3xl mx-auto">
            <button
              type="button"
              onClick={() => setActiveProcessTab('steps')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeProcessTab === 'steps'
                  ? 'bg-white text-brand-navy shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. 4-Step Process
            </button>
            <button
              type="button"
              onClick={() => setActiveProcessTab('requirements')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeProcessTab === 'requirements'
                  ? 'bg-white text-brand-navy shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListChecks className="w-4 h-4 text-brand-blue" />
              2. Requirements Checklist
            </button>
            <button
              type="button"
              onClick={() => setActiveProcessTab('comparison')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeProcessTab === 'comparison'
                  ? 'bg-white text-brand-navy shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3. Self-Drive vs With-Driver
            </button>
            <button
              type="button"
              onClick={() => setActiveProcessTab('policies')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeProcessTab === 'policies'
                  ? 'bg-white text-brand-navy shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              4. Deposit & Fuel Policy
            </button>
          </div>
        </div>

        {/* Tab 1: 4-Step Process Flow */}
        {activeProcessTab === 'steps' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: '01',
                  time: '~2 mins',
                  icon: <Car className="w-6 h-6 text-brand-blue" />,
                  title: 'Select Vehicle & Dates',
                  desc: 'Pick your preferred sedan, MPV, or van. Choose self-drive or with-driver and set your pickup and return schedules.',
                  proTip: 'Instant availability check shows live status across our entire Naga fleet.',
                },
                {
                  step: '02',
                  time: 'Instant Hold',
                  icon: <CreditCard className="w-6 h-6 text-brand-blue" />,
                  title: 'Pay ₱1,000 Reservation Fee',
                  desc: 'Lock in your vehicle & calendar dates immediately. Non-refundable on cancellation (rescheduling only). Serves as refundable security deposit after return.',
                  proTip: 'You receive an instant 2-hour hold window while your payment slip is verified.',
                },
                {
                  step: '03',
                  time: '~5 mins',
                  icon: <FileCheck2 className="w-6 h-6 text-brand-blue" />,
                  title: 'Upload Requirements Online',
                  desc: 'Upload your verified LTO LTMS QR code, driver\'s license, and secondary ID directly from your phone. No physical branch visit required.',
                  proTip: 'LTMS QR code enables fast-track verification without repetitive paperwork.',
                },
                {
                  step: '04',
                  time: 'Fast Release',
                  icon: <KeyRound className="w-6 h-6 text-brand-blue" />,
                  title: 'Pick Up & Drive Away',
                  desc: 'Sign the quick digital rental agreement at our Naga garage or airport meetup point, settle the remaining balance, and hit the road!',
                  proTip: 'Clean, fueled vehicle with pre-trip checklist signed for your security.',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setExpandedStep(expandedStep === idx ? null : idx)}
                  className={`cursor-pointer bg-white rounded-2xl border p-6 transition-all shadow-sm hover:shadow-md relative group ${
                    expandedStep === idx ? 'border-brand-blue ring-2 ring-brand-blue/10' : 'border-slate-200/90'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center group-hover:scale-105 transition-transform">
                      {item.icon}
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {item.time}
                    </span>
                  </div>

                  <span className="text-3xl font-black text-slate-200 block mb-1">{item.step}</span>
                  <h3 className="font-extrabold text-base text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">{item.desc}</p>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-brand-blue font-semibold">
                    <span>💡 Pro-tip: {item.proTip}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Ready to start your reservation?</h4>
                  <p className="text-xs text-slate-600">The entire booking process takes under 5 minutes online.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to="/book"
                  className="bg-brand-blue hover:bg-blue-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md"
                >
                  Book a Vehicle Now
                </Link>
                <a
                  href="#contact"
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all"
                >
                  Have Questions?
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Interactive Requirements Checklist */}
        {activeProcessTab === 'requirements' && (
          <div id="requirements" className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-sm animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Self-Drive Eligibility & Document Checklist</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Check the items you currently have to verify if your documents are ready for instant booking approval.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      key: 'license' as const,
                      title: 'Valid Philippine Driver\'s License',
                      desc: 'Non-Professional or Professional driver\'s license (physical PVC card or digital eGovPH/LTMS copy).',
                      tag: 'Mandatory',
                    },
                    {
                      key: 'ltms' as const,
                      title: 'LTO LTMS Portal Verified QR Code',
                      desc: 'Screenshot of your digital driver\'s license QR code from portal.lto.gov.ph for rapid automated validation.',
                      tag: 'Mandatory',
                    },
                    {
                      key: 'secondaryId' as const,
                      title: '1 Secondary Valid ID or Proof of Billing',
                      desc: 'Passport, UMID, Postal ID, Company/Student ID, or Barangay Certificate / utility bill.',
                      tag: 'Verification',
                    },
                    {
                      key: 'fee' as const,
                      title: '₱1,000 Reservation Hold Fee',
                      desc: 'Ready via GCash or BDO to lock your vehicle calendar immediately (non-refundable; rescheduling only; refundable security deposit upon return).',
                      tag: 'Hold Fee',
                    },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${
                        checklist[item.key]
                          ? 'bg-blue-50/60 border-blue-300 text-slate-900'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checklist[item.key]}
                        onChange={(e) =>
                          setChecklist({ ...checklist, [item.key]: e.target.checked })
                        }
                        className="mt-1 w-4 h-4 text-brand-blue rounded border-slate-300 focus:ring-brand-blue"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{item.title}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                            {item.tag}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status Scorecard Box */}
              <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-6 space-y-5">
                <div>
                  <span className="text-xs uppercase tracking-wider text-blue-300 font-semibold">Live Readiness Score</span>
                  <div className="mt-2 flex items-center justify-between">
                    <h4 className="text-2xl font-black">
                      {Object.values(checklist).filter(Boolean).length} of 4 Ready
                    </h4>
                    <span className="text-sm font-bold text-emerald-400">
                      {Math.round((Object.values(checklist).filter(Boolean).length / 4) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(Object.values(checklist).filter(Boolean).length / 4) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="text-xs text-slate-300 leading-relaxed bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                  {Object.values(checklist).filter(Boolean).length === 4 ? (
                    <div className="flex items-start gap-2 text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        <strong>Awesome!</strong> You have all the requirements ready. Your self-drive booking can be approved in under 5 minutes online.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 text-amber-300">
                      <Info className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        You have {4 - Object.values(checklist).filter(Boolean).length} pending item(s). You can still choose <strong>With-Driver rental</strong> with zero document requirements!
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  <Link
                    to="/book"
                    className="w-full inline-flex items-center justify-center gap-2 bg-brand-blue hover:bg-blue-600 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-md"
                  >
                    Proceed to Booking Wizard <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="#contact"
                    className="w-full inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2.5 px-4 rounded-xl transition-all"
                  >
                    Ask About Requirements
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Self-Drive vs With-Driver Comparison */}
        {activeProcessTab === 'comparison' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
            {/* Self-Drive Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-brand-blue mb-4">
                  <Car className="w-3.5 h-3.5" /> Complete Freedom & Privacy
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Self-Drive Rental</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                  You drive the vehicle yourself. Perfect for personal business, private dates, or family vacations where privacy is top priority.
                </p>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Driver's License:</strong> Required (Valid Philippine or International License)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>LTMS Verification:</strong> Required online</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Security Deposit:</strong> ₱1,000 (covered by reservation fee, refundable after unit return)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Fuel Policy:</strong> Same-to-same level upon return</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>24/7 Roadside Assistance:</strong> Included for free</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <Link
                  to="/vehicles?rentalType=SELF_DRIVE"
                  className="w-full inline-flex items-center justify-center gap-2 bg-brand-navy hover:bg-slate-800 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all"
                >
                  Browse Self-Drive Vehicles <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* With-Driver Card */}
            <div className="bg-gradient-to-br from-slate-900 to-brand-navy text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-4">
                  <Users className="w-3.5 h-3.5 text-blue-400" /> Stress-Free Chauffeur Service
                </div>
                <h3 className="text-2xl font-black text-white mb-2">With-Driver Rental</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                  Sit back and relax. Professional, courteous, and polite local Bicolano drivers for Naga City errands, regional out-of-town tours, and Manila express trips.
                </p>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Zero Driver's License:</strong> Rent without needing any license</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Zero Security Deposit:</strong> No security deposit collected!</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Experienced Drivers:</strong> Familiar with Bicol highways and mountain roads</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Bicol International Airport (BIA):</strong> Official pickup & drop rates: Van ₱7,500 • Innova ₱6,000 • Sedan ₱4,500</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Ideal for:</strong> Airport transfers, weddings, family tours to Mayon, and Manila direct charters</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Transparent Driver Fee:</strong> Driver allowance & meals clear upfront</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-700/60 flex flex-col sm:flex-row gap-2.5">
                <Link
                  to="/rates?mode=airport#calculator"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs py-3 px-4 rounded-xl transition-all shadow-md active:scale-95"
                >
                  <Plane className="w-4 h-4" /> BIA Airport Calculator
                </Link>
                <Link
                  to="/vehicles?rentalType=WITH_DRIVER"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-brand-blue hover:bg-blue-600 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-md active:scale-95"
                >
                  Browse Vehicles <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Policies, Deposit & Carwash Guarantee */}
        {activeProcessTab === 'policies' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-sm space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Policy 1 */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-brand-blue flex items-center justify-center mb-4">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base text-slate-900 mb-2">Deposit & Reschedule Policy</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your ₱1,000 reservation fee serves as your security deposit. It cannot be refunded once cancelled (rescheduling only). Upon clean vehicle return, it is refunded <strong>on the spot</strong> via Cash, GCash, or Maya.
                </p>
              </div>

              {/* Policy 2 */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-brand-blue flex items-center justify-center mb-4">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base text-slate-900 mb-2">Carwash & Cleanliness</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Return clean to get 100% of your deposit back. If returned unwashed due to busy schedule, standard carwash fee of ₱300 (Sedan) or ₱400 (MPV/Van) is deducted.
                </p>
              </div>

              {/* Policy 3 */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-brand-blue flex items-center justify-center mb-4">
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base text-slate-900 mb-2">Fuel Match Guarantee</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Vehicles are issued with a noted fuel level (usually Full or 1/2 tank). Return at the same level—no inflated gas markups or surprise refuel fees.
                </p>
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h5 className="font-bold text-sm text-white">Need a customized itinerary or out-of-town quote?</h5>
                <p className="text-xs text-slate-400 mt-0.5">We provide customized rates for multi-day provincial trips and wedding packages.</p>
              </div>
              <a
                href="#contact"
                className="bg-brand-blue hover:bg-blue-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shrink-0"
              >
                Contact Dispatch Team
              </a>
            </div>
          </div>
        )}
      </section>

      {/* 6. Official Rate Card Summary Section */}
      <section id="rates" className="bg-slate-100/70 border-y border-slate-200 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-brand-blue">
                Official Reference Pricing
              </span>
              <h2 className="text-3xl font-black text-slate-900 mt-2">Custoworks Rental Rate Guide</h2>
              <p className="text-sm text-slate-600 mt-2 max-w-2xl">
                Official rates based on destination, duration, and rental type. Transparent pricing with zero hidden surcharges.
              </p>
            </div>
            <Link
              to="/rates"
              className="inline-flex items-center gap-2 bg-brand-blue hover:bg-blue-600 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all self-start md:self-auto"
            >
              <span>Explore Interactive Pricelist & Calculator</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Sedan (12h)</th>
                  <th className="py-3 px-4">Sedan (24h)</th>
                  <th className="py-3 px-4">SUV/MPV (12h)</th>
                  <th className="py-3 px-4">SUV/MPV (24h)</th>
                  <th className="py-3 px-4">Van NV350 (With Driver)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {destinations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      Loading official rates from fleet database...
                    </td>
                  </tr>
                ) : (
                  destinations.map((d) => {
                    const r = getDynamicRatesForDestination(d.id);
                    return (
                      <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{d.name}</td>
                        <td className="py-3.5 px-4">{r.sedan12}</td>
                        <td className="py-3.5 px-4 font-semibold text-brand-navy">{r.sedan24}</td>
                        <td className="py-3.5 px-4">{r.suv12}</td>
                        <td className="py-3.5 px-4 font-semibold text-brand-navy">{r.suv24}</td>
                        <td className="py-3.5 px-4">{r.van}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
            <p className="text-xs text-slate-500">
              * Cleanliness policy: Return clean to receive full ₱1,000 deposit refund; if unwashed, ₱300 (Sedan) or ₱400 (MPV/Van) is deducted.
            </p>
            <Link
              to="/rates#calculator"
              className="text-xs font-bold text-brand-blue hover:text-blue-700 flex items-center gap-1 transition-colors shrink-0"
            >
              <span>Calculate exact cost for your trip</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Customer Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-extrabold uppercase tracking-widest text-brand-blue">
            Verified Customer Reviews
          </span>
          <h2 className="text-3xl font-black text-slate-900 mt-2">Trusted Across Camarines Sur</h2>
          <p className="text-sm text-slate-500 mt-2">
            Read what local travelers, families, and businesses say about renting with Custoworks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: 'Dr. Raymond Mendoza',
              role: 'Family Trip to Albay & Sorsogon',
              text: 'Rented the Toyota Innova for our 5-day Bicol family trip. The car smelled brand new, cool AC, and booking online with GCash was effortless. Highly recommended in Naga!',
              vehicle: 'Toyota Innova AT',
            },
            {
              name: 'Janice Villafuerte',
              role: 'Corporate Shuttle Service',
              text: 'We booked the Nissan NV350 with driver for our regional conference. Kuya driver was very polite, punctual, and drove smoothly all the way from Naga to Daet. Top tier service!',
              vehicle: 'Nissan NV350 Urvan',
            },
            {
              name: 'Mark Lester Ramos',
              role: 'Self-Drive Weekend Trip',
              text: 'Smooth verification using the LTMS portal QR code. The Vios 2025 has excellent gas mileage. Custoworks team is very professional and prompt in confirming payments.',
              vehicle: 'Toyota Vios 2025 AT',
            },
          ].map((t, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex gap-1 text-amber-400 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic mb-6">"{t.text}"</p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-bold text-slate-900">{t.name}</h4>
                  <p className="text-slate-400">{t.role}</p>
                </div>
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold text-[10px]">
                  {t.vehicle}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7.5 Direct Sponsors & Local Banner Placement */}
      <LocalSponsorBanner />

      {/* 8. Become a Partner Callout Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-gradient-to-r from-slate-900 via-brand-navy to-slate-900 rounded-3xl p-8 sm:p-12 text-white border border-blue-500/30 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-400/40 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Car Owners & Fleet Hosts • Naga City & CamSur
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Turn Your Car into Passive Income with <span className="text-emerald-400">80% Net Payouts.</span>
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Consign your sedan, MPV, or van with Custoworks. We handle 100% of the customer screening, GPS tracking, booking contracts, and payment collection. Earn <strong>₱30,000 – ₱48,000/month</strong> while we only take a 20% all-inclusive management fee.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-2">
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-400" /> 80% Owner Share</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-400" /> 20% Custoworks Management</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-400" /> Free GPS & LTMS Screening</span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3 w-full sm:w-auto">
            <Link
              to="/partner"
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm px-8 py-4 rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all hover:scale-105 text-center"
            >
              Become a Tie-Up Partner <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/partner#calculator"
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all text-center"
            >
              Calculate Potential Earnings
            </Link>
          </div>
        </div>
      </section>

      {/* 9. Call to Action Banner */}
      <section className="bg-gradient-to-r from-brand-navy to-brand-blue text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black">Ready to Book Your Rental Car?</h2>
            <p className="text-blue-100 text-sm mt-1">
              Select your vehicle, lock your dates with ₱1,000 reservation fee, and upload your IDs online.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/vehicles"
              className="bg-white text-brand-navy font-bold text-sm px-6 py-3 rounded-xl shadow-lg hover:bg-slate-100 transition-all"
            >
              Reserve a Vehicle Now
            </Link>
            <a
              href="tel:09617225326"
              className="bg-blue-700/60 hover:bg-blue-700 border border-white/20 text-white font-semibold text-sm px-5 py-3 rounded-xl flex items-center gap-2 transition-all"
            >
              <PhoneCall className="w-4 h-4" /> 0961 722 5326 / 0995 382 7972
            </a>
          </div>
        </div>
      </section>

      {/* 9. Interactive Contact Section */}
      <ContactSection id="contact" />
    </div>
  );
};

