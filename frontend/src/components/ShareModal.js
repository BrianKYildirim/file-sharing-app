// frontend/src/components/ShareModal.js

import React, {useState} from 'react';
import '../App.css';

function ShareModal({file, sharedUsers = [], onClose, onShare, onUnshareSuccess}) {
    // State for multiple email input fields
    const [recipientEmails, setRecipientEmails] = useState(['']);
    const [currentSharedUsers, setCurrentSharedUsers] = useState(sharedUsers);

    // Remove access from a user who already has it (the unshare logic)
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
                // Remove that user from local state
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

    // If no email is entered, close the modal. Otherwise, run the share logic.
    const handleOkayClick = () => {
        // Trim and filter out empty fields
        const trimmed = recipientEmails.map(e => e.trim()).filter(e => e !== '');
        if (trimmed.length === 0) {
            // User did not enter any valid text, simply close
            onClose();
            return;
        }

        // Otherwise, separate emails into valid vs. invalid (format)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const validEmails = [];
        const invalidEmails = [];
        trimmed.forEach(email => {
            if (emailRegex.test(email)) {
                validEmails.push(email);
            } else {
                invalidEmails.push(email);
            }
        });

        // Pass arrays to the parent’s onShare logic
        onShare(file, validEmails, invalidEmails);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3 style={{marginBottom: '20px'}}>Share "{file.filename}"</h3>

                {/* Already-shared users, each with an 'X' to unshare */}
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

                {/* Input fields for new recipients */}
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

                {/* Bottom buttons: Okay and Cancel */}
                <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                    <button
                        onClick={handleOkayClick}
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
                        Okay
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