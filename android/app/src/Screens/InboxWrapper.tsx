// Components/InboxWrapper.tsx
import React from 'react';
import InboxScreen from '../Screens/InboxScreen';

const InboxWrapper: React.FC = () => {
  // SocketProvider is now global in App.tsx
  return <InboxScreen />;
};

export default InboxWrapper;