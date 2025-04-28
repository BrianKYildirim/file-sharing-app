// frontend/src/components/MarketDashboard.js
import React, {useEffect, useRef, useState, lazy, Suspense} from 'react';
import {API_BASE_URL} from '../config';
import '../App.css';

// lazy‐load all file‐sharing components
const FileUpload = lazy(() => import('./FileUpload'));
const ShareModal = lazy(() => import('./ShareModal'));
const ContextMenu = lazy(() => import('./ContextMenu'));
const UsersModal = lazy(() => import('./UsersModal'));

export default function MarketDashboard() {
    const watchlist = ['AAPL', 'NVDA', 'GOOG'];
    const [symbol, setSymbol] = useState('AAPL');
    const [token] = useState(localStorage.getItem('access_token'));
    const [username, setUsername] = useState('');
    const [files, setFiles] = useState({owned_files: [], shared_files: []});
    const [shareModalFile, setShareModalFile] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [showUsersModal, setShowUsersModal] = useState(false);
    const [currentSharedUsers, setCurrentSharedUsers] = useState([]);

    const containerRef = useRef();

    // 1) Load TradingView script once
    useEffect(() => {
        if (!window.TradingView) {
            const s = document.createElement('script');
            s.src = 'https://s3.tradingview.com/tv.js';
            s.async = true;
            document.head.appendChild(s);
        }
    }, []);

    // 2) Re-create widget whenever symbol changes
    useEffect(() => {
        if (!window.TradingView || !containerRef.current) return;
        containerRef.current.innerHTML = '';
        new window.TradingView.widget({
            container_id: containerRef.current.id,
            autosize: true,
            symbol: `NASDAQ:${symbol}`,
            interval: 'D',
            timezone: 'Etc/UTC',
            theme: 'Light',
            style: '1',
            toolbar_bg: '#f1f3f6',
            enable_publishing: false,
            allow_symbol_change: true,
            hide_side_toolbar: false,
            show_popup_button: true,
            withdateranges: true,
            details: true,
            studies: [],
            locale: 'en',
        });
    }, [symbol]);

    // 3) Fetch user + files on mount
    useEffect(() => {
        if (!token) return;

        // get username
        fetch(`${API_BASE_URL}/user`, {headers: {Authorization: `Bearer ${token}`}})
            .then(r => r.json())
            .then(d => setUsername(d.username))
            .catch(console.error);

        // get files
        refreshFiles();

        // hide context menu on outside click
        const onClick = () => setContextMenu(null);
        window.addEventListener('click', onClick);
        return () => window.removeEventListener('click', onClick);
    }, [token]);

    // helper to reload file lists
    const refreshFiles = () => {
        fetch(`${API_BASE_URL}/files`, {headers: {Authorization: `Bearer ${token}`}})
            .then(r => r.json())
            .then(setFiles)
            .catch(console.error);
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        window.location.hash = '/';
    };

    const formatList = list => {
        if (list.length === 1) return list[0];
        if (list.length === 2) return list.join(' and ');
        return `${list.slice(0, -1).join(', ')}, and ${list[list.length - 1]}`;
    };

    // file‐sharing handlers
    const handleDownload = async file => {
        try {
            const res = await fetch(`${API_BASE_URL}/download/${file.id}`, {
                headers: {Authorization: `Bearer ${token}`},
            });
            const data = await res.json();
            if (res.ok && data.download_url) window.location.href = data.download_url;
            else alert(data.msg || 'Error downloading file.');
        } catch {
            alert('Error downloading file.');
        }
    };

    const handleFileRightClick = (file, e, isOwner) => {
        e.preventDefault();
        setContextMenu({x: e.pageX, y: e.pageY, file, isOwner});
    };
    const handleDotsClick = (file, e, isOwner) => {
        e.stopPropagation();
        const {right, top} = e.currentTarget.getBoundingClientRect();
        setContextMenu({x: right + window.scrollX, y: top + window.scrollY, file, isOwner});
    };

    const handleShare = file => setShareModalFile(file);

    const handleShareSubmit = async (file, validEmails, invalidFormatEmails) => {
        const successful = [];
        const already = [];
        const failed = [...invalidFormatEmails];

        for (const email of validEmails) {
            try {
                const res = await fetch(`${API_BASE_URL}/share`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({file_id: file.id, recipient_email: email}),
                });
                const data = await res.json();
                if (res.ok) successful.push(data.shared_username || email);
                else if (data.msg.includes('already has access')) already.push(email);
                else failed.push(email);
            } catch {
                failed.push(email);
            }
        }

        const msgs = [];
        if (successful.length) msgs.push(`Shared with ${formatList(successful)}.`);
        if (already.length) msgs.push(`${formatList(already)} already have access.`);
        if (failed.length) msgs.push(`Failed to share with ${formatList(failed)}.`);
        alert(msgs.join('\n'));

        refreshFiles();
        setShareModalFile(null);
    };

    const handleDelete = async file => {
        if (!window.confirm(`Delete "${file.filename}"?`)) return;
        try {
            const res = await fetch(`${API_BASE_URL}/files/${file.id}`, {
                method: 'DELETE',
                headers: {Authorization: `Bearer ${token}`},
            });
            const data = await res.json();
            if (res.ok) alert('Deleted.');
            else alert(data.msg);
            refreshFiles();
        } catch {
            alert('Error deleting.');
        }
    };

    const handleLeave = async file => {
        if (!window.confirm(`Leave collaboration on "${file.filename}"?`)) return;
        try {
            const res = await fetch(`${API_BASE_URL}/files/${file.id}/leave`, {
                method: 'POST',
                headers: {Authorization: `Bearer ${token}`},
            });
            const data = await res.json();
            if (res.ok) alert('Left collaboration.');
            else alert(data.msg);
            refreshFiles();
        } catch {
            alert('Error leaving collaboration.');
        }
    };

    const handleShowMore = sharedUsers => {
        setCurrentSharedUsers(sharedUsers);
        setShowUsersModal(true);
    };

    // not logged in?
    if (!token) {
        return (
            <div className="dashboard container" style={{padding: 20, textAlign: 'center'}}>
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
                        marginBottom: 10,
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
        <Suspense fallback={<div>Loading dashboard…</div>}>
            <div style={{marginTop: 40}}>
                <div className="dashboard-header">
                    <div>
                        <h2>Market Dashboard</h2>
                        {username && (
                            <p style={{marginTop: 5, fontSize: '0.95rem', color: '#555'}}>
                                Logged in as <strong>{username}</strong>
                            </p>
                        )}
                    </div>
                    <button className="logout-button" onClick={handleLogout}>Logout</button>
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

                {/* ── CSV / File Sharing UI ─────────────────────────────── */}
                <div style={{marginTop: 40}}>
                    <div className="dashboard-header">
                        <div>
                            <h2>File Sharing & CSV Analysis</h2>
                        </div>
                    </div>

                    <div className="file-upload-section">
                        <FileUpload onUploadComplete={refreshFiles}/>
                    </div>

                    <div className="files-wrapper">
                        {/* ── My Files ─────────────────────────────────────────────── */}
                        <section className="file-section">
                            <h3>My Files</h3>
                            <div className="files-grid">
                                {files.owned_files.map(f => (
                                    <div
                                        key={f.id}
                                        className="file-card"
                                        onContextMenu={e => handleFileRightClick(f, e, true)}
                                    >
                                        <div className="file-card-header">
                                            <h4>{f.filename}</h4>
                                            <div
                                                className="dots-button"
                                                onClick={e => handleDotsClick(f, e, true)}
                                            >
                                                &#8230;
                                            </div>
                                        </div>
                                        {f.shared_with_users.length > 0 && (
                                            <p style={{margin: '6px 0'}}>
                                                <strong>Shared with:</strong>{' '}
                                                {f.shared_with_users.slice(0, 3).map(u => u.username).join(', ')}
                                                {f.shared_with_users.length > 3 && (
                                                    <>
                                                        ,{' '}
                                                        <span
                                                            style={{color: 'blue', cursor: 'pointer'}}
                                                            onClick={() =>
                                                                handleShowMore(f.shared_with_users.map(u => u.username))
                                                            }
                                                        >
                              more…
                            </span>
                                                    </>
                                                )}
                                            </p>
                                        )}
                                        <p>
                                            <strong>Uploaded:</strong> {new Date(f.upload_time).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* ── Shared With Me ─────────────────────────────────────── */}
                        <section className="file-section">
                            <h3>Shared With Me</h3>
                            <div className="files-grid">
                                {files.shared_files.map(f => (
                                    <div
                                        key={f.id}
                                        className="file-card"
                                        onContextMenu={e => handleFileRightClick(f, e, false)}
                                    >
                                        <div className="file-card-header">
                                            <h4>{f.filename}</h4>
                                            <div
                                                className="dots-button"
                                                onClick={e => handleDotsClick(f, e, false)}
                                            >
                                                &#8230;
                                            </div>
                                        </div>
                                        <p><strong>Shared by:</strong> {f.shared_by}</p>
                                        <p><strong>Shared on:</strong> {new Date(f.shared_at).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* ── Context Menu & Modals ───────────────────────────────── */}
                    {contextMenu && (
                        <ContextMenu
                            x={contextMenu.x}
                            y={contextMenu.y}
                            file={contextMenu.file}
                            isOwner={contextMenu.isOwner}
                            onDownload={() => {
                                handleDownload(contextMenu.file);
                                setContextMenu(null);
                            }}
                            onShare={() => {
                                handleShare(contextMenu.file);
                                setContextMenu(null);
                            }}
                            onDelete={() => {
                                handleDelete(contextMenu.file);
                                setContextMenu(null);
                            }}
                            onLeave={() => {
                                handleLeave(contextMenu.file);
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
                            onShare={handleShareSubmit}
                        />
                    )}

                    {showUsersModal && (
                        <UsersModal
                            users={currentSharedUsers}
                            onClose={() => setShowUsersModal(false)}
                        />
                    )}
                </div>
            </div>
        </Suspense>
    );
}
