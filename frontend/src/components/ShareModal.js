// frontend/src/components/ShareModal.js

import React, {useState} from 'react';
import '../App.css';

function ShareModal({file, onClose, onShare}) {
    // Start with one empty input field.
    const [recipientEmails, setRecipientEmails] = useState(['']);

    // Update an email in the list.
    const handleEmailChange = (index, value) => {
        const newRecipients = [...recipientEmails];
        newRecipients[index] = value;
        setRecipientEmails(newRecipients);
    };

    // Add a new empty email field.
    const addRecipientField = () => {
        setRecipientEmails([...recipientEmails, '']);
    };

    // When the user clicks "Share", split the emails into those with valid format and those invalid.
    const handleShareClick = () => {
        // A simple email validation regex.
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const validEmails = [];
        const invalidEmails = [];

        recipientEmails.forEach(email => {
            const trimmed = email.trim();
            if (trimmed === "") return; // Skip blank fields.
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

        // Pass the file, valid emails array, and the invalid (format) emails.
        onShare(file, validEmails, invalidEmails);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3 style={{marginBottom: '20px'}}>Share "{file.filename}"</h3>
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
