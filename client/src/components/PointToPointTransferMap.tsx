import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  Plane,
  ArrowRight,
  Clock,
  Sparkles,
  Info,
  Search,
  X,
  Loader2,
  Route,
  ArrowUpDown,
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
      <div style="display:flex; flex-direction:column; align-items:center; transform:translate(-50%, -100%); pointer-events:auto;">
        <div style="background:${color}; color:white; font-size:11px; font-weight:900; padding:3px 9px; border-radius:14px; box-shadow:0 3px 8px rgba(0,0,0,0.35); white-space:nowrap; border:2px solid white; display:flex; align-items:center; gap:4px;">
          ${label}
        </div>
        <div style="width:14px; height:14px; background:${color}; border:2px solid white; border-radius:50%; box-shadow:0 2px 4px rgba(0,0,0,0.35); margin-top:-2px;"></div>
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
  { name: 'Caramoan Peninsula', lat: 13.7667, lng: 123.8667, isPreset: true },
  { name: 'Pili Capital / CamSur', lat: 13.5833, lng: 123.2833, isPreset: true },
  { name: 'Daet / Camarines Norte', lat: 14.1167, lng: 122.95, isPreset: true },
  { name: 'Sorsogon City / Matnog', lat: 12.9742, lng: 124.0058, isPreset: true },
  { name: 'Ragay, Camarines Sur', lat: 13.8181, lng: 122.7889, isPreset: true },
  { name: 'Metro Manila (NAIA / Cubao)', lat: 14.5995, lng: 120.9842, isPreset: true },
];

// Calculate distance in KM using Haversine formula (fallback)
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
  return Math.round(straightKm * 1.25);
}

