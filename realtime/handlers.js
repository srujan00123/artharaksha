/**
 * Artha-specific socket event handlers
 * Following Frappe's official realtime handler pattern
 */

module.exports = function (socket) {
  console.log(`🔧 Artha handlers loaded for socket ${socket.id}`);

  // Auto-join user to their personal room on connection
  if (socket.user) {
    const userRoom = `user:${socket.user}`;
    socket.join(userRoom);
    console.log(`✅ Auto-joined user room: ${userRoom}`);
    
    // Also join role-based rooms if user has roles
    if (socket.user_roles && Array.isArray(socket.user_roles)) {
      socket.user_roles.forEach(role => {
        const roleRoom = `role:${role}`;
        socket.join(roleRoom);
        console.log(`✅ Auto-joined role room: ${roleRoom}`);
      });
    }
  }

  // Handle explicit user room joining
  socket.on('join_user_room', (data) => {
    if (data.user && data.user === socket.user) {
      const userRoom = `user:${data.user}`;
      socket.join(userRoom);
      console.log(`✅ Socket ${socket.id} joined user room: ${userRoom}`);
    } else {
      console.warn(`❌ Unauthorized attempt to join user room by ${socket.id}`);
    }
  });

  // Handle role-based room joining (with permission check)
  socket.on('join_role_room', (data) => {
    if (data.role && socket.user_roles && socket.user_roles.includes(data.role)) {
      const roleRoom = `role:${data.role}`;
      socket.join(roleRoom);
      console.log(`✅ Socket ${socket.id} joined role room: ${roleRoom}`);
    } else {
      console.warn(`❌ Unauthorized attempt to join role room ${data.role} by ${socket.id}`);
    }
  });

  // Handle custom Artha room joining
  socket.on('join_artha_room', (data) => {
    const allowedRooms = ['artha_users', 'insights_users', 'admin'];
    
    if (data.room && allowedRooms.includes(data.room)) {
      // Check permissions based on room type
      let canJoin = false;
      
      if (data.room === 'artha_users' && socket.user_roles?.includes('Artha User')) {
        canJoin = true;
      } else if (data.room === 'insights_users' && socket.user_roles?.includes('Insights User')) {
        canJoin = true;
      } else if (data.room === 'admin' && (socket.user_roles?.includes('System Manager') || socket.user_roles?.includes('Administrator'))) {
        canJoin = true;
      }
      
      if (canJoin) {
        socket.join(data.room);
        console.log(`✅ Socket ${socket.id} joined Artha room: ${data.room}`);
      } else {
        console.warn(`❌ Insufficient permissions for ${socket.id} to join ${data.room}`);
      }
    } else {
      console.warn(`❌ Invalid room ${data.room} requested by ${socket.id}`);
    }
  });

  // Handle room leaving
  socket.on('leave_room', (data) => {
    if (data.room) {
      socket.leave(data.room);
      console.log(`👋 Socket ${socket.id} left room: ${data.room}`);
    }
  });

  // Handle disconnection cleanup
  socket.on('disconnect', (reason) => {
    console.log(`👋 Socket ${socket.id} disconnected: ${reason}`);
    // Cleanup is automatic when socket disconnects
  });

  // Debug: Log current rooms for a socket
  socket.on('debug_rooms', () => {
    const rooms = Array.from(socket.rooms);
    console.log(`🔍 Socket ${socket.id} is in rooms:`, rooms);
    socket.emit('debug_rooms_response', { rooms });
  });

  console.log(`✅ Artha handlers ready for socket ${socket.id}`);
}; 