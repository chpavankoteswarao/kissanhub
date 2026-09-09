/**
 * KISSAN-HUB — communication.js
 * 1-to-1 Private Chat, Real-Time Socket.IO Messaging,
 * WebRTC Voice Calling, and WebRTC Video Calling Engine.
 */

const CommState = {
  socket: null,
  activeConversationId: null,
  activePartner: null,
  conversations: [],
  peerConnection: null,
  localStream: null,
  remoteStream: null,
  activeCallId: null,
  activeCallType: 'voice', // 'voice' or 'video'
  callState: 'idle', // 'idle' | 'calling' | 'ringing' | 'connected'
  callTimer: null,
  callSeconds: 0,
  isMuted: false,
  isVideoEnabled: true,
  ringtoneOsc: null,
  audioContext: null
};

// ==========================================
// 1. Audio Notification & Ringtone Generator
// ==========================================
const getAudioContext = () => {
  if (!CommState.audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      CommState.audioContext = new AudioCtx();
    }
  }
  if (CommState.audioContext && CommState.audioContext.state === 'suspended') {
    CommState.audioContext.resume().catch(() => {});
  }
  return CommState.audioContext;
};

const playChimeTone = (freq1 = 520, freq2 = 660, duration = 0.3) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq1, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq2, ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
};

let ringInterval = null;
const startRingtone = (isOutgoing = false) => {
  stopRingtone();
  const ring = () => {
    if (isOutgoing) {
      playChimeTone(440, 480, 0.4);
    } else {
      playChimeTone(600, 800, 0.25);
      setTimeout(() => playChimeTone(800, 1000, 0.25), 300);
    }
  };
  ring();
  ringInterval = setInterval(ring, isOutgoing ? 3000 : 2200);
};

const stopRingtone = () => {
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
};

// ==========================================
// Device & Mobile Push Notification System
// ==========================================
const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    try {
      await Notification.requestPermission();
    } catch (e) {
      console.warn('Notification permission error:', e);
    }
  }
};

const triggerDeviceNotification = ({ title, body, icon, vibrate, onClick }) => {
  // 1. Mobile Vibration Haptics
  if (navigator.vibrate && vibrate) {
    try {
      navigator.vibrate(vibrate);
    } catch (e) {
      console.warn('Vibration API error:', e);
    }
  }

  // 2. System / Browser Desktop & Mobile Push Notification
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: vibrate || [250, 100, 250],
        tag: 'kissan_notif_' + Date.now(),
        renotify: true
      });
      if (typeof onClick === 'function') {
        notif.onclick = () => {
          window.focus();
          onClick();
          notif.close();
        };
      }
    } catch (e) {
      console.warn('Notification delivery error:', e);
    }
  }
};

