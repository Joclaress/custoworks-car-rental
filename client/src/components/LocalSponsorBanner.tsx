import React, { useState } from 'react';
import {
  Sparkles,
  MapPin,
  ExternalLink,
  PhoneCall,
  ArrowRight,
  CheckCircle2,
  Megaphone,
  Building2,
  Utensils,
  Compass,
  Wrench,
  ShoppingBag,
  X,
  MessageCircle,
  Eye,
  CreditCard,
  Calendar,
  HelpCircle,
} from 'lucide-react';

export interface SponsorSlot {
  id: string;
  category: 'HOTEL' | 'FOOD' | 'ADVENTURE' | 'AUTOCARE' | 'RETAIL';
  categoryLabel: string;
  title: string;
  location: string;
  image: string;
  description: string;
  suggestedPerk: string;
  isAvailable: boolean;
  activeBusiness?: {
    name: string;
    tagline: string;
    websiteUrl: string;
    phone: string;
  };
}

const SPONSOR_SLOTS: SponsorSlot[] = [
  // 1. ACTIVE SPONSOR: Custoworks Carwash and Detailing
  {
    id: 'custoworks-carwash-detailing',
    category: 'AUTOCARE',
    categoryLabel: 'Carwash & Detailing',
    title: 'Custoworks Carwash and Detailing | Naga City',
    location: 'Carnation St. CBD II Brgy. Triangulo (Beside SM City), Naga City',
    image: '/images/carwash.jpg',
    description: 'Premium Snow Foam Wash, Deep Interior Sanitization, Engine Bay Wash & Acid Rain Removal. Keep your vehicle showroom-clean!',
    suggestedPerk: 'Priority Fast Lane Wash & Free Tire Dressing for Renters & Community Drivers',
    isAvailable: false,
    activeBusiness: {
      name: 'Custoworks Carwash and Detailing',
      tagline: 'Official Auto Detailing Partner of Custoworks in Naga City',
      websiteUrl: 'https://www.facebook.com/profile.php?id=61586727264046',
      phone: '0961 722 5326',
    },
  },

  // 2. OPEN SLOT: Hotel & Resort
  {
    id: 'slot-hotel-resort',
    category: 'HOTEL',
    categoryLabel: 'Hotels & Lodging',
    title: '+ Add Hotel / Resort Slot',
    location: 'Naga City, Camarines Sur, or Albay',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    description: 'Incoming travelers renting vehicles need clean, safe, and comfortable accommodations in Naga City & Bicol.',
    suggestedPerk: 'e.g. 10% Off Room Rate or Free Guest Parking for Custoworks Renters',
    isAvailable: true,
  },

  // 3. OPEN SLOT: Restaurant & Dining
  {
    id: 'slot-food-dining',
    category: 'FOOD',
    categoryLabel: 'Restaurants & Cafes',
    title: '+ Add Restaurant / Cafe Slot',
    location: 'Magsaysay Ave / Centro Naga / Pili',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    description: 'Feature your authentic Bicolano cuisine, grill, cafe, or family dining spot to hungry tourists and road trippers.',
    suggestedPerk: 'e.g. Free Appetizer, Dessert, or 10% Off with Rental Agreement',
    isAvailable: true,
  },

  // 4. OPEN SLOT: Tour Operator & Adventure
  {
    id: 'slot-tours-adventure',
    category: 'ADVENTURE',
    categoryLabel: 'Adventure & Tours',
    title: '+ Add Tours & Adventure Slot',
    location: 'Caramoan, CWC Pili, or Mt. Mayon Albay',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
    description: 'Promote your island hopping, ATV mountain tours, wake park, or water sports packages to active travelers with cars.',
    suggestedPerk: 'e.g. ₱300 Discount Voucher or Free Gear Rental for Renters',
    isAvailable: true,
  },

  // 5. OPEN SLOT: Auto Shop & Gas Station
  {
    id: 'slot-autocare-gas',
    category: 'AUTOCARE',
    categoryLabel: 'Auto Care & Gas Station',
    title: '+ Add Auto Care & Gas Slot',
    location: 'Naga City & Pan-Philippine Highway',
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
    description: 'Promote your gas station, tire service, vulcanizing, or battery shop to hundreds of motorists traversing Bicol daily.',
    suggestedPerk: 'e.g. Free Air/Tire Pressure Check or Points Discount',
    isAvailable: true,
  },

  // 6. OPEN SLOT: Retail & Local Souvenirs
  {
    id: 'slot-retail-pasalubong',
    category: 'RETAIL',
    categoryLabel: 'Pasalubong & Shopping',
    title: '+ Add Pasalubong & Retail Slot',
    location: 'Naga City & Camarines Sur',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
    description: 'Tourists always buy pili nuts, native delicacies, and Bicol handicrafts before driving home or flying back.',
    suggestedPerk: 'e.g. 5% Off Pasalubong Box for Custoworks Car Renters',
    isAvailable: true,
  },
];

