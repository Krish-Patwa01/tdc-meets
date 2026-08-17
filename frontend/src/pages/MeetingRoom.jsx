import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { API, JITSI_DOMAIN, jitsiRoomName, jitsiDirectUrl } from '../config';
import '../App.css';

export default function MeetingRoom() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [attendees, setAttendees] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [hands, setHands] = useState([]);
  const [videoJoined, setVideoJoined] = useState(false);
  const [coverDismissed, setCoverDismissed] = useState(false);
  const socketRef = useRef(null);
  const jitsiContainer = useRef(null);
  const apiRef = useRef(null);

  const userName = location.state?.userName;
  const meeting = location.state?.meeting;
  const isHost = location.state?.userEmail && meeting && location.state.userEmail === meeting.hostEmail;

  useEffect(() => {
    if (!userName) {
      navigate(`/${roomId}`, { replace: true });
      return;
    }

    const socket = io(API);
    socketRef.current = socket;

    socket.emit('join-meeting', { userName, roomId });

    socket.on('user-joined', (data) => {
      setAttendees((prev) => [...prev, data]);
      setMessages((prev) => [...prev, { sender: 'System', message: `${data.userName} joined` }]);
    });

    socket.on('receive-message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on('hand-raised', (data) => {
      setHands((prev) => [...prev, data]);
    });

    socket.on('kicked-from-meeting', () => {
      alert('You have been removed from this meeting');
      navigate('/');
    });

    loadJitsi();

    return () => {
      socket.close();
      if (apiRef.current) apiRef.current.dispose();
    };
    // loadJitsi is stable for the lifetime of a room and re-running this effect
    // would tear down the call, so it is deliberately not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userName, navigate]);

  const loadJitsi = () => {
    if (window.JitsiMeetExternalAPI) {
      initJitsi();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://${JITSI_DOMAIN}/external_api.js`;
    script.async = true;
    script.onload = initJitsi;
    document.body.appendChild(script);
  };

  const initJitsi = () => {
    if (!jitsiContainer.current || apiRef.current) return;

    // Attendees keep camera and mic off and only unmute to ask a question, so
    // they get a minimal toolbar. Recording stays with the host only.
    const toolbar = isHost
      ? ['microphone', 'camera', 'desktop', 'recording', 'tileview', 'fullscreen', 'settings', 'hangup']
      : ['microphone', 'camera', 'desktop', 'tileview', 'fullscreen', 'hangup'];

    apiRef.current = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
      roomName: jitsiRoomName(roomId),
      width: '100%',
      height: '100%',
      parentNode: jitsiContainer.current,
      userInfo: { displayName: userName },
      configOverwrite: {
        startWithAudioMuted: true,
        startWithVideoMuted: true,
        prejoinPageEnabled: false,
        disableDeepLinking: true,
        disableInviteFunctions: true,
        doNotStoreRoom: true,
        // Chat, raised hands and the participant list live in our own sidebar.
        toolbarButtons: toolbar
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_BRAND_WATERMARK: false,
        SHOW_POWERED_BY: false,
        SHOW_PROMOTIONAL_CLOSE_PAGE: false,
        HIDE_DEEP_LINKING_LOGO: true,
        JITSI_WATERMARK_LINK: '',
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        MOBILE_APP_PROMO: false,
        DEFAULT_BACKGROUND: '#111111',
        TOOLBAR_BUTTONS: toolbar
      }
    });

    // Until this fires the room has no moderator yet, and Jitsi shows its own
    // "no moderators have arrived" screen. We cover it with our own message.
    apiRef.current.addEventListener('videoConferenceJoined', () => setVideoJoined(true));
    apiRef.current.addEventListener('videoConferenceLeft', () => setVideoJoined(false));
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;

    socketRef.current.emit('send-message', {
      roomId,
      sender: userName,
      message: currentMessage
    });
    setCurrentMessage('');
  };

  const raiseHand = () => {
    socketRef.current.emit('raise-hand', { roomId, userName });
  };

  const leaveMeeting = () => {
    if (window.confirm('Leave this meeting?')) navigate('/');
  };

  return (
    <div className="meeting-container">
      <div className="video-section">
        <div ref={jitsiContainer} style={{ width: '100%', height: '100%' }} />
        {!videoJoined && !coverDismissed && (
          <div className="video-cover">
            <div className="video-cover-title">
              {isHost ? 'Start the session' : 'Waiting for the host'}
            </div>
            <p className="video-cover-text">
              {isHost
                ? 'Open the room once to start it, then come back to this tab. Everyone waiting will connect automatically.'
                : 'The session has not started yet. This screen will clear on its own the moment the host begins.'}
            </p>
            {isHost && (
              <a
                className="btn-primary"
                href={jitsiDirectUrl(roomId)}
                target="_blank"
                rel="noreferrer"
                style={{ marginTop: '16px' }}
              >
                Open room to start
              </a>
            )}
            {/* The call underneath sometimes needs a tap, for camera permission
                or to confirm joining, which this panel would otherwise swallow.
                Never trap anyone behind it. */}
            <button className="video-cover-skip" onClick={() => setCoverDismissed(true)}>
              Show the meeting screen
            </button>
          </div>
        )}
      </div>

      <div className="sidebar">
        <div className="sidebar-section">
          <div className="sidebar-title">Meeting</div>
          <div style={{ fontSize: '13px' }}>
            <p><strong>{meeting?.title || 'TDC Meet'}</strong></p>
            <p style={{ color: 'var(--text-secondary)' }}>Room {roomId}</p>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-title">In the room ({attendees.length})</div>
          {attendees.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Nobody else yet</p>
          ) : (
            <div className="attendee-list">
              {attendees.map((a, i) => (
                <div key={i} className="attendee-item">
                  <span>{a.userName}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sidebar-section">
          <div className="sidebar-title">Raised hands ({hands.length})</div>
          {hands.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No questions yet</p>
          ) : (
            hands.map((h, i) => (
              <div key={i} className="attendee-item">
                <span>{h.userName}</span>
                {isHost && (
                  <button
                    className="btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                    onClick={() => setHands(hands.filter((_, idx) => idx !== i))}
                  >
                    Done
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <div className="chat-section">
          <div className="sidebar-title">Chat</div>
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className="chat-message">
                <strong>{msg.sender}</strong> {msg.message}
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="chat-input">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Type a message"
            />
            <button type="submit" className="btn-primary">Send</button>
          </form>
        </div>

        <div className="sidebar-section">
          <button onClick={raiseHand} className="btn-primary" style={{ width: '100%', marginBottom: '8px' }}>
            Raise Hand
          </button>
          <button onClick={leaveMeeting} className="btn-danger" style={{ width: '100%' }}>
            Leave Meeting
          </button>
        </div>
      </div>
    </div>
  );
}
