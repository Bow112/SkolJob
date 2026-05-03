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

router.get('/search', auth, async (req, res) => {
  const { query } = req.query;
  const users = global.db.users
    .filter(u => u._id !== req.userId && u.username.toLowerCase().includes(query.toLowerCase()))
    .map(u => ({ _id: u._id, username: u.username, profilePicture: u.profilePicture }));
  res.json(users);
});

router.post('/friend-request/:id', auth, async (req, res) => {
  const targetUser = global.db.users.find(u => u._id === req.params.id);
  const currentUser = global.db.users.find(u => u._id === req.userId);

  if (!targetUser) return res.status(404).json({ message: 'Hittade inte användaren' });
  if (targetUser.friendRequests.includes(req.userId)) return res.status(400).json({ message: 'Redan skickat' });

  targetUser.friendRequests.push(req.userId);
  currentUser.sentRequests.push(req.params.id);

  // Notify target user
  targetUser.notifications.push({
    id: Math.random().toString(36).substr(2, 9),
    type: 'friend_request',
    from: currentUser.username,
    createdAt: new Date()
  });

  res.json({ message: 'Vänförfrågan skickad' });
});

router.post('/accept-request/:id', auth, async (req, res) => {
  const currentUser = global.db.users.find(u => u._id === req.userId);
  const requester = global.db.users.find(u => u._id === req.params.id);

  if (!currentUser.friendRequests.includes(req.params.id)) return res.status(400).json({ message: 'Ingen förfrågan' });

  currentUser.friends.push(req.params.id);
  requester.friends.push(req.userId);
  currentUser.friendRequests = currentUser.friendRequests.filter(id => id !== req.params.id);
  requester.sentRequests = requester.sentRequests.filter(id => id !== req.userId);

  res.json({ message: 'Vänförfrågan accepterad' });
});

router.get('/social', auth, async (req, res) => {
  const user = global.db.users.find(u => u._id === req.userId);
  const friends = global.db.users.filter(u => user.friends.includes(u._id));
  const requests = global.db.users.filter(u => user.friendRequests.includes(u._id));
  res.json({ friends, requests, notifications: user.notifications });
});

router.post('/clear-notifications', auth, async (req, res) => {
  const user = global.db.users.find(u => u._id === req.userId);
  user.notifications = [];
  res.json({ message: 'Notiser rensade' });
});

router.post('/update-profile', auth, async (req, res) => {
  const user = global.db.users.find(u => u._id === req.userId);
  user.profilePicture = req.body.profilePicture;
  res.json(user);
});

module.exports = router;
