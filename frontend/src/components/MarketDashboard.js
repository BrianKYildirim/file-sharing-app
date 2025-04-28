// frontend/src/components/MarketDashboard.js

import React, {useState, useEffect} from 'react';
import {API_BASE_URL} from '../config';
import '../App.css';

export default function MarketDashboard() {
    const token = localStorage.getItem('access_token');
    const symbols = ['AAPL', 'SPY', 'GOOG'];
    const [selected, setSelected] = useState(symbols[0]);
    const [points, setPoints] = useState([]);      // { timeLabel, close }[]
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch intraday data when `selected` changes
    useEffect(() => {
        if (!token) return;
        setLoading(true);
        setError('');
        fetch(
            `${API_BASE_URL}/market/${selected}?period=1d&interval=1m`,
            {headers: {Authorization: `Bearer ${token}`}}
        )
            .then((res) =>
                res.json().then((data) => ({ok: res.ok, data}))
            )
            .then(({ok, data}) => {
                if (!ok) {
                    setPoints([]);
                    setError(data.msg || 'Error fetching data');
                } else if (!Array.isArray(data) || data.length === 0) {
                    setPoints([]);
                    setError('No intraday data available.');
                } else {
                    const mapped = data.map((d) => ({
                        timeLabel: new Date(d.time).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                        }),
                        close: d.close
                    }));
                    setPoints(mapped);
                }
            })
            .catch((err) => {
                console.error(err);
                setPoints([]);
                setError('Network error');
            })
            .finally(() => setLoading(false));
    }, [selected, token]);

    // If not logged in, prompt to sign in
    if (!token) {
        return (
            <div
                className="dashboard container"
                style={{padding: 20, textAlign: 'center'}}
            >
                <p style={{fontSize: '1.2rem', marginBottom: 20}}>
                    You must be logged in to view the dashboard.
                </p>
                <button
                    onClick={() => (window.location.hash = '/login')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#0077cc',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        marginBottom: 10
                    }}
                >
                    Log in here
                </button>
                <p>
                    New user? <a href="#/signup">Register here</a>
                </p>
            </div>
        );
    }

    // SVG dimensions
    const svgWidth = 600;
    const svgHeight = 300;
    const margin = 40;
    const gridLines = 5;

    // Build the polyline
    let polyline = '';
    if (points.length > 1) {
        const closes = points.map((p) => p.close);
        const min = Math.min(...closes);
        const max = Math.max(...closes);
        const dx = (svgWidth - 2 * margin) / (points.length - 1);
        const dy = (svgHeight - 2 * margin) / ((max - min) || 1);
        polyline = points
            .map((p, i) => {
                const x = margin + dx * i;
                const y = margin + (max - p.close) * dy;
                return `${x},${y}`;
            })
            .join(' ');
    }

    return (
        <div className="dashboard container">
            <div className="dashboard-header">
                <h2>Market Dashboard</h2>
                <button
                    className="logout-button"
                    onClick={() => {
                        localStorage.removeItem('access_token');
                        window.location.hash = '/';
                    }}
                >
                    Logout
                </button>
            </div>

            <div style={{marginBottom: 20}}>
                <strong>Watchlist:</strong>{' '}
                {symbols.map((sym) => (
                    <button
                        key={sym}
                        onClick={() => setSelected(sym)}
                        style={{
                            marginRight: 8,
                            fontWeight: sym === selected ? 'bold' : 'normal'
                        }}
                    >
                        {sym}
                    </button>
                ))}
            </div>

            <div className="file-section">
                <h3>{selected} Intraday Price</h3>

                {loading ? (
                    <p>Loading chart…</p>
                ) : error ? (
                    <p style={{color: 'red'}}>{error}</p>
                ) : points.length < 2 ? (
                    <p>No data to display.</p>
                ) : (
                    <svg
                        width="100%"
                        height="300"
                        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                        preserveAspectRatio="none"
                        style={{background: '#f9f9f9', border: '1px solid #ddd'}}
                    >
                        {/* horizontal grid */}
                        {Array.from({length: gridLines}).map((_, i) => {
                            const y =
                                margin + ((svgHeight - 2 * margin) / (gridLines - 1)) * i;
                            return (
                                <line
                                    key={i}
                                    x1={margin}
                                    y1={y}
                                    x2={svgWidth - margin}
                                    y2={y}
                                    stroke="#eee"
                                />
                            );
                        })}
                        {/* price line */}
                        <polyline
                            fill="none"
                            stroke="#0077cc"
                            strokeWidth="2"
                            points={polyline}
                        />
                    </svg>
                )}
            </div>

            <div style={{marginTop: 30}}>
                <button onClick={() => (window.location.hash = '/analysis')}>
                    Go to CSV Analysis ↗
                </button>
            </div>
        </div>
    );
}
