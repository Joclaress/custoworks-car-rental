import React, { useState } from 'react';
import { api } from '../lib/api';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Sparkles,
  Car,
  Wrench,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

interface ContactSectionProps {
  id?: string;
  isStandalonePage?: boolean;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  id = 'contact',
  isStandalonePage = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Rental Inquiry',
    inquiryType: 'GENERAL',
    preferredVehicle: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{
    ticketId: string;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const quickPresets = [
    { label: 'Weekend Getaway Quote', msg: 'Hi! I would like to inquire about availability and rates for a weekend rental in Camarines Sur.' },
    { label: 'Airport Pickup (Naga / WNP)', msg: 'Hello! I need a car rental with airport pickup at Naga Airport (Pili) for an upcoming flight arrival.' },
    { label: 'Self-Drive LTMS Inquiry', msg: 'Hi Custoworks! I want to confirm if my digital LTO LTMS portal QR code is valid for self-drive verification.' },
    { label: 'With-Driver Trip to Albay/Daet', msg: 'Good day! Inquiring for a rental with professional driver to Albay/Daet for a 2-day family trip.' },
  ];

  const faqs = [
    {
      q: 'How does the ₱500 reservation fee work?',
      a: 'The ₱500 reservation fee locks your chosen vehicle and selected dates instantly, preventing other renters from booking the same car. It is deducted from your total rental balance upon release.',
    },
    {
      q: 'What are the required documents for Self-Drive rentals?',
      a: 'For self-drive: 1) Valid Philippine Driver’s License (Digital LTO portal or physical card), 2) Verified LTMS QR code, 3) 1 Secondary government ID, and 4) Proof of Billing or Company/Student ID. You can upload these directly in the online booking wizard.',
    },
    {
      q: 'Can I rent a car with a driver for long trips?',
      a: 'Yes! We provide professional with-driver rentals for Naga City, Camarines Sur, Albay (Mayon/Legazpi), Sorsogon, Daet, Manila, and Baguio. No driver’s license or security deposit is required for with-driver service.',
    },
    {
      q: 'When and how is the security deposit refunded?',
      a: 'The security deposit (₱3,000 for Sedans, ₱5,000 for MPVs/Vans) is inspected and refunded immediately upon returning the vehicle in clean condition with matched fuel levels, via Cash, GCash, or instant bank transfer.',
    },
    {
      q: 'Where can I pick up or receive the vehicle in Naga City?',
      a: 'You can pick up at our Naga City garage, or request meetup delivery at SM City Naga, Naga Central Bus Terminal, Naga Airport (Pili), or your hotel within Naga City metro.',
    },
    {
      q: 'What if I need emergency roadside assistance?',
      a: 'We offer 24/7 dedicated roadside assistance across Naga City and Camarines Sur. If you experience a flat tire, mechanical glitch, or battery discharge, call our 24/7 hotlines at 0961 722 5326 or 0995 382 7972 for immediate support.',
    },
  ];

  const handleCopyPhone = () => {
    navigator.clipboard.writeText('09617225326');
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<{ success: boolean; ticketId: string; message: string }>('/contact', formData);
      setSubmittedTicket({
        ticketId: res.ticketId,
        message: res.message || 'Thank you! Your inquiry has been sent.',
      });
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: 'General Rental Inquiry',
        inquiryType: 'GENERAL',
        preferredVehicle: '',
        message: '',
      });
    } catch (err: any) {
      console.error('Failed to submit contact inquiry:', err);
      setError(err?.response?.data?.error || 'Unable to submit your inquiry at this moment. Please call or text our 24/7 hotline directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id={id} className={`relative bg-slate-900 text-white py-20 ${isStandalonePage ? 'min-h-[85vh]' : ''}`}>
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sky-500 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-blue-300 uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            24/7 Customer Support & Inquiries
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Get in Touch with Custoworks Naga
          </h2>
          <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
            Have questions about car models, rates, or custom Bicol itineraries? Send us a message below or call our 24/7 Naga City hotline for immediate assistance.
          </p>
        </div>

        {/* Top Direct Contact Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {/* Channel 1: 24/7 Hotline */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 backdrop-blur-sm flex flex-col justify-between hover:border-blue-500/50 transition-all">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">24/7 Hotline & SMS</p>
                <p className="text-base font-extrabold text-white mt-0.5">0961 722 5326 <span className="text-[11px] text-blue-300 font-normal">(Primary)</span></p>
                <p className="text-xs font-bold text-slate-300">0995 382 7972 <span className="text-[10px] text-slate-400 font-normal">(Secondary)</span></p>
                <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Always online for bookings
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center gap-2">
              <a
                href="tel:09617225326"
                className="flex-1 bg-brand-blue hover:bg-blue-600 text-white text-xs font-bold py-2 px-3 rounded-lg text-center transition-colors shadow-sm"
              >
                Call Primary
              </a>
              <button
                type="button"
                onClick={handleCopyPhone}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs py-2 px-3 rounded-lg flex items-center gap-1 transition-colors"
                title="Copy primary phone number"
              >
                {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Channel 2: Official Facebook */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 backdrop-blur-sm flex flex-col justify-between hover:border-blue-500/50 transition-all">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Facebook Messenger</p>
                <p className="text-sm font-bold text-white mt-0.5">Custoworks Car Rental</p>
                <p className="text-[11px] text-slate-400 mt-1">Verified Naga City Business Page</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/60">
              <a
                href="https://www.facebook.com/CustoWorkss"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors"
              >
                Chat on Messenger <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Channel 3: Business Email */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 backdrop-blur-sm flex flex-col justify-between hover:border-blue-500/50 transition-all">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Official Email</p>
                <p className="text-sm font-bold text-white mt-0.5">custoworks1@gmail.com</p>
                <p className="text-[11px] text-slate-400 mt-1">Corporate & booking inquiries</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/60">
              <a
                href="mailto:custoworks1@gmail.com"
                className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold py-2 px-3 rounded-lg transition-colors"
              >
                Send Email <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Channel 4: Naga City Garage & Hours */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 backdrop-blur-sm flex flex-col justify-between hover:border-blue-500/50 transition-all">
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
                href="https://maps.google.com/?q=Carnation+Street+CBD+II+Triangulo+Naga+City"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold py-2 px-3 rounded-lg transition-colors"
              >
                View Map Location <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Main Content: Interactive Form + Support Details Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          {/* Left Column: Interactive Contact Form (7 cols) */}
          <div className="lg:col-span-7 bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between pb-5 border-b border-slate-700/60 mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Send Us a Direct Message</h3>
                <p className="text-xs text-slate-400 mt-1">Our dispatch and customer support team responds within 15 minutes.</p>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <Clock className="w-3.5 h-3.5" /> Rapid Response
              </span>
            </div>

            {submittedTicket ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Message Received!</h4>
                  <p className="text-xs text-slate-300 mt-1">{submittedTicket.message}</p>
                </div>
                <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-3 inline-block">
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider">Inquiry Reference Number</p>
                  <p className="text-base font-extrabold text-blue-400 tracking-wider font-mono">{submittedTicket.ticketId}</p>
                </div>
                <p className="text-xs text-slate-400">
                  For urgent needs or immediate vehicle releases, please call <strong className="text-white">0961 722 5326</strong> (Secondary: <strong className="text-white">0995 382 7972</strong>).
                </p>
                <button
                  type="button"
                  onClick={() => setSubmittedTicket(null)}
                  className="bg-brand-blue hover:bg-blue-600 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-colors"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Quick Preset Buttons */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Quick Templates (Click to Auto-fill)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {quickPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            subject: preset.label,
                            message: preset.msg,
                          }));
                        }}
                        className="text-[11px] bg-slate-700/60 hover:bg-blue-600/30 border border-slate-600/60 hover:border-blue-400/50 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg transition-all"
                      >
                        + {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Your Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Juan dela Cruz"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Mobile Phone Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0995 123 4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Inquiry Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Inquiry Category
                    </label>
                    <select
                      value={formData.inquiryType}
                      onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="GENERAL">General Rental Inquiry</option>
                      <option value="BOOKING">Check Date / Vehicle Availability</option>
                      <option value="SPECIAL_ITINERARY">With-Driver Long Trip / Tour</option>
                      <option value="CORPORATE">Corporate / Long-Term Fleet Rental</option>
                      <option value="ROADSIDE_ASSISTANCE">Roadside Assistance / Emergency</option>
                      <option value="FEEDBACK">Feedback or Support</option>
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Subject / Concern
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Inquiring for 3-day Vios rental to Caramoan"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Your Message / Travel Details <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide pickup date, destination, self-drive or with-driver, or any specific questions..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-brand-blue hover:from-blue-500 hover:to-blue-600 text-white font-bold text-sm py-3 px-6 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Send Customer Inquiry
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Key Details, Pickup Hubs & Roadside Assistance (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Garage & Pickup Hubs Card */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 backdrop-blur-md">
              <h4 className="text-base font-bold text-white flex items-center gap-2 mb-3">
                <Car className="w-4 h-4 text-blue-400" /> Naga City & Bicol Pickup Hubs
              </h4>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Free pickup and return at our Naga garage. We also provide convenient meetup and vehicle delivery points:
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Custoworks Garage</strong> – Carnation St. CBD II Brgy. Triangulo (Beside SM), Naga City</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>SM City Naga</strong> – Main Entrance / Parking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Naga Central Bus Terminal</strong> – For arriving bus passengers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Naga Airport (WNP Pili)</strong> – Flight arrival delivery</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Bicol International Airport (BIA)</strong> – Daraga / Legazpi Meetup</span>
                </li>
              </ul>
            </div>

            {/* 24/7 Roadside Assistance Card */}
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/30 rounded-3xl p-6 backdrop-blur-md">
              <div className="flex items-center gap-2.5 text-amber-400 mb-2">
                <Wrench className="w-5 h-5" />
                <h4 className="font-bold text-sm text-white">24/7 Bicol Roadside Assistance</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                All Custoworks rentals include complete 24/7 emergency dispatch across Camarines Sur, Albay, and Sorsogon. Battery boosts, flat tire assistance, or towing:
              </p>
              <div className="mt-4 pt-3 border-t border-amber-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-300/80 uppercase tracking-wider block">Dispatch Lines</span>
                  <span className="font-extrabold text-white text-xs block">0961 722 5326 (Primary)</span>
                  <span className="text-slate-300 text-[11px] block">0995 382 7972 (Secondary)</span>
                </div>
                <a
                  href="tel:09617225326"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-2 px-3.5 rounded-lg transition-colors shadow-md"
                >
                  Call Dispatch
                </a>
              </div>
            </div>

            {/* Business Credibility & LTMS Compliance */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 backdrop-blur-md flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300">
                <p className="font-bold text-white mb-1">LTMS Verified Operations</p>
                <p className="leading-relaxed text-slate-400">
                  Fully registered car rental operation in Naga City, Camarines Sur. Digital rental contracts, LTMS compliance, and guaranteed clean, air-conditioned fleet.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Frequently Asked Questions (FAQ) Accordion */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-6 sm:p-10 backdrop-blur-md">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">
              <HelpCircle className="w-4 h-4" /> Quick Answers
            </div>
            <h3 className="text-2xl font-black text-white">Frequently Asked Questions</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Common questions about booking, LTMS verification, payments, and rental terms.
            </p>
          </div>

          <div className="max-w-4xl mx-auto divide-y divide-slate-700/60">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 text-left font-bold text-sm text-slate-200 hover:text-blue-300 transition-colors focus:outline-none"
                  >
                    <span>{faq.q}</span>
                    <span className="shrink-0 text-slate-400">
                      {isOpen ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="mt-2.5 text-xs text-slate-400 leading-relaxed pr-6 animate-fadeIn">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
