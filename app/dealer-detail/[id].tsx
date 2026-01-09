import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, useColorScheme, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getDealerStats, DealerStats } from '@/services/dealerRequestService';
import { getUser, User } from '@/services/authService';

export default function DealerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [stats, setStats] = useState<DealerStats | null>(null);
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
      if (user?.role !== 'stalkist') {
        Alert.alert('Access Denied', 'Only stalkists can view dealer details.');
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
      const data = await getDealerStats(id);
      setStats(data);
    } catch (err: any) {
      console.error('Error loading dealer stats:', err);
      Alert.alert('Error', err.message || 'Failed to load dealer statistics');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#10B981';
      case 'cancelled':
        return '#DC2626';
      default:
        return '#F59E0B'; // Pending
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#60A5FA" />
          <Text style={styles.loadingText}>Loading dealer statistics...</Text>
        </View>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Dealer not found</Text>
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
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dealer Details</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Dealer Info */}
        <View style={styles.dealerInfoCard}>
          <Text style={styles.dealerName}>{stats.dealer.name}</Text>
          <Text style={styles.dealerEmail}>{stats.dealer.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{stats.dealer.role.toUpperCase()}</Text>
          </View>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Requests</Text>
            <Text style={styles.statValue}>{stats.stats.totalRequests}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F59E0B20', borderColor: '#F59E0B' }]}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.stats.pendingRequests}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#10B98120', borderColor: '#10B981' }]}>
            <Text style={styles.statLabel}>Approved</Text>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.stats.approvedRequests}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#DC262620', borderColor: '#DC2626' }]}>
            <Text style={styles.statLabel}>Cancelled</Text>
            <Text style={[styles.statValue, { color: '#DC2626' }]}>{stats.stats.cancelledRequests}</Text>
          </View>
        </View>

        {/* Strips Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Strips Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Strips Requested:</Text>
            <Text style={styles.summaryValue}>{stats.stats.totalStripsRequested} strips</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Approved Strips:</Text>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>
              {stats.stats.totalStripsApproved} strips
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pending Strips:</Text>
            <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>
              {stats.stats.totalStripsPending} strips
            </Text>
          </View>
        </View>

        {/* Value Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Value Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Value Requested:</Text>
            <Text style={styles.summaryValue}>₹{stats.stats.totalValueRequested}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Value Approved:</Text>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>
              ₹{stats.stats.totalValueApproved}
            </Text>
          </View>
        </View>

        {/* Requests List */}
        <View style={styles.requestsContainer}>
          <Text style={styles.sectionTitle}>All Requests ({stats.requests.length})</Text>
          
          {stats.requests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No requests found</Text>
            </View>
          ) : (
            stats.requests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Text style={styles.requestProductTitle}>{request.product.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                    <Text style={styles.statusText}>{request.status.toUpperCase()}</Text>
                  </View>
                </View>
                
                <View style={styles.requestDetails}>
                  <View style={styles.requestDetailItem}>
                    <Text style={styles.requestDetailLabel}>Strips:</Text>
                    <Text style={styles.requestDetailValue}>{request.strips} strips</Text>
                  </View>
                  <View style={styles.requestDetailItem}>
                    <Text style={styles.requestDetailLabel}>Packets per Strip:</Text>
                    <Text style={styles.requestDetailValue}>{request.product.packetsPerStrip}</Text>
                  </View>
                  <View style={styles.requestDetailItem}>
                    <Text style={styles.requestDetailLabel}>Total Packets:</Text>
                    <Text style={styles.requestDetailValue}>
                      {request.strips * request.product.packetsPerStrip} packets
                    </Text>
                  </View>
                  <View style={styles.requestDetailItem}>
                    <Text style={styles.requestDetailLabel}>Packet Price:</Text>
                    <Text style={styles.requestDetailValue}>₹{request.product.packetPrice.toFixed(2)}</Text>
                  </View>
                  <View style={styles.requestDetailItem}>
                    <Text style={styles.requestDetailLabel}>Total Value:</Text>
                    <Text style={styles.requestDetailValue}>₹{request.totalValue}</Text>
                  </View>
                  <View style={styles.requestDetailItem}>
                    <Text style={styles.requestDetailLabel}>Requested At:</Text>
                    <Text style={styles.requestDetailValue}>
                      {new Date(request.requestedAt).toLocaleString()}
                    </Text>
                  </View>
                  {request.processedAt && (
                    <View style={styles.requestDetailItem}>
                      <Text style={styles.requestDetailLabel}>Processed At:</Text>
                      <Text style={styles.requestDetailValue}>
                        {new Date(request.processedAt).toLocaleString()}
                      </Text>
                    </View>
                  )}
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
  dealerInfoCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#1D1D1D',
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 16,
    alignItems: 'center',
  },
  dealerName: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  dealerEmail: {
    fontSize: 16,
    fontFamily: 'Poppins-Light',
    color: '#D1D5DB',
    marginBottom: 12,
  },
  roleBadge: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  roleText: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#1D1D1D',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: '48%',
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
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1D1D1D',
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Light',
    color: '#D1D5DB',
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  requestsContainer: {
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
  requestCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#1D1D1D',
    marginBottom: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestProductTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    flex: 1,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  requestDetails: {
    gap: 8,
  },
  requestDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  requestDetailLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Light',
    color: '#9CA3AF',
  },
  requestDetailValue: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
});

