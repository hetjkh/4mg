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

  const loadUserCounts = React.useCallback(async () => {
    try {
      setLoadingCounts(true);
      const counts = await getUserCounts();
      setUserCounts(counts);
    } catch (error) {
      console.error('Error loading user counts:', error);
      setUserCounts(null);
    } finally {
      setLoadingCounts(false);
    }
  }, []);

  const loadUser = React.useCallback(async () => {
    try {
      const user = await getUser();
      setCurrentUser(user);
      
      // Load counts if user is admin
      if (user?.role === 'admin') {
        loadUserCounts();
      } else {
        setUserCounts(null);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setCurrentUser(null);
      setUserCounts(null);
    }
  }, [loadUserCounts]);

  React.useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Reload user when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadUser();
    }, [loadUser])
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
      <View style={styles.drawerContent}>
        <View style={styles.drawerHeader}>
          <Text style={styles.drawerTitle}>
            Menu
          </Text>
          {currentUser && (
            <View style={styles.drawerUserInfo}>
              <Text style={styles.drawerUserName}>
                {currentUser.name}
              </Text>
              <Text style={styles.drawerUserEmail}>
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
            return canRegister ? (
              <TouchableOpacity
                style={styles.drawerMenuItem}
                onPress={() => {
                  setDrawerOpen(false);
                  router.push('/admin-register');
                }}
              >
                <IconSymbol name="person.badge.plus" size={24} color="#60A5FA" />
                <Text style={styles.drawerMenuItemText}>
                  Register User
                </Text>
              </TouchableOpacity>
            ) : null;
          })()}

          {currentUser && currentUser.role === 'admin' && (
            <>
              <TouchableOpacity
                style={styles.drawerMenuItem}
                onPress={() => {
                  setDrawerOpen(false);
                  router.push('/products');
                }}
              >
                <IconSymbol name="cube" size={24} color="#60A5FA" />
                <Text style={styles.drawerMenuItemText}>
                  Products
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.drawerMenuItem}
                onPress={() => {
                  setDrawerOpen(false);
                  router.push('/dealer-requests');
                }}
              >
                <IconSymbol name="list.bullet" size={24} color="#60A5FA" />
                <Text style={styles.drawerMenuItemText}>
                  Dealer Requests
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.drawerMenuItem}
                onPress={() => {
                  setDrawerOpen(false);
                  router.push('/manage-stalkists');
                }}
              >
                <IconSymbol name="person.3" size={24} color="#60A5FA" />
                <Text style={styles.drawerMenuItemText}>
                  Manage Stalkists
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.drawerMenuItem}
                onPress={() => {
                  setDrawerOpen(false);
                  router.push('/manage-admin-dealers');
                }}
              >
                <IconSymbol name="person.2" size={24} color="#60A5FA" />
                <Text style={styles.drawerMenuItemText}>
                  Manage Dealers
                </Text>
              </TouchableOpacity>
            </>
          )}

          {currentUser && currentUser.role === 'stalkist' && (
            <>
              <TouchableOpacity
                style={styles.drawerMenuItem}
                onPress={() => {
                  setDrawerOpen(false);
                  router.push('/manage-dealers');
                }}
              >
                <IconSymbol name="person.2" size={24} color="#60A5FA" />
                <Text style={styles.drawerMenuItemText}>
                  Manage Dealers
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.drawerMenuItem}
                onPress={() => {
                  setDrawerOpen(false);
                  router.push('/dealer-requests');
                }}
              >
                <IconSymbol name="list.bullet.rectangle.portrait" size={24} color="#60A5FA" />
                <Text style={styles.drawerMenuItemText}>
                  Dealer Requests
                </Text>
              </TouchableOpacity>
            </>
          )}

          {(currentUser?.role === 'dealer' || currentUser?.role === 'dellear') && (
            <>
              <TouchableOpacity
                style={styles.drawerMenuItem}
                onPress={() => {
                  setDrawerOpen(false);
                  router.push('/dealer-dashboard');
                }}
              >
                <IconSymbol name="cart" size={24} color="#60A5FA" />
                <Text style={styles.drawerMenuItemText}>
                  Dealer Dashboard
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.drawerMenuItem}
                onPress={() => {
                  setDrawerOpen(false);
                  router.push('/manage-salesmen');
                }}
              >
                <IconSymbol name="person.2" size={24} color="#60A5FA" />
                <Text style={styles.drawerMenuItemText}>
                  Manage Salesmen
                </Text>
              </TouchableOpacity>
            </>
          )}

          {!currentUser && (
            <TouchableOpacity
              style={styles.drawerMenuItem}
              onPress={() => {
                setDrawerOpen(false);
                router.push('/login');
              }}
            >
              <IconSymbol name="person.fill" size={24} color="#60A5FA" />
              <Text style={styles.drawerMenuItemText}>
                Login
              </Text>
            </TouchableOpacity>
          )}

          {currentUser && (
            <TouchableOpacity
              style={styles.drawerMenuItem}
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
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setDrawerOpen(true)}
            style={styles.menuButton}
          >
            <IconSymbol name="line.3.horizontal" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Dashboard
          </Text>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {currentUser ? (
            <View style={styles.userInfoContainer}>
              <View style={styles.userCard}>
                <Text style={styles.welcomeText}>
                  Welcome back,
                </Text>
                <Text style={styles.userName}>{currentUser.name}</Text>
                <Text style={styles.userEmail}>{currentUser.email}</Text>
                <View style={styles.roleBadge}>
                  <Text style={[styles.roleText, { 
                    color: currentUser.role === 'admin' ? '#DC2626' : 
                           currentUser.role === 'stalkist' ? '#059669' :
                           currentUser.role === 'dellear' ? '#7C3AED' : '#2563EB'
                  }]}>
                    {currentUser.role?.toUpperCase() || 'SALESMAN'}
                  </Text>
                </View>
              </View>

              {/* Admin User Count Widgets */}
              {currentUser.role === 'admin' && (
                <View style={styles.widgetsContainer}>
                  <Text style={styles.widgetsTitle}>
                    User Statistics
                  </Text>
                  
                  {loadingCounts ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#60A5FA" />
                    </View>
                  ) : userCounts ? (
                    <View style={styles.widgetsGrid}>
                      {/* Stalkist Widget */}
                      <View style={styles.widgetCard}>
                        <View style={[styles.widgetIconContainer, { backgroundColor: '#059669' }]}>
                          <Text style={styles.widgetIcon}>👥</Text>
                        </View>
                        <Text style={styles.widgetLabel}>
                          Stalkist
                        </Text>
                        <Text style={[styles.widgetCount, { color: '#059669' }]}>
                          {userCounts.stalkist}
                        </Text>
                      </View>

                      {/* Dellear Widget */}
                      <View style={styles.widgetCard}>
                        <View style={[styles.widgetIconContainer, { backgroundColor: '#7C3AED' }]}>
                          <Text style={styles.widgetIcon}>🏪</Text>
                        </View>
                        <Text style={styles.widgetLabel}>
                          Dellear
                        </Text>
                        <Text style={[styles.widgetCount, { color: '#7C3AED' }]}>
                          {userCounts.dellear}
                        </Text>
                      </View>

                      {/* Salesman Widget */}
                      <View style={styles.widgetCard}>
                        <View style={[styles.widgetIconContainer, { backgroundColor: '#2563EB' }]}>
                          <Text style={styles.widgetIcon}>💼</Text>
                        </View>
                        <Text style={styles.widgetLabel}>
                          Salesman
                        </Text>
                        <Text style={[styles.widgetCount, { color: '#2563EB' }]}>
                          {userCounts.salesman}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.loginPrompt}>
              <Text style={styles.loginPromptText}>Please login to continue</Text>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => router.push('/login')}
              >
                <Text style={styles.buttonText}>
                  Go to Login
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Drawer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
    backgroundColor: '#000000',
  },
  menuButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#000000',
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
    backgroundColor: '#1D1D1D',
    gap: 12,
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: 'Poppins-Light',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  userName: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: 'Poppins-Light',
    color: '#FFFFFF',
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
    fontFamily: 'Poppins-Bold',
    letterSpacing: 1,
  },
  loginPrompt: {
    marginTop: 32,
    alignItems: 'center',
    gap: 16,
  },
  loginPromptText: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  loginButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  registerButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
  },
  widgetsContainer: {
    marginTop: 24,
    gap: 16,
  },
  widgetsTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
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
    backgroundColor: '#1D1D1D',
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
    fontFamily: 'Poppins-Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
  widgetCount: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
  },
  drawer: {
    width: 280,
    backgroundColor: '#000000',
  },
  drawerContent: {
    flex: 1,
    paddingTop: 60,
    backgroundColor: '#000000',
  },
  drawerHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
    backgroundColor: '#000000',
  },
  drawerTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  drawerUserInfo: {
    gap: 8,
  },
  drawerUserName: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  drawerUserEmail: {
    fontSize: 14,
    fontFamily: 'Poppins-Light',
    color: '#9CA3AF',
  },
  drawerRoleBadge: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#E5E7EB',
  },
  drawerRoleText: {
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 1,
    color: '#111827',
  },
  drawerMenu: {
    paddingTop: 8,
  },
  drawerMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
    gap: 12,
  },
  drawerMenuItemText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
  },
});
