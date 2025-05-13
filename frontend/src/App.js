// frontend/src/App.js

import React from 'react';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import VerifyAccount from './components/VerifyAccount';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage/>}/>
                <Route path="/login" element={<Login/>}/>
                <Route path="/signup" element={<Signup/>}/>
                <Route path="/verify" element={<VerifyAccount/>}/> <Route path="/dashboard" element={<Dashboard/>}/>
            </Routes>
        </Router>
    );
}

export default App;