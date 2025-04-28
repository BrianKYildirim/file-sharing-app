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

    // initialize chart once
    useEffect(() => {
        const chart = createChart(chartContainer.current, {
            width: chartContainer.current.clientWidth,
            height: 400,
            layout: {backgroundColor: '#ffffff', textColor: '#333'},
            grid: {vertLines: {color: '#eee'}, horzLines: {color: '#eee'}},
            crosshair: {mode: CrosshairMode.Normal},
            rightPriceScale: {borderColor: '#ccc'},
            timeScale: {borderColor: '#ccc', timeVisible: true, secondsVisible: false},
        });
        chartRef.current = chart;

        // resize
        const handleResize = () => chart.applyOptions({width: chartContainer.current.clientWidth});
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, []);

    // whenever symbol/interval/type changes, fetch & redraw
    useEffect(() => {
        if (!chartRef.current) return;
        setLoading(true);

        fetch(`${API_BASE_URL}/market/${symbol}?interval=${interval}`, {
            headers: {Authorization: `Bearer ${localStorage.getItem('access_token')}`},
        })
            .then(r => r.json().then(data => ({ok: r.ok, data})))
            .then(({ok, data}) => {
                setLoading(false);
                if (!ok) throw new Error(data.msg || 'Fetch error');

                // remove old series
                if (seriesRef.current) chartRef.current.removeSeries(seriesRef.current);

                // add new series
                if (type === 'candlestick') {
                    const s = chartRef.current.addCandlestickSeries();
                    s.setData(data);
                    seriesRef.current = s;

                } else {
                    const s = chartRef.current.addLineSeries({
                        priceLineVisible: false,
                        lastValueVisible: true,
                        priceScaleId: '',
                    });
                    // line series wants time:number|time object; we can pass ISO strings
                    s.setData(data.map(d => ({time: d.time, value: d.close})));
                    seriesRef.current = s;
                }

                // fit to data
                chartRef.current.timeScale().fitContent();
            })
            .catch(err => {
                setLoading(false);
                console.error(err);
                alert('Error fetching market data');
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

            <div style={{marginBottom: '12px'}}>
                <strong>Watchlist:</strong>{' '}
                {watchlist.map(sym => (
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

            <div style={{display: 'flex', gap: '8px', marginBottom: '12px'}}>
                <label>
                    Interval:
                    <select value={interval} onChange={e => setInterval(e.target.value)}>
                        {['1min', '5min', '15min', '30min', '60min', 'daily', 'weekly', 'monthly']
                            .map(iv => <option key={iv} value={iv}>{iv}</option>)}
                    </select>
                </label>

                <label>
                    Type:
                    <select value={type} onChange={e => setType(e.target.value)}>
                        <option value="candlestick">Candlestick</option>
                        <option value="line">Line</option>
                    </select>
                </label>
            </div>

            {loading && <p>Loading Chart…</p>}
            <div
                ref={chartContainer}
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
