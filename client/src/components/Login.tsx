import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { X, FileText } from 'lucide-react';

const TERMS = `Användarvillkor för Chataaa 

Genom att skapa ett konto godkänner du följande regler:

1. Ingen doxning
   Du får inte dela personlig information om andra användare utan deras tillstånd.

2. Inget olämpligt språk
   Grova ord och kränkande språk som används mot andra användare är förbjudet.

3. Copyright och licens
   Allt innehåll som delas på Chataaa omfattas av @Permissive and Copyleft-licensen.
   Du får inte ta bort eller blockera denna tjänst med juridiska hot.
   Du äger ditt eget innehåll men ger Chataaa rätt att visa det.

4.  Om du är ett lärrare du MÅSTE faktisk läsa detta förSÖK
    inte att BLOCKA detta html coden för att jag kommer göra ett
    nyy så womp womp! jag är inte 5år gammamamalalal

5. Om du ska ta ne eller behöver KONTACT prata med Bowen faktisk bc me sigma

Brott mot dessa regler kan leda till att ditt konto stängs av eller att få ett Sue, eller en laglit sue :) SPECIELT ni rektorn och lärrare och ni som blocka våra sites visa reSPECKt lel bro :) .`;

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [agreedToS, setAgreedToS] = useState(false);
  const [showToS, setShowToS] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToS) { setError('Du måste godkänna användarvillkoren för att logga in.'); return; }
    try {
      const res = await api.post('/auth/login', { username, password });
      login(res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Inloggningen misslyckades');
    }
  };

  return (
    <div className="auth-container">
      {/* ToS Modal */}
      {showToS && (
        <div className="tos-overlay" onClick={() => setShowToS(false)}>
          <div className="tos-modal" onClick={e => e.stopPropagation()}>
            <div className="tos-header">
              <FileText size={20} />
              <h2>Användarvillkor</h2>
              <button onClick={() => setShowToS(false)} className="tos-close"><X size={18} /></button>
            </div>
            <div className="tos-body">
              <pre>{TERMS}</pre>
            </div>
            <div className="tos-footer">
              <button onClick={() => { setAgreedToS(true); setShowToS(false); }} className="tos-accept-btn">
                ✓ Jag godkänner villkoren Om du är ett lärrareee måste lesa
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="auth-card fade-in">
        <div className="auth-logo">💬</div>
        <h1 className="auth-title">Välkommen tillbaka</h1>
        <p className="auth-subtitle">Logga in för att fortsätta till Chataaa</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Användarnamn</label>
            <input type="text" className="input-field" value={username}
              onChange={e => setUsername(e.target.value)} placeholder="Ditt användarnamn" required />
          </div>
          <div className="form-group">
            <label>Lösenord</label>
            <input type="password" className="input-field" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>

          {/* ToS Checkbox */}
          <div className="tos-row">
            <input
              type="checkbox"
              id="tos-check"
              checked={agreedToS}
              onChange={e => setAgreedToS(e.target.checked)}
              className="tos-checkbox"
            />
            <label htmlFor="tos-check" className="tos-label">
              Jag godkänner{' '}
              <button type="button" className="tos-link" onClick={() => setShowToS(true)}>
                användarvillkoren
              </button>
            </label>
          </div>

          {error && <p className="error-text">⚠️ {error}</p>}
          <button type="submit" className="submit-btn">Logga in</button>
        </form>

        <p className="auth-footer">
          Har du inget konto? <Link to="/register">Skapa ett här</Link>
        </p>
      </div>

      <style>{`
        .auth-container {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          width: 100vw;
          background: #f1f3f4;
        }
        .auth-card {
          background: white;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.12);
          width: 100%;
          max-width: 400px;
        }
        .auth-logo { font-size: 36px; text-align: center; margin-bottom: 12px; }
        .auth-title { font-size: 22px; font-weight: 800; text-align: center; margin-bottom: 6px; color: #202124; }
        .auth-subtitle { color: #5f6368; text-align: center; margin-bottom: 28px; font-size: 14px; }
        .form-group { margin-bottom: 18px; }
        .form-group label { display: block; margin-bottom: 7px; font-size: 13px; font-weight: 600; color: #202124; }
        .input-field { width: 100%; padding: 11px 14px; border: 1.5px solid #dadce0; border-radius: 10px; background: white; color: #202124; font-size: 14px; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
        .input-field:focus { border-color: #1a73e8; box-shadow: 0 0 0 2px rgba(26,115,232,0.15); }
        
        .tos-row { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
        .tos-checkbox { width: 18px; height: 18px; cursor: pointer; accent-color: #1a73e8; flex-shrink: 0; }
        .tos-label { font-size: 13px; color: #5f6368; cursor: pointer; }
        .tos-link { background: none; border: none; color: #1a73e8; font-size: 13px; font-weight: 700; padding: 0; cursor: pointer; text-decoration: underline; border-radius: 0; }
        .tos-link:hover { color: #1557b0; }

        .submit-btn { width: 100%; padding: 12px; font-size: 15px; font-weight: 700; border-radius: 10px; background: #1a73e8; color: white; border: none; cursor: pointer; transition: background 0.2s; margin-top: 4px; }
        .submit-btn:hover { background: #1557b0; }

        .error-text { color: #ea4335; font-size: 13px; margin-bottom: 10px; font-weight: 500; }
        .auth-footer { text-align: center; margin-top: 20px; font-size: 14px; color: #5f6368; }
        .auth-footer a { color: #1a73e8; text-decoration: none; font-weight: 700; }
        .auth-footer a:hover { text-decoration: underline; }

        /* ToS Modal */
        .tos-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .tos-modal { background: white; border-radius: 16px; width: 100%; max-width: 500px; max-height: 80vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .tos-header { display: flex; align-items: center; gap: 10px; padding: 18px 20px; border-bottom: 1px solid #e8eaed; }
        .tos-header h2 { flex: 1; font-size: 16px; font-weight: 800; color: #202124; margin: 0; }
        .tos-close { color: #5f6368; padding: 4px; border-radius: 6px; }
        .tos-close:hover { background: #f1f3f4; }
        .tos-body { flex: 1; overflow-y: auto; padding: 20px; }
        .tos-body pre { font-family: inherit; font-size: 13px; line-height: 1.8; color: #202124; white-space: pre-wrap; word-break: break-word; }
        .tos-footer { padding: 16px 20px; border-top: 1px solid #e8eaed; display: flex; justify-content: flex-end; }
        .tos-accept-btn { background: #1a73e8; color: white; padding: 10px 20px; border-radius: 10px; font-weight: 700; font-size: 14px; }
        .tos-accept-btn:hover { background: #1557b0; }
      `}</style>
    </div>
  );
};

export default Login;
