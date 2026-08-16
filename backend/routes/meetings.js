const express = require('express');
const db = require('../db');
const router = express.Router();
const crypto = require('crypto');

// Create Meeting
router.post('/create', async (req, res) => {
  try {
    const { title, description, unlockTime, hostEmail, timezone } = req.body;
    const roomId = crypto.randomBytes(8).toString('hex').toUpperCase();

    const meeting = await db.addMeeting({
      title,
      description,
      unlockTime: new Date(unlockTime),
      hostEmail,
      roomId,
      timezone,
      status: 'scheduled',
      attendeeCount: 0
    });

    res.status(201).json({
      message: 'Meeting created successfully',
      meeting,
      joinLink: `https://meet.thedarknetcommunity.com/${roomId}`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get All Meetings
router.get('/all', async (req, res) => {
  try {
    const meetings = await db.getAllMeetings();
    meetings.sort((a, b) => new Date(b.unlockTime) - new Date(a.unlockTime));
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Meeting by RoomId
router.get('/:roomId', async (req, res) => {
  try {
    const meeting = await db.getMeetingByRoomId(req.params.roomId);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Check meeting status
    const now = new Date();
    if (now < new Date(meeting.unlockTime)) {
      return res.status(403).json({
        status: 'not_started',
        title: meeting.title,
        message: `Please wait, ${meeting.title} will start at ${meeting.unlockTime}`,
        startTime: meeting.unlockTime
      });
    }

    if (meeting.status === 'ended' || (meeting.endTime && now > new Date(meeting.endTime))) {
      return res.status(403).json({
        status: 'ended',
        title: meeting.title,
        message: `${meeting.title} has ended`
      });
    }

    const updated = await db.updateMeeting(req.params.roomId, { status: 'active' });
    res.json(updated || meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Meeting
router.put('/:roomId', async (req, res) => {
  try {
    const { title, description, endTime, recordingEnabled } = req.body;
    const meeting = await db.updateMeeting(req.params.roomId, {
      title,
      description,
      endTime: endTime ? new Date(endTime) : null,
      recordingEnabled
    });

    res.json({ message: 'Meeting updated', meeting });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// End Meeting
router.post('/:roomId/end', async (req, res) => {
  try {
    const meeting = await db.updateMeeting(req.params.roomId, {
      status: 'ended',
      endTime: new Date()
    });

    res.json({ message: 'Meeting ended', meeting });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Meeting
router.delete('/:roomId', async (req, res) => {
  try {
    await db.deleteMeeting(req.params.roomId);
    res.json({ message: 'Meeting deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
