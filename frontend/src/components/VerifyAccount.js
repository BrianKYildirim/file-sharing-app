import React, {useState, useEffect} from 'react';
import {API_BASE_URL} from '../config';
import '../App.css';

export default function VerifyAccount() {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const [loading, setLoading] = useState(false);

    // parse vid from hash ?vid=...
    const search = window.location.hash.split('?')[1] || '';
    const params = new URLSearchParams(search);
    const vid = params.get('vid');

    useEffect(() => {
        if (cooldown > 0) {
            const t = setTimeout(() => setCooldown(c => c - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [cooldown]);

    if (!vid) {
        return (
            <div className="form-card">
                <p>Invalid link — please <a href="#/signup">Sign Up</a> first.</p>
            </div>
        );
    }

    const doVerify = async () => {
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/register-verify`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({verification_id: vid, code})
            });
            const data = await res.json();
            if (res.ok) {
                alert('Verified! Please log in.');
                window.location.hash = '/login';
            } else {
                setError(data.msg || 'Verification failed');
            }
        } catch {
            setError('Server error');
        } finally {
            setLoading(false);
        }
    };

    const doResend = async () => {
        if (cooldown > 0) return;
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/register-resend`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({verification_id: vid})
            });
            const data = await res.json();
            if (res.ok) {
                setCooldown(60);
            } else {
                setError(data.msg || 'Resend failed');
            }
        } catch {
            setError('Server error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-card">
            <h2>Verify Your Email</h2>
            {error && <p style={{color: 'red'}}>{error}</p>}
            <p>Enter the code we emailed you:</p>
            <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                disabled={loading}
            />
            <button onClick={doVerify} disabled={loading}>
                {loading ? 'Verifying…' : 'Verify'}
            </button>
            <button onClick={doResend} disabled={cooldown > 0 || loading}>
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
            </button>
        </div>
    );
}
