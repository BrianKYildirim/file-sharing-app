// frontend/src/components/ShareModal.js

import React, { useState } from 'react';
import '../App.css';

function ShareModal({ file, onClose, onShare }) {
  const [recipientEmail, setRecipientEmail] = useState('');

  const handleShareClick = () => {
    if (recipientEmail.trim() === '') {
      alert('Please enter a valid email.');
      return;
    }
    onShare(file, recipientEmail);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 style={{ marginBottom: '20px' }}>Share "{file.filename}"</h3>
        <input
          type="email"
          placeholder="Recipient's Email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '20px', border: '1px solid #ddd', borderRadius: '4px' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleShareClick} style={{ marginRight: '10px', padding: '8px 12px', backgroundColor: '#0077cc', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Share</button>
          <button onClick={onClose} style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default ShareModal;
