import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, useColorScheme, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { registerUser, getAllowedRoles, getUser } from '@/services/authService';

type UserRole = 'admin' | 'stalkist' | 'dellear' | 'salesman';

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  stalkist: 'Stalkist',
  dellear: 'Dellear',
  salesman: 'Salesman',
};

export default function AdminRegisterScreen() {
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
      style={[styles.container, { backgroundColor: isDark ? '#111827' : '#1D1D1D' }]}
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
            <Text style={[styles.title, { color: isDark ? '#1D1D1D' : '#111827' }]}>
              Register New User
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#4B5563' }]}>
              {getSubtitle()}
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
            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                Full Name
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                    borderColor: isDark ? '#374151' : '#E5E7EB',
                    color: isDark ? '#1D1D1D' : '#111827',
                  },
                ]}
                placeholder="Enter full name"
                placeholderTextColor="#9CA3AF"
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
              <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                Email
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                    borderColor: isDark ? '#374151' : '#E5E7EB',
                    color: isDark ? '#1D1D1D' : '#111827',
                  },
                ]}
                placeholder="Enter email"
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

            {/* Role Selection */}
            {loadingRoles ? (
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                  Role
                </Text>
                <ActivityIndicator size="small" color={isDark ? '#60A5FA' : '#2563EB'} />
              </View>
            ) : allowedRoles.length > 0 ? (
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                  Role
                </Text>
                {allowedRoles.length === 1 ? (
                  <View style={[styles.singleRoleContainer, {
                    backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                    borderColor: isDark ? '#374151' : '#E5E7EB',
                  }]}>
                    <Text style={[styles.singleRoleText, { color: isDark ? '#1D1D1D' : '#111827' }]}>
                      {roleLabels[allowedRoles[0]]}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.roleContainer}>
                    {allowedRoles.map((roleOption) => (
                      <TouchableOpacity
                        key={roleOption}
                        onPress={() => {
                          setRole(roleOption);
                          setError('');
                        }}
                        style={[
                          styles.roleButton,
                          {
                            backgroundColor: role === roleOption
                              ? (isDark ? '#3B82F6' : '#2563EB')
                              : (isDark ? '#374151' : '#E5E7EB'),
                            borderColor: role === roleOption
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
                              color: role === roleOption
                                ? '#1D1D1D'
                                : (isDark ? '#D1D5DB' : '#374151'),
                            },
                          ]}
                        >
                          {roleLabels[roleOption]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ) : null}

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
                    color: isDark ? '#1D1D1D' : '#111827',
                  },
                ]}
                placeholder="Create password"
                placeholderTextColor="#9CA3AF"
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
              <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                Confirm Password
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                    borderColor: isDark ? '#374151' : '#E5E7EB',
                    color: isDark ? '#1D1D1D' : '#111827',
                  },
                ]}
                placeholder="Confirm password"
                placeholderTextColor="#9CA3AF"
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
                backgroundColor: isDark ? '#3B82F6' : '#2563EB',
                opacity: loading ? 0.6 : 1,
              }
            ]}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#1D1D1D" />
            ) : (
              <Text style={styles.registerButtonText}>
                Register User
              </Text>
            )}
          </TouchableOpacity>

          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={[styles.backButtonText, { color: isDark ? '#9CA3AF' : '#4B5563' }]}>
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
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  singleRoleContainer: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  singleRoleText: {
    fontSize: 16,
    fontWeight: '600',
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
    color: '#1D1D1D',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
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
});

