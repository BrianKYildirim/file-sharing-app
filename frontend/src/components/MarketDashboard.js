// frontend/src/components/MarketDashboard.js
import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import '../App.css';
// import {ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip} from 'recharts';
import {API_BASE_URL} from "../config";

export default function MarketDashboard() {
    const navigate = useNavigate();
    const [symbols] = useState(['AAPL', 'SPY', 'GOOG']);
    const [selected, setSelected] = useState(symbols[0]);

    const [chartData, setChartData] = useState([
        {time: '09:30', price: 150},
        {time: '10:00', price: 152},
        {time: '10:30', price: 149},
        {time: '11:00', price: 153},
        {time: '11:30', price: 151},
        {time: '12:00', price: 154},
    ]);

    const handleSelect = async (sym) => {
        setSelected(sym);
        try {
            const res = await fetch(
                `${API_BASE_URL}/market/${sym}`,
                {headers: {Authorization: `Bearer ${localStorage.getItem('access_token')}`}}
            );
            const data = await res.json();
            if (res.ok) setChartData(data);
            else console.error('Market API error:', data.msg);
        } catch (err) {
            console.error('Fetch market data failed:', err);
        }
    };

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
                {symbols.map((sym) => (
                    <button
                        key={sym}
                        onClick={() => handleSelect(sym)}
                        style={{
                            marginRight: '8px',
                            fontWeight: sym === selected ? 'bold' : 'normal'
                        }}
                    >
                        {sym}
                    </button>
                ))}
            </div>

            <div className="file-section">
                <h3>{selected} Intraday Price</h3>
                <div
                    style={{
                        height: 300,
                        border: '2px dashed #bbb',
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#999'
                    }}
                >
                    Chart placeholder
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
