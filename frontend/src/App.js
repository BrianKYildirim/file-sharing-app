// frontend/src/App.js
import React, {useState, useEffect} from 'react';
import LandingPage     from './components/LandingPage';
import Login           from './components/Login';
import Signup          from './components/Signup';
import VerifyAccount   from './components/VerifyAccount';
import MarketDashboard from './components/MarketDashboard';

export default function App() {
  const [path, setPath] = useState(window.location.hash.slice(1) || '/');

  useEffect(() => {
    const onHash = () => setPath(window.location.hash.slice(1) || '/');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  let Page;
  switch (path) {
    case '/login':
      Page = Login; break;
    case '/signup':
      Page = Signup; break;
    case '/verify':
      Page = VerifyAccount; break;
    case '/dashboard':
      Page = MarketDashboard; break;
    default:
      Page = LandingPage; break;
  }

  return <Page />;
}
