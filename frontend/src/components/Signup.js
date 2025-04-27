import React, {useState} from 'react';
import {useNavigate, Link} from 'react-router-dom';
import {API_BASE_URL} from '../config';
import '../App.css';

function Signup() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch(`${API_BASE_URL}/register-initiate`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username, email, password}),
            });

            if (res.ok) {
                // 2xx → definitely JSON
                const data = await res.json();
                navigate('/verify', {state: {verification_id: data.verification_id}});
                return;
            }

            // Non-2xx: could be JSON or HTML
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const errData = await res.json();
                setError(errData.msg || JSON.stringify(errData));
            } else {
                // Fallback to text (likely HTML error page or plain string)
                const text = await res.text();
                setError(text);
            }

        } catch (err) {
            // Network error or JS exception
            setError(err.message);
        }
    };

    return (
        <div className="form-card">
            <h2>Sign Up</h2>
            {error && <p style={{color: 'red', textAlign: 'center'}}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Sign Up</button>
            </form>
            <p>Already have an account? <Link to="/login">Log In</Link></p>
        </div>
    );
}

export default Signup;
