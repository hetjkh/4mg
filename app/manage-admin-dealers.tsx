import { useState, useEffect } from 'react';
import * as React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, useColorScheme, Alert, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getAdminDealers, AdminDealer, getDealerSalesmen } from '@/services/stalkistService';
import { getUser, User } from '@/services/authService';
import { deleteDealer } from '@/services/adminUserService';

export default function ManageAdminDealersScreen() {
  const [dealers, setDealers] = useState<AdminDealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    loadUser();
    loadDealers();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadDealers();
    }, [])
  );

  const loadUser = async () => {
    try {
      const user = await getUser();
      setCurrentUser(user);
      if (user?.role !== 'admin') {
        Alert.alert('Access Denied', 'Only admins can manage dealers.');
        router.back();
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadDealers = async () => {
    try {
      setLoading(true);
      const data = await getAdminDealers();
      setDealers(data);
    } catch (err: any) {
      console.error('Error loading dealers:', err);
      Alert.alert('Error', err.message || 'Failed to load dealers');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDealer = async (dealer: AdminDealer) => {
    try {
      // Get salesmen count
      const dealerData = await getDealerSalesmen(dealer.id, true);
      const salesmenCount = dealerData.totalSalesmen;

      if (salesmenCount > 0) {
        Alert.alert(
          'Delete Dealer',
          `This dealer has ${salesmenCount} salesmen.\n\nDo you want to delete them as well?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete Dealer Only',
              style: 'destructive',
              onPress: async () => {
                try {
                  await deleteDealer(dealer.id, false);
                  Alert.alert('Success', 'Dealer deleted successfully');
                  loadDealers();
                } catch (err: any) {
                  Alert.alert('Error', err.message || 'Failed to delete dealer');
                }
              },
            },
            {
              text: 'Delete All (Including Salesmen)',
              style: 'destructive',
              onPress: async () => {
                try {
                  await deleteDealer(dealer.id, true);
                  Alert.alert('Success', `Dealer and all related salesmen (${salesmenCount}) deleted successfully`);
                  loadDealers();
                } catch (err: any) {
                  Alert.alert('Error', err.message || 'Failed to delete dealer');
                }
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Delete Dealer',
          `Are you sure you want to delete "${dealer.name}"?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  await deleteDealer(dealer.id, false);
                  Alert.alert('Success', 'Dealer deleted successfully');
                  loadDealers();
                } catch (err: any) {
                  Alert.alert('Error', err.message || 'Failed to delete dealer');
                }
              },
            },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to get dealer information');
    }
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
        <View style={styles.dealersContainer}>
          <Text style={styles.sectionTitle}>
            All Dealers ({dealers.length})
          </Text>

          {dealers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No dealers found.
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
                  {dealer.createdBy ? (
                    <View style={styles.createdByBadge}>
                      <Text style={styles.createdByText}>
                        Created by: {dealer.createdBy.name} ({dealer.createdBy.role})
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.createdByBadge}>
                      <Text style={styles.createdByText}>
                        Created by: Admin (Direct)
                      </Text>
                    </View>
                  )}
                  {dealer.createdAt && (
                    <Text style={styles.dealerDate}>
                      Created: {new Date(dealer.createdAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>

                <View style={styles.dealerActions}>
                  <TouchableOpacity
                    style={styles.viewSalesmenButton}
                    onPress={() => router.push(`/dealer-salesmen/${dealer.id}?admin=true`)}
                  >
                    <Text style={styles.viewSalesmenButtonText}>View Salesmen</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteDealer(dealer)}
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
    marginBottom: 8,
  },
  createdByBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#7C3AED20',
    borderWidth: 1,
    borderColor: '#7C3AED',
    marginBottom: 8,
  },
  createdByText: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#7C3AED',
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
  viewSalesmenButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
  },
  viewSalesmenButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
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
});

