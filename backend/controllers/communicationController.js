const { runQuery, getRow, getAll } = require('../database/database');
const { isUserOnline, getIo } = require('../services/socketService');

/**
 * Validates authenticated user from request headers / query.
 * Expects `x-user-id` and `x-user-type` or Authorization Bearer token with id & type.
 */
const getAuthUser = async (req) => {
  const userId = parseInt(req.headers['x-user-id'] || req.query.user_id, 10);
  const userType = (req.headers['x-user-type'] || req.query.user_type || '').toLowerCase();

  if (!userId || !['farmer', 'buyer'].includes(userType)) {
    return null;
  }

  const table = userType === 'farmer' ? 'farmers' : 'buyers';
  const user = await getRow(`SELECT id, full_name, phone FROM ${table} WHERE id = ?`, [userId]);
  if (!user) return null;

  return {
    id: user.id,
    userType,
    name: user.full_name
  };
};

// 1. Get or Create 1-to-1 Conversation
const getOrCreateConversation = async (req, res) => {
  try {
    const authUser = await getAuthUser(req);
    const { farmer_id, buyer_id } = req.body;

    const fId = parseInt(farmer_id, 10);
    const bId = parseInt(buyer_id, 10);

    if (!fId || !bId) {
      return res.status(400).json({
        success: false,
        message: 'Both farmer_id and buyer_id are required.'
      });
    }

    // Security: Authenticated user must be either the farmer or the buyer
    if (authUser) {
      const isParticipant =
        (authUser.userType === 'farmer' && authUser.id === fId) ||
        (authUser.userType === 'buyer' && authUser.id === bId);

      if (!isParticipant) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You cannot create or access conversations on behalf of other users.'
        });
      }
    }

    // Verify both exist in DB
    const farmer = await getRow('SELECT id, full_name, state, district, mandal FROM farmers WHERE id = ?', [fId]);
    const buyer = await getRow('SELECT id, full_name, market_name, state, district, mandal FROM buyers WHERE id = ?', [bId]);

    if (!farmer || !buyer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer or Buyer account not found.'
      });
    }

    let conversation = await getRow(
      'SELECT id, farmer_id, buyer_id, created_at, updated_at FROM conversations WHERE farmer_id = ? AND buyer_id = ?',
      [fId, bId]
    );

    if (!conversation) {
      const ins = await runQuery(
        'INSERT INTO conversations (farmer_id, buyer_id) VALUES (?, ?)',
        [fId, bId]
      );
      conversation = {
        id: ins.lastID,
        farmer_id: fId,
        buyer_id: bId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    const currentViewerType = authUser ? authUser.userType : 'farmer';
    const partner =
      currentViewerType === 'farmer'
        ? {
            id: buyer.id,
            userType: 'buyer',
            name: buyer.full_name || buyer.market_name,
            market_name: buyer.market_name,
            location: `${buyer.mandal ? buyer.mandal + ', ' : ''}${buyer.district}, ${buyer.state}`,
            isOnline: isUserOnline('buyer', buyer.id)
          }
        : {
            id: farmer.id,
            userType: 'farmer',
            name: farmer.full_name,
            location: `${farmer.mandal ? farmer.mandal + ', ' : ''}${farmer.district}, ${farmer.state}`,
            isOnline: isUserOnline('farmer', farmer.id)
          };

    res.json({
      success: true,
      data: {
        ...conversation,
        partner
      }
    });
  } catch (error) {
    console.error('Error in getOrCreateConversation:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving conversation.' });
  }
};

