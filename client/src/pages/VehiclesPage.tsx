import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Vehicle } from '../types';
import { VehicleCard } from '../components/VehicleCard';
import { Search, Filter, RotateCcw, Car, Calculator, ArrowRight } from 'lucide-react';
import { MapRouteAdsCarousel } from '../components/MapRouteAdsCarousel';

export const VehiclesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [transmission, setTransmission] = useState(searchParams.get('transmission') || '');
  const [rentalType, setRentalType] = useState(searchParams.get('rentalType') || '');
  const [pickupAt, setPickupAt] = useState(searchParams.get('pickupAt') || '');
  const [returnAt, setReturnAt] = useState(searchParams.get('returnAt') || '');

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.set('search', search);
      if (category) q.set('category', category);
      if (transmission) q.set('transmission', transmission);
      if (rentalType) q.set('rentalType', rentalType);
      if (pickupAt) q.set('availableFrom', pickupAt);
      if (returnAt) q.set('availableTo', returnAt);

      const res = await api.get<{ data: Vehicle[] }>(`/vehicles?${q.toString()}`);
      setVehicles(res.data);
    } catch (err) {
      console.error('Failed to load fleet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [category, transmission, rentalType, pickupAt, returnAt]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVehicles();
  };

  const resetFilters = () => {
    setSearch('');
    setCategory('');
    setTransmission('');
    setRentalType('');
    setPickupAt('');
    setReturnAt('');
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-brand-blue">
              Naga City Fleet
            </span>
            <h1 className="text-3xl font-black text-slate-900 mt-1">Rental Vehicles & Fleet</h1>
            <p className="text-sm text-slate-500 mt-1">
              Choose from our clean, modern sedans, 7-seater MPVs, and 15-passenger vans.
            </p>
          </div>
          <Link
            to="/rates"
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all"
          >
            <Calculator className="w-4 h-4 text-brand-blue" />
            <span>Official Pricelist & Calculator</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>

        {/* Route Partners & Local Sponsor Ad Slots Carousel */}
        <div className="mb-8">
          <MapRouteAdsCarousel />
        </div>

        {/* Layout: Sidebar + Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filter Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-6 sticky top-28">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-brand-blue" /> Filter Fleet
                </span>
                <button
                  onClick={resetFilters}
                  className="text-xs text-slate-400 hover:text-brand-blue flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              {/* Keyword Search */}
              <form onSubmit={handleSearchSubmit}>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Search Vehicle
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="e.g. Vios, Innova, Xpander..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-blue focus:outline-none"
                  />
                  <button type="submit" className="absolute right-2.5 top-2.5 text-slate-400 hover:text-brand-blue">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Rental Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Rental Option
                </label>
                <div className="space-y-1.5 text-xs">
                  {[
                    { id: '', label: 'All Options' },
                    { id: 'SELF_DRIVE', label: 'Self Drive (LTMS)' },
                    { id: 'WITH_DRIVER', label: 'With Driver' },
                  ].map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50"
                    >
                      <input
                        type="radio"
                        name="rentalType"
                        checked={rentalType === item.id}
                        onChange={() => setRentalType(item.id)}
                        className="text-brand-blue focus:ring-brand-blue"
                      />
                      <span className="text-slate-700 font-medium">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Vehicle Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Category
                </label>
                <div className="space-y-1.5 text-xs">
                  {[
                    { id: '', label: 'All Categories' },
                    { id: 'SEDAN', label: 'Sedans (Mirage / Vios 2025)' },
                    { id: 'SUV_MPV', label: 'SUV / MPV (Xpander / Innova)' },
                    { id: 'VAN', label: 'Passenger Van (NV350)' },
                  ].map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50"
                    >
                      <input
                        type="radio"
                        name="category"
                        checked={category === item.id}
                        onChange={() => setCategory(item.id)}
                        className="text-brand-blue focus:ring-brand-blue"
                      />
                      <span className="text-slate-700 font-medium">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Transmission */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Transmission
                </label>
                <div className="space-y-1.5 text-xs">
                  {[
                    { id: '', label: 'Any Transmission' },
                    { id: 'AT', label: 'Automatic (AT)' },
                    { id: 'MT', label: 'Manual (MT)' },
                  ].map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50"
                    >
                      <input
                        type="radio"
                        name="transmission"
                        checked={transmission === item.id}
                        onChange={() => setTransmission(item.id)}
                        className="text-brand-blue focus:ring-brand-blue"
                      />
                      <span className="text-slate-700 font-medium">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Availability Filter Dates */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Check Schedule Availability
                </label>
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-slate-400">Pick-up</span>
                    <input
                      type="datetime-local"
                      value={pickupAt ? pickupAt.slice(0, 16) : ''}
                      onChange={(e) => setPickupAt(e.target.value ? new Date(e.target.value).toISOString() : '')}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-brand-blue focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Return</span>
                    <input
                      type="datetime-local"
                      value={returnAt ? returnAt.slice(0, 16) : ''}
                      onChange={(e) => setReturnAt(e.target.value ? new Date(e.target.value).toISOString() : '')}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-brand-blue focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Listing Grid */}
          <div className="lg:col-span-3">
            {loading && vehicles.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-96 bg-slate-200 rounded-2xl" />
                ))}
              </div>
            ) : vehicles.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No vehicles match your criteria</h3>
                <p className="text-xs text-slate-500 mt-1">Try resetting filters or picking different dates.</p>
                <button
                  onClick={resetFilters}
                  className="mt-4 bg-brand-blue text-white text-xs font-bold px-4 py-2 rounded-xl"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-200 ${loading ? 'opacity-60' : 'opacity-100'}`}>
                {vehicles.map((v) => (
                  <VehicleCard key={v.id} vehicle={v} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

