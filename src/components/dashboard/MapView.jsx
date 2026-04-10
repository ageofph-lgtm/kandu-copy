import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

/* ─────────────────────────────────────────
   Ícones SVG únicos e sugestivos por categoria
───────────────────────────────────────────*/
const CATEGORY_MAP = {
  "Pintura": {
    color: "#f59e0b",
    svg: `<svg viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M7 4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2h1a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1v2a2 2 0 0 1-1.6 1.96L15 21H9l-.4-3.04A2 2 0 0 1 7 16v-2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h1V4zm2 0v2h6V4H9zm-3 4v3h1v3a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-3h1V8H6zm3 9.5.3 2.5h5.4l.3-2.5H9z"/></svg>`
  },
  "Eletricidade": {
    color: "#eab308",
    svg: `<svg viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H13L14 2z"/></svg>`
  },
  "Canalização": {
    color: "#3b82f6",
    svg: `<svg viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M12 2C9.24 2 7 4.24 7 7c0 1.63.78 3.08 2 4V19h2v-2h2v2h2v-8c1.22-.92 2-2.37 2-4 0-2.76-2.24-5-5-5zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/><rect x="3" y="20" width="18" height="2" rx="1"/></svg>`
  },
  "Alvenaria": {
    color: "#78716c",
    svg: `<svg viewBox="0 0 24 24" fill="white" width="18" height="18"><rect x="2" y="3" width="9" height="5" rx="1"/><rect x="13" y="3" width="9" height="5" rx="1"/><rect x="6" y="10" width="9" height="5" rx="1"/><rect x="2" y="17" width="9" height="4" rx="1"/><rect x="13" y="17" width="9" height="4" rx="1"/></svg>`
  },
  "Ladrilhador": {
    color: "#10b981",
    svg: `<svg viewBox="0 0 24 24" fill="white" width="18" height="18"><rect x="2" y="2" width="9" height="9" rx="1"/><rect x="13" y="2" width="9" height="9" rx="1"/><rect x="2" y="13" width="9" height="9" rx="1"/><rect x="13" y="13" width="9" height="9" rx="1"/></svg>`
  },
  "Carpintaria": {
    color: "#a16207",
    svg: `<svg viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M3 17h4v4H3zm0-6h4v4H3zM9 3h4v4H9zm0 6h4v4H9zm6 6h4v4h-4zm0-6h4v4h-4zM3 3h4v4H3zm12 0h4v4h-4zM9 15h4v4H9z"/></svg>`
  },
  "Climatização": {
    color: "#06b6d4",
    svg: `<svg viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="white" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="4" fill="white"/><circle cx="12" cy="12" r="2" fill="#06b6d4"/></svg>`
  },
  "Isolamentos": {
    color: "#f97316",
    svg: `<svg viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22" fill="#f97316" stroke="white" stroke-width="1"/></svg>`
  },
  "Pavimentos": {
    color: "#84cc16",
    svg: `<svg viewBox="0 0 24 24" fill="white" width="18" height="18"><rect x="2" y="16" width="20" height="6" rx="1"/><rect x="2" y="10" width="8" height="4" rx="1"/><rect x="12" y="10" width="10" height="4" rx="1"/><rect x="2" y="4" width="14" height="4" rx="1"/></svg>`
  },
  "Telhados": {
    color: "#ef4444",
    svg: `<svg viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10" stroke="white" stroke-width="1.5" fill="none"/><rect x="9" y="14" width="6" height="6" fill="white"/></svg>`
  },
};

const DEFAULT = { color: "#6b7280", svg: `<svg viewBox="0 0 24 24" fill="white" width="18" height="18"><circle cx="12" cy="10" r="5"/><path d="M12 22l-5-8h10z"/></svg>` };

const createJobIcon = (job) => {
  const cat = CATEGORY_MAP[job.category] || DEFAULT;
  const priceText = `€${job.price}${job.price_type === 'hourly' ? '/h' : ''}`;

  const html = `
    <div style="
      background:${cat.color};
      color:white;
      padding:5px 10px 5px 7px;
      border-radius:22px;
      display:flex;
      align-items:center;
      gap:5px;
      font-weight:700;
      font-size:12px;
      box-shadow:0 3px 8px rgba(0,0,0,0.28);
      border:2px solid rgba(255,255,255,0.4);
      white-space:nowrap;
    ">
      ${cat.svg}
      <span>${priceText}</span>
    </div>
  `;

  return L.divIcon({
    html,
    className: '',
    iconSize: L.point(90, 32),
    iconAnchor: [45, 16]
  });
};

/* Ponto azul pulsante para a localização do utilizador */
const createUserIcon = () => L.divIcon({
  html: `
    <div style="position:relative;width:22px;height:22px">
      <div style="position:absolute;inset:0;background:rgba(59,130,246,0.25);border-radius:50%;animation:pulse 1.8s ease-out infinite"></div>
      <div style="position:absolute;inset:3px;background:#3b82f6;border:2.5px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(59,130,246,0.5)"></div>
    </div>
    <style>@keyframes pulse{0%{transform:scale(1);opacity:0.7}70%{transform:scale(2.2);opacity:0}100%{transform:scale(2.5);opacity:0}}</style>
  `,
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center[0], center[1]]);
  return null;
}

export default function MapView({ jobs, onJobClick, center, userLocation }) {
  if (typeof window === 'undefined') {
    return <div className="h-full w-full bg-gray-200 animate-pulse" />;
  }

  return (
    <div className="h-full w-full">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap center={center} />

        {/* Ponto do utilizador */}
        {userLocation && (
          <Marker position={userLocation} icon={createUserIcon()} />
        )}

        {/* Marcadores das obras */}
        {jobs.map(job => {
          if (!job.latitude || !job.longitude) return null;
          return (
            <Marker
              key={job.id}
              position={[job.latitude, job.longitude]}
              icon={createJobIcon(job)}
              eventHandlers={{ click: () => onJobClick(job) }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
