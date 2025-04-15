// frontend/src/components/FileUpload.js

import React, {useState} from 'react';
import {API_BASE_URL} from '../config';

function FileUpload({onUploadComplete}) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [message, setMessage] = useState('');

    const [recipientEmails, setRecipientEmails] = useState(['']);

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
        setMessage('');
    };

    const handleEmailChange = (index, value) => {
        const newRecipients = [...recipientEmails];
        newRecipients[index] = value;
        setRecipientEmails(newRecipients);
    };

    const addRecipientField = () => {
        setRecipientEmails([...recipientEmails, '']);
    };

    const formatList = (list) => {
        if (list.length === 1) return list[0];
        if (list.length === 2) return list[0] + " and " + list[1];
        return list.slice(0, list.length - 1).join(", ") + ", and " + list[list.length - 1];
    };

    const handlePost = async () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const uploadRes = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: formData,
            });
            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) {
                setMessage(uploadData.msg || 'Upload failed');
                return;
            }
            const fileId = uploadData.file_id;

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const validEmails = [];
            const invalidEmails = [];
            recipientEmails.forEach(email => {
                const trimmed = email.trim();
                if (trimmed === "") return;
                if (emailRegex.test(trimmed)) {
                    validEmails.push(trimmed);
                } else {
                    invalidEmails.push(trimmed);
                }
            });

            const successfulUsernames = [];
            const alreadyHasAccessUsernames = [];
            const failedEmails = [...invalidEmails];

            for (const email of validEmails) {
                try {
                    const shareRes = await fetch(`${API_BASE_URL}/share`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                        },
                        body: JSON.stringify({file_id: fileId, recipient_email: email})
                    });
                    const shareData = await shareRes.json();
                    if (shareRes.ok) {
                        successfulUsernames.push(shareData.shared_username || email);
                    } else {
                        if (shareData.msg === "The recipient already has access to this file") {
                            alreadyHasAccessUsernames.push(shareData.shared_username || email);
                        } else {
                            // Otherwise, mark as failure.
                            failedEmails.push(email);
                        }
                    }
                } catch (err) {
                    console.error('Error sharing with', email, err);
                    failedEmails.push(email);
                }
            }

            let shareMessage = "";
            if (successfulUsernames.length > 0) {
                shareMessage += "Shared successfully with: " + formatList(successfulUsernames) + ".\n";
            }
            if (alreadyHasAccessUsernames.length > 0) {
                if (alreadyHasAccessUsernames.length === 1)
                    shareMessage += "This user already has access: " + alreadyHasAccessUsernames[0] + ".\n";
                else
                    shareMessage += "These users already have access: " + formatList(alreadyHasAccessUsernames) + ".\n";
            }
            if (failedEmails.length > 0) {
                if (failedEmails.length === 1)
                    shareMessage += "Failed to find a user associated with this email: " + failedEmails[0] + ".";
                else
                    shareMessage += "Failed to find a user associated with these emails: " + formatList(failedEmails) + ".";
            }

            if (shareMessage.trim() !== "") {
                alert(shareMessage);
            } else {
                alert("File uploaded without any additional sharing.");
            }

            setMessage("Upload successful");
            onUploadComplete && onUploadComplete();
            // Reset state.
            setSelectedFile(null);
            setRecipientEmails(['']);
        } catch (err) {
            console.error(err);
            setMessage("Server error during upload");
        }
    };

    return (
        <div className="upload-area">
            {/* Hidden file input and label */}
            <label htmlFor="file-upload" className="upload-label">Choose a file</label>
            <input
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                style={{display: 'none'}}
            />

            {selectedFile && (
                <p className="filename-display">
                    <strong>Selected file:</strong> {selectedFile.name}
                </p>
            )}

            {selectedFile && (
                <div style={{marginTop: '20px'}}>
                    <h4>Share with recipients before uploading (optional)</h4>
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
                </div>
            )}

            {selectedFile && (
                <button onClick={handlePost} className="click-upload">
                    Post
                </button>
            )}

            {message && <p style={{marginTop: '10px'}}>{message}</p>}
        </div>
    );
}

export default FileUpload;
