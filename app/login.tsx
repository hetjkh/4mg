import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, useColorScheme, Alert, ActivityIndicator } from 'react-native';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { login } from '@/services/authService';

type UserRole = 'admin' | 'stalkist' | 'dellear' | 'salesman';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('salesman');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRolePicker, setShowRolePicker] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const roles: { label: string; value: UserRole }[] = [
    { label: 'Admin', value: 'admin' },
    { label: 'Stalkist', value: 'stalkist' },
    { label: 'Dellear', value: 'dellear' },
    { label: 'Salesman', value: 'salesman' },
  ];

  const handleLogin = async () => {
    // Validation
    if (!email.trim() || !password.trim() || !role) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await login(email.trim(), password, role);
      
      if (response.success) {
        Alert.alert('Success', 'Login successful!', [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      Alert.alert('Error', err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: isDark ? '#111827' : '#FFFFFF' }]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentWrapper}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              Welcome Back
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#4B5563' }]}>
              Sign in to continue
            </Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2' }]}>
              <Text style={[styles.errorText, { color: isDark ? '#FCA5A5' : '#DC2626' }]}>
                {error}
              </Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                Email
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                    borderColor: isDark ? '#374151' : '#E5E7EB',
                    color: isDark ? '#FFFFFF' : '#111827',
                  },
                ]}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                Password
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                    borderColor: isDark ? '#374151' : '#E5E7EB',
                    color: isDark ? '#FFFFFF' : '#111827',
                  },
                ]}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError('');
                }}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                editable={!loading}
              />
            </View>

            {/* Role Selection */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                Role
              </Text>
              <View style={styles.roleContainer}>
                {roles.map((roleOption) => (
                  <TouchableOpacity
                    key={roleOption.value}
                    onPress={() => {
                      setRole(roleOption.value);
                      setError('');
                    }}
                    style={[
                      styles.roleButton,
                      {
                        backgroundColor: role === roleOption.value
                          ? (isDark ? '#3B82F6' : '#2563EB')
                          : (isDark ? '#374151' : '#E5E7EB'),
                        borderColor: role === roleOption.value
                          ? (isDark ? '#60A5FA' : '#2563EB')
                          : (isDark ? '#4B5563' : '#D1D5DB'),
                      },
                    ]}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        {
                          color: role === roleOption.value
                            ? '#FFFFFF'
                            : (isDark ? '#D1D5DB' : '#374151'),
                        },
                      ]}
                    >
                      {roleOption.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword} disabled={loading}>
              <Text style={[styles.forgotPasswordText, { color: isDark ? '#60A5FA' : '#2563EB' }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            style={[
              styles.loginButton, 
              { 
                backgroundColor: isDark ? '#3B82F6' : '#2563EB',
                opacity: loading ? 0.6 : 1,
              }
            ]}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: isDark ? '#374151' : '#D1D5DB' }]} />
            <Text style={[styles.dividerText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: isDark ? '#374151' : '#D1D5DB' }]} />
          </View>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={[styles.registerText, { color: isDark ? '#9CA3AF' : '#4B5563' }]}>
              Don't have an account?{' '}
            </Text>
            <Link href="/register" asChild>
              <TouchableOpacity>
                <Text style={[styles.registerLink, { color: isDark ? '#60A5FA' : '#2563EB' }]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 448,
    alignSelf: 'center',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 16,
  },
  registerLink: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  roleButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

