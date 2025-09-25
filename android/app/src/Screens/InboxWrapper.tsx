// Components/InboxWrapper.tsx
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import { SocketProvider } from '../Context/SocketContext';
import InboxScreen from '../Screens/InboxScreen';

const InboxWrapper: React.FC = () => {
  const token = useSelector((state: RootState) => state.user);
  
  return (
    <SocketProvider token={token}>
      <InboxScreen />
    </SocketProvider>
  );
};

export default InboxWrapper;