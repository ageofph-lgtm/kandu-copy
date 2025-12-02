import React from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';

// --- Custom Icon Creation ---
const getCategoryDetails = (category) => {
  const details = {
    "Pintura": { icon: "🎨", color: "#f59e0b" },
    "Eletricidade": { icon: "⚡", color: "#eab308" },
    "Canalização": { icon: "🔧", color: "#3b82f6" },
    "Alvenaria": { icon: "🔨", color: "#6b7280" },
    "Ladrilhador": { icon: "🧱", color: "#10b981" },
    "Carpintaria": { icon: "🪚", color: "#8b5cf6" },
    "Climatização": { icon: "🌡️", color: "#06b6d4" },
    "Isolamentos": { icon: "🛡️", color: "#f97316" },
    "Pavimentos": { icon: "📐", color: "#84cc16" },
    "Telhados": { icon: "🏠", color: "#ef4444" }
  };
  return details[category] || details["Alvenaria"];
};

const createJobIcon = (job) => {
  const { icon, color } = getCategoryDetails(job.category);
  const priceText = `€${job.price}${job.price_type === 'hourly' ? '/h' : ''}`;
  
  const html = `
    <div style="background-color: ${color}; color: white; padding: 5px 10px; border-radius: 20px; display: flex; align-items: center; gap: 5px; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
      <span>${icon}</span>
      <span>${priceText}</span>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-job-marker', // Needs to be an empty class for divIcon to work
    iconSize: L.point(80, 30),
    iconAnchor: [40, 15]
  });
};

// --- Map Component ---
export default function MapView({ jobs, onJobClick, center, radius }) {
  // Prevent SSR issues with Leaflet
  if (typeof window === 'undefined') {
    return <div className="h-full w-full bg-gray-200 animate-pulse"></div>;
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Circle 
          center={center} 
          radius={radius} 
          pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1 }}
        />

        {jobs.map((job) => {
            if (!job.latitude || !job.longitude) return null;

            return (
                <Marker 
                    key={job.id} 
                    position={[job.latitude, job.longitude]}
                    icon={createJobIcon(job)}
                    eventHandlers={{
                        click: () => {
                            onJobClick(job);
                        },
                    }}
                >
                </Marker>
            )
        })}
      </MapContainer>
    </div>
  );
}