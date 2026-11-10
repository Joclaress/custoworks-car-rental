import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  PhoneCall,
  Megaphone,
  CheckCircle,
  Building2,
  Utensils,
  Compass,
  ShoppingBag,
  X,
  Send,
} from 'lucide-react';

export interface RouteAdSlide {
  id: string;
  category: 'AUTOCARE' | 'HOTEL' | 'FOOD' | 'ADVENTURE' | 'RETAIL';
  categoryLabel: string;
  title: string;
  location: string;
  image: string;
  description: string;
  perk: string;
  isAvailable: boolean;
  businessName?: string;
  actionUrl?: string;
  phone?: string;
}

const ROUTE_AD_SLIDES: RouteAdSlide[] = [
  {
    id: 'custoworks-carwash',
    category: 'AUTOCARE',
    categoryLabel: 'Carwash & Detailing Partner',
    title: 'Custoworks Carwash and Detailing | Naga City',
    location: 'Beside SM City Naga, CBD II Triangulo',
    image: '/images/carwash.jpg',
    description: 'Snow foam wash, deep interior sanitization, and showroom detailing for your vehicle along your trip.',
    perk: '🎁 Free Tire Dressing & Priority Wash Lane for Custoworks Renters',
    isAvailable: false,
    businessName: 'Custoworks Carwash Naga',
    actionUrl: 'https://www.facebook.com/profile.php?id=61586727264046',
    phone: '0961 722 5326',
  },
  {
    id: 'ad-hotel-slot',
    category: 'HOTEL',
    categoryLabel: 'Hotel & Resort Partner Slot',
    title: 'Promote Your Hotel / Beach Resort on this Route',
    location: 'Naga City, Caramoan, or Albay',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    description: '5,000+ travelers rent cars and airport shuttles every month. Reach tourists needing rooms and villas.',
    perk: '📢 Available Route Ad Slot: 10% Off or Free Guest Parking Perk for Renters',
    isAvailable: true,
  },
  {
    id: 'ad-food-slot',
    category: 'FOOD',
    categoryLabel: 'Restaurant & Dining Pitstop Slot',
    title: 'Authentic Bicol Cuisine & Highway Travelers Pitstop',
    location: 'Magsaysay Ave, Centro Naga, or Maharlika Highway',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    description: 'Feature your restaurant, cafe, or grill to hungry tourists and families traversing provincial roads.',
    perk: '📢 Available Route Ad Slot: Free Appetizer or Special Discount for Renters',
    isAvailable: true,
  },
  {
    id: 'ad-adventure-slot',
    category: 'ADVENTURE',
    categoryLabel: 'Adventure & Tour Operator Slot',
    title: 'Caramoan Island Hopping & Mayon ATV Tours',
    location: 'Caramoan Peninsula, CWC Pili, or Mt. Mayon',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
    description: 'Connect directly with active adventurers who have rental vehicles and need outdoor tour packages.',
    perk: '📢 Available Route Ad Slot: Exclusive Tour Package Voucher for Renters',
    isAvailable: true,
  },
  {
    id: 'ad-pasalubong-slot',
    category: 'RETAIL',
    categoryLabel: 'Local Pasalubong & Delicacies Slot',
    title: 'Bicol Delicacies & Pili Nut Pasalubong Center',
    location: 'Naga City & Camarines Sur Hubs',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
    description: 'Every guest buys pili delicacies and native crafts before taking the plane or driving home.',
    perk: '📢 Available Route Ad Slot: 5% Off Pasalubong Box for Custoworks Renters',
    isAvailable: true,
  },
];

