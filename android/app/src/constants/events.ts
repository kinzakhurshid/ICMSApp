// Socket Events
export const CHAT_JOINED = "CHAT_JOINED";
export const CHAT_LEAVED = "CHAT_LEAVED";
export const NEW_MESSAGE = "NEW_MESSAGE";
export const NEW_MESSAGE_ALERT = "NEW_MESSAGE_ALERT";
export const NEW_NOTIFICATION_ALERT = "NEW_NOTIFICATION_ALERT";
export const NEW_REACTION = "NEW_REACTION";
export const ONLINE_USERS = "ONLINE_USERS";
export const DELETE_MESSAGE = "DELETE_MESSAGE";
export const UPDATE_LAST_MESSAGE = "UPDATE_LAST_MESSAGE";
export const START_TYPING = "START_TYPING";
export const STOP_TYPING = "STOP_TYPING";
export const UPDATE_MESSAGE = "UPDATE_MESSAGE";
export const READ_INBOX_NOTIFICATIONS = "READ_INBOX_NOTIFICATIONS";
export const READ_CHAT_NOTIFICATIONS = "READ_CHAT_NOTIFICATIONS";

// Chat Features
export const PIN_MESSAGE = "PIN_MESSAGE";
export const UNPIN_MESSAGE = "UNPIN_MESSAGE";
export const REPLY_TO_MESSAGE = "REPLY_TO_MESSAGE";
export const ADD_REACTION = "ADD_REACTION";
export const REMOVE_REACTION = "REMOVE_REACTION";
export const REFETCH_CHAT_DETAILS = "REFETCH_CHAT_DETAILS";

// Member Management
export const MEMBER_ADDED = "MEMBER_ADDED";
export const MEMBER_REMOVED = "MEMBER_REMOVED";
export const CHAT_UPDATED = "CHAT_UPDATED";

// Call Events (if needed in future)
export const CALL_INVITE = 'callInvite';
export const CALL_ACCEPTED = 'callAccepted';
export const CALL_REJECTED = 'callRejected';
export const CALL_ENDED = 'callEnded';
export const CALL_ICE_CANDIDATE = 'callIceCandidate';
export const CALL_OFFER = 'callOffer';
export const CALL_ANSWER = 'callAnswer';