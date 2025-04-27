// src/App.js
import React, {useState, useEffect} from 'react';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Signup from './components/Signup';
import VerifyAccount from './components/VerifyAccount';
import MarketDashboard from './components/MarketDashboard';
import AnalysisPage from './components/AnalysisPage';

export default function App() {
    // current hash (e.g. "#/login"), default to "/"
    const [path, setPath] = useState(
        window.location.hash.slice(1) || '/'
    );

    useEffect(() => {
        const onHash = () =>
            setPath(window.location.hash.slice(1) || '/');
        window.addEventListener('hashchange', onHash);
        return () => window.removeEventListener('hashchange', onHash);
    }, []);

    let PageComponent;
    switch (path) {
        case '/login':
            PageComponent = Login;
            break;
        case '/signup':
            PageComponent = Signup;
            break;
        case '/verify':
            PageComponent = VerifyAccount;
            break;
        case '/dashboard':
            PageComponent = MarketDashboard;
            break;
        case '/analysis':
            PageComponent = AnalysisPage;
            break;
        default:
            PageComponent = LandingPage;
    }

    return <PageComponent/>;
}
