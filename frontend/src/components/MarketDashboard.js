// frontend/src/components/MarketDashboard.js
import React, {useState, useEffect, useRef} from 'react';
import {createChart, CrosshairMode} from 'lightweight-charts';
import {API_BASE_URL} from '../config';
import '../App.css';

export default function MarketDashboard() {
    const chartContainer = useRef();
    const chartRef = useRef();
    const seriesRef = useRef();

    const [symbol, setSymbol] = useState('AAPL');
    const [interval, setInterval] = useState('1min');
    const [type, setType] = useState('candlestick'); // or "line"
    const [loading, setLoading] = useState(false);
    const watchlist = ['AAPL', 'SPY', 'GOOG'];

    // 1) create the chart once
    useEffect(() => {
        const chart = createChart(chartContainer.current, {
            width: chartContainer.current.clientWidth,
            height: 400,
            layout: {
                backgroundColor: '#ffffff',
                textColor: '#333',
            },
            grid: {
                vertLines: {color: '#eee'},
                horzLines: {color: '#eee'},
            },
            crosshair: {mode: CrosshairMode.Normal},
            rightPriceScale: {borderColor: '#ccc'},
            timeScale: {
                borderColor: '#ccc',
                timeVisible: true,
                secondsVisible: false,
            },
        });
        chartRef.current = chart;

        // keep it responsive
        const handleResize = () =>
            chart.applyOptions({width: chartContainer.current.clientWidth});
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, []);

    // 2) whenever symbol/interval/type change, re-fetch & redraw
    useEffect(() => {
        if (!chartRef.current) return;
        setLoading(true);

        fetch(
            `${API_BASE_URL}/market/${symbol}?interval=${interval}`,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                },
            }
        )
            .then(async (r) => {
                const data = await r.json();
                if (!r.ok) throw new Error(data.msg || 'API error');
                return data;
            })
            .then((data) => {
                setLoading(false);

                // clear old series
                if (seriesRef.current) {
                    chartRef.current.removeSeries(seriesRef.current);
                    seriesRef.current = null;
                }

                // re-add the right series type
                let newSeries;
                if (type === 'candlestick') {
                    newSeries = chartRef.current.addCandlestickSeries({
                        upColor: '#26a69a',
                        downColor: '#ef5350',
                        wickUpColor: '#26a69a',
                        wickDownColor: '#ef5350',
                    });

                    // OHLCV expects { time: <number>, open, high, low, close }
                    newSeries.setData(
                        data.map((d) => ({
                            time: Math.floor(new Date(d.time).getTime() / 1000),
                            open: d.open,
                            high: d.high,
                            low: d.low,
                            close: d.close,
                        }))
                    );
                } else {
                    newSeries = chartRef.current.addLineSeries({
                        priceLineVisible: false,
                        lastValueVisible: true,
                    });

                    newSeries.setData(
                        data.map((d) => ({
                            time: Math.floor(new Date(d.time).getTime() / 1000),
                            value: d.close,
                        }))
                    );
                }

                seriesRef.current = newSeries;
                chartRef.current.timeScale().fitContent();
            })
            .catch((err) => {
                setLoading(false);
                console.error(err);
                alert(err.message.startsWith('Unsupported')
                    ? err.message
                    : 'Error fetching market data');
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
                {watchlist.map((sym) => (
                    <button
                        key={sym}
                        onClick={() => setSymbol(sym)}
                        style={{marginRight: 8, fontWeight: sym === symbol ? 'bold' : 'normal'}}
                    >
                        {sym}
                    </button>
                ))}
            </div>

            <div style={{display: 'flex', gap: 8, marginBottom: 12}}>
                <label>
                    Interval:
                    <select value={interval} onChange={(e) => setInterval(e.target.value)}>
                        {['1min', '5min', '15min', '30min', '60min', 'daily', 'weekly', 'monthly'].map(
                            (iv) => (
                                <option key={iv} value={iv}>
                                    {iv}
                                </option>
                            )
                        )}
                    </select>
                </label>

                <label>
                    Type:
                    <select value={type} onChange={(e) => setType(e.target.value)}>
                        <option value="candlestick">Candlestick</option>
                        <option value="line">Line</option>
                    </select>
                </label>
            </div>

            {loading && <p>Loading chart…</p>}

            <div
                ref={chartContainer}
                style={{
                    border: '1px solid #ddd',
                    borderRadius: 6,
                    padding: 8,
                    background: '#fff',
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
