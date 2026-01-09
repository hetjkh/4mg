import { useState, useEffect } from 'react';
import * as React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Modal } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getDealers, updateDealer, deleteDealer, Dealer } from '@/services/dealerService';
import { getUser, User } from '@/services/authService';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, Fonts } from '@/constants/theme';

export default function ManageDealersScreen() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDealerId, setEditingDealerId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Edit form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { isDark, colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  useEffect(() => {
    loadUser();
    loadDealers();
  }, []);

  // Reload dealers when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadDealers();
    }, [])
  );

  const loadUser = async () => {
    try {
      const user = await getUser();
      setCurrentUser(user);
      if (user?.role !== 'stalkist') {
        Alert.alert('Access Denied', 'Only stalkists can manage dealers.');
        router.back();
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadDealers = async () => {
    try {
      setLoading(true);
      const data = await getDealers();
      setDealers(data);
    } catch (err: any) {
      console.error('Error loading dealers:', err);
      Alert.alert('Error', err.message || 'Failed to load dealers');
    } finally {
      setLoading(false);
    }
  };

  const resetEditForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setEditingDealerId(null);
    setError('');
  };

  const handleEdit = (dealer: Dealer) => {
    setEditingDealerId(dealer.id);
    setName(dealer.name);
    setEmail(dealer.email);
    setPassword(''); // Don't show password
    setShowEditModal(true);
    setError('');
  };

  const handleCancelEdit = () => {
    resetEditForm();
    setShowEditModal(false);
  };

  const handleUpdate = async () => {
    if (!editingDealerId) return;

    // Validation
    if (!name.trim() || !email.trim()) {
      setError('Please fill in name and email');
      return;
    }

    if (password.trim() && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await updateDealer(
        editingDealerId,
        name.trim(),
        email.trim(),
        password.trim() || undefined
      );
      Alert.alert('Success', 'Dealer updated successfully!', [
        {
          text: 'OK',
          onPress: () => {
            resetEditForm();
            setShowEditModal(false);
            loadDealers();
          },
        },
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to update dealer');
      Alert.alert('Error', err.message || 'Failed to update dealer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (dealerId: string, dealerName: string) => {
    Alert.alert(
      'Delete Dealer',
      `Are you sure you want to delete "${dealerName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDealer(dealerId);
              Alert.alert('Success', 'Dealer deleted successfully');
              loadDealers();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete dealer');
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryLight} />
          <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: Fonts.light }]}>Loading dealers...</Text>
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
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: Fonts.bold }]}>Manage Dealers</Text>
        <TouchableOpacity
          onPress={() => {
            router.push('/admin-register');
          }}
          style={[styles.addButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.addButtonText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={[styles.scrollView, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
        {/* Dealers List */}
        <View style={styles.dealersContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.bold }]}>
            My Dealers ({dealers.length})
          </Text>

          {dealers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textTertiary, fontFamily: Fonts.light }]}>
                No dealers yet. Add your first dealer!
              </Text>
            </View>
          ) : (
            dealers.map((dealer) => (
              <View key={dealer.id} style={[styles.dealerCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={styles.dealerInfo}>
                  <View style={styles.dealerHeader}>
                    <Text style={[styles.dealerName, { color: colors.text, fontFamily: Fonts.bold }]}>{dealer.name}</Text>
                    <View style={[styles.roleBadge, { backgroundColor: colors.roleDellear }]}>
                      <Text style={[styles.roleText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>{dealer.role.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={[styles.dealerEmail, { color: colors.textSecondary, fontFamily: Fonts.light }]}>{dealer.email}</Text>
                  {dealer.createdAt && (
                    <Text style={[styles.dealerDate, { color: colors.textTertiary, fontFamily: Fonts.light }]}>
                      Created: {new Date(dealer.createdAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>

                <View style={styles.dealerActions}>
                  <TouchableOpacity
                    style={[styles.viewDetailsButton, { backgroundColor: colors.success }]}
                    onPress={() => router.push(`/dealer-detail/${dealer.id}`)}
                  >
                    <Text style={[styles.viewDetailsButtonText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>View Details</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.editButton, { backgroundColor: colors.info }]}
                    onPress={() => handleEdit(dealer)}
                  >
                    <Text style={[styles.editButtonText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.deleteButton, { backgroundColor: colors.error }]}
                    onPress={() => handleDelete(dealer.id, dealer.name)}
                  >
                    <Text style={[styles.deleteButtonText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Edit Dealer Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelEdit}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlayDark }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: Fonts.bold }]}>Edit Dealer</Text>
            
            {error ? (
              <View style={[styles.errorContainer, { backgroundColor: colors.errorBackground, borderColor: colors.error }]}>
                <Text style={[styles.errorText, { color: colors.error, fontFamily: Fonts.light }]}>{error}</Text>
              </View>
            ) : null}

            <TextInput
              style={[styles.modalInput, {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.inputText,
                fontFamily: Fonts.regular,
              }]}
              placeholder="Name *"
              placeholderTextColor={colors.inputPlaceholder}
              value={name}
              onChangeText={(text) => { setName(text); setError(''); }}
              editable={!submitting}
            />

            <TextInput
              style={[styles.modalInput, {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.inputText,
                fontFamily: Fonts.regular,
              }]}
              placeholder="Email *"
              placeholderTextColor={colors.inputPlaceholder}
              value={email}
              onChangeText={(text) => { setEmail(text); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!submitting}
            />

            <TextInput
              style={[styles.modalInput, {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.inputText,
                fontFamily: Fonts.regular,
              }]}
              placeholder="Password (leave blank to keep current)"
              placeholderTextColor={colors.inputPlaceholder}
              value={password}
              onChangeText={(text) => { setPassword(text); setError(''); }}
              secureTextEntry
              editable={!submitting}
            />

            <Text style={[styles.hintText, { color: colors.textTertiary, fontFamily: Fonts.light }]}>
              Leave password blank to keep the current password
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.secondary }]}
                onPress={handleCancelEdit}
                disabled={submitting}
              >
                <Text style={[styles.modalButtonText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary, opacity: submitting ? 0.6 : 1 }]}
                onPress={handleUpdate}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.textInverse} />
                ) : (
                  <Text style={[styles.modalButtonText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>Update</Text>
                )}
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
  hintText: {
    fontSize: Fonts.sizes.xs,
    marginTop: -8,
    marginBottom: 12,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  errorText: {
    fontSize: Fonts.sizes.sm,
    textAlign: 'center',
  },
  dealersContainer: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: Fonts.sizes.lg,
    marginBottom: 12,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Fonts.sizes.base,
    textAlign: 'center',
  },
  dealerCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
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
    fontSize: Fonts.sizes.lg,
    flex: 1,
  },
  roleBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  roleText: {
    fontSize: Fonts.sizes.xs,
  },
  dealerEmail: {
    fontSize: Fonts.sizes.sm,
    marginBottom: 4,
  },
  dealerDate: {
    fontSize: Fonts.sizes.xs,
  },
  dealerActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  viewDetailsButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewDetailsButtonText: {
    fontSize: Fonts.sizes.sm,
  },
  editButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: Fonts.sizes.sm,
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: Fonts.sizes.sm,
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
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: Fonts.sizes.xl,
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: Fonts.sizes.base,
    marginBottom: 12,
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
  modalButtonText: {
    fontSize: Fonts.sizes.base,
  },
});

