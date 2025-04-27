import React, {useState, useEffect} from 'react';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Signup from './components/Signup';
import VerifyAccount from './components/VerifyAccount';
import MarketDashboard from './components/MarketDashboard';
import AnalysisPage from './components/AnalysisPage';

export default function App() {
    // path = hash fragment after '#' (or '/')
    const [path, setPath] = useState(
        window.location.hash.slice(1) || '/'
    );

    useEffect(() => {
        const onHash = () =>
            setPath(window.location.hash.slice(1) || '/');
        window.addEventListener('hashchange', onHash);
        return () => window.removeEventListener('hashchange', onHash);
    }, []);

    let Page;
    switch (path) {
        case '/login':
            Page = Login;
            break;
        case '/signup':
            Page = Signup;
            break;
        case '/verify':
            Page = VerifyAccount;
            break;
        case '/dashboard':
            Page = MarketDashboard;
            break;
        case '/analysis':
            Page = AnalysisPage;
            break;
        default:
            Page = LandingPage;
    }

    return <Page/>;
}
