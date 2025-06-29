/**
 * Artha-specific socket event handlers
 * Updated for Gameplan-style socket implementation
 * Following Frappe's official realtime handler pattern
 */

module.exports = function (socket) {
  console.log(`🔧 Artha handlers loaded for socket ${socket.id} (user: ${socket.user})`);

  // Enhanced auto-join logic following Gameplan's pattern
  const autoJoinRooms = () => {
    if (socket.user && socket.user !== 'Guest') {
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

      // Auto-join Artha-specific rooms based on user roles
      if (socket.user_roles?.includes('Artha User')) {
        socket.join('artha_users');
        console.log(`✅ Auto-joined Artha users room`);
      }

      if (socket.user_roles?.includes('System Manager') || socket.user_roles?.includes('Administrator')) {
        socket.join('artha_admin');
        console.log(`✅ Auto-joined Artha admin room`);
      }

      // Join general authenticated users room
      socket.join('authenticated_users');
      console.log(`✅ Auto-joined authenticated users room`);
    } else {
      // Guest users join website room only
      socket.join('website');
      console.log(`✅ Auto-joined Guest to website room`);
    }
  };

  // Execute auto-join
  autoJoinRooms();

  // Handle standard Frappe join_room events (used by frontend)
  socket.on('join_room', (room) => {
    if (typeof room === 'string') {
      // Validate room access
      if (canJoinRoom(socket, room)) {
        socket.join(room);
        console.log(`✅ Socket ${socket.id} joined room: ${room}`);
        
        // Send confirmation back to client
        socket.emit('room_joined', { room, success: true });
      } else {
        console.warn(`❌ Unauthorized attempt to join room ${room} by ${socket.id} (user: ${socket.user})`);
        socket.emit('room_join_error', { room, error: 'Unauthorized' });
      }
    }
  });

  // Handle standard Frappe leave_room events
  socket.on('leave_room', (room) => {
    if (typeof room === 'string') {
      socket.leave(room);
      console.log(`👋 Socket ${socket.id} left room: ${room}`);
      socket.emit('room_left', { room, success: true });
    }
  });

  // Handle explicit user room joining (Gameplan style)
  socket.on('join_user_room', (data) => {
    if (data.user && data.user === socket.user && socket.user !== 'Guest') {
      const userRoom = `user:${data.user}`;
      socket.join(userRoom);
      console.log(`✅ Socket ${socket.id} explicitly joined user room: ${userRoom}`);
      socket.emit('user_room_joined', { room: userRoom, success: true });
    } else {
      console.warn(`❌ Unauthorized attempt to join user room by ${socket.id}`);
      socket.emit('user_room_error', { error: 'Unauthorized or Guest user' });
    }
  });

  // Handle role-based room joining (with permission check)
  socket.on('join_role_room', (data) => {
    if (data.role && socket.user_roles && socket.user_roles.includes(data.role)) {
      const roleRoom = `role:${data.role}`;
      socket.join(roleRoom);
      console.log(`✅ Socket ${socket.id} joined role room: ${roleRoom}`);
      socket.emit('role_room_joined', { room: roleRoom, success: true });
    } else {
      console.warn(`❌ Unauthorized attempt to join role room ${data.role} by ${socket.id}`);
      socket.emit('role_room_error', { role: data.role, error: 'Unauthorized' });
    }
  });

  // Handle Artha-specific room joining
  socket.on('join_artha_room', (data) => {
    const allowedRooms = ['artha_users', 'artha_insights', 'artha_admin'];
    
    if (data.room && allowedRooms.includes(data.room)) {
      // Check permissions based on room type
      let canJoin = false;
      
      if (data.room === 'artha_users' && socket.user_roles?.includes('Artha User')) {
        canJoin = true;
      } else if (data.room === 'artha_insights' && socket.user_roles?.includes('Insights User')) {
        canJoin = true;
      } else if (data.room === 'artha_admin' && (socket.user_roles?.includes('System Manager') || socket.user_roles?.includes('Administrator'))) {
        canJoin = true;
      }
      
      if (canJoin) {
        socket.join(data.room);
        console.log(`✅ Socket ${socket.id} joined Artha room: ${data.room}`);
        socket.emit('artha_room_joined', { room: data.room, success: true });
      } else {
        console.warn(`❌ Insufficient permissions for ${socket.id} to join ${data.room}`);
        socket.emit('artha_room_error', { room: data.room, error: 'Insufficient permissions' });
      }
    } else {
      console.warn(`❌ Invalid Artha room ${data.room} requested by ${socket.id}`);
      socket.emit('artha_room_error', { room: data.room, error: 'Invalid room' });
    }
  });

  // Handle Frappe doctype subscription (Gameplan style)
  socket.on('doctype_subscribe', (doctype) => {
    if (doctype && socket.user !== 'Guest') {
      const doctypeRoom = `doctype:${doctype}`;
      if (canJoinRoom(socket, doctypeRoom)) {
        socket.join(doctypeRoom);
        console.log(`✅ Socket ${socket.id} subscribed to doctype: ${doctype}`);
        socket.emit('doctype_subscribed', { doctype, success: true });
      } else {
        console.warn(`❌ Unauthorized doctype subscription: ${doctype} by ${socket.id}`);
        socket.emit('doctype_subscription_error', { doctype, error: 'Unauthorized' });
      }
    }
  });

  // Handle Frappe doctype unsubscription
  socket.on('doctype_unsubscribe', (doctype) => {
    if (doctype) {
      const doctypeRoom = `doctype:${doctype}`;
      socket.leave(doctypeRoom);
      console.log(`👋 Socket ${socket.id} unsubscribed from doctype: ${doctype}`);
      socket.emit('doctype_unsubscribed', { doctype, success: true });
    }
  });

  // Handle document subscription (Gameplan style)
  socket.on('doc_subscribe', (doctype, docname) => {
    if (doctype && docname && socket.user !== 'Guest') {
      const docRoom = `doc:${doctype}/${docname}`;
      if (canJoinRoom(socket, docRoom)) {
        socket.join(docRoom);
        console.log(`✅ Socket ${socket.id} subscribed to document: ${doctype}/${docname}`);
        socket.emit('doc_subscribed', { doctype, docname, success: true });
      } else {
        console.warn(`❌ Unauthorized document subscription: ${doctype}/${docname} by ${socket.id}`);
        socket.emit('doc_subscription_error', { doctype, docname, error: 'Unauthorized' });
      }
    }
  });

  // Handle document unsubscription
  socket.on('doc_unsubscribe', (doctype, docname) => {
    if (doctype && docname) {
      const docRoom = `doc:${doctype}/${docname}`;
      socket.leave(docRoom);
      console.log(`👋 Socket ${socket.id} unsubscribed from document: ${doctype}/${docname}`);
      socket.emit('doc_unsubscribed', { doctype, docname, success: true });
    }
  });

  // Handle ping/pong for connection health monitoring
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now(), user: socket.user });
  });

  // Handle authentication status updates
  socket.on('auth_update', (data) => {
    if (data.user && data.user !== socket.user) {
      console.log(`🔐 User authentication changed: ${socket.user} -> ${data.user}`);
      // Update socket user and rejoin appropriate rooms
      socket.user = data.user;
      socket.user_roles = data.user_roles || [];
      
      // Rejoin user-specific rooms
      if (socket.user !== 'Guest') {
        const userRoom = `user:${socket.user}`;
        socket.join(userRoom);
        console.log(`✅ Re-joined user room after auth update: ${userRoom}`);
      }
    }
  });

  // Handle disconnection cleanup
  socket.on('disconnect', (reason) => {
    console.log(`👋 Socket ${socket.id} disconnected: ${reason} (user: ${socket.user})`);
    // Cleanup is automatic when socket disconnects
  });

  // Debug: Log current rooms for a socket
  socket.on('debug_rooms', () => {
    const rooms = Array.from(socket.rooms);
    console.log(`🔍 Socket ${socket.id} is in rooms:`, rooms);
    socket.emit('debug_rooms_response', { 
      rooms, 
      user: socket.user, 
      user_roles: socket.user_roles 
    });
  });

  // Handle connection status check
  socket.on('connection_status', () => {
    socket.emit('connection_status_response', {
      connected: true,
      user: socket.user,
      user_roles: socket.user_roles,
      rooms: Array.from(socket.rooms),
      timestamp: Date.now()
    });
  });

  console.log(`✅ Artha handlers ready for socket ${socket.id} (user: ${socket.user})`);
};