// 2. Get All Conversations for Authenticated User
const getConversations = async (req, res) => {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const isFarmer = authUser.userType === 'farmer';
    const query = isFarmer
      ? `SELECT c.id, c.farmer_id, c.buyer_id, c.created_at, c.updated_at,
                b.full_name as partner_name, b.market_name as partner_market,
                b.district as partner_district, b.state as partner_state, b.mandal as partner_mandal
         FROM conversations c
         JOIN buyers b ON c.buyer_id = b.id
         WHERE c.farmer_id = ?
         ORDER BY c.updated_at DESC`
      : `SELECT c.id, c.farmer_id, c.buyer_id, c.created_at, c.updated_at,
                f.full_name as partner_name, '' as partner_market,
                f.district as partner_district, f.state as partner_state, f.mandal as partner_mandal
         FROM conversations c
         JOIN farmers f ON c.farmer_id = f.id
         WHERE c.buyer_id = ?
         ORDER BY c.updated_at DESC`;

    const rows = await getAll(query, [authUser.id]);

    const conversations = await Promise.all(
      rows.map(async (row) => {
        const partnerType = isFarmer ? 'buyer' : 'farmer';
        const partnerId = isFarmer ? row.buyer_id : row.farmer_id;

        // Last message
        const lastMsg = await getRow(
          `SELECT message, sender_type, created_at, is_read
           FROM messages 
           WHERE conversation_id = ? 
           ORDER BY created_at DESC LIMIT 1`,
          [row.id]
        );

        // Unread messages count for this user
        const unreadRow = await getRow(
          `SELECT COUNT(*) as count 
           FROM messages 
           WHERE conversation_id = ? AND is_read = 0 AND (sender_id != ? OR sender_type != ?)`,
          [row.id, authUser.id, authUser.userType]
        );

        return {
          id: row.id,
          farmer_id: row.farmer_id,
          buyer_id: row.buyer_id,
          updated_at: row.updated_at,
          partner: {
            id: partnerId,
            userType: partnerType,
            name: row.partner_name || row.partner_market,
            market_name: row.partner_market,
            location: `${row.partner_mandal ? row.partner_mandal + ', ' : ''}${row.partner_district}, ${row.partner_state}`,
            isOnline: isUserOnline(partnerType, partnerId)
          },
          last_message: lastMsg ? lastMsg.message : '',
          last_message_time: lastMsg ? lastMsg.created_at : row.updated_at,
          last_message_sender: lastMsg ? lastMsg.sender_type : '',
          unread_count: unreadRow ? unreadRow.count : 0
        };
      })
    );

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Error in getConversations:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving conversations.' });
  }
};

// 3. Get Messages for a Specific Conversation
const getMessages = async (req, res) => {
  try {
    const authUser = await getAuthUser(req);
    const { id } = req.params;
    const convId = parseInt(id, 10);

    if (!convId) {
      return res.status(400).json({ success: false, message: 'Invalid conversation ID.' });
    }

    const conversation = await getRow(
      'SELECT id, farmer_id, buyer_id FROM conversations WHERE id = ?',
      [convId]
    );

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    // Security validation: Only the two participants can access messages
    if (authUser) {
      const isParticipant =
        (authUser.userType === 'farmer' && authUser.id === conversation.farmer_id) ||
        (authUser.userType === 'buyer' && authUser.id === conversation.buyer_id);

      if (!isParticipant) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not a participant in this conversation.'
        });
      }
    }

    const messages = await getAll(
      `SELECT id, conversation_id, sender_id, sender_type, message, is_read, created_at
       FROM messages
       WHERE conversation_id = ?
       ORDER BY created_at ASC`,
      [convId]
    );

    // Fetch partner metadata
    let partner = null;
    if (authUser) {
      if (authUser.userType === 'farmer') {
        const buyer = await getRow('SELECT id, full_name, market_name, state, district FROM buyers WHERE id = ?', [conversation.buyer_id]);
        if (buyer) {
          partner = {
            id: buyer.id,
            userType: 'buyer',
            name: buyer.full_name || buyer.market_name,
            market_name: buyer.market_name,
            location: `${buyer.district}, ${buyer.state}`,
            isOnline: isUserOnline('buyer', buyer.id)
          };
        }
      } else {
        const farmer = await getRow('SELECT id, full_name, state, district FROM farmers WHERE id = ?', [conversation.farmer_id]);
        if (farmer) {
          partner = {
            id: farmer.id,
            userType: 'farmer',
            name: farmer.full_name,
            location: `${farmer.district}, ${farmer.state}`,
            isOnline: isUserOnline('farmer', farmer.id)
          };
        }
      }
    }

    res.json({
      success: true,
      data: {
        conversation_id: convId,
        partner,
        messages
      }
    });
  } catch (error) {
    console.error('Error in getMessages:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving messages.' });
  }
};

