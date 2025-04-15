// frontend/src/components/Dashboard.js

import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import FileUpload from './FileUpload';
import ShareModal from './ShareModal';
import ContextMenu from './ContextMenu';
import UsersModal from './UsersModal';
import {API_BASE_URL} from '../config';
import '../App.css';

function Dashboard() {
    const navigate = useNavigate();
    const token = localStorage.getItem('access_token');

    const [files, setFiles] = useState({owned_files: [], shared_files: []});
    const [shareModalFile, setShareModalFile] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [username, setUsername] = useState('');
    const [showUsersModal, setShowUsersModal] = useState(false);
    const [currentSharedUsers, setCurrentSharedUsers] = useState([]);

    const fetchUserData = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/user`, {
                headers: {'Authorization': `Bearer ${token}`},
            });
            if (res.ok) {
                const data = await res.json();
                setUsername(data.username);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const fetchFiles = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/files`, {
                headers: {'Authorization': `Bearer ${token}`},
            });
            const data = await res.json();
            if (res.ok) {
                setFiles(data);
            }
        } catch (err) {
            console.error('Error fetching files:', err);
        }
    };

    useEffect(() => {
        if (!token) return;
        fetchUserData();
    }, [token]);

    useEffect(() => {
        if (!token) return;
        fetchFiles();
        const handleClickOutside = () => setContextMenu(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [token]);

    if (!token) {
        return (
            <div className="dashboard container" style={{padding: '20px', textAlign: 'center'}}>
                <p style={{fontSize: '1.2rem', marginBottom: '20px'}}>
                    You must be logged in to view the dashboard.
                </p>
                <button
                    onClick={() => navigate('/login')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#0077cc',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginBottom: '10px'
                    }}
                >
                    Log in here
                </button>
                <p>
                    New user? <a href="/signup">Register here</a>
                </p>
            </div>
        );
    }

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        navigate('/');
    };

    const handleFileRightClick = (file, event, isOwner) => {
        event.preventDefault();
        setContextMenu({
            x: event.pageX,
            y: event.pageY,
            file,
            isOwner,
        });
    };

    const handleDotsClick = (file, event, isOwner) => {
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        setContextMenu({
            x: rect.right + window.scrollX,
            y: rect.top + window.scrollY,
            file,
            isOwner,
        });
    };

    const handleShowMore = (sharedUsers) => {
        setCurrentSharedUsers(sharedUsers);
        setShowUsersModal(true);
    };

    const handleDownload = async (file) => {
        try {
            const res = await fetch(`${API_BASE_URL}/download/${file.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (res.ok && data.download_url) {
                window.location.href = data.download_url;
            } else {
                alert(data.msg || 'Error downloading file.');
            }
        } catch (error) {
            alert('Error downloading file.');
            console.error(error);
        }
    };

    const handleShare = (file) => {
        setShareModalFile(file);
    };

    const formatList = (list) => {
        if (list.length === 1) return list[0];
        if (list.length === 2) return list[0] + " and " + list[1];
        return list.slice(0, list.length - 1).join(", ") + ", and " + list[list.length - 1];
    };

    const handleShareSubmit = async (file, validEmails, invalidFormatEmails) => {
        const successfulUsernames = [];
        const alreadyHasAccessUsernames = [];
        // Start failedEmails with those that failed our initial basic format check.
        const failedEmails = [...invalidFormatEmails];

        for (const email of validEmails) {
            try {
                const res = await fetch(`${API_BASE_URL}/share`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    },
                    body: JSON.stringify({file_id: file.id, recipient_email: email})
                });
                const data = await res.json();
                if (res.ok) {
                    // If the share is successful, record the returned username (or fallback to the email).
                    successfulUsernames.push(data.shared_username || email);
                } else {
                    // Check if the error signals that the recipient already has access.
                    if (data.msg === "The recipient already has access to this file") {
                        alreadyHasAccessUsernames.push(data.shared_username || email);
                    } else {
                        // For any other error, add the email to the failed list.
                        failedEmails.push(email);
                    }
                }
            } catch (error) {
                console.error('Error sharing with', email, error);
                failedEmails.push(email);
            }
        }

        let successMessage = "";
        let alreadyMessage = "";
        let failureMessage = "";

        if (successfulUsernames.length > 0) {
            successMessage = "Shared successfully with: " + formatList(successfulUsernames) + ".";
        }
        if (alreadyHasAccessUsernames.length > 0) {
            if (alreadyHasAccessUsernames.length === 1) {
                alreadyMessage = "This user already has access: " + alreadyHasAccessUsernames[0] + ".";
            } else {
                alreadyMessage = "These users already have access: " + formatList(alreadyHasAccessUsernames) + ".";
            }
        }
        if (failedEmails.length > 0) {
            if (failedEmails.length === 1) {
                failureMessage = "Failed to find a user associated with this email: " + failedEmails[0] + ".";
            } else {
                failureMessage = "Failed to find a user associated with these emails: " + formatList(failedEmails) + ".";
            }
        }
        const messages = [];
        if (successMessage) messages.push(successMessage);
        if (alreadyMessage) messages.push(alreadyMessage);
        if (failureMessage) messages.push(failureMessage);

        alert(messages.join("\n"));
        // Refresh the file list and close the share modal.
        fetchFiles();
        setShareModalFile(null);
    };

    const handleDelete = async (file) => {
        if (!window.confirm(`Are you sure you want to delete "${file.filename}"?`)) return;
        try {
            const res = await fetch(`${API_BASE_URL}/files/${file.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (res.ok) {
                alert('File deleted successfully');
                fetchFiles();
            } else {
                alert(data.msg || 'Error deleting file');
            }
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    };

    const handleLeave = async (file) => {
        if (!window.confirm(`Are you sure you want to leave collaboration for "${file.filename}"?`)) return;
        try {
            const res = await fetch(`${API_BASE_URL}/files/${file.id}/leave`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (res.ok) {
                alert('You have left the collaboration');
                fetchFiles();
            } else {
                alert(data.msg || 'Error leaving collaboration');
            }
        } catch (error) {
            console.error('Error leaving collaboration:', error);
        }
    };

    return (
        <div className="dashboard container">
            <div className="dashboard-header">
                <div>
                    <h2>Dashboard</h2>
                    {username && (
                        <p style={{marginTop: '5px', fontSize: '0.95rem', color: '#555'}}>
                            Logged in as: <strong>{username}</strong>
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
                        {files.owned_files.map((file) => (
                            <div
                                key={file.id}
                                className="file-card"
                                onContextMenu={(e) => handleFileRightClick(file, e, true)}
                            >
                                <div className="file-card-header">
                                    <h4>{file.filename}</h4>
                                    <div className="dots-button" onClick={(e) => handleDotsClick(file, e, true)}>
                                        &#8230;
                                    </div>
                                </div>
                                {file.shared_with_users && file.shared_with_users.length > 0 && (
                                    <div style={{marginBottom: '6px'}}>
                                        <p>
                                            <strong>Shared with: </strong>
                                            {file.shared_with_users.slice(0, 3).join(', ')}
                                            {file.shared_with_users.length > 3 && (
                                                <>
                                                    ,{' '}
                                                    <span
                                                        style={{color: 'blue', cursor: 'pointer'}}
                                                        onClick={() => handleShowMore(file.shared_with_users)}
                                                    >
                                    more...
                                  </span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                )}
                                <p>
                                    <strong>Uploaded:</strong>{' '}
                                    {new Date(file.upload_time).toLocaleString('en-US', {
                                        dateStyle: 'short',
                                        timeStyle: 'short',
                                    })}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="file-section">
                    <h3>Shared With Me</h3>
                    <div className="files-grid">
                        {files.shared_files.map((file) => (
                            <div
                                key={file.id}
                                className="file-card"
                                onContextMenu={(e) => handleFileRightClick(file, e, false)}
                            >
                                <div className="file-card-header">
                                    <h4>{file.filename}</h4>
                                    <div className="dots-button" onClick={(e) => handleDotsClick(file, e, false)}>
                                        &#8230;
                                    </div>
                                </div>
                                {file.shared_with_users && file.shared_with_users.length > 0 && (
                                    <div style={{marginBottom: '6px'}}>
                                        <p>
                                            <strong>Shared with: </strong>
                                            {file.shared_with_users.slice(0, 3).join(', ')}
                                            {file.shared_with_users.length > 3 && (
                                                <>
                                                    ,{' '}
                                                    <span
                                                        style={{color: 'blue', cursor: 'pointer'}}
                                                        onClick={() => handleShowMore(file.shared_with_users)}
                                                    >
                            more...
                          </span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                )}
                                <p>
                                    <strong>Shared by:</strong> {file.shared_by}
                                </p>
                                <p>
                                    <strong>Shared on:</strong>{' '}
                                    {new Date(file.shared_at).toLocaleString('en-US', {
                                        dateStyle: 'short',
                                        timeStyle: 'short',
                                    })}
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
                    onDownload={() => handleDownload(contextMenu.file)}
                    onShare={() => handleShare(contextMenu.file)}
                    onDelete={() => handleDelete(contextMenu.file)}
                    onLeave={() => handleLeave(contextMenu.file)}
                    onClose={() => setContextMenu(null)}
                />
            )}

            {shareModalFile && (
                <ShareModal
                    file={shareModalFile}
                    onClose={() => setShareModalFile(null)}
                    onShare={handleShareSubmit}
                />
            )}


            {showUsersModal && (
                <UsersModal users={currentSharedUsers} onClose={() => setShowUsersModal(false)}/>
            )}
        </div>
    );
}

export default Dashboard;
