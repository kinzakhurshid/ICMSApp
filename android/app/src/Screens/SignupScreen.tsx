import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import useAxios from '../hooks/useAxios';
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
      Dashboard:undefined;
    };
    type LoginScreenNavigationProp = NativeStackNavigationProp<
      RootStackParamList,
      'Signup'
    >;

const SignupScreen : React.FC = () => {
   const navigation = useNavigation<LoginScreenNavigationProp>();
  const {callApi} = useAxios();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orgName, setOrgName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const validateForm = () => {
    if (!orgName.trim()) {
      return 'Organization name is required';
    }
    if (!adminName.trim()) {
      return 'Admin name is required';
    }
    // Enhanced email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return 'Invalid email address format';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  };

  const handleSignup = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await callApi({
        method: 'POST',
        url: '/organizations/register',
        data: {
          name: orgName,
          adminEmail: email,
          adminName: adminName,
          password: password,
        },
      });

      console.log('Signup response:', response);
      
      // Show success alert
      Alert.alert(
        'Account Created Successfully!',
        `Your organization account "${orgName}" has been created. The admin account has been set up. Please sign in to continue.`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('Login');
            },
          },
        ],
        { cancelable: false }
      );
    
    } catch (err: any) {
      console.error('Signup error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      
      // Show failure alert
      Alert.alert(
        'Registration Failed',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ImageBackground
        source={require('../../assets/images/BG3.png')}
        style={styles.background}
        resizeMode="cover">
        <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <Text style={styles.title}>Hello</Text>
          <Text style={styles.subtitle}>Create your organization account</Text>

          {error && <Text style={styles.error}>{error}</Text>}

          <TextInput
            style={styles.input}
            placeholder="Organization Name"
            placeholderTextColor="#999"
            value={orgName}
            onChangeText={setOrgName}
          />

          <TextInput
            style={styles.input}
            placeholder="Admin Name"
            placeholderTextColor="#999"
            value={adminName}
            onChangeText={setAdminName}
          />

          <TextInput
            style={styles.input}
            placeholder="Admin Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleSignup}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>SIGN UP</Text>
            )}
          </TouchableOpacity>

          <View style={styles.signInRow}>
            <Text style={styles.link}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkHighlight}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      </ImageBackground>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: 'white',
    width: '100%',
    padding: 20,
    borderRadius: 20,
    elevation: 5,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff4500',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  error: {
    backgroundColor: '#ffe6e6',
    color: '#cc0000',
    padding: 8,
    borderRadius: 5,
    marginBottom: 10,
    textAlign: 'center',
    width: '100%',
  },
  input: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
    color: '#333',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#ff4500',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: '#666',
  },
  linkHighlight: {
    color: '#ff4500',
    fontWeight: '600',
  },
  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
});

export default SignupScreen;