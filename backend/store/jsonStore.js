// File backed storage. Used for local development so the platform runs with
// no external services. Not suitable for hosts with an ephemeral filesystem,
// see supabaseStore.js for production.

const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'data');

const FILES = {
  admins: path.join(DB_DIR, 'admins.json'),
  meetings: path.join(DB_DIR, 'meetings.json'),
  attendees: path.join(DB_DIR, 'attendees.json'),
  messages: path.join(DB_DIR, 'messages.json'),
  questions: path.join(DB_DIR, 'questions.json')
};

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

for (const file of Object.values(FILES)) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, '[]');
  }
}

const read = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
};

const write = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

const insert = (file, row) => {
  const rows = read(file);
  const created = { ...row, _id: `${Date.now()}${Math.random().toString(16).slice(2, 8)}` };
  rows.push(created);
  write(file, rows);
  return created;
};

const patch = (file, match, updates) => {
  const rows = read(file);
  const idx = rows.findIndex(match);
  if (idx === -1) return null;
  rows[idx] = { ...rows[idx], ...updates };
  write(file, rows);
  return rows[idx];
};

module.exports = {
  label: 'JSON files',

  addAdmin: async (admin) => insert(FILES.admins, admin),
  getAdminByEmail: async (email) => read(FILES.admins).find((a) => a.email === email) || null,

  addMeeting: async (meeting) => insert(FILES.meetings, meeting),
  getAllMeetings: async () => read(FILES.meetings),
  getMeetingByRoomId: async (roomId) =>
    read(FILES.meetings).find((m) => m.roomId === roomId) || null,
  updateMeeting: async (roomId, updates) =>
    patch(FILES.meetings, (m) => m.roomId === roomId, { ...updates, updatedAt: new Date() }),
  deleteMeeting: async (roomId) => {
    write(FILES.meetings, read(FILES.meetings).filter((m) => m.roomId !== roomId));
  },

  addAttendee: async (attendee) => insert(FILES.attendees, attendee),
  getAttendeesByMeetingId: async (meetingId) =>
    read(FILES.attendees).filter((a) => a.meetingId === meetingId && a.status === 'active'),
  updateAttendee: async (attendeeId, updates) =>
    patch(FILES.attendees, (a) => a._id === attendeeId, updates),

  addMessage: async (message) => insert(FILES.messages, { ...message, timestamp: new Date() }),
  getMessagesByMeetingId: async (meetingId) =>
    read(FILES.messages).filter((m) => m.meetingId === meetingId),

  addQuestion: async (question) => insert(FILES.questions, { ...question, raisedAt: new Date() }),
  getQuestionsByMeetingId: async (meetingId) =>
    read(FILES.questions).filter((q) => q.meetingId === meetingId),
  updateQuestion: async (questionId, updates) =>
    patch(FILES.questions, (q) => q._id === questionId, updates)
};
