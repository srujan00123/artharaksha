/**
 * Artha-specific socket event handlers
 * This file is automatically loaded by Frappe's realtime server
 */

module.exports = function (socket) {
  console.log(`Setting up Artha handlers for socket ${socket.id}`);

  // Handle Artha-specific notification events
  socket.on("artha_notification", (data) => {
    console.log("Artha notification received:", data);
    // Broadcast to the appropriate room/user
    if (data.user) {
      socket.to(`user:${data.user}`).emit("artha_notification", data);
    } else if (data.room) {
      socket.to(data.room).emit("artha_notification", data);
    } else {
      socket.to("all").emit("artha_notification", data);
    }
  });

  // Handle expense-related events
  socket.on("artha:expense_created", (data) => {
    socket.to("all").emit("expense_created", data);
    socket.to(`user:${data.owner}`).emit("expense_created", data);
  });

  socket.on("artha:expense_updated", (data) => {
    socket.to("all").emit("expense_updated", data);
    socket.to(`user:${data.owner}`).emit("expense_updated", data);
  });

  socket.on("artha:expense_deleted", (data) => {
    socket.to("all").emit("expense_deleted", data);
    socket.to(`user:${data.owner}`).emit("expense_deleted", data);
  });

  // Handle income-related events
  socket.on("artha:income_created", (data) => {
    socket.to("all").emit("income_created", data);
    socket.to(`user:${data.owner}`).emit("income_created", data);
  });

  socket.on("artha:income_updated", (data) => {
    socket.to("all").emit("income_updated", data);
    socket.to(`user:${data.owner}`).emit("income_updated", data);
  });

  socket.on("artha:income_deleted", (data) => {
    socket.to("all").emit("income_deleted", data);
    socket.to(`user:${data.owner}`).emit("income_deleted", data);
  });

  socket.on("artha:income_saved", (data) => {
    socket.to("all").emit("income_saved", data);
    socket.to(`user:${data.user}`).emit("income_saved", data);
  });

  // Handle income ledger events
  socket.on("artha:income_ledger_created", (data) => {
    socket.to("all").emit("income_ledger_created", data);
    socket.to(`user:${data.user}`).emit("income_ledger_created", data);
  });

  socket.on("artha:income_ledger_updated", (data) => {
    socket.to("all").emit("income_ledger_updated", data);
    socket.to(`user:${data.user}`).emit("income_ledger_updated", data);
  });

  socket.on("artha:income_ledger_deleted", (data) => {
    socket.to("all").emit("income_ledger_deleted", data);
    socket.to(`user:${data.user}`).emit("income_ledger_deleted", data);
  });

  // Handle bulk operations
  socket.on("artha:bulk_ledger_updated", (data) => {
    socket.to("all").emit("bulk_ledger_updated", data);
    socket.to(`user:${data.user}`).emit("bulk_ledger_updated", data);
  });

  // Handle task progress events
  socket.on("artha:task_progress", (data) => {
    socket.to(`task:${data.task_id}`).emit("task_progress", data);
    socket.to(`progress:${data.task_id}`).emit("progress", data);
  });

  socket.on("artha:task_completed", (data) => {
    socket.to(`task:${data.task_id}`).emit("task_status_change", {
      ...data,
      status: "completed"
    });
  });

  socket.on("artha:task_failed", (data) => {
    socket.to(`task:${data.task_id}`).emit("task_status_change", {
      ...data,
      status: "failed"
    });
  });

  // Handle file upload progress
  socket.on("artha:upload_progress", (data) => {
    socket.to(`user:${data.user}`).emit("upload_progress", data);
  });

  // Handle analytics refresh events
  socket.on("artha:refresh_analytics", (data) => {
    socket.to("all").emit("refresh_analytics", data);
  });

  console.log(`Artha handlers registered for socket ${socket.id}`);
}; 