import { useState, useEffect } from 'react';
import * as React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getAdminDealers, AdminDealer, getDealerSalesmen } from '@/services/stalkistService';
import { getUser, User } from '@/services/authService';
import { deleteDealer } from '@/services/adminUserService';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, Fonts } from '@/constants/theme';

export default function ManageAdminDealersScreen() {
  const [dealers, setDealers] = useState<AdminDealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const { isDark, colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  useEffect(() => {
    loadUser();
    loadDealers();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadDealers();
    }, [])
  );

  const loadUser = async () => {
    try {
      const user = await getUser();
      setCurrentUser(user);
      if (user?.role !== 'admin') {
        Alert.alert('Access Denied', 'Only admins can manage dealers.');
        router.back();
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadDealers = async () => {
    try {
      setLoading(true);
      const data = await getAdminDealers();
      setDealers(data);
    } catch (err: any) {
      console.error('Error loading dealers:', err);
      Alert.alert('Error', err.message || 'Failed to load dealers');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDealer = async (dealer: AdminDealer) => {
    try {
      // Get salesmen count
      const dealerData = await getDealerSalesmen(dealer.id, true);
      const salesmenCount = dealerData.totalSalesmen;

      if (salesmenCount > 0) {
        Alert.alert(
          'Delete Dealer',
          `This dealer has ${salesmenCount} salesmen.\n\nDo you want to delete them as well?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete Dealer Only',
              style: 'destructive',
              onPress: async () => {
                try {
                  await deleteDealer(dealer.id, false);
                  Alert.alert('Success', 'Dealer deleted successfully');
                  loadDealers();
                } catch (err: any) {
                  Alert.alert('Error', err.message || 'Failed to delete dealer');
                }
              },
            },
            {
              text: 'Delete All (Including Salesmen)',
              style: 'destructive',
              onPress: async () => {
                try {
                  await deleteDealer(dealer.id, true);
                  Alert.alert('Success', `Dealer and all related salesmen (${salesmenCount}) deleted successfully`);
                  loadDealers();
                } catch (err: any) {
                  Alert.alert('Error', err.message || 'Failed to delete dealer');
                }
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Delete Dealer',
          `Are you sure you want to delete "${dealer.name}"?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  await deleteDealer(dealer.id, false);
                  Alert.alert('Success', 'Dealer deleted successfully');
                  loadDealers();
                } catch (err: any) {
                  Alert.alert('Error', err.message || 'Failed to delete dealer');
                }
              },
            },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to get dealer information');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryLight} />
          <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: Fonts.light }]}>Loading dealers...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colors.primaryLight, fontFamily: Fonts.semiBold }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: Fonts.bold }]}>Manage Dealers</Text>
        <TouchableOpacity
          onPress={() => {
            router.push('/admin-register');
          }}
          style={[styles.addButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.addButtonText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={[styles.scrollView, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
        <View style={styles.dealersContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.bold }]}>
            All Dealers ({dealers.length})
          </Text>

          {dealers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textTertiary, fontFamily: Fonts.light }]}>
                No dealers found.
              </Text>
            </View>
          ) : (
            dealers.map((dealer) => (
              <View key={dealer.id} style={[styles.dealerCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={styles.dealerInfo}>
                  <View style={styles.dealerHeader}>
                    <Text style={[styles.dealerName, { color: colors.text, fontFamily: Fonts.bold }]}>{dealer.name}</Text>
                    <View style={[styles.roleBadge, { backgroundColor: colors.roleDellear }]}>
                      <Text style={[styles.roleText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>{dealer.role.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={[styles.dealerEmail, { color: colors.textSecondary, fontFamily: Fonts.light }]}>{dealer.email}</Text>
                  {dealer.createdBy ? (
                    <View style={[styles.createdByBadge, { backgroundColor: `${colors.roleDellear}20`, borderColor: colors.roleDellear }]}>
                      <Text style={[styles.createdByText, { color: colors.roleDellear, fontFamily: Fonts.semiBold }]}>
                        Created by: {dealer.createdBy.name} ({dealer.createdBy.role})
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.createdByBadge, { backgroundColor: `${colors.roleDellear}20`, borderColor: colors.roleDellear }]}>
                      <Text style={[styles.createdByText, { color: colors.roleDellear, fontFamily: Fonts.semiBold }]}>
                        Created by: Admin (Direct)
                      </Text>
                    </View>
                  )}
                  {dealer.createdAt && (
                    <Text style={[styles.dealerDate, { color: colors.textTertiary, fontFamily: Fonts.light }]}>
                      Created: {new Date(dealer.createdAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>

                <View style={styles.dealerActions}>
                  <TouchableOpacity
                    style={[styles.viewSalesmenButton, { backgroundColor: colors.success }]}
                    onPress={() => router.push(`/dealer-salesmen/${dealer.id}?admin=true`)}
                  >
                    <Text style={[styles.viewSalesmenButtonText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>View Salesmen</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.deleteButton, { backgroundColor: colors.error }]}
                    onPress={() => handleDeleteDealer(dealer)}
                  >
                    <Text style={[styles.deleteButtonText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: Fonts.sizes.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: Fonts.sizes.base,
  },
  headerTitle: {
    fontSize: Fonts.sizes.xl,
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: Fonts.sizes.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  dealersContainer: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: Fonts.sizes.lg,
    marginBottom: 12,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Fonts.sizes.base,
    textAlign: 'center',
  },
  dealerCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  dealerInfo: {
    marginBottom: 12,
  },
  dealerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dealerName: {
    fontSize: Fonts.sizes.lg,
    flex: 1,
  },
  roleBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  roleText: {
    fontSize: Fonts.sizes.xs,
  },
  dealerEmail: {
    fontSize: Fonts.sizes.sm,
    marginBottom: 8,
  },
  createdByBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 8,
  },
  createdByText: {
    fontSize: Fonts.sizes.xs,
  },
  dealerDate: {
    fontSize: Fonts.sizes.xs,
  },
  dealerActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  viewSalesmenButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewSalesmenButtonText: {
    fontSize: Fonts.sizes.sm,
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: Fonts.sizes.sm,
  },
});

