import { useState } from 'react';
import { login, register } from '../api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'register') {
        await register(email, password);
      }
      const { token, role } = await login(email, password);
      onLogin(token, email, role);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <h1>🎬 Xhoswi</h1>
      <h2>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={4}
        />
        <button type="submit" disabled={loading}>
          {loading ? '...' : mode === 'login' ? 'Entrar' : 'Registrarme'}
        </button>
      </form>
      {error && <p className="error">⚠️ {error}</p>}
      <button
        className="link-button"
        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
      >
        {mode === 'login' ? '¿No tienes cuenta? Regístrate' : 'Ya tengo cuenta'}
      </button>
    </div>
  );
}
