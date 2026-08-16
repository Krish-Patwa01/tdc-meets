import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../config';
import '../App.css';

export default function JoinMeeting() {
  const { roomId: urlRoomId } = useParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roomId, setRoomId] = useState(urlRoomId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gateMessage, setGateMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!urlRoomId) return;
    axios
      .get(`${API}/api/meetings/${urlRoomId}`)
      .catch((err) => {
        const data = err.response?.data;
        if (data?.status === 'not_started') {
          setGateMessage({
            type: 'waiting',
            text: `Please wait, ${data.title || 'the workshop'} will start at ${new Date(data.startTime).toLocaleString()}`
          });
        } else if (data?.status === 'ended') {
          setGateMessage({ type: 'ended', text: data.message });
        }
      });
  }, [urlRoomId]);

  const handleJoinMeeting = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const meetingResponse = await axios.get(`${API}/api/meetings/${roomId}`);

      await axios.post(`${API}/api/attendees/join`, {
        roomId,
        name,
        email: email || null
      });

      navigate(`/meet/${roomId}`, {
        state: {
          userName: name,
          userEmail: email,
          meeting: meetingResponse.data
        }
      });
    } catch (err) {
      const data = err.response?.data;
      if (data?.status === 'not_started') {
        setError(`Please wait, workshop will start at ${new Date(data.startTime).toLocaleString()}`);
      } else if (data?.status === 'ended') {
        setError(data.message);
      } else {
        setError(data?.message || 'Could not join. Check the meeting ID.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (gateMessage) {
    return (
      <div>
        <header>
          <div className="logo">TDC Meets</div>
          <div style={{ color: 'white' }}>Connecting Hackers with Purpose</div>
        </header>
        <div className="form-container" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            {gateMessage.type === 'waiting' ? '🕐' : '🔒'}
          </div>
          <h2>{gateMessage.type === 'waiting' ? 'Not started yet' : 'Workshop ended'}</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>{gateMessage.text}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header>
        <div className="logo">TDC Meets</div>
        <div style={{ color: 'white' }}>Connecting Hackers with Purpose</div>
      </header>

      <div className="form-container">
        <h2>Join a Meeting</h2>
        <p style={{ textAlign: 'center', marginBottom: '30px', color: 'var(--text-secondary)' }}>
          Enter your name to join
        </p>

        <form onSubmit={handleJoinMeeting}>
          {error && (
            <div className="alert-error">{error}</div>
          )}

          <div className="form-group">
            <label>Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="form-group">
            <label>Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label>Meeting Room ID</label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              placeholder="e.g. A1B2C3D4"
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: '20px' }}
            disabled={loading}
          >
            {loading ? 'Joining...' : 'Join Meeting'}
          </button>
        </form>

        <div className="panel-note">
          <h4>Are you the host?</h4>
          <p>Create and manage meetings from the admin panel</p>
          <a href="/login" className="btn-secondary" style={{ display: 'inline-block', textDecoration: 'none' }}>
            Go to Admin Panel
          </a>
        </div>
      </div>
    </div>
  );
}
