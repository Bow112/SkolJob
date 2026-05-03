const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Behörighet saknas' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Ogiltig token' });
  }
};

router.post('/dm/:targetId', auth, async (req, res) => {
  let conversation = global.db.conversations.find(c => 
    !c.isGroup && c.participants.includes(req.userId) && c.participants.includes(req.params.targetId)
  );

  if (!conversation) {
    conversation = {
      _id: Math.random().toString(36).substr(2, 9),
      participants: [req.userId, req.params.targetId],
      isGroup: false,
      updatedAt: new Date()
    };
    global.db.conversations.push(conversation);
  }
  res.json(conversation);
});

router.post('/group', auth, async (req, res) => {
  const { name, participantIds } = req.body;
  const conversation = {
    _id: Math.random().toString(36).substr(2, 9),
    name,
    participants: [req.userId, ...participantIds],
    isGroup: true,
    groupAdmin: req.userId,
    updatedAt: new Date()
  };
  global.db.conversations.push(conversation);
  res.json(conversation);
});

router.get('/', auth, async (req, res) => {
  const conversations = global.db.conversations
    .filter(c => c.participants.includes(req.userId))
    .map(c => ({
      ...c,
      participants: global.db.users
        .filter(u => c.participants.includes(u._id))
        .map(u => ({ _id: u._id, username: u.username, profilePicture: u.profilePicture }))
    }));
  res.json(conversations);
});

module.exports = router;