// Enhanced helper function to validate room access (Gameplan style with Artha specifics)
function canJoinRoom(socket, room) {
  // Allow public rooms
  const publicRooms = ['all', 'website'];
  if (publicRooms.includes(room)) {
    return true;
  }
  
  // User must be authenticated for other rooms
  if (!socket.user || socket.user === 'Guest') {
    return false;
  }
  
  // Allow authenticated users room for all logged-in users
  if (room === 'authenticated_users') {
    return true;
  }
  
  // Allow user-specific rooms only for the user themselves
  if (room.startsWith('user:')) {
    const targetUser = room.replace('user:', '');
    return targetUser === socket.user;
  }
  
  // Allow role-based rooms if user has the role
  if (room.startsWith('role:')) {
    const targetRole = room.replace('role:', '');
    return socket.user_roles && socket.user_roles.includes(targetRole);
  }

  // Allow doctype rooms based on permissions
  if (room.startsWith('doctype:')) {
    const doctype = room.replace('doctype:', '');
    // Enhanced permission check for specific doctypes
    const publicDoctypes = ['Income Ledger', 'Expense', 'Household Profile'];
    if (publicDoctypes.includes(doctype)) {
      return true;
    }
    // For other doctypes, require Artha User role
    return socket.user_roles && socket.user_roles.includes('Artha User');
  }

  // Allow document rooms based on permissions
  if (room.startsWith('doc:')) {
    // Allow document subscriptions for Artha users
    return socket.user_roles && socket.user_roles.includes('Artha User');
  }
  
  // Enhanced Artha-specific rooms with more granular permissions
  const allowedRooms = {
    'artha_users': ['Artha User'],
    'artha_insights': ['Insights User', 'Artha User'], 
    'artha_admin': ['System Manager', 'Administrator'],
    'artha_support': ['Support User', 'Artha User'],
    'artha_notifications': ['Artha User'] // For general app notifications
  };
  
  if (allowedRooms[room]) {
    return socket.user_roles && allowedRooms[room].some(role => 
      socket.user_roles.includes(role)
    );
  }
  
  // Allow temporary test rooms for development
  if (room.startsWith('test:') && socket.user_roles?.includes('System Manager')) {
    return true;
  }
  
  // Deny access to unknown rooms
  console.warn(`🚫 Unknown room access attempt: ${room} by ${socket.user} (roles: ${socket.user_roles?.join(', ') || 'none'})`);
  return false;
}

// Helper function to get user's accessible rooms
function getUserAccessibleRooms(socket) {
  const rooms = ['all', 'website'];
  
  if (socket.user && socket.user !== 'Guest') {
    rooms.push('authenticated_users');
    rooms.push(`user:${socket.user}`);
    
    if (socket.user_roles && Array.isArray(socket.user_roles)) {
      socket.user_roles.forEach(role => {
        rooms.push(`role:${role}`);
      });
      
      // Add Artha-specific rooms based on roles
      if (socket.user_roles.includes('Artha User')) {
        rooms.push('artha_users', 'artha_notifications');
      }
      if (socket.user_roles.includes('Insights User')) {
        rooms.push('artha_insights');
      }
      if (socket.user_roles.includes('System Manager') || socket.user_roles.includes('Administrator')) {
        rooms.push('artha_admin');
      }
      if (socket.user_roles.includes('Support User')) {
        rooms.push('artha_support');
      }
    }
  }
  
  return rooms;
} 