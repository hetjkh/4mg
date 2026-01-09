import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, useColorScheme, Alert, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getUser, User } from '@/services/authService';
import { getSalesmanStock, SalesmanStock } from '@/services/stockAllocationService';

export default function MyStockScreen() {
  const [stocks, setStocks] = useState<SalesmanStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    loadUser();
    loadStock();
  }, []);

  const loadUser = async () => {
    try {
      const user = await getUser();
      setCurrentUser(user);
      if (user?.role !== 'salesman') {
        Alert.alert('Access Denied', 'Only salesmen can access this page.');
        router.back();
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadStock = async () => {
    try {
      setLoading(true);
      const data = await getSalesmanStock();
      setStocks(data);
    } catch (err: any) {
      console.error('Error loading stock:', err);
      Alert.alert('Error', err.message || 'Failed to load stock');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#60A5FA" />
          <Text style={styles.loadingText}>Loading...</Text>
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
        <Text style={styles.headerTitle}>My Stock</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {stocks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No stock allocated yet. Your dealer will allocate stock to you.
            </Text>
          </View>
        ) : (
          stocks.map((stock) => (
            <View key={stock.product.id} style={styles.stockCard}>
              <View style={styles.stockHeader}>
                {stock.product.image ? (
                  <Image source={{ uri: stock.product.image }} style={styles.productImage} />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <Text style={styles.placeholderText}>No Image</Text>
                  </View>
                )}
                <View style={styles.stockInfo}>
                  <Text style={styles.productTitle}>{stock.product.title}</Text>
                  <Text style={styles.stockDetail}>
                    ₹{stock.product.packetPrice.toFixed(2)} per packet
                  </Text>
                  <Text style={styles.stockDetail}>
                    {stock.product.packetsPerStrip} packets = 1 strip
                  </Text>
                </View>
              </View>

              <View style={styles.totalStock}>
                <Text style={styles.totalStockLabel}>Total Allocated Strips:</Text>
                <Text style={styles.totalStockValue}>{stock.totalStrips}</Text>
              </View>

              {stock.allocations.length > 0 && (
                <View style={styles.allocationsSection}>
                  <Text style={styles.allocationsTitle}>Allocations:</Text>
                  {stock.allocations.map((allocation) => (
                    <View key={allocation.id} style={styles.allocationItem}>
                      <View style={styles.allocationHeader}>
                        <Text style={styles.allocationStrips}>{allocation.strips} strips</Text>
                        <Text style={styles.allocationDate}>
                          {new Date(allocation.allocatedAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text style={styles.allocationDealer}>
                        From: {allocation.dealer.name}
                      </Text>
                      {allocation.notes && (
                        <Text style={styles.allocationNotes}>{allocation.notes}</Text>
                      )}
                    </View>
                  ))}
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
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    padding: 16,
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
  stockCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    backgroundColor: '#1D1D1D',
    borderColor: '#374151',
  },
  stockHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#D1D5DB',
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#D1D5DB',
  },
  placeholderText: {
    fontSize: 12,
    fontFamily: 'Poppins-Light',
    color: '#9CA3AF',
  },
  stockInfo: {
    flex: 1,
    gap: 4,
  },
  productTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
  stockDetail: {
    fontSize: 14,
    fontFamily: 'Poppins-Light',
    color: '#D1D5DB',
  },
  totalStock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#374151',
    marginBottom: 12,
  },
  totalStockLabel: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#D1D5DB',
  },
  totalStockValue: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#10B981',
  },
  allocationsSection: {
    marginTop: 8,
  },
  allocationsTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#D1D5DB',
    marginBottom: 8,
  },
  allocationItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#111827',
    marginBottom: 8,
  },
  allocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  allocationStrips: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#60A5FA',
  },
  allocationDate: {
    fontSize: 12,
    fontFamily: 'Poppins-Light',
    color: '#9CA3AF',
  },
  allocationDealer: {
    fontSize: 14,
    fontFamily: 'Poppins-Light',
    color: '#D1D5DB',
    marginBottom: 4,
  },
  allocationNotes: {
    fontSize: 12,
    fontFamily: 'Poppins-Light',
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});

