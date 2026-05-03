import React, { useState, useRef } from 'react';
import api from '../services/api';
import { X, Check, Camera } from 'lucide-react';

interface GroupModalProps {
  onClose: () => void;
  friends: any[];
  onCreated: () => void;
}

const GroupModal: React.FC<GroupModalProps> = ({ onClose, friends, onCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [groupIcon, setGroupIcon] = useState<string | null>(null);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const iconInputRef = useRef<HTMLInputElement>(null);

  const toggleFriend = (id: string) => {
    setSelectedFriends(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setGroupIcon(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    if (!groupName.trim()) { alert('Ange ett gruppnamn'); return; }
    if (selectedFriends.length === 0) { alert('Välj minst en vän'); return; }
    setLoading(true);
    try {
      await api.post('/conversations/group', {
        name: groupName.trim(),
        participantIds: selectedFriends,
        icon: groupIcon
      });
      onCreated();
      onClose();
    } catch (err) {
      alert('Kunde inte skapa grupp');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gm-overlay">
      <div className="gm-modal">
        {/* Header */}
        <div className="gm-header">
          <h2>Skapa gruppchatt</h2>
          <button onClick={onClose} className="gm-close"><X size={20} /></button>
        </div>

        {/* Group Icon */}
        <div className="gm-icon-section">
          <div className="gm-icon-preview" onClick={() => iconInputRef.current?.click()}>
            {groupIcon
              ? <img src={groupIcon} alt="Ikon" className="gm-icon-img" />
              : <div className="gm-icon-placeholder">
                  <Camera size={24} />
                  <span>Lägg till bild</span>
                </div>
            }
          </div>
          <input type="file" ref={iconInputRef} onChange={handleIconChange} accept="image/*" style={{ display: 'none' }} />
        </div>

        {/* Group Name */}
        <div className="gm-field">
          <label>Gruppnamn</label>
          <input
            type="text"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder="T.ex. Helgplaner, Fotbollsgänget..."
            className="gm-input"
          />
        </div>

        {/* Friend Selection */}
        <div className="gm-field">
          <label>Välj vänner ({selectedFriends.length} valda)</label>
          <div className="gm-friends-list">
            {friends.length > 0 ? friends.map(f => {
              const selected = selectedFriends.includes(f._id);
              return (
                <div key={f._id} className={`gm-friend-item ${selected ? 'selected' : ''}`} onClick={() => toggleFriend(f._id)}>
                  <img src={f.profilePicture} alt="" className="gm-friend-avatar" />
                  <span className="gm-friend-name">{f.username}</span>
                  <div className={`gm-check ${selected ? 'checked' : ''}`}>
                    {selected && <Check size={12} />}
                  </div>
                </div>
              );
            }) : (
              <p className="gm-no-friends">Du har inga vänner att lägga till.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="gm-footer">
          <button onClick={onClose} className="gm-cancel-btn">Avbryt</button>
          <button onClick={handleCreate} className="gm-create-btn" disabled={loading || !groupName.trim()}>
            {loading ? 'Skapar...' : 'Skapa grupp'}
          </button>
        </div>
      </div>

      <style>{`
        .gm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 200; }
        .gm-modal { background: #fff; width: 100%; max-width: 420px; border-radius: 16px; padding: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
        .gm-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .gm-header h2 { font-size: 18px; font-weight: 700; }
        .gm-close { color: #5f6368; border-radius: 8px; }
        .gm-close:hover { background: #f1f3f4; }

        .gm-icon-section { display: flex; justify-content: center; margin-bottom: 20px; }
        .gm-icon-preview { width: 80px; height: 80px; border-radius: 50%; border: 2px dashed #dadce0; cursor: pointer; overflow: hidden; display: flex; align-items: center; justify-content: center; transition: border-color 0.2s; }
        .gm-icon-preview:hover { border-color: #1a73e8; }
        .gm-icon-img { width: 100%; height: 100%; object-fit: cover; }
        .gm-icon-placeholder { display: flex; flex-direction: column; align-items: center; gap: 4px; color: #9aa0a6; font-size: 11px; font-weight: 600; }

        .gm-field { margin-bottom: 16px; }
        .gm-field label { display: block; font-size: 12px; font-weight: 700; color: #5f6368; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .gm-input { width: 100%; padding: 10px 14px; border: 1px solid #dadce0; border-radius: 10px; font-size: 14px; outline: none; box-sizing: border-box; }
        .gm-input:focus { border-color: #1a73e8; }

        .gm-friends-list { border: 1px solid #e8eaed; border-radius: 10px; max-height: 200px; overflow-y: auto; }
        .gm-friend-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; cursor: pointer; transition: background 0.1s; }
        .gm-friend-item:hover { background: #f8f9fa; }
        .gm-friend-item.selected { background: #e8f0fe; }
        .gm-friend-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        .gm-friend-name { flex: 1; font-size: 14px; font-weight: 500; }
        .gm-check { width: 20px; height: 20px; border-radius: 50%; border: 2px solid #dadce0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .gm-check.checked { background: #1a73e8; border-color: #1a73e8; color: white; }
        .gm-no-friends { padding: 20px; text-align: center; color: #9aa0a6; font-size: 14px; }

        .gm-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
        .gm-cancel-btn { padding: 9px 18px; border-radius: 8px; font-size: 14px; color: #5f6368; font-weight: 600; }
        .gm-cancel-btn:hover { background: #f1f3f4; }
        .gm-create-btn { padding: 9px 18px; border-radius: 8px; font-size: 14px; background: #1a73e8; color: white; font-weight: 600; }
        .gm-create-btn:hover:not(:disabled) { background: #1557b0; }
        .gm-create-btn:disabled { background: #dadce0; color: #9aa0a6; }
      `}</style>
    </div>
  );
};

export default GroupModal;
