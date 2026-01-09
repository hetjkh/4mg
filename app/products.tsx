import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, useColorScheme, Alert, ActivityIndicator, Image, Platform, Modal } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { createProduct, getProducts, deleteProduct, updateProduct, Product } from '@/services/productService';
import { getUser, User } from '@/services/authService';
import { uploadImage } from '@/services/uploadService';

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [packetPrice, setPacketPrice] = useState('');
  const [packetsPerStrip, setPacketsPerStrip] = useState('');
  const [image, setImage] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [stock, setStock] = useState('');
  const [error, setError] = useState('');
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingStockProduct, setEditingStockProduct] = useState<Product | null>(null);
  const [newStockValue, setNewStockValue] = useState('');

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    loadUser();
    loadProducts();
    requestImagePermission();
  }, []);

  const requestImagePermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to upload images!');
      }
    }
  };

  const loadUser = async () => {
    try {
      const user = await getUser();
      setCurrentUser(user);
      if (user?.role !== 'admin') {
        Alert.alert('Access Denied', 'Only administrators can manage products.');
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


  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setError('');
        
        // Upload image immediately
        setUploadingImage(true);
        try {
          const imageUrl = await uploadImage(result.assets[0].uri);
          setImage(imageUrl);
          Alert.alert('Success', 'Image uploaded successfully!');
        } catch (err: any) {
          setError(err.message || 'Failed to upload image');
          setImageUri(null);
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (err: any) {
      console.error('Image picker error:', err);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPacketPrice('');
    setPacketsPerStrip('');
    setImage('');
    setImageUri(null);
    setStock('');
    setEditingProductId(null);
    setError('');
  };

  const handleEdit = (product: Product) => {
    setEditingProductId(product.id);
    setTitle(product.title);
    setDescription(product.description || '');
    setPacketPrice(product.packetPrice.toString());
    setPacketsPerStrip(product.packetsPerStrip.toString());
    setImage(product.image);
    setImageUri(product.image);
    setStock(product.stock.toString());
    setShowForm(true);
    setError('');
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim() || !packetPrice.trim() || !packetsPerStrip.trim() || !image.trim() || !stock.trim()) {
      setError('Please fill in all required fields (title, packet price, packets per strip, image, stock)');
      return;
    }

    const packetPriceNum = parseFloat(packetPrice);
    const packetsPerStripNum = parseInt(packetsPerStrip, 10);
    const stockNum = parseInt(stock, 10);

    if (isNaN(packetPriceNum) || packetPriceNum < 0) {
      setError('Packet price must be a valid positive number');
      return;
    }

    if (isNaN(packetsPerStripNum) || packetsPerStripNum < 1) {
      setError('Packets per strip must be at least 1');
      return;
    }

    if (isNaN(stockNum) || stockNum < 0) {
      setError('Stock must be a valid positive number (in strips)');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (editingProductId) {
        // Update existing product
        await updateProduct(
          editingProductId,
          title.trim(),
          description.trim(),
          packetPriceNum,
          packetsPerStripNum,
          image.trim(),
          stockNum
        );
        Alert.alert('Success', 'Product updated successfully!', [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              setShowForm(false);
              loadProducts();
            },
          },
        ]);
      } else {
        // Create new product
        await createProduct(title.trim(), description.trim(), packetPriceNum, packetsPerStripNum, image.trim(), stockNum);
        Alert.alert('Success', 'Product created successfully!', [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              setShowForm(false);
              loadProducts();
            },
          },
        ]);
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${editingProductId ? 'update' : 'create'} product`);
      Alert.alert('Error', err.message || `Failed to ${editingProductId ? 'update' : 'create'} product`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStockUpdate = (product: Product) => {
    setEditingStockProduct(product);
    setNewStockValue(product.stock.toString());
    setShowStockModal(true);
  };

  const handleStockModalSubmit = async () => {
    if (!editingStockProduct) return;

    if (!newStockValue || newStockValue.trim() === '') {
      Alert.alert('Error', 'Please enter a stock amount');
      return;
    }

    const stockNum = parseInt(newStockValue.trim(), 10);
    if (isNaN(stockNum) || stockNum < 0) {
      Alert.alert('Error', 'Stock must be a valid positive number');
      return;
    }

    try {
      await updateProduct(
        editingStockProduct.id,
        editingStockProduct.title,
        editingStockProduct.description,
        editingStockProduct.packetPrice,
        editingStockProduct.packetsPerStrip,
        editingStockProduct.image,
        stockNum
      );
      Alert.alert('Success', 'Stock updated successfully!');
      setShowStockModal(false);
      setEditingStockProduct(null);
      setNewStockValue('');
      loadProducts();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update stock');
    }
  };

  const handleDelete = (productId: string, productTitle: string) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${productTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(productId);
              Alert.alert('Success', 'Product deleted successfully');
              loadProducts();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete product');
            }
          },
        },
      ]
    );
  };


  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#60A5FA" />
          <Text style={styles.loadingText}>
            Loading products...
          </Text>
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
        <Text style={styles.headerTitle}>Products</Text>
        <TouchableOpacity
          onPress={() => {
            if (showForm) {
              handleCancel();
            } else {
              setShowForm(true);
            }
          }}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>{showForm ? 'Cancel' : '+ Add'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Add/Edit Product Form */}
        {showForm && (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>
              {editingProductId ? 'Edit Product' : 'Add New Product'}
            </Text>
            
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TextInput
              style={styles.input}
              placeholder="Product Title *"
              placeholderTextColor="#6B7280"
              value={title}
              onChangeText={(text) => { setTitle(text); setError(''); }}
              editable={!submitting}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              placeholderTextColor="#6B7280"
              value={description}
              onChangeText={(text) => { setDescription(text); setError(''); }}
              multiline
              numberOfLines={3}
              editable={!submitting}
            />

            {/* Image Picker */}
            <View style={styles.imagePickerContainer}>
              <Text style={styles.label}>
                Product Image *
              </Text>
              
              {imageUri ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                  {uploadingImage && (
                    <View style={styles.uploadingOverlay}>
                      <ActivityIndicator size="large" color="#1D1D1D" />
                      <Text style={styles.uploadingText}>Uploading...</Text>
                    </View>
                  )}
                  {image && !uploadingImage && (
                    <TouchableOpacity
                      style={[styles.removeImageButton, { backgroundColor: '#DC2626' }]}
                      onPress={() => {
                        setImageUri(null);
                        setImage('');
                      }}
                    >
                      <Text style={styles.removeImageText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={pickImage}
                  disabled={submitting || uploadingImage}
                >
                  {uploadingImage ? (
                    <ActivityIndicator color="#2563EB" />
                  ) : (
                    <>
                      <Text style={styles.imagePickerText}>
                        📷 Pick Image
                      </Text>
                      <Text style={styles.imagePickerHint}>
                        Tap to select from gallery
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <TextInput
                  style={styles.input}
                  placeholder="Packet Price (₹) *"
                  placeholderTextColor="#6B7280"
                  value={packetPrice}
                  onChangeText={(text) => { setPacketPrice(text); setError(''); }}
                  keyboardType="decimal-pad"
                  editable={!submitting}
                />
              </View>

              <View style={styles.halfInput}>
                <TextInput
                  style={styles.input}
                  placeholder="Packets per Strip *"
                  placeholderTextColor="#6B7280"
                  value={packetsPerStrip}
                  onChangeText={(text) => { setPacketsPerStrip(text); setError(''); }}
                  keyboardType="number-pad"
                  editable={!submitting}
                />
              </View>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Stock (in strips) *"
              placeholderTextColor="#6B7280"
              value={stock}
              onChangeText={(text) => { setStock(text); setError(''); }}
              keyboardType="number-pad"
              editable={!submitting}
            />

            <TouchableOpacity
              style={[styles.submitButton, { opacity: submitting ? 0.6 : 1 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#1D1D1D" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {editingProductId ? 'Update Product' : 'Create Product'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Products List */}
        <View style={styles.productsContainer}>
          <Text style={styles.sectionTitle}>
            All Products ({products.length})
          </Text>

          {products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No products yet. Add your first product!
              </Text>
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
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Packet Price:</Text>
                      <Text style={styles.detailValue}>₹{product.packetPrice.toFixed(2)}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Per Strip:</Text>
                      <Text style={styles.detailValue}>{product.packetsPerStrip} packets</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Stock:</Text>
                      <Text style={[styles.detailValue, { color: product.stock > 0 ? '#059669' : '#DC2626' }]}>
                        {product.stock} strips
                      </Text>
                    </View>
                  </View>

                  <View style={styles.productActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEdit(product)}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.stockButton}
                      onPress={() => handleQuickStockUpdate(product)}
                    >
                      <Text style={styles.stockButtonText}>Stock</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(product.id, product.title)}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Stock Update Modal */}
      <Modal
        visible={showStockModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStockModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Update Stock
            </Text>
            {editingStockProduct && (
              <Text style={styles.modalSubtitle}>
                {editingStockProduct.title}
              </Text>
            )}
            <Text style={styles.modalLabel}>
              Current stock: {editingStockProduct?.stock} units
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter new stock amount"
              placeholderTextColor="#6B7280"
              value={newStockValue}
              onChangeText={setNewStockValue}
              keyboardType="number-pad"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowStockModal(false);
                  setEditingStockProduct(null);
                  setNewStockValue('');
                }}
              >
                <Text style={styles.modalCancelButtonText}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSubmitButton]}
                onPress={handleStockModalSubmit}
              >
                <Text style={styles.modalButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
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
    color: '#1D1D1D',
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
    color: '#1D1D1D',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  addButtonText: {
    color: '#1D1D1D',
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
  formContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: '#E5E7EB',
  },
  formTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#111827',
    marginBottom: 8,
  },
  imagePickerContainer: {
    marginBottom: 12,
  },
  imagePickerButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    backgroundColor: '#E5E7EB',
    borderColor: '#9CA3AF',
  },
  imagePickerText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  imagePickerHint: {
    fontSize: 12,
    fontFamily: 'Poppins-Light',
    color: '#6B7280',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginTop: 8,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    color: '#1D1D1D',
    marginTop: 8,
    fontSize: 14,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  removeImageText: {
    color: '#1D1D1D',
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#D1D5DB',
    borderColor: '#9CA3AF',
    color: '#111827',
    fontFamily: 'Poppins-Light',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    backgroundColor: '#3B82F6',
  },
  submitButtonText: {
    color: '#1D1D1D',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#FEE2E2',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Poppins-Light',
    textAlign: 'center',
    color: '#DC2626',
  },
  productsContainer: {
    gap: 16,
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
  productCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    backgroundColor: '#1D1D1D',
    borderColor: '#374151',
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
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  detailItem: {
    flexDirection: 'row',
    gap: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Light',
    color: '#D1D5DB',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#2563EB',
  },
  editButtonText: {
    color: '#1D1D1D',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  stockButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  stockButtonText: {
    color: '#1D1D1D',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#DC2626',
  },
  deleteButtonText: {
    color: '#1D1D1D',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 24,
    gap: 16,
    backgroundColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
  modalLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Light',
    color: '#111827',
    marginTop: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginTop: 8,
    backgroundColor: '#D1D5DB',
    borderColor: '#9CA3AF',
    color: '#111827',
    fontFamily: 'Poppins-Light',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#9CA3AF',
  },
  modalSubmitButton: {
    backgroundColor: '#10B981',
  },
  modalButtonText: {
    color: '#1D1D1D',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  modalCancelButtonText: {
    color: '#1D1D1D',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
});

