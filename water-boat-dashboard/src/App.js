import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Droplets, Leaf, Box, Search, Radar as RadarIcon, Thermometer, ArrowUp, ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';
import './App.css';

const API_URL = "http://localhost:3001/api/data"; 

// --- RADAR VISUAL (Big Text) ---
const RadarVisual = ({ distance }) => {
  const maxRange = 100; 
  const hasObject = distance > 0 && distance < maxRange;
  const normalizedDist = Math.min(distance, maxRange);
  const cy = 200 - (normalizedDist / maxRange) * 200; 

  return (
    <div className="radar-container">
      <div className="radar-overlay"></div>
      <svg viewBox="0 0 400 220" className="radar-svg">
        <defs>
          <linearGradient id="scanGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0, 243, 255, 0)" />
            <stop offset="100%" stopColor="rgba(0, 243, 255, 0.3)" />
          </linearGradient>
        </defs>
        <path d="M 20 200 A 180 180 0 0 1 380 200" stroke="#00f3ff" strokeWidth="1" fill="none" opacity="0.5" />
        <path d="M 110 200 A 90 90 0 0 1 290 200" stroke="#00f3ff" strokeWidth="1" fill="none" opacity="0.3" />
        {hasObject ? (
          <>
            <circle cx="200" cy={cy} r="10" fill="#ff2a2a" className="blip-core" />
            <circle cx="200" cy={cy} r="25" stroke="#ff2a2a" strokeWidth="2" fill="none" className="blip-ripple" />
            <text x="220" y={cy} fill="#ff2a2a" fontSize="14" fontWeight="bold">OBSTACLE</text>
          </>
        ) : (
           <path d="M 200 200 L 20 200 A 180 180 0 0 1 380 200 Z" fill="url(#scanGradient)" className="radar-sweep"/>
        )}
        <text x="200" y="180" textAnchor="middle" fill={hasObject ? "#ff2a2a" : "#00f3ff"} fontSize="40" fontFamily="Orbitron" fontWeight="bold">
          {distance} cm
        </text>
      </svg>
    </div>
  );
};

function App() {
  const [data, setData] = useState([]);
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(API_URL);
        const historicalData = response.data.reverse(); 
        setData(historicalData);
        if (historicalData.length > 0) setCurrent(historicalData[historicalData.length - 1]);
      } catch (error) { console.error(error); }
    };
    fetchData(); 
    const interval = setInterval(fetchData, 500); 
    return () => clearInterval(interval);
  }, []);

  if (!current) return <div className="loading-screen">INITIALIZING SYSTEM...</div>;

  const getAiColor = (type) => {
    if (!type) return "#33b5e5";
    if (type.includes("Plastic")) return "#ff2a2a"; 
    if (type.includes("Algae")) return "#00ff9d";    
    return "#33b5e5"; 
  };

  const renderDirectionIcon = () => {
    const status = current.status || "";
    if (status.includes("Right")) return <ArrowRight size={48} className="blink-icon" color="#ffae00" />;
    if (status.includes("Left")) return <ArrowLeft size={48} className="blink-icon" color="#ffae00" />;
    if (status.includes("Obstacle")) return <AlertTriangle size={48} className="blink-icon" color="#ff2a2a" />;
    return <ArrowUp size={48} color="#00ff9d" />; 
  };

  return (
    <div className="dashboard-container">
      <div className="bg-grid"></div>

      <header className="cyber-header">
        <div className="logo-section">
          <h1>AQUA-BOT <span className="highlight">PRIME</span></h1>
          <p>SPECTRAL ML & NAVIGATION UNIT</p>
        </div>
        <div className="live-badge">LIVE FEED ●</div>
      </header>

      <div className={`status-bar ${current.status?.includes("Obstacle") ? 'status-danger' : 'status-safe'}`}>
        <div className="status-content">
          <span className="status-label">CURRENT OP:</span>
          <span className="status-value">{current.status}</span>
        </div>
        <div className="status-icon-box">{renderDirectionIcon()}</div>
      </div>

      <div className="cyber-grid">
        
        {/* 1. AI DETECTION */}
        <div className="cyber-card radar-card">
          <div className="card-title"><Search size={18}/> AI MATERIAL DETECTION</div>
          <div style={{textAlign: 'center', marginTop: '10px'}}>
             <h1 style={{fontSize: '2.5rem', color: getAiColor(current.classification)}}>
               {current.classification || "ANALYZING..."}
             </h1>
             <div className="readout-box" style={{borderColor: getAiColor(current.classification)}}>
                <span className="readout-label">CONFIDENCE</span>
                <span className="readout-value">{current.confidence}%</span>
             </div>
          </div>
        </div>

        {/* 2. RAW SENSORS */}
        <div className="cyber-card graph-card" style={{display: 'flex', justifyContent: 'space-around'}}>
           <div className="stat-group">
              <div className="card-title">CDOM</div>
              <div className="big-number" style={{fontSize:'2rem', color:'#33b5e5'}}>{current.cdom}</div>
           </div>
           <div className="stat-group">
              <div className="card-title">ALGAE</div>
              <div className="big-number" style={{fontSize:'2rem', color:'#00ff9d'}}>{current.algae}</div>
           </div>
           <div className="stat-group">
              <div className="card-title">PLASTIC</div>
              <div className="big-number" style={{fontSize:'2rem', color:'#ff2a2a'}}>{current.plastic}</div>
           </div>
        </div>

        {/* 3. TEMPERATURE & RADAR */}
        <div className="cyber-card stat-card">
           <div className="card-title"><Thermometer size={18}/> TEMP</div>
           <div className="big-number" style={{color: '#ffae00'}}>{current.temperature}°C</div>
        </div>
        
        <div className="cyber-card stat-card">
           <div className="card-title"><Activity size={18}/> pH</div>
           <div className="big-number" style={{color: '#00ff9d'}}>{(current.ph || 7).toFixed(1)}</div>
        </div>

        <div className="cyber-card radar-card">
          <div className="card-title"><RadarIcon size={18}/> OBSTACLE RADAR</div>
          <RadarVisual distance={current.distance} />
        </div>

      </div>
    </div>
  );
}
export default App;