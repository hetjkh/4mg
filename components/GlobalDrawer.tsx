import * as React from 'react';
import { useRef, useState, useEffect, createContext, useContext } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Drawer } from 'react-native-drawer-layout';
import { router, usePathname } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getUser, logout, User } from '@/services/authService';

interface GlobalDrawerProps {
  children: React.ReactNode;
}

// Context to expose drawer open function
const DrawerContext = createContext<{ openDrawer: () => void } | null>(null);

export const useDrawer = () => {
  const context = useContext(DrawerContext);
  if (!context) {
    return { openDrawer: () => {} };
  }
  return context;
};

export function GlobalDrawer({ children }: GlobalDrawerProps) {
  const { isDark, colorScheme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const colors = Colors[colorScheme];
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<Drawer>(null);
  const pathname = usePathname();

  useEffect(() => {
    loadUser();
  }, []);

  // Close drawer when route changes
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const loadUser = async () => {
    try {
      const user = await getUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading user:', error);
      setCurrentUser(null);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      t('sidebar.logout'),
      t('sidebar.logoutConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('sidebar.logout'),
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return colors.roleAdmin;
      case 'stalkist': return colors.roleStalkist;
      case 'dellear': return colors.roleDellear;
      default: return colors.roleSalesman;
    }
  };

  const renderDrawerContent = () => {
    return (
      <View style={[styles.drawerContent, { backgroundColor: colors.background }]}>
        <View style={[styles.drawerHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Text style={[styles.drawerTitle, { color: colors.text, fontFamily: Fonts.bold }]}>
            {t('dashboard.menu')}
          </Text>
          {currentUser && (
            <View style={styles.drawerUserInfo}>
              <Text style={[styles.drawerUserName, { color: colors.text, fontFamily: Fonts.semiBold }]}>
                {currentUser.name}
              </Text>
              <Text style={[styles.drawerUserEmail, { color: colors.textSecondary, fontFamily: Fonts.light }]}>
                {currentUser.email}
              </Text>
              <View style={[styles.drawerRoleBadge, { backgroundColor: getRoleColor(currentUser.role || 'salesman') }]}>
                <Text style={[styles.drawerRoleText, { color: colors.textInverse, fontFamily: Fonts.bold }]}>
                  {currentUser.role?.toUpperCase() || 'SALESMAN'}
                </Text>
              </View>
            </View>
          )}
        </View>

        <ScrollView 
          style={styles.drawerMenu}
          contentContainerStyle={styles.drawerMenuContent}
          showsVerticalScrollIndicator={true}
        >
          {/* Theme Toggle */}
          <View style={[styles.drawerMenuItem, styles.drawerToggleItem, { borderBottomColor: colors.border }]}>
            <View style={styles.toggleLeft}>
              <IconSymbol name={isDark ? "moon" : "sun.max"} size={24} color={colors.primaryLight} />
              <Text style={[styles.drawerMenuItemText, { color: colors.text, fontFamily: Fonts.medium }]}>
                {isDark ? t('sidebar.darkMode') : t('sidebar.lightMode')}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.textInverse}
            />
          </View>

          {/* Language Toggle */}
          <View style={[styles.drawerMenuItem, styles.drawerToggleItem, { borderBottomColor: colors.border }]}>
            <View style={styles.toggleLeft}>
              <IconSymbol name="globe" size={24} color={colors.primaryLight} />
              <Text style={[styles.drawerMenuItemText, { color: colors.text, fontFamily: Fonts.medium }]}>
                {language === 'en' ? 'English' : 'ગુજરાતી'}
              </Text>
            </View>
            <Switch
              value={language === 'gu'}
              onValueChange={(value) => setLanguage(value ? 'gu' : 'en')}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.textInverse}
            />
          </View>

          {/* Home */}
          <TouchableOpacity
            style={[styles.drawerMenuItem, { borderBottomColor: colors.border }]}
            onPress={() => {
              setDrawerOpen(false);
              router.push('/(tabs)');
            }}
          >
            <IconSymbol name="house.fill" size={24} color={colors.primaryLight} />
            <Text style={[styles.drawerMenuItemText, { color: colors.text, fontFamily: Fonts.medium }]}>
              {t('sidebar.home')}
            </Text>
          </TouchableOpacity>

          {/* Register User - for admin, stalkist, dealer */}
          {currentUser && (currentUser.role === 'admin' || currentUser.role === 'stalkist' || currentUser.role === 'dellear') && (
            <TouchableOpacity
              style={[styles.drawerMenuItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                setDrawerOpen(false);
                router.push('/admin-register');
              }}
            >
              <IconSymbol name="person.badge.plus" size={24} color={colors.primaryLight} />
              <Text style={[styles.drawerMenuItemText, { color: colors.text, fontFamily: Fonts.medium }]}>
                {t('sidebar.registerUser')}
              </Text>
            </TouchableOpacity>
          )}

          {/* Admin Routes */}
          {currentUser && currentUser.role === 'admin' && (
            <>
              <TouchableOpacity
                style={[styles.drawerMenuItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setDrawerOpen(false);
                  router.push('/products');
                }}
              >
                <IconSymbol name="cube" size={24} color={colors.primaryLight} />
                <Text style={[styles.drawerMenuItemText, { color: colors.text, fontFamily: Fonts.medium }]}>
                  {t('sidebar.products')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.drawerMenuItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setDrawerOpen(false);
                  router.push('/dealer-requests');
                }}
              >
                <IconSymbol name="list.bullet" size={24} color={colors.primaryLight} />
                <Text style={[styles.drawerMenuItemText, { color: colors.text, fontFamily: Fonts.medium }]}>
                  {t('sidebar.dealerRequests')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.drawerMenuItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setDrawerOpen(false);
                  router.push('/manage-stalkists');
                }}
              >
                <IconSymbol name="person.3" size={24} color={colors.primaryLight} />
                <Text style={[styles.drawerMenuItemText, { color: colors.text, fontFamily: Fonts.medium }]}>
                  {t('sidebar.manageStalkists')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.drawerMenuItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setDrawerOpen(false);
                  router.push('/manage-admin-dealers');
                }}
              >
                <IconSymbol name="person.2" size={24} color={colors.primaryLight} />
                <Text style={[styles.drawerMenuItemText, { color: colors.text, fontFamily: Fonts.medium }]}>
                  {t('sidebar.manageDealers')}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Stalkist Routes */}
          {currentUser && currentUser.role === 'stalkist' && (
            <>
              <TouchableOpacity
                style={[styles.drawerMenuItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setDrawerOpen(false);
                  router.push('/manage-dealers');
                }}
              >
                <IconSymbol name="person.2" size={24} color={colors.primaryLight} />
                <Text style={[styles.drawerMenuItemText, { color: colors.text, fontFamily: Fonts.medium }]}>
                  {t('sidebar.manageDealers')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.drawerMenuItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setDrawerOpen(false);
                  router.push('/dealer-requests');
                }}
              >
                <IconSymbol name="list.bullet.rectangle.portrait" size={24} color={colors.primaryLight} />
                <Text style={[styles.drawerMenuItemText, { color: colors.text, fontFamily: Fonts.medium }]}>
                  {t('sidebar.dealerRequests')}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Dealer Routes */}
          {(currentUser?.role === 'dealer' || currentUser?.role === 'dellear') && (
            <>
              <TouchableOpacity
                style={[styles.drawerMenuItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setDrawerOpen(false);
                  router.push('/dealer-dashboard');
                }}
              >
                <IconSymbol name="cart" size={24} color={colors.primaryLight} />
                <Text style={[styles.drawerMenuItemText, { color: colors.text, fontFamily: Fonts.medium }]}>
                  {t('sidebar.dealerDashboard')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.drawerMenuItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setDrawerOpen(false);
                  router.push('/manage-salesmen');
                }}
              >
                <IconSymbol name="person.2" size={24} color={colors.primaryLight} />
                <Text style={[styles.drawerMenuItemText, { color: colors.text, fontFamily: Fonts.medium }]}>
                  {t('sidebar.manageSalesmen')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.drawerMenuItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setDrawerOpen(false);
                  router.push('/distribute-stock');
                }}
              >
                <IconSymbol name="cube" size={24} color={colors.primaryLight} />
                <Text style={[styles.drawerMenuItemText, { color: colors.text, fontFamily: Fonts.medium }]}>
                  {t('sidebar.distributeStock')}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Salesman Routes */}
          {currentUser && currentUser.role === 'salesman' && (
            <>
              <TouchableOpacity
                style={[styles.drawerMenuItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setDrawerOpen(false);
                  router.push('/my-stock');
                }}
              >
                <IconSymbol name="cube" size={24} color={colors.primaryLight} />
                <Text style={[styles.drawerMenuItemText, { color: colors.text, fontFamily: Fonts.medium }]}>
                  {t('sidebar.myStock')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.drawerMenuItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setDrawerOpen(false);
                  router.push('/my-locations');
                }}
              >
                <IconSymbol name="map" size={24} color={colors.primaryLight} />
                <Text style={[styles.drawerMenuItemText, { color: colors.text, fontFamily: Fonts.medium }]}>
                  My Locations
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Logout */}
          {currentUser && (
            <TouchableOpacity
              style={[styles.drawerMenuItem, { borderBottomColor: colors.border }]}
              onPress={handleLogout}
            >
              <IconSymbol name="arrow.right.square" size={24} color={colors.error} />
              <Text style={[styles.drawerMenuItemText, { color: colors.error, fontFamily: Fonts.medium }]}>
                {t('sidebar.logout')}
              </Text>
            </TouchableOpacity>
          )}

          {!currentUser && (
            <TouchableOpacity
              style={[styles.drawerMenuItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                setDrawerOpen(false);
                router.push('/login');
              }}
            >
              <IconSymbol name="person.fill" size={24} color={colors.primaryLight} />
              <Text style={[styles.drawerMenuItemText, { color: colors.text, fontFamily: Fonts.medium }]}>
                {t('sidebar.login')}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <DrawerContext.Provider value={{ openDrawer: () => setDrawerOpen(true) }}>
      <Drawer
        open={drawerOpen}
        onOpen={() => setDrawerOpen(true)}
        onClose={() => setDrawerOpen(false)}
        drawerType="front"
        renderDrawerContent={renderDrawerContent}
        drawerStyle={[
          { backgroundColor: colors.background, width: 280 },
          isDark && { backgroundColor: colors.background }
        ]}
      >
        <View style={{ flex: 1 }}>
          {children}
        </View>
      </Drawer>
    </DrawerContext.Provider>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  drawerHeader: {
    padding: 20,
    borderBottomWidth: 1,
  },
  drawerTitle: {
    fontSize: Fonts.sizes.xl,
    marginBottom: 16,
  },
  drawerUserInfo: {
    gap: 8,
  },
  drawerUserName: {
    fontSize: Fonts.sizes.base,
  },
  drawerUserEmail: {
    fontSize: Fonts.sizes.sm,
  },
  drawerRoleBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  drawerRoleText: {
    fontSize: Fonts.sizes.xs,
  },
  drawerMenu: {
    flex: 1,
  },
  drawerMenuContent: {
    paddingBottom: 20,
  },
  drawerMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 16,
    borderBottomWidth: 1,
  },
  drawerToggleItem: {
    justifyContent: 'space-between',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  drawerMenuItemText: {
    fontSize: Fonts.sizes.base,
    flex: 1,
  },
});

