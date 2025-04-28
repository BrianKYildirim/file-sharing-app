// frontend/src/components/MarketDashboard.js
import React, {useEffect, useRef, useState, lazy, Suspense} from 'react';
import {API_BASE_URL} from '../config';
import '../App.css';

// lazy‐load all the analysis subcomponents
const FileUpload   = lazy(() => import('./FileUpload'));
const ShareModal   = lazy(() => import('./ShareModal'));
const ContextMenu  = lazy(() => import('./ContextMenu'));
const UsersModal   = lazy(() => import('./UsersModal'));

export default function MarketDashboard() {
  const watchlist = ['AAPL', 'NVDA', 'GOOG'];
  const [symbol, setSymbol]             = useState('AAPL');
  const [token]                         = useState(localStorage.getItem('access_token'));
  const [files, setFiles]               = useState({owned_files: [], shared_files: []});
  const [shareModalFile, setShareModalFile] = useState(null);
  const [contextMenu, setContextMenu]       = useState(null);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [currentSharedUsers, setCurrentSharedUsers] = useState([]);
  const [username, setUsername] = useState('');
  const containerRef = useRef();

  //
  // 1) load TradingView widget script once
  //
  useEffect(() => {
    if (!window.TradingView) {
      const s = document.createElement('script');
      s.src = 'https://s3.tradingview.com/tv.js';
      s.async = true;
      document.head.appendChild(s);
    }
  }, []);

  //
  // 2) whenever `symbol` changes, (re)create the chart
  //
  useEffect(() => {
    if (!window.TradingView || !containerRef.current) return;
    containerRef.current.innerHTML = '';
    new window.TradingView.widget({
      container_id:       containerRef.current.id,
      autosize:           true,
      symbol:             `NASDAQ:${symbol}`,
      interval:           'D',
      timezone:           'Etc/UTC',
      theme:              'Light',
      style:              '1',
      toolbar_bg:         '#f1f3f6',
      enable_publishing:  false,
      allow_symbol_change:true,
      hide_side_toolbar:  false,
      show_popup_button:  true,
      withdateranges:     true,
      details:            true,
      studies:            [],
      locale:             'en',
    });
  }, [symbol]);

  //
  // 3) fetch user + files once on mount
  //
  useEffect(() => {
    if (!token) return;

    // fetch user name
    fetch(`${API_BASE_URL}/user`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setUsername(d.username))
      .catch(console.error);

    // fetch files list
    const loadFiles = () =>
      fetch(`${API_BASE_URL}/files`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(setFiles)
        .catch(console.error);

    loadFiles();
    // hide context menu on outer click
    const onClick = () => setContextMenu(null);
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, [token]);

  // common handlers (download, delete, share, etc.)...
  // … reuse all your existing functions from AnalysisPage
  // (handleDownload, handleShare, handleShareSubmit, handleDelete, handleLeave, handleFileRightClick, handleDotsClick, handleShowMore)
  // I’ll elide them here for brevity—just copy-paste from your AnalysisPage.

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    window.location.hash = '/';
  };

  // wrapper to refresh files:
  const refreshFiles = () => {
    if (!token) return;
    fetch(`${API_BASE_URL}/files`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(setFiles)
      .catch(console.error);
  };

  // … copy all of your AnalysisPage handler functions here, but
  // reference `refreshFiles()` instead of `fetchFiles()`.

  return (
    <Suspense fallback={<div>Loading dashboard…</div>}>
      <div className="dashboard container">
        {/* ─────────────────────────────────────────────────────────── */}
        {/* Market chart header + watchlist buttons */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div className="dashboard-header">
          <h2>Market Dashboard</h2>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <strong>Watchlist:</strong>{' '}
          {watchlist.map(t => (
            <button
              key={t}
              onClick={() => setSymbol(t)}
              style={{ marginRight: 8, fontWeight: t === symbol ? 'bold' : 'normal' }}
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

        {/* ─────────────────────────────────────────────────────────── */}
        {/* CSV Analysis UI */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div style={{ marginTop: 40 }}>
          <div className="dashboard-header">
            <div>
              <h2>File Sharing & CSV Analysis</h2>
              {username && (
                <p style={{ marginTop: 5, fontSize: '0.95rem', color: '#555' }}>
                  Logged in as <strong>{username}</strong>
                </p>
              )}
            </div>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>

          <div className="file-upload-section">
            <FileUpload onUploadComplete={refreshFiles} />
          </div>

          <div className="files-wrapper">
            {/* …owned files grid… */}
            {/* …shared files grid… */}
          </div>

          {contextMenu && (
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              file={contextMenu.file}
              isOwner={contextMenu.isOwner}
              onDownload={() => {
                // call your handleDownload
                setContextMenu(null);
              }}
              onShare={() => {
                // call your handleShare
                setContextMenu(null);
              }}
              onDelete={() => {
                // call your handleDelete
                setContextMenu(null);
              }}
              onLeave={() => {
                // call your handleLeave
                setContextMenu(null);
              }}
              onClose={() => setContextMenu(null)}
            />
          )}

          {shareModalFile && (
            <ShareModal
              file={shareModalFile}
              sharedUsers={shareModalFile.shared_with_users}
              onClose={() => setShareModalFile(null)}
              onShare={/* your handleShareSubmit */}
            />
          )}

          {showUsersModal && (
            <UsersModal users={currentSharedUsers} onClose={() => setShowUsersModal(false)} />
          )}
        </div>
      </div>
    </Suspense>
  );
}
