import React, { useState, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, Camera, Upload } from 'lucide-react';

interface ProfileModalProps {
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { user, setUser } = useAuth();
  const [profilePic, setProfilePic] = useState(user?.profilePicture || '');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const res = await api.post('/users/update-profile', { profilePicture: profilePic });
      setUser(res.data);
      onClose();
    } catch (err) {
      alert('Uppdateringen misslyckades');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content fade-in">
        <div className="modal-header">
          <h2>Redigera profil</h2>
          <button onClick={onClose} className="icon-btn"><X size={24} /></button>
        </div>
        <div className="modal-body">
          <div className="avatar-preview-section" onClick={() => fileInputRef.current?.click()}>
            <img src={profilePic} alt="Preview" className="large-avatar" />
            <div className="avatar-edit-badge"><Camera size={16} /></div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
            accept="image/*"
          />
          
          <div className="form-group">
            <label>Profilbild (Ladda upp eller använd URL)</label>
            <div className="input-with-action">
              <input 
                type="text" 
                className="input-field" 
                value={profilePic} 
                onChange={(e) => setProfilePic(e.target.value)}
                placeholder="Klistra in bild-URL eller ladda upp"
              />
              <button className="icon-btn action-btn" onClick={() => fileInputRef.current?.click()}>
                <Upload size={20} />
              </button>
            </div>
          </div>
          <p className="hint-text">Tips: Klicka på cirkeln ovan för att ladda upp en bild direkt från din dator.</p>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="ghost-btn">Avbryt</button>
          <button onClick={handleUpdate} className="primary-btn" disabled={loading}>
            {loading ? 'Sparar...' : 'Spara ändringar'}
          </button>
        </div>
      </div>
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }
        .modal-content {
          background: white;
          width: 100%;
          max-width: 400px;
          border-radius: 16px;
          padding: 24px;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .avatar-preview-section {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto 24px;
          cursor: pointer;
        }
        .large-avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid var(--primary);
          transition: filter 0.2s;
        }
        .avatar-preview-section:hover .large-avatar {
          filter: brightness(0.8);
        }
        .avatar-edit-badge {
          position: absolute;
          bottom: 5px;
          right: 5px;
          background: var(--primary);
          color: white;
          padding: 8px;
          border-radius: 50%;
          display: flex;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .input-with-action {
          display: flex;
          gap: 8px;
        }
        .action-btn {
          background: var(--bg-hover);
          border: 1px solid var(--border);
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }
        .hint-text {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 12px;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default ProfileModal;
