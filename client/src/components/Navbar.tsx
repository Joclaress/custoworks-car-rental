import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Car, Menu, X, User as UserIcon, Calendar, LogOut, ShieldCheck, PhoneCall, Search, MapPin } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isStaff = user?.role === 'ADMIN' || user?.role === 'STAFF';

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Vehicles & Fleet', path: '/vehicles' },
    { label: 'Rates & Pricelist', path: '/rates' },
    { label: 'How It Works', path: '/#process' },
    { label: 'Become a Partner', path: '/partner', highlight: true },
    { label: 'Contact', path: '/#contact' },
  ];

  const handleLinkClick = (path: string, e: React.MouseEvent) => {
    setMobileMenuOpen(false);
    if (path.startsWith('/#')) {
      const targetId = path.replace('/#', '');
      if (location.pathname === '/') {
        e.preventDefault();
        const element = document.getElementById(targetId);
        if (element) {
          const navbarHeight = 80;
          const rect = element.getBoundingClientRect();
          const targetY = window.pageYOffset + rect.top - navbarHeight;
          window.scrollTo({
            top: targetY > 0 ? targetY : 0,
            behavior: 'smooth',
          });
          window.history.pushState(null, '', `/#${targetId}`);
        }
      }
    }
  };

  const isLinkActive = (path: string) => {
    if (path === '/') return location.pathname === '/' && !location.hash;
    if (path.startsWith('/#')) {
      const hash = path.replace('/', '');
      return location.pathname === '/' && location.hash === hash;
    }
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 bg-brand-navy border-b border-brand-navy-light/40 shadow-lg text-white">
      {/* Top Banner */}
      <div className="bg-brand-navy-dark text-slate-300 text-xs py-1.5 px-4 hidden md:block border-b border-white/5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium text-slate-200">
              <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
              0961 722 5326 / 0995 382 7972
            </span>
            <span className="text-slate-400">|</span>
            <a
              href="https://maps.app.goo.gl/4TTUTX5HJfwdNfdW7"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-300 transition-colors flex items-center gap-1 text-slate-300 hover:underline"
              title="Open Custoworks Garage in Google Maps"
            >
              <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
              <span>Carnation St. CBD II Brgy. Triangulo (Beside SM), Naga City</span>
            </a>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> LTMS Verified Self-Drive & With-Driver Rentals
            </span>
          </div>
        </div>
      </div>

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4 flex-nowrap">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
          <img
            src="/logo.jpg"
            alt="Custoworks Car Rental Logo"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-contain bg-slate-900 border border-blue-400/40 p-0.5 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg sm:text-xl tracking-wider text-white">CUSTOWORKS</span>
              <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold tracking-wider border border-blue-400/30">
                NAGA CITY
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-300 tracking-wider uppercase font-medium">Car Rental Services</p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-3 xl:gap-5 text-xs xl:text-sm font-semibold whitespace-nowrap">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              onClick={(e) => handleLinkClick(link.path, e)}
              className={`transition-all py-1 flex items-center gap-1.5 ${
                link.highlight
                  ? 'text-amber-300 hover:text-amber-200 font-extrabold bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-400/40'
                  : isLinkActive(link.path)
                  ? 'text-blue-400 font-bold border-b-2 border-blue-400'
                  : 'text-slate-200 hover:text-blue-300'
              }`}
            >
              {link.label}
              {link.highlight && (
                <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                  80% Earn
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* User CTA & Auth Buttons */}
        <div className="hidden md:flex items-center gap-2.5 sm:gap-3 shrink-0">
          {user ? (
            <div className="flex items-center gap-3">
              {isStaff ? (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm shadow-md transition-all"
                >
                  <ShieldCheck className="w-4 h-4" /> Admin Panel
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 bg-brand-blue/20 hover:bg-brand-blue/30 text-blue-300 border border-blue-400/30 px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  <Calendar className="w-4 h-4" /> My Bookings
                </Link>
              )}

              <div className="relative group">
                <button className="flex items-center gap-2 bg-white/10 hover:bg-white/15 px-3 py-2 rounded-lg text-sm font-medium text-white transition-all">
                  <UserIcon className="w-4 h-4 text-blue-400" />
                  <span className="max-w-[120px] truncate">{user.fullName.split(' ')[0]}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-2 hidden group-hover:block transition-all z-50">
                  <div className="px-4 py-2 border-b border-slate-800">
                    <p className="text-xs text-slate-400">Signed in as</p>
                    <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                  </div>
                  {!isStaff && (
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-white/10"
                    >
                      <Calendar className="w-4 h-4 text-blue-400" /> Booking Dashboard
                    </Link>
                  )}
                  {isStaff && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-white/10"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-400" /> Admin Console
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 text-left transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/track"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium text-sm px-3.5 py-2 rounded-lg border border-white/15 transition-all"
              >
                <Search className="w-4 h-4 text-blue-300" /> Track Booking
              </Link>
              <Link
                to="/book"
                className="inline-flex items-center justify-center bg-brand-blue hover:bg-blue-600 text-white font-bold text-sm px-4 py-2 rounded-lg shadow-md shadow-blue-600/30 transition-all"
              >
                Book Now
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-slate-300 hover:text-white rounded-lg focus:outline-none"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              onClick={(e) => handleLinkClick(link.path, e)}
              className={`flex items-center justify-between py-2 font-medium ${
                link.highlight
                  ? 'text-amber-300 font-bold bg-amber-400/10 px-2.5 rounded-lg border border-amber-400/30'
                  : isLinkActive(link.path)
                  ? 'text-blue-400 font-semibold'
                  : 'text-slate-300 hover:text-blue-400'
              }`}
            >
              <span>{link.label}</span>
              {link.highlight && (
                <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.5 rounded-full uppercase">
                  80% Payout
                </span>
              )}
            </Link>
          ))}
          <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
            {user ? (
              <>
                <div className="text-xs text-slate-400 px-1">
                  Signed in as <span className="text-white font-medium">{user.fullName}</span>
                </div>
                {isStaff ? (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center bg-amber-500 text-slate-950 font-bold py-2 rounded-lg"
                  >
                    Admin Console
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center bg-brand-blue text-white font-semibold py-2 rounded-lg"
                  >
                    My Bookings
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-center border border-rose-500/40 text-rose-400 py-2 rounded-lg font-medium"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  to="/track"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center border border-slate-700 text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4 text-blue-400" /> Track Booking
                </Link>
                <Link
                  to="/book"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center bg-brand-blue text-white font-bold py-2.5 rounded-lg text-sm shadow-md"
                >
                  Book Now
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

