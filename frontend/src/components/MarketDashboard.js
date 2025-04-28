// frontend/src/components/MarketDashboard.js

import React, {useState, useEffect, useRef} from 'react';
import {createChart, CrosshairMode} from 'lightweight-charts';
import {API_BASE_URL} from '../config';
import '../App.css';

export default function MarketDashboard() {
    const chartContainerRef = useRef();
    const chartRef = useRef();
    const seriesRef = useRef();

    const [symbol, setSymbol] = useState('AAPL');
    const [interval, setInterval] = useState('1min');
    const [type, setType] = useState('candlestick'); // or "line"
    const [loading, setLoading] = useState(false);

    const watchlist = ['AAPL', 'SPY', 'GOOG'];

    // 1) Initialize the chart once
    useEffect(() => {
        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
            layout: {
                backgroundColor: '#ffffff',
                textColor: '#333',
            },
            grid: {
                vertLines: {color: '#eee'},
                horzLines: {color: '#eee'},
            },
            crosshair: {
                mode: CrosshairMode.Normal,
            },
            rightPriceScale: {
                borderColor: '#ccc',
            },
            timeScale: {
                borderColor: '#ccc',
                timeVisible: true,
                secondsVisible: false,
            },
        });

        chartRef.current = chart;

        // handle resize
        const handleResize = () => {
            chart.applyOptions({width: chartContainerRef.current.clientWidth});
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, []);

    // 2) Fetch & redraw whenever symbol, interval or type changes
    useEffect(() => {
        if (!chartRef.current) return;
        setLoading(true);

        (async () => {
            try {
                const res = await fetch(
                    `${API_BASE_URL}/market/${symbol}?interval=${interval}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                        },
                    }
                );
                const payload = await res.json();
                if (!res.ok) throw new Error(payload.msg || 'Fetch error');

                // Convert the API data to UNIX‐seconds format
                const raw = payload.map((d) => ({
                    time: Math.floor(
                        new Date(d.time.replace(' ', 'T') + 'Z').getTime() / 1000
                    ),
                    open: d.open,
                    high: d.high,
                    low: d.low,
                    close: d.close,
                }));

                // remove old series if any
                if (seriesRef.current) {
                    chartRef.current.removeSeries(seriesRef.current);
                }

                // add new series
                if (type === 'candlestick') {
                    const s = chartRef.current.addCandlestickSeries();
                    s.setData(raw);
                    seriesRef.current = s;
                } else {
                    const s = chartRef.current.addLineSeries({
                        priceLineVisible: false,
                        lastValueVisible: true,
                        priceScaleId: '',
                    });
                    s.setData(raw.map((d) => ({time: d.time, value: d.close})));
                    seriesRef.current = s;
                }

                // auto-scale to fit:
                chartRef.current.timeScale().fitContent();
            } catch (err) {
                console.error(err);
                alert('Error fetching market data');
            } finally {
                setLoading(false);
            }
        })();
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
                {watchlist.map((sym) => (
                    <button
                        key={sym}
                        onClick={() => setSymbol(sym)}
                        style={{
                            marginRight: 8,
                            fontWeight: sym === symbol ? 'bold' : 'normal',
                        }}
                    >
                        {sym}
                    </button>
                ))}
            </div>

            <div
                style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '12px',
                }}
            >
                <label>
                    Interval:{' '}
                    <select
                        value={interval}
                        onChange={(e) => setInterval(e.target.value)}
                    >
                        {[
                            '1min',
                            '5min',
                            '15min',
                            '30min',
                            '60min',
                            'daily',
                            'weekly',
                            'monthly',
                        ].map((iv) => (
                            <option key={iv} value={iv}>
                                {iv}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Type:{' '}
                    <select value={type} onChange={(e) => setType(e.target.value)}>
                        <option value="candlestick">Candlestick</option>
                        <option value="line">Line</option>
                    </select>
                </label>
            </div>

            {loading && <p>Loading Chart…</p>}
            <div
                ref={chartContainerRef}
                style={{
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    padding: '8px',
                    background: '#fff',
                }}
            />

            <div style={{marginTop: '20px'}}>
                <button onClick={() => (window.location.hash = '/analysis')}>
                    Go to CSV Analysis ↗
                </button>
            </div>
        </div>
    );
}
