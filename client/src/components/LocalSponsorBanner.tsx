import React, { useState } from 'react';
import {
  Sparkles,
  MapPin,
  ExternalLink,
  Tag,
  PhoneCall,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Megaphone,
  Building2,
  Utensils,
  Compass,
  Wrench,
  X,
  MessageCircle,
  Eye,
  Gift,
} from 'lucide-react';

export interface SponsorItem {
  id: string;
  name: string;
  category: 'HOTEL' | 'FOOD' | 'ADVENTURE' | 'AUTOCARE';
  categoryLabel: string;
  tagline: string;
  location: string;
  renterPerk: string;
  image: string;
  websiteUrl?: string;
  phone?: string;
  isFeatured?: boolean;
}

const DEFAULT_SPONSORS: SponsorItem[] = [
  {
    id: 'cwc-camsur',
    name: 'CWC CamSur Watersports Complex',
    category: 'ADVENTURE',
    categoryLabel: 'Adventure & Sports',
    tagline: 'World-Class 6-Point Cable Ski Park & Eco-Resort',
    location: 'Cadlan, Pili, Camarines Sur (15 mins from Naga)',
    renterPerk: '10% OFF Cable Ski Day Passes with Custoworks Rental Agreement',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
    websiteUrl: 'https://cwcwake.com',
    phone: '0917 500 8920',
    isFeatured: true,
  },
  {
    id: 'villa-caceres',
    name: 'Villa Caceres Hotel & Convention Center',
    category: 'HOTEL',
    categoryLabel: 'Hotel & Lodging',
    tagline: 'Victorian-Style Luxury Rooms, Pool & 24/7 RJ Buffet',
    location: 'Magsaysay Avenue, Naga City',
    renterPerk: 'Free Secured Overnight Parking & 10% Off RJ Buffet for Renters',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
    websiteUrl: 'https://villacacereshotel.com',
    phone: '054 811 6083',
    isFeatured: true,
  },
  {
    id: 'bob-marlin',
    name: 'Bob Marlin Restaurant & Grill',
    category: 'FOOD',
    categoryLabel: 'Dining & Bicolano Cuisine',
    tagline: 'Home of the Department of Tourism Award-Winning Crispy Pata',
    location: 'Magsaysay Avenue, Naga City',
    renterPerk: 'Complimentary Bicol Express Appetizer with any Family Platter',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    websiteUrl: 'https://facebook.com/bobmarlinresto',
    phone: '054 473 1339',
  },
  {
    id: 'mayon-atv',
    name: 'Mayon SkyDrive ATV Adventure Tours',
    category: 'ADVENTURE',
    categoryLabel: 'Adventure & Tours',
    tagline: 'Black Lava Trail ATV Rides to the Foot of Mt. Mayon',
    location: 'Cagsawa Ruins, Albay (1.5 hrs from Naga via Custoworks Car)',
    renterPerk: '₱300 Voucher on Premium Lava Trail per Custoworks Car Booking',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80',
    websiteUrl: 'https://facebook.com/mayonskydrive',
    phone: '0977 840 0252',
  },
  {
    id: 'bicol-autoworx',
    name: 'SpeedTech Auto Care & Detailing',
    category: 'AUTOCARE',
    categoryLabel: 'Automotive & Detailing',
    tagline: 'Official Maintenance & Fast Wash Partner of Custoworks',
    location: 'CBD II Triangulo, Naga City',
    renterPerk: 'Priority 15-Minute Express Wash & Free Tire Pressure Check',
    image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=600&q=80',
    phone: '0961 722 5326',
  },
];

