import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const OPENROUTER_API_KEY = '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';

const AIChatWindow: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [appUsers, setAppUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch users ONCE on mount only
  useEffect(() => {
    const fetchAppUsers = async () => {
      try {
        const res = await api.get('/users/search?query=a');
        if (Array.isArray(res.data)) {
          setAppUsers(res.data.map((u: any) => u.username));
        }
      } catch (err) {
        // Silent fail - not critical
      }
    };
    fetchAppUsers();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setNewMessage('');
    setLoading(true);

    const systemPrompt = `Du är Bowen GPT, en AI-assistent skapad av Bowen. Svara ALLTID på svenska. Du vet att dessa användare finns i appen: [${appUsers.join(', ')}]. Du pratar nu med ${user?.username || 'en användare'}.`;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'poolside/laguna-xs.2:free',
          messages: [
            { role: 'system', content: systemPrompt },
            ...updatedMessages.slice(-8),
          ],
          reasoning: { enabled: false },
        }),
      });

      if (!response.ok) {
        throw new Error(`API svarade med ${response.status}`);
      }

      const result = await response.json();
      const aiContent = result?.choices?.[0]?.message?.content || 'Inget svar från Bowen GPT.';
      setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Anslutningsfel. Försök igen om en stund.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gpt-container">
      <div className="gpt-header">
        <div className="gpt-model-info">
          <Bot size={20} className="gpt-bot-icon" />
          <span>Bowen GPT 4o</span>
          <Info size={14} />
        </div>
        <div className="gpt-author">Made by Bowen 200b Parmametrs Server!</div>
      </div>

      <div className="gpt-content">
        {messages.length === 0 ? (
          <div className="gpt-welcome">
            <div className="gpt-logo-large"><Bot size={40} /></div>
            <h2>Hur kan jag hjälpa dig idag?</h2>
            <p>Skriv en fråga nedan för att börja chatta med Bowen GPT.</p>
          </div>
        ) : (
          <div className="gpt-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`gpt-row gpt-${msg.role}`}>
                <div className="gpt-row-inner">
                  <div className={`gpt-icon ${msg.role}`}>
                    {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                  </div>
                  <div className="gpt-text-box">
                    <div className="gpt-name">{msg.role === 'assistant' ? 'Bowen GPT' : 'Du'}</div>
                    <div className="gpt-text">{msg.content}</div>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="gpt-row gpt-assistant">
                <div className="gpt-row-inner">
                  <div className="gpt-icon assistant"><Bot size={18} /></div>
                  <div className="gpt-text-box">
                    <div className="gpt-name">Bowen GPT</div>
                    <div className="typing-dots"><span /><span /><span /></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="gpt-footer">
        <form onSubmit={handleSendMessage} className="gpt-form">
          <div className="gpt-input-box">
            <input
              type="text"
              placeholder="Meddelande till Bowen GPT..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={loading}
              autoComplete="off"
            />
            <button type="submit" disabled={!newMessage.trim() || loading} className="gpt-send">
              <Send size={18} />
            </button>
          </div>
        </form>
        <p className="gpt-disclaimer">Bowen GPT kan göra misstag. Kontrollera viktig information.</p>
      </div>

      <style>{`
        .gpt-container { flex: 1; display: flex; flex-direction: column; background: var(--bg-main); color: var(--text-main); height: 100%; overflow: hidden; }
        .gpt-header { padding: 12px 20px; border-bottom: 1px solid var(--border); display: flex; flex-direction: column; align-items: center; background: var(--bg-main); }
        .gpt-model-info { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 16px; color: var(--text-main); }
        .gpt-bot-icon { color: #10a37f; }
        .gpt-author { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
        .gpt-content { flex: 1; overflow-y: auto; display: flex; flex-direction: column; background: var(--bg-main); }
        .gpt-welcome { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center; padding: 40px; }
        .gpt-logo-large { width: 64px; height: 64px; border: 2px solid var(--border); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #10a37f; }
        .gpt-welcome h2 { font-size: 22px; font-weight: 700; margin: 0; color: var(--text-main); }
        .gpt-welcome p { font-size: 14px; color: var(--text-secondary); margin: 0; }
        .gpt-messages { padding: 20px 0; width: 100%; }
        .gpt-row { padding: 16px 0; }
        .gpt-assistant { background: var(--bg-hover); }
        .gpt-row-inner { max-width: 720px; margin: 0 auto; padding: 0 24px; display: flex; gap: 14px; align-items: flex-start; }
        .gpt-icon { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .gpt-icon.assistant { background: #10a37f; color: white; }
        .gpt-icon.user { background: var(--bg-hover); color: var(--text-main); border: 1px solid var(--border); }
        .gpt-text-box { flex: 1; min-width: 0; }
        .gpt-name { font-size: 13px; font-weight: 700; margin-bottom: 6px; color: var(--text-main); }
        .gpt-text { font-size: 15px; line-height: 1.7; color: var(--text-main); white-space: pre-wrap; word-break: break-word; }
        .typing-dots { display: flex; gap: 5px; align-items: center; padding: 4px 0; }
        .typing-dots span { width: 7px; height: 7px; background: var(--text-secondary); border-radius: 50%; animation: bounce 1.4s infinite; }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce { 0%,80%,100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
        .gpt-footer { padding: 16px 20px 20px; display: flex; flex-direction: column; align-items: center; gap: 8px; border-top: 1px solid var(--border); background: var(--bg-main); }
        .gpt-form { width: 100%; max-width: 720px; }
        .gpt-input-box { display: flex; align-items: center; background: var(--bg-hover); border-radius: 24px; padding: 6px 8px 6px 18px; border: 1px solid var(--border); transition: border-color 0.2s; }
        .gpt-input-box:focus-within { border-color: #10a37f; box-shadow: 0 0 0 2px rgba(16,163,127,0.15); }
        .gpt-input-box input { flex: 1; background: transparent; border: none; font-size: 15px; outline: none; padding: 8px 0; color: var(--text-main); }
        .gpt-send { width: 36px; height: 36px; border-radius: 50%; background: #10a37f; color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.2s; }
        .gpt-send:disabled { background: var(--border); color: var(--text-secondary); }
        .gpt-send:not(:disabled):hover { background: #0d8f6e; }
        .gpt-disclaimer { font-size: 11px; color: var(--text-secondary); text-align: center; }
      `}</style>
    </div>
  );
};

export default AIChatWindow;
