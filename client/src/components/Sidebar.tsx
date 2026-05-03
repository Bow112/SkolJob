import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, MessageSquare, Globe, Plus, UserPlus, LogOut, Settings, Bell, Trash2, X, Bot, Sparkles } from 'lucide-react';
import ProfileModal from './ProfileModal';
import GroupModal from './GroupModal';

interface SidebarProps {
  onSelectRoom: (roomId: string, name: string, isGlobal?: boolean, isAI?: boolean) => void;
  activeRoom: string;
}

const formatLastActive = (date: any): string => {
  if (!date) return '';
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 2) return 'Aktiv nu';
  if (mins < 60) return `Aktiv ${mins} min sedan`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Aktiv ${hrs} tim sedan`;
  return `Aktiv ${Math.floor(hrs/24)} dag sedan`;
};

const Sidebar: React.FC<SidebarProps> = ({ onSelectRoom, activeRoom }) => {
  const { user, logout } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [social, setSocial] = useState<any>({ friends: [], requests: [], notifications: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchConversations();
    fetchSocial();
    const interval = setInterval(() => {
      fetchSocial();
      fetchConversations();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/conversations');
      setConversations(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  };

  const fetchSocial = async () => {
    try {
      const res = await api.get('/users/social');
      setSocial(res.data || { friends: [], requests: [], notifications: [] });
    } catch (err) { console.error(err); }
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim().length > 0) {
      setShowSearch(true);
      try {
        const res = await api.get(`/users/search?query=${query}`);
        setSearchResults(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setSearchResults([]);
      }
    } else {
      setShowSearch(false);
      setSearchResults([]);
    }
  };

  const sendFriendRequest = async (id: string) => {
    try {
      await api.post(`/users/friend-request/${id}`);
      setShowSearch(false);
      setSearchQuery('');
      alert('Vänförfrågan skickad!');
    } catch (err) { alert('Kunde inte skicka förfrågan'); }
  };

  const acceptRequest = async (requesterId: string) => {
    try {
      // 1. Accept the friend request
      await api.post(`/users/accept-request/${requesterId}`);
      // 2. Immediately create a DM conversation with this friend
      await api.post(`/conversations/dm/${requesterId}`);
      // 3. Refresh both lists
      await fetchSocial();
      await fetchConversations();
    } catch (err) { 
      console.error(err);
      alert('Fel vid accept'); 
    }
  };

  const clearNotifications = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.post('/users/clear-notifications');
      setSocial((prev: any) => ({ ...prev, notifications: [] }));
    } catch (err) { console.error(err); }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="user-profile">
          <img src={user?.profilePicture} alt="P" className="header-avatar" onClick={() => setShowProfile(true)} />
          <span className="username">{user?.username}</span>
        </div>
        <div className="header-actions">
          <div className="notification-container">
            <button onClick={() => setShowNotifications(!showNotifications)} className="icon-btn">
              <Bell size={20} />
              {social.notifications?.length > 0 && <span className="badge">{social.notifications.length}</span>}
            </button>
            {showNotifications && (
              <div className="notif-dropdown">
                <div className="notif-header">
                  <span>Notiser</span>
                  <button onClick={clearNotifications} className="clear-btn"><Trash2 size={14} /></button>
                </div>
                <div className="notif-list">
                  {social.notifications?.length > 0 ? (
                    social.notifications.map((n: any) => (
                      <div key={n.id} className="notif-item">
                        {n.type === 'friend_request' ? `${n.from} skickade en vänförfrågan` : n.from}
                      </div>
                    ))
                  ) : (
                    <div className="notif-empty">Inga nya notiser</div>
                  )}
                </div>
              </div>
            )}
          </div>
          <button onClick={() => setShowProfile(true)} className="icon-btn"><Settings size={20} /></button>
          <button onClick={logout} className="icon-btn logout-btn"><LogOut size={20} /></button>
        </div>
      </div>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {showGroupModal && <GroupModal friends={social.friends || []} onClose={() => setShowGroupModal(false)} onCreated={fetchConversations} />}

      {/* SEARCH */}
      <div className="sidebar-search">
        <div className="search-input-container">
          <input
            type="text"
            placeholder="Sök och lägg till vänner..."
            value={searchQuery}
            onChange={handleSearch}
            className="search-input"
          />
          {showSearch && (
            <div className="search-results-overlay">
              <div className="search-results-header">
                <span>Sökresultat</span>
                <button onClick={() => { setShowSearch(false); setSearchQuery(''); }}><X size={16} /></button>
              </div>
              <div className="search-results-list">
                {searchResults.length > 0 ? (
                  searchResults.map(u => (
                    <div key={u._id} className="search-user-card">
                      <img src={u.profilePicture} alt="" className="search-avatar" />
                      <div className="search-user-info">
                        <span className="search-username">{u.username}</span>
                        <button onClick={() => sendFriendRequest(u._id)} className="add-friend-btn">
                          <UserPlus size={14} /> Lägg till
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="search-empty-state">Hittade ingen användare</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sidebar-sections">

        {/* FRIEND REQUESTS - HIGH PRIORITY */}
        {social.requests?.length > 0 && (
          <div className="priority-requests">
            <div className="section-title urgent"><UserPlus size={14} /><span>Vänförfrågningar ({social.requests.length})</span></div>
            {social.requests.map((r: any) => (
              <div key={r._id} className="request-card">
                <img src={r.profilePicture} alt="" className="req-avatar" />
                <div className="req-info">
                  <span className="req-name">{r.username}</span>
                  <button onClick={() => acceptRequest(r._id)} className="accept-btn">✓ Acceptera</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI */}
        <div className="section-title"><Sparkles size={14} /><span>AI Assistent</span></div>
        <div className={`sidebar-item ai-item ${activeRoom === 'ai' ? 'active-ai' : ''}`} onClick={() => onSelectRoom('ai', 'Bowen GPT', false, true)}>
          <div className="ai-icon-small"><Bot size={16} /></div>
          <span>Bowen GPT Premium</span>
        </div>

        {/* GLOBAL */}
        <div className="section-title"><Globe size={14} /><span>Kanaler</span></div>
        <div className={`sidebar-item ${activeRoom === 'global' ? 'active' : ''}`} onClick={() => onSelectRoom('global', 'Global Chat', true)}>
          <div className="channel-icon">#</div>
          <span>global-chat</span>
        </div>

        {/* DMs */}
        <div className="section-title">
          <MessageSquare size={14} />
          <span>Direktmeddelanden</span>
        </div>
        {conversations.filter(c => !c.isGroup).map(c => {
          const other = c.participants?.find((p: any) => p._id !== user?._id);
          if (!other) return null;
          const lastActiveStr = formatLastActive(other.lastActive);
          return (
            <div key={c._id} className={`sidebar-item ${activeRoom === c._id ? 'active' : ''}`} onClick={() => onSelectRoom(c._id, other.username)}>
              <div className="dm-avatar-wrap">
                <img src={other.profilePicture} alt="" className="dm-avatar" />
                {lastActiveStr === 'Aktiv nu' && <span className="online-dot"/>}
              </div>
              <div className="dm-info">
                <span className="dm-username">{other.username}</span>
                {lastActiveStr && <span className="dm-last-active">{lastActiveStr}</span>}
              </div>
            </div>
          );
        })}
        {conversations.filter(c => !c.isGroup).length === 0 && (
          <div className="empty-hint">Lägg till vänner för att starta en chatt!</div>
        )}

        {/* GROUPS */}
        <div className="section-title">
          <Users size={14} />
          <span>Grupper</span>
          <button className="add-btn" onClick={() => setShowGroupModal(true)}><Plus size={14} /></button>
        </div>
        {conversations.filter(c => c.isGroup).map(c => (
          <div key={c._id} className={`sidebar-item ${activeRoom === c._id ? 'active' : ''}`} onClick={() => onSelectRoom(c._id, c.name)}>
            <div className="group-icon">{c.name?.[0] || 'G'}</div>
            <span>{c.name}</span>
          </div>
        ))}
      </div>

      <style>{`
        .sidebar { width: 300px; min-width: 300px; background: var(--bg-sidebar); border-right: 1px solid var(--border); display: flex; flex-direction: column; height: 100%; color: var(--text-main); }
        .sidebar-header { padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); background: var(--bg-sidebar); }
        .user-profile { display: flex; align-items: center; gap: 10px; }
        .header-avatar { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; cursor: pointer; border: 2px solid var(--primary); flex-shrink: 0; }
        .username { font-weight: 700; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px; color: var(--text-main); }
        .header-actions { display: flex; gap: 2px; align-items: center; }
        .dm-avatar-wrap { position: relative; flex-shrink: 0; }
        .online-dot { position: absolute; bottom: 0; right: 0; width: 8px; height: 8px; background: #34a853; border-radius: 50%; border: 2px solid var(--bg-sidebar); }
        .dm-info { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
        .dm-username { font-size: 14px; font-weight: 500; }
        .dm-last-active { font-size: 10px; color: var(--text-secondary); }
        .notification-container { position: relative; }
        .badge { position: absolute; top: -4px; right: -4px; background: #ea4335; color: white; border-radius: 50%; font-size: 9px; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; font-weight: bold; }
        .notif-dropdown { position: absolute; top: calc(100% + 8px); right: 0; width: 250px; background: white; border: 1px solid #e8eaed; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); z-index: 200; overflow: hidden; }
        .notif-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #f8f9fa; border-bottom: 1px solid #e8eaed; font-weight: 700; font-size: 13px; }
        .notif-list { max-height: 250px; overflow-y: auto; }
        .notif-item { padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #f1f3f4; }
        .notif-empty { padding: 20px; text-align: center; color: #80868b; font-size: 13px; }
        .logout-btn:hover { color: #ea4335; }
        
        /* SEARCH */
        .sidebar-search { padding: 10px 12px; background: white; border-bottom: 1px solid #e8eaed; position: relative; }
        .search-input-container { position: relative; }
        .search-input { width: 100%; padding: 9px 14px; border-radius: 20px; border: 1px solid #dadce0; background: #f1f3f4; font-size: 13px; outline: none; box-sizing: border-box; transition: all 0.2s; }
        .search-input:focus { background: white; border-color: #1a73e8; box-shadow: 0 0 0 2px rgba(26,115,232,0.15); }
        .search-results-overlay { position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #dadce0; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); z-index: 200; margin-top: 6px; overflow: hidden; }
        .search-results-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f8f9fa; border-bottom: 1px solid #e8eaed; font-size: 11px; font-weight: 700; color: #5f6368; }
        .search-results-list { max-height: 300px; overflow-y: auto; }
        .search-user-card { display: flex; align-items: center; gap: 12px; padding: 10px 14px; transition: background 0.15s; }
        .search-user-card:hover { background: #f8f9fa; }
        .search-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        .search-user-info { display: flex; flex-direction: column; gap: 4px; flex: 1; }
        .search-username { font-weight: 700; font-size: 14px; }
        .add-friend-btn { display: flex; align-items: center; gap: 5px; background: #1a73e8; color: white; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; width: fit-content; }
        .search-empty-state { padding: 20px; text-align: center; color: #80868b; font-size: 13px; }

        /* SECTIONS */
        .sidebar-sections { flex: 1; overflow-y: auto; padding: 8px; }
        .section-title { display: flex; align-items: center; gap: 6px; padding: 12px 10px 6px; font-size: 11px; font-weight: 700; color: #5f6368; text-transform: uppercase; letter-spacing: 0.5px; }
        .add-btn { margin-left: auto; color: #5f6368; padding: 2px; border-radius: 4px; }
        .add-btn:hover { color: #1a73e8; background: #e8f0fe; }

        /* FRIEND REQUESTS */
        .priority-requests { background: #fffbeb; border-radius: 10px; margin: 4px 0 8px; padding: 4px 6px; border: 1px solid #fde68a; }
        .section-title.urgent { color: #92400e; padding: 8px 4px 4px; }
        .request-card { display: flex; align-items: center; gap: 8px; padding: 8px; background: white; border-radius: 8px; margin-bottom: 4px; border: 1px solid #fef3c7; }
        .req-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        .req-info { display: flex; flex-direction: column; gap: 3px; flex: 1; }
        .req-name { font-size: 13px; font-weight: 700; }
        .accept-btn { background: #10b981; color: white; padding: 3px 8px; border-radius: 5px; font-size: 11px; font-weight: 700; width: fit-content; }
        .accept-btn:hover { background: #059669; }

        /* ITEMS */
        .sidebar-item { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 8px; cursor: pointer; transition: background 0.1s; font-size: 14px; margin-bottom: 1px; }
        .sidebar-item:hover { background: #e8eaed; }
        .sidebar-item.active { background: #e8f0fe; color: #1a73e8; font-weight: 600; }
        .ai-item { background: linear-gradient(135deg, #fdf2ff, #f0f4ff); border: 1px solid #e9d5ff; }
        .ai-item.active-ai { background: #f3e8ff; color: #7c3aed; font-weight: 600; }
        .ai-icon-small { width: 26px; height: 26px; border-radius: 7px; background: linear-gradient(135deg, #6366f1, #a855f7); color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .channel-icon { width: 26px; height: 26px; border-radius: 7px; background: #dadce0; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 14px; color: #5f6368; flex-shrink: 0; }
        .dm-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        .group-icon { width: 26px; height: 26px; border-radius: 7px; background: #dadce0; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; flex-shrink: 0; }
        .empty-hint { padding: 8px 10px; font-size: 12px; color: #9aa0a6; font-style: italic; }
      `}</style>
    </div>
  );
};

export default Sidebar;
