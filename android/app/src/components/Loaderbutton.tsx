// components/LoaderButton.tsx
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';

const LoaderButton = ({ 
  title, 
  onPress, 
  loading, 
  disabled,
  style,
  textStyle 
}: {
  title: string;
  onPress: () => void;
  loading: boolean;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, style, (disabled || loading) && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[styles.text, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
});

export default LoaderButton;