// ==========================================
// 2. Socket.IO Connection & Event Handlers
// ==========================================
const initCommunicationSocket = () => {
  requestNotificationPermission();

  const session = getSession();
  if (!session || !session.id || !session.userType) {
    if (CommState.socket) {
      CommState.socket.disconnect();
      CommState.socket = null;
    }
    return;
  }

  if (typeof io === 'undefined') {
    console.warn('[Comm] Socket.IO client library not loaded yet.');
    return;
  }

  // Already connected for this user
  if (CommState.socket && CommState.socket.connected) {
    return;
  }

  const socket = io({
    auth: {
      userId: session.id,
      userType: session.userType,
      name: session.name || session.full_name
    }
  });

  CommState.socket = socket;

  socket.on('connect', () => {
    console.log(`[Comm] Connected to real-time messaging gateway as ${session.userType} #${session.id}`);
    updateCommOnlineBadges();
  });

  socket.on('connect_error', (err) => {
    console.warn('[Comm Socket Connect Error]:', err.message);
  });

  // Real-Time Incoming Message
  socket.on('new_message', (msg) => {
    playChimeTone(700, 900, 0.15);
    if (CommState.activeConversationId === msg.conversation_id) {
      appendChatMessage(msg);
      // Automatically acknowledge read
      socket.emit('mark_read', { conversationId: msg.conversation_id });
    } else {
      updateUnreadBadge(msg.conversation_id);
    }
    refreshConversationsList();
  });

  socket.on('incoming_message_notification', (msg) => {
    if (CommState.activeConversationId !== msg.conversation_id) {
      playChimeTone(580, 850, 0.2);
      showMessage(`💬 New message from ${msg.sender_name || 'Partner'}: "${msg.message.slice(0, 45)}"`, 'info');
      refreshConversationsList();
      triggerDeviceNotification({
        title: `💬 New message from ${msg.sender_name || 'Partner'}`,
        body: msg.message ? msg.message.slice(0, 100) : 'New message received on KISSAN-HUB.',
        vibrate: [250, 100, 250],
        onClick: () => {
          window.focus();
          const session = getSession();
          const prefix = session && session.userType === 'farmer' ? 'farmer' : 'buyer';
          if (window.openChatById) window.openChatById(msg.conversation_id, prefix);
        }
      });
    }
  });

  socket.on('messages_read', ({ conversationId }) => {
    if (CommState.activeConversationId === conversationId) {
      document.querySelectorAll('.msg-check').forEach(el => {
        el.textContent = '✓✓';
        el.style.color = '#10b981';
      });
    }
  });

  socket.on('partner_typing', ({ conversationId, isTyping }) => {
    if (CommState.activeConversationId === conversationId) {
      const indicator = getElement('chatTypingIndicator');
      if (indicator) {
        if (isTyping) {
          indicator.classList.remove('hidden');
        } else {
          indicator.classList.add('hidden');
        }
      }
    }
  });

  socket.on('user_status_change', ({ userId, userType, isOnline }) => {
    if (CommState.activePartner && CommState.activePartner.id === userId && CommState.activePartner.userType === userType) {
      const dot = getElement('chatPartnerStatusDot');
      const text = getElement('chatPartnerStatusText');
      if (dot) dot.className = `status-dot ${isOnline ? 'online' : 'offline'}`;
      if (text) text.textContent = isOnline ? 'Online' : 'Offline';
    }
    // Update in conversations list
    const el = document.querySelector(`.conv-user-${userType}-${userId}`);
    if (el) {
      el.className = `status-dot ${isOnline ? 'online' : 'offline'} conv-user-${userType}-${userId}`;
    }
  });

  // ------------------------------------------
  // WebRTC Incoming Call Events
  // ------------------------------------------
  socket.on('incoming_call', ({ callId, conversationId, callerId, callerType, callerName, callType, offer }) => {
    handleIncomingCallPrompt({
      callId,
      conversationId,
      callerId,
      callerType,
      callerName,
      callType,
      offer
    });
  });

  socket.on('call_accepted', async ({ callId, answer }) => {
    stopRingtone();
    if (CommState.peerConnection && answer) {
      try {
        await CommState.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        setCallConnected();
      } catch (e) {
        console.error('[WebRTC Answer Error]:', e);
      }
    }
  });

  socket.on('call_rejected', ({ reason }) => {
    stopRingtone();
    cleanupCallMedia();
    showMessage(`Call declined: ${reason || 'User is unavailable.'}`, 'warning');
    closeCallScreen();
  });

  socket.on('ice_candidate', async ({ candidate }) => {
    if (CommState.peerConnection && candidate) {
      try {
        await CommState.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('[Add ICE Candidate Error]:', e);
      }
    }
  });

  socket.on('call_ended', ({ duration, reason }) => {
    stopRingtone();
    cleanupCallMedia();
    closeCallScreen();
    const durMsg = duration ? ` (Duration: ${formatDuration(duration)})` : '';
    showMessage(`Call ended${durMsg}.`, 'info');
  });
};

// ==========================================
// 3. WebRTC Call Setup & Peer Connection
// ==========================================
const getIceServers = async () => {
  try {
    const res = await apiRequest('/communication/webrtc-config');
    if (res.ok && res.data && res.data.iceServers) {
      return res.data.iceServers;
    }
  } catch (e) {}
  return [{ urls: 'stun:stun.l.google.com:19302' }];
};

