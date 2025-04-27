import React, {useState, useEffect} from 'react';
import FileUpload from './FileUpload';
import ShareModal from './ShareModal';
import ContextMenu from './ContextMenu';
import UsersModal from './UsersModal';
import {API_BASE_URL} from '../config';
import '../App.css';

export default function AnalysisPage() {
    const token = localStorage.getItem('access_token');
    const [files, setFiles] = useState({owned_files: [], shared_files: []});
    const [shareFile, setShareFile] = useState(null);
    const [ctx, setCtx] = useState(null);
    const [usersModal, setUsersModal] = useState(false);
    const [usersList, setUsersList] = useState([]);

    const fetchFiles = async () => {
        const res = await fetch(`${API_BASE_URL}/files`, {
            headers: {'Authorization': `Bearer ${token}`}
        });
        const data = await res.json();
        if (res.ok) setFiles(data);
    };

    useEffect(() => {
        if (token) fetchFiles();
        else window.location.hash = '/login';
    }, [token]);

    if (!token) return null;

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        window.location.hash = '/';
    };

    return (
        <div className="container">
            <h2>Files</h2>
            <button onClick={handleLogout}>Logout</button>
            <FileUpload onUploadComplete={fetchFiles}/>
            <div>
                <h3>Mine</h3>
                {files.owned_files.map(f => (
                    <div key={f.id}>
                        {f.filename}
                        <button onClick={() => setShareFile(f)}>Share</button>
                    </div>
                ))}
            </div>
            {shareFile && (
                <ShareModal
                    file={shareFile}
                    sharedUsers={shareFile.shared_with_users}
                    onClose={() => setShareFile(null)}
                    onShare={() => {
                        fetchFiles();
                        setShareFile(null);
                    }}
                />
            )}
        </div>
    );
}
