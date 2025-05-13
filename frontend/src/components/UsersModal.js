
// frontend/src/components/UsersModal.js

import React from 'react';
import '../App.css'

function UsersModal({ users, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Users with Access</h3>
        <ul>
          {users.map((username, idx) => (
            <li key={idx}>{username}</li>
          ))}
        </ul>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default UsersModal;
