import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, useColorScheme, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getDealerSalesmen, DealerSalesmen } from '@/services/stalkistService';
import { getUser, User } from '@/services/authService';
import { deleteSalesman } from '@/services/adminUserService';

export default function DealerSalesmenScreen() {
  const { id, admin } = useLocalSearchParams<{ id: string; admin?: string }>();
  const [data, setData] = useState<DealerSalesmen | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await getUser();
      setCurrentUser(user);
      if (user?.role !== 'admin') {
        Alert.alert('Access Denied', 'Only admins can view dealer salesmen.');
        router.back();
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const isAdminUser = admin === 'true' || currentUser?.role === 'admin';
      const dealerData = await getDealerSalesmen(id, isAdminUser);
      setData(dealerData);
    } catch (err: any) {
      console.error('Error loading dealer salesmen:', err);
      Alert.alert('Error', err.message || 'Failed to load dealer salesmen');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && id) {
      loadData();
    }
  }, [currentUser, id, admin]);

  const handleDeleteSalesman = async (salesmanId: string, salesmanName: string) => {
    Alert.alert(
      'Delete Salesman',
      `Are you sure you want to delete "${salesmanName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSalesman(salesmanId);
              Alert.alert('Success', 'Salesman deleted successfully');
              loadData();
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

  if (!data) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Dealer not found</Text>
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
        <Text style={styles.headerTitle}>Dealer Salesmen</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Dealer Info */}
        <View style={styles.dealerInfoCard}>
          <Text style={styles.dealerName}>{data.dealer.name}</Text>
          <Text style={styles.dealerEmail}>{data.dealer.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{data.dealer.role.toUpperCase()}</Text>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Salesmen</Text>
          <Text style={styles.statValue}>{data.totalSalesmen}</Text>
        </View>

        {/* Salesmen List */}
        <View style={styles.salesmenContainer}>
          <Text style={styles.sectionTitle}>Salesmen ({data.salesmen.length})</Text>
          
          {data.salesmen.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No salesmen found</Text>
            </View>
          ) : (
            data.salesmen.map((salesman) => (
              <View key={salesman.id} style={styles.salesmanCard}>
                <View style={styles.salesmanInfo}>
                  <View style={styles.salesmanHeader}>
                    <Text style={styles.salesmanName}>{salesman.name}</Text>
                    <View style={styles.roleBadgeSalesman}>
                      <Text style={styles.roleTextSalesman}>SALESMAN</Text>
                    </View>
                  </View>
                  <Text style={styles.salesmanEmail}>{salesman.email}</Text>
                  {salesman.createdAt && (
                    <Text style={styles.salesmanDate}>
                      Created: {new Date(salesman.createdAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteSalesman(salesman.id, salesman.name)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#DC2626',
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
  scrollView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    padding: 16,
  },
  dealerInfoCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#1D1D1D',
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 16,
    alignItems: 'center',
  },
  dealerName: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  dealerEmail: {
    fontSize: 16,
    fontFamily: 'Poppins-Light',
    color: '#D1D5DB',
    marginBottom: 12,
  },
  roleBadge: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  roleText: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  statCard: {
    backgroundColor: '#1D1D1D',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Light',
    color: '#D1D5DB',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
  salesmenContainer: {
    marginTop: 8,
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
    borderColor: '#374151',
    backgroundColor: '#1D1D1D',
    marginBottom: 12,
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
  roleBadgeSalesman: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#7C3AED',
  },
  roleTextSalesman: {
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
  deleteButton: {
    marginTop: 12,
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
});

