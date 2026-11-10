import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  Plane,
  Car,
  CheckCircle,
  ArrowRight,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';

// Fix Leaflet default icon URLs in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored SVG pin markers
const createPinIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="display:flex; flex-direction:column; align-items:center; transform:translate(-50%, -100%);">
        <div style="background:${color}; color:white; font-size:10px; font-weight:900; padding:2px 8px; border-radius:12px; box-shadow:0 2px 6px rgba(0,0,0,0.3); white-space:nowrap; border:2px solid white;">
          ${label}
        </div>
        <div style="width:14px; height:14px; background:${color}; border:2px solid white; border-radius:50%; box-shadow:0 2px 4px rgba(0,0,0,0.3); margin-top:-2px;"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

export interface LocationPoint {
  name: string;
  lat: number;
  lng: number;
  isPreset?: boolean;
}

export const POPULAR_LOCATIONS: LocationPoint[] = [
  { name: 'Naga City Centro / SM City', lat: 13.6218, lng: 123.1948, isPreset: true },
  { name: 'Naga Airport (WNP / Pili)', lat: 13.5843, lng: 123.2755, isPreset: true },
  { name: 'Bicol International Airport (BIA / Daraga)', lat: 13.1118, lng: 123.6841, isPreset: true },
  { name: 'Legazpi City / Albay', lat: 13.1391, lng: 123.7438, isPreset: true },
  { name: 'Pili Capital / CamSur', lat: 13.5833, lng: 123.2833, isPreset: true },
  { name: 'Daet / Camarines Norte', lat: 14.1167, lng: 122.95, isPreset: true },
  { name: 'Sorsogon City / Matnog', lat: 12.9742, lng: 124.0058, isPreset: true },
  { name: 'Metro Manila (NAIA / Cubao)', lat: 14.5995, lng: 120.9842, isPreset: true },
];

// Calculate distance in KM using Haversine formula
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightKm = R * c;
  // Multiply by road curvature factor (~1.25x in mountainous/provincial PH roads)
  return Math.round(straightKm * 1.25);
}

// Compute official or dynamic fare
export function computeTransferFare(
  pickup: LocationPoint,
  drop: LocationPoint,
  category: 'SEDAN' | 'SUV_MPV' | 'VAN',
): { distanceKm: number; estHours: number; price: number; isFixedRoute: boolean; routeTitle: string } {
  const distanceKm = calculateDistanceKm(pickup.lat, pickup.lng, drop.lat, drop.lng);
  const estHours = Math.max(0.5, Math.round((distanceKm / 45) * 10) / 10); // ~45 km/h avg speed

  const pName = pickup.name.toLowerCase();
  const dName = drop.name.toLowerCase();

  const isBiaTransfer =
    (pName.includes('bia') || pName.includes('bicol intl') || dName.includes('bia') || dName.includes('bicol intl')) &&
    (pName.includes('naga') || dName.includes('naga'));

  const isNagaAirportTransfer =
    (pName.includes('naga airport') || dName.includes('naga airport') || pName.includes('wnp') || dName.includes('wnp')) &&
    (pName.includes('naga') || dName.includes('naga') || pName.includes('centro') || dName.includes('centro'));

  // 1. Official BIA Airport Transfer (Naga <-> BIA Daraga)
  if (isBiaTransfer) {
    const price = category === 'VAN' ? 7500 : category === 'SUV_MPV' ? 6000 : 4500;
    return {
      distanceKm: 95,
      estHours: 2.0,
      price,
      isFixedRoute: true,
      routeTitle: 'Naga ⇄ Bicol International Airport (BIA / Daraga)',
    };
  }

  // 2. Official Naga Airport Transfer (Naga <-> Pili Airport)
  if (isNagaAirportTransfer) {
    const price = category === 'VAN' ? 3500 : category === 'SUV_MPV' ? 2500 : 1800;
    return {
      distanceKm: 15,
      estHours: 0.5,
      price,
      isFixedRoute: true,
      routeTitle: 'Naga City ⇄ Naga Airport (WNP / Pili)',
    };
  }

  // 3. Dynamic Point-to-Point Pin Distance Rate
  let baseFare = 1500;
  let perKmRate = 30;
  if (category === 'SUV_MPV') {
    baseFare = 2000;
    perKmRate = 40;
  } else if (category === 'VAN') {
    baseFare = 3000;
    perKmRate = 50;
  }

  const billableKm = Math.max(0, distanceKm - 15);
  const price = Math.round((baseFare + billableKm * perKmRate) / 100) * 100;

  return {
    distanceKm,
    estHours,
    price,
    isFixedRoute: false,
    routeTitle: `${pickup.name} ➔ ${drop.name}`,
  };
}

