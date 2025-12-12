import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet's default icon issue in React
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component to auto-center map when boat moves
const RecenterMap = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        if(lat !== 0 && lng !== 0) map.setView([lat, lng]);
    }, [lat, lng, map]);
    return null;
};

const LiveMap = ({ lat, lng }) => {
    // Default to center of India if GPS is 0
    const position = [lat || 20.5937, lng || 78.9629]; 
    const hasFix = lat !== 0 && lng !== 0;

    return (
        <div className="cyber-card" style={{ height: "400px", marginTop: "20px", padding: "5px", position: "relative" }}>
             <div className="card-title" style={{position: 'absolute', top: 10, left: 10, zIndex: 1000, background: 'rgba(0,0,0,0.8)', padding: '5px 10px'}}>
                🌍 GPS NAVIGATION
             </div>
            <MapContainer center={position} zoom={hasFix ? 18 : 5} style={{ height: "100%", width: "100%", borderRadius: "5px" }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {hasFix && (
                    <Marker position={position}>
                        <Popup>
                            <b>AQUA-BOT</b><br />
                            Lat: {lat.toFixed(6)}<br />
                            Lng: {lng.toFixed(6)}
                        </Popup>
                    </Marker>
                )}
                <RecenterMap lat={lat} lng={lng} />
            </MapContainer>
        </div>
    );
};

export default LiveMap;