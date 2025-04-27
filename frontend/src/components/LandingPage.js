import React from 'react';
import '../App.css';

export default function LandingPage() {
    return (
        <div>
            <div className="hero">
                <h1>Seamless File Collaboration</h1>
                <p>Upload, share and manage your files securely and effortlessly.</p>
                <a href="#/signup" className="cta">Get Started</a>
            </div>
            <div className="container" style={{textAlign: 'center', marginTop: '2rem'}}>
                <p>Already have an account? <a href="#/login">Log In</a></p>
            </div>
        </div>
    );
}
