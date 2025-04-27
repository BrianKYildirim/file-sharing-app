// src/components/MarketDashboard.js
import React from 'react';
import '../App.css';

export default function MarketDashboard() {
  return (
    <div className="dashboard container">
      <h2>Market Dashboard</h2>
      <p>🔧 Chart coming soon…</p>
      <button onClick={() => window.location.hash = '/analysis'}>
        Go to CSV Analysis ↗
      </button>
    </div>
  );
}
