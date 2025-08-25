import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { store } from './android/app/src/states/store';
import AppNavigator from './android/app/src/navigation/AppNavigator';

const App = () => {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </Provider>
  );
};

export default App;
