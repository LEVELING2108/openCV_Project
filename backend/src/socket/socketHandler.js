/**
 * ExamGuard AI - Real-time Socket.IO Communication Handler
 */

const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`⚡ Client connected: ${socket.id}`);

    // Join session room (for students and observing examiners)
    socket.on('session:join', ({ sessionId, role, userId }) => {
      socket.join(`session_${sessionId}`);
      socket.data = { sessionId, role, userId };
      console.log(`👤 User ${userId} (${role}) joined session room: session_${sessionId}`);

      // If examiner joins, notify them
      if (role === 'examiner' || role === 'admin') {
        socket.join(`exam_monitor_${sessionId}`);
      }
    });

    // Student heartbeat event
    socket.on('session:heartbeat', (data) => {
      const { sessionId, timestamp, status } = data;
      // Broadcast status update to examiners monitoring this session
      io.to(`session_${sessionId}`).emit('session:status', {
        sessionId,
        status: status || 'ACTIVE',
        lastSeen: timestamp || new Date().toISOString(),
        socketId: socket.id,
      });
    });

    // Proctoring incident detected (from CV microservice or client checks)
    socket.on('proctor:event', (eventData) => {
      const { sessionId, eventType, confidence, riskScore, evidence } = eventData;
      console.log(`🚨 Proctor Alert [${sessionId}]: ${eventType} (Confidence: ${confidence})`);

      // Broadcast alert and updated risk score to examiners
      io.to(`session_${sessionId}`).emit('proctor:alert', {
        ...eventData,
        receivedAt: new Date().toISOString(),
      });

      if (riskScore !== undefined) {
        io.to(`session_${sessionId}`).emit('risk:update', {
          sessionId,
          riskScore,
          updatedAt: new Date().toISOString(),
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
      if (socket.data && socket.data.sessionId && socket.data.role === 'student') {
        io.to(`session_${socket.data.sessionId}`).emit('session:status', {
          sessionId: socket.data.sessionId,
          status: 'DISCONNECTED',
          lastSeen: new Date().toISOString(),
        });
      }
    });
  });
};

module.exports = setupSocket;
