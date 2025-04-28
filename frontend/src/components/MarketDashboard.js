// frontend/src/components/MarketDashboard.js

import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { API_BASE_URL } from '../config';
import '../App.css';

export default function MarketDashboard() {
  const token = localStorage.getItem('access_token');

  const symbols = ['AAPL', 'SPY', 'GOOG'];
  const [selected, setSelected] = useState(symbols[0]);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  // fetch & render data whenever `selected` changes
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/market/${selected}?period=1d&interval=1m`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        if (!res.ok) {
          console.error('Market API error:', data.msg);
          return;
        }

        // build time-axis labels and close-price dataset
        const labels = data.map(d =>
          new Date(d.time).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })
        );
        const closes = data.map(d => d.close);

        setChartData({
          labels,
          datasets: [
            {
              label: `${selected} Close`,
              data: closes,
              borderColor: '#0077cc',
              backgroundColor: 'rgba(0,0,0,0)', // no fill
              tension: 0.2,
            },
          ],
        });
      } catch (err) {
        console.error('Fetch market data failed:', err);
      }
    })();
  }, [selected, token]);

  const handleSelect = sym => {
    setSelected(sym);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    window.location.hash = '/';
  };

  // if not authenticated, force login
  if (!token) {
    return (
      <div className="dashboard container" style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
          You must be logged in to view the dashboard.
        </p>
        <button
          onClick={() => window.location.hash = '/login'}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0077cc',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '10px',
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

  return (
    <div className="dashboard container">
      <div className="dashboard-header">
        <h2>Market Dashboard</h2>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <strong>Watchlist:</strong>{' '}
        {symbols.map(sym => (
          <button
            key={sym}
            onClick={() => handleSelect(sym)}
            style={{
              marginRight: '8px',
              fontWeight: sym === selected ? 'bold' : 'normal',
            }}
          >
            {sym}
          </button>
        ))}
      </div>

      <div className="file-section">
        <h3>{selected} Intraday Price</h3>
        <Line
          data={chartData}
          options={{
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Time',
                },
              },
              y: {
                title: {
                  display: true,
                  text: 'Price (USD)',
                },
              },
            },
            plugins: {
              tooltip: {
                mode: 'index',
                intersect: false,
              },
              legend: {
                display: false,
              },
            },
            maintainAspectRatio: false,
          }}
          height={300}
        />
      </div>

      <div style={{ marginTop: '30px' }}>
        <button onClick={() => (window.location.hash = '/analysis')}>
          Go to CSV Analysis ↗
        </button>
      </div>
    </div>
  );
}
