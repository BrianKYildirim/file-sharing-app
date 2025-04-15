// frontend/src/components/Dashboard.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUpload from './FileUpload';
import ShareModal from './ShareModal';
import ContextMenu from './ContextMenu';
import UsersModal from './UsersModal';
import { API_BASE_URL } from '../config';
import '../App.css';

function Dashboard() {
  const navigate = useNavigate();
  const [files, setFiles] = useState({ owned_files: [], shared_files: [] });
  const [shareModalFile, setShareModalFile] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [username, setUsername] = useState('');
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [currentSharedUsers, setCurrentSharedUsers] = useState([]);

  // Check if the user is logged in by looking for the access token.
  const token = localStorage.getItem('access_token');
  if (!token) {
    return (
        <div className="dashboard container" style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
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

  // Fetch user data (like username) when logged in
  const fetchUserData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUsername(data.username);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Fetches list of files for the logged-in user
  const fetchFiles = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/files`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
    fetchFiles();
    // Close context menu if the user clicks elsewhere
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Logs out the user
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/');
  };

  // Right-click context menu
  const handleFileRightClick = (file, event, isOwner) => {
    event.preventDefault();
    setContextMenu({
      x: event.pageX,
      y: event.pageY,
      file,
      isOwner
    });
  };

  const handleDotsClick = (file, event, isOwner) => {
    event.stopPropagation(); // Prevent parent clicks from interfering
    const rect = event.currentTarget.getBoundingClientRect();

    setContextMenu({
      x: rect.right + window.scrollX,
      y: rect.top + window.scrollY,
      file,
      isOwner
    });
  };

  const handleShowMore = (sharedUsers) => {
    setCurrentSharedUsers(sharedUsers);
    setShowUsersModal(true);
  };

  // Download action
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

  // Share action (opens modal)
  const handleShare = (file) => {
    setShareModalFile(file);
  };

  // Handles ShareModal submission
  const handleShareSubmit = async (file, recipientEmail) => {
    try {
      const res = await fetch(`${API_BASE_URL}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ file_id: file.id, recipient_email: recipientEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('File shared successfully!');
        fetchFiles();
      } else {
        alert(data.msg || 'Error sharing file.');
      }
    } catch (error) {
      console.error('Error sharing file:', error);
      alert('Error sharing file.');
    }
    setShareModalFile(null);
  };

  const handleDelete = async (file) => {
    if (!window.confirm(`Are you sure you want to delete "${file.filename}"?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/files/${file.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        alert('File deleted successfully');
        fetchFiles(); // refresh the file list
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
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        alert('You have left the collaboration');
        fetchFiles(); // Refresh the file list
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
                        <div style={{ marginBottom: '6px' }}>
                          <p><strong>Shared with: </strong>
                            {file.shared_with_users.slice(0, 3).join(', ')}
                            {file.shared_with_users.length > 3 && (
                                <>
                                  , <span
                                    style={{ color: 'blue', cursor: 'pointer' }}
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
                        timeStyle: 'short'
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
                        <div style={{ marginBottom: '6px' }}>
                          <p><strong>Shared with: </strong>
                            {file.shared_with_users.slice(0, 3).join(', ')}
                            {file.shared_with_users.length > 3 && (
                                <>
                                  , <span
                                    style={{ color: 'blue', cursor: 'pointer' }}
                                    onClick={() => handleShowMore(file.shared_with_users)}
                                >
                                  more...
                                  </span>
                                </>
                            )}
                          </p>
                          </div>
                    )}
                    <p><strong>Shared by:</strong> {file.shared_by}</p>
                    <p><strong>Shared on:</strong> {new Date(file.shared_at).toLocaleString('en-US', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}</p>
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
            <UsersModal
                users={currentSharedUsers}
                onClose={() => setShowUsersModal(false)}
            />
        )}
      </div>
  );
}

export default Dashboard;
