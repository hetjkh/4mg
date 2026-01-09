import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, useColorScheme, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getStalkistStats, StalkistStats, DealerWithStats } from '@/services/stalkistService';
import { getUser, User } from '@/services/authService';
import { deleteDealer } from '@/services/adminUserService';

export default function StalkistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [stats, setStats] = useState<StalkistStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    loadUser();
    if (id) {
      loadStats();
    }
  }, [id]);

  const loadUser = async () => {
    try {
      const user = await getUser();
      setCurrentUser(user);
      if (user?.role !== 'admin') {
        Alert.alert('Access Denied', 'Only admins can view stalkist details.');
        router.back();
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadStats = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await getStalkistStats(id);
      setStats(data);
    } catch (err: any) {
      console.error('Error loading stalkist stats:', err);
      Alert.alert('Error', err.message || 'Failed to load stalkist statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDealer = async (dealer: DealerWithStats) => {
    if (dealer.salesmenCount > 0) {
      Alert.alert(
        'Delete Dealer',
        `This dealer has ${dealer.salesmenCount} salesmen.\n\nDo you want to delete them as well?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete Dealer Only',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteDealer(dealer.id, false);
                Alert.alert('Success', 'Dealer deleted successfully');
                loadStats();
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
                Alert.alert('Success', `Dealer and all related salesmen (${dealer.salesmenCount}) deleted successfully`);
                loadStats();
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
                loadStats();
              } catch (err: any) {
                Alert.alert('Error', err.message || 'Failed to delete dealer');
              }
            },
          },
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#60A5FA" />
          <Text style={styles.loadingText}>Loading stalkist details...</Text>
        </View>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Stalkist not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stalkist Details</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Stalkist Info */}
        <View style={styles.stalkistInfoCard}>
          <Text style={styles.stalkistName}>{stats.stalkist.name}</Text>
          <Text style={styles.stalkistEmail}>{stats.stalkist.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>STALKIST</Text>
          </View>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Dealers</Text>
            <Text style={styles.statValue}>{stats.totalDealers}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#2563EB20', borderColor: '#2563EB' }]}>
            <Text style={styles.statLabel}>Total Salesmen</Text>
            <Text style={[styles.statValue, { color: '#2563EB' }]}>{stats.totalSalesmen}</Text>
          </View>
        </View>

        {/* Dealers List */}
        <View style={styles.dealersContainer}>
          <Text style={styles.sectionTitle}>Dealers ({stats.dealers.length})</Text>
          
          {stats.dealers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No dealers found</Text>
            </View>
          ) : (
            stats.dealers.map((dealer) => (
              <View key={dealer.id} style={styles.dealerCard}>
                <View style={styles.dealerInfo}>
                  <View style={styles.dealerHeader}>
                    <Text style={styles.dealerName}>{dealer.name}</Text>
                    <View style={styles.roleBadgeDealer}>
                      <Text style={styles.roleTextDealer}>{dealer.role.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.dealerEmail}>{dealer.email}</Text>
                  <View style={styles.salesmenCountBadge}>
                    <Text style={styles.salesmenCountText}>
                      {dealer.salesmenCount} Salesmen
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.viewSalesmenButton}
                  onPress={() => router.push(`/dealer-salesmen/${dealer.id}`)}
                >
                  <Text style={styles.viewSalesmenButtonText}>View Salesmen</Text>
                </TouchableOpacity>
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
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Poppins-Light',
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#DC2626',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
    backgroundColor: '#000000',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#60A5FA',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    padding: 16,
  },
  stalkistInfoCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#1D1D1D',
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 16,
    alignItems: 'center',
  },
  stalkistName: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  stalkistEmail: {
    fontSize: 16,
    fontFamily: 'Poppins-Light',
    color: '#D1D5DB',
    marginBottom: 12,
  },
  roleBadge: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#059669',
  },
  roleText: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1D1D1D',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Light',
    color: '#D1D5DB',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
  dealersContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Poppins-Light',
    textAlign: 'center',
    color: '#9CA3AF',
  },
  dealerCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#1D1D1D',
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
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    flex: 1,
  },
  roleBadgeDealer: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#2563EB',
  },
  roleTextDealer: {
    fontSize: 10,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  dealerEmail: {
    fontSize: 14,
    fontFamily: 'Poppins-Light',
    color: '#D1D5DB',
    marginBottom: 8,
  },
  salesmenCountBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#7C3AED20',
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  salesmenCountText: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#7C3AED',
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
    backgroundColor: '#10B981',
    alignItems: 'center',
  },
  viewSalesmenButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
});

