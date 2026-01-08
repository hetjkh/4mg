import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, useColorScheme } from 'react-native';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
              Registration Restricted
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#4B5563' }]}>
              Only administrators can register new users
            </Text>
          </View>

          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]}>
            <Text style={[styles.infoText, { color: isDark ? '#D1D5DB' : '#374151' }]}>
              User registration is restricted to administrators only.
            </Text>
            <Text style={[styles.infoText, { color: isDark ? '#D1D5DB' : '#374151', marginTop: 12 }]}>
              If you need an account, please contact an administrator.
            </Text>
            <Text style={[styles.infoText, { color: isDark ? '#D1D5DB' : '#374151', marginTop: 12 }]}>
              Administrators can register new users from the dashboard after logging in.
            </Text>
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Link href="/login" asChild>
              <TouchableOpacity 
                style={[styles.loginButton, { backgroundColor: isDark ? '#3B82F6' : '#2563EB' }]}
                activeOpacity={0.8}
              >
                <Text style={styles.loginButtonText}>
                  Go to Login
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
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  infoCard: {
    padding: 24,
    borderRadius: 12,
    marginBottom: 32,
  },
  infoText: {
    fontSize: 16,
    lineHeight: 24,
  },
  loginContainer: {
    width: '100%',
  },
  loginButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
