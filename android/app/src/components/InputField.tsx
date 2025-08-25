import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

interface InputFieldProps extends TextInputProps {
  icon: string;
}

const InputField: React.FC<InputFieldProps> = ({ icon, ...props }) => {
  return (
    <View style={styles.container}>
      <Icon name={icon} size={16} color="#aaa" style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholderTextColor="#aaa"
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 45,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#000',
  },
});

export default InputField;
