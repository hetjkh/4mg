import { useState, useEffect } from 'react';
import * as React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, useColorScheme, Alert, ActivityIndicator, Modal } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getDealers, updateDealer, deleteDealer, Dealer } from '@/services/dealerService';
import { getUser, User } from '@/services/authService';

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

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#60A5FA" />
          <Text style={styles.loadingText}>Loading dealers...</Text>
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
        <Text style={styles.headerTitle}>Manage Dealers</Text>
        <TouchableOpacity
          onPress={() => {
            router.push('/admin-register');
          }}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Dealers List */}
        <View style={styles.dealersContainer}>
          <Text style={styles.sectionTitle}>
            My Dealers ({dealers.length})
          </Text>

          {dealers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No dealers yet. Add your first dealer!
              </Text>
            </View>
          ) : (
            dealers.map((dealer) => (
              <View key={dealer.id} style={styles.dealerCard}>
                <View style={styles.dealerInfo}>
                  <View style={styles.dealerHeader}>
                    <Text style={styles.dealerName}>{dealer.name}</Text>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleText}>{dealer.role.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.dealerEmail}>{dealer.email}</Text>
                  {dealer.createdAt && (
                    <Text style={styles.dealerDate}>
                      Created: {new Date(dealer.createdAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>

                <View style={styles.dealerActions}>
                  <TouchableOpacity
                    style={styles.viewDetailsButton}
                    onPress={() => router.push(`/dealer-detail/${dealer.id}`)}
                  >
                    <Text style={styles.viewDetailsButtonText}>View Details</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEdit(dealer)}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(dealer.id, dealer.name)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Dealer</Text>
            
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TextInput
              style={styles.modalInput}
              placeholder="Name *"
              placeholderTextColor="#6B7280"
              value={name}
              onChangeText={(text) => { setName(text); setError(''); }}
              editable={!submitting}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Email *"
              placeholderTextColor="#6B7280"
              value={email}
              onChangeText={(text) => { setEmail(text); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!submitting}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Password (leave blank to keep current)"
              placeholderTextColor="#6B7280"
              value={password}
              onChangeText={(text) => { setPassword(text); setError(''); }}
              secureTextEntry
              editable={!submitting}
            />

            <Text style={styles.hintText}>
              Leave password blank to keep the current password
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={handleCancelEdit}
                disabled={submitting}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSubmitButton, { opacity: submitting ? 0.6 : 1 }]}
                onPress={handleUpdate}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonText}>Update</Text>
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
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  addButtonText: {
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
  hintText: {
    fontSize: 12,
    fontFamily: 'Poppins-Light',
    color: '#9CA3AF',
    marginTop: -8,
    marginBottom: 12,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#DC262620',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Poppins-Light',
    textAlign: 'center',
    color: '#DC2626',
  },
  dealersContainer: {
    gap: 12,
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
  dealerCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#1D1D1D',
    borderColor: '#374151',
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
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    flex: 1,
  },
  roleBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#2563EB',
  },
  roleText: {
    fontSize: 10,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  dealerEmail: {
    fontSize: 14,
    fontFamily: 'Poppins-Light',
    color: '#D1D5DB',
    marginBottom: 4,
  },
  dealerDate: {
    fontSize: 12,
    fontFamily: 'Poppins-Light',
    color: '#9CA3AF',
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
    backgroundColor: '#10B981',
    alignItems: 'center',
  },
  viewDetailsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  editButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
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
    backgroundColor: '#1D1D1D',
    borderWidth: 1,
    borderColor: '#374151',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  modalInput: {
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
    backgroundColor: '#6B7280',
  },
  modalSubmitButton: {
    backgroundColor: '#3B82F6',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
});

