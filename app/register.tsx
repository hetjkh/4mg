import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, Fonts } from '@/constants/theme';

export default function RegisterScreen() {
  const { isDark, colorScheme } = useTheme();
  const colors = Colors[colorScheme];

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
              Registration Restricted
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: Fonts.light }]}>
              Only administrators can register new users
            </Text>
          </View>

          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.infoText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
              User registration is restricted to administrators only.
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary, fontFamily: Fonts.regular, marginTop: 12 }]}>
              If you need an account, please contact an administrator.
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary, fontFamily: Fonts.regular, marginTop: 12 }]}>
              Administrators can register new users from the dashboard after logging in.
            </Text>
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Link href="/login" asChild>
              <TouchableOpacity 
                style={[styles.loginButton, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.loginButtonText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>
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
    fontSize: Fonts.sizes['2xl'],
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Fonts.sizes.base,
    textAlign: 'center',
  },
  infoCard: {
    padding: 24,
    borderRadius: 12,
    marginBottom: 32,
  },
  infoText: {
    fontSize: Fonts.sizes.base,
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
    fontSize: Fonts.sizes.base,
  },
});