export const LocalSponsorBanner: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'HOTEL' | 'FOOD' | 'ADVENTURE' | 'AUTOCARE' | 'RETAIL'>('ALL');
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    contactPerson: '',
    phone: '',
    email: '',
    category: 'Hotel / Resort',
    placementSlot: 'Top Header Sticky Banner',
    paymentTerm: 'Monthly Recurring (₱3,000/mo after 14-day trial)',
    proposedPerk: '',
    message: '',
  });

  const filteredSlots =
    activeTab === 'ALL'
      ? SPONSOR_SLOTS
      : SPONSOR_SLOTS.filter((s) => s.category === activeTab);

  const openInquiryForSlot = (slotTitle: string, category: string) => {
    setFormData({
      ...formData,
      placementSlot: slotTitle,
      category: category,
    });
    setInquirySubmitted(false);
    setInquiryModalOpen(true);
  };

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
      placementSlot: 'Top Header Sticky Banner',
      paymentTerm: 'Monthly Recurring (₱3,000/mo after 14-day trial)',
      proposedPerk: '',
      message: '',
    });
  };

  return (
    <section id="sponsors" className="bg-gradient-to-b from-slate-50 via-white to-slate-100 py-20 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-full text-xs font-bold text-brand-blue uppercase tracking-widest mb-3">
              <Megaphone className="w-3.5 h-3.5 text-brand-blue" />
              Local Business Network & Direct Sponsors
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Direct Sponsors & Local Banner Placement
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
              Every month, 5,000+ tourists, balikbayans, and corporate travelers rent vehicles on our platform. 
              Place your banner here to directly reach guests looking for places to stay, dine, wash, and explore in Naga City & Bicol!
            </p>
          </div>

          {/* Action Button: Inquire for Banner Placement */}
          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={() => {
                resetForm();
                setInquiryModalOpen(true);
              }}
              className="bg-brand-navy hover:bg-slate-800 text-white font-black text-xs sm:text-sm px-5 py-3.5 rounded-xl shadow-lg shadow-slate-900/10 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 border border-slate-700"
            >
              <Megaphone className="w-4 h-4 text-amber-400" />
              <span>+ Add Your Slot Here</span>
            </button>
          </div>
        </div>

        {/* 1. TOP OFFICIAL SPONSOR: Custoworks Carwash and Detailing */}
        <div className="mb-12 bg-gradient-to-r from-slate-950 via-brand-navy to-slate-900 rounded-3xl p-6 sm:p-9 text-white border-2 border-cyan-400/40 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-3.5">
            <div className="inline-flex items-center gap-2 bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300 fill-cyan-300" />
              Top Active Sponsor • Naga City
            </div>
            
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
              Custoworks Carwash and Detailing | Naga City
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Keep your vehicle showroom-clean! Professional snow foam car wash, deep interior sanitization, engine degreasing, and ceramic protection right at <strong>Carnation St. CBD II Brgy. Triangulo (Beside SM City Naga)</strong>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-cyan-100 pt-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Snow Foam Exterior Wash</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Interior Deep Vacuum & Sanitize</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Engine Bay Detailing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>100% Deposit Refund Guarantee</strong> for Renters</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3 w-full sm:w-auto">
            <a
              href="https://www.facebook.com/profile.php?id=61586727264046"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#1877F2] hover:bg-[#166fe5] text-white font-black text-xs sm:text-sm px-7 py-4 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2.5 transition-all hover:scale-105"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Visit Carwash Facebook Page</span>
            </a>
            <a
              href="tel:09617225326"
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all text-center flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-3.5 h-3.5 text-cyan-300" />
              <span>Call / Book Detailing: 0961 722 5326</span>
            </a>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {[
            { id: 'ALL', label: 'All Slots' },
            { id: 'AUTOCARE', label: 'Carwash & Detailing (Active)' },
            { id: 'HOTEL', label: 'Hotels & Lodging (Open)' },
            { id: 'FOOD', label: 'Restaurants & Dining (Open)' },
            { id: 'ADVENTURE', label: 'Tours & Adventure (Open)' },
            { id: 'RETAIL', label: 'Pasalubong & Shopping (Open)' },
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

        {/* 2. SPONSORS GRID: Top Active + Available Slots with Pictures */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSlots.map((slot) => {
            const isActive = !slot.isAvailable;

            return (
              <div
                key={slot.id}
                className={`rounded-2xl overflow-hidden transition-all flex flex-col justify-between ${
                  isActive
                    ? 'bg-white border-2 border-cyan-500 shadow-md ring-1 ring-cyan-500/20'
                    : 'bg-white border-2 border-dashed border-slate-300 hover:border-brand-blue shadow-sm hover:shadow-md group'
                }`}
              >
                {/* Banner Graphic Header with Picture */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                  <img
                    src={slot.image}
                    alt={slot.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-95"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-black/20 to-transparent" />

                  {/* Category Pill */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg border border-white/10">
                    {slot.category === 'AUTOCARE' && <Wrench className="w-3.5 h-3.5 text-cyan-400" />}
                    {slot.category === 'HOTEL' && <Building2 className="w-3.5 h-3.5 text-blue-400" />}
                    {slot.category === 'FOOD' && <Utensils className="w-3.5 h-3.5 text-amber-400" />}
                    {slot.category === 'ADVENTURE' && <Compass className="w-3.5 h-3.5 text-emerald-400" />}
                    {slot.category === 'RETAIL' && <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />}
                    <span>{slot.categoryLabel}</span>
                  </div>

                  {/* Status Tag */}
                  {isActive ? (
                    <div className="absolute top-3 right-3 bg-cyan-400 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full tracking-wider uppercase shadow-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3 fill-slate-950" />
                      Active Sponsor
                    </div>
                  ) : (
                    <div className="absolute top-3 right-3 bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full tracking-wider uppercase shadow-md animate-pulse">
                      Slot Available
                    </div>
                  )}

                  {/* Bottom Title Overlay */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-white font-black text-base sm:text-lg leading-snug drop-shadow-md">
                      {slot.title}
                    </h3>
                    <div className="flex items-center gap-1 text-slate-300 text-xs mt-0.5">
                      <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                      <span className="truncate">{slot.location}</span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {slot.description}
                    </p>

                    {/* Pricing or Perk Badge */}
                    {isActive ? (
                      <div className="mt-3.5 bg-cyan-50 border border-cyan-200 rounded-xl p-3">
                        <span className="block text-[10px] font-extrabold uppercase tracking-wider text-cyan-800">
                          Renter Special Offer
                        </span>
                        <p className="text-xs font-bold text-slate-800 mt-0.5 leading-snug">
                          {slot.suggestedPerk}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3.5 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start justify-between gap-2">
                        <div>
                          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-amber-900">
                            Monthly Rate
                          </span>
                          <span className="text-xs font-black text-slate-900">
                            ₱3,000 / month
                          </span>
                          <span className="block text-[10px] text-emerald-700 font-bold mt-0.5">
                            🎁 14-Day Free Trial Available
                          </span>
                        </div>
                        <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-md self-center">
                          Month-to-Month
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="pt-3 border-t border-slate-100">
                    {isActive ? (
                      <div className="flex items-center justify-between gap-2">
                        <a
                          href="tel:09617225326"
                          className="text-xs font-bold text-slate-700 hover:text-brand-blue flex items-center gap-1"
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-brand-blue" />
                          <span>0961 722 5326</span>
                        </a>
                        <a
                          href={slot.activeBusiness?.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                        >
                          <span>Visit Facebook</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ) : (
                      <button
                        onClick={() => openInquiryForSlot(slot.title, slot.categoryLabel)}
                        className="w-full bg-slate-900 hover:bg-brand-blue text-white font-extrabold text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm group-hover:scale-[1.02]"
                      >
                        <Megaphone className="w-3.5 h-3.5 text-amber-400" />
                        <span>+ Add Your Slot Here</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. HOW SPONSORS PAY (EVERY MONTH BILLING & PAYMENT METHODS) */}
        <div className="mt-14 bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-extrabold uppercase tracking-widest text-brand-blue">
              Simple, Transparent Partnership Terms
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              Paano Magbayad ang Sponsor? (Billing & Payment Terms)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
              Walang hidden charges at walang long-term lock-in contract. Narito kung paano gumagana ang buwanang sponsorship:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1: 14-Day Free Trial */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4 font-black text-sm">
                01
              </div>
              <h4 className="font-extrabold text-base text-slate-900 mb-1">
                14-Day Free Trial Muna
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Libre po ang unang dalawang linggo (14 days). Ilalagay ang inyong banner, picture, at links sa website para makita ninyo ang dating ng mga inquiries mula sa mga bumibisitang biyahero.
              </p>
            </div>

            {/* Step 2: Bayad Kada Buwan (₱3,000/month) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-brand-blue flex items-center justify-center mb-4 font-black text-sm">
                02
              </div>
              <h4 className="font-extrabold text-base text-slate-900 mb-1">
                Bayad Kada Buwan (₱3,000/mo)
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kung nagustuhan ninyo ang exposure, <strong>₱3,000 lamang po bawat buwan (monthly recurring)</strong>. Walang komisyon sa inyong room bookings, dining receipts, o benta. Lahat ng benta ninyo ay sa inyo 100%.
              </p>
            </div>

            {/* Step 3: Convenient Payment Channels */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 font-black text-sm">
                03
              </div>
              <h4 className="font-extrabold text-base text-slate-900 mb-1">
                Madaling Paraan ng Pagbabayad
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Maaaring magbayad buwan-buwan via <strong>GCash, Maya, BDO/BPI Bank Transfer</strong>, o Cash sa Custoworks garage sa Carnation St. Naga na may kasamang Official Billing Statement.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar className="w-4 h-4 text-brand-blue shrink-0" />
              <span><strong>Month-to-month subscription:</strong> Puwedeng i-renew o ihinto anumang buwan nang walang penalty.</span>
            </div>
            <button
              onClick={() => {
                resetForm();
                setInquiryModalOpen(true);
              }}
              className="bg-brand-blue hover:bg-blue-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5"
            >
              <span>Mag-inquire ng Banner Slot</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Interactive Modal: Direct Sponsor Application & Payment Terms */}
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
                  <h4 className="text-2xl font-black text-slate-900">Application Received!</h4>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    Salamat, <strong>{formData.contactPerson || 'Partner'}</strong>! Na-receive na po namin ang inyong sponsor application para sa <strong>{formData.businessName || 'inyong negosyo'}</strong>. Makikipag-ugnayan po kami sa inyo via WhatsApp/phone sa loob ng 24 oras para sa inyong 14-day free trial banner.
                  </p>

                  <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                    <a
                      href={`https://wa.me/639617225326?text=${encodeURIComponent(
                        `Hi Custoworks! Nag-submit po ako ng Sponsor Banner application para sa ${formData.businessName} (${formData.contactPerson}). Nais po naming i-activate ang aming 14-day free trial banner!`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs px-6 py-3 rounded-xl shadow-md flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Fast-Track sa WhatsApp Dispatch</span>
                    </a>
                    <button
                      onClick={() => setInquiryModalOpen(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-5 py-3 rounded-xl transition-all"
                    >
                      Isara ang Window
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} className="space-y-4">
                  
                  {/* Free Trial & Monthly Pricing Banner */}
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-900 space-y-1">
                    <div className="flex items-center gap-2 font-black text-amber-950">
                      <span>🎁 14-Day Free Trial Muna</span>
                      <span className="text-[10px] bg-amber-200 px-2 py-0.5 rounded-full font-bold">Walang Bayad Upfront</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-snug">
                      Pagkatapos ng 14 days, flat <strong>₱3,000 bawat buwan (monthly recurring)</strong>. Puwedeng bayaran via GCash, Maya, BDO/BPI, o Cash. Walang lock-in contract!
                    </p>
                  </div>

                  {/* Selected Slot Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Target Banner Slot
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formData.placementSlot}
                      className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-brand-navy"
                    />
                  </div>

                  {/* Business & Contact Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Pangalan ng Negosyo / Hotel *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="hal. Villa Caceres / Local Cafe"
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
                        placeholder="hal. Juan Dela Cruz"
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
                        Mobile / WhatsApp / Viber *
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
                        placeholder="partner@business.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-brand-blue focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Proposed Perk & Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Special Offer o Discount para sa Car Renters (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="hal. 10% off room rate, libreng kape, o ₱100 off dining"
                      value={formData.proposedPerk}
                      onChange={(e) => setFormData({ ...formData, proposedPerk: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-brand-blue focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Website / Facebook Page Link & Karagdagang Mensahe
                    </label>
                    <textarea
                      rows={2}
                      placeholder="I-paste ang link ng inyong Facebook page o website..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-brand-blue focus:outline-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full bg-brand-navy hover:bg-slate-800 text-white font-black text-xs sm:text-sm py-3.5 rounded-xl shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 transition-all"
                    >
                      <Megaphone className="w-4 h-4 text-amber-400" />
                      <span>Simulan ang 14-Day Free Trial Banner</span>
                    </button>
                    <p className="text-[11px] text-center text-slate-400 mt-2">
                      May katanungan? Tumawag o mag-text sa dispatch: <strong className="text-slate-700">0961 722 5326</strong>.
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
