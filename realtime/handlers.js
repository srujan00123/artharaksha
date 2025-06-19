/**
 * Artha-specific socket event handlers
 * This file is automatically loaded by Frappe's realtime server
 * 
 * IMPORTANT: These handlers are for client-to-server events and custom socket logic.
 * Server-to-client events (like notifications) are handled by frappe.publish_realtime()
 * and don't need custom handlers - they go directly to clients.
 */

module.exports = function (socket) {
  console.log(`🔧 Setting up Artha handlers for socket ${socket.id}`);

  // Join user-specific room for targeted notifications
  socket.on('join_user_room', (data) => {
    if (data.user) {
      const userRoom = `user:${data.user}`;
      socket.join(userRoom);
      console.log(`✅ Socket ${socket.id} joined room: ${userRoom}`);
    }
  });

  // Handle client-initiated test events (for debugging)
  socket.on('artha:client_test', (data) => {
    console.log(`🧪 Client test received from ${socket.id}:`, data);
    
    // Echo back to the client
    socket.emit('artha:test_response', {
      message: 'Test successful',
      original_data: data,
      socket_id: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  // Handle debug/ping requests
  socket.on('artha:ping', (data) => {
    console.log(`🏓 Ping received from ${socket.id}`);
    socket.emit('artha:pong', {
      message: 'Pong from Artha realtime server',
      timestamp: new Date().toISOString(),
      socket_id: socket.id
    });
  });

  // Custom room management for Artha features
  socket.on('artha:join_room', (data) => {
    if (data.room) {
      socket.join(data.room);
      console.log(`✅ Socket ${socket.id} joined custom room: ${data.room}`);
      
      // Confirm room join
      socket.emit('artha:room_joined', {
        room: data.room,
        socket_id: socket.id
      });
    }
  });

  socket.on('artha:leave_room', (data) => {
    if (data.room) {
      socket.leave(data.room);
      console.log(`❌ Socket ${socket.id} left room: ${data.room}`);
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`🔌 Artha socket ${socket.id} disconnected: ${reason}`);
  });

  // Join default rooms on connection
  if (socket.user) {
    const userRoom = `user:${socket.user}`;
    socket.join(userRoom);
    console.log(`✅ Auto-joined user room: ${userRoom} for socket ${socket.id}`);
  }

  console.log(`✅ Artha handlers registered for socket ${socket.id}`);
  
  // Send welcome message to confirm handlers are working
  socket.emit('artha:handlers_ready', {
    message: 'Artha realtime handlers are ready',
    socket_id: socket.id,
    timestamp: new Date().toISOString()
  });
}; 