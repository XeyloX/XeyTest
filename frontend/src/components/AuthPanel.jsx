import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthPanel() {
  const { user, login, register, logout } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'viewer' });
  const [error, setError] = useState('');

  if (user) {
    return (
      <div className="panel">
        <h3>Account</h3>
        <div>
          <b>{user.username}</b>
          <span className="badge">{user.role}</span>
        </div>
        <p>{user.email}</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return (
    <div className="panel">
      <h3>Sign in / Register</h3>
      <input placeholder="username" onChange={(e) => setForm({ ...form, username: e.target.value })} />
      <input placeholder="email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input placeholder="password" type="password" onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <select onChange={(e) => setForm({ ...form, role: e.target.value })}>
        <option value="viewer">viewer</option>
        <option value="streamer">streamer</option>
        <option value="admin">admin</option>
      </select>
      <button onClick={async () => { try { setError(''); await register(form); await login({ email: form.email, password: form.password }); } catch (e) { setError(e.message); } }}>Register</button>
      <button onClick={async () => { try { setError(''); await login({ email: form.email, password: form.password }); } catch (e) { setError(e.message); } }}>Login</button>
      {error && <p>{error}</p>}
    </div>
  );
}
