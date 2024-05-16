export type ErrorType = (
  'UnknownError' | // an unknown error type
  'PeerNotConnected' | // CC or editor peer tried to send a message to the other peer when the other peer is not connected
  'SessionIdNotExist' | // Editor tried connecting to a nonexistent session ID
  'SessionHasEditor' | // Editor tried connecting to a session ID that already has an editor
  'SessionIdTaken' | // CC tried requesting a new session using an ID that's already taken
  'BadReconnectToken' // Reconnect token supplied is incorrect
);