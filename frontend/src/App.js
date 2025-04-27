import React from 'react';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Signup from './components/Signup';
import AnalysisPage from './components/AnalysisPage';
import VerifyAccount from './components/VerifyAccount';
import MarketDashboard from './components/MarketDashboard';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage/>}/>
                <Route path="/login" element={<Login/>}/>
                <Route path="/signup" element={<Signup/>}/>
                <Route path="/verify" element={<VerifyAccount/>}/>
                <Route path="/dashboard" element={<MarketDashboard/>}/>
                <Route path="/analysis" element={<AnalysisPage/>}/>
            </Routes>
        </BrowserRouter>
    );
}

 export default App;