// 4. Send Message via REST (Fallback)
const sendMessage = async (req, res) => {
  try {
    const authUser = await getAuthUser(req);
    const { id } = req.params;
    const { message } = req.body;
    const convId = parseInt(id, 10);

    if (!convId || !message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Conversation ID and message content are required.' });
    }

    const conversation = await getRow(
      'SELECT id, farmer_id, buyer_id FROM conversations WHERE id = ?',
      [convId]
    );

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    if (!authUser) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const isParticipant =
      (authUser.userType === 'farmer' && authUser.id === conversation.farmer_id) ||
      (authUser.userType === 'buyer' && authUser.id === conversation.buyer_id);

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const cleanMsg = message
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .trim()
      .slice(0, 3000);

    const result = await runQuery(
      `INSERT INTO messages (conversation_id, sender_id, sender_type, message, is_read)
       VALUES (?, ?, ?, ?, 0)`,
      [convId, authUser.id, authUser.userType, cleanMsg]
    );

    await runQuery('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [convId]);

    const saved = {
      id: result.lastID,
      conversation_id: convId,
      sender_id: authUser.id,
      sender_type: authUser.userType,
      message: cleanMsg,
      is_read: 0,
      created_at: new Date().toISOString()
    };

    // Emit via Socket.IO if instance is running
    const io = getIo();
    if (io) {
      io.to(`conv_${convId}`).emit('new_message', saved);
    }

    res.status(201).json({
      success: true,
      data: saved
    });
  } catch (error) {
    console.error('Error in sendMessage:', error.message);
    res.status(500).json({ success: false, message: 'Server error sending message.' });
  }
};

// 5. Mark Messages Read
const markRead = async (req, res) => {
  try {
    const authUser = await getAuthUser(req);
    const { id } = req.params;
    const convId = parseInt(id, 10);

    if (!convId || !authUser) {
      return res.status(400).json({ success: false, message: 'Invalid request.' });
    }

    await runQuery(
      `UPDATE messages 
       SET is_read = 1 
       WHERE conversation_id = ? AND (sender_id != ? OR sender_type != ?) AND is_read = 0`,
      [convId, authUser.id, authUser.userType]
    );

    const io = getIo();
    if (io) {
      io.to(`conv_${convId}`).emit('messages_read', {
        conversationId: convId,
        readerId: authUser.id,
        readerType: authUser.userType
      });
    }

    res.json({ success: true, message: 'Messages marked as read.' });
  } catch (error) {
    console.error('Error in markRead:', error.message);
    res.status(500).json({ success: false, message: 'Server error marking messages read.' });
  }
};

// 6. WebRTC STUN/TURN Configuration (Secrets protected on backend)
const getWebRtcConfig = (req, res) => {
  const stunUrl = process.env.WEBRTC_STUN_URL || 'stun:stun.l.google.com:19302';
  const iceServers = [{ urls: stunUrl }];

  if (process.env.TURN_SERVER_URL && process.env.TURN_SERVER_URL.trim()) {
    iceServers.push({
      urls: process.env.TURN_SERVER_URL.trim(),
      username: process.env.TURN_USERNAME || '',
      credential: process.env.TURN_PASSWORD || ''
    });
  }

  res.json({
    success: true,
    data: { iceServers }
  });
};

// 7. Call History
const getCallHistory = async (req, res) => {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const calls = await getAll(
      `SELECT id, conversation_id, caller_id, caller_type, receiver_id, receiver_type,
              call_type, status, started_at, ended_at, duration_seconds
       FROM calls
       WHERE (caller_id = ? AND caller_type = ?) OR (receiver_id = ? AND receiver_type = ?)
       ORDER BY started_at DESC LIMIT 30`,
      [authUser.id, authUser.userType, authUser.id, authUser.userType]
    );

    res.json({
      success: true,
      data: calls
    });
  } catch (error) {
    console.error('Error in getCallHistory:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving call history.' });
  }
};

module.exports = {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  markRead,
  getWebRtcConfig,
  getCallHistory
};
