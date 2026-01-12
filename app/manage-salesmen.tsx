import { useState, useEffect } from 'react';
import * as React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, useColorScheme, Alert, ActivityIndicator, Modal } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getSalesmen, updateSalesman, deleteSalesman, Salesman } from '@/services/salesmanService';
import { getUser, User } from '@/services/authService';
import { HeaderWithMenu } from '@/components/HeaderWithMenu';

export default function ManageSalesmenScreen() {
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSalesmanId, setEditingSalesmanId] = useState<string | null>(null);
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
    loadSalesmen();
  }, []);

  // Reload salesmen when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadSalesmen();
    }, [])
  );

  const loadUser = async () => {
    try {
      const user = await getUser();
      setCurrentUser(user);
      if (user?.role !== 'dealer' && user?.role !== 'dellear') {
        Alert.alert('Access Denied', 'Only dealers can manage salesmen.');
        router.back();
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadSalesmen = async () => {
    try {
      setLoading(true);
      const data = await getSalesmen();
      setSalesmen(data);
    } catch (err: any) {
      console.error('Error loading salesmen:', err);
      Alert.alert('Error', err.message || 'Failed to load salesmen');
    } finally {
      setLoading(false);
    }
  };

  const resetEditForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setEditingSalesmanId(null);
    setError('');
  };

  const handleEdit = (salesman: Salesman) => {
    setEditingSalesmanId(salesman.id);
    setName(salesman.name);
    setEmail(salesman.email);
    setPassword(''); // Don't show password
    setShowEditModal(true);
    setError('');
  };

  const handleCancelEdit = () => {
    resetEditForm();
    setShowEditModal(false);
  };

  const handleUpdate = async () => {
    if (!editingSalesmanId) return;

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
      await updateSalesman(
        editingSalesmanId,
        name.trim(),
        email.trim(),
        password.trim() || undefined
      );
      Alert.alert('Success', 'Salesman updated successfully!', [
        {
          text: 'OK',
          onPress: () => {
            resetEditForm();
            setShowEditModal(false);
            loadSalesmen();
          },
        },
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to update salesman');
      Alert.alert('Error', err.message || 'Failed to update salesman');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (salesmanId: string, salesmanName: string) => {
    Alert.alert(
      'Delete Salesman',
      `Are you sure you want to delete "${salesmanName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSalesman(salesmanId);
              Alert.alert('Success', 'Salesman deleted successfully');
              loadSalesmen();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete salesman');
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
          <Text style={styles.loadingText}>Loading salesmen...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <HeaderWithMenu
        title="Manage Salesmen"
        rightButton={
          <TouchableOpacity
            onPress={() => {
              router.push('/admin-register');
            }}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Salesmen List */}
        <View style={styles.salesmenContainer}>
          <Text style={styles.sectionTitle}>
            My Salesmen ({salesmen.length})
          </Text>

          {salesmen.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No salesmen yet. Add your first salesman!
              </Text>
            </View>
          ) : (
            salesmen.map((salesman) => (
              <View key={salesman.id} style={styles.salesmanCard}>
                <View style={styles.salesmanInfo}>
                  <View style={styles.salesmanHeader}>
                    <Text style={styles.salesmanName}>{salesman.name}</Text>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleText}>SALESMAN</Text>
                    </View>
                  </View>
                  <Text style={styles.salesmanEmail}>{salesman.email}</Text>
                  {salesman.createdAt && (
                    <Text style={styles.salesmanDate}>
                      Created: {new Date(salesman.createdAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>

                <View style={styles.salesmanActions}>
                  <TouchableOpacity
                    style={styles.allocateButton}
                    onPress={() => router.push(`/allocate-location-to-salesman?salesmanId=${salesman.id}&salesmanName=${encodeURIComponent(salesman.name)}`)}
                  >
                    <Text style={styles.allocateButtonText}>Allocate Location</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEdit(salesman)}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(salesman.id, salesman.name)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Edit Salesman Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Salesman</Text>
            
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
  salesmenContainer: {
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
  salesmanCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#1D1D1D',
    borderColor: '#374151',
  },
  salesmanInfo: {
    marginBottom: 12,
  },
  salesmanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  salesmanName: {
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
  salesmanEmail: {
    fontSize: 14,
    fontFamily: 'Poppins-Light',
    color: '#D1D5DB',
    marginBottom: 4,
  },
  salesmanDate: {
    fontSize: 12,
    fontFamily: 'Poppins-Light',
    color: '#9CA3AF',
  },
  salesmanActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  allocateButton: {
    flex: 1,
    minWidth: '48%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  allocateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  editButton: {
    flex: 1,
    minWidth: '48%',
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

