const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    let user = global.db.users.find(u => u.username === username);
    if (user) return res.status(400).json({ message: 'Användaren finns redan' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      _id: Math.random().toString(36).substr(2, 9),
      username,
      password: hashedPassword,
      profilePicture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      friends: [],
      friendRequests: [],
      sentRequests: [],
      notifications: []
    };

    global.db.users.push(newUser);

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.status(201).json({
      user: { _id: newUser._id, username: newUser.username, profilePicture: newUser.profilePicture }
    });
  } catch (error) {
    res.status(500).json({ message: 'Serverfel' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = global.db.users.find(u => u.username === username);
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Felaktiga uppgifter' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({
      user: { _id: user._id, username: user.username, profilePicture: user.profilePicture }
    });
  } catch (error) {
    res.status(500).json({ message: 'Serverfel' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Utloggad' });
});

// Get Current User
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Ingen token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = global.db.users.find(u => u._id === decoded.id);
    
    if (!user) return res.status(404).json({ message: 'Användaren hittades inte' });
    
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(401).json({ message: 'Ogiltig token' });
  }
});

module.exports = router;
