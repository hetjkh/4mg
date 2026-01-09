import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, useColorScheme, Alert, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getProducts, Product } from '@/services/productService';
import { getUser, User } from '@/services/authService';
import { createDealerRequest, getDealerRequests, DealerRequest } from '@/services/dealerRequestService';

export default function DealerDashboardScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [requests, setRequests] = useState<DealerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [strips, setStrips] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    loadUser();
    loadProducts();
    loadRequests();
  }, []);

  const loadUser = async () => {
    try {
      const user = await getUser();
      setCurrentUser(user);
      if (user?.role !== 'dealer' && user?.role !== 'dellear') {
        Alert.alert('Access Denied', 'Only dealers can access this page.');
        router.back();
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (err: any) {
      console.error('Error loading products:', err);
      Alert.alert('Error', err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      setLoadingRequests(true);
      const data = await getDealerRequests();
      setRequests(data);
    } catch (err: any) {
      console.error('Error loading requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleRequest = (product: Product) => {
    setSelectedProduct(product);
    setStrips('');
    setShowRequestForm(true);
  };

  const handleSubmitRequest = async () => {
    if (!selectedProduct) return;

    if (!strips.trim()) {
      Alert.alert('Error', 'Please enter number of strips');
      return;
    }

    const stripsNum = parseInt(strips, 10);
    if (isNaN(stripsNum) || stripsNum < 1) {
      Alert.alert('Error', 'Strips must be at least 1');
      return;
    }

    if (selectedProduct.stock < stripsNum) {
      Alert.alert('Error', `Insufficient stock. Available: ${selectedProduct.stock} strips`);
      return;
    }

    setSubmitting(true);

    try {
      await createDealerRequest(selectedProduct.id, stripsNum);
      Alert.alert('Success', 'Request submitted successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setShowRequestForm(false);
            setSelectedProduct(null);
            setStrips('');
            loadRequests();
            loadProducts();
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
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
        <Text style={styles.headerTitle}>Dealer Dashboard</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Request Form Modal */}
        {showRequestForm && selectedProduct && (
          <View style={styles.requestFormContainer}>
            <Text style={styles.formTitle}>Request Strips</Text>
            <Text style={styles.formSubtitle}>{selectedProduct.title}</Text>
            
            <View style={styles.productInfoCard}>
              <Text style={styles.infoLabel}>Packet Price: ₹{selectedProduct.packetPrice.toFixed(2)}</Text>
              <Text style={styles.infoLabel}>Packets per Strip: {selectedProduct.packetsPerStrip}</Text>
              <Text style={styles.infoLabel}>Available Stock: {selectedProduct.stock} strips</Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Number of Strips"
              placeholderTextColor="#6B7280"
              value={strips}
              onChangeText={setStrips}
              keyboardType="number-pad"
              editable={!submitting}
            />

            {strips && !isNaN(parseInt(strips, 10)) && parseInt(strips, 10) > 0 && (
              <View style={styles.calculationCard}>
                <Text style={styles.calculationText}>
                  Total Packets: {parseInt(strips, 10) * selectedProduct.packetsPerStrip}
                </Text>
                <Text style={styles.calculationText}>
                  Total Value: ₹{(parseInt(strips, 10) * selectedProduct.packetsPerStrip * selectedProduct.packetPrice).toFixed(2)}
                </Text>
              </View>
            )}

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.formButton, styles.cancelFormButton]}
                onPress={() => {
                  setShowRequestForm(false);
                  setSelectedProduct(null);
                  setStrips('');
                }}
                disabled={submitting}
              >
                <Text style={styles.formButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formButton, styles.submitFormButton, { opacity: submitting ? 0.6 : 1 }]}
                onPress={handleSubmitRequest}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.formButtonText}>Submit Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* My Requests Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Requests ({requests.length})</Text>
          
          {loadingRequests ? (
            <ActivityIndicator size="large" color="#60A5FA" />
          ) : requests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No requests yet. Request strips from products below.</Text>
            </View>
          ) : (
            requests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Text style={styles.requestProductTitle}>{request.product.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                    <Text style={styles.statusText}>{request.status.toUpperCase()}</Text>
                  </View>
                </View>
                
                <View style={styles.requestDetails}>
                  <Text style={styles.requestDetailText}>
                    Requested: {request.strips} strips ({request.strips * request.product.packetsPerStrip} packets)
                  </Text>
                  <Text style={styles.requestDetailText}>
                    Requested At: {new Date(request.requestedAt).toLocaleString()}
                  </Text>
                  {request.processedAt && (
                    <Text style={styles.requestDetailText}>
                      Processed At: {new Date(request.processedAt).toLocaleString()}
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Products Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Products ({products.length})</Text>
          
          {products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No products available.</Text>
            </View>
          ) : (
            products.map((product) => (
              <View key={product.id} style={styles.productCard}>
                {product.image ? (
                  <Image source={{ uri: product.image }} style={styles.productImage} />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <Text style={styles.placeholderText}>No Image</Text>
                  </View>
                )}
                
                <View style={styles.productInfo}>
                  <Text style={styles.productTitle}>{product.title}</Text>
                  {product.description ? (
                    <Text style={styles.productDescription} numberOfLines={2}>
                      {product.description}
                    </Text>
                  ) : null}
                  
                  <View style={styles.productDetails}>
                    <Text style={styles.detailText}>
                      ₹{product.packetPrice.toFixed(2)} per packet
                    </Text>
                    <Text style={styles.detailText}>
                      {product.packetsPerStrip} packets = 1 strip
                    </Text>
                    <Text style={[styles.detailText, { color: product.stock > 0 ? '#10B981' : '#DC2626' }]}>
                      Stock: {product.stock} strips
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.requestButton, { opacity: product.stock > 0 ? 1 : 0.5 }]}
                    onPress={() => handleRequest(product)}
                    disabled={product.stock === 0}
                  >
                    <Text style={styles.requestButtonText}>
                      {product.stock > 0 ? 'Request Strips' : 'Out of Stock'}
                    </Text>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  requestFormContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: '#1D1D1D',
    borderWidth: 1,
    borderColor: '#374151',
  },
  formTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#D1D5DB',
    marginBottom: 16,
  },
  productInfoCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#111827',
    marginBottom: 16,
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Light',
    color: '#D1D5DB',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#111827',
    borderColor: '#374151',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Light',
  },
  calculationCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#111827',
    marginBottom: 16,
    gap: 4,
  },
  calculationText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#60A5FA',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  formButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelFormButton: {
    backgroundColor: '#6B7280',
  },
  submitFormButton: {
    backgroundColor: '#3B82F6',
  },
  formButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
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
    gap: 4,
  },
  requestDetailText: {
    fontSize: 14,
    fontFamily: 'Poppins-Light',
    color: '#D1D5DB',
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
  productCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    backgroundColor: '#1D1D1D',
    borderColor: '#374151',
    gap: 12,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#D1D5DB',
  },
  productImagePlaceholder: {
    width: 100,
    height: 100,
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
  productInfo: {
    flex: 1,
    gap: 8,
  },
  productTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
  productDescription: {
    fontSize: 14,
    fontFamily: 'Poppins-Light',
    color: '#D1D5DB',
  },
  productDetails: {
    gap: 4,
    marginTop: 4,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Poppins-Light',
    color: '#D1D5DB',
  },
  requestButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    marginTop: 8,
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
});

