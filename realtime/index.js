/**
 * Artha Realtime Server Override
 * Simple fix to bind to 0.0.0.0 for production
 * Uses all standard Frappe infrastructure
 */

// Load and execute the standard Frappe realtime server
const frappeRealtime = require("../../frappe/realtime/index.js");

// The above will set everything up, we just need to override the listen call
const { get_conf } = require("../../frappe/node_utils");
const conf = get_conf();

// Get the server instance (this is a bit hacky but works)
const originalListen = require("http").Server.prototype.listen;
require("http").Server.prototype.listen = function(...args) {
  // If this is the socketio server and no host is specified
  if (args.length === 2 && typeof args[1] === 'function') {
    const port = args[0];
    const callback = args[1];
    
    // Add 0.0.0.0 binding for production
    return originalListen.call(this, port, "0.0.0.0", callback);
  }
  
  // For all other cases, use original
  return originalListen.apply(this, args);
};

console.log("Artha realtime override: Will bind to 0.0.0.0 for production compatibility"); 