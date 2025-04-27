import React from 'react';
import '../App.css';

export default function MarketDashboard() {
    const logout = () => {
        localStorage.removeItem('access_token');
        window.location.hash = '/';
    };

    return (
        <div className="container">
            <h2>Market Dashboard</h2>
            <p>🔧 Chart coming soon…</p>
            <button onClick={() => window.location.hash = '/analysis'}>
                Go to CSV Analysis ↗
            </button>
            <button onClick={logout} style={{marginLeft: '1rem'}}>
                Logout
            </button>
        </div>
    );
}
