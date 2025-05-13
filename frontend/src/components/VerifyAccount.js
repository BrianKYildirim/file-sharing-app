
import React, {useState} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import {API_BASE_URL} from '../config';
import '../App.css';

export default function VerifyAccount() {
    const navigate = useNavigate();
    const {state} = useLocation();             // expecting { verification_id }
    const verificationId = state?.verification_id;

    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const [loading, setLoading] = useState(false);

    if (!verificationId) {
        // If someone navigates here directly, kick them back to signup
        return (
            <div className="form-card">
                <p>Invalid access. Please <a href="/signup">Sign Up</a> first.</p>
            </div>
        );
    }

    const handleVerify = async () => {
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/register-verify`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({verification_id: verificationId, code})
            });

            const contentType = res.headers.get('content-type') || '';
            let data;
            if (contentType.includes('application/json')) {
                data = await res.json();
            } else {
                const text = await res.text();
                throw new Error(text);
            }

            if (res.ok) {
                alert('Your account is now verified. Please log in.');
                navigate('/login');
            } else {
                throw new Error(data.msg || 'Verification failed');
            }

        } catch (err) {
            console.error('Error in handleVerify:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (cooldown > 0 || loading) return;
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/register-resend`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({verification_id: verificationId})
            });

            const contentType = res.headers.get('content-type') || '';
            let data;
            if (contentType.includes('application/json')) {
                data = await res.json();
            } else {
                const text = await res.text();
                throw new Error(text);
            }

            if (res.ok) {
                // start 60s cooldown
                setCooldown(60);
                const timer = setInterval(() => {
                    setCooldown(c => {
                        if (c <= 1) {
                            clearInterval(timer);
                            return 0;
                        }
                        return c - 1;
                    });
                }, 1000);
            } else {
                throw new Error(data.msg || 'Resend failed');
            }
        } catch (err) {
            console.error('Error in handleResend:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-card">
            <h2>Verify Your Email</h2>
            {error && <p style={{color: 'red'}}>{error}</p>}
            <p>We’ve sent a code to your email. Enter it below to complete signup.</p>

            <input
                type="text"
                placeholder="Verification Code"
                value={code}
                onChange={e => setCode(e.target.value)}
                style={{width: '100%', padding: '10px', margin: '10px 0'}}
                disabled={loading}
            />

            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                <button
                    onClick={handleVerify}
                    disabled={loading}
                    style={{
                        padding: '10px',
                        backgroundColor: '#0077cc',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? 'Verifying…' : 'Verify'}
                </button>
                <button
                    onClick={handleResend}
                    disabled={cooldown > 0 || loading}
                    style={{
                        padding: '10px',
                        backgroundColor: '#0077cc',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: (cooldown > 0 || loading) ? 'not-allowed' : 'pointer'
                    }}
                >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                </button>
            </div>
        </div>
    );
}
