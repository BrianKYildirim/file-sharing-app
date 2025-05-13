// frontend/src/components/ContextMenu.js

import React from 'react';
import '../App.css';

function ContextMenu({ x, y, file, isOwner, onDownload, onShare, onDelete, onLeave, onClose }) {
  const style = {
    position: 'absolute',   // <-- switched to fixed
    top: y,
    left: x,
    background: '#fff',
    border: '1px solid #ccc',
    padding: '8px',
    zIndex: 1000,
    boxShadow: '0px 0px 5px rgba(0,0,0,0.3)',
  };

  const handleDownload = () => {
    onDownload();
    onClose();
  };

  const handleShare = () => {
    onShare();
    onClose();
  };

  return (
    <div style={style}>
      <div onClick={onDownload} style={{ padding: '6px 12px', cursor: 'pointer' }}>
        Download
      </div>
      {isOwner ? (
        // If the user is the owner, show "Share" and "Delete"
        <>
          <div onClick={onShare} style={{ padding: '6px 12px', cursor: 'pointer' }}>
            Share
          </div>
          <div onClick={onDelete} style={{ padding: '6px 12px', cursor: 'pointer', color: 'red' }}>
            Delete
          </div>
        </>
      ) : (
        // Otherwise, show "Leave collaboration"
        <div onClick={onLeave} style={{ padding: '6px 12px', cursor: 'pointer', color: 'red' }}>
          Leave collaboration
        </div>
      )}
    </div>
  );
}

export default ContextMenu;