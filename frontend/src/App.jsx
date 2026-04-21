import { useEffect, useState } from 'react';
import Login from './components/Login';
import Catalog from './components/Catalog';
import { getMe } from './api';
import './App.css';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(localStorage.getItem('user'));
  const [role, setRole] = useState(localStorage.getItem('role') || 'user');
  const [checking, setChecking] = useState(!!token);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }
    getMe(token)
      .then((data) => {
        setUser(data.email);
        setRole(data.role || 'user');
        localStorage.setItem('role', data.role || 'user');
      })
      .catch(() => handleLogout())
      .finally(() => setChecking(false));
  }, []);

  function handleLogin(newToken, email, newRole) {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', email);
    localStorage.setItem('role', newRole || 'user');
    setToken(newToken);
    setUser(email);
    setRole(newRole || 'user');
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setToken(null);
    setUser(null);
    setRole('user');
  }

  if (checking) return <p style={{ textAlign: 'center', marginTop: '40vh' }}>Verificando sesión...</p>;
  if (!token) return <Login onLogin={handleLogin} />;
  return <Catalog user={user} role={role} token={token} onLogout={handleLogout} />;
}
