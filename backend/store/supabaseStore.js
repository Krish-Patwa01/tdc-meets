// Supabase backed storage, used when SUPABASE_URL is configured.
//
// Postgres columns are snake_case while the rest of the app speaks camelCase,
// so every row is mapped on the way in and out. The app also identifies rows
// by _id, which maps to the uuid primary key.

const { createClient } = require('@supabase/supabase-js');

const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

const unwrap = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};

const toMeeting = (r) =>
  r && {
    _id: r.id,
    title: r.title,
    description: r.description,
    hostEmail: r.host_email,
    roomId: r.room_id,
    unlockTime: r.unlock_time,
    endTime: r.end_time,
    status: r.status,
    timezone: r.timezone,
    attendeeCount: r.attendee_count,
    recordingEnabled: r.recording_enabled,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };

const fromMeeting = (m) => {
  const row = {};
  if (m.title !== undefined) row.title = m.title;
  if (m.description !== undefined) row.description = m.description;
  if (m.hostEmail !== undefined) row.host_email = m.hostEmail;
  if (m.roomId !== undefined) row.room_id = m.roomId;
  if (m.unlockTime !== undefined) row.unlock_time = m.unlockTime;
  if (m.endTime !== undefined) row.end_time = m.endTime;
  if (m.status !== undefined) row.status = m.status;
  if (m.timezone !== undefined) row.timezone = m.timezone;
  if (m.attendeeCount !== undefined) row.attendee_count = m.attendeeCount;
  if (m.recordingEnabled !== undefined) row.recording_enabled = m.recordingEnabled;
  return row;
};

const toAttendee = (r) =>
  r && {
    _id: r.id,
    meetingId: r.meeting_id,
    name: r.name,
    email: r.email,
    isHost: r.is_host,
    isMuted: r.is_muted,
    isKicked: r.is_kicked,
    status: r.status,
    joinedAt: r.joined_at,
    leftAt: r.left_at
  };

const fromAttendee = (a) => {
  const row = {};
  if (a.meetingId !== undefined) row.meeting_id = a.meetingId;
  if (a.name !== undefined) row.name = a.name;
  if (a.email !== undefined) row.email = a.email;
  if (a.isHost !== undefined) row.is_host = a.isHost;
  if (a.isMuted !== undefined) row.is_muted = a.isMuted;
  if (a.isKicked !== undefined) row.is_kicked = a.isKicked;
  if (a.status !== undefined) row.status = a.status;
  if (a.leftAt !== undefined) row.left_at = a.leftAt;
  return row;
};

const toMessage = (r) =>
  r && {
    _id: r.id,
    meetingId: r.meeting_id,
    senderName: r.sender_name,
    senderEmail: r.sender_email,
    message: r.message,
    messageType: r.message_type,
    timestamp: r.timestamp
  };

const toQuestion = (r) =>
  r && {
    _id: r.id,
    meetingId: r.meeting_id,
    askerName: r.asker_name,
    askerEmail: r.asker_email,
    question: r.question,
    status: r.status,
    raisedAt: r.raised_at,
    answeredAt: r.answered_at
  };

module.exports = {
  label: 'Supabase',

  addAdmin: async ({ email, password, name }) => {
    const rows = unwrap(
      await client.from('admins').insert({ email, password, name }).select().single()
    );
    return { _id: rows.id, email: rows.email, password: rows.password, name: rows.name };
  },

  getAdminByEmail: async (email) => {
    const rows = unwrap(await client.from('admins').select('*').eq('email', email).maybeSingle());
    return rows && { _id: rows.id, email: rows.email, password: rows.password, name: rows.name };
  },

  addMeeting: async (meeting) =>
    toMeeting(unwrap(await client.from('meetings').insert(fromMeeting(meeting)).select().single())),

  getAllMeetings: async () =>
    unwrap(await client.from('meetings').select('*').order('unlock_time', { ascending: false }))
      .map(toMeeting),

  getMeetingByRoomId: async (roomId) =>
    toMeeting(
      unwrap(await client.from('meetings').select('*').eq('room_id', roomId).maybeSingle())
    ),

  updateMeeting: async (roomId, updates) =>
    toMeeting(
      unwrap(
        await client
          .from('meetings')
          .update({ ...fromMeeting(updates), updated_at: new Date().toISOString() })
          .eq('room_id', roomId)
          .select()
          .maybeSingle()
      )
    ),

  deleteMeeting: async (roomId) => {
    unwrap(await client.from('meetings').delete().eq('room_id', roomId));
  },

  addAttendee: async (attendee) =>
    toAttendee(
      unwrap(await client.from('attendees').insert(fromAttendee(attendee)).select().single())
    ),

  getAttendeesByMeetingId: async (meetingId) =>
    unwrap(
      await client.from('attendees').select('*').eq('meeting_id', meetingId).eq('status', 'active')
    ).map(toAttendee),

  updateAttendee: async (attendeeId, updates) =>
    toAttendee(
      unwrap(
        await client
          .from('attendees')
          .update(fromAttendee(updates))
          .eq('id', attendeeId)
          .select()
          .maybeSingle()
      )
    ),

  addMessage: async (m) =>
    toMessage(
      unwrap(
        await client
          .from('messages')
          .insert({
            meeting_id: m.meetingId,
            sender_name: m.senderName,
            sender_email: m.senderEmail,
            message: m.message,
            message_type: m.messageType
          })
          .select()
          .single()
      )
    ),

  getMessagesByMeetingId: async (meetingId) =>
    unwrap(
      await client
        .from('messages')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('timestamp', { ascending: true })
    ).map(toMessage),

  addQuestion: async (q) =>
    toQuestion(
      unwrap(
        await client
          .from('questions')
          .insert({
            meeting_id: q.meetingId,
            asker_name: q.askerName,
            asker_email: q.askerEmail,
            question: q.question,
            status: q.status
          })
          .select()
          .single()
      )
    ),

  getQuestionsByMeetingId: async (meetingId) =>
    unwrap(
      await client
        .from('questions')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('raised_at', { ascending: true })
    ).map(toQuestion),

  updateQuestion: async (questionId, updates) => {
    const row = {};
    if (updates.status !== undefined) row.status = updates.status;
    if (updates.answeredAt !== undefined) row.answered_at = updates.answeredAt;
    return toQuestion(
      unwrap(
        await client.from('questions').update(row).eq('id', questionId).select().maybeSingle()
      )
    );
  }
};
