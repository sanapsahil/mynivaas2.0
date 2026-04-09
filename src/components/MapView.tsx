"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Property } from "@/lib/serpapi";

interface MapViewProps {
  properties: Property[];
  center: { lat: number; lng: number } | null;
  hoveredId?: string | null;
}

function createPriceIcon(price: string, isHovered: boolean, isBest: boolean) {
  const bg = isBest
    ? isHovered ? "#0a7c6a" : "#0f766e"
    : isHovered ? "#1e293b" : "#ffffff";
  const color = isBest || isHovered ? "#ffffff" : "#1e293b";
  const border = isBest
    ? "none"
    : isHovered ? "none" : "1px solid #cbd5e1";
  const shadow = isHovered
    ? "0 4px 14px rgba(0,0,0,0.25)"
    : "0 2px 6px rgba(0,0,0,0.1)";
  const scale = isHovered ? "scale(1.15)" : "scale(1)";
  const zIdx = isHovered ? 1000 : "auto";

  return L.divIcon({
    className: "",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    html: `<div style="
      position: absolute;
      transform: translate(-50%, -100%) ${scale};
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      background: ${bg};
      color: ${color};
      border: ${border};
      border-radius: 8px;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 700;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      white-space: nowrap;
      box-shadow: ${shadow};
      z-index: ${zIdx};
      cursor: pointer;
    ">${price}<div style="
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid ${bg};
    "></div></div>`,
  });
}

export default function MapView({ properties, center, hoveredId }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const lat = center?.lat || 19.076;
    const lng = center?.lng || 72.8777;

    const map = L.map(mapContainer.current, {
      center: [lat, lng],
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update center when it changes
  useEffect(() => {
    if (!mapRef.current || !center) return;
    mapRef.current.setView([center.lat, center.lng], 13, { animate: true });
  }, [center]);

  // Update markers when properties or hover changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const geoProperties = properties.filter((p) => p.lat && p.lng);
    if (geoProperties.length === 0) return;

    const bounds = L.latLngBounds([]);

    geoProperties.forEach((property, index) => {
      const isHovered = property.id === hoveredId;
      const isBest = index === 0;
      const icon = createPriceIcon(property.priceFormatted, isHovered, isBest);

      const marker = L.marker([property.lat!, property.lng!], { icon, zIndexOffset: isHovered ? 1000 : isBest ? 500 : 0 })
        .addTo(map);

      marker.bindPopup(
        `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-width:180px">
          <div style="font-weight:700;font-size:13px;margin-bottom:4px;color:#1e293b">${property.title}</div>
          <div style="font-size:18px;font-weight:800;color:#0f766e;margin-bottom:4px">${property.priceFormatted}</div>
          <div style="font-size:11px;color:#64748b;margin-bottom:6px">${property.source}</div>
          <a href="${property.link}" target="_blank" rel="noopener noreferrer"
            style="display:inline-block;background:#0f766e;color:#fff;padding:4px 12px;border-radius:6px;font-size:11px;font-weight:600;text-decoration:none">
            View Deal &rarr;
          </a>
        </div>`,
        { closeButton: true, maxWidth: 250 }
      );

      bounds.extend([property.lat!, property.lng!]);
      markersRef.current.push(marker);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [properties, hoveredId]);

  return (
    <div
      ref={mapContainer}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    />
  );
}
