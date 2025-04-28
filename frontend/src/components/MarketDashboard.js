// frontend/src/components/MarketDashboard.js
import React, {useEffect, useRef, useState} from 'react';
import '../App.css';

export default function MarketDashboard() {
    const watchlist = ['AAPL', 'NVDA', 'GOOG'];
    const [symbol, setSymbol] = useState('AAPL');
    const containerRef = useRef();

    // load the TradingView embed script once
    useEffect(() => {
        if (!window.TradingView) {
            const s = document.createElement('script');
            s.src = 'https://s3.tradingview.com/tv.js';
            s.async = true;
            document.head.appendChild(s);
        }
    }, []);

    // recreate chart whenever symbol changes
    useEffect(() => {
        if (!window.TradingView || !containerRef.current) return;
        containerRef.current.innerHTML = ''; // clear old

        new window.TradingView.widget({
            container_id: containerRef.current.id,
            autosize: true,
            symbol: `NASDAQ:${symbol}`,   // or whichever default exchange you like
            interval: 'D',                  // daily by default; user can change inside the widget
            timezone: 'Etc/UTC',
            theme: 'Light',
            style: '1',   // 1=candles, 3=line; user can toggle in toolbar
            toolbar_bg: '#f1f3f6',
            enable_publishing: false,
            allow_symbol_change: true,  // <— turn this on
            hide_side_toolbar: false,
            show_popup_button: true,  // adds the ↗ icon to pop out full screen
            withdateranges: true,
            details: true,
            studies: [],
            locale: 'en',
        });
    }, [symbol]);

    return (
        <div className="dashboard container">
            <div className="dashboard-header">
                <h2>Market Dashboard</h2>
                <button className="logout-button"
                        onClick={() => {
                            localStorage.removeItem('access_token');
                            window.location.hash = '/';
                        }}>
                    Logout
                </button>
            </div>

            <div style={{marginBottom: 12}}>
                <strong>Watchlist:</strong>{' '}
                {watchlist.map(t => (
                    <button
                        key={t}
                        onClick={() => setSymbol(t)}
                        style={{marginRight: 8, fontWeight: t === symbol ? 'bold' : 'normal'}}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <div
                id="tv_chart_container"
                ref={containerRef}
                style={{
                    width: '100%',
                    height: '500px',
                    border: '1px solid #ddd',
                    borderRadius: 6,
                    background: '#fff',
                }}
            />

            <div style={{marginTop: 20}}>
                <button onClick={() => window.location.hash = '/analysis'}>
                    Go to CSV Analysis ↗
                </button>
            </div>
        </div>
    );
}
