import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';

interface AuthFormProps {
  type: 'login' | 'register' | 'reset';
  onSubmit: (data: any) => void;
  onToggleForm: () => void;
  isLoading: boolean;
  error: string | null;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  type,
  onSubmit,
  onToggleForm,
  isLoading,
  error,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');
  
  const validateEmail = () => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    
    setEmailError('');
    return true;
  };
  
  const validatePassword = () => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    
    setPasswordError('');
    return true;
  };
  
  const validateConfirmPassword = () => {
    if (type !== 'register') return true;
    
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    
    setConfirmPasswordError('');
    return true;
  };
  
  const validateDisplayName = () => {
    if (type !== 'register') return true;
    
    if (!displayName) {
      setDisplayNameError('Name is required');
      return false;
    }
    
    setDisplayNameError('');
    return true;
  };
  
  const handleSubmit = () => {
    const isEmailValid = validateEmail();
    const isPasswordValid = type !== 'reset' ? validatePassword() : true;
    const isConfirmPasswordValid = validateConfirmPassword();
    const isDisplayNameValid = validateDisplayName();
    
    if (isEmailValid && isPasswordValid && isConfirmPasswordValid && isDisplayNameValid) {
      if (type === 'login') {
        onSubmit({ email, password });
      } else if (type === 'register') {
        onSubmit({ email, password, displayName });
      } else if (type === 'reset') {
        onSubmit({ email });
      }
    }
  };
  
  const getFormTitle = () => {
    switch (type) {
      case 'login':
        return 'Sign In';
      case 'register':
        return 'Create Account';
      case 'reset':
        return 'Reset Password';
      default:
        return '';
    }
  };
  
  const getToggleText = () => {
    switch (type) {
      case 'login':
        return "Don't have an account? Sign Up";
      case 'register':
        return 'Already have an account? Sign In';
      case 'reset':
        return 'Remember your password? Sign In';
      default:
        return '';
    }
  };
  
  const getSubmitButtonText = () => {
    switch (type) {
      case 'login':
        return 'Sign In';
      case 'register':
        return 'Sign Up';
      case 'reset':
        return 'Send Reset Link';
      default:
        return '';
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{getFormTitle()}</Text>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <View style={styles.form}>
        {type === 'register' && (
          <Input
            label="Name"
            placeholder="Enter your name"
            value={displayName}
            onChangeText={setDisplayName}
            error={displayNameError}
            autoCapitalize="words"
            onBlur={validateDisplayName}
          />
        )}
        
        <Input
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          error={emailError}
          keyboardType="email-address"
          autoCapitalize="none"
          onBlur={validateEmail}
        />
        
        {type !== 'reset' && (
          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            error={passwordError}
            secureTextEntry
            onBlur={validatePassword}
          />
        )}
        
        {type === 'register' && (
          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={confirmPasswordError}
            secureTextEntry
            onBlur={validateConfirmPassword}
          />
        )}
        
        <Button
          title={getSubmitButtonText()}
          onPress={handleSubmit}
          isLoading={isLoading}
          style={styles.submitButton}
        />
        
        <TouchableOpacity onPress={onToggleForm} style={styles.toggleButton}>
          <Text style={styles.toggleText}>{getToggleText()}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: colors.light.text,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  submitButton: {
    marginTop: 16,
  },
  toggleButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  toggleText: {
    color: colors.light.primary,
    fontSize: 16,
  },
  errorText: {
    color: colors.light.error,
    marginBottom: 16,
    textAlign: 'center',
  },
});