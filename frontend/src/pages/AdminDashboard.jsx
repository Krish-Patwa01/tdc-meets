import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, jitsiDirectUrl } from '../config';
import '../App.css';

export default function AdminDashboard() {
  const [meetings, setMeetings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    unlockTime: '',
    timezone: 'IST'
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const response = await axios.get(`${API}/api/meetings/all`);
      setMeetings(response.data);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/api/meetings/create`, {
        ...formData,
        hostEmail: localStorage.getItem('adminEmail')
      });

      setFormData({ title: '', description: '', unlockTime: '', timezone: 'IST' });
      setShowForm(false);
      fetchMeetings();
    } catch (error) {
      alert('Error creating meeting: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEndMeeting = async (roomId) => {
    if (!window.confirm('End this meeting? The join link will stop working.')) return;
    try {
      await axios.post(`${API}/api/meetings/${roomId}/end`);
      fetchMeetings();
    } catch (error) {
      alert('Error ending meeting');
    }
  };

  const handleDeleteMeeting = async (roomId) => {
    if (!window.confirm('Delete this meeting permanently?')) return;
    try {
      await axios.delete(`${API}/api/meetings/${roomId}`);
      fetchMeetings();
    } catch (error) {
      alert('Error deleting meeting');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    navigate('/login', { replace: true });
  };

  const getStatus = (meeting) => {
    const now = new Date();
    if (meeting.status === 'ended') return 'ended';
    if (meeting.endTime && now > new Date(meeting.endTime)) return 'ended';
    if (now < new Date(meeting.unlockTime)) return 'scheduled';
    return 'active';
  };

  const copyLink = (roomId) => {
    const link = `${window.location.origin}/${roomId}`;
    navigator.clipboard.writeText(link);
    alert('Link copied: ' + link);
  };

  return (
    <div>
      <header>
        <div className="logo">TDC Meets, Admin</div>
        <button className="btn-secondary" onClick={handleLogout}>Logout</button>
      </header>

      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Meeting Dashboard</h1>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Create Meeting'}
          </button>
        </div>

        {showForm && (
          <div className="form-container" style={{ margin: '0 0 30px 0', maxWidth: '100%' }}>
            <h2>New Meeting</h2>
            <form onSubmit={handleCreateMeeting}>
              <div className="form-group">
                <label>Meeting Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Digital Forensics Workshop"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Short description"
                />
              </div>

              <div className="form-group">
                <label>Link Unlock Time</label>
                <input
                  type="datetime-local"
                  name="unlockTime"
                  value={formData.unlockTime}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Timezone</label>
                <select name="timezone" value={formData.timezone} onChange={handleInputChange}>
                  <option value="IST">IST (India Standard Time)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Creating...' : 'Create Meeting'}
              </button>
            </form>
          </div>
        )}

        <div className="meetings-grid">
          {meetings.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No meetings yet. Create your first one.</p>
          ) : (
            meetings.map((meeting) => {
              const status = getStatus(meeting);
              return (
                <div key={meeting._id} className="meeting-card">
                  <span className={`meeting-status status-${status}`}>{status}</span>
                  <h3>{meeting.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{meeting.description}</p>
                  <div className="meeting-meta">
                    <p><strong>Room ID</strong> {meeting.roomId}</p>
                    <p><strong>Attendees</strong> {meeting.attendeeCount || 0}</p>
                    <p><strong>Unlocks</strong> {new Date(meeting.unlockTime).toLocaleString()}</p>
                    {meeting.endTime && <p><strong>Ended</strong> {new Date(meeting.endTime).toLocaleString()}</p>}
                  </div>
                  <div className="card-actions">
                    <button className="btn-primary" onClick={() => copyLink(meeting.roomId)}>Copy Link</button>
                    {status !== 'ended' && (
                      <>
                        <a
                          className="btn-secondary"
                          href={jitsiDirectUrl(meeting.roomId)}
                          target="_blank"
                          rel="noreferrer"
                          style={{ textDecoration: 'none' }}
                          title="Sign in there once so the room opens for everyone"
                        >
                          Start Room
                        </a>
                        <button className="btn-secondary" onClick={() => navigate(`/meet/${meeting.roomId}`, {
                          state: { userName: 'Host', userEmail: localStorage.getItem('adminEmail'), meeting }
                        })}>
                          Join as Host
                        </button>
                        <button className="btn-danger" onClick={() => handleEndMeeting(meeting.roomId)}>End</button>
                      </>
                    )}
                    {status === 'ended' && (
                      <button className="btn-danger" onClick={() => handleDeleteMeeting(meeting.roomId)}>Delete</button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
