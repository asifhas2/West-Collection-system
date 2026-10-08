import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function LeafletMap({ bins = [], routes = [], center = [23.8103, 90.4125], zoom = 14, interactive = true }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy previous map instance if re-rendering
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: interactive,
      dragging: interactive,
    });

    mapInstanceRef.current = map;

    // OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Bin Marker Icons
    const createBinIcon = (status, wasteType) => {
      let color = '#10B981'; // green for normal
      if (status === 'Full') color = '#F59E0B'; // orange
      if (status === 'Damaged') color = '#EF4444'; // red

      const svgHtml = `
        <div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px;">
          🗑️
        </div>
      `;

      return L.divIcon({
        className: 'custom-bin-marker',
        html: svgHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
    };

    // Add Bins Markers
    bins.forEach((bin) => {
      if (bin.lat && bin.lng) {
        const marker = L.marker([bin.lat, bin.lng], {
          icon: createBinIcon(bin.status, bin.wasteType),
        }).addTo(map);

        marker.bindPopup(`
          <div style="padding: 4px;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 2px;">${bin.locationName || 'Bin Location'}</div>
            <div style="font-size: 12px; color: #4B5563;">ID: <b>${bin.id}</b></div>
            <div style="font-size: 12px; color: #4B5563;">Category: <b>${bin.wasteType}</b></div>
            <div style="font-size: 12px; color: #4B5563;">Fill Level: <b>${bin.fillLevelPercent}%</b></div>
            <div style="display: inline-block; margin-top: 6px; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; color: white; background-color: ${
              bin.status === 'Full' ? '#F59E0B' : bin.status === 'Damaged' ? '#EF4444' : '#10B981'
            };">
              Status: ${bin.status}
            </div>
          </div>
        `);
      }
    });

    // Add Route Polyline if present
    if (routes && routes.length > 0) {
      routes.forEach((route) => {
        if (route.stops && route.stops.length > 1) {
          const latLngs = route.stops
            .filter((stop) => stop.lat && stop.lng)
            .map((stop) => [stop.lat, stop.lng]);

          if (latLngs.length > 1) {
            L.polyline(latLngs, {
              color: '#3B82F6',
              weight: 4,
              dashArray: '8, 8',
              opacity: 0.8,
            }).addTo(map);
          }
        }
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [bins, routes, center, zoom, interactive]);

  return (
    <div className="relative w-full h-full min-h-[320px] rounded-xl overflow-hidden border border-slate-200 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full min-h-[320px]" />
    </div>
  );
}
