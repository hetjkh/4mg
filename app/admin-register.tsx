import { Colors, Fonts } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { getAllowedRoles, getUser, registerUser } from '@/services/authService';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type UserRole = 'admin' | 'stalkist' | 'dellear' | 'salesman';

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  stalkist: 'Stalkist',
  dellear: 'Dellear',
  salesman: 'Salesman',
};

export default function AdminRegisterScreen() {
  const { isDark, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('salesman');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [allowedRoles, setAllowedRoles] = useState<UserRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  useEffect(() => {
    loadAllowedRoles();
  }, []);

  const loadAllowedRoles = async () => {
    try {
      setLoadingRoles(true);
      const user = await getUser();
      if (user) {
        setCurrentUserRole(user.role);
      }
      const roles = await getAllowedRoles();
      const validRoles = roles.filter((r): r is UserRole => 
        ['admin', 'stalkist', 'dellear', 'salesman'].includes(r)
      ) as UserRole[];
      setAllowedRoles(validRoles);
      if (validRoles.length > 0) {
        setRole(validRoles[0]);
      }
    } catch (err: any) {
      console.error('Error loading allowed roles:', err);
      Alert.alert('Error', 'Failed to load allowed roles. Please try again.');
      router.back();
    } finally {
      setLoadingRoles(false);
    }
  };

  const getSubtitle = () => {
    if (currentUserRole === 'admin') {
      return 'Admin - Create user account with any role';
    } else if (currentUserRole === 'stalkist') {
      return 'Stalkist - Create Dellear account';
    } else if (currentUserRole === 'dellear') {
      return 'Dellear - Create Salesman account';
    }
    return 'Create user account';
  };

  const handleRegister = async () => {
    // Validation
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await registerUser(name.trim(), email.trim(), password, role);
      
      if (response.success) {
        Alert.alert('Success', 'User registered successfully!', [
          {
            text: 'OK',
            onPress: () => {
              // Clear form
              setName('');
              setEmail('');
              setPassword('');
              setConfirmPassword('');
              setRole('salesman');
              // If dealer created a salesman, go back to manage salesmen page
              if (currentUserRole === 'dellear' || currentUserRole === 'dealer') {
                router.push('/manage-salesmen');
              }
              // If stalkist created a dealer, go back to manage dealers page
              if (currentUserRole === 'stalkist') {
                router.push('/manage-dealers');
              }
              // If admin created a dealer, go back to manage dealers page
              if (currentUserRole === 'admin' && (role === 'dealer' || role === 'dellear')) {
                router.push('/manage-admin-dealers');
              }
              // If admin created a stalkist, go back to manage stalkists page
              if (currentUserRole === 'admin' && role === 'stalkist') {
                router.push('/manage-stalkists');
              }
            },
          },
        ]);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      Alert.alert('Error', err.message || 'Registration failed. Please try again.');
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
              Register New User
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: Fonts.light }]}>
              {getSubtitle()}
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
            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.textSecondary, fontFamily: Fonts.medium }]}>
                Full Name
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
                placeholder="Enter full name"
                placeholderTextColor={colors.inputPlaceholder}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setError('');
                }}
                autoCapitalize="words"
                autoComplete="name"
                editable={!loading}
              />
            </View>

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
                placeholder="Enter email"
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

            {/* Role Selection */}
            {loadingRoles ? (
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.textSecondary, fontFamily: Fonts.medium }]}>
                  Role
                </Text>
                <ActivityIndicator size="small" color={colors.primaryLight} />
              </View>
            ) : allowedRoles.length > 0 ? (
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.textSecondary, fontFamily: Fonts.medium }]}>
                  Role
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownButton,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                  onPress={() => {
                    if (allowedRoles.length > 1) {
                      setShowRoleDropdown(true);
                    }
                  }}
                  disabled={loading || allowedRoles.length === 1}
                >
                  <Text style={[styles.dropdownButtonText, { color: colors.inputText, fontFamily: Fonts.regular }]}>
                    {roleLabels[role]}
                  </Text>
                  {allowedRoles.length > 1 && (
                    <Text style={[styles.dropdownArrow, { color: colors.textTertiary }]}>▼</Text>
                  )}
                </TouchableOpacity>

                {/* Role Dropdown Modal */}
                <Modal
                  visible={showRoleDropdown}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => setShowRoleDropdown(false)}
                >
                  <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowRoleDropdown(false)}
                  >
                    <View 
                      style={[styles.dropdownModal, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                      onStartShouldSetResponder={() => true}
                    >
                      <Text style={[styles.dropdownTitle, { color: colors.text, fontFamily: Fonts.semiBold, borderBottomColor: colors.border }]}>
                        Select Role
                      </Text>
                      <ScrollView style={styles.dropdownList}>
                        {allowedRoles.map((roleOption) => (
                          <TouchableOpacity
                            key={roleOption}
                            onPress={() => {
                              setRole(roleOption);
                              setError('');
                              setShowRoleDropdown(false);
                            }}
                              style={[
                              styles.dropdownItem,
                              {
                                backgroundColor: role === roleOption
                                  ? `${colors.primary}20`
                                  : 'transparent',
                                borderLeftColor: role === roleOption
                                  ? colors.primary
                                  : 'transparent',
                                borderBottomColor: colors.borderSecondary,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                {
                                  color: role === roleOption
                                    ? colors.primary
                                    : colors.text,
                                  fontFamily: role === roleOption ? Fonts.semiBold : Fonts.regular,
                                },
                              ]}
                            >
                              {roleLabels[roleOption]}
                            </Text>
                            {role === roleOption && (
                              <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </TouchableOpacity>
                </Modal>
              </View>
            ) : null}

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
                placeholder="Create password"
                placeholderTextColor={colors.inputPlaceholder}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError('');
                }}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                editable={!loading}
              />
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.textSecondary, fontFamily: Fonts.medium }]}>
                Confirm Password
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
                placeholder="Confirm password"
                placeholderTextColor={colors.inputPlaceholder}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setError('');
                }}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                editable={!loading}
              />
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            onPress={handleRegister}
            style={[
              styles.registerButton, 
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
              <Text style={[styles.registerButtonText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>
                Register User
              </Text>
            )}
          </TouchableOpacity>

          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={[styles.backButtonText, { color: colors.textTertiary, fontFamily: Fonts.medium }]}>
              Back to Dashboard
            </Text>
          </TouchableOpacity>
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
  dropdownButton: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dropdownButtonText: {
    fontSize: Fonts.sizes.base,
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    width: '80%',
    maxWidth: 400,
    maxHeight: '60%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownTitle: {
    fontSize: Fonts.sizes.lg,
    padding: 16,
    borderBottomWidth: 1,
  },
  dropdownList: {
    maxHeight: 300,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderLeftWidth: 3,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: Fonts.sizes.base,
    flex: 1,
  },
  checkmark: {
    fontSize: 18,
    marginLeft: 8,
  },
  registerButton: {
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
  registerButtonText: {
    fontSize: Fonts.sizes.base,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
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
});

