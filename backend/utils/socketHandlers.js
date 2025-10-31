const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

module.exports = (io) => {
  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) return next(new Error('User not found'));

      socket.userId = decoded.userId;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User ${socket.user.username} connected`);

    // Update user online status
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      socketId: socket.id
    });

    // Join user's personal room
    socket.join(socket.userId.toString());

    // Emit online users update
    const onlineUsers = await User.find({ isOnline: true })
      .select('username avatar runegold.balance');
    io.emit('onlineUsers', onlineUsers);

    // Handle P2P messaging
    socket.on('sendMessage', async (data) => {
      try {
        const { receiverId, content } = data;
        const conversationId = Message.generateConversationId(socket.userId, receiverId);

        const message = await Message.create({
          sender: socket.userId,
          receiver: receiverId,
          content,
          conversationId
        });

        // Send to receiver if online
        io.to(receiverId.toString()).emit('newMessage', {
          message: await message.populate('sender', 'username avatar')
        });

        socket.emit('messageSent', { message });
      } catch (error) {
        socket.emit('messageError', { error: error.message });
      }
    });

    // Handle typing indicators
    socket.on('typing', ({ receiverId, isTyping }) => {
      io.to(receiverId.toString()).emit('userTyping', {
        userId: socket.userId,
        isTyping
      });
    });

    // Handle video room joining
    socket.on('joinVideoRoom', (videoId) => {
      socket.join(`video:${videoId}`);
    });

    // Handle real-time video updates
    socket.on('videoUpdate', ({ videoId, type, data }) => {
      io.to(`video:${videoId}`).emit('videoUpdated', { type, data });
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User ${socket.user.username} disconnected`);

      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date(),
        socketId: null
      });

      // Emit updated online users
      const onlineUsers = await User.find({ isOnline: true })
        .select('username avatar runegold.balance');
      io.emit('onlineUsers', onlineUsers);
    });
  });
};