import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { login } from '@/services/authService';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, Fonts } from '@/constants/theme';

type UserRole = 'admin' | 'stalkist' | 'dellear' | 'salesman';

export default function LoginScreen() {
  const { isDark, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('salesman');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRolePicker, setShowRolePicker] = useState(false);

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
      style={[styles.container, { backgroundColor: colors.background }]}
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
            <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.bold }]}>
              Welcome Back
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: Fonts.light }]}>
              Sign in to continue
            </Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: `${colors.error}20` }]}>
              <Text style={[styles.errorText, { color: colors.error, fontFamily: Fonts.light }]}>
                {error}
              </Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.textSecondary, fontFamily: Fonts.medium }]}>
                Email
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.inputText,
                    fontFamily: Fonts.regular,
                  },
                ]}
                placeholder="Enter your email"
                placeholderTextColor={colors.inputPlaceholder}
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
              <Text style={[styles.label, { color: colors.textSecondary, fontFamily: Fonts.medium }]}>
                Password
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.inputText,
                    fontFamily: Fonts.regular,
                  },
                ]}
                placeholder="Enter your password"
                placeholderTextColor={colors.inputPlaceholder}
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
              <Text style={[styles.label, { color: colors.textSecondary, fontFamily: Fonts.medium }]}>
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
                          ? colors.primary
                          : colors.inputBackground,
                        borderColor: role === roleOption.value
                          ? colors.primaryLight
                          : colors.inputBorder,
                      },
                    ]}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        {
                          color: role === roleOption.value
                            ? colors.textInverse
                            : colors.inputText,
                          fontFamily: Fonts.semiBold,
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
              <Text style={[styles.forgotPasswordText, { color: colors.primaryLight, fontFamily: Fonts.medium }]}>
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
                backgroundColor: colors.primary,
                opacity: loading ? 0.6 : 1,
              }
            ]}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={[styles.loginButtonText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textTertiary, fontFamily: Fonts.light }]}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={[styles.registerText, { color: colors.textTertiary, fontFamily: Fonts.light }]}>
              Don't have an account?{' '}
            </Text>
            <Link href="/register" asChild>
              <TouchableOpacity>
                <Text style={[styles.registerLink, { color: colors.primaryLight, fontFamily: Fonts.semiBold }]}>
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
    fontSize: Fonts.sizes['4xl'],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Fonts.sizes.base,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: Fonts.sizes.sm,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: Fonts.sizes.base,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  forgotPasswordText: {
    fontSize: Fonts.sizes.sm,
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
    fontSize: Fonts.sizes.base,
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
    fontSize: Fonts.sizes.sm,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: Fonts.sizes.base,
  },
  registerLink: {
    fontSize: Fonts.sizes.base,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: Fonts.sizes.sm,
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
    fontSize: Fonts.sizes.sm,
  },
});

