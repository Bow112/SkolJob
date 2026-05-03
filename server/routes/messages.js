const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Auth required' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

router.get('/:roomId', auth, async (req, res) => {
  const messages = global.db.messages.filter(m => m.room === req.params.roomId);
  res.json(messages);
});

module.exports = router;
