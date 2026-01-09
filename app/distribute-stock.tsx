import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, useColorScheme, Alert, ActivityIndicator, Image, Modal } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getUser, User } from '@/services/authService';
import { getDealerStock, getDealerSalesmen, allocateStock, DealerStock, Salesman } from '@/services/stockAllocationService';

export default function DistributeStockScreen() {
  const [stocks, setStocks] = useState<DealerStock[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<DealerStock | null>(null);
  const [selectedSalesman, setSelectedSalesman] = useState<string>('');
  const [stripsToAllocate, setStripsToAllocate] = useState('');
  const [notes, setNotes] = useState('');
  const [allocating, setAllocating] = useState(false);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    loadUser();
    loadData();
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

  const loadData = async () => {
    try {
      setLoading(true);
      const [stocksData, salesmenData] = await Promise.all([
        getDealerStock(),
        getDealerSalesmen(),
      ]);
      setStocks(stocksData);
      setSalesmen(salesmenData);
    } catch (err: any) {
      console.error('Error loading data:', err);
      Alert.alert('Error', err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAllocate = (stock: DealerStock) => {
    if (stock.availableStrips <= 0) {
      Alert.alert('No Stock Available', 'This product has no available stock to allocate.');
      return;
    }
    if (salesmen.length === 0) {
      Alert.alert('No Salesmen', 'You need to create salesmen first before allocating stock.');
      return;
    }
    setSelectedStock(stock);
    setSelectedSalesman('');
    setStripsToAllocate('');
    setNotes('');
    setShowAllocateModal(true);
  };

  const handleSubmitAllocation = async () => {
    if (!selectedStock || !selectedSalesman || !stripsToAllocate.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const strips = parseInt(stripsToAllocate, 10);
    if (isNaN(strips) || strips < 1) {
      Alert.alert('Error', 'Strips must be at least 1');
      return;
    }

    if (strips > selectedStock.availableStrips) {
      Alert.alert('Error', `Insufficient stock. Available: ${selectedStock.availableStrips} strips`);
      return;
    }

    setAllocating(true);
    try {
      await allocateStock(selectedSalesman, selectedStock.product.id, strips, notes);
      Alert.alert('Success', `Successfully allocated ${strips} strips!`, [
        {
          text: 'OK',
          onPress: () => {
            setShowAllocateModal(false);
            loadData();
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to allocate stock');
    } finally {
      setAllocating(false);
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
        <Text style={styles.headerTitle}>Distribute Stock</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {stocks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No stock available. Stock will appear here after your requests are approved.
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

              <View style={styles.stockStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Total Strips</Text>
                  <Text style={styles.statValue}>{stock.totalStrips}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Allocated</Text>
                  <Text style={[styles.statValue, { color: '#3B82F6' }]}>{stock.allocatedStrips}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Available</Text>
                  <Text style={[styles.statValue, { color: stock.availableStrips > 0 ? '#10B981' : '#DC2626' }]}>
                    {stock.availableStrips}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.allocateButton,
                  { opacity: stock.availableStrips > 0 && salesmen.length > 0 ? 1 : 0.5 },
                ]}
                onPress={() => handleAllocate(stock)}
                disabled={stock.availableStrips === 0 || salesmen.length === 0}
              >
                <Text style={styles.allocateButtonText}>
                  {stock.availableStrips > 0 ? 'Allocate Stock' : 'No Stock Available'}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Allocation Modal */}
      <Modal
        visible={showAllocateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAllocateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Allocate Stock</Text>
            {selectedStock && (
              <>
                <Text style={styles.modalSubtitle}>{selectedStock.product.title}</Text>
                <Text style={styles.modalInfo}>
                  Available: {selectedStock.availableStrips} strips
                </Text>

                <Text style={styles.inputLabel}>Select Salesman:</Text>
                <ScrollView style={styles.salesmanList}>
                  {salesmen.map((salesman) => (
                    <TouchableOpacity
                      key={salesman.id}
                      style={[
                        styles.salesmanOption,
                        selectedSalesman === salesman.id && styles.salesmanOptionSelected,
                      ]}
                      onPress={() => setSelectedSalesman(salesman.id)}
                    >
                      <Text
                        style={[
                          styles.salesmanOptionText,
                          selectedSalesman === salesman.id && styles.salesmanOptionTextSelected,
                        ]}
                      >
                        {salesman.name} ({salesman.email})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>Number of Strips:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter strips to allocate"
                  placeholderTextColor="#6B7280"
                  value={stripsToAllocate}
                  onChangeText={setStripsToAllocate}
                  keyboardType="number-pad"
                  editable={!allocating}
                />

                <Text style={styles.inputLabel}>Notes (Optional):</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Add notes about this allocation"
                  placeholderTextColor="#6B7280"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  editable={!allocating}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowAllocateModal(false)}
                    disabled={allocating}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.submitButton, { opacity: allocating ? 0.6 : 1 }]}
                    onPress={handleSubmitAllocation}
                    disabled={allocating}
                  >
                    {allocating ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.modalButtonText}>Allocate</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  stockStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#374151',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Light',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
  allocateButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  allocateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1D1D1D',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#374151',
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#D1D5DB',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalInfo: {
    fontSize: 14,
    fontFamily: 'Poppins-Light',
    color: '#9CA3AF',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#D1D5DB',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#111827',
    borderColor: '#374151',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Light',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  salesmanList: {
    maxHeight: 150,
    marginBottom: 12,
  },
  salesmanOption: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
  },
  salesmanOptionSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  salesmanOptionText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#D1D5DB',
  },
  salesmanOptionTextSelected: {
    color: '#FFFFFF',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
});