const startOutgoingCall = async ({ partnerId, partnerType, partnerName, conversationId, callType = 'voice' }) => {
  const session = getSession();
  if (!session) {
    showMessage('Please login to place calls.', 'warning');
    return;
  }

  if (!CommState.socket || !CommState.socket.connected) {
    initCommunicationSocket();
  }

  CommState.activeCallType = callType;
  CommState.activePartner = { id: partnerId, userType: partnerType, name: partnerName };
  CommState.callState = 'calling';

  openCallScreen({
    partnerName,
    callType,
    statusText: 'Calling...'
  });
  startRingtone(true);

  try {
    const iceServers = await getIceServers();
    const pc = new RTCPeerConnection({ iceServers });
    CommState.peerConnection = pc;

    // Get user media
    const constraints = {
      audio: true,
      video: callType === 'video' ? { width: { ideal: 640 }, height: { ideal: 480 } } : false
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    CommState.localStream = stream;

    const localVideo = getElement('callLocalVideo');
    if (localVideo) {
      localVideo.srcObject = stream;
      localVideo.classList.toggle('hidden', callType !== 'video');
    }

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    // Handle incoming remote stream
    pc.ontrack = (event) => {
      const remoteVideo = getElement('callRemoteVideo');
      const remoteAudio = getElement('callRemoteAudio');
      if (remoteVideo && callType === 'video') {
        remoteVideo.srcObject = event.streams[0];
        remoteVideo.classList.remove('hidden');
      } else if (remoteAudio) {
        remoteAudio.srcObject = event.streams[0];
      }
    };

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate && CommState.socket) {
        CommState.socket.emit('ice_candidate', {
          targetUserId: partnerId,
          targetUserType: partnerType,
          candidate: event.candidate
        });
      }
    };

    // Create Offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Signal to server
    CommState.socket.emit(
      'call_user',
      {
        conversationId,
        receiverId: partnerId,
        receiverType: partnerType,
        callType,
        offer
      },
      (res) => {
        if (res && res.success) {
          CommState.activeCallId = res.callId;
          updateCallScreenStatus('Ringing...');
        } else {
          stopRingtone();
          cleanupCallMedia();
          closeCallScreen();
          showMessage(res?.message || 'Could not connect call. User may be offline.', 'warning');
        }
      }
    );
  } catch (err) {
    console.error('[Outgoing Call Error]:', err);
    stopRingtone();
    cleanupCallMedia();
    closeCallScreen();
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      showMessage('Microphone/Camera permission denied. Please allow device access.', 'error');
    } else {
      showMessage('Could not initiate call: ' + err.message, 'error');
    }
  }
};

const handleIncomingCallPrompt = ({ callId, conversationId, callerId, callerType, callerName, callType, offer }) => {
  CommState.activeCallId = callId;
  CommState.pendingOffer = offer;
  CommState.activeCallType = callType;
  CommState.activePartner = { id: callerId, userType: callerType, name: callerName, conversationId };

  startRingtone(false);

  const modal = getElement('incomingCallModal');
  const callerNameEl = getElement('incomingCallerName');
  const callTypeEl = getElement('incomingCallType');
  const callerTypeBadge = getElement('incomingCallerTypeBadge');

  if (callerNameEl) callerNameEl.textContent = callerName || (callerType === 'farmer' ? 'Farmer' : 'Buyer');
  if (callTypeEl) callTypeEl.textContent = callType === 'video' ? '📹 Incoming Video Call...' : '📞 Incoming Voice Call...';
  if (callerTypeBadge) {
    callerTypeBadge.textContent = callerType === 'farmer' ? '🌾 Verified Farmer' : '🏢 Verified Buyer';
  }

  triggerDeviceNotification({
    title: `📞 Incoming ${callType === 'video' ? 'Video' : 'Voice'} Call!`,
    body: `${callerName || 'Someone'} is calling you on KISSAN-HUB. Tap to answer.`,
    vibrate: [400, 200, 400, 200, 600],
    onClick: () => {
      window.focus();
      openModal('incomingCallModal');
    }
  });

  openModal('incomingCallModal');
};

