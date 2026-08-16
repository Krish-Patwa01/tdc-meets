export const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Which Jitsi instance hosts the video.
//
// meet.jit.si requires the first participant in a room to sign in as moderator,
// so the host opens the room there directly once before the workshop. Everyone
// else then joins through this app without any account. Other public instances
// refuse to be embedded at all, so this is the tradeoff we live with until the
// community runs its own Jitsi server.
export const JITSI_DOMAIN = process.env.REACT_APP_JITSI_DOMAIN || 'meet.jit.si';

export const jitsiRoomName = (roomId) => `tdc-${roomId}`;

export const jitsiDirectUrl = (roomId) =>
  `https://${JITSI_DOMAIN}/${jitsiRoomName(roomId)}`;
