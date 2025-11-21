// Components/InboxWrapper.tsx
import React from 'react';
import { useRoute } from '@react-navigation/native';
import InboxScreen from '../Screens/InboxScreen';
import ChatContainer from '../components/ChatContainer';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';

const InboxWrapper: React.FC = () => {
  const route = useRoute();
  const currentUser = useSelector((state: RootState) => state.user);
  
  // Pass route params to InboxScreen so it can pass chatId to ChatContainer
  return <InboxScreen routeParams={route.params} />;
};

export default InboxWrapper;