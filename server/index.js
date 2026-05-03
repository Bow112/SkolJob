require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ["http://localhost:5173", "http://127.0.0.1:5173"], methods: ["GET", "POST"], credentials: true }
});

app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"], credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

global.db = { users: [], messages: [], conversations: [] };

io.on('connection', (socket) => {
  socket.on('join_room', (roomId) => { socket.join(roomId); });

  socket.on('send_message', (data) => {
    const { senderId, content, roomId, isGlobal, attachment, attachmentType } = data;
    const sender = global.db.users.find(u => u._id === senderId);
    const newMessage = {
      _id: Math.random().toString(36).substr(2, 9),
      sender: { _id: sender?._id, username: sender?.username, profilePicture: sender?.profilePicture },
      content, attachment, attachmentType: attachmentType || null,
      room: roomId, isGlobal: isGlobal || false, createdAt: new Date()
    };
    global.db.messages.push(newMessage);
    io.to(roomId).emit('receive_message', newMessage);
  });

  // --- Edit message ---
  socket.on('edit_message', ({ messageId, content, roomId }) => {
    const msg = global.db.messages.find(m => m._id === messageId);
    if (msg) {
      msg.content = content;
      msg.editedAt = new Date();
      io.to(roomId).emit('message_edited', { messageId, content, editedAt: msg.editedAt });
    }
  });

  // --- Delete message ---
  socket.on('delete_message', ({ messageId, roomId }) => {
    const msg = global.db.messages.find(m => m._id === messageId);
    if (msg) {
      msg.deleted = true;
      msg.content = '';
      msg.attachment = null;
      io.to(roomId).emit('message_deleted', { messageId });
    }
  });

  // --- React to message ---
  socket.on('react_message', ({ messageId, roomId, userId, emoji }) => {
    const msg = global.db.messages.find(m => m._id === messageId);
    if (!msg) return;
    if (!msg.reactions) msg.reactions = [];
    const existing = msg.reactions.find(r => r.emoji === emoji);
    if (existing) {
      if (existing.users.includes(userId)) {
        existing.users = existing.users.filter(u => u !== userId);
        if (existing.users.length === 0) msg.reactions = msg.reactions.filter(r => r.emoji !== emoji);
      } else {
        existing.users.push(userId);
      }
    } else {
      msg.reactions.push({ emoji, users: [userId] });
    }
    io.to(roomId).emit('message_reacted', { messageId, reactions: msg.reactions });
  });

  // --- Last active tracking ---
  socket.on('register_user', (userId) => {
    socket.join(userId);
    const u = global.db.users.find(u => u._id === userId);
    if (u) u.lastActive = new Date();
  });

  socket.on('ping_active', (userId) => {
    const u = global.db.users.find(u => u._id === userId);
    if (u) u.lastActive = new Date();
  });

});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/conversations', require('./routes/conversations'));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server körs på port ${PORT}`));
