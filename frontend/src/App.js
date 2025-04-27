// frontend/src/App.js

import React from 'react';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Signup from './components/Signup';
import AnalysisPage from './components/AnalysisPage';
import VerifyAccount from './components/VerifyAccount';
import MarketDashboard from './components/MarketDashboard';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage/>}/>
                <Route path="/login" element={<Login/>}/>
                <Route path="/signup" element={<Signup/>}/>
                <Route path="/verify" element={<VerifyAccount/>}/>
                <Route path="/dashboard" element={<MarketDashboard/>}/>
                <Route path="/analysis" element={<AnalysisPage/>}/>
            </Routes>
        </Router>
    );
}

export default App;