// Compute official or dynamic fare with optional road distance override
export function computeTransferFare(
  pickup: LocationPoint,
  drop: LocationPoint,
  category: 'SEDAN' | 'SUV_MPV' | 'VAN',
  overrideDistanceKm?: number,
  overrideEstHours?: number,
): { distanceKm: number; estHours: number; price: number; isFixedRoute: boolean; routeTitle: string } {
  const distanceKm = overrideDistanceKm ?? calculateDistanceKm(pickup.lat, pickup.lng, drop.lat, drop.lng);
  const estHours =
    overrideEstHours ?? Math.max(0.5, Math.round((distanceKm / 45) * 10) / 10);

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

  // 3. Dynamic Point-to-Point Road Distance Rate
  let baseFare = 1500;
  let perKmRate = 26;
  if (category === 'SUV_MPV') {
    baseFare = 2000;
    perKmRate = 34;
  } else if (category === 'VAN') {
    baseFare = 3000;
    perKmRate = 42;
  }

  const billableKm = Math.max(0, distanceKm - 20);
  const price = Math.round((baseFare + billableKm * perKmRate) / 50) * 50;

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

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
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
  const roadCasingPolylineRef = useRef<L.Polyline | null>(null);
  const roadMainPolylineRef = useRef<L.Polyline | null>(null);

  const [pickup, setPickup] = useState<LocationPoint>(POPULAR_LOCATIONS[0]); // Naga City Centro
  const [drop, setDrop] = useState<LocationPoint>(POPULAR_LOCATIONS[2]); // BIA Airport
  const [pinMode, setPinMode] = useState<'PICKUP' | 'DROP'>('DROP');

  // Road Routing State (OSRM)
  const [isRouting, setIsRouting] = useState(false);
  const [roadCoordinates, setRoadCoordinates] = useState<[number, number][] | null>(null);
  const [roadDistanceKm, setRoadDistanceKm] = useState<number | null>(null);
  const [roadDurationHours, setRoadDurationHours] = useState<number | null>(null);

  // Address Search State
  const [pickupSearchQuery, setPickupSearchQuery] = useState('');
  const [dropSearchQuery, setDropSearchQuery] = useState('');
  const [pickupResults, setPickupResults] = useState<SearchResult[]>([]);
  const [dropResults, setDropResults] = useState<SearchResult[]>([]);
  const [isSearchingPickup, setIsSearchingPickup] = useState(false);
  const [isSearchingDrop, setIsSearchingDrop] = useState(false);
  const [showPickupDropdown, setShowPickupDropdown] = useState(false);
  const [showDropDropdown, setShowDropDropdown] = useState(false);

  const pickupSearchRef = useRef<HTMLDivElement>(null);
  const dropSearchRef = useRef<HTMLDivElement>(null);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
  const category: 'SEDAN' | 'SUV_MPV' | 'VAN' =
    selectedVehicle?.category === 'VAN'
      ? 'VAN'
      : selectedVehicle?.category === 'SUV_MPV'
      ? 'SUV_MPV'
      : 'SEDAN';

  const fareDetails = computeTransferFare(
    pickup,
    drop,
    category,
    roadDistanceKm ?? undefined,
    roadDurationHours ?? undefined,
  );

  // Close search dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (pickupSearchRef.current && !pickupSearchRef.current.contains(e.target as Node)) {
        setShowPickupDropdown(false);
      }
      if (dropSearchRef.current && !dropSearchRef.current.contains(e.target as Node)) {
        setShowDropDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Fetch real road route from OSRM driving service
  useEffect(() => {
    let active = true;
    const fetchRoadRoute = async () => {
      setIsRouting(true);

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error('OSRM routing service unavailable');
        const data = await res.json();

        if (active && data.code === 'Ok' && data.routes && data.routes[0]) {
          const route = data.routes[0];
          // OSRM provides [longitude, latitude] -> Leaflet requires [latitude, longitude]
          const latLngs: [number, number][] = route.geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]],
          );
          const distanceKm = Math.round(route.distance / 1000);
          const durationHours = Math.max(0.5, Math.round((route.duration / 3600) * 10) / 10);

          setRoadCoordinates(latLngs);
          setRoadDistanceKm(distanceKm);
          setRoadDurationHours(durationHours);
          setIsRouting(false);
          return;
        }
      } catch (err: any) {
        console.warn('OSRM road route fetch fallback to straight line:', err?.message || err);
      }

      if (active) {
        setRoadCoordinates(null);
        setRoadDistanceKm(null);
        setRoadDurationHours(null);
        setIsRouting(false);
      }
    };

    fetchRoadRoute();
    return () => {
      active = false;
    };
  }, [pickup.lat, pickup.lng, drop.lat, drop.lng]);

  // Geocoding Search handler (Nominatim - 100% Free OpenStreetMap)
  const searchNominatim = async (query: string, type: 'PICKUP' | 'DROP') => {
    if (!query || query.trim().length < 2) {
      if (type === 'PICKUP') setPickupResults([]);
      else setDropResults([]);
      return;
    }

    if (type === 'PICKUP') setIsSearchingPickup(true);
    else setIsSearchingDrop(true);

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query.trim(),
      )}&countrycodes=ph&limit=5&addressdetails=1`;

      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
        },
      });

      if (res.ok) {
        const list = await res.json();
        if (type === 'PICKUP') {
          setPickupResults(list);
          setShowPickupDropdown(true);
        } else {
          setDropResults(list);
          setShowDropDropdown(true);
        }
      }
    } catch (err) {
      console.warn('Nominatim search failed:', err);
    } finally {
      if (type === 'PICKUP') setIsSearchingPickup(false);
      else setIsSearchingDrop(false);
    }
  };

  // Debounced Search triggers
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pickupSearchQuery.trim()) {
        searchNominatim(pickupSearchQuery, 'PICKUP');
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [pickupSearchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (dropSearchQuery.trim()) {
        searchNominatim(dropSearchQuery, 'DROP');
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [dropSearchQuery]);

  // Select location from search results
  const handleSelectSearchResult = (result: SearchResult, type: 'PICKUP' | 'DROP') => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const shortName = result.display_name.split(',').slice(0, 2).join(',').trim();

    const newLoc: LocationPoint = {
      name: shortName || result.display_name,
      lat,
      lng,
      isPreset: false,
    };

    if (type === 'PICKUP') {
      setPickup(newLoc);
      setPickupSearchQuery(shortName);
      setShowPickupDropdown(false);
    } else {
      setDrop(newLoc);
      setDropSearchQuery(shortName);
      setShowDropDropdown(false);
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 13);
    }
  };

  // Swap pickup & dropoff
  const handleSwapLocations = () => {
    const oldP = pickup;
    const oldD = drop;
    setPickup(oldD);
    setDrop(oldP);
    setPickupSearchQuery(oldD.name);
    setDropSearchQuery(oldP.name);
  };

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

    // Outer glow casing line (for highway road appearance)
    const roadCasing = L.polyline(
      [
        [pickup.lat, pickup.lng],
        [drop.lat, drop.lng],
      ],
      { color: '#1e3a8a', weight: 8, opacity: 0.35 },
    ).addTo(map);

    // Main vibrant road line
    const roadMain = L.polyline(
      [
        [pickup.lat, pickup.lng],
        [drop.lat, drop.lng],
      ],
      { color: '#2563eb', weight: 5, opacity: 0.95 },
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
    roadCasingPolylineRef.current = roadCasing;
    roadMainPolylineRef.current = roadMain;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers, road polyline, and view bounds when coordinates or road geometry change
  useEffect(() => {
    if (
      !pickupMarkerRef.current ||
      !dropMarkerRef.current ||
      !roadMainPolylineRef.current ||
      !mapInstanceRef.current
    ) {
      return;
    }

    pickupMarkerRef.current.setLatLng([pickup.lat, pickup.lng]);
    dropMarkerRef.current.setLatLng([drop.lat, drop.lng]);

    // If real highway/road geometry is available from OSRM, render following the roads
    if (roadCoordinates && roadCoordinates.length > 0) {
      roadMainPolylineRef.current.setLatLngs(roadCoordinates);
      roadMainPolylineRef.current.setStyle({
        color: '#2563eb',
        weight: 5,
        opacity: 0.95,
        dashArray: undefined,
      });

      if (roadCasingPolylineRef.current) {
        roadCasingPolylineRef.current.setLatLngs(roadCoordinates);
        roadCasingPolylineRef.current.setStyle({
          color: '#1e3a8a',
          weight: 8,
          opacity: 0.4,
        });
      }

      const bounds = L.latLngBounds(roadCoordinates);
      mapInstanceRef.current.fitBounds(bounds, { padding: [45, 45], maxZoom: 14 });
    } else {
      // Fallback: straight dashed line
      const lineCoords: [number, number][] = [
        [pickup.lat, pickup.lng],
        [drop.lat, drop.lng],
      ];
      roadMainPolylineRef.current.setLatLngs(lineCoords);
      roadMainPolylineRef.current.setStyle({
        color: '#2563eb',
        weight: 4,
        dashArray: '6, 8',
        opacity: 0.85,
      });

      if (roadCasingPolylineRef.current) {
        roadCasingPolylineRef.current.setLatLngs(lineCoords);
      }

      const bounds = L.latLngBounds(lineCoords);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [pickup, drop, roadCoordinates]);

  // Locate current GPS position
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
        setPickupSearchQuery('Your Current Location (GPS)');
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([userLoc.lat, userLoc.lng], 13);
        }
      },
      () => {
        alert('Unable to retrieve your current location. Please tap or drag on the map.');
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
            Search places or drag the pins. The route follows the <strong>actual main highway and provincial roads</strong> with transparent chauffeur fares!
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 text-center shrink-0">
          <span className="text-[11px] text-blue-200 block font-semibold">Chauffeur Transfer Fare</span>
          <span className="text-2xl md:text-3xl font-black text-amber-300">₱{fareDetails.price.toLocaleString()}</span>
          <span className="text-[10px] text-blue-200 block font-bold">
            {fareDetails.distanceKm} km · {fareDetails.isFixedRoute ? 'Official Fixed Rate' : 'Road Route Fare'}
          </span>
        </div>
      </div>

      {/* SEARCH BAR SECTION: PICKUP & DROPOFF AUTOCOMPLETE */}
      <div className="bg-white p-4 rounded-3xl border-2 border-slate-200/90 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Pickup Search Box */}
          <div ref={pickupSearchRef} className="relative flex-1 w-full">
            <label className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Pick-up Location Search:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-600">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={pickupSearchQuery || (showPickupDropdown ? '' : pickup.name)}
                onChange={(e) => {
                  setPickupSearchQuery(e.target.value);
                  setShowPickupDropdown(true);
                }}
                onFocus={() => {
                  if (pickupSearchQuery.trim()) setShowPickupDropdown(true);
                }}
                placeholder="Search pick-up address (e.g. SM City Naga, Hotel, Centro)..."
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border-2 border-emerald-300/80 focus:border-emerald-600 focus:bg-white rounded-2xl text-xs font-bold text-slate-800 transition-all outline-none"
              />
              {isSearchingPickup ? (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                </div>
              ) : pickupSearchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setPickupSearchQuery('');
                    setPickupResults([]);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>

            {/* Pickup Dropdown Suggestions */}
            {showPickupDropdown && pickupResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl border-2 border-emerald-300 shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                {pickupResults.map((res) => (
                  <button
                    key={res.place_id}
                    type="button"
                    onClick={() => handleSelectSearchResult(res, 'PICKUP')}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 border-b border-slate-100 last:border-none flex items-start gap-2.5 transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-xs text-slate-900 leading-tight">
                        {res.display_name.split(',')[0]}
                      </p>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {res.display_name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap Button */}
          <button
            type="button"
            onClick={handleSwapLocations}
            title="Swap Pickup and Drop-off locations"
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-300 shrink-0 self-end md:self-center mt-2 md:mt-5"
          >
            <ArrowUpDown className="w-4 h-4 rotate-90 md:rotate-0" />
          </button>

          {/* Dropoff Search Box */}
          <div ref={dropSearchRef} className="relative flex-1 w-full">
            <label className="text-[11px] font-extrabold text-red-800 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block animate-pulse" />
              Drop-off Destination Search:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-red-600">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={dropSearchQuery || (showDropDropdown ? '' : drop.name)}
                onChange={(e) => {
                  setDropSearchQuery(e.target.value);
                  setShowDropDropdown(true);
                }}
                onFocus={() => {
                  if (dropSearchQuery.trim()) setShowDropDropdown(true);
                }}
                placeholder="Search drop-off place (e.g. Caramoan, BIA Airport, Legazpi, Daet)..."
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border-2 border-red-300/80 focus:border-red-600 focus:bg-white rounded-2xl text-xs font-bold text-slate-800 transition-all outline-none"
              />
              {isSearchingDrop ? (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
                </div>
              ) : dropSearchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setDropSearchQuery('');
                    setDropResults([]);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>

            {/* Dropdown Suggestions */}
            {showDropDropdown && dropResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl border-2 border-red-300 shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                {dropResults.map((res) => (
                  <button
                    key={res.place_id}
                    type="button"
                    onClick={() => handleSelectSearchResult(res, 'DROP')}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-red-50 border-b border-slate-100 last:border-none flex items-start gap-2.5 transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-xs text-slate-900 leading-tight">
                        {res.display_name.split(',')[0]}
                      </p>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {res.display_name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
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
          <div className="relative rounded-3xl overflow-hidden border-2 border-slate-300 shadow-md h-[440px] bg-slate-100">
            <div ref={mapContainerRef} className="w-full h-full z-10" />

            {/* Highway Route Status Indicator Overlay */}
            <div className="absolute top-3 left-3 z-[400] flex flex-col gap-1.5 pointer-events-none">
              <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-800 shadow-sm flex items-center gap-1.5">
                {isRouting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-brand-blue animate-spin" />
                    <span>Calculating main road route...</span>
                  </>
                ) : roadCoordinates ? (
                  <>
                    <Route className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-blue-900 font-extrabold">
                      🛣️ Main Road Route: {fareDetails.distanceKm} km (~{fareDetails.estHours} hrs)
                    </span>
                  </>
                ) : (
                  <>
                    <Info className="w-3.5 h-3.5 text-brand-blue" />
                    <span>Drag the 🟢 Green (Pickup) or 🔴 Red (Drop-off) pins anywhere</span>
                  </>
                )}
              </div>
            </div>

            {/* Bottom hint */}
            <div className="absolute bottom-3 left-3 z-[400] bg-slate-900/80 backdrop-blur-md text-white px-3 py-1 rounded-lg text-[10px] font-medium shadow-sm">
              Follows highways, provincial roads, and bridges
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-bold text-slate-700 block">Popular Transfer Hubs & Destinations:</span>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setPickup(POPULAR_LOCATIONS[0]);
                  setDrop(POPULAR_LOCATIONS[2]); // BIA Airport
                  setPickupSearchQuery(POPULAR_LOCATIONS[0].name);
                  setDropSearchQuery(POPULAR_LOCATIONS[2].name);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold border transition-all flex items-center gap-1.5 ${
                  drop.name.includes('BIA') || drop.name.includes('Bicol')
                    ? 'bg-amber-100 text-amber-950 border-amber-300 ring-2 ring-amber-400'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Plane className="w-3.5 h-3.5 text-amber-600" /> ✈️ BIA Airport (Daraga) · Sedan ₱4.5k
              </button>

              <button
                type="button"
                onClick={() => {
                  setPickup(POPULAR_LOCATIONS[0]);
                  setDrop(POPULAR_LOCATIONS[1]); // Naga Airport
                  setPickupSearchQuery(POPULAR_LOCATIONS[0].name);
                  setDropSearchQuery(POPULAR_LOCATIONS[1].name);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold border transition-all flex items-center gap-1.5 ${
                  drop.name.includes('Naga Airport')
                    ? 'bg-blue-100 text-blue-950 border-blue-300 ring-2 ring-blue-400'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Plane className="w-3.5 h-3.5 text-brand-blue" /> ✈️ Naga Airport (Pili) · Sedan ₱1.8k
              </button>

              <button
                type="button"
                onClick={() => {
                  setPickup(POPULAR_LOCATIONS[0]);
                  setDrop(POPULAR_LOCATIONS[4]); // Caramoan
                  setPickupSearchQuery(POPULAR_LOCATIONS[0].name);
                  setDropSearchQuery(POPULAR_LOCATIONS[4].name);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold border transition-all flex items-center gap-1.5 ${
                  drop.name.includes('Caramoan')
                    ? 'bg-emerald-100 text-emerald-950 border-emerald-300 ring-2 ring-emerald-400'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                🏝️ Caramoan Peninsula
              </button>

              <button
                type="button"
                onClick={() => {
                  setPickup(POPULAR_LOCATIONS[0]);
                  setDrop(POPULAR_LOCATIONS[3]); // Legazpi
                  setPickupSearchQuery(POPULAR_LOCATIONS[0].name);
                  setDropSearchQuery(POPULAR_LOCATIONS[3].name);
                }}
                className="px-3 py-1.5 rounded-xl font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              >
                🌋 Legazpi / Albay
              </button>

              <button
                type="button"
                onClick={() => {
                  setPickup(POPULAR_LOCATIONS[0]);
                  setDrop(POPULAR_LOCATIONS[6]); // Daet
                  setPickupSearchQuery(POPULAR_LOCATIONS[0].name);
                  setDropSearchQuery(POPULAR_LOCATIONS[6].name);
                }}
                className="px-3 py-1.5 rounded-xl font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              >
                🏖️ Daet / CamNorte
              </button>

              <button
                type="button"
                onClick={() => {
                  setPickup(POPULAR_LOCATIONS[0]);
                  setDrop(POPULAR_LOCATIONS[7]); // Sorsogon
                  setPickupSearchQuery(POPULAR_LOCATIONS[0].name);
                  setDropSearchQuery(POPULAR_LOCATIONS[7].name);
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
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold flex items-center justify-center gap-1">
                    <Route className="w-3 h-3 text-slate-400" /> Highway Distance
                  </span>
                  <span className="text-base font-black text-slate-900">{fareDetails.distanceKm} km</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" /> Est. Driving Time
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
                  const vFare = computeTransferFare(
                    pickup,
                    drop,
                    vCat,
                    roadDistanceKm ?? undefined,
                    roadDurationHours ?? undefined,
                  );

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
                          {fareDetails.isFixedRoute ? 'Official Fixed Rate' : 'All-in Road Transfer'}
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