window.acceptIncomingCall = async () => {
  stopRingtone();
  closeModal('incomingCallModal');

  const { callerName, callerId, callerType, conversationId } = CommState.activePartner || {};
  const callType = CommState.activeCallType;
  const offer = CommState.pendingOffer;

  openCallScreen({
    partnerName: callerName,
    callType,
    statusText: 'Connecting...'
  });

  try {
    const iceServers = await getIceServers();
    const pc = new RTCPeerConnection({ iceServers });
    CommState.peerConnection = pc;

    const constraints = {
      audio: true,
      video: callType === 'video' ? { width: { ideal: 640 }, height: { ideal: 480 } } : false
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    CommState.localStream = stream;

    const localVideo = getElement('callLocalVideo');
    if (localVideo) {
      localVideo.srcObject = stream;
      localVideo.classList.toggle('hidden', callType !== 'video');
    }

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      const remoteVideo = getElement('callRemoteVideo');
      const remoteAudio = getElement('callRemoteAudio');
      if (remoteVideo && callType === 'video') {
        remoteVideo.srcObject = event.streams[0];
        remoteVideo.classList.remove('hidden');
      } else if (remoteAudio) {
        remoteAudio.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && CommState.socket) {
        CommState.socket.emit('ice_candidate', {
          targetUserId: callerId,
          targetUserType: callerType,
          candidate: event.candidate
        });
      }
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    CommState.socket.emit('accept_call', {
      callId: CommState.activeCallId,
      answer
    });

    setCallConnected();
  } catch (err) {
    console.error('[Accept Call Error]:', err);
    cleanupCallMedia();
    closeCallScreen();
    showMessage('Error connecting call: ' + err.message, 'error');
  }
};

window.rejectIncomingCall = () => {
  stopRingtone();
  closeModal('incomingCallModal');

  if (CommState.socket && CommState.activeCallId) {
    CommState.socket.emit('reject_call', {
      callId: CommState.activeCallId,
      reason: 'Call declined by user'
    });
  }
  CommState.activeCallId = null;
  CommState.pendingOffer = null;
};

const setCallConnected = () => {
  CommState.callState = 'connected';
  CommState.callSeconds = 0;
  clearInterval(CommState.callTimer);

  updateCallScreenStatus('00:00');
  CommState.callTimer = setInterval(() => {
    CommState.callSeconds++;
    updateCallScreenStatus(formatDuration(CommState.callSeconds));
  }, 1000);

  const voiceWave = getElement('callVoiceWaveform');
  if (voiceWave) {
    voiceWave.classList.toggle('hidden', CommState.activeCallType === 'video');
  }
};

window.endCurrentCall = () => {
  stopRingtone();
  if (CommState.socket && CommState.activeCallId) {
    CommState.socket.emit('end_call', { callId: CommState.activeCallId });
  }
  cleanupCallMedia();
  closeCallScreen();
};

window.toggleMute = () => {
  if (!CommState.localStream) return;
  const audioTracks = CommState.localStream.getAudioTracks();
  if (audioTracks.length > 0) {
    CommState.isMuted = !CommState.isMuted;
    audioTracks[0].enabled = !CommState.isMuted;

    const muteBtn = getElement('btnCallMute');
    if (muteBtn) {
      muteBtn.classList.toggle('btn-active', CommState.isMuted);
      muteBtn.innerHTML = CommState.isMuted ? '🔇 Unmute' : '🎙️ Mute';
    }
  }
};

window.toggleCamera = () => {
  if (!CommState.localStream) return;
  const videoTracks = CommState.localStream.getVideoTracks();
  if (videoTracks.length > 0) {
    CommState.isVideoEnabled = !CommState.isVideoEnabled;
    videoTracks[0].enabled = CommState.isVideoEnabled;

    const camBtn = getElement('btnCallCamera');
    const localVid = getElement('callLocalVideo');
    if (camBtn) {
      camBtn.classList.toggle('btn-active', !CommState.isVideoEnabled);
      camBtn.innerHTML = CommState.isVideoEnabled ? '📹 Cam On' : '📷 Cam Off';
    }
    if (localVid) {
      localVid.style.opacity = CommState.isVideoEnabled ? '1' : '0.2';
    }
  }
};

const cleanupCallMedia = () => {
  clearInterval(CommState.callTimer);
  CommState.callTimer = null;
  CommState.callSeconds = 0;
  CommState.callState = 'idle';

  if (CommState.localStream) {
    CommState.localStream.getTracks().forEach(t => t.stop());
    CommState.localStream = null;
  }
  if (CommState.peerConnection) {
    CommState.peerConnection.close();
    CommState.peerConnection = null;
  }

  const localVideo = getElement('callLocalVideo');
  const remoteVideo = getElement('callRemoteVideo');
  if (localVideo) localVideo.srcObject = null;
  if (remoteVideo) remoteVideo.srcObject = null;

  CommState.isMuted = false;
  CommState.isVideoEnabled = true;

  const muteBtn = getElement('btnCallMute');
  const camBtn = getElement('btnCallCamera');
  if (muteBtn) {
    muteBtn.classList.remove('btn-active');
    muteBtn.innerHTML = '🎙️ Mute';
  }
  if (camBtn) {
    camBtn.classList.remove('btn-active');
    camBtn.innerHTML = '📹 Camera';
  }
};

const openCallScreen = ({ partnerName, callType, statusText }) => {
  const modal = getElement('activeCallModal');
  const nameEl = getElement('callPartnerName');
  const typeBadge = getElement('callTypeBadge');
  const statusEl = getElement('callDurationDisplay');
  const voiceWave = getElement('callVoiceWaveform');
  const camBtn = getElement('btnCallCamera');

  if (nameEl) nameEl.textContent = partnerName || 'Partner';
  if (typeBadge) typeBadge.textContent = callType === 'video' ? '📹 WebRTC Video Call' : '📞 WebRTC Voice Call';
  if (statusEl) statusEl.textContent = statusText || 'Connecting...';
  if (voiceWave) voiceWave.classList.toggle('hidden', callType === 'video');
  if (camBtn) camBtn.style.display = callType === 'video' ? 'inline-flex' : 'none';

  openModal('activeCallModal');
};

const updateCallScreenStatus = (text) => {
  const statusEl = getElement('callDurationDisplay');
  if (statusEl) statusEl.textContent = text;
};

const closeCallScreen = () => {
  closeModal('activeCallModal');
};

const formatDuration = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
};

