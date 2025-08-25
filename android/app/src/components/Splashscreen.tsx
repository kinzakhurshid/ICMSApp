import React, { useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  Animated, 
  Image,
  ImageSourcePropType 
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Define your navigation types
type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  // Add other screens here
};

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

const GradientSplashScreen = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Replace with your actual logo path
  const logoImage: ImageSourcePropType = require('../../assets/images/Logo.png');

  useEffect(() => {
    // Animation sequence
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // Navigation timeout
    const timer = setTimeout(() => {
      navigation.navigate('Login');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation, fadeAnim]);

  return (
    <LinearGradient
      colors={['#FF7F00', '#FF4B00', '#FF2D00']} // Vibrant orange gradient
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Image 
          source={logoImage}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Intelgency CMS Pro</Text>
        <Text style={styles.subtitle}>Streamline your Workspace</Text>
      </Animated.View>

      <Text style={styles.footer}>© {new Date().getFullYear()} Intelegency</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    marginBottom: 100,
  },
  logo: {
    width: 150,  // Adjust based on your logo dimensions
    height: 150, // Adjust based on your logo dimensions
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
});

export default GradientSplashScreen;