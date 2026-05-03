import React from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';

interface CallOverlayProps {
  type: 'voice' | 'video';
  status: 'incoming' | 'calling' | 'active';
  remoteName: string;
  onAnswer: () => void;
  onDecline: () => void;
  onEnd: () => void;
  isMuted: boolean;
  isVideoOff: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
}

const CallOverlay: React.FC<CallOverlayProps> = (props) => {
  return (
    <div className="call-overlay fade-in">
      <div className="call-card">
        <div className="call-info">
          <div className="caller-avatar">{props.remoteName[0]}</div>
          <h3>{props.remoteName}</h3>
          <p>{props.status === 'incoming' ? 'Inkommande samtal...' : props.status === 'calling' ? 'Ringer...' : 'Samtal pågår'}</p>
        </div>

        {props.type === 'video' && (
          <div className="video-streams">
            <video ref={props.remoteVideoRef} autoPlay playsInline className="remote-video" />
            <video ref={props.localVideoRef} autoPlay playsInline muted className="local-video" />
          </div>
        )}

        <div className="call-actions">
          {props.status === 'incoming' ? (
            <>
              <button onClick={props.onDecline} className="action-btn decline"><PhoneOff size={24} /></button>
              <button onClick={props.onAnswer} className="action-btn answer">
                {props.type === 'video' ? <Video size={24} /> : <Mic size={24} />}
              </button>
            </>
          ) : (
            <>
              <button onClick={props.onToggleMic} className={`action-btn secondary ${props.isMuted ? 'off' : ''}`}>
                {props.isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              {props.type === 'video' && (
                <button onClick={props.onToggleVideo} className={`action-btn secondary ${props.isVideoOff ? 'off' : ''}`}>
                  {props.isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                </button>
              )}
              <button onClick={props.onEnd} className="action-btn decline"><PhoneOff size={24} /></button>
            </>
          )}
        </div>
      </div>
      <style>{`
        .call-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 200; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); }
        .call-card { background: #202124; color: white; width: 100%; max-width: 500px; border-radius: 24px; padding: 40px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
        .call-info h3 { font-size: 24px; margin: 16px 0 8px; }
        .call-info p { color: #9aa0a6; margin-bottom: 32px; }
        .caller-avatar { width: 80px; height: 80px; border-radius: 50%; background: var(--primary); margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; }
        .video-streams { position: relative; width: 100%; height: 300px; background: #000; border-radius: 16px; overflow: hidden; margin-bottom: 24px; }
        .remote-video { width: 100%; height: 100%; object-fit: cover; }
        .local-video { position: absolute; bottom: 16px; right: 16px; width: 120px; height: 90px; border-radius: 8px; border: 2px solid white; object-fit: cover; }
        .call-actions { display: flex; justify-content: center; gap: 24px; }
        .action-btn { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
        .action-btn:hover { transform: scale(1.1); }
        .action-btn.answer { background: #34a853; color: white; }
        .action-btn.decline { background: #ea4335; color: white; }
        .action-btn.secondary { background: #3c4043; color: white; width: 50px; height: 50px; }
        .action-btn.off { background: #f28b82; color: #3c4043; }
      `}</style>
    </div>
  );
};

export default CallOverlay;