export const MapRouteAdsCarousel: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);
  const [inquiryBusinessName, setInquiryBusinessName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquirySlot, setInquirySlot] = useState('');

  // Auto-play slider every 5.5 seconds
  useEffect(() => {
    if (isPaused || isModalOpen) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % ROUTE_AD_SLIDES.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused, isModalOpen]);

  const slide = ROUTE_AD_SLIDES[currentSlide];

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % ROUTE_AD_SLIDES.length);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + ROUTE_AD_SLIDES.length) % ROUTE_AD_SLIDES.length);
  };

  const openInquiryForSlot = (slotTitle: string) => {
    setInquirySlot(slotTitle);
    setInquirySent(false);
    setIsModalOpen(true);
  };

  return (
    <div
      className="relative bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-3 sm:p-4 text-white shadow-md border border-blue-900/60 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Top Header & Pagination Indicator */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs">
        <div className="flex items-center gap-1.5 font-extrabold text-amber-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-[11px] uppercase tracking-wider">
            Route Partner Sponsors & Renter Perks
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-bold">
            Ad Slot {currentSlide + 1} of {ROUTE_AD_SLIDES.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              title="Previous Ad Slot"
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              title="Next Ad Slot"
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Slide Card */}
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 transition-all duration-300">
        {/* Slide Image */}
        <div className="relative w-full sm:w-28 sm:h-24 h-28 shrink-0 rounded-xl overflow-hidden bg-slate-800 border border-white/15">
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-1 left-1 bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded-md text-[9px] font-black uppercase text-amber-300">
            {slide.categoryLabel}
          </div>
        </div>

        {/* Slide Content */}
        <div className="flex-1 min-w-0 space-y-1 w-full text-left">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-black text-sm text-white truncate max-w-full">
              {slide.title}
            </h4>
            {!slide.isAvailable ? (
              <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                <CheckCircle className="w-3 h-3" /> Verified Partner
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                <Megaphone className="w-3 h-3" /> Open Sponsor Slot
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-300 line-clamp-1">
            📍 {slide.location} · {slide.description}
          </p>

          <div className="inline-block bg-blue-500/15 border border-blue-400/30 rounded-lg px-2.5 py-1 text-[11px] font-bold text-blue-200">
            {slide.perk}
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 w-full sm:w-auto">
          {!slide.isAvailable ? (
            <div className="flex items-center gap-2">
              {slide.phone && (
                <a
                  href={`tel:${slide.phone}`}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Call
                </a>
              )}
              {slide.actionUrl && (
                <a
                  href={slide.actionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs rounded-xl border border-white/20 flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Visit</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openInquiryForSlot(slide.title)}
              className="w-full sm:w-auto px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-400/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Sponsor This Slot</span>
            </button>
          )}
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="flex items-center justify-center gap-1.5 mt-2.5 pt-1.5">
        {ROUTE_AD_SLIDES.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentSlide(idx)}
            title={`Slide ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              idx === currentSlide ? 'w-5 bg-amber-400' : 'w-1.5 bg-white/25 hover:bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Sponsor Slot Inquiry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-xl bg-blue-100 text-brand-blue flex items-center justify-center font-black">
                📢
              </span>
              <div>
                <h3 className="font-black text-base text-slate-900">Place Your Ad on This Route</h3>
                <p className="text-[11px] text-slate-500">Reach thousands of active travelers & renters</p>
              </div>
            </div>

            {inquirySent ? (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center space-y-2 my-4">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-black text-sm text-emerald-950">Inquiry Received!</h4>
                <p className="text-xs text-emerald-800">
                  Our marketing team will call or message your phone within 15 minutes to activate your ad slot!
                </p>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="mt-2 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl"
                >
                  Close
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setInquirySent(true);
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Target Ad Slot:</label>
                  <input
                    type="text"
                    readOnly
                    value={inquirySlot}
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-600 outline-none"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Your Business Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Caramoan Breeze Beach Resort / Naga Grill"
                    value={inquiryBusinessName}
                    onChange={(e) => setInquiryBusinessName(e.target.value)}
                    className="w-full p-2.5 border-2 border-slate-200 focus:border-brand-blue rounded-xl font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Mobile / Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0917 123 4567"
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                    className="w-full p-2.5 border-2 border-slate-200 focus:border-brand-blue rounded-xl font-bold outline-none"
                  />
                </div>

                <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-[11px] text-blue-900">
                  <strong>Special Route Package:</strong> 14-day free trial on the map, then ₱1,500/month flat rate. Cancel anytime.
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-brand-blue hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Ad Placement</span>
                  </button>
                </div>
              </form>
            )}

            <div className="mt-4 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400">
              Or direct hotline: <strong>0961 722 5326 / 0995 382 7972</strong> · custoworks1@gmail.com
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
