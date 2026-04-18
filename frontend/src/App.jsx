import { useEffect, useState } from 'react';
import Login from './components/Login';
import Catalog from './components/Catalog';
import { getMe } from './api';
import './App.css';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(localStorage.getItem('user'));
  const [checking, setChecking] = useState(!!token);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }
    getMe(token)
      .then((data) => setUser(data.email))
      .catch(() => handleLogout())
      .finally(() => setChecking(false));
  }, []);

  function handleLogin(newToken, email) {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', email);
    setToken(newToken);
    setUser(email);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }

  if (checking) return <p style={{ textAlign: 'center', marginTop: '40vh' }}>Verificando sesión...</p>;
  if (!token) return <Login onLogin={handleLogin} />;
  return <Catalog user={user} onLogout={handleLogout} />;
}
