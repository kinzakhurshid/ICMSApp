/* eslint-disable prettier/prettier */
// screens/LoginScreen.tsx
import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Platform,
  ImageBackground,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';
import {useAppDispatch} from '../hooks/useAppDispatch';
import useAxios from '../hooks/useAxios';
import {loginStart, loginSuccess, loginFailure} from '../states/userSlice';
import {store} from '../states/store';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  Developer: undefined;
  HR: undefined;
  PM: undefined;
  QA: undefined;
  RoleWebView: {role: string}; 
  App:undefined;
};
type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Signup'
>;
const LoginScreen: React.FC = () => {
  console.log('LoginScreen component rendered'); // Debugging line
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({email: '', password: ''});
  const dispatch = useAppDispatch();
  const {callApi, loading} = useAxios();

  const validateForm = () => {
    console.log('Validating form'); // Debugging line
    const newErrors = {email: '', password: ''};
    let isValid = true;

    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

const handleLogin = async () => {
  if (!validateForm()) {
    return;
  }

  try {
    dispatch(loginStart());
    const response = await callApi({
      method: 'POST',
      url: '/user/login',
      data: {email, password},
    });

    // If token is part of user object
    const user = response.user || response;
    const token = user.token;
    
    // Remove token from user object to avoid duplication
    const { token: userToken, ...userWithoutToken } = user;
    
    dispatch(loginSuccess({ user: userWithoutToken, token }));

    Alert.alert('Login Successful', `Welcome back, ${user.name}!`);
    navigation.navigate('Home');
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || error.message || 'Login failed';
    dispatch(loginFailure(errorMessage));
    setErrors(prev => ({...prev, password: errorMessage}));
  }
};
  // const handleLogin = async () => {
  //   if (!validateForm()) return;

  //   try {
  //     dispatch(loginStart());
  //     const response = await callApi({
  //       method: 'POST',
  //       url: '/user/login',
  //       data: { email, password },
  //     });

  //     const user = response.user;
  //     dispatch(loginSuccess(user));
  // console.log('Current Redux state:', store.getState());
  //     // If user has a role, go to WebView instead of showing alert
  //     if (user?.role) {
  //       navigation.replace('RoleWebView', { role: user.role });
  //     } else {
  //       Alert.alert('Login Successful', `Welcome back, ${user.name}!`);
  //     }
  //   } catch (error: any) {
  //     const errorMessage = error.response?.data?.message || error.message || 'Login failed';
  //     dispatch(loginFailure(errorMessage));
  //     setErrors(prev => ({ ...prev, password: errorMessage }));
  //   }
  // };

  const handleButtonPress = () => {
    console.log('Button pressed!'); // This should appear first when you tap
    handleLogin();
  };

  return (
    <ImageBackground
      source={require('../../assets/images/BG2.png')}
      style={styles.container}
      resizeMode="cover">
      <View style={styles.card}>
        <Text style={styles.title}>SIGN IN</Text>

        <View
          style={[
            styles.inputContainer,
            // errors.email && styles.errorInputContainer,
          ]}>
          <Icon name="envelope" size={16} color="#F09819" style={styles.icon} />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#F09819"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        {errors.email ? (
          <Text style={styles.errorText}>{errors.email}</Text>
        ) : null}

        <View
          style={[
            styles.inputContainer,
            // errors.password && styles.errorInputContainer,
          ]}>
          <Icon name="lock" size={16} color="#F09819" style={styles.icon} />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#aaa"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
        </View>
        {errors.password ? (
          <Text style={styles.errorText}>{errors.password}</Text>
        ) : null}

        <TouchableOpacity
          style={[
            styles.button,
            (!email || !password) && styles.disabledButton,
          ]}
          onPress={handleButtonPress}
          disabled={!email || !password || loading}
          activeOpacity={0.7}>
          <LinearGradient
            colors={['#FF512F', '#F09819']}
            style={styles.gradientButton}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>SIGN IN</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text style={styles.link}>Forgot Password?</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={[styles.link, styles.signUpText]}>SIGN UP</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '85%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 25,
    borderRadius: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  errorInputContainer: {
    borderColor: 'red',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#333',
    fontSize: 16,
  },
  button: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  gradientButton: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  link: {
    color: '#F09819',
    marginTop: 15,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  signUpText: {
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },
});

export default LoginScreen;