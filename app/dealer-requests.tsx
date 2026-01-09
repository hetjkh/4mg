import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, useColorScheme, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getDealerRequests, approveDealerRequest, cancelDealerRequest, DealerRequest } from '@/services/dealerRequestService';
import { getUser, User } from '@/services/authService';

type FilterStatus = 'all' | 'pending' | 'approved' | 'cancelled';
type SortOption = 'newest' | 'oldest' | 'dealer' | 'product' | 'strips';

export default function DealerRequestsScreen() {
  const [requests, setRequests] = useState<DealerRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<DealerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [dealerFilter, setDealerFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  
  // Sort state
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    loadUser();
    loadRequests();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [requests, statusFilter, dealerFilter, productFilter, sortOption]);

  const loadUser = async () => {
    try {
      const user = await getUser();
      setCurrentUser(user);
      if (user?.role !== 'admin') {
        Alert.alert('Access Denied', 'Only administrators can view all dealer requests.');
        router.back();
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await getDealerRequests();
      setRequests(data);
      console.log('Loaded dealer requests:', data.length);
    } catch (err: any) {
      console.error('Error loading dealer requests:', err);
      Alert.alert('Error', err.message || 'Failed to load dealer requests');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...requests];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Apply dealer filter
    if (dealerFilter !== 'all') {
      filtered = filtered.filter(r => r.dealer.id === dealerFilter);
    }

    // Apply product filter
    if (productFilter !== 'all') {
      filtered = filtered.filter(r => r.product.id === productFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
        case 'oldest':
          return new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime();
        case 'dealer':
          return a.dealer.name.localeCompare(b.dealer.name);
        case 'product':
          return a.product.title.localeCompare(b.product.title);
        case 'strips':
          return b.strips - a.strips;
        default:
          return 0;
      }
    });

    setFilteredRequests(filtered);
  };

  const handleApproveRequest = async (requestId: string) => {
    Alert.alert(
      'Approve Request',
      'Are you sure you want to approve this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await approveDealerRequest(requestId);
              Alert.alert('Success', 'Request approved successfully');
              loadRequests();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to approve request');
            }
          },
        },
      ]
    );
  };

  const handleCancelRequest = async (requestId: string) => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelDealerRequest(requestId);
              Alert.alert('Success', 'Request cancelled successfully');
              loadRequests();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel request');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#10B981';
      case 'cancelled':
        return '#DC2626';
      default:
        return '#F59E0B';
    }
  };

  // Get unique dealers and products for filters
  const uniqueDealers = Array.from(new Set(requests.map(r => r.dealer.id)))
    .map(id => requests.find(r => r.dealer.id === id)?.dealer)
    .filter(Boolean) as Array<{ id: string; name: string; email: string }>;

  const uniqueProducts = Array.from(new Set(requests.map(r => r.product.id)))
    .map(id => requests.find(r => r.product.id === id)?.product)
    .filter(Boolean) as Array<{ id: string; title: string }>;

  const getStatusCounts = () => {
    return {
      all: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      cancelled: requests.filter(r => r.status === 'cancelled').length,
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#60A5FA" />
          <Text style={styles.loadingText}>Loading requests...</Text>
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
        <Text style={styles.headerTitle}>Dealer Requests</Text>
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={styles.filterButton}
        >
          <Text style={styles.filterButtonText}>
            {showFilters ? 'Hide Filters' : 'Filters'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{statusCounts.all}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F59E0B20' }]}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{statusCounts.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#10B98120' }]}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{statusCounts.approved}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#DC262620' }]}>
            <Text style={[styles.statValue, { color: '#DC2626' }]}>{statusCounts.cancelled}</Text>
            <Text style={styles.statLabel}>Cancelled</Text>
          </View>
        </View>

        {/* Filters Section */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            <Text style={styles.filtersTitle}>Filters & Sorting</Text>

            {/* Status Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Status:</Text>
              <View style={styles.filterButtons}>
                {(['all', 'pending', 'approved', 'cancelled'] as FilterStatus[]).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterChip,
                      statusFilter === status && styles.filterChipActive,
                      status === 'pending' && statusFilter === status && { backgroundColor: '#F59E0B' },
                      status === 'approved' && statusFilter === status && { backgroundColor: '#10B981' },
                      status === 'cancelled' && statusFilter === status && { backgroundColor: '#DC2626' },
                    ]}
                    onPress={() => setStatusFilter(status)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      statusFilter === status && styles.filterChipTextActive
                    ]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Dealer Filter */}
            {uniqueDealers.length > 0 && (
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Dealer:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                  <TouchableOpacity
                    style={[styles.filterChip, dealerFilter === 'all' && styles.filterChipActive]}
                    onPress={() => setDealerFilter('all')}
                  >
                    <Text style={[styles.filterChipText, dealerFilter === 'all' && styles.filterChipTextActive]}>
                      All Dealers
                    </Text>
                  </TouchableOpacity>
                  {uniqueDealers.map((dealer) => (
                    <TouchableOpacity
                      key={dealer.id}
                      style={[styles.filterChip, dealerFilter === dealer.id && styles.filterChipActive]}
                      onPress={() => setDealerFilter(dealer.id)}
                    >
                      <Text style={[styles.filterChipText, dealerFilter === dealer.id && styles.filterChipTextActive]}>
                        {dealer.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Product Filter */}
            {uniqueProducts.length > 0 && (
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Product:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                  <TouchableOpacity
                    style={[styles.filterChip, productFilter === 'all' && styles.filterChipActive]}
                    onPress={() => setProductFilter('all')}
                  >
                    <Text style={[styles.filterChipText, productFilter === 'all' && styles.filterChipTextActive]}>
                      All Products
                    </Text>
                  </TouchableOpacity>
                  {uniqueProducts.map((product) => (
                    <TouchableOpacity
                      key={product.id}
                      style={[styles.filterChip, productFilter === product.id && styles.filterChipActive]}
                      onPress={() => setProductFilter(product.id)}
                    >
                      <Text style={[styles.filterChipText, productFilter === product.id && styles.filterChipTextActive]}>
                        {product.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Sort Options */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Sort By:</Text>
              <View style={styles.filterButtons}>
                {[
                  { value: 'newest' as SortOption, label: 'Newest First' },
                  { value: 'oldest' as SortOption, label: 'Oldest First' },
                  { value: 'dealer' as SortOption, label: 'Dealer Name' },
                  { value: 'product' as SortOption, label: 'Product Name' },
                  { value: 'strips' as SortOption, label: 'Strips (High to Low)' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.filterChip, sortOption === option.value && styles.filterChipActive]}
                    onPress={() => setSortOption(option.value)}
                  >
                    <Text style={[styles.filterChipText, sortOption === option.value && styles.filterChipTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Clear Filters */}
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setStatusFilter('all');
                setDealerFilter('all');
                setProductFilter('all');
                setSortOption('newest');
              }}
            >
              <Text style={styles.clearFiltersText}>Clear All Filters</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results Count */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsText}>
            Showing {filteredRequests.length} of {requests.length} requests
          </Text>
        </View>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {requests.length === 0 
                ? 'No dealer requests yet.' 
                : 'No requests match your filters.'}
            </Text>
          </View>
        ) : (
          filteredRequests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={styles.requestInfo}>
                  <Text style={styles.requestProductTitle}>{request.product.title}</Text>
                  <Text style={styles.requestDealerName}>
                    {request.dealer.name} • {request.dealer.email}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                  <Text style={styles.statusText}>{request.status.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.requestDetails}>
                <View style={styles.requestDetailRow}>
                  <View style={styles.requestDetailItem}>
                    <Text style={styles.requestDetailLabel}>Requested Strips:</Text>
                    <Text style={styles.requestDetailValue}>{request.strips} strips</Text>
                  </View>
                  <View style={styles.requestDetailItem}>
                    <Text style={styles.requestDetailLabel}>Total Packets:</Text>
                    <Text style={styles.requestDetailValue}>
                      {request.strips * request.product.packetsPerStrip} packets
                    </Text>
                  </View>
                </View>
                <View style={styles.requestDetailRow}>
                  <View style={styles.requestDetailItem}>
                    <Text style={styles.requestDetailLabel}>Packet Price:</Text>
                    <Text style={styles.requestDetailValue}>₹{request.product.packetPrice.toFixed(2)}</Text>
                  </View>
                  <View style={styles.requestDetailItem}>
                    <Text style={styles.requestDetailLabel}>Total Value:</Text>
                    <Text style={styles.requestDetailValue}>
                      ₹{(request.strips * request.product.packetsPerStrip * request.product.packetPrice).toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View style={styles.requestDetailRow}>
                  <Text style={styles.requestDetailLabel}>Requested At:</Text>
                  <Text style={styles.requestDetailValue}>
                    {new Date(request.requestedAt).toLocaleString()}
                  </Text>
                </View>
                {request.processedBy && (
                  <View style={styles.requestDetailRow}>
                    <Text style={styles.requestDetailLabel}>Processed By:</Text>
                    <Text style={styles.requestDetailValue}>{request.processedBy.name}</Text>
                  </View>
                )}
                {request.processedAt && (
                  <View style={styles.requestDetailRow}>
                    <Text style={styles.requestDetailLabel}>Processed At:</Text>
                    <Text style={styles.requestDetailValue}>
                      {new Date(request.processedAt).toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>

              {request.status === 'pending' && (
                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={[styles.requestButton, styles.approveButton]}
                    onPress={() => handleApproveRequest(request.id)}
                  >
                    <Text style={styles.requestButtonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.requestButton, styles.cancelButton]}
                    onPress={() => handleCancelRequest(request.id)}
                  >
                    <Text style={styles.requestButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
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
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#1D1D1D',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Light',
    color: '#9CA3AF',
    marginTop: 4,
  },
  filtersContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#1D1D1D',
    borderWidth: 1,
    borderColor: '#374151',
  },
  filtersTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#D1D5DB',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#9CA3AF',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  clearFiltersButton: {
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#6B7280',
    alignItems: 'center',
    marginTop: 8,
  },
  clearFiltersText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  resultsHeader: {
    marginBottom: 12,
  },
  resultsText: {
    fontSize: 14,
    fontFamily: 'Poppins-Light',
    color: '#9CA3AF',
  },
  requestCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    backgroundColor: '#1D1D1D',
    borderColor: '#374151',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestProductTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  requestDealerName: {
    fontSize: 14,
    fontFamily: 'Poppins-Light',
    color: '#D1D5DB',
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
    marginBottom: 12,
  },
  requestDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  requestDetailItem: {
    flex: 1,
    minWidth: '45%',
  },
  requestDetailLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Light',
    color: '#9CA3AF',
    marginBottom: 2,
  },
  requestDetailValue: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  requestButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  cancelButton: {
    backgroundColor: '#DC2626',
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
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
});

