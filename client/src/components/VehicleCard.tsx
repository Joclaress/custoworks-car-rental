import React from 'react';
import { Link } from 'react-router-dom';
import { Vehicle } from '../types';
import { formatPeso } from '../lib/utils';
import { Users, Gauge, Fuel, Check, ArrowRight } from 'lucide-react';

export const VehicleCard: React.FC<{ vehicle: Vehicle }> = ({ vehicle }) => {
  const primaryImg = vehicle.images?.find((img) => img.isPrimary)?.url || vehicle.images?.[0]?.url || '/images/hero.jpg';

  const selfDriveRate = vehicle.startingRates?.SELF_DRIVE;
  const withDriverRate = vehicle.startingRates?.WITH_DRIVER;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group">
      {/* Vehicle Image Container */}
      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
        <img
          src={primaryImg}
          alt={vehicle.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="bg-brand-navy/90 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow">
            {vehicle.category.replace('_', '/')}
          </span>
          {vehicle.isFeatured && (
            <span className="bg-amber-500 text-slate-950 text-[11px] font-extrabold px-2 py-1 rounded-md tracking-wider shadow">
              FEATURED
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-white/95 backdrop-blur-md text-slate-800 font-bold text-xs px-2.5 py-1 rounded-md shadow-sm border border-slate-200/60">
            {vehicle.transmission === 'AT' ? 'Automatic (AT)' : 'Manual (MT)'}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start gap-2 mb-2">
            <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-brand-blue transition-colors leading-tight">
              {vehicle.name}
            </h3>
            {vehicle.year && (
              <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                {vehicle.year}
              </span>
            )}
          </div>

          {/* Quick Specifications */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 my-3 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-blue-600" />
              <span>{vehicle.transmission}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              <span>{vehicle.seats} Seats</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Fuel className="w-4 h-4 text-blue-600" />
              <span>{vehicle.fuelType || 'Gas'}</span>
            </div>
          </div>

          {/* Rental Options & Highlights */}
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            {(vehicle as any).fleetCount > 1 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-900 bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200">
                {(vehicle as any).fleetCount} Units in Fleet ({(vehicle as any).availableFleetCount} Avail)
              </span>
            )}
            {vehicle.allowSelfDrive && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                <Check className="w-3 h-3" /> Self Drive
              </span>
            )}
            {vehicle.allowWithDriver && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                <Check className="w-3 h-3" /> With Driver
              </span>
            )}
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="pt-2">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 flex justify-between items-center">
            {vehicle.allowSelfDrive ? (
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Self-Drive from</p>
                <p className="text-base font-extrabold text-brand-navy">
                  {selfDriveRate ? formatPeso(selfDriveRate) : 'Inquire'}
                  <span className="text-xs font-normal text-slate-500"> /24h</span>
                </p>
              </div>
            ) : (
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Rental Type</p>
                <p className="text-xs font-bold text-slate-700">With Driver Only</p>
              </div>
            )}

            {vehicle.allowWithDriver && (
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">With Driver from</p>
                <p className="text-sm font-bold text-slate-800">
                  {withDriverRate ? formatPeso(withDriverRate) : 'Inquire'}
                  <span className="text-xs font-normal text-slate-500"> /24h</span>
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              to={`/vehicles/${vehicle.slug}`}
              className="text-center py-2.5 px-3 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              View Details
            </Link>
            <Link
              to={`/book?vehicleId=${vehicle.id}`}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-brand-blue hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all group-hover:bg-brand-navy"
            >
              Book Now <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

