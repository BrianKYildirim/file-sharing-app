// src/App.js
import React, { useState, useEffect } from 'react';
import LandingPage     from './components/LandingPage';
import Login           from './components/Login';
import Signup          from './components/Signup';
import VerifyAccount   from './components/VerifyAccount';
import MarketDashboard from './components/MarketDashboard';
import AnalysisPage    from './components/AnalysisPage';

export default function App() {
  // current path is everything after the '#'
  const [path, setPath] = useState(
    window.location.hash.slice(1) || '/'
  );

  useEffect(() => {
    const onHashChange = () =>
      setPath(window.location.hash.slice(1) || '/');
    window.addEventListener('hashchange', onHashChange);
    return () =>
      window.removeEventListener('hashchange', onHashChange);
  }, []);

  // map path → component
  let Page;
  switch (path) {
    case '/login':      Page = Login;           break;
    case '/signup':     Page = Signup;          break;
    case '/verify':     Page = VerifyAccount;   break;
    case '/dashboard':  Page = MarketDashboard; break;
    case '/analysis':   Page = AnalysisPage;    break;
    default:            Page = LandingPage;
  }

  return <Page />;
}
