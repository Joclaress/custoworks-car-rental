import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Vehicle } from '../types';
import { InteractiveCalendar } from '../components/InteractiveCalendar';
import { formatPeso } from '../lib/utils';
import {
  Users,
  Gauge,
  Fuel,
  ShieldCheck,
  Check,
  ArrowRight,
  Calendar,
  FileCheck2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

export const VehicleDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [activeRentalType, setActiveRentalType] = useState<'SELF_DRIVE' | 'WITH_DRIVER'>('SELF_DRIVE');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const res = await api.get<{ vehicle: Vehicle }>(`/vehicles/slug/${slug}`);
        setVehicle(res.vehicle);
        const primary = res.vehicle.images.find((i) => i.isPrimary)?.url || res.vehicle.images[0]?.url || '/images/hero.jpg';
        setSelectedImage(primary);

        if (!res.vehicle.allowSelfDrive && res.vehicle.allowWithDriver) {
          setActiveRentalType('WITH_DRIVER');
        }

        // Fetch vehicle availability events
        const calRes = await api.get<{ events: any[] }>(`/calendar/vehicle/${res.vehicle.id}`);
        setCalendarEvents(calRes.events);
      } catch (err) {
        console.error('Failed to load vehicle details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicle();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-blue" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-center p-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Vehicle Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">The requested vehicle does not exist or has been unpublished.</p>
          <Link to="/vehicles" className="mt-4 inline-block bg-brand-blue text-white px-4 py-2 rounded-xl text-xs font-bold">
            Back to Fleet
          </Link>
        </div>
      </div>
    );
  }

  // Filter rates for active rental type
  const currentRates = vehicle.rates?.filter((r) => r.rentalType === activeRentalType) || [];

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Breadcrumb & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <Link to="/" className="hover:text-brand-blue">Home</Link>
              <span>/</span>
              <Link to="/vehicles" className="hover:text-brand-blue">Fleet</Link>
              <span>/</span>
              <span className="text-slate-700">{vehicle.name}</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 mt-1 flex items-center gap-3">
              {vehicle.name}
              <span className="text-xs bg-brand-navy text-white px-3 py-1 rounded-full uppercase tracking-wider font-bold">
                {vehicle.category.replace('_', '/')}
              </span>
            </h1>
          </div>

          <Link
            to={`/book?vehicleId=${vehicle.id}`}
            className="inline-flex items-center justify-center gap-2 bg-brand-blue hover:bg-blue-600 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all"
          >
            Book This Vehicle <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Gallery & Quick Specs Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Photo & Thumbnails */}
          <div className="lg:col-span-7 space-y-4">
            <div className="aspect-[16/10] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <img
                src={selectedImage}
                alt={vehicle.name}
                className="w-full h-full object-cover"
              />
            </div>
            {vehicle.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {vehicle.images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img.url)}
                    className={`w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === img.url ? 'border-brand-blue scale-105 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <h3 className="font-bold text-base text-slate-900 mb-2">Vehicle Overview</h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {vehicle.description || 'Reliable and comfortable rental vehicle prepared to highest cleanliness and mechanical safety standards.'}
              </p>

              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 mt-6 mb-3">
                Key Features & Amenities
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {vehicle.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-slate-700">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Specs & Booking Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
              <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
                Specifications
              </h3>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-1">Transmission</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Gauge className="w-4 h-4 text-brand-blue" />
                    <span>{vehicle.transmission === 'AT' ? 'Automatic (AT)' : 'Manual (MT)'}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-1">Passenger Capacity</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Users className="w-4 h-4 text-brand-blue" />
                    <span>{vehicle.seats} Passengers</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-1">Fuel Type</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Fuel className="w-4 h-4 text-brand-blue" />
                    <span>{vehicle.fuelType || 'Gasoline'}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-1">Plate / Model</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>{vehicle.model} {vehicle.year || ''}</span>
                  </div>
                </div>
              </div>

              {/* Reservation Fee Note */}
              <div className="bg-blue-50/70 border border-blue-200/60 rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-brand-navy">
                  <ShieldCheck className="w-4 h-4 text-brand-blue" />
                  <span>Guaranteed Booking Policy</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  A <strong>₱1,000 reservation fee</strong> is required to lock your dates on the calendar. Reservation fees are strictly non-refundable upon cancellation (rescheduling permitted only), and the fee serves as your security deposit, refundable after returning the unit in clean condition.
                </p>
              </div>

              <Link
                to={`/book?vehicleId=${vehicle.id}`}
                className="w-full bg-brand-blue hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 text-center block text-sm transition-all"
              >
                Proceed to Online Booking
              </Link>
            </div>

            {/* Rental Requirements Checklist */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 mb-3">
                <FileCheck2 className="w-4 h-4 text-brand-blue" /> Required Documents (Self-Drive)
              </h3>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-blue mt-1.5 shrink-0" />
                  <span><strong>LTMS Portal QR Code</strong> (digital screenshot from LTO)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-blue mt-1.5 shrink-0" />
                  <span><strong>Digital Driver's License</strong> screenshot from LTMS</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-blue mt-1.5 shrink-0" />
                  <span><strong>Physical Driver's License</strong> clear photo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-blue mt-1.5 shrink-0" />
                  <span><strong>1 Valid Secondary ID</strong> (Passport, SSS, PhilHealth, PRC)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-blue mt-1.5 shrink-0" />
                  <span><strong>Selfie with Physical License</strong> held beside face</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Official Rate Matrix Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
            <div>
              <h3 className="font-bold text-lg text-slate-900">Official Rental Rates</h3>
              <p className="text-xs text-slate-500">Official reference rate cards for {vehicle.name}</p>
            </div>

            {/* Rental Type Switcher */}
            <div className="flex gap-2">
              {vehicle.allowSelfDrive && (
                <button
                  onClick={() => setActiveRentalType('SELF_DRIVE')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeRentalType === 'SELF_DRIVE'
                      ? 'bg-brand-navy text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Self Drive Rates
                </button>
              )}
              {vehicle.allowWithDriver && (
                <button
                  onClick={() => setActiveRentalType('WITH_DRIVER')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeRentalType === 'WITH_DRIVER'
                      ? 'bg-brand-navy text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  With Driver Rates
                </button>
              )}
            </div>
          </div>

          {currentRates.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No published rates for this option yet. Inquire directly.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Destination</th>
                    <th className="py-3 px-4">Duration Plan</th>
                    <th className="py-3 px-4">Rate (PHP)</th>
                    <th className="py-3 px-4">Unit</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {currentRates.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{r.destination?.name || '-'}</td>
                      <td className="py-3 px-4 font-medium text-brand-blue">{r.duration.replace(/_/g, ' ')}</td>
                      <td className="py-3 px-4 font-extrabold text-slate-900 text-sm">
                        {r.amount ? formatPeso(r.amount) : 'Inquire'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{r.duration === 'HOURS_12' ? 'Flat 12 Hours' : 'Per 24h Day'}</td>
                      <td className="py-3 px-4 text-slate-400">{r.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live Availability Interactive Calendar */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-blue" /> Vehicle Availability Calendar
              </h3>
              <p className="text-xs text-slate-500">
                Check booked and open dates before starting your reservation.
              </p>
            </div>
          </div>

          <InteractiveCalendar
            events={calendarEvents}
            vehicles={[vehicle]}
            selectedVehicleId={vehicle.id}
            readOnly={true}
          />
        </div>
      </div>
    </div>
  );
};

