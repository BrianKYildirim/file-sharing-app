import React, {useState} from 'react';
import {API_BASE_URL} from '../config';
import '../App.css';

export default function Signup() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        try {
            const res = await fetch(`${API_BASE_URL}/register-initiate`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username, email, password})
            });
            if (res.ok) {
                const data = await res.json();
                // pass verification id via hash state
                window.location.hash = `/verify?vid=${data.verification_id}`;
            } else {
                const err = await res.json();
                setError(err.msg || 'Signup failed');
            }
        } catch (err) {
            setError('Server error');
        }
    };

    return (
        <div className="form-card">
            <h2>Sign Up</h2>
            {error && <p style={{color: 'red'}}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <label>Username:</label>
                <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                />
                <label>Email:</label>
                <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />
                <label>Password:</label>
                <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Sign Up</button>
            </form>
            <p style={{marginTop: '1rem'}}>
                Already have an account? <a href="#/login">Log In</a>
            </p>
        </div>
    );
}
