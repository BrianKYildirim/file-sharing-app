// frontend/src/components/MarketDashboard.js
import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import '../App.css';

export default function MarketDashboard() {
    const navigate = useNavigate();
    const [symbols] = useState(['AAPL', 'SPY', 'GOOG']);  // default watchlist

    return (
        <div className="dashboard container">
            <div className="dashboard-header">
                <h2>Market Dashboard</h2>
                <button
                    className="logout-button"
                    onClick={() => {
                        localStorage.removeItem('access_token');
                        navigate('/');
                    }}
                >
                    Logout
                </button>
            </div>

            <div style={{marginBottom: '20px'}}>
                <strong>Watchlist:</strong>{' '}
                {symbols.map(sym => (
                    <button
                        key={sym}
                        onClick={() => console.log(`Load chart for ${sym}`)}
                        style={{marginRight: '8px'}}
                    >
                        {sym}
                    </button>
                ))}
            </div>

            <div className="file-section">
                <h3>Chart Area</h3>
                <div
                    style={{
                        height: '300px',
                        border: '1px dashed #bbb',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#999'
                    }}
                >
                    {/* TODO: replace with real chart component */}
                    <p>Select a symbol to view its chart.</p>
                </div>
            </div>

            <div style={{marginTop: '30px'}}>
                <button onClick={() => navigate('/analysis')}>
                    Go to CSV Analysis ↗
                </button>
            </div>
        </div>
    );
}
