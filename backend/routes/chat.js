const express = require('express');
const db = require('../db');
const router = express.Router();

// Send Message
router.post('/send', async (req, res) => {
  try {
    const { meetingId, senderName, senderEmail, message, messageType } = req.body;

    const chatMessage = await db.addMessage({
      meetingId,
      senderName,
      senderEmail,
      message,
      messageType: messageType || 'text'
    });

    res.status(201).json({ message: 'Message sent', chatMessage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Meeting Chat
router.get('/meeting/:meetingId', async (req, res) => {
  try {
    const messages = await db.getMessagesByMeetingId(req.params.meetingId);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
