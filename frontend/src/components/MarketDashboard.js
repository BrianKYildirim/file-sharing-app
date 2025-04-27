// frontend/src/components/MarketDashboard.js
import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import '../App.css';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';
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
                `${API_BASE_URL}/market/${sym}?interval=1m`,
                { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } }
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
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis dataKey="time"/>
                        <YAxis domain={['auto', 'auto']}/>
                        <Tooltip/>
                        <Line
                            type="monotone"
                            dataKey="price"
                            dot={false}
                            stroke="#0077cc"
                            strokeWidth={2}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div style={{marginTop: '30px'}}>
                <button onClick={() => navigate('/analysis')}>
                    Go to CSV Analysis ↗
                </button>
            </div>
        </div>
    );
}
