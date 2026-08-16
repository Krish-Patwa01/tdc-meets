const express = require('express');
const db = require('../db');
const router = express.Router();

// Raise Hand (Post Question)
router.post('/raise', async (req, res) => {
  try {
    const { meetingId, askerName, askerEmail, question } = req.body;

    const newQuestion = await db.addQuestion({
      meetingId,
      askerName,
      askerEmail,
      question,
      status: 'pending'
    });

    res.status(201).json({ message: 'Question raised', question: newQuestion });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Meeting Questions
router.get('/meeting/:meetingId', async (req, res) => {
  try {
    const questions = await db.getQuestionsByMeetingId(req.params.meetingId);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Answer Question
router.put('/:questionId/answer', async (req, res) => {
  try {
    const question = await db.updateQuestion(req.params.questionId, {
      status: 'answered',
      answeredAt: new Date()
    });
    res.json({ message: 'Question marked as answered', question });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Skip Question
router.put('/:questionId/skip', async (req, res) => {
  try {
    const question = await db.updateQuestion(req.params.questionId, { status: 'skipped' });
    res.json({ message: 'Question skipped', question });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
