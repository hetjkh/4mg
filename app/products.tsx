import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, useColorScheme, Alert, ActivityIndicator, Image, Platform } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { createProduct, getProducts, deleteProduct, Product } from '@/services/productService';
import { getUser, User } from '@/services/authService';
import { uploadImage } from '@/services/uploadService';

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [stock, setStock] = useState('');
  const [error, setError] = useState('');

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

  const handleSubmit = async () => {
    // Validation
    if (!title.trim() || !price.trim() || !image.trim() || !stock.trim()) {
      setError('Please fill in all required fields (title, price, image, stock)');
      return;
    }

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock, 10);

    if (isNaN(priceNum) || priceNum < 0) {
      setError('Price must be a valid positive number');
      return;
    }

    if (isNaN(stockNum) || stockNum < 0) {
      setError('Stock must be a valid positive number');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await createProduct(title.trim(), description.trim(), priceNum, image.trim(), stockNum);
      Alert.alert('Success', 'Product created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setTitle('');
            setDescription('');
            setPrice('');
            setImage('');
            setImageUri(null);
            setStock('');
            setShowForm(false);
            loadProducts();
          },
        },
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to create product');
      Alert.alert('Error', err.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
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
      <View style={[styles.container, { backgroundColor: isDark ? '#111827' : '#FFFFFF' }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#2563EB'} />
          <Text style={[styles.loadingText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            Loading products...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#111827' : '#FFFFFF' }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB', borderBottomColor: isDark ? '#374151' : '#E5E7EB' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: isDark ? '#60A5FA' : '#2563EB' }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>Products</Text>
        <TouchableOpacity
          onPress={() => setShowForm(!showForm)}
          style={[styles.addButton, { backgroundColor: isDark ? '#3B82F6' : '#2563EB' }]}
        >
          <Text style={styles.addButtonText}>{showForm ? 'Cancel' : '+ Add'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Add Product Form */}
        {showForm && (
          <View style={[styles.formContainer, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB' }]}>
            <Text style={[styles.formTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>Add New Product</Text>
            
            {error ? (
              <View style={[styles.errorContainer, { backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2' }]}>
                <Text style={[styles.errorText, { color: isDark ? '#FCA5A5' : '#DC2626' }]}>{error}</Text>
              </View>
            ) : null}

            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#111827' : '#FFFFFF', borderColor: isDark ? '#374151' : '#E5E7EB', color: isDark ? '#FFFFFF' : '#111827' }]}
              placeholder="Product Title *"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={(text) => { setTitle(text); setError(''); }}
              editable={!submitting}
            />

            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: isDark ? '#111827' : '#FFFFFF', borderColor: isDark ? '#374151' : '#E5E7EB', color: isDark ? '#FFFFFF' : '#111827' }]}
              placeholder="Description (optional)"
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={(text) => { setDescription(text); setError(''); }}
              multiline
              numberOfLines={3}
              editable={!submitting}
            />

            {/* Image Picker */}
            <View style={styles.imagePickerContainer}>
              <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                Product Image *
              </Text>
              
              {imageUri ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                  {uploadingImage && (
                    <View style={styles.uploadingOverlay}>
                      <ActivityIndicator size="large" color="#FFFFFF" />
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
                  style={[styles.imagePickerButton, { 
                    backgroundColor: isDark ? '#374151' : '#E5E7EB',
                    borderColor: isDark ? '#4B5563' : '#D1D5DB',
                  }]}
                  onPress={pickImage}
                  disabled={submitting || uploadingImage}
                >
                  {uploadingImage ? (
                    <ActivityIndicator color={isDark ? '#60A5FA' : '#2563EB'} />
                  ) : (
                    <>
                      <Text style={[styles.imagePickerText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                        📷 Pick Image
                      </Text>
                      <Text style={[styles.imagePickerHint, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
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
                  style={[styles.input, { backgroundColor: isDark ? '#111827' : '#FFFFFF', borderColor: isDark ? '#374151' : '#E5E7EB', color: isDark ? '#FFFFFF' : '#111827' }]}
                  placeholder="Price *"
                  placeholderTextColor="#9CA3AF"
                  value={price}
                  onChangeText={(text) => { setPrice(text); setError(''); }}
                  keyboardType="decimal-pad"
                  editable={!submitting}
                />
              </View>

              <View style={styles.halfInput}>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? '#111827' : '#FFFFFF', borderColor: isDark ? '#374151' : '#E5E7EB', color: isDark ? '#FFFFFF' : '#111827' }]}
                  placeholder="Stock *"
                  placeholderTextColor="#9CA3AF"
                  value={stock}
                  onChangeText={(text) => { setStock(text); setError(''); }}
                  keyboardType="number-pad"
                  editable={!submitting}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: isDark ? '#3B82F6' : '#2563EB', opacity: submitting ? 0.6 : 1 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Create Product</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Products List */}
        <View style={styles.productsContainer}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
            All Products ({products.length})
          </Text>

          {products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                No products yet. Add your first product!
              </Text>
            </View>
          ) : (
            products.map((product) => (
              <View key={product.id} style={[styles.productCard, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB', borderColor: isDark ? '#374151' : '#E5E7EB' }]}>
                {product.image ? (
                  <Image source={{ uri: product.image }} style={styles.productImage} />
                ) : (
                  <View style={[styles.productImagePlaceholder, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
                    <Text style={[styles.placeholderText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>No Image</Text>
                  </View>
                )}
                
                <View style={styles.productInfo}>
                  <Text style={[styles.productTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>{product.title}</Text>
                  {product.description ? (
                    <Text style={[styles.productDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]} numberOfLines={2}>
                      {product.description}
                    </Text>
                  ) : null}
                  
                  <View style={styles.productDetails}>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Price:</Text>
                      <Text style={[styles.detailValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>${product.price.toFixed(2)}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Stock:</Text>
                      <Text style={[styles.detailValue, { color: product.stock > 0 ? (isDark ? '#10B981' : '#059669') : (isDark ? '#EF4444' : '#DC2626') }]}>
                        {product.stock} units
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.deleteButton, { backgroundColor: '#DC2626' }]}
                    onPress={() => handleDelete(product.id, product.title)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
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
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  formContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
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
  },
  imagePickerText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  imagePickerHint: {
    fontSize: 12,
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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
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
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  productsContainer: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  productCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  productImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
  },
  productInfo: {
    flex: 1,
    gap: 8,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  productDescription: {
    fontSize: 14,
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
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