// ==========================================
// 4. Conversation Thread & UI Management
// ==========================================
const loadConversations = async () => {
  const session = getSession();
  if (!session) return;

  const prefix = session.userType === 'farmer' ? 'farmer' : 'buyer';
  const listEl = getElement(`${prefix}ConversationsList`);
  if (!listEl) return;

  listEl.innerHTML = `<div class="loading-state" style="padding: 1.5rem; text-align: center;">Loading chats...</div>`;

  try {
    const res = await apiRequest('/communication/conversations', {
      headers: {
        'x-user-id': session.id,
        'x-user-type': session.userType
      }
    });

    if (res.ok && res.data) {
      CommState.conversations = res.data;
      renderConversationsList(res.data, listEl, prefix);
    } else {
      listEl.innerHTML = `
        <div class="empty-state-card" style="padding:2rem;">
          <div class="empty-icon">💬</div>
          <h4>No active conversations</h4>
          <p class="text-xs text-muted">Contact verified ${session.userType === 'farmer' ? 'buyers' : 'farmers'} to begin private messaging.</p>
        </div>
      `;
    }
  } catch (err) {
    console.error('Error loading conversations:', err);
  }
};

const renderConversationsList = (conversations, listEl, prefix) => {
  if (!conversations || conversations.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state-card" style="padding: 2rem;">
        <div class="empty-icon">💬</div>
        <h4>No conversations yet</h4>
        <p class="text-xs text-muted">When you connect with verified ${prefix === 'farmer' ? 'buyers' : 'farmers'}, your messages appear here.</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = conversations.map(c => {
    const isOnline = c.partner.isOnline;
    const unreadBadge = c.unread_count > 0 ? `<span class="unread-pill">${c.unread_count}</span>` : '';
    const lastTime = c.last_message_time ? formatRelativeTime(c.last_message_time) : '';
    const isActive = CommState.activeConversationId === c.id ? 'active' : '';

    return `
      <div class="conv-item ${isActive}" onclick="openChatById(${c.id}, '${prefix}')">
        <div class="conv-avatar-wrap">
          <div class="conv-avatar">${c.partner.userType === 'farmer' ? '🌾' : '🏢'}</div>
          <span class="status-dot ${isOnline ? 'online' : 'offline'} conv-user-${c.partner.userType}-${c.partner.id}"></span>
        </div>
        <div class="conv-info">
          <div class="conv-header-row">
            <span class="conv-name">${c.partner.name || c.partner.market_name}</span>
            <span class="conv-time">${lastTime}</span>
          </div>
          <div class="conv-preview-row">
            <span class="conv-snippet">${c.last_message ? escapeHtml(c.last_message) : '<i>Tap to start chatting...</i>'}</span>
            ${unreadBadge}
          </div>
        </div>
      </div>
    `;
  }).join('');
};

window.openChatById = async (conversationId, prefix = 'farmer') => {
  const session = getSession();
  if (!session) return;

  CommState.activeConversationId = conversationId;

  // Highlight active in list
  document.querySelectorAll('.conv-item').forEach(el => el.classList.remove('active'));

  const placeholder = getElement(`${prefix}ChatPlaceholder`);
  const activeChat = getElement(`${prefix}ChatActiveArea`);
  const chatMessages = getElement(`${prefix}ChatMessagesContainer`);

  if (placeholder) placeholder.classList.add('hidden');
  if (activeChat) activeChat.classList.remove('hidden');
  if (chatMessages) {
    chatMessages.innerHTML = `<div class="loading-state" style="padding:2rem; text-align:center;">Loading conversation...</div>`;
  }

  try {
    const res = await apiRequest(`/communication/conversations/${conversationId}/messages`, {
      headers: {
        'x-user-id': session.id,
        'x-user-type': session.userType
      }
    });

    if (res.ok && res.data) {
      const { partner, messages } = res.data;
      CommState.activePartner = partner;

      // Update Chat Header
      const headerName = getElement(`${prefix}ChatPartnerName`);
      const headerLoc = getElement(`${prefix}ChatPartnerLocation`);
      const statusDot = getElement(`${prefix}ChatPartnerStatusDot`);
      const statusText = getElement(`${prefix}ChatPartnerStatusText`);

      if (headerName) headerName.textContent = partner.name || partner.market_name || 'Verified Partner';
      if (headerLoc) headerLoc.textContent = partner.location ? `📍 ${partner.location}` : '';
      if (statusDot) statusDot.className = `status-dot ${partner.isOnline ? 'online' : 'offline'}`;
      if (statusText) statusText.textContent = partner.isOnline ? 'Online' : 'Offline';

      // Setup Call buttons in chat header
      const btnVoice = getElement(`${prefix}BtnVoiceCall`);
      const btnVideo = getElement(`${prefix}BtnVideoCall`);

      if (btnVoice) {
        btnVoice.onclick = () => {
          startOutgoingCall({
            partnerId: partner.id,
            partnerType: partner.userType,
            partnerName: partner.name,
            conversationId,
            callType: 'voice'
          });
        };
      }
      if (btnVideo) {
        btnVideo.onclick = () => {
          startOutgoingCall({
            partnerId: partner.id,
            partnerType: partner.userType,
            partnerName: partner.name,
            conversationId,
            callType: 'video'
          });
        };
      }

      // Render Messages
      renderMessagesList(messages, chatMessages, session);

      // Join socket room and acknowledge read
      if (CommState.socket && CommState.socket.connected) {
        CommState.socket.emit('join_conversation', { conversationId });
        CommState.socket.emit('mark_read', { conversationId });
      }

      refreshConversationsList();
    }
  } catch (err) {
    console.error('Error loading chat thread:', err);
  }
};

const renderMessagesList = (messages, container, session) => {
  if (!container) return;
  if (!messages || messages.length === 0) {
    container.innerHTML = `
      <div class="chat-thread-empty">
        <div style="font-size:2rem; margin-bottom:0.5rem;">🔒</div>
        <h4>End-to-End Secure Conversation</h4>
        <p class="text-xs text-muted">This private communication is strictly between verified KISSAN-HUB participants. Phone numbers remain completely hidden.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = messages.map(m => {
    const isMe = m.sender_id === session.id && m.sender_type === session.userType;
    const time = m.created_at ? formatTimeOfDay(m.created_at) : '';
    const readMark = isMe ? `<span class="msg-check" style="color:${m.is_read ? '#10b981' : '#94a3b8'}">${m.is_read ? '✓✓' : '✓'}</span>` : '';

    return `
      <div class="msg-bubble-wrap ${isMe ? 'msg-outgoing' : 'msg-incoming'}">
        <div class="msg-bubble">
          <div class="msg-text">${escapeHtml(m.message)}</div>
          <div class="msg-meta">
            <span class="msg-time">${time}</span>
            ${readMark}
          </div>
        </div>
      </div>
    `;
  }).join('');

  scrollToBottom(container);
};

const appendChatMessage = (msg) => {
  const session = getSession();
  const prefix = session?.userType === 'farmer' ? 'farmer' : 'buyer';
  const container = getElement(`${prefix}ChatMessagesContainer`);
  if (!container) return;

  const emptyPlaceholder = container.querySelector('.chat-thread-empty');
  if (emptyPlaceholder) emptyPlaceholder.remove();

  const isMe = session && msg.sender_id === session.id && msg.sender_type === session.userType;
  const time = msg.created_at ? formatTimeOfDay(msg.created_at) : '';
  const readMark = isMe ? `<span class="msg-check" style="color:#94a3b8">✓</span>` : '';

  const div = document.createElement('div');
  div.className = `msg-bubble-wrap ${isMe ? 'msg-outgoing' : 'msg-incoming'} animate-fade-in`;
  div.innerHTML = `
    <div class="msg-bubble">
      <div class="msg-text">${escapeHtml(msg.message)}</div>
      <div class="msg-meta">
        <span class="msg-time">${time}</span>
        ${readMark}
      </div>
    </div>
  `;
  container.appendChild(div);
  scrollToBottom(container);
};

window.handleSendChatMessage = async (e, prefix = 'farmer') => {
  if (e && e.preventDefault) e.preventDefault();
  const input = getElement(`${prefix}ChatTextInput`);
  if (!input) return;

  const text = input.value.trim();
  if (!text || !CommState.activeConversationId) return;

  input.value = '';
  input.focus();

  const session = getSession();

  // Send via Socket.IO
  if (CommState.socket && CommState.socket.connected) {
    CommState.socket.emit('send_message', {
      conversationId: CommState.activeConversationId,
      message: text
    });
  } else {
    // REST fallback
    try {
      await apiRequest(`/communication/conversations/${CommState.activeConversationId}/messages`, {
        method: 'POST',
        headers: {
          'x-user-id': session.id,
          'x-user-type': session.userType
        },
        body: JSON.stringify({ message: text })
      });
      // Reload messages
      openChatById(CommState.activeConversationId, prefix);
    } catch (err) {
      console.error('Failed to send via REST fallback:', err);
    }
  }
};

window.handleChatInputTyping = (prefix = 'farmer') => {
  if (CommState.socket && CommState.activeConversationId) {
    CommState.socket.emit('typing', {
      conversationId: CommState.activeConversationId,
      isTyping: true
    });
    clearTimeout(window._typingTimer);
    window._typingTimer = setTimeout(() => {
      CommState.socket.emit('typing', {
        conversationId: CommState.activeConversationId,
        isTyping: false
      });
    }, 1200);
  }
};

// ==========================================
// 5. Quick Connect Triggers from Dashboard
// ==========================================
window.startChatWithBuyer = async (buyer) => {
  const session = getSession();
  if (!session || session.userType !== 'farmer') {
    showMessage('Please login as a verified farmer to contact buyers.', 'warning');
    return;
  }

  const buyerId = buyer.buyer_id || buyer.id;
  if (!buyerId) {
    showMessage('Buyer identifier not found.', 'error');
    return;
  }

  try {
    const res = await apiRequest('/communication/conversations/get-or-create', {
      method: 'POST',
      headers: {
        'x-user-id': session.id,
        'x-user-type': 'farmer'
      },
      body: JSON.stringify({
        farmer_id: session.id,
        buyer_id: buyerId
      })
    });

    if (res.ok && res.data) {
      closeModal('buyerDetailsModal');
      // Switch to Messages tab on farmer dashboard
      switchFarmerTab('btnTabFarmerMessages', 'farmerTabContentMessages');
      await openChatById(res.data.id, 'farmer');
    } else {
      showMessage(res.message || 'Could not start conversation with buyer.', 'error');
    }
  } catch (e) {
    console.error('Error starting chat with buyer:', e);
    showMessage('Network error starting conversation.', 'error');
  }
};

window.startChatWithFarmer = async (farmer) => {
  const session = getSession();
  if (!session || session.userType !== 'buyer') {
    showMessage('Please login as a verified buyer to contact farmers.', 'warning');
    return;
  }

  const farmerId = farmer.farmer_id || farmer.id;
  if (!farmerId) {
    showMessage('Farmer identifier not found.', 'error');
    return;
  }

  try {
    const res = await apiRequest('/communication/conversations/get-or-create', {
      method: 'POST',
      headers: {
        'x-user-id': session.id,
        'x-user-type': 'buyer'
      },
      body: JSON.stringify({
        farmer_id: farmerId,
        buyer_id: session.id
      })
    });

    if (res.ok && res.data) {
      closeModal('farmerDetailsModal');
      // Switch to Messages tab on buyer dashboard
      switchBuyerTab('btnTabBuyerMessages', 'buyerTabContentMessages');
      await openChatById(res.data.id, 'buyer');
    } else {
      showMessage(res.message || 'Could not start conversation with farmer.', 'error');
    }
  } catch (e) {
    console.error('Error starting chat with farmer:', e);
    showMessage('Network error starting conversation.', 'error');
  }
};

window.startDirectCallFromModal = (partnerId, partnerType, partnerName, callType = 'voice') => {
  const session = getSession();
  if (!session) {
    showMessage('Please login to make direct calls.', 'warning');
    return;
  }

  closeModal('buyerDetailsModal');
  closeModal('farmerDetailsModal');

  startOutgoingCall({
    partnerId,
    partnerType,
    partnerName,
    conversationId: null,
    callType
  });
};

// ==========================================
// 6. Utility Functions
// ==========================================
const updateCommOnlineBadges = () => {
  const session = getSession();
  if (!session) return;
  const prefix = session.userType === 'farmer' ? 'farmer' : 'buyer';
  loadConversations();
};

const refreshConversationsList = () => {
  const session = getSession();
  if (!session) return;
  const prefix = session.userType === 'farmer' ? 'farmer' : 'buyer';
  const listEl = getElement(`${prefix}ConversationsList`);
  if (listEl) {
    loadConversations();
  }
};

const updateUnreadBadge = (convId) => {
  // Can be used to show notification bell / tab unread badges
  const badge = document.querySelector('.comm-tab-unread');
  if (badge) {
    badge.classList.remove('hidden');
  }
};

const scrollToBottom = (el) => {
  if (el) {
    el.scrollTop = el.scrollHeight;
  }
};

const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

const formatTimeOfDay = (isoString) => {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
};

const formatRelativeTime = (isoString) => {
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch (e) {
    return '';
  }
};

// Initialize when user session is active
window.addEventListener('DOMContentLoaded', () => {
  initCommunicationSocket();
});
