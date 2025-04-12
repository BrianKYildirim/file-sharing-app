// frontend/src/components/FileUpload.js

import React, { useState } from 'react';
import { API_BASE_URL } from '../config';


function FileUpload({ onUploadComplete }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');

  // Stores the selected file in component state
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setMessage(''); // Clear any previous message when a new file is chosen
  };

  // Uploads the selected file to the server
  const handleUpload = async () => {
    if (!selectedFile) return; // Guard clause if no file is selected

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Upload successful');
        onUploadComplete && onUploadComplete();
      } else {
        setMessage(data.msg || 'Upload failed');
      }
    } catch (err) {
      setMessage('Server error during upload');
    }
  };

  return (
    <div className="upload-area">
      {/* Label + Hidden File Input */}
      <label htmlFor="file-upload" className="upload-label">Choose a file</label>
      <input
        id="file-upload"
        type="file"
        onChange={handleFileChange}
        style={{ display: 'none' }} // Hides the raw file input
      />

      {selectedFile && (
        <p className="filename-display">
          <strong>Selected file:</strong> {selectedFile.name}
        </p>
      )}

      {/* Upload Button */}
      <button onClick={handleUpload} className="click-upload">
        Upload
      </button>

      {/* Message (upload success or error) */}
      {message && <p style={{ marginTop: '10px' }}>{message}</p>}
    </div>
  );
}

export default FileUpload;
