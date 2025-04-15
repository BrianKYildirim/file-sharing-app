// frontend/src/components/ShareModal.js

import React, {useState} from 'react';
import '../App.css';

function ShareModal({file, sharedUsers = [], onClose, onShare, onUnshareSuccess}) {
    const [recipientEmails, setRecipientEmails] = useState(['']);
    const [currentSharedUsers, setCurrentSharedUsers] = useState(sharedUsers);

    const handleRemoveUser = async (userId) => {
        try {
            const res = await fetch('/api/unshare', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({file_id: file.id, user_id: userId})
            });
            const data = await res.json();
            if (res.ok) {
                setCurrentSharedUsers(prev => prev.filter(u => u.id !== userId));
                onUnshareSuccess && onUnshareSuccess();
            } else {
                alert(data.msg || 'Error removing access.');
            }
        } catch (err) {
            console.error('Error removing access:', err);
            alert('Error removing access.');
        }
    };

    const handleEmailChange = (index, value) => {
        const newRecipients = [...recipientEmails];
        newRecipients[index] = value;
        setRecipientEmails(newRecipients);
    };

    const addRecipientField = () => {
        setRecipientEmails([...recipientEmails, '']);
    };

    const handleShareClick = () => {
        // Basic email validation & pass to parent onShare
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const validEmails = [];
        const invalidEmails = [];

        recipientEmails.forEach(email => {
            const trimmed = email.trim();
            if (trimmed === '') return; // skip blank fields
            if (emailRegex.test(trimmed)) {
                validEmails.push(trimmed);
            } else {
                invalidEmails.push(trimmed);
            }
        });

        if (validEmails.length === 0) {
            alert("Please enter at least one valid email.");
            return;
        }

        onShare(file, validEmails, invalidEmails);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3 style={{marginBottom: '20px'}}>Share "{file.filename}"</h3>

                {currentSharedUsers && currentSharedUsers.length > 0 && (
                    <div style={{marginBottom: '20px'}}>
                        <p style={{fontWeight: 'bold', marginBottom: '8px'}}>Currently shared with:</p>
                        <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                            {currentSharedUsers.map(user => (
                                <div
                                    key={user.id}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        backgroundColor: '#ffcc66',
                                        borderRadius: '20px',
                                        padding: '6px 12px'
                                    }}
                                >
                                    <span style={{marginRight: '8px'}}>{user.email}</span>
                                    <button
                                        onClick={() => handleRemoveUser(user.id)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '1rem'
                                        }}
                                    >
                                        &#x2715;
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {recipientEmails.map((email, index) => (
                    <input
                        key={index}
                        type="email"
                        placeholder="Recipient's Email"
                        value={email}
                        onChange={(e) => handleEmailChange(index, e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            marginBottom: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                        }}
                    />
                ))}

                <button
                    onClick={addRecipientField}
                    style={{
                        marginBottom: '20px',
                        padding: '6px 12px',
                        backgroundColor: '#0077cc',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Add more recipients
                </button>

                <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                    <button
                        onClick={handleShareClick}
                        style={{
                            marginRight: '10px',
                            padding: '8px 12px',
                            backgroundColor: '#0077cc',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Share
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            background: '#fff',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ShareModal;
