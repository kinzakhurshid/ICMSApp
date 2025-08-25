import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import {store} from '../states/store';
import AppNavigator from './AppNavigator';
import BottomTabNavigator from './BottomNavigator';

const App = () => {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <BottomTabNavigator />
        <AppNavigator />
      </NavigationContainer>
    </Provider>
  );
};

export default App;