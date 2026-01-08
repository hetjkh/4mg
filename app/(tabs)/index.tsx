import { StyleSheet, TouchableOpacity, Alert, View, Text, ScrollView, useColorScheme, ActivityIndicator } from 'react-native';
import { useState, useRef } from 'react';
import * as React from 'react';
import { Drawer } from 'react-native-drawer-layout';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router, useFocusEffect } from 'expo-router';
import { useColorScheme as useAppColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { getUser, logout, User, getUserCounts, UserCounts } from '@/services/authService';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function HomeScreen() {
  const colorScheme = useAppColorScheme();
  const systemColorScheme = useColorScheme();
  const isDark = systemColorScheme === 'dark';
  const buttonColor = Colors[colorScheme ?? 'light'].tint;
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<Drawer>(null);
  const [userCounts, setUserCounts] = useState<UserCounts | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(false);

  const loadUser = async () => {
    try {
      const user = await getUser();
      console.log('Loaded user:', user);
      console.log('User role:', user?.role);
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading user:', error);
      setCurrentUser(null);
    }
  };

  const loadUserCounts = async () => {
    if (currentUser?.role !== 'admin') {
      setUserCounts(null);
      return;
    }

    try {
      setLoadingCounts(true);
      const counts = await getUserCounts();
      setUserCounts(counts);
    } catch (error) {
      console.error('Error loading user counts:', error);
    } finally {
      setLoadingCounts(false);
    }
  };

  React.useEffect(() => {
    loadUser();
  }, []);

  React.useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadUserCounts();
    }
  }, [currentUser]);

  // Reload user when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadUser();
      if (currentUser?.role === 'admin') {
        loadUserCounts();
      }
    }, [currentUser])
  );

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            setCurrentUser(null);
            setDrawerOpen(false);
            router.replace('/login');
          },
        },
      ]
    );
  };

  const renderDrawerContent = () => {
    return (
      <View style={[styles.drawerContent, { backgroundColor: isDark ? '#111827' : '#FFFFFF' }]}>
        <View style={styles.drawerHeader}>
          <Text style={[styles.drawerTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
            Menu
          </Text>
          {currentUser && (
            <View style={styles.drawerUserInfo}>
              <Text style={[styles.drawerUserName, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {currentUser.name}
              </Text>
              <Text style={[styles.drawerUserEmail, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                {currentUser.email}
              </Text>
              <View style={[styles.drawerRoleBadge, {
                backgroundColor: currentUser.role === 'admin' ? '#DC2626' : 
                                 currentUser.role === 'stalkist' ? '#059669' :
                                 currentUser.role === 'dellear' ? '#7C3AED' : '#2563EB'
              }]}>
                <Text style={styles.drawerRoleText}>
                  {currentUser.role?.toUpperCase() || 'SALESMAN'}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.drawerMenu}>
          {(() => {
            const canRegister = currentUser && (
              currentUser.role === 'admin' || 
              currentUser.role === 'stalkist' || 
              currentUser.role === 'dellear'
            );
            console.log('Can register check:', {
              currentUser: currentUser?.role,
              canRegister
            });
            return canRegister ? (
              <TouchableOpacity
                style={[styles.drawerMenuItem, { borderBottomColor: isDark ? '#374151' : '#E5E7EB' }]}
                onPress={() => {
                  setDrawerOpen(false);
                  router.push('/admin-register');
                }}
              >
                <IconSymbol name="person.badge.plus" size={24} color={isDark ? '#60A5FA' : '#2563EB'} />
                <Text style={[styles.drawerMenuItemText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  Register User
                </Text>
              </TouchableOpacity>
            ) : null;
          })()}

          {currentUser && currentUser.role === 'admin' && (
            <TouchableOpacity
              style={[styles.drawerMenuItem, { borderBottomColor: isDark ? '#374151' : '#E5E7EB' }]}
              onPress={() => {
                setDrawerOpen(false);
                router.push('/products');
              }}
            >
              <IconSymbol name="cube" size={24} color={isDark ? '#60A5FA' : '#2563EB'} />
              <Text style={[styles.drawerMenuItemText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                Products
              </Text>
            </TouchableOpacity>
          )}

          {!currentUser && (
            <TouchableOpacity
              style={[styles.drawerMenuItem, { borderBottomColor: isDark ? '#374151' : '#E5E7EB' }]}
              onPress={() => {
                setDrawerOpen(false);
                router.push('/login');
              }}
            >
              <IconSymbol name="person.fill" size={24} color={isDark ? '#60A5FA' : '#2563EB'} />
              <Text style={[styles.drawerMenuItemText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                Login
              </Text>
            </TouchableOpacity>
          )}

          {currentUser && (
            <TouchableOpacity
              style={[styles.drawerMenuItem, { borderBottomColor: isDark ? '#374151' : '#E5E7EB' }]}
              onPress={handleLogout}
            >
              <IconSymbol name="arrow.right.square" size={24} color="#DC2626" />
              <Text style={[styles.drawerMenuItemText, { color: '#DC2626' }]}>
                Logout
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <Drawer
      ref={drawerRef}
      open={drawerOpen}
      onOpen={() => setDrawerOpen(true)}
      onClose={() => setDrawerOpen(false)}
      drawerType="front"
      renderDrawerContent={renderDrawerContent}
      drawerStyle={styles.drawer}
    >
      <ThemedView style={styles.container}>
        <View style={[styles.header, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB' }]}>
          <TouchableOpacity
            onPress={() => setDrawerOpen(true)}
            style={styles.menuButton}
          >
            <IconSymbol name="line.3.horizontal" size={28} color={isDark ? '#FFFFFF' : '#111827'} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            Dashboard
          </ThemedText>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {currentUser ? (
            <ThemedView style={styles.userInfoContainer}>
              <ThemedView style={styles.userCard}>
                <ThemedText type="defaultSemiBold" style={styles.welcomeText}>
                  Welcome back,
                </ThemedText>
                <ThemedText style={styles.userName}>{currentUser.name}</ThemedText>
                <ThemedText style={styles.userEmail}>{currentUser.email}</ThemedText>
                <ThemedView style={styles.roleBadge}>
                  <ThemedText style={[styles.roleText, { 
                    color: currentUser.role === 'admin' ? '#DC2626' : 
                           currentUser.role === 'stalkist' ? '#059669' :
                           currentUser.role === 'dellear' ? '#7C3AED' : '#2563EB'
                  }]}>
                    {currentUser.role?.toUpperCase() || 'SALESMAN'}
                  </ThemedText>
                </ThemedView>
                
                {/* Temporary Register Button for Testing */}
                {(currentUser.role === 'admin' || currentUser.role === 'stalkist' || currentUser.role === 'dellear') && (
                  <TouchableOpacity
                    style={[styles.registerButton, { backgroundColor: buttonColor }]}
                    onPress={() => router.push('/admin-register')}
                  >
                    <ThemedText type="defaultSemiBold" style={styles.buttonText}>
                      Register User
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </ThemedView>

              {/* Admin User Count Widgets */}
              {currentUser.role === 'admin' && (
                <ThemedView style={styles.widgetsContainer}>
                  <ThemedText type="subtitle" style={styles.widgetsTitle}>
                    User Statistics
                  </ThemedText>
                  
                  {loadingCounts ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={isDark ? '#60A5FA' : '#2563EB'} />
                    </View>
                  ) : userCounts ? (
                    <View style={styles.widgetsGrid}>
                      {/* Stalkist Widget */}
                      <View style={[styles.widgetCard, { 
                        backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                        borderColor: '#059669',
                      }]}>
                        <View style={[styles.widgetIconContainer, { backgroundColor: '#059669' }]}>
                          <Text style={styles.widgetIcon}>👥</Text>
                        </View>
                        <Text style={[styles.widgetLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                          Stalkist
                        </Text>
                        <Text style={[styles.widgetCount, { color: '#059669' }]}>
                          {userCounts.stalkist}
                        </Text>
                      </View>

                      {/* Dellear Widget */}
                      <View style={[styles.widgetCard, { 
                        backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                        borderColor: '#7C3AED',
                      }]}>
                        <View style={[styles.widgetIconContainer, { backgroundColor: '#7C3AED' }]}>
                          <Text style={styles.widgetIcon}>🏪</Text>
                        </View>
                        <Text style={[styles.widgetLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                          Dellear
                        </Text>
                        <Text style={[styles.widgetCount, { color: '#7C3AED' }]}>
                          {userCounts.dellear}
                        </Text>
                      </View>

                      {/* Salesman Widget */}
                      <View style={[styles.widgetCard, { 
                        backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                        borderColor: '#2563EB',
                      }]}>
                        <View style={[styles.widgetIconContainer, { backgroundColor: '#2563EB' }]}>
                          <Text style={styles.widgetIcon}>💼</Text>
                        </View>
                        <Text style={[styles.widgetLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                          Salesman
                        </Text>
                        <Text style={[styles.widgetCount, { color: '#2563EB' }]}>
                          {userCounts.salesman}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </ThemedView>
              )}
            </ThemedView>
          ) : (
            <ThemedView style={styles.loginPrompt}>
              <ThemedText type="subtitle">Please login to continue</ThemedText>
              <TouchableOpacity
                style={[styles.loginButton, { backgroundColor: buttonColor }]}
                onPress={() => router.push('/login')}
              >
                <ThemedText type="defaultSemiBold" style={styles.buttonText}>
                  Go to Login
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          )}
        </ScrollView>
      </ThemedView>
    </Drawer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    flexGrow: 1,
  },
  userInfoContainer: {
    marginTop: 16,
  },
  userCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    gap: 12,
  },
  welcomeText: {
    fontSize: 16,
    opacity: 0.8,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  roleBadge: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  loginPrompt: {
    marginTop: 32,
    alignItems: 'center',
    gap: 16,
  },
  loginButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetsContainer: {
    marginTop: 24,
    gap: 16,
  },
  widgetsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  widgetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  widgetCard: {
    flex: 1,
    minWidth: '30%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    gap: 8,
  },
  widgetIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  widgetIcon: {
    fontSize: 24,
  },
  widgetLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  widgetCount: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  drawer: {
    width: 280,
  },
  drawerContent: {
    flex: 1,
    paddingTop: 60,
  },
  drawerHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  drawerUserInfo: {
    gap: 8,
  },
  drawerUserName: {
    fontSize: 18,
    fontWeight: '600',
  },
  drawerUserEmail: {
    fontSize: 14,
  },
  drawerRoleBadge: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  drawerRoleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  drawerMenu: {
    paddingTop: 8,
  },
  drawerMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  drawerMenuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
