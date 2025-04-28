// frontend/src/components/MarketDashboard.js
import React, {useState, useEffect, useRef} from 'react';
import '../App.css';

export default function MarketDashboard() {
    const watchlist = ['AAPL', 'SPY', 'GOOG'];

    // our “human” ↔ TradingView codes
    const intervalMap = {
        '1min': '1',
        '5min': '5',
        '15min': '15',
        '30min': '30',
        '60min': '60',
        daily: 'D',
        weekly: 'W',
        monthly: 'M',
    };
    const styleMap = {
        candlestick: '1',  // TradingView === Candles
        line: '3',  // TradingView === Line
    };

    const [symbol, setSymbol] = useState('AAPL');
    const [interval, setInterval] = useState('1min');
    const [type, setType] = useState('candlestick');

    const containerRef = useRef(null);

    //  — load the TradingView script once —
    useEffect(() => {
        if (window.TradingView) return;
        const s = document.createElement('script');
        s.src = 'https://s3.tradingview.com/tv.js';
        s.async = true;
        document.head.appendChild(s);
    }, []);

    //  — re-create the chart any time symbol/interval/type changes —
    useEffect(() => {
        if (!window.TradingView || !containerRef.current) return;
        // clear out old chart
        containerRef.current.innerHTML = '';

        new window.TradingView.widget({
            container_id: containerRef.current.id,
            width: '100%',
            height: 400,
            symbol: `NASDAQ:${symbol}`,
            interval: intervalMap[interval],
            timezone: 'Etc/UTC',
            theme: 'Light',
            style: styleMap[type],
            toolbar_bg: '#f1f3f6',
            allow_symbol_change: false,
            withdateranges: true,
            hide_side_toolbar: false,
            save_image: false,
            details: true,
            studies: [],
            locale: 'en',
        });
    }, [symbol, interval, type]);

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

            <div style={{marginBottom: 12}}>
                <strong>Watchlist:</strong>{' '}
                {watchlist.map((s) => (
                    <button
                        key={s}
                        onClick={() => setSymbol(s)}
                        style={{marginRight: 8, fontWeight: s === symbol ? 'bold' : 'normal'}}
                    >
                        {s}
                    </button>
                ))}
            </div>

            <div style={{display: 'flex', gap: 8, marginBottom: 12}}>
                <label>
                    Interval:{' '}
                    <select
                        value={interval}
                        onChange={(e) => setInterval(e.target.value)}
                    >
                        {Object.keys(intervalMap).map((k) => (
                            <option key={k} value={k}>
                                {k}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Type:{' '}
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    >
                        <option value="candlestick">Candlestick</option>
                        <option value="line">Line</option>
                    </select>
                </label>
            </div>

            <div
                id="tv_chart_container"
                ref={containerRef}
                style={{
                    border: '1px solid #ddd',
                    borderRadius: 6,
                    background: '#fff'
                }}
            />

            <div style={{marginTop: 20}}>
                <button onClick={() => (window.location.hash = '/analysis')}>
                    Go to CSV Analysis ↗
                </button>
            </div>
        </div>
    );
}
