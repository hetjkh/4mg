import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Image, Modal } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getDealerRequests, approveDealerRequest, cancelDealerRequest, verifyPayment, rejectPayment, DealerRequest } from '@/services/dealerRequestService';
import { getUser, User } from '@/services/authService';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, Fonts } from '@/constants/theme';

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

  const { isDark, colorScheme } = useTheme();
  const colors = Colors[colorScheme];

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

  const handleVerifyPayment = async (requestId: string) => {
    Alert.alert(
      'Verify Payment',
      'Are you sure the payment receipt is valid?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Verify',
          onPress: async () => {
            try {
              await verifyPayment(requestId);
              Alert.alert('Success', 'Payment verified successfully. You can now approve the request.');
              loadRequests();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to verify payment');
            }
          },
        },
      ]
    );
  };

  const handleRejectPayment = async (requestId: string) => {
    Alert.prompt(
      'Reject Payment',
      'Please provide a reason for rejecting this payment receipt:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async (notes) => {
            try {
              await rejectPayment(requestId, notes || 'Receipt rejected');
              Alert.alert('Success', 'Payment rejected. Dealer can upload a new receipt.');
              loadRequests();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to reject payment');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleApproveRequest = async (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (request && request.paymentStatus !== 'verified') {
      Alert.alert(
        'Payment Not Verified',
        'You must verify the payment before approving the request.',
        [{ text: 'OK' }]
      );
      return;
    }

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
        return colors.success;
      case 'cancelled':
        return colors.error;
      default:
        return colors.warning;
    }
  };

  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'verified':
        return colors.success;
      case 'rejected':
        return colors.error;
      case 'paid':
        return colors.primary;
      default:
        return colors.textTertiary;
    }
  };

  const getPaymentStatusText = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'verified':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      case 'paid':
        return 'Pending Verification';
      default:
        return 'Pending';
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryLight} />
          <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: Fonts.light }]}>Loading requests...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colors.primaryLight, fontFamily: Fonts.semiBold }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: Fonts.bold }]}>Dealer Requests</Text>
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={[styles.filterButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.filterButtonText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>
            {showFilters ? 'Hide Filters' : 'Filters'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={[styles.scrollView, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.statValue, { color: colors.text, fontFamily: Fonts.bold }]}>{statusCounts.all}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: Fonts.light }]}>Total</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: `${colors.warning}20` }]}>
            <Text style={[styles.statValue, { color: colors.warning, fontFamily: Fonts.bold }]}>{statusCounts.pending}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: Fonts.light }]}>Pending</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: `${colors.success}20` }]}>
            <Text style={[styles.statValue, { color: colors.success, fontFamily: Fonts.bold }]}>{statusCounts.approved}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: Fonts.light }]}>Approved</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: `${colors.error}20` }]}>
            <Text style={[styles.statValue, { color: colors.error, fontFamily: Fonts.bold }]}>{statusCounts.cancelled}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: Fonts.light }]}>Cancelled</Text>
          </View>
        </View>

        {/* Filters Section */}
        {showFilters && (
          <View style={[styles.filtersContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text style={[styles.filtersTitle, { color: colors.text, fontFamily: Fonts.bold }]}>Filters & Sorting</Text>

            {/* Status Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary, fontFamily: Fonts.semiBold }]}>Status:</Text>
              <View style={styles.filterButtons}>
                {(['all', 'pending', 'approved', 'cancelled'] as FilterStatus[]).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: statusFilter === status 
                          ? (status === 'pending' ? colors.warning : status === 'approved' ? colors.success : status === 'cancelled' ? colors.error : colors.primary)
                          : colors.inputBackground,
                        borderColor: statusFilter === status 
                          ? (status === 'pending' ? colors.warning : status === 'approved' ? colors.success : status === 'cancelled' ? colors.error : colors.primary)
                          : colors.inputBorder,
                      },
                    ]}
                    onPress={() => setStatusFilter(status)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      {
                        color: statusFilter === status ? colors.textInverse : colors.textSecondary,
                        fontFamily: Fonts.medium,
                      }
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
                <Text style={[styles.filterLabel, { color: colors.textSecondary, fontFamily: Fonts.semiBold }]}>Dealer:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                  <TouchableOpacity
                    style={[styles.filterChip, {
                      backgroundColor: dealerFilter === 'all' ? colors.primary : colors.inputBackground,
                      borderColor: dealerFilter === 'all' ? colors.primary : colors.inputBorder,
                    }]}
                    onPress={() => setDealerFilter('all')}
                  >
                    <Text style={[styles.filterChipText, {
                      color: dealerFilter === 'all' ? colors.textInverse : colors.textSecondary,
                      fontFamily: Fonts.medium,
                    }]}>
                      All Dealers
                    </Text>
                  </TouchableOpacity>
                  {uniqueDealers.map((dealer) => (
                    <TouchableOpacity
                      key={dealer.id}
                      style={[styles.filterChip, {
                        backgroundColor: dealerFilter === dealer.id ? colors.primary : colors.inputBackground,
                        borderColor: dealerFilter === dealer.id ? colors.primary : colors.inputBorder,
                      }]}
                      onPress={() => setDealerFilter(dealer.id)}
                    >
                      <Text style={[styles.filterChipText, {
                        color: dealerFilter === dealer.id ? colors.textInverse : colors.textSecondary,
                        fontFamily: Fonts.medium,
                      }]}>
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
                <Text style={[styles.filterLabel, { color: colors.textSecondary, fontFamily: Fonts.semiBold }]}>Product:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                  <TouchableOpacity
                    style={[styles.filterChip, {
                      backgroundColor: productFilter === 'all' ? colors.primary : colors.inputBackground,
                      borderColor: productFilter === 'all' ? colors.primary : colors.inputBorder,
                    }]}
                    onPress={() => setProductFilter('all')}
                  >
                    <Text style={[styles.filterChipText, {
                      color: productFilter === 'all' ? colors.textInverse : colors.textSecondary,
                      fontFamily: Fonts.medium,
                    }]}>
                      All Products
                    </Text>
                  </TouchableOpacity>
                  {uniqueProducts.map((product) => (
                    <TouchableOpacity
                      key={product.id}
                      style={[styles.filterChip, {
                        backgroundColor: productFilter === product.id ? colors.primary : colors.inputBackground,
                        borderColor: productFilter === product.id ? colors.primary : colors.inputBorder,
                      }]}
                      onPress={() => setProductFilter(product.id)}
                    >
                      <Text style={[styles.filterChipText, {
                        color: productFilter === product.id ? colors.textInverse : colors.textSecondary,
                        fontFamily: Fonts.medium,
                      }]}>
                        {product.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Sort Options */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary, fontFamily: Fonts.semiBold }]}>Sort By:</Text>
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
                    style={[styles.filterChip, {
                      backgroundColor: sortOption === option.value ? colors.primary : colors.inputBackground,
                      borderColor: sortOption === option.value ? colors.primary : colors.inputBorder,
                    }]}
                    onPress={() => setSortOption(option.value)}
                  >
                    <Text style={[styles.filterChipText, {
                      color: sortOption === option.value ? colors.textInverse : colors.textSecondary,
                      fontFamily: Fonts.medium,
                    }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Clear Filters */}
            <TouchableOpacity
              style={[styles.clearFiltersButton, { backgroundColor: colors.secondary }]}
              onPress={() => {
                setStatusFilter('all');
                setDealerFilter('all');
                setProductFilter('all');
                setSortOption('newest');
              }}
            >
              <Text style={[styles.clearFiltersText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>Clear All Filters</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results Count */}
        <View style={styles.resultsHeader}>
          <Text style={[styles.resultsText, { color: colors.textSecondary, fontFamily: Fonts.light }]}>
            Showing {filteredRequests.length} of {requests.length} requests
          </Text>
        </View>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textTertiary, fontFamily: Fonts.light }]}>
              {requests.length === 0 
                ? 'No dealer requests yet.' 
                : 'No requests match your filters.'}
            </Text>
          </View>
        ) : (
          filteredRequests.map((request) => (
            <View key={request.id} style={[styles.requestCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={styles.requestHeader}>
                <View style={styles.requestInfo}>
                  <Text style={[styles.requestProductTitle, { color: colors.text, fontFamily: Fonts.bold }]}>{request.product.title}</Text>
                  <Text style={[styles.requestDealerName, { color: colors.textSecondary, fontFamily: Fonts.light }]}>
                    {request.dealer.name} • {request.dealer.email}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                  <Text style={[styles.statusText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>{request.status.toUpperCase()}</Text>
                </View>
              </View>

              {/* Payment Status */}
              <View style={styles.paymentStatusContainer}>
                <Text style={[styles.paymentStatusLabel, { color: colors.textSecondary, fontFamily: Fonts.semiBold }]}>Payment Status:</Text>
                <View style={[styles.paymentStatusBadge, { backgroundColor: getPaymentStatusColor(request.paymentStatus) }]}>
                  <Text style={[styles.paymentStatusText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>
                    {getPaymentStatusText(request.paymentStatus)}
                  </Text>
                </View>
              </View>

              {/* Receipt Image */}
              {request.receiptImage && (
                <View style={styles.receiptContainer}>
                  <Text style={[styles.receiptLabel, { color: colors.textSecondary, fontFamily: Fonts.semiBold }]}>Payment Receipt:</Text>
                  <TouchableOpacity
                    onPress={() => {
                      // Show full image in modal
                      Alert.alert('Receipt', 'View receipt image', [
                        { text: 'Close' }
                      ]);
                    }}
                  >
                    <Image source={{ uri: request.receiptImage }} style={styles.receiptImage} />
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.requestDetails}>
                <View style={styles.requestDetailRow}>
                  <View style={styles.requestDetailItem}>
                    <Text style={[styles.requestDetailLabel, { color: colors.textSecondary, fontFamily: Fonts.light }]}>Requested Strips:</Text>
                    <Text style={[styles.requestDetailValue, { color: colors.text, fontFamily: Fonts.semiBold }]}>{request.strips} strips</Text>
                  </View>
                  <View style={styles.requestDetailItem}>
                    <Text style={[styles.requestDetailLabel, { color: colors.textSecondary, fontFamily: Fonts.light }]}>Total Packets:</Text>
                    <Text style={[styles.requestDetailValue, { color: colors.text, fontFamily: Fonts.semiBold }]}>
                      {request.strips * request.product.packetsPerStrip} packets
                    </Text>
                  </View>
                </View>
                <View style={styles.requestDetailRow}>
                  <View style={styles.requestDetailItem}>
                    <Text style={[styles.requestDetailLabel, { color: colors.textSecondary, fontFamily: Fonts.light }]}>Packet Price:</Text>
                    <Text style={[styles.requestDetailValue, { color: colors.text, fontFamily: Fonts.semiBold }]}>₹{request.product.packetPrice.toFixed(2)}</Text>
                  </View>
                  <View style={styles.requestDetailItem}>
                    <Text style={[styles.requestDetailLabel, { color: colors.textSecondary, fontFamily: Fonts.light }]}>Total Value:</Text>
                    <Text style={[styles.requestDetailValue, { color: colors.text, fontFamily: Fonts.semiBold }]}>
                      ₹{(request.strips * request.product.packetsPerStrip * request.product.packetPrice).toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View style={styles.requestDetailRow}>
                  <Text style={[styles.requestDetailLabel, { color: colors.textSecondary, fontFamily: Fonts.light }]}>Requested At:</Text>
                  <Text style={[styles.requestDetailValue, { color: colors.text, fontFamily: Fonts.semiBold }]}>
                    {new Date(request.requestedAt).toLocaleString()}
                  </Text>
                </View>
                {request.processedBy && (
                  <View style={styles.requestDetailRow}>
                    <Text style={[styles.requestDetailLabel, { color: colors.textSecondary, fontFamily: Fonts.light }]}>Processed By:</Text>
                    <Text style={[styles.requestDetailValue, { color: colors.text, fontFamily: Fonts.semiBold }]}>{request.processedBy.name}</Text>
                  </View>
                )}
                {request.processedAt && (
                  <View style={styles.requestDetailRow}>
                    <Text style={[styles.requestDetailLabel, { color: colors.textSecondary, fontFamily: Fonts.light }]}>Processed At:</Text>
                    <Text style={[styles.requestDetailValue, { color: colors.text, fontFamily: Fonts.semiBold }]}>
                      {new Date(request.processedAt).toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Payment Actions */}
              {request.status === 'pending' && request.paymentStatus === 'paid' && (
                <View style={styles.paymentActions}>
                  <TouchableOpacity
                    style={[styles.paymentButton, { backgroundColor: colors.success }]}
                    onPress={() => handleVerifyPayment(request.id)}
                  >
                    <Text style={[styles.paymentButtonText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>Verify Payment</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.paymentButton, { backgroundColor: colors.error }]}
                    onPress={() => handleRejectPayment(request.id)}
                  >
                    <Text style={[styles.paymentButtonText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>Reject Payment</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Request Actions */}
              {request.status === 'pending' && (
                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={[
                      styles.requestButton, 
                      { 
                        backgroundColor: request.paymentStatus === 'verified' ? colors.success : colors.textTertiary,
                        opacity: request.paymentStatus === 'verified' ? 1 : 0.5,
                      }
                    ]}
                    onPress={() => handleApproveRequest(request.id)}
                    disabled={request.paymentStatus !== 'verified'}
                  >
                    <Text style={[styles.requestButtonText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>
                      {request.paymentStatus === 'verified' ? 'Approve Request' : 'Approve (Payment Required)'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.requestButton, { backgroundColor: colors.error }]}
                    onPress={() => handleCancelRequest(request.id)}
                  >
                    <Text style={[styles.requestButtonText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Payment Notes */}
              {request.paymentNotes && (
                <View style={[styles.notesContainer, { backgroundColor: `${colors.warning}20` }]}>
                  <Text style={[styles.notesLabel, { color: colors.textSecondary, fontFamily: Fonts.semiBold }]}>Admin Notes:</Text>
                  <Text style={[styles.notesText, { color: colors.text, fontFamily: Fonts.light }]}>{request.paymentNotes}</Text>
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
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  filterButtonText: {
    fontSize: Fonts.sizes.sm,
  },
  scrollView: {
    flex: 1,
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
    alignItems: 'center',
  },
  statValue: {
    fontSize: Fonts.sizes['2xl'],
  },
  statLabel: {
    fontSize: Fonts.sizes.xs,
    marginTop: 4,
  },
  filtersContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  filtersTitle: {
    fontSize: Fonts.sizes.lg,
    marginBottom: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: Fonts.sizes.sm,
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
    borderWidth: 1,
    marginRight: 8,
  },
  clearFiltersButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  clearFiltersText: {
    fontSize: Fonts.sizes.sm,
  },
  resultsHeader: {
    marginBottom: 12,
  },
  resultsText: {
    fontSize: Fonts.sizes.sm,
  },
  requestCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
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
    fontSize: Fonts.sizes.lg,
    marginBottom: 4,
  },
  requestDealerName: {
    fontSize: Fonts.sizes.sm,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: Fonts.sizes.xs,
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
    fontSize: Fonts.sizes.xs,
    marginBottom: 2,
  },
  requestDetailValue: {
    fontSize: Fonts.sizes.sm,
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
  requestButtonText: {
    fontSize: Fonts.sizes.sm,
  },
  paymentStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  paymentStatusLabel: {
    fontSize: Fonts.sizes.sm,
  },
  paymentStatusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  paymentStatusText: {
    fontSize: Fonts.sizes.xs,
  },
  receiptContainer: {
    marginBottom: 12,
  },
  receiptLabel: {
    fontSize: Fonts.sizes.sm,
    marginBottom: 8,
  },
  receiptImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#111827',
  },
  paymentActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  paymentButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  paymentButtonText: {
    fontSize: Fonts.sizes.sm,
  },
  notesContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  notesLabel: {
    fontSize: Fonts.sizes.xs,
    marginBottom: 4,
  },
  notesText: {
    fontSize: Fonts.sizes.sm,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Fonts.sizes.base,
    textAlign: 'center',
  },
});

