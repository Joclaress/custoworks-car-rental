import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Car, Phone, MapPin, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  const location = useLocation();

  // Hide customer footer on admin portal
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-brand-navy-dark border-t border-brand-navy-light/40 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: Company Profile */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo.jpg"
                alt="Custoworks Logo"
                className="w-12 h-12 rounded-xl object-contain bg-slate-900 border border-blue-400/40 p-0.5 shadow-md"
              />
              <div>
                <span className="font-extrabold text-lg tracking-wider text-white">CUSTOWORKS</span>
                <p className="text-[11px] text-blue-400 uppercase tracking-widest font-semibold">Car Rental Services</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Your premier, trusted car rental partner in Naga City and the Bicol Region. Offering reliable, well-maintained vehicles for self-drive adventures and stress-free with-driver executive rentals.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" /> Official Business in Naga City, CamSur
            </div>
          </div>

          {/* Column 2: Official Contact Information */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Business Contact</h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">0961 722 5326 <span className="text-slate-400 font-normal text-[11px]">(Primary)</span></p>
                  <p className="font-semibold text-white">0995 382 7972 <span className="text-slate-400 font-normal text-[11px]">(Secondary)</span></p>
                  <p className="text-blue-300 text-xs mt-0.5">custoworks1@gmail.com</p>
                  <p className="text-slate-500 text-[11px]">Call / SMS (24/7 Hotline)</p>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <a
                    href="https://maps.app.goo.gl/4TTUTX5HJfwdNfdW7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <p className="text-white font-medium group-hover:text-blue-300 group-hover:underline transition-colors">
                      Carnation Street CBD II, Brgy. Triangulo (Beside SM)
                    </p>
                    <p className="text-slate-400 text-xs group-hover:text-slate-300">Naga City, Philippines, 4400 (View on Google Maps)</p>
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-blue-400 shrink-0 mt-0.5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <div>
                  <a
                    href="https://www.facebook.com/CustoWorkss"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-blue-400 transition-colors font-medium underline"
                  >
                    Custoworks Car Rental
                  </a>
                  <p className="text-slate-500">facebook.com/CustoWorkss</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Navigation */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/vehicles" className="hover:text-blue-400 transition-colors">
                  View Rental Vehicles
                </Link>
              </li>
              <li>
                <Link to="/rates" className="hover:text-blue-400 transition-colors">
                  Official Rate Cards & Pricelist
                </Link>
              </li>
              <li>
                <Link to="/#process" className="hover:text-blue-400 transition-colors">
                  How It Works & Process
                </Link>
              </li>
              <li>
                <Link to="/#requirements" className="hover:text-blue-400 transition-colors">
                  Self-Drive Requirements (LTMS)
                </Link>
              </li>
              <li>
                <Link to="/partner" className="text-amber-300 hover:text-amber-200 transition-colors font-bold flex items-center gap-1.5">
                  <span>Become a Partner (80% Net)</span>
                  <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full">NEW</span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-blue-400 transition-colors font-medium text-slate-300">
                  24/7 Support & Contact
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-blue-400 transition-colors font-medium text-blue-300">
                  Track Reservation (Reference #)
                </Link>
              </li>
              <li className="pt-2 border-t border-slate-800">
                <Link to="/login" className="text-slate-500 hover:text-slate-300 transition-colors text-[11px]">
                  Staff / Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Key Policies */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Rental Policies</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>₱1,000 reservation fee required to block schedule.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>Non-refundable on cancel; reschedule permitted only.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>Serves as refundable deposit after unit return.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>Full rental balance collected upon vehicle release.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>LTMS portal QR code required for self-drive.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>12h, 24h, weekly, and monthly rates available.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>© {new Date().getFullYear()} CUSTOWORKS CAR RENTAL – Naga City, Camarines Sur. All rights reserved.</p>
          <div className="flex gap-6 text-slate-500">
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
            <span>LTMS Compliance</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
