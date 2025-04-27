// frontend/src/components/AnalysisPage.js

import React, {useState, useEffect, lazy, Suspense} from 'react';
import {API_BASE_URL} from '../config';
import '../App.css';

// dynamic imports for code-splitting
const FileUpload = lazy(() => import('./FileUpload'));
const ShareModal = lazy(() => import('./ShareModal'));
const ContextMenu = lazy(() => import('./ContextMenu'));
const UsersModal = lazy(() => import('./UsersModal'));

export default function AnalysisPage() {
    const token = localStorage.getItem('access_token');

    const [files, setFiles] = useState({owned_files: [], shared_files: []});
    const [shareModalFile, setShareModalFile] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [username, setUsername] = useState('');
    const [showUsersModal, setShowUsersModal] = useState(false);
    const [currentSharedUsers, setCurrentSharedUsers] = useState([]);

    // fetch user info
    useEffect(() => {
        if (!token) return;
        (async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/user`, {
                    headers: {Authorization: `Bearer ${token}`},
                });
                if (res.ok) {
                    const data = await res.json();
                    setUsername(data.username);
                }
            } catch (e) {
                console.error('Error fetching user data:', e);
            }
        })();
    }, [token]);

    // fetch file lists + global click handler to dismiss context menu
    useEffect(() => {
        if (!token) return;
        const fetchFiles = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/files`, {
                    headers: {Authorization: `Bearer ${token}`},
                });
                if (res.ok) {
                    setFiles(await res.json());
                }
            } catch (e) {
                console.error('Error fetching files:', e);
            }
        };
        fetchFiles();
        const onClick = () => setContextMenu(null);
        window.addEventListener('click', onClick);
        return () => window.removeEventListener('click', onClick);
    }, [token]);

    // not logged in → prompt to log in
    if (!token) {
        return (
            <div className="dashboard container" style={{padding: '20px', textAlign: 'center'}}>
                <p style={{fontSize: '1.2rem', marginBottom: '20px'}}>
                    You must be logged in to view the dashboard.
                </p>
                <button
                    onClick={() => (window.location.hash = '/login')}
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

    const fetchFiles = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/files`, {
                headers: {Authorization: `Bearer ${token}`},
            });
            if (res.ok) {
                setFiles(await res.json());
            }
        } catch (e) {
            console.error('Error fetching files:', e);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        window.location.hash = '/';
    };

    const handleFileRightClick = (file, e, isOwner) => {
        e.preventDefault();
        setContextMenu({x: e.pageX, y: e.pageY, file, isOwner});
    };
    const handleDotsClick = (file, e, isOwner) => {
        e.stopPropagation();
        const {right, top} = e.currentTarget.getBoundingClientRect();
        setContextMenu({
            x: right + window.scrollX,
            y: top + window.scrollY,
            file,
            isOwner,
        });
    };
    const handleShowMore = sharedUsers => {
        setCurrentSharedUsers(sharedUsers);
        setShowUsersModal(true);
    };
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
    const handleShare = file => setShareModalFile(file);

    const formatList = list => {
        if (list.length === 1) return list[0];
        if (list.length === 2) return list.join(' and ');
        return `${list.slice(0, -1).join(', ')}, and ${list[list.length - 1]}`;
    };

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

        await fetchFiles();
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
            await fetchFiles();
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
            await fetchFiles();
        } catch {
            alert('Error leaving.');
        }
    };

    return (
        <Suspense fallback={<div>Loading dashboard…</div>}>
            <div className="dashboard container">
                <div className="dashboard-header">
                    <div>
                        <h2>Dashboard</h2>
                        {username && (
                            <p style={{marginTop: '5px', fontSize: '0.95rem', color: '#555'}}>
                                Logged in as <strong>{username}</strong>
                            </p>
                        )}
                    </div>
                    <button className="logout-button" onClick={handleLogout}>
                        Logout
                    </button>
                </div>

                <div className="file-upload-section">
                    <FileUpload onUploadComplete={fetchFiles}/>
                </div>

                <div className="files-wrapper">
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
                                            {f.shared_with_users
                                                .slice(0, 3)
                                                .map(u => u.username)
                                                .join(', ')}
                                            {f.shared_with_users.length > 3 && (
                                                <>
                                                    ,{' '}
                                                    <span
                                                        style={{color: 'blue', cursor: 'pointer'}}
                                                        onClick={() =>
                                                            handleShowMore(
                                                                f.shared_with_users.map(u => u.username)
                                                            )
                                                        }
                                                    >
                            more…
                          </span>
                                                </>
                                            )}
                                        </p>
                                    )}
                                    <p>
                                        <strong>Uploaded:</strong>{' '}
                                        {new Date(f.upload_time).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

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
                                    <p>
                                        <strong>Shared by:</strong> {f.shared_by}
                                    </p>
                                    <p>
                                        <strong>Shared on:</strong>{' '}
                                        {new Date(f.shared_at).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

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
        </Suspense>
    );
}