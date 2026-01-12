import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Image, Platform, Modal } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { createProduct, getProducts, deleteProduct, updateProduct, Product } from '@/services/productService';
import { getUser, User } from '@/services/authService';
import { uploadImage } from '@/services/uploadService';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, Fonts } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { HeaderWithMenu } from '@/components/HeaderWithMenu';

export default function ProductsScreen() {
  const { isDark, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleGu, setTitleGu] = useState('');
  const [descriptionGu, setDescriptionGu] = useState('');
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
    setTitleGu('');
    setDescriptionGu('');
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
    setTitleGu(''); // Gujarati data not available in response (will be empty initially)
    setDescriptionGu(''); // Gujarati data not available in response (will be empty initially)
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
          stockNum,
          titleGu.trim() || undefined,
          descriptionGu.trim() || undefined
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
        await createProduct(
          title.trim(),
          description.trim(),
          packetPriceNum,
          packetsPerStripNum,
          image.trim(),
          stockNum,
          titleGu.trim() || undefined,
          descriptionGu.trim() || undefined
        );
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
        stockNum,
        undefined, // titleGu - not updating, keep existing
        undefined  // descriptionGu - not updating, keep existing
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primaryLight} />
          <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: Fonts.light }]}>
            Loading products...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <HeaderWithMenu
        title="Products"
        rightButton={
          <TouchableOpacity
            onPress={() => {
              if (showForm) {
                handleCancel();
              } else {
                setShowForm(true);
              }
            }}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.addButtonText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>{showForm ? 'Cancel' : '+ Add'}</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={[styles.scrollView, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
        {/* Add/Edit Product Form */}
        {showForm && (
          <View style={[styles.formContainer, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.formTitle, { color: colors.text, fontFamily: Fonts.bold }]}>
              {editingProductId ? 'Edit Product' : 'Add New Product'}
            </Text>
            
            {error ? (
              <View style={[styles.errorContainer, { backgroundColor: `${colors.error}20` }]}>
                <Text style={[styles.errorText, { color: colors.error, fontFamily: Fonts.light }]}>{error}</Text>
              </View>
            ) : null}

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.inputText,
                  fontFamily: Fonts.regular,
                },
              ]}
              placeholder="Product Title *"
              placeholderTextColor={colors.inputPlaceholder}
              value={title}
              onChangeText={(text) => { setTitle(text); setError(''); }}
              editable={!submitting}
            />

            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.inputText,
                  fontFamily: Fonts.regular,
                },
              ]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.inputPlaceholder}
              value={description}
              onChangeText={(text) => { setDescription(text); setError(''); }}
              multiline
              numberOfLines={3}
              editable={!submitting}
            />

            {/* Gujarati Title */}
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.inputText,
                  fontFamily: Fonts.regular,
                },
              ]}
              placeholder="Product Title (Gujarati) - Optional"
              placeholderTextColor={colors.inputPlaceholder}
              value={titleGu}
              onChangeText={(text) => { setTitleGu(text); setError(''); }}
              editable={!submitting}
            />

            {/* Gujarati Description */}
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.inputText,
                  fontFamily: Fonts.regular,
                },
              ]}
              placeholder="Description (Gujarati) - Optional"
              placeholderTextColor={colors.inputPlaceholder}
              value={descriptionGu}
              onChangeText={(text) => { setDescriptionGu(text); setError(''); }}
              multiline
              numberOfLines={3}
              editable={!submitting}
            />

            {/* Image Picker */}
            <View style={styles.imagePickerContainer}>
              <Text style={[styles.label, { color: colors.textSecondary, fontFamily: Fonts.medium }]}>
                Product Image *
              </Text>
              
              {imageUri ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: imageUri }} style={[styles.imagePreview, { backgroundColor: colors.inputBackground }]} />
                  {uploadingImage && (
                    <View style={[styles.uploadingOverlay, { backgroundColor: colors.overlayDark }]}>
                      <ActivityIndicator size="large" color={colors.textInverse} />
                      <Text style={[styles.uploadingText, { color: colors.textInverse, fontFamily: Fonts.light }]}>Uploading...</Text>
                    </View>
                  )}
                  {image && !uploadingImage && (
                    <TouchableOpacity
                      style={[styles.removeImageButton, { backgroundColor: colors.error }]}
                      onPress={() => {
                        setImageUri(null);
                        setImage('');
                      }}
                    >
                      <Text style={[styles.removeImageText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.imagePickerButton,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                  onPress={pickImage}
                  disabled={submitting || uploadingImage}
                >
                  {uploadingImage ? (
                    <ActivityIndicator color={colors.primaryDark} />
                  ) : (
                    <>
                      <Text style={[styles.imagePickerText, { color: colors.text, fontFamily: Fonts.semiBold }]}>
                        📷 Pick Image
                      </Text>
                      <Text style={[styles.imagePickerHint, { color: colors.textTertiary, fontFamily: Fonts.light }]}>
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
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.inputBorder,
                      color: colors.inputText,
                      fontFamily: Fonts.regular,
                    },
                  ]}
                  placeholder="Packet Price (₹) *"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={packetPrice}
                  onChangeText={(text) => { setPacketPrice(text); setError(''); }}
                  keyboardType="decimal-pad"
                  editable={!submitting}
                />
              </View>

              <View style={styles.halfInput}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.inputBorder,
                      color: colors.inputText,
                      fontFamily: Fonts.regular,
                    },
                  ]}
                  placeholder="Packets per Strip *"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={packetsPerStrip}
                  onChangeText={(text) => { setPacketsPerStrip(text); setError(''); }}
                  keyboardType="number-pad"
                  editable={!submitting}
                />
              </View>
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.inputText,
                  fontFamily: Fonts.regular,
                },
              ]}
              placeholder="Stock (in strips) *"
              placeholderTextColor={colors.inputPlaceholder}
              value={stock}
              onChangeText={(text) => { setStock(text); setError(''); }}
              keyboardType="number-pad"
              editable={!submitting}
            />

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary, opacity: submitting ? 0.6 : 1 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={[styles.submitButtonText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>
                  {editingProductId ? 'Update Product' : 'Create Product'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Products List */}
        <View style={styles.productsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.bold }]}>
              All Products
            </Text>
            <View style={[styles.countBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.countText, { color: colors.primary, fontFamily: Fonts.semiBold }]}>
                {products.length}
              </Text>
            </View>
          </View>

          {products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyIcon, { color: colors.textTertiary }]}>📦</Text>
              <Text style={[styles.emptyText, { color: colors.textTertiary, fontFamily: Fonts.light }]}>
                No products yet.{'\n'}Add your first product!
              </Text>
            </View>
          ) : (
            products.map((product) => (
              <View key={product.id} style={[styles.productCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                {/* Product Image */}
                <View style={styles.imageContainer}>
                  {product.image ? (
                    <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.productImagePlaceholder, { backgroundColor: colors.inputBackground }]}>
                      <Text style={[styles.placeholderIcon, { color: colors.textTertiary }]}>📷</Text>
                      <Text style={[styles.placeholderText, { color: colors.textTertiary, fontFamily: Fonts.light }]}>No Image</Text>
                    </View>
                  )}
                </View>
                
                {/* Product Info */}
                <View style={styles.productInfo}>
                  <View style={styles.productHeader}>
                    <Text 
                      style={[styles.productTitle, { color: colors.text, fontFamily: Fonts.bold }]} 
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {product.title}
                    </Text>
                  </View>
                  
                  {product.description ? (
                    <Text 
                      style={[styles.productDescription, { color: colors.textSecondary, fontFamily: Fonts.light }]} 
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {product.description}
                    </Text>
                  ) : null}
                  
                  {/* Product Details Grid */}
                  <View style={styles.productDetailsGrid}>
                    <View style={[styles.detailCard, { backgroundColor: colors.background }]}>
                      <Text style={[styles.detailLabel, { color: colors.textTertiary, fontFamily: Fonts.light }]}>Price</Text>
                      <Text style={[styles.detailValue, { color: colors.text, fontFamily: Fonts.bold }]}>
                        ₹{product.packetPrice.toFixed(2)}
                      </Text>
                      <Text style={[styles.detailSubtext, { color: colors.textSecondary, fontFamily: Fonts.light }]}>per packet</Text>
                    </View>
                    
                    <View style={[styles.detailCard, { backgroundColor: colors.background }]}>
                      <Text style={[styles.detailLabel, { color: colors.textTertiary, fontFamily: Fonts.light }]}>Per Strip</Text>
                      <Text style={[styles.detailValue, { color: colors.text, fontFamily: Fonts.bold }]}>
                        {product.packetsPerStrip}
                      </Text>
                      <Text style={[styles.detailSubtext, { color: colors.textSecondary, fontFamily: Fonts.light }]}>packets</Text>
                    </View>
                    
                    <View style={[styles.detailCard, { backgroundColor: colors.background }]}>
                      <Text style={[styles.detailLabel, { color: colors.textTertiary, fontFamily: Fonts.light }]}>Stock</Text>
                      <Text style={[styles.detailValue, { color: colors.text, fontFamily: Fonts.bold }]}>
                        {product.stock}
                      </Text>
                      <Text style={[styles.detailSubtext, { color: colors.textSecondary, fontFamily: Fonts.light }]}>strips</Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.productActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                      onPress={() => handleEdit(product)}
                    >
                      <IconSymbol name="pencil" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                      onPress={() => handleQuickStockUpdate(product)}
                    >
                      <IconSymbol name="cube" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                      onPress={() => handleDelete(product.id, product.title)}
                    >
                      <IconSymbol name="trash" size={20} color={colors.primary} />
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
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlayDark }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: Fonts.bold }]}>
              Update Stock
            </Text>
            {editingStockProduct && (
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary, fontFamily: Fonts.medium }]}>
                {editingStockProduct.title}
              </Text>
            )}
            <Text style={[styles.modalLabel, { color: colors.textSecondary, fontFamily: Fonts.light }]}>
              Current stock: {editingStockProduct?.stock} units
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.inputText,
                  fontFamily: Fonts.regular,
                },
              ]}
              placeholder="Enter new stock amount"
              placeholderTextColor={colors.inputPlaceholder}
              value={newStockValue}
              onChangeText={setNewStockValue}
              keyboardType="number-pad"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton, { backgroundColor: colors.secondary }]}
                onPress={() => {
                  setShowStockModal(false);
                  setEditingStockProduct(null);
                  setNewStockValue('');
                }}
              >
                <Text style={[styles.modalCancelButtonText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSubmitButton, { backgroundColor: colors.success }]}
                onPress={handleStockModalSubmit}
              >
                <Text style={[styles.modalButtonText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>Update</Text>
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
  formContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: Fonts.sizes.xl,
    marginBottom: 16,
  },
  label: {
    fontSize: Fonts.sizes.sm,
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
    fontSize: Fonts.sizes.base,
    marginBottom: 4,
  },
  imagePickerHint: {
    fontSize: Fonts.sizes.xs,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginTop: 8,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    marginTop: 8,
    fontSize: Fonts.sizes.sm,
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
    fontSize: Fonts.sizes.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: Fonts.sizes.base,
    marginBottom: 16,
    minHeight: 48,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.semiBold,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: Fonts.sizes.xl,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countText: {
    fontSize: Fonts.sizes.base,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: Fonts.sizes.base,
    textAlign: 'center',
    lineHeight: 22,
  },
  productCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    width: 120,
    height: 120,
    flexShrink: 0,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#D1D5DB',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  placeholderIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  placeholderText: {
    fontSize: Fonts.sizes.xs,
  },
  productInfo: {
    flex: 1,
    minWidth: 0, // Prevents overflow
    flexShrink: 1,
  },
  productHeader: {
    marginBottom: 8,
  },
  productTitle: {
    fontSize: Fonts.sizes.lg,
    lineHeight: 24,
    marginBottom: 4,
  },
  productDescription: {
    fontSize: Fonts.sizes.sm,
    lineHeight: 18,
    marginBottom: 12,
  },
  productDetailsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  detailCard: {
    flex: 1,
    minWidth: 80,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: Fonts.sizes.xs,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: Fonts.sizes.base,
    marginBottom: 2,
  },
  detailSubtext: {
    fontSize: Fonts.sizes.xs,
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-start',
    flexWrap: 'nowrap',
    marginTop: 4,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    flexShrink: 0,
  },
  modalOverlay: {
    flex: 1,
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
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: Fonts.sizes.xl,
  },
  modalSubtitle: {
    fontSize: Fonts.sizes.base,
  },
  modalLabel: {
    fontSize: Fonts.sizes.sm,
    marginTop: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: Fonts.sizes.base,
    marginTop: 8,
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
  },
  modalSubmitButton: {
  },
  modalButtonText: {
    fontSize: Fonts.sizes.base,
  },
  modalCancelButtonText: {
    fontSize: Fonts.sizes.base,
  },
});

