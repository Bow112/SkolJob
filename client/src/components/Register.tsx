import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/register', { username, password });
      login(res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registreringen misslyckades');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card fade-in">
        <h1 className="auth-title">Skapa konto</h1>
        <p className="auth-subtitle">Bli medlem i Chataaa idag</p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Användarnamn</label>
            <input 
              type="text" 
              className="input-field" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Lösenord</label>
            <input 
              type="password" 
              className="input-field" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="primary-btn full-width">Gå med</button>
        </form>
        
        <p className="auth-footer">
          Har du redan ett konto? <Link to="/login">Logga in</Link>
        </p>
      </div>
      <style>{`
        .auth-container {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          width: 100vw;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
        .auth-card {
          background: white;
          padding: 40px;
          border-radius: 16px;
          box-shadow: var(--shadow);
          width: 100%;
          max-width: 400px;
        }
        .auth-title {
          font-size: 24px;
          margin-bottom: 8px;
          text-align: center;
        }
        .auth-subtitle {
          color: var(--text-secondary);
          text-align: center;
          margin-bottom: 32px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
        }
        .full-width { width: 100%; margin-top: 12px; }
        .error-text { color: #d93025; font-size: 14px; margin-top: 8px; }
        .auth-footer { text-align: center; margin-top: 24px; font-size: 14px; }
        .auth-footer a { color: var(--primary); text-decoration: none; font-weight: 500; }
      `}</style>
    </div>
  );
};

export default Register;
