import React, {useState} from 'react';
import {API_BASE_URL} from '../config';
import '../App.css';

export default function Login() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        try {
            const res = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({identifier, password})
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('access_token', data.access_token);
                window.location.hash = '/dashboard';
            } else {
                setError(data.msg || 'Login failed');
            }
        } catch (err) {
            setError('Server error');
        }
    };

    return (
        <div className="form-card">
            <h2>Login</h2>
            {error && <p style={{color: 'red'}}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <label>Username or Email:</label>
                <input
                    type="text"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    required
                />
                <label>Password:</label>
                <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Log In</button>
            </form>
            <p style={{marginTop: '1rem'}}>
                Don't have an account? <a href="#/signup">Sign Up</a>
            </p>
        </div>
    );
}
