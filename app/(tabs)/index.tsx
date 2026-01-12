import * as React from 'react';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AreaChart, BarChart, DonutChart, LineChart, PieChart } from '@/components/charts';
import { HeaderWithMenu } from '@/components/HeaderWithMenu';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getUser, getUserCounts, User, UserCounts } from '@/services/authService';
import { getRoleDistributionData, getStatisticsData } from '@/services/statisticsService';
import { router, useFocusEffect } from 'expo-router';

export default function HomeScreen() {
  const { isDark, colorScheme } = useTheme();
  const { t } = useLanguage();
  const colors = Colors[colorScheme];
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userCounts, setUserCounts] = useState<UserCounts | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [statisticsData, setStatisticsData] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

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

  const loadStatistics = React.useCallback(async () => {
    try {
      setLoadingStats(true);
      const stats = await getStatisticsData();
      setStatisticsData(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
      setStatisticsData(null);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const loadUser = React.useCallback(async () => {
    try {
      const user = await getUser();
      setCurrentUser(user);
      
      // Load counts if user is admin
      if (user?.role === 'admin') {
        loadUserCounts();
        loadStatistics();
      } else {
        setUserCounts(null);
        setStatisticsData(null);
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


  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return colors.roleAdmin;
      case 'stalkist': return colors.roleStalkist;
      case 'dellear': return colors.roleDellear;
      default: return colors.roleSalesman;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HeaderWithMenu title={t('dashboard.dashboard')} />

        <ScrollView style={[styles.content, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
          {currentUser ? (
            <View style={styles.userInfoContainer}>
              <View style={[styles.userCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <Text style={[styles.welcomeText, { color: colors.textSecondary, fontFamily: Fonts.light }]}>
                  {t('dashboard.welcomeBack')}
                </Text>
                <Text style={[styles.userName, { color: colors.text, fontFamily: Fonts.bold }]}>{currentUser.name}</Text>
                <Text style={[styles.userEmail, { color: colors.textSecondary, fontFamily: Fonts.light }]}>{currentUser.email}</Text>
                <View style={[styles.roleBadge, { backgroundColor: `${getRoleColor(currentUser.role || 'salesman')}20` }]}>
                  <Text style={[styles.roleText, { 
                    color: getRoleColor(currentUser.role || 'salesman'),
                    fontFamily: Fonts.bold
                  }]}>
                    {currentUser.role?.toUpperCase() || 'SALESMAN'}
                  </Text>
                </View>
              </View>

              {/* Admin User Count Widgets */}
              {currentUser.role === 'admin' && (
                <View style={styles.widgetsContainer}>
                  <Text style={[styles.widgetsTitle, { color: colors.text, fontFamily: Fonts.bold }]}>
                    {t('dashboard.userStatistics')}
                  </Text>
                  
                  {loadingCounts ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={colors.primaryLight} />
                    </View>
                  ) : userCounts ? (
                    <View style={styles.widgetsGrid}>
                      {/* Stalkist Widget */}
                      <View style={[
                        styles.widgetCard, 
                        { 
                          backgroundColor: colors.cardBackground, 
                          borderColor: colors.border,
                          borderLeftWidth: 4,
                          borderLeftColor: colors.roleStalkist,
                        }
                      ]}>
                        <View style={styles.widgetHeader}>
                          <View style={[styles.widgetIconContainer, { backgroundColor: `${colors.roleStalkist}15` }]}>
                            <IconSymbol name="person.3" size={24} color={colors.roleStalkist} />
                          </View>
                          <View style={styles.widgetContent}>
                            <Text style={[styles.widgetLabel, { color: colors.textSecondary, fontFamily: Fonts.medium }]}>
                              Stalkist
                            </Text>
                            <Text style={[styles.widgetCount, { color: colors.text, fontFamily: Fonts.bold }]}>
                              {userCounts.stalkist}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Dellear Widget */}
                      <View style={[
                        styles.widgetCard, 
                        { 
                          backgroundColor: colors.cardBackground, 
                          borderColor: colors.border,
                          borderLeftWidth: 4,
                          borderLeftColor: colors.roleDellear,
                        }
                      ]}>
                        <View style={styles.widgetHeader}>
                          <View style={[styles.widgetIconContainer, { backgroundColor: `${colors.roleDellear}15` }]}>
                            <IconSymbol name="person.2" size={24} color={colors.roleDellear} />
                          </View>
                          <View style={styles.widgetContent}>
                            <Text style={[styles.widgetLabel, { color: colors.textSecondary, fontFamily: Fonts.medium }]}>
                              Dellear
                            </Text>
                            <Text style={[styles.widgetCount, { color: colors.text, fontFamily: Fonts.bold }]}>
                              {userCounts.dellear}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Salesman Widget */}
                      <View style={[
                        styles.widgetCard, 
                        { 
                          backgroundColor: colors.cardBackground, 
                          borderColor: colors.border,
                          borderLeftWidth: 4,
                          borderLeftColor: colors.roleSalesman,
                        }
                      ]}>
                        <View style={styles.widgetHeader}>
                          <View style={[styles.widgetIconContainer, { backgroundColor: `${colors.roleSalesman}15` }]}>
                            <IconSymbol name="person.fill" size={24} color={colors.roleSalesman} />
                          </View>
                          <View style={styles.widgetContent}>
                            <Text style={[styles.widgetLabel, { color: colors.textSecondary, fontFamily: Fonts.medium }]}>
                              Salesman
                            </Text>
                            <Text style={[styles.widgetCount, { color: colors.text, fontFamily: Fonts.bold }]}>
                              {userCounts.salesman}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ) : null}
                </View>
              )}

              {/* Charts Section - Admin Only */}
              {currentUser.role === 'admin' && (
                <View style={styles.chartsContainer}>
                  <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.bold }]}>
                    {t('dashboard.analyticsInsights')}
                  </Text>

                  {loadingStats ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={colors.primaryLight} />
                      <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: Fonts.light }]}>
                        {t('dashboard.loadingStatistics')}
                      </Text>
                    </View>
                  ) : statisticsData && userCounts ? (
                    <>
                      {/* Role Distribution - Pie Chart */}
                      {userCounts.stalkist + userCounts.dellear + userCounts.salesman > 0 && (
                        <PieChart
                          data={getRoleDistributionData(userCounts.stalkist, userCounts.dellear, userCounts.salesman)}
                          title="Role Distribution"
                        />
                      )}

                      {/* Role Distribution - Donut Chart */}
                      {userCounts.stalkist + userCounts.dellear + userCounts.salesman > 0 && (
                        <DonutChart
                          data={getRoleDistributionData(userCounts.stalkist, userCounts.dellear, userCounts.salesman)}
                          title="User Distribution"
                          centerValue={userCounts.stalkist + userCounts.dellear + userCounts.salesman}
                          centerLabel="Total Users"
                        />
                      )}

                      {/* User Growth - Line Chart */}
                      {statisticsData.userGrowth && statisticsData.userGrowth.length > 0 && (
                        <LineChart
                          data={statisticsData.userGrowth}
                          title="User Growth (Last 7 Days)"
                          color={colors.primary}
                        />
                      )}

                      {/* Monthly Users - Bar Chart */}
                      {statisticsData.monthlyUsers && statisticsData.monthlyUsers.length > 0 && (
                        <BarChart
                          data={statisticsData.monthlyUsers.map((item: any) => ({
                            ...item,
                            color: colors.roleStalkist,
                          }))}
                          title="Monthly User Registration"
                        />
                      )}

                      {/* Sales Trend - Area Chart */}
                      {statisticsData.salesTrend && statisticsData.salesTrend.length > 0 && (
                        <AreaChart
                          data={statisticsData.salesTrend}
                          title="Sales Trend (Last 7 Days)"
                          color={colors.success}
                        />
                      )}

                      {/* Product Statistics - Bar Chart */}
                      {statisticsData.productStats && statisticsData.productStats.length > 0 && (
                        <BarChart
                          data={statisticsData.productStats.map((item: any, index: number) => ({
                            ...item,
                            color: index === 0 ? colors.success : index === 1 ? colors.warning : colors.error,
                          }))}
                          title="Product Stock Status"
                        />
                      )}

                      {/* Key Metrics Cards */}
                      <View style={styles.metricsContainer}>
                        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.bold }]}>
                          Key Metrics
                        </Text>
                        <View style={styles.metricsGrid}>
                          <View style={[styles.metricCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                            <Text style={[styles.metricLabel, { color: colors.textSecondary, fontFamily: Fonts.medium }]}>
                              Total Users
                            </Text>
                            <Text style={[styles.metricValue, { color: colors.primary, fontFamily: Fonts.bold }]}>
                              {userCounts.stalkist + userCounts.dellear + userCounts.salesman}
                            </Text>
                          </View>
                          <View style={[styles.metricCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                            <Text style={[styles.metricLabel, { color: colors.textSecondary, fontFamily: Fonts.medium }]}>
                              Growth Rate
                            </Text>
                            <Text style={[styles.metricValue, { color: colors.success, fontFamily: Fonts.bold }]}>
                              +12.5%
                            </Text>
                          </View>
                          <View style={[styles.metricCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                            <Text style={[styles.metricLabel, { color: colors.textSecondary, fontFamily: Fonts.medium }]}>
                              Active Today
                            </Text>
                            <Text style={[styles.metricValue, { color: colors.info, fontFamily: Fonts.bold }]}>
                              {Math.floor(Math.random() * 20) + 5}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </>
                  ) : null}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.loginPrompt}>
              <Text style={[styles.loginPromptText, { color: colors.text, fontFamily: Fonts.semiBold }]}>Please login to continue</Text>
              <TouchableOpacity
                style={[styles.loginButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/login')}
              >
                <Text style={[styles.buttonText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>
                  Go to Login
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
    </View>
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
  },
  menuButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: Fonts.sizes.xl,
    flex: 1,
    textAlign: 'center',
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
    gap: 12,
    borderWidth: 1,
  },
  welcomeText: {
    fontSize: Fonts.sizes.base,
    opacity: 0.8,
  },
  userName: {
    fontSize: Fonts.sizes['3xl'],
    marginTop: 4,
  },
  userEmail: {
    fontSize: Fonts.sizes.sm,
    opacity: 0.7,
    marginBottom: 8,
  },
  roleBadge: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: Fonts.sizes.sm,
    letterSpacing: Fonts.letterSpacing.wider,
  },
  loginPrompt: {
    marginTop: 32,
    alignItems: 'center',
    gap: 16,
  },
  loginPromptText: {
    fontSize: Fonts.sizes.lg,
  },
  loginButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: Fonts.sizes.base,
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
    fontSize: Fonts.sizes.lg,
    marginBottom: 8,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  widgetsGrid: {
    gap: 12,
  },
  widgetCard: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  widgetIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetContent: {
    flex: 1,
    gap: 4,
  },
  widgetLabel: {
    fontSize: Fonts.sizes.sm,
    letterSpacing: 0.3,
  },
  widgetCount: {
    fontSize: Fonts.sizes['2xl'],
    lineHeight: 32,
  },
  chartsContainer: {
    marginTop: 24,
    gap: 16,
  },
  sectionTitle: {
    fontSize: Fonts.sizes.xl,
    marginBottom: 16,
    marginTop: 8,
  },
  loadingText: {
    marginTop: 8,
    fontSize: Fonts.sizes.sm,
  },
  metricsContainer: {
    marginTop: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '30%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: Fonts.sizes.xs,
    marginBottom: 8,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: Fonts.sizes['2xl'],
  },
});
