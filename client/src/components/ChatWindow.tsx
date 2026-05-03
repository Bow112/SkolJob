import React, { useState, useEffect, useRef } from 'react';
import socket, { registerUser } from '../services/socket';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Send, Smile, Paperclip, X, Mic, Square, Pencil, Trash2, Check } from 'lucide-react';

interface ChatWindowProps { roomId: string; roomName: string; isGlobal?: boolean; }

const EMOJIS = ['😀','😂','😍','😎','🥺','😭','🤔','🙄','😅','🔥','❤️','👍','👎','🎉','✨','💯','👀','💀','🤣','😱','🥳','💪'];
const REACTIONS = ['❤️','😂','😮','😢','👍','🔥'];

const ChatWindow: React.FC<ChatWindowProps> = ({ roomId, roomName, isGlobal }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attachmentType, setAttachmentType] = useState<'image'|'audio'|null>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showReactionFor, setShowReactionFor] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!user?._id) return;
    registerUser(user._id);
    const ping = setInterval(() => socket.emit('ping_active', user._id), 30000);
    return () => clearInterval(ping);
  }, [user?._id]);

  useEffect(() => {
    if (!roomId) return;
    socket.emit('join_room', roomId);
    fetchMessages();

    const onMsg = (m: any) => { if (m.room === roomId) setMessages(p => [...p, m]); };
    const onEdited = ({ messageId, content, editedAt }: any) =>
      setMessages(p => p.map(m => m._id === messageId ? { ...m, content, editedAt } : m));
    const onDeleted = ({ messageId }: any) =>
      setMessages(p => p.map(m => m._id === messageId ? { ...m, deleted: true, content: '', attachment: null } : m));
    const onReacted = ({ messageId, reactions }: any) =>
      setMessages(p => p.map(m => m._id === messageId ? { ...m, reactions } : m));

    socket.on('receive_message', onMsg);
    socket.on('message_edited', onEdited);
    socket.on('message_deleted', onDeleted);
    socket.on('message_reacted', onReacted);
    return () => {
      socket.off('receive_message', onMsg);
      socket.off('message_edited', onEdited);
      socket.off('message_deleted', onDeleted);
      socket.off('message_reacted', onReacted);
    };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const r = await api.get(`/messages/${roomId}`);
      setMessages(Array.isArray(r.data) ? r.data : []);
    } catch { setMessages([]); }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !attachment) return;
    socket.emit('send_message', { senderId: user?._id, content: newMessage, attachment, attachmentType, roomId, isGlobal });
    setNewMessage(''); setAttachment(null); setAttachmentType(null); setShowEmojis(false);
  };

  const submitEdit = (msg: any) => {
    if (!editText.trim()) return;
    socket.emit('edit_message', { messageId: msg._id, content: editText, roomId });
    setEditingId(null);
  };

  const deleteMsg = (msg: any) => {
    if (!window.confirm('Ta bort meddelandet?')) return;
    socket.emit('delete_message', { messageId: msg._id, roomId });
  };

  const reactTo = (messageId: string, emoji: string) => {
    socket.emit('react_message', { messageId, roomId, userId: user?._id, emoji });
    setShowReactionFor(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { setAttachment(reader.result as string); setAttachmentType('image'); };
    reader.readAsDataURL(file); e.target.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr; audioChunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => { setAttachment(reader.result as string); setAttachmentType('audio'); };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start(); setIsRecording(true); setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
    } catch { alert('Kunde inte starta mikrofon.'); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false); clearInterval(timerRef.current);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    setIsRecording(false); clearInterval(timerRef.current); setRecordingTime(0);
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="cw-window">
      <div className="cw-header">
        <div className="cw-room-info">
          <div className="cw-room-avatar">{roomName?.[0]?.toUpperCase() || 'C'}</div>
          <div>
            <div className="cw-room-name">{roomName}</div>
            <div className="cw-room-status">{isGlobal ? 'Alla kan se detta' : 'Aktiv nu'}</div>
          </div>
        </div>
      </div>

      <div className="cw-messages">
        {messages.map((msg, i) => {
          const isOwn = msg.sender?._id === user?._id;
          if (msg.deleted) return (
            <div key={msg._id || i} className="cw-msg-deleted">
              🗑 Meddelandet har tagits bort
            </div>
          );
          return (
            <div key={msg._id || i}
              className={`cw-msg-row ${isOwn ? 'own' : 'other'}`}
              onMouseEnter={() => setHoveredId(msg._id)}
              onMouseLeave={() => { setHoveredId(null); setShowReactionFor(null); }}>
              {!isOwn && <img src={msg.sender?.profilePicture} alt="" className="cw-msg-avatar" />}
              <div className="cw-msg-group">
                {!isOwn && <span className="cw-msg-name">{msg.sender?.username}</span>}
                <div className={`cw-bubble ${isOwn ? 'own' : 'other'}`}>
                  {msg.attachment && msg.attachmentType === 'image' && <img src={msg.attachment} alt="" className="cw-att-img" />}
                  {msg.attachment && msg.attachmentType === 'audio' && <audio controls src={msg.attachment} className="cw-audio-el" />}
                  {msg.attachment && !msg.attachmentType && <img src={msg.attachment} alt="" className="cw-att-img" />}
                  {editingId === msg._id ? (
                    <div className="cw-edit-box">
                      <input value={editText} onChange={e => setEditText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') submitEdit(msg); if (e.key === 'Escape') setEditingId(null); }}
                        className="cw-edit-input" autoFocus />
                      <button onClick={() => submitEdit(msg)} className="cw-edit-save"><Check size={13} /></button>
                      <button onClick={() => setEditingId(null)} className="cw-edit-cancel"><X size={13} /></button>
                    </div>
                  ) : (
                    msg.content && <p className="cw-msg-text">{msg.content}{msg.editedAt && <span className="cw-edited"> (redigerad)</span>}</p>
                  )}
                  <span className="cw-msg-time">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>

                {/* Reaction counts */}
                {msg.reactions?.length > 0 && (
                  <div className="cw-reactions">
                    {msg.reactions.map((r: any) => (
                      <button key={r.emoji} onClick={() => reactTo(msg._id, r.emoji)}
                        className={`cw-reaction-pill ${r.users?.includes(user?._id) ? 'mine' : ''}`}>
                        {r.emoji} {r.users?.length}
                      </button>
                    ))}
                  </div>
                )}

                {/* Hover toolbar */}
                {hoveredId === msg._id && editingId !== msg._id && (
                  <div className={`cw-msg-actions ${isOwn ? 'own' : 'other'}`}>
                    <button className="cw-action-btn" onClick={() => setShowReactionFor(p => p === msg._id ? null : msg._id)}>😄</button>
                    {isOwn && msg.content && (
                      <button className="cw-action-btn" onClick={() => { setEditingId(msg._id); setEditText(msg.content); }}>
                        <Pencil size={12} />
                      </button>
                    )}
                    {isOwn && <button className="cw-action-btn danger" onClick={() => deleteMsg(msg)}><Trash2 size={12} /></button>}
                  </div>
                )}

                {/* Reaction picker */}
                {showReactionFor === msg._id && (
                  <div className={`cw-reaction-picker ${isOwn ? 'own' : 'other'}`}>
                    {REACTIONS.map(e => (
                      <button key={e} onClick={() => reactTo(msg._id, e)} className="cw-react-opt">{e}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji picker */}
      {showEmojis && (
        <div className="cw-emoji-picker">
          <div className="cw-emoji-header">
            <span>Emojis</span>
            <button onClick={() => setShowEmojis(false)}><X size={14} /></button>
          </div>
          <div className="cw-emoji-grid">
            {EMOJIS.map(e => (
              <button key={e} type="button" className="cw-emoji-btn"
                onClick={() => { setNewMessage(p => p + e); setShowEmojis(false); }}>{e}</button>
            ))}
          </div>
        </div>
      )}

      {/* Attachment preview */}
      {attachment && attachmentType === 'image' && (
        <div className="cw-att-preview">
          <img src={attachment} alt="" />
          <button onClick={() => { setAttachment(null); setAttachmentType(null); }} className="cw-rm-att"><X size={12} /></button>
        </div>
      )}
      {attachment && attachmentType === 'audio' && (
        <div className="cw-audio-preview">
          <Mic size={14} /><span>Röstmeddelande klart</span>
          <audio controls src={attachment} className="cw-prev-audio" />
          <button onClick={() => { setAttachment(null); setAttachmentType(null); }} className="cw-rm-att"><X size={12} /></button>
        </div>
      )}

      {/* Recording bar */}
      {isRecording && (
        <div className="cw-rec-bar">
          <div className="cw-rec-dot" />
          <span>Spelar in… {fmt(recordingTime)}</span>
          <button onClick={cancelRecording} className="cw-rec-cancel"><X size={13} /> Avbryt</button>
          <button onClick={stopRecording} className="cw-rec-stop"><Square size={13} /> Klar</button>
        </div>
      )}

      {/* Input area */}
      <form onSubmit={sendMessage} className="cw-input-area">
        {!isRecording && (
          <>
            <button type="button" className="icon-btn cw-tool" onClick={() => fileInputRef.current?.click()}><Paperclip size={20} /></button>
            <button type="button" className={`icon-btn cw-tool ${showEmojis ? 'active' : ''}`} onClick={() => setShowEmojis(v => !v)}><Smile size={20} /></button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
            <input type="text" className="cw-text-input"
              placeholder={`Skriv till ${roomName}...`}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)} />
            {(newMessage.trim() || attachment)
              ? <button type="submit" className="cw-send-btn"><Send size={18} /></button>
              : <button type="button" className="cw-mic-btn" onClick={startRecording}><Mic size={20} /></button>
            }
          </>
        )}
      </form>

      <style>{`
        .cw-window{flex:1;display:flex;flex-direction:column;background:#fff;height:100%;overflow:hidden;position:relative;}
        .cw-header{height:62px;padding:0 20px;display:flex;align-items:center;border-bottom:1px solid #e8eaed;flex-shrink:0;background:#fff;}
        .cw-room-info{display:flex;align-items:center;gap:12px;}
        .cw-room-avatar{width:38px;height:38px;border-radius:50%;background:#1a73e8;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;flex-shrink:0;}
        .cw-room-name{font-weight:700;font-size:15px;color:#202124;}
        .cw-room-status{font-size:11px;color:#34a853;font-weight:600;}
        .cw-messages{flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:6px;background:#fff;}
        .cw-msg-deleted{font-size:13px;color:#9aa0a6;font-style:italic;padding:4px 0;align-self:center;}
        .cw-msg-row{display:flex;align-items:flex-end;gap:8px;max-width:78%;position:relative;}
        .cw-msg-row.own{align-self:flex-end;flex-direction:row-reverse;}
        .cw-msg-row.other{align-self:flex-start;}
        .cw-msg-avatar{width:28px;height:28px;border-radius:50%;object-fit:cover;flex-shrink:0;}
        .cw-msg-group{display:flex;flex-direction:column;gap:2px;min-width:0;position:relative;}
        .cw-msg-name{font-size:11px;font-weight:600;color:#5f6368;padding-left:4px;}
        .cw-bubble{padding:8px 14px;border-radius:18px;word-break:break-word;}
        .cw-bubble.other{background:#f1f3f4;color:#202124;border-bottom-left-radius:4px;}
        .cw-bubble.own{background:#1a73e8;color:#fff;border-bottom-right-radius:4px;}
        .cw-att-img{max-width:220px;max-height:200px;border-radius:10px;display:block;margin-bottom:6px;object-fit:cover;}
        .cw-audio-el{height:32px;max-width:200px;display:block;margin-bottom:4px;}
        .cw-msg-text{font-size:14px;line-height:1.5;margin:0;}
        .cw-edited{font-size:10px;opacity:0.6;}
        .cw-msg-time{font-size:10px;opacity:0.55;display:block;text-align:right;margin-top:4px;}
        .cw-edit-box{display:flex;gap:4px;align-items:center;}
        .cw-edit-input{flex:1;background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,0.5);color:inherit;font-size:14px;outline:none;padding:2px 4px;}
        .cw-edit-save,.cw-edit-cancel{padding:3px 5px;border-radius:4px;color:inherit;background:rgba(255,255,255,0.15);font-size:12px;}
        .cw-msg-actions{position:absolute;top:-34px;display:flex;gap:2px;background:#fff;border:1px solid #e8eaed;border-radius:10px;padding:3px 6px;box-shadow:0 2px 8px rgba(0,0,0,0.12);z-index:10;}
        .cw-msg-actions.own{right:0;} .cw-msg-actions.other{left:0;}
        .cw-action-btn{padding:4px 6px;border-radius:6px;font-size:13px;color:#5f6368;background:none;}
        .cw-action-btn:hover{background:#f1f3f4;color:#202124;}
        .cw-action-btn.danger:hover{color:#ea4335;}
        .cw-reaction-picker{position:absolute;top:-60px;display:flex;gap:4px;background:#fff;border:1px solid #e8eaed;border-radius:24px;padding:6px 10px;box-shadow:0 4px 16px rgba(0,0,0,0.15);z-index:20;}
        .cw-reaction-picker.own{right:0;} .cw-reaction-picker.other{left:0;}
        .cw-react-opt{font-size:22px;padding:3px;border-radius:8px;transition:transform 0.1s;}
        .cw-react-opt:hover{transform:scale(1.3);}
        .cw-reactions{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;}
        .cw-reaction-pill{display:flex;align-items:center;gap:3px;padding:2px 8px;border-radius:12px;background:#f1f3f4;border:1px solid #e8eaed;font-size:13px;cursor:pointer;}
        .cw-reaction-pill.mine{background:#e8f0fe;border-color:#1a73e8;color:#1a73e8;}
        .cw-emoji-picker{position:absolute;bottom:72px;left:54px;background:#fff;border:1px solid #e8eaed;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,0.12);z-index:100;width:270px;overflow:hidden;}
        .cw-emoji-header{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#f8f9fa;border-bottom:1px solid #e8eaed;font-size:12px;font-weight:700;color:#5f6368;}
        .cw-emoji-grid{display:grid;grid-template-columns:repeat(5,1fr);padding:10px;gap:4px;}
        .cw-emoji-btn{font-size:22px;padding:6px;border-radius:8px;background:none;}
        .cw-emoji-btn:hover{background:#f1f3f4;transform:scale(1.2);}
        .cw-att-preview{padding:8px 20px 0;display:flex;align-items:center;gap:8px;}
        .cw-att-preview img{height:52px;border-radius:8px;border:1px solid #e8eaed;}
        .cw-audio-preview{padding:8px 20px 0;display:flex;align-items:center;gap:8px;font-size:13px;color:#1a73e8;font-weight:600;}
        .cw-prev-audio{height:32px;max-width:130px;}
        .cw-rm-att{background:#ea4335;color:white;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .cw-rec-bar{padding:10px 20px;background:#fef2f2;border-top:1px solid #fecaca;display:flex;align-items:center;gap:12px;font-size:13px;font-weight:600;color:#dc2626;flex-shrink:0;}
        .cw-rec-dot{width:10px;height:10px;border-radius:50%;background:#dc2626;animation:pulse-r 1s infinite;flex-shrink:0;}
        @keyframes pulse-r{0%,100%{opacity:1;}50%{opacity:0.3;}}
        .cw-rec-cancel{display:flex;align-items:center;gap:4px;padding:5px 10px;border-radius:6px;color:#5f6368;font-size:12px;font-weight:600;margin-left:auto;}
        .cw-rec-cancel:hover{background:#f1f3f4;}
        .cw-rec-stop{display:flex;align-items:center;gap:4px;padding:5px 12px;border-radius:6px;background:#dc2626;color:white;font-size:12px;font-weight:700;}
        .cw-input-area{padding:12px 16px;display:flex;align-items:center;gap:8px;border-top:1px solid #e8eaed;flex-shrink:0;position:relative;background:#fff;}
        .cw-tool{color:#5f6368;border-radius:8px;}
        .cw-tool:hover,.cw-tool.active{color:#1a73e8;background:#e8f0fe;}
        .cw-text-input{flex:1;padding:10px 16px;border-radius:22px;border:1px solid #dadce0;background:#f8f9fa;color:#202124;font-size:14px;outline:none;}
        .cw-text-input:focus{border-color:#1a73e8;background:#fff;}
        .cw-send-btn{width:38px;height:38px;border-radius:50%;background:#1a73e8;color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .cw-send-btn:hover{background:#1557b0;}
        .cw-mic-btn{width:38px;height:38px;border-radius:50%;background:#f1f3f4;color:#5f6368;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.2s;}
        .cw-mic-btn:hover{background:#e8f0fe;color:#1a73e8;transform:scale(1.1);}
      `}</style>
    </div>
  );
};

export default ChatWindow;
