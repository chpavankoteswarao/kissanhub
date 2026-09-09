const { Server } = require('socket.io');
const { runQuery, getRow, getAll } = require('../database/database');

/**
 * In-memory map of active user connections:
 * Key: `${userType}_${userId}` (e.g. "farmer_1", "buyer_2")
 * Value: Set of socket IDs
 */
const userSockets = new Map();
// Active ongoing calls tracked by callId
const activeCalls = new Map();

let ioInstance = null;

const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim()
    .slice(0, 3000);
};

const isUserOnline = (userType, userId) => {
  const key = `${userType}_${userId}`;
  const sockets = userSockets.get(key);
  return !!(sockets && sockets.size > 0);
};

const getUserSocketIds = (userType, userId) => {
  const key = `${userType}_${userId}`;
  return Array.from(userSockets.get(key) || []);
};

const initSocketService = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    pingTimeout: 30000,
    pingInterval: 25000
  });

  ioInstance = io;

  io.use(async (socket, next) => {
    try {
      const auth = socket.handshake.auth || {};
      const userId = parseInt(auth.userId, 10);
      const userType = auth.userType; // 'farmer' or 'buyer'

      if (!userId || !userType || !['farmer', 'buyer'].includes(userType)) {
        return next(new Error('Authentication required: valid userId and userType are mandatory.'));
      }

      // Verify user existence in database
      const table = userType === 'farmer' ? 'farmers' : 'buyers';
      const user = await getRow(`SELECT id, full_name FROM ${table} WHERE id = ?`, [userId]);
      if (!user) {
        return next(new Error(`User not found in ${table} table.`));
      }

      socket.userData = {
        userId,
        userType,
        name: user.full_name,
        userKey: `${userType}_${userId}`
      };

      next();
    } catch (err) {
      console.error('[Socket Auth Error]:', err.message);
      next(new Error('Authentication failed.'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, userType, name, userKey } = socket.userData;

    // Register active socket
    if (!userSockets.has(userKey)) {
      userSockets.set(userKey, new Set());
    }
    userSockets.get(userKey).add(socket.id);

    // Broadcast online status to any connected peers
    io.emit('user_status_change', {
      userId,
      userType,
      isOnline: true
    });

    // ----------------------------------------------------
    // 1. Join Private Conversation Room
    // ----------------------------------------------------
    socket.on('join_conversation', async ({ conversationId }, callback) => {
      try {
        const convId = parseInt(conversationId, 10);
        if (!convId) {
          if (callback) callback({ success: false, message: 'Invalid conversation ID' });
          return;
        }

        // Verify that this user is a participant
        const conv = await getRow(
          'SELECT id, farmer_id, buyer_id FROM conversations WHERE id = ?',
          [convId]
        );

        if (!conv) {
          if (callback) callback({ success: false, message: 'Conversation not found' });
          return;
        }

        const isParticipant =
          (userType === 'farmer' && conv.farmer_id === userId) ||
          (userType === 'buyer' && conv.buyer_id === userId);

        if (!isParticipant) {
          if (callback) callback({ success: false, message: 'Unauthorized conversation access' });
          return;
        }

        const roomName = `conv_${convId}`;
        socket.join(roomName);

        // Determine partner info
        const partnerType = userType === 'farmer' ? 'buyer' : 'farmer';
        const partnerId = userType === 'farmer' ? conv.buyer_id : conv.farmer_id;
        const partnerOnline = isUserOnline(partnerType, partnerId);

        if (callback) {
          callback({
            success: true,
            conversationId: convId,
            partnerOnline
          });
        }
      } catch (err) {
        console.error('[join_conversation error]:', err.message);
        if (callback) callback({ success: false, message: 'Error joining conversation' });
      }
    });

    // ----------------------------------------------------
    // 2. Real-Time Chat Messaging
    // ----------------------------------------------------
    socket.on('send_message', async ({ conversationId, message }, callback) => {
      try {
        const convId = parseInt(conversationId, 10);
        const cleanMessage = sanitizeText(message);

        if (!convId || !cleanMessage) {
          if (callback) callback({ success: false, message: 'Message content cannot be empty' });
          return;
        }

        // Verify participant
        const conv = await getRow(
          'SELECT id, farmer_id, buyer_id FROM conversations WHERE id = ?',
          [convId]
        );

        if (!conv) {
          if (callback) callback({ success: false, message: 'Conversation not found' });
          return;
        }

        const isParticipant =
          (userType === 'farmer' && conv.farmer_id === userId) ||
          (userType === 'buyer' && conv.buyer_id === userId);

        if (!isParticipant) {
          if (callback) callback({ success: false, message: 'Unauthorized conversation access' });
          return;
        }

        const partnerType = userType === 'farmer' ? 'buyer' : 'farmer';
        const partnerId = userType === 'farmer' ? conv.buyer_id : conv.farmer_id;

        // Persist message to database
        const result = await runQuery(
          `INSERT INTO messages (conversation_id, sender_id, sender_type, message, is_read)
           VALUES (?, ?, ?, ?, 0)`,
          [convId, userId, userType, cleanMessage]
        );

        // Update conversation timestamp
        await runQuery(
          'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [convId]
        );

        const savedMessage = {
          id: result.lastID,
          conversation_id: convId,
          sender_id: userId,
          sender_type: userType,
          sender_name: name,
          message: cleanMessage,
          is_read: 0,
          created_at: new Date().toISOString()
        };

        // Broadcast to conversation room
        const roomName = `conv_${convId}`;
        io.to(roomName).emit('new_message', savedMessage);

        // Direct notification to partner sockets if they are not in the active room
        const partnerSocketIds = getUserSocketIds(partnerType, partnerId);
        partnerSocketIds.forEach((sId) => {
          io.to(sId).emit('incoming_message_notification', savedMessage);
        });

        if (callback) callback({ success: true, message: savedMessage });
      } catch (err) {
        console.error('[send_message error]:', err.message);
        if (callback) callback({ success: false, message: 'Failed to send message' });
      }
    });

    // ----------------------------------------------------
    // 3. Mark Messages Read
    // ----------------------------------------------------
    socket.on('mark_read', async ({ conversationId }) => {
      try {
        const convId = parseInt(conversationId, 10);
        if (!convId) return;

        await runQuery(
          `UPDATE messages 
           SET is_read = 1 
           WHERE conversation_id = ? AND (sender_id != ? OR sender_type != ?) AND is_read = 0`,
          [convId, userId, userType]
        );

        io.to(`conv_${convId}`).emit('messages_read', {
          conversationId: convId,
          readerId: userId,
          readerType: userType
        });
      } catch (err) {
        console.error('[mark_read error]:', err.message);
      }
    });

    // ----------------------------------------------------
    // 4. Typing Indicator
    // ----------------------------------------------------
    socket.on('typing', ({ conversationId, isTyping }) => {
      const convId = parseInt(conversationId, 10);
      if (!convId) return;

      socket.to(`conv_${convId}`).emit('partner_typing', {
        conversationId: convId,
        senderId: userId,
        senderType: userType,
        isTyping: !!isTyping
      });
    });

    // ----------------------------------------------------
    // 5. WebRTC Calling Signaling
    // ----------------------------------------------------
    // Initiate Call (Caller -> Server -> Receiver)
    socket.on('call_user', async ({ conversationId, receiverId, receiverType, callType, offer }, callback) => {
      try {
        const rId = parseInt(receiverId, 10);
        const convId = conversationId ? parseInt(conversationId, 10) : null;

        if (!rId || !receiverType || !['voice', 'video'].includes(callType)) {
          if (callback) callback({ success: false, message: 'Invalid call initiation parameters.' });
          return;
        }

        // Insert call record
        const callResult = await runQuery(
          `INSERT INTO calls (conversation_id, caller_id, caller_type, receiver_id, receiver_type, call_type, status, started_at)
           VALUES (?, ?, ?, ?, ?, ?, 'initiated', CURRENT_TIMESTAMP)`,
          [convId, userId, userType, rId, receiverType, callType]
        );

        const callId = callResult.lastID;
        const receiverSockets = getUserSocketIds(receiverType, rId);

        if (receiverSockets.length === 0) {
          // Receiver is offline
          await runQuery(`UPDATE calls SET status = 'missed', ended_at = CURRENT_TIMESTAMP WHERE id = ?`, [callId]);
          if (callback) callback({ success: false, status: 'offline', message: 'User is currently offline.' });
          return;
        }

        activeCalls.set(callId, {
          callId,
          conversationId: convId,
          callerId: userId,
          callerType: userType,
          callerName: name,
          callerSocketId: socket.id,
          receiverId: rId,
          receiverType,
          callType,
          status: 'ringing',
          startedAt: Date.now()
        });

        // Notify caller that call has been initiated
        if (callback) callback({ success: true, callId, status: 'ringing' });

        // Ring receiver on all active sockets
        receiverSockets.forEach((sId) => {
          io.to(sId).emit('incoming_call', {
            callId,
            conversationId: convId,
            callerId: userId,
            callerType: userType,
            callerName: name,
            callType,
            offer
          });
        });
      } catch (err) {
        console.error('[call_user error]:', err.message);
        if (callback) callback({ success: false, message: 'Call setup failed.' });
      }
    });

    // Accept Call (Receiver -> Server -> Caller)
    socket.on('accept_call', async ({ callId, answer }) => {
      try {
        const cId = parseInt(callId, 10);
        const callInfo = activeCalls.get(cId);

        if (!callInfo) {
          socket.emit('call_error', { message: 'Call record expired or ended.' });
          return;
        }

        callInfo.status = 'connected';
        callInfo.connectedAt = Date.now();
        activeCalls.set(cId, callInfo);

        await runQuery(`UPDATE calls SET status = 'connected' WHERE id = ?`, [cId]);

        // Forward answer to caller's sockets
        const callerSockets = getUserSocketIds(callInfo.callerType, callInfo.callerId);
        callerSockets.forEach((sId) => {
          io.to(sId).emit('call_accepted', {
            callId: cId,
            answer,
            receiverName: name
          });
        });
      } catch (err) {
        console.error('[accept_call error]:', err.message);
      }
    });

    // Reject Call (Receiver -> Server -> Caller)
    socket.on('reject_call', async ({ callId, reason = 'Call declined' }) => {
      try {
        const cId = parseInt(callId, 10);
        const callInfo = activeCalls.get(cId);

        if (callInfo) {
          activeCalls.delete(cId);
          await runQuery(
            `UPDATE calls SET status = 'rejected', ended_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [cId]
          );

          const callerSockets = getUserSocketIds(callInfo.callerType, callInfo.callerId);
          callerSockets.forEach((sId) => {
            io.to(sId).emit('call_rejected', { callId: cId, reason });
          });
        }
      } catch (err) {
        console.error('[reject_call error]:', err.message);
      }
    });

    // WebRTC ICE Candidate Relay
    socket.on('ice_candidate', ({ targetUserId, targetUserType, candidate }) => {
      if (!targetUserId || !targetUserType || !candidate) return;

      const targetSockets = getUserSocketIds(targetUserType, parseInt(targetUserId, 10));
      targetSockets.forEach((sId) => {
        io.to(sId).emit('ice_candidate', {
          fromUserId: userId,
          fromUserType: userType,
          candidate
        });
      });
    });

    // End Call (Either participant)
    socket.on('end_call', async ({ callId }) => {
      try {
        const cId = parseInt(callId, 10);
        const callInfo = activeCalls.get(cId);

        if (callInfo) {
          const duration = callInfo.connectedAt
            ? Math.round((Date.now() - callInfo.connectedAt) / 1000)
            : 0;

          activeCalls.delete(cId);

          await runQuery(
            `UPDATE calls 
             SET status = 'ended', ended_at = CURRENT_TIMESTAMP, duration_seconds = ? 
             WHERE id = ?`,
            [duration, cId]
          );

          // Notify both caller and receiver
          const allPeers = [
            ...getUserSocketIds(callInfo.callerType, callInfo.callerId),
            ...getUserSocketIds(callInfo.receiverType, callInfo.receiverId)
          ];

          allPeers.forEach((sId) => {
            io.to(sId).emit('call_ended', { callId: cId, duration });
          });
        }
      } catch (err) {
        console.error('[end_call error]:', err.message);
      }
    });

    // ----------------------------------------------------
    // 6. Disconnect & Cleanup
    // ----------------------------------------------------
    socket.on('disconnect', () => {
      const sockets = userSockets.get(userKey);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userKey);
          // Broadcast offline status
          io.emit('user_status_change', {
            userId,
            userType,
            isOnline: false
          });
        }
      }

      // Check if user was in any active calls
      for (const [callId, callInfo] of activeCalls.entries()) {
        const isCaller = callInfo.callerId === userId && callInfo.callerType === userType;
        const isReceiver = callInfo.receiverId === userId && callInfo.receiverType === userType;

        if (isCaller || isReceiver) {
          activeCalls.delete(callId);
          runQuery(`UPDATE calls SET status = 'ended', ended_at = CURRENT_TIMESTAMP WHERE id = ?`, [callId]).catch(() => {});

          const otherType = isCaller ? callInfo.receiverType : callInfo.callerType;
          const otherId = isCaller ? callInfo.receiverId : callInfo.callerId;
          const otherSockets = getUserSocketIds(otherType, otherId);

          otherSockets.forEach((sId) => {
            io.to(sId).emit('call_ended', { callId, reason: 'Partner disconnected' });
          });
        }
      }
    });
  });

  console.log('⚡ Socket.IO initialized for real-time messaging & WebRTC signaling.');
  return io;
};

const getIo = () => ioInstance;

module.exports = {
  initSocketService,
  getIo,
  isUserOnline,
  getUserSocketIds
};
