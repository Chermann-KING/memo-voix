import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/constants/colors';

type AuthMode = 'login' | 'register' | 'reset';

export default function AuthScreen() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const { login, register, resetPassword, isLoading, error, user } = useAuth();
  const router = useRouter();
  const [isRouterReady, setIsRouterReady] = useState(false);

  // Set router ready after initial render
  useEffect(() => {
    setIsRouterReady(true);
  }, []);

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isRouterReady && user) {
      // Use setTimeout to ensure this happens after initial render
      const timer = setTimeout(() => {
        router.replace('/');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, router, isRouterReady]);

  const handleSubmit = (data: any) => {
    switch (authMode) {
      case 'login':
        login(data);
        break;
      case 'register':
        register(data);
        break;
      case 'reset':
        resetPassword(data.email);
        break;
    }
  };

  const toggleAuthMode = () => {
    if (authMode === 'login') {
      setAuthMode('register');
    } else if (authMode === 'register') {
      setAuthMode('login');
    } else if (authMode === 'reset') {
      setAuthMode('login');
    }
  };

  const handleForgotPassword = () => {
    setAuthMode('reset');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <Stack.Screen
        options={{
          title: '',
          headerShown: false,
        }}
      />
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1557682257-2f9c37a3a5f3?q=80&w=200&auto=format&fit=crop' }}
            style={styles.logo}
          />
        </View>

        <AuthForm
          type={authMode}
          onSubmit={handleSubmit}
          onToggleForm={toggleAuthMode}
          isLoading={isLoading}
          error={error}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 64,
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
});