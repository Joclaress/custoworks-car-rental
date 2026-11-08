import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import {
  Car,
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  PhoneCall,
  MessageSquare,
  ArrowRight,
  Calculator,
  Percent,
  Coins,
  Shield,
  FileCheck2,
  Clock,
  MapPin,
  HelpCircle,
  Send,
  Loader2,
  Users,
} from 'lucide-react';

interface CalculatorPreset {
  category: string;
  name: string;
  dailyRate: number;
  popularModels: string;
}

const PRESETS: CalculatorPreset[] = [
  {
    category: 'SEDAN',
    name: 'Sedan (4-5 Seats)',
    dailyRate: 2500,
    popularModels: 'Toyota Vios, Mitsubishi Mirage G4, Honda City',
  },
  {
    category: 'SUV_MPV',
    name: '7-8 Seater MPV / SUV',
    dailyRate: 3200,
    popularModels: 'Mitsubishi Xpander, Toyota Innova, Rush, Avanza',
  },
  {
    category: 'VAN',
    name: '15-Passenger Van',
    dailyRate: 4000,
    popularModels: 'Nissan NV350 Urvan, Toyota Hiace Commuter',
  },
];

export const PartnerProgramPage: React.FC = () => {
  // Calculator state
  const [selectedCategory, setSelectedCategory] = useState<string>('SEDAN');
  const [daysPerMonth, setDaysPerMonth] = useState<number>(15);

  const activePreset = PRESETS.find((p) => p.category === selectedCategory) || PRESETS[0];
  const monthlyGross = activePreset.dailyRate * daysPerMonth;
  const custoworks20Percent = Math.round(monthlyGross * 0.2);
  const partner80Percent = monthlyGross - custoworks20Percent;
  const annualEarnings = partner80Percent * 12;

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    city: 'Naga City',
    vehicleMake: '',
    vehicleModel: '',
    year: 2023,
    transmission: 'AT',
    category: 'SEDAN',
    plateNumber: '',
    rentalTypePreference: 'SELF_DRIVE',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      await api.post('/partners/apply', formData);
      setSubmitted(true);
      window.scrollTo({ top: document.getElementById('apply-form')?.offsetTop || 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit application. Please check your inputs or message us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* 1. Hero Section */}
      <section className="relative bg-brand-navy min-h-[500px] lg:min-h-[560px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero.jpg"
            alt="Custoworks Fleet Naga City"
            className="w-full h-full object-cover object-center opacity-30 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/95 to-brand-navy/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-transparent to-black/30" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-3xl text-white space-y-6">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/40 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-amber-300 uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Custoworks Tie-Up Fleet Program • Naga City & Bicol
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] drop-shadow-sm">
              Monetize Your Car with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-white">80% Net Payouts.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              Have an idle sedan, MPV, or van in Camarines Sur? Partner with Custoworks. We handle marketing, verified LTMS driver background checks, GPS security tracking, and rental contracts. You receive <strong>80% of every rental</strong> with transparent monthly payouts.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#apply-form"
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm px-7 py-3.5 rounded-xl shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-all hover:translate-y-[-2px]"
              >
                <Percent className="w-4 h-4 text-slate-950" />
                Apply as a Tie-Up Partner
              </a>
              <a
                href="#calculator"
                className="bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm px-6 py-3.5 rounded-xl backdrop-blur-sm transition-all flex items-center gap-2"
              >
                <Calculator className="w-4 h-4 text-blue-300" />
                Calculate Potential Earnings
              </a>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> 80% Partner Take-Home Share
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> 20% Custoworks Management Fee
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> GPS Tracking & LTMS Screening
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Visual 80/20 Revenue Split Breakdown */}
      <section className="relative z-20 -mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Partner 80% */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-emerald-500/30 p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 font-black text-xs px-4 py-1.5 rounded-bl-xl uppercase tracking-wider">
              Your Share
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-xl">
                80%
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Partner Net Payout</h3>
                <p className="text-xs text-slate-500">Credited directly to your bank account or e-wallet</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              You receive 80% of the gross rental income for every day your unit is booked. With high car rental demand in Naga City for business, pilgrimages, and tourist getaways, vehicles rent an average of 12 to 22 days per month.
            </p>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Earn ₱30,000 – ₱48,000/month in passive income</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Transparent monthly ledger with breakdown per booking</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Use your car whenever you need with advance notice</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Custoworks 20% */}
          <div className="bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-800 p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-500 text-white font-bold text-xs px-4 py-1.5 rounded-bl-xl uppercase tracking-wider">
              Management
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 font-black text-xl flex items-center justify-center border border-blue-400/30">
                20%
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Custoworks Management Fee</h3>
                <p className="text-xs text-slate-400">Covers 100% of the operational & security workload</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              Our 20% commission covers all the heavy lifting, security, marketing, and customer service. You never have to deal with late-night inquiries, customer screening, or chasing payments.
            </p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                <span>LTO LTMS Driver License verification & background check</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                <span>24/7 GPS real-time fleet tracking & geofence monitoring</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                <span>₱1,000 reservation fee & security deposit inspection</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Digital rental contract signing & turn-over photo inspections</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. Interactive Partner Earnings Calculator */}
      <section id="calculator" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-extrabold uppercase tracking-widest text-brand-blue">
            Revenue Estimation
          </span>
          <h2 className="text-3xl font-black text-slate-900 mt-1">Interactive Partner Calculator</h2>
          <p className="text-sm text-slate-500 mt-2">
            See exactly how much you will take home per month based on your vehicle model and rental utilization.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-10 max-w-4xl mx-auto">
          {/* Step 1: Vehicle Category Selector */}
          <div className="mb-8">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              1. Select Vehicle Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PRESETS.map((preset) => (
                <button
                  key={preset.category}
                  type="button"
                  onClick={() => setSelectedCategory(preset.category)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    selectedCategory === preset.category
                      ? 'border-brand-blue bg-blue-50/50 ring-2 ring-brand-blue shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <p className="font-extrabold text-sm text-slate-900">{preset.name}</p>
                  <p className="text-xs font-bold text-brand-blue mt-1">₱{preset.dailyRate.toLocaleString()} / 24h</p>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{preset.popularModels}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Slider for Days Rented */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Estimated Days Rented per Month
              </label>
              <span className="text-base font-black text-brand-navy bg-slate-100 px-3 py-1 rounded-xl">
                {daysPerMonth} Days / Month
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="25"
              step="1"
              value={daysPerMonth}
              onChange={(e) => setDaysPerMonth(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-blue"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1.5 font-medium">
              <span>5 Days (Casual)</span>
              <span>15 Days (Average Naga Fleet Utilization)</span>
              <span>25 Days (High Demand)</span>
            </div>
          </div>

          {/* Step 3: Calculation Results */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Gross Rental Revenue</p>
                <p className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
                  ₱{monthlyGross.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">{daysPerMonth} days × ₱{activePreset.dailyRate.toLocaleString()}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Custoworks Fee (20%)</p>
                <p className="text-xl sm:text-2xl font-black text-rose-600 mt-1">
                  - ₱{custoworks20Percent.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Marketing, GPS, LTMS & Support</p>
              </div>

              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                <p className="text-xs text-emerald-800 font-extrabold uppercase tracking-wider">Your Net Payout (80%)</p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
                  ₱{partner80Percent.toLocaleString()}
                </p>
                <p className="text-[11px] text-emerald-800 font-medium mt-0.5">Direct to Your Bank / GCash</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
              <span className="text-slate-600">
                🚀 Projected 12-Month Net Passive Income: <strong className="text-slate-900 font-extrabold text-sm">₱{annualEarnings.toLocaleString()} / year</strong>
              </span>
              <a
                href="#apply-form"
                className="bg-brand-navy hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                Sign Up Your Vehicle <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Why Partner with Custoworks & 3-Step Process */}
      <section className="bg-slate-100 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-brand-blue">
              Simple Onboarding
            </span>
            <h2 className="text-3xl font-black text-slate-900 mt-1">How It Works in 3 Steps</h2>
            <p className="text-sm text-slate-500 mt-2">
              Getting your vehicle on our Naga City fleet is fast, secure, and hassle-free.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-brand-blue font-black flex items-center justify-center text-lg">
                1
              </div>
              <h3 className="font-extrabold text-base text-slate-900">Submit Application</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Fill out the quick 1-minute form below with your vehicle make, model, year, and contact information.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-brand-blue font-black flex items-center justify-center text-lg">
                2
              </div>
              <h3 className="font-extrabold text-base text-slate-900">Safety Check & GPS Install</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bring your unit to our Naga City garage for a brief inspection, professional photo shoot, and complimentary GPS tracker setup.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-black flex items-center justify-center text-lg">
                3
              </div>
              <h3 className="font-extrabold text-base text-slate-900">Start Receiving 80% Payouts</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We handle the bookings, LTMS screening, contracts, and turnover. You receive 80% net payouts on schedule.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Application Form */}
      <section id="apply-form" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-brand-navy p-6 sm:p-8 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Partner Registration
              </span>
              <h2 className="text-2xl font-black mt-1">Apply to Become a Tie-Up Partner</h2>
              <p className="text-xs text-slate-300 mt-1">
                No upfront fees. 80% Partner Share / 20% Custoworks Management Fee.
              </p>
            </div>
            <div className="shrink-0 bg-white/10 px-4 py-2 rounded-xl border border-white/20 text-center">
              <p className="text-[10px] text-slate-300 uppercase font-semibold">Commission Split</p>
              <p className="text-lg font-black text-emerald-400">80% / 20%</p>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            {submitted ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Partner Application Submitted!</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Thank you for applying to partner with Custoworks Car Rental! Our fleet coordinator will review your vehicle details and contact you via phone or WhatsApp within 24 hours.
                </p>
                <div className="pt-4 flex flex-wrap justify-center gap-3">
                  <a
                    href="https://wa.me/639617225326?text=Hi%20Custoworks,%20I%20just%20submitted%20a%20Tie-Up%20Partner%20application%20for%20my%20vehicle!"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md inline-flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" /> Chat on WhatsApp Directly
                  </a>
                  <a
                    href="https://m.me/CustoWorkss"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md inline-flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" /> Message on Facebook
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {errorMsg && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl">
                    {errorMsg}
                  </div>
                )}

                {/* Section A: Owner Information */}
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                    <Users className="w-4 h-4 text-brand-blue" /> Car Owner Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Juan Dela Cruz"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-blue focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Philippine Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0917 123 4567"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-blue focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="juan@gmail.com"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-blue focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        City / Municipality *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Naga City, Camarines Sur"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-blue focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section B: Vehicle Information */}
                <div className="pt-4">
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                    <Car className="w-4 h-4 text-brand-blue" /> Vehicle Specifications
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Make *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.vehicleMake}
                        onChange={(e) => setFormData({ ...formData, vehicleMake: e.target.value })}
                        placeholder="Toyota / Mitsubishi / Nissan"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-blue focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Model *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.vehicleModel}
                        onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                        placeholder="Vios / Mirage G4 / Xpander"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-blue focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Year Model *
                      </label>
                      <input
                        type="number"
                        min="2012"
                        max="2027"
                        required
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-blue focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-blue focus:outline-none"
                      >
                        <option value="SEDAN">Sedan (Vios, Mirage, City)</option>
                        <option value="SUV_MPV">7-8 Seater MPV / SUV (Xpander, Innova)</option>
                        <option value="VAN">15-Passenger Van (NV350, Hiace)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Transmission *
                      </label>
                      <select
                        value={formData.transmission}
                        onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-blue focus:outline-none"
                      >
                        <option value="AT">Automatic Transmission (AT)</option>
                        <option value="MT">Manual Transmission (MT)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Plate / Conduction # (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.plateNumber}
                        onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                        placeholder="e.g. NBD 1234"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-blue focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section C: Rental Type Preference & Notes */}
                <div className="pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Preferred Rental Type
                      </label>
                      <select
                        value={formData.rentalTypePreference}
                        onChange={(e) => setFormData({ ...formData, rentalTypePreference: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-blue focus:outline-none"
                      >
                        <option value="SELF_DRIVE">Self-Drive (Higher demand, LTMS verified)</option>
                        <option value="WITH_DRIVER">With Driver Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Additional Notes or Questions
                      </label>
                      <input
                        type="text"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="e.g. available starting next week"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-blue focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-xs text-slate-500">
                    <span className="font-bold text-slate-700">Partnership Terms:</span> You keep 80% net. Custoworks receives 20% platform management.
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto bg-brand-blue hover:bg-blue-600 text-white font-black text-sm px-8 py-3.5 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Tie-Up Application
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 6. Direct Contact Banner */}
      <section className="bg-slate-900 text-white py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-black">Want to talk to our Fleet Partnership Specialist first?</h3>
            <p className="text-xs text-slate-400 mt-1">We are ready to explain the tie-up contract and answer all your questions.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="tel:09617225326"
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/20 flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4 text-emerald-400" /> 0961 722 5326
            </a>
            <a
              href="https://wa.me/639617225326?text=Hi%20Custoworks,%20I'm%20interested%20in%20partnering%20my%20vehicle%20with%20your%20rental%20fleet!"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" /> WhatsApp Us
            </a>
            <a
              href="https://m.me/CustoWorkss"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" /> Facebook Messenger
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
