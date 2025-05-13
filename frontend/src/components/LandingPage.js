// frontend/src/components/LandingPage.js

import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

function LandingPage() {
  return (
    <div>
      <div className="hero">
        <h1>Seamless File Collaboration</h1>
        <p>Upload, share and manage your files securely and effortlessly.</p>
        <Link to="/signup" className="cta">Get Started</Link>
      </div>
      <div className="container" style={{ marginTop: '40px', textAlign: 'center' }}>
        <p>Already have an account? <Link to="/login">Log In</Link></p>
      </div>
    </div>
  );
}

export default LandingPage;