import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Coordinates } from '../types.js';
import { Focus, Navigation, Radio, Truck, MapPinned } from 'lucide-react';

interface LeafletMapProps {
  pickupCoords?: Coordinates;
  deliveryCoords?: Coordinates;
  currentCoords?: Coordinates;
  status?: string;
  driverName?: string;
  theme?: 'light' | 'dark';
}

export default function LeafletMap({
  pickupCoords,
  deliveryCoords,
  currentCoords,
  status,
  driverName,
  theme = 'light',
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [autoCenter, setAutoCenter] = useState(true);

  const markersRef = useRef<{
    pickup?: L.Marker;
    delivery?: L.Marker;
    current?: L.Marker;
    route?: L.Polyline;
  }>({});

  // 1. Initialize Map Instance Once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      // Default center around USA center
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: true,
      }).setView([37.8, -96], 4);

      // Add zoom control at bottom-right
      L.control.zoom({
        position: 'bottomright',
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // Force tile recalculation in container
    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(resizeTimer);
    };
  }, []);

  // Satellite imagery is the only basemap in the tracking experience.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    const layer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri — Sources: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
        crossOrigin: true,
        keepBuffer: 2,
      },
    );

    tileLayerRef.current = layer;
    layer.addTo(map);
  }, []);

  // 2. Setup Static Routes & Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clean up existing static markers to prepare for updates if coordinates change
    if (markersRef.current.pickup) {
      map.removeLayer(markersRef.current.pickup);
      markersRef.current.pickup = undefined;
    }
    if (markersRef.current.delivery) {
      map.removeLayer(markersRef.current.delivery);
      markersRef.current.delivery = undefined;
    }
    if (markersRef.current.route) {
      map.removeLayer(markersRef.current.route);
      markersRef.current.route = undefined;
    }

    const bounds: L.LatLngExpression[] = [];

    // Custom SVG HTML icons
    const pickupIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 bg-emerald-500/20 rounded-full animate-ping"></div>
          <div class="w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
            <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>
      `,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const deliveryIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 bg-rose-500/20 rounded-full animate-ping"></div>
          <div class="w-5 h-5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
            <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>
      `,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    // Plot Pickup Location
    if (pickupCoords) {
      const pickupLatLng: L.LatLngTuple = [pickupCoords.lat, pickupCoords.lng];
      markersRef.current.pickup = L.marker(pickupLatLng, { icon: pickupIcon })
        .bindPopup(`<strong style="color:#0f172a;">Origin Depot</strong><br><span style="font-size:10px;color:#64748b;">Lat: ${pickupCoords.lat.toFixed(4)}, Lng: ${pickupCoords.lng.toFixed(4)}</span>`)
        .addTo(map);
      bounds.push(pickupLatLng);
    }

    // Plot Delivery Destination
    if (deliveryCoords) {
      const deliveryLatLng: L.LatLngTuple = [deliveryCoords.lat, deliveryCoords.lng];
      markersRef.current.delivery = L.marker(deliveryLatLng, { icon: deliveryIcon })
        .bindPopup(`<strong style="color:#0f172a;">Destination Hub</strong><br><span style="font-size:10px;color:#64748b;">Lat: ${deliveryCoords.lat.toFixed(4)}, Lng: ${deliveryCoords.lng.toFixed(4)}</span>`)
        .addTo(map);
      bounds.push(deliveryLatLng);
    }

    // Draw a temporary direct route; the OSRM road route replaces it when available.
    if (pickupCoords && deliveryCoords) {
      const polylinePoints: L.LatLngTuple[] = [
        [pickupCoords.lat, pickupCoords.lng],
        [deliveryCoords.lat, deliveryCoords.lng],
      ];
      markersRef.current.route = L.polyline(polylinePoints, {
        color: '#ff7a1a',
        weight: 3.5,
        opacity: 0.85,
        dashArray: '6, 8',
      }).addTo(map);
    }

    // Fit map bounds nicely
    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), {
        padding: [50, 50],
        maxZoom: 12,
      });
    }

    // Double force size recalculation
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

  }, [pickupCoords, deliveryCoords]);

  // Prefer a road-following route from the public OSRM routing service.
  // Keep the straight-line route above as a graceful fallback if routing is unavailable.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !pickupCoords || !deliveryCoords) return;

    let cancelled = false;
    const controller = new AbortController();
    const routeUrl = `https://router.project-osrm.org/route/v1/driving/${pickupCoords.lng},${pickupCoords.lat};${deliveryCoords.lng},${deliveryCoords.lat}?overview=full&geometries=geojson`;

    fetch(routeUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Routing service unavailable');
        return response.json();
      })
      .then((data) => {
        const coordinates = data?.routes?.[0]?.geometry?.coordinates;
        if (cancelled || !Array.isArray(coordinates) || coordinates.length < 2) return;

        const roadPath = coordinates.map(
          ([lng, lat]: [number, number]): L.LatLngTuple => [lat, lng],
        );
        if (markersRef.current.route) map.removeLayer(markersRef.current.route);
        markersRef.current.route = L.polyline(roadPath, {
          color: '#ff7a1a',
          weight: 4,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') {
          console.warn('Road route unavailable; using direct route fallback.', error);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [pickupCoords?.lat, pickupCoords?.lng, deliveryCoords?.lat, deliveryCoords?.lng]);

  // 3. Setup / Update Dynamic Vehicle GPS Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !currentCoords) return;

    const currentLatLng: L.LatLngTuple = [currentCoords.lat, currentCoords.lng];

    const currentIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-12 h-12 bg-blue-500/25 rounded-full animate-ping" style="animation-duration: 2.5s;"></div>
          <div class="absolute w-8 h-8 bg-blue-500/40 rounded-full animate-pulse"></div>
          <div class="w-7 h-7 bg-blue-600 rounded-xl border border-white flex items-center justify-center shadow-2xl transform rotate-0 transition-transform duration-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-truck">
              <rect width="16" height="10" x="2" y="4" rx="2"/>
              <rect width="16" height="10" x="2" y="14" rx="2"/>
              <path d="M13 6h3a2 2 0 0 1 2 2v7"/>
              <circle cx="7.5" cy="18.5" r="2.5"/>
              <circle cx="16.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
        </div>
      `,
      className: '',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    const isDelivered = status === 'Delivered' || status === 'Cancelled';

    if (isDelivered) {
      // If delivered, remove dynamic marker from map
      if (markersRef.current.current) {
        map.removeLayer(markersRef.current.current);
        markersRef.current.current = undefined;
      }
    } else {
      // Update position or create
      if (markersRef.current.current) {
        markersRef.current.current.setLatLng(currentLatLng);
      } else {
        markersRef.current.current = L.marker(currentLatLng, { icon: currentIcon })
          .bindPopup(`<strong style="color:#1e3a8a;">Logify Active Courier</strong><br><span style="font-size:10px;color:#3b82f6;font-family:monospace;font-weight:bold;">Status: ${status}</span>`)
          .addTo(map);
      }

      // Smooth pan to current position if auto-center is active
      if (autoCenter) {
        map.panTo(currentLatLng, {
          animate: true,
          duration: 0.8,
        });
      }
    }

  }, [currentCoords, status, autoCenter]);

  // Handle Clean up on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const manualRecenter = () => {
    const map = mapRef.current;
    if (map && currentCoords) {
      map.panTo([currentCoords.lat, currentCoords.lng], {
        animate: true,
        duration: 1.0,
      });
      setAutoCenter(true);
    }
  };

  return (
    <div className="relative isolate flex h-[440px] w-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.55)] ring-1 ring-black/5 dark:border-slate-800">
      {/* Floating tracking status */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[400] flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="pointer-events-auto flex min-w-0 items-center gap-3 rounded-2xl border border-white/15 bg-slate-950/85 px-3.5 py-3 text-white shadow-xl backdrop-blur-xl">
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
            <Radio size={17} />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Shipment tracking</span>
            <span className="mt-0.5 block truncate text-sm font-semibold">Satellite live view</span>
          </span>
        </div>
        <div className="pointer-events-auto flex shrink-0 items-center gap-2 rounded-2xl border border-white/15 bg-slate-950/85 p-1.5 text-white shadow-xl backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setAutoCenter(!autoCenter)}
            aria-pressed={autoCenter}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${autoCenter ? 'bg-emerald-400 text-slate-950' : 'text-slate-200 hover:bg-white/10'}`}
            title="Keep the map centered on the courier"
          >
            <Focus size={14} />
            <span className="hidden sm:inline">{autoCenter ? 'Follow on' : 'Follow off'}</span>
          </button>
          {!autoCenter && currentCoords && (
            <button
              type="button"
              onClick={manualRecenter}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10"
              title="Center on the courier"
            >
              <Navigation size={14} />
              <span className="hidden sm:inline">Recenter</span>
            </button>
          )}
        </div>
      </div>

      <div ref={mapContainerRef} className="z-10 min-h-0 w-full flex-1 bg-slate-900" />

      {/* Clean, high-contrast tracking legend */}
      <div className="z-20 border-t border-white/10 bg-slate-950 px-4 py-4 text-white sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-xs text-slate-300">
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/10" />Pickup</span>
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-400 ring-4 ring-rose-400/10" />Destination</span>
            <span className="inline-flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-500 text-white"><Truck size={12} /></span>Courier</span>
          </div>
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300"><MapPinned size={16} /></span>
            <span className="min-w-0">
              <span className="block text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">Assigned courier</span>
              <span className="block max-w-[190px] truncate text-xs font-semibold text-white">{driverName || 'Awaiting courier assignment'}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