interface PointToPointTransferMapProps {
  vehicles: any[];
  selectedVehicleId: string;
  onSelectVehicleId: (id: string) => void;
  onConfirmTransfer: (data: {
    pickup: LocationPoint;
    drop: LocationPoint;
    vehicleId: string;
    distanceKm: number;
    price: number;
  }) => void;
}

export const PointToPointTransferMap: React.FC<PointToPointTransferMapProps> = ({
  vehicles,
  selectedVehicleId,
  onSelectVehicleId,
  onConfirmTransfer,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  const [pickup, setPickup] = useState<LocationPoint>(POPULAR_LOCATIONS[0]); // Naga City Centro
  const [drop, setDrop] = useState<LocationPoint>(POPULAR_LOCATIONS[2]); // BIA Airport
  const [pinMode, setPinMode] = useState<'PICKUP' | 'DROP'>('DROP');

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
  const category: 'SEDAN' | 'SUV_MPV' | 'VAN' =
    selectedVehicle?.category === 'VAN'
      ? 'VAN'
      : selectedVehicle?.category === 'SUV_MPV'
      ? 'SUV_MPV'
      : 'SEDAN';

  const fareDetails = computeTransferFare(pickup, drop, category);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [13.4, 123.45],
      zoom: 9,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    // Initial Markers
    const pMarker = L.marker([pickup.lat, pickup.lng], {
      icon: createPinIcon('#10b981', '📍 PICK-UP'),
      draggable: true,
    }).addTo(map);

    const dMarker = L.marker([drop.lat, drop.lng], {
      icon: createPinIcon('#ef4444', '🏁 DROP-OFF'),
      draggable: true,
    }).addTo(map);

    const line = L.polyline(
      [
        [pickup.lat, pickup.lng],
        [drop.lat, drop.lng],
      ],
      { color: '#2563eb', weight: 4, dashArray: '6, 8', opacity: 0.85 },
    ).addTo(map);

    // Marker drag handlers
    pMarker.on('dragend', () => {
      const pos = pMarker.getLatLng();
      setPickup({ name: 'Pinned Pick-up Location', lat: pos.lat, lng: pos.lng });
    });

    dMarker.on('dragend', () => {
      const pos = dMarker.getLatLng();
      setDrop({ name: 'Pinned Drop-off Location', lat: pos.lat, lng: pos.lng });
    });

    // Map click handler (sets active pin mode)
    map.on('click', (e) => {
      if (pinMode === 'PICKUP') {
        pMarker.setLatLng(e.latlng);
        setPickup({ name: 'Custom Pinned Pick-up', lat: e.latlng.lat, lng: e.latlng.lng });
      } else {
        dMarker.setLatLng(e.latlng);
        setDrop({ name: 'Custom Pinned Drop-off', lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });

    pickupMarkerRef.current = pMarker;
    dropMarkerRef.current = dMarker;
    polylineRef.current = line;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers and polyline when points change
  useEffect(() => {
    if (!pickupMarkerRef.current || !dropMarkerRef.current || !polylineRef.current || !mapInstanceRef.current) return;

    pickupMarkerRef.current.setLatLng([pickup.lat, pickup.lng]);
    dropMarkerRef.current.setLatLng([drop.lat, drop.lng]);
    polylineRef.current.setLatLngs([
      [pickup.lat, pickup.lng],
      [drop.lat, drop.lng],
    ]);

    const bounds = L.latLngBounds([
      [pickup.lat, pickup.lng],
      [drop.lat, drop.lng],
    ]);
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }, [pickup, drop]);

  // Locate current position
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLoc: LocationPoint = {
          name: 'Your Current Location (GPS)',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setPickup(userLoc);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([userLoc.lat, userLoc.lng], 13);
        }
      },
      () => {
        alert('Unable to retrieve your current location. Please tap/drag on the map.');
      },
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-5 rounded-3xl shadow-lg border border-blue-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Point-to-Point Shuttle & Airport Transfer
          </span>
          <h2 className="text-xl md:text-2xl font-black">Interactive Route & Fare Estimator</h2>
          <p className="text-xs text-blue-100 mt-1 max-w-xl leading-relaxed">
            Choose your pick-up point and drop-off destination by tapping the map, dragging the pins, or choosing from popular hubs. Transparent official rates!
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 text-center shrink-0">
          <span className="text-[11px] text-blue-200 block font-semibold">Transfer Fare</span>
          <span className="text-2xl md:text-3xl font-black text-amber-300">₱{fareDetails.price.toLocaleString()}</span>
          <span className="text-[10px] text-blue-200 block font-bold">{fareDetails.distanceKm} km · Dedicated Chauffeur</span>
        </div>
      </div>

      {/* Main Map & Route Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Map */}
        <div className="lg:col-span-2 space-y-3">
          {/* Map Pin Selector Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 p-2 rounded-2xl border border-slate-200 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700 ml-1">Pin Mode:</span>
              <button
                type="button"
                onClick={() => setPinMode('PICKUP')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all ${
                  pinMode === 'PICKUP'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" /> Tap Map for Pick-up
              </button>
              <button
                type="button"
                onClick={() => setPinMode('DROP')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all ${
                  pinMode === 'DROP'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" /> Tap Map for Drop-off
              </button>
            </div>

            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="px-3 py-1.5 bg-blue-50 text-brand-blue hover:bg-blue-100 border border-blue-200 rounded-xl font-bold flex items-center gap-1"
            >
              <Navigation className="w-3.5 h-3.5" /> Use My Location
            </button>
          </div>

          {/* Leaflet Map Container */}
          <div className="relative rounded-3xl overflow-hidden border-2 border-slate-300 shadow-md h-[420px] bg-slate-100">
            <div ref={mapContainerRef} className="w-full h-full z-10" />

            {/* Overlay hint */}
            <div className="absolute top-3 left-3 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-800 shadow-xs flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-brand-blue" />
              <span>Drag the 🟢 Green (Pickup) or 🔴 Red (Drop-off) pins anywhere</span>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-bold text-slate-700 block">Popular Transfer Destinations:</span>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setPickup(POPULAR_LOCATIONS[0]);
                  setDrop(POPULAR_LOCATIONS[2]); // BIA Airport
                }}
                className={`px-3 py-1.5 rounded-xl font-bold border transition-all flex items-center gap-1.5 ${
                  drop.name.includes('BIA') || drop.name.includes('Bicol')
                    ? 'bg-amber-100 text-amber-950 border-amber-300 ring-2 ring-amber-400'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Plane className="w-3.5 h-3.5 text-amber-600" /> BIA Airport (Daraga) · Sedan ₱4.5k
              </button>

              <button
                type="button"
                onClick={() => {
                  setPickup(POPULAR_LOCATIONS[0]);
                  setDrop(POPULAR_LOCATIONS[1]); // Naga Airport
                }}
                className={`px-3 py-1.5 rounded-xl font-bold border transition-all flex items-center gap-1.5 ${
                  drop.name.includes('Naga Airport')
                    ? 'bg-blue-100 text-blue-950 border-blue-300 ring-2 ring-blue-400'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Plane className="w-3.5 h-3.5 text-brand-blue" /> Naga Airport (Pili) · Sedan ₱1.8k
              </button>

              <button
                type="button"
                onClick={() => {
                  setPickup(POPULAR_LOCATIONS[0]);
                  setDrop(POPULAR_LOCATIONS[3]); // Legazpi
                }}
                className="px-3 py-1.5 rounded-xl font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              >
                🌋 Legazpi / Albay
              </button>

              <button
                type="button"
                onClick={() => {
                  setPickup(POPULAR_LOCATIONS[0]);
                  setDrop(POPULAR_LOCATIONS[5]); // Daet
                }}
                className="px-3 py-1.5 rounded-xl font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              >
                🏖️ Daet / CamNorte
              </button>

              <button
                type="button"
                onClick={() => {
                  setPickup(POPULAR_LOCATIONS[0]);
                  setDrop(POPULAR_LOCATIONS[6]); // Sorsogon
                }}
                className="px-3 py-1.5 rounded-xl font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              >
                🌊 Sorsogon / Matnog
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Route Details & Vehicle Rates */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Pick-up / Drop-off Summary */}
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 space-y-3 text-xs">
              <span className="font-extrabold text-slate-900 block text-sm">Transfer Route Summary</span>

              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black shrink-0 mt-0.5">
                    A
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Pick-up Location</span>
                    <p className="font-black text-slate-900">{pickup.name}</p>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {pickup.lat.toFixed(4)}, {pickup.lng.toFixed(4)}
                    </span>
                  </div>
                </div>

                <div className="border-l-2 border-dashed border-slate-300 ml-3 h-4" />

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-red-100 text-red-800 flex items-center justify-center font-black shrink-0 mt-0.5">
                    B
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Drop-off Destination</span>
                    <p className="font-black text-slate-900">{drop.name}</p>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {drop.lat.toFixed(4)}, {drop.lng.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Distance and Estimated Time Metrics */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-200 font-bold">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Distance</span>
                  <span className="text-base font-black text-slate-900">{fareDetails.distanceKm} km</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" /> Est. Time
                  </span>
                  <span className="text-base font-black text-slate-900">~{fareDetails.estHours} hrs</span>
                </div>
              </div>
            </div>

            {/* Vehicle Selection for Transfer */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Select Chauffeur Vehicle:</span>
              <div className="space-y-2">
                {vehicles.map((v) => {
                  const isSelected = v.id === selectedVehicle?.id;
                  const vCat = v.category === 'VAN' ? 'VAN' : v.category === 'SUV_MPV' ? 'SUV_MPV' : 'SEDAN';
                  const vFare = computeTransferFare(pickup, drop, vCat);

                  return (
                    <div
                      key={v.id}
                      onClick={() => onSelectVehicleId(v.id)}
                      className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between text-xs ${
                        isSelected
                          ? 'border-brand-blue bg-blue-50/70 shadow-sm ring-1 ring-brand-blue'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={v.imageUrl || '/logo.jpg'}
                          alt={v.name}
                          className="w-12 h-10 object-cover rounded-xl bg-slate-100"
                        />
                        <div>
                          <h4 className="font-black text-slate-900 text-xs">{v.name}</h4>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {v.seats} Seats · {v.transmission}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="block font-black text-sm text-brand-blue">
                          ₱{vFare.price.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {fareDetails.isFixedRoute ? 'Official Fixed Rate' : 'All-in Point Transfer'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() =>
                onConfirmTransfer({
                  pickup,
                  drop,
                  vehicleId: selectedVehicle.id,
                  distanceKm: fareDetails.distanceKm,
                  price: fareDetails.price,
                })
              }
              className="w-full py-3.5 px-4 bg-brand-blue hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <span>Continue with {selectedVehicle?.name || 'Transfer'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
