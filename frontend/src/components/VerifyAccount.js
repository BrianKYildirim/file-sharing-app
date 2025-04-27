// frontend/src/components/VerifyAccount.js

import React, {useState} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import {API_BASE_URL} from '../config';

export default function VerifyAccount() {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const navigate = useNavigate();
    const {state} = useLocation(); // expect { verification_id }

    const handleVerify = async () => {
        setError('');
        const res = await fetch(`${API_BASE_URL}/register-verify`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({verification_id: state.verification_id, code})
        });
        const data = await res.json();
        if (res.ok) {
            alert('Your account is now verified. Please log in.');
            navigate('/login');
        } else {
            setError(data.msg);
        }
    };

    const handleResend = async () => {
        if (cooldown > 0) return;
        const res = await fetch(`${API_BASE_URL}/register-resend`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({verification_id: state.verification_id})
        });
        if (res.ok) {
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
            const d = await res.json();
            setError(d.msg);
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
            />
            <button onClick={handleVerify} style={{marginRight: '10px'}}>Verify</button>
            <button onClick={handleResend} disabled={cooldown > 0}>
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
            </button>
        </div>
    );
}