export const LocalSponsorBanner: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'HOTEL' | 'FOOD' | 'ADVENTURE' | 'AUTOCARE'>('ALL');
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    contactPerson: '',
    phone: '',
    email: '',
    category: 'Hotel / Resort',
    placementSlot: 'Homepage Prime Banner',
    proposedPerk: '',
    message: '',
  });

  const filteredSponsors =
    activeTab === 'ALL'
      ? DEFAULT_SPONSORS
      : DEFAULT_SPONSORS.filter((s) => s.category === activeTab);

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInquirySubmitted(true);
  };

  const resetForm = () => {
    setInquirySubmitted(false);
    setFormData({
      businessName: '',
      contactPerson: '',
      phone: '',
      email: '',
      category: 'Hotel / Resort',
      placementSlot: 'Homepage Prime Banner',
      proposedPerk: '',
      message: '',
    });
  };

  return (
    <section id="sponsors" className="bg-gradient-to-b from-slate-50 via-white to-slate-100 py-20 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title & Pitch */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-full text-xs font-bold text-brand-blue uppercase tracking-widest mb-3">
              <Megaphone className="w-3.5 h-3.5 text-brand-blue" />
              Local Business Network & Community Sponsors
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Direct Sponsors & Local Partner Network
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
              Rent with Custoworks and unlock exclusive traveler discounts across Naga City, Albay, and Camarines Sur. 
              Are you a local establishment? Place your banner directly in front of thousands of active Bicol travelers.
            </p>
          </div>

          {/* Action Button: Inquire for Banner Placement */}
          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={() => {
                resetForm();
                setInquiryModalOpen(true);
              }}
              className="bg-brand-navy hover:bg-slate-800 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-lg shadow-slate-900/10 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 border border-slate-700"
            >
              <Megaphone className="w-4 h-4 text-amber-400" />
              <span>Direct Sponsor Placement</span>
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {[
            { id: 'ALL', label: 'All Sponsors' },
            { id: 'HOTEL', label: 'Hotels & Lodging' },
            { id: 'FOOD', label: 'Restaurants & Dining' },
            { id: 'ADVENTURE', label: 'Adventures & Tours' },
            { id: 'AUTOCARE', label: 'Auto Care & Detailing' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-brand-blue text-white shadow-md shadow-blue-500/20'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sponsor Banners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {filteredSponsors.map((sponsor) => (
            <div
              key={sponsor.id}
              className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
            >
              {/* Banner Graphic Header */}
              <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                <img
                  src={sponsor.image}
                  alt={sponsor.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />
                
                {/* Category Pill */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg border border-white/10">
                  {sponsor.category === 'HOTEL' && <Building2 className="w-3.5 h-3.5 text-blue-400" />}
                  {sponsor.category === 'FOOD' && <Utensils className="w-3.5 h-3.5 text-amber-400" />}
                  {sponsor.category === 'ADVENTURE' && <Compass className="w-3.5 h-3.5 text-emerald-400" />}
                  {sponsor.category === 'AUTOCARE' && <Wrench className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>{sponsor.categoryLabel}</span>
                </div>

                {/* Direct Sponsor Tag */}
                <div className="absolute top-3 right-3 bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full tracking-wider uppercase shadow-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3 fill-slate-950" />
                  Direct Sponsor
                </div>

                {/* Bottom title overlay */}
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-white font-black text-lg leading-snug drop-shadow-md">
                    {sponsor.name}
                  </h3>
                  <div className="flex items-center gap-1 text-slate-300 text-xs mt-0.5">
                    <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                    <span className="truncate">{sponsor.location}</span>
                  </div>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {sponsor.tagline}
                  </p>

                  {/* Exclusive Renter Perk Banner */}
                  <div className="mt-3.5 bg-emerald-50 border border-emerald-200/90 rounded-xl p-3 flex items-start gap-2.5">
                    <Gift className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                        Custoworks Renter Special
                      </span>
                      <p className="text-xs font-bold text-slate-800 mt-0.5 leading-snug">
                        {sponsor.renterPerk}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  {sponsor.phone && (
                    <a
                      href={`tel:${sponsor.phone.replace(/\s+/g, '')}`}
                      className="text-xs font-semibold text-slate-600 hover:text-brand-blue flex items-center gap-1 transition-colors"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-brand-blue" />
                      <span>{sponsor.phone}</span>
                    </a>
                  )}

                  {sponsor.websiteUrl && (
                    <a
                      href={sponsor.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto inline-flex items-center gap-1.5 bg-slate-100 hover:bg-brand-blue hover:text-white text-slate-800 text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all"
                    >
                      <span>Visit Partner</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Direct Sponsor Placement Available Slot Card */}
          <div className="bg-gradient-to-br from-brand-navy via-slate-900 to-brand-navy-dark text-white rounded-2xl border-2 border-dashed border-blue-400/40 p-6 flex flex-col justify-between relative overflow-hidden shadow-lg group">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div>
              <div className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/40 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Top Banner Placement Available
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                Advertise Your Hotel, Resort or Shop to Bicol Travelers
              </h3>

              <div className="mt-2.5 inline-block bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg shadow-sm">
                ₱3,000 / month • or 14-Day Free Trial Exposure
              </div>

              <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                Connect directly with tourists, visiting balikbayans, executives, and local families renting vehicles in Naga City looking for accommodations & places to go.
              </p>

              <div className="space-y-2 mt-4 pt-3 border-t border-white/10 text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Top Header Banner</strong> placement seen on every page visit</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Reach 5,000+ active car renters looking for lodging & dining</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Included in booking confirmation email & road itinerary</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Flat ₱3,000/mo — zero commission on your bookings</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/10 flex flex-col gap-2.5">
              <button
                onClick={() => {
                  resetForm();
                  setInquiryModalOpen(true);
                }}
                className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group-hover:scale-[1.02]"
              >
                <Megaphone className="w-4 h-4" />
                <span>Reserve This Banner Slot</span>
              </button>

              <a
                href="https://wa.me/639617225326?text=Hi%20Custoworks,%20I'm%20interested%20in%20a%20Direct%20Sponsor%20Local%20Banner%20Placement%20on%20your%20website!"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs py-2.5 rounded-xl transition-all text-center flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Chat via WhatsApp Dispatch</span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Banner Stats Strip */}
        <div className="mt-12 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center shrink-0">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                High-Intent Local & Tourism Foot Traffic
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Our car renters look for hotels, authentic Bicolano dining, fuel stops, and tourist destinations daily.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 divide-x divide-slate-200 text-center shrink-0">
            <div className="px-3">
              <div className="text-lg sm:text-xl font-black text-brand-navy">5,000+</div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Monthly Visitors</div>
            </div>
            <div className="pl-6 px-3">
              <div className="text-lg sm:text-xl font-black text-emerald-600">100%</div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Targeted Bicol Travel</div>
            </div>
            <div className="pl-6">
              <button
                onClick={() => {
                  resetForm();
                  setInquiryModalOpen(true);
                }}
                className="text-xs font-bold text-brand-blue hover:text-blue-700 flex items-center gap-1"
              >
                <span>View Rate Kit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Interactive Modal: Direct Sponsor Placement Inquiry */}
      {inquiryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 text-slate-900 relative">
            
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-brand-navy to-slate-900 text-white rounded-t-3xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Megaphone className="w-3.5 h-3.5" />
                  Local Banner Placement Program
                </span>
                <h3 className="text-xl font-black mt-1">Direct Sponsor Application</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Feature your local business banner on Custoworks Car Rental
                </p>
              </div>
              <button
                onClick={() => setInquiryModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {inquirySubmitted ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900">Inquiry Received!</h4>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    Thank you, <strong>{formData.contactPerson || 'Partner'}</strong>! Our marketing and fleet coordinator will review your banner placement inquiry for <strong>{formData.businessName || 'your business'}</strong> and reach out within 24 hours.
                  </p>

                  <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                    <a
                      href={`https://wa.me/639617225326?text=${encodeURIComponent(
                        `Hi Custoworks, I submitted a Direct Sponsor Banner Placement inquiry for ${formData.businessName} (${formData.contactPerson})!`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs px-6 py-3 rounded-xl shadow-md flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Fast-Track on WhatsApp Dispatch</span>
                    </a>
                    <button
                      onClick={() => setInquiryModalOpen(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-5 py-3 rounded-xl transition-all"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} className="space-y-4">
                  
                  {/* Special Offer Alert Callout */}
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
                    <span className="text-base shrink-0">🎁</span>
                    <div>
                      <strong className="font-extrabold text-amber-950">14-Day Free Trial Available:</strong>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        New local hotels, resorts, and auto shops get a 14-day exposure trial! Continued placement is only <strong>₱3,000/month flat</strong> with zero commissions.
                      </p>
                    </div>
                  </div>

                  {/* Banner Slot Options Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Select Placement Slot
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      {[
                        { id: 'Top Header Sticky Banner', label: 'Top Header Banner', sub: '₱3k/mo or 14-Day Free Trial' },
                        { id: 'Homepage Prime Showcase', label: 'Homepage Showcase', sub: 'Local Partners Grid' },
                        { id: 'Confirmation Voucher Slip', label: 'Renter Vouchers', sub: 'Sent on Confirmation' },
                      ].map((slot) => (
                        <label
                          key={slot.id}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            formData.placementSlot === slot.id
                              ? 'bg-blue-50/80 border-brand-blue text-brand-navy ring-1 ring-brand-blue'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="radio"
                            name="placementSlot"
                            value={slot.id}
                            checked={formData.placementSlot === slot.id}
                            onChange={(e) => setFormData({ ...formData, placementSlot: e.target.value })}
                            className="sr-only"
                          />
                          <span className="block font-bold text-slate-900">{slot.label}</span>
                          <span className="block text-[10px] text-slate-500 mt-0.5">{slot.sub}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Business & Contact Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Business / Brand Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Naga Highlands Resort"
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-brand-blue focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Contact Person *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Maria Santos"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-brand-blue focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Phone & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Mobile / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="0917 123 4567"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-brand-blue focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="sponsor@business.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-brand-blue focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Business Category & Renter Promo */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Business Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-brand-blue focus:outline-none"
                      >
                        <option value="Hotel / Resort">Hotel / Resort / Accommodation</option>
                        <option value="Restaurant / Cafe">Restaurant / Cafe / Food</option>
                        <option value="Adventure / Tours">Adventure / Tour Operator</option>
                        <option value="Automotive / Detailing">Auto Detailing / Gas Station</option>
                        <option value="Corporate / Event">Event Venue / Corporate Service</option>
                        <option value="Other">Other Local Business</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Perk for Car Renters (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 10% off meal, free dessert, free parking"
                        value={formData.proposedPerk}
                        onChange={(e) => setFormData({ ...formData, proposedPerk: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-brand-blue focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Notes / Message */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Website / Facebook Page & Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Link to your website or Facebook page, and any questions about banner sizes or schedules..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-brand-blue focus:outline-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full bg-brand-navy hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm py-3.5 rounded-xl shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 transition-all"
                    >
                      <Megaphone className="w-4 h-4 text-amber-400" />
                      <span>Submit Direct Banner Placement Inquiry</span>
                    </button>
                    <p className="text-[11px] text-center text-slate-400 mt-2">
                      Prefer instant support? Call dispatch directly at <strong className="text-slate-700">0961 722 5326</strong>.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
