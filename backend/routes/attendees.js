const express = require('express');
const db = require('../db');
const router = express.Router();

// Join Meeting
router.post('/join', async (req, res) => {
  try {
    const { roomId, name, email } = req.body;

    const meeting = await db.getMeetingByRoomId(roomId);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    const attendee = await db.addAttendee({
      meetingId: meeting._id,
      name,
      email,
      isHost: email === meeting.hostEmail,
      status: 'active',
      joinedAt: new Date()
    });

    const attendees = await db.getAttendeesByMeetingId(meeting._id);
    await db.updateMeeting(roomId, { attendeeCount: attendees.length });

    res.status(201).json({ attendee });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Meeting Attendees
router.get('/meeting/:meetingId', async (req, res) => {
  try {
    const attendees = await db.getAttendeesByMeetingId(req.params.meetingId);
    res.json(attendees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mute Attendee
router.put('/:attendeeId/mute', async (req, res) => {
  try {
    const attendee = await db.updateAttendee(req.params.attendeeId, { isMuted: true });
    res.json({ message: 'Attendee muted', attendee });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Kick Attendee
router.put('/:attendeeId/kick', async (req, res) => {
  try {
    const attendee = await db.updateAttendee(req.params.attendeeId, {
      status: 'kicked',
      isKicked: true,
      leftAt: new Date()
    });
    res.json({ message: 'Attendee kicked', attendee });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Leave Meeting
router.put('/:attendeeId/leave', async (req, res) => {
  try {
    const attendee = await db.updateAttendee(req.params.attendeeId, {
      status: 'left',
      leftAt: new Date()
    });
    res.json({ message: 'Left meeting', attendee });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
