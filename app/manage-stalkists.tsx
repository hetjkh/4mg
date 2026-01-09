import { useState, useEffect } from 'react';
import * as React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, useColorScheme, Alert, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getStalkists, Stalkist, getStalkistStats } from '@/services/stalkistService';
import { getUser, User } from '@/services/authService';
import { deleteStalkist } from '@/services/adminUserService';

export default function ManageStalkistsScreen() {
  const [stalkists, setStalkists] = useState<Stalkist[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    loadUser();
    loadStalkists();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadStalkists();
    }, [])
  );

  const loadUser = async () => {
    try {
      const user = await getUser();
      setCurrentUser(user);
      if (user?.role !== 'admin') {
        Alert.alert('Access Denied', 'Only admins can manage stalkists.');
        router.back();
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadStalkists = async () => {
    try {
      setLoading(true);
      const data = await getStalkists();
      setStalkists(data);
    } catch (err: any) {
      console.error('Error loading stalkists:', err);
      Alert.alert('Error', err.message || 'Failed to load stalkists');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStalkist = async (stalkist: Stalkist) => {
    try {
      // Get stats to show how many dealers and salesmen will be deleted
      const stats = await getStalkistStats(stalkist.id);
      const dealersCount = stats.totalDealers;
      const salesmenCount = stats.totalSalesmen;

      if (dealersCount > 0 || salesmenCount > 0) {
        Alert.alert(
          'Delete Stalkist',
          `This stalkist has ${dealersCount} dealers and ${salesmenCount} salesmen.\n\nDo you want to delete them as well?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete Stalkist Only',
              style: 'destructive',
              onPress: async () => {
                try {
                  await deleteStalkist(stalkist.id, false);
                  Alert.alert('Success', 'Stalkist deleted successfully');
                  loadStalkists();
                } catch (err: any) {
                  Alert.alert('Error', err.message || 'Failed to delete stalkist');
                }
              },
            },
            {
              text: 'Delete All (Including Dealers & Salesmen)',
              style: 'destructive',
              onPress: async () => {
                try {
                  await deleteStalkist(stalkist.id, true);
                  Alert.alert('Success', `Stalkist and all related dealers (${dealersCount}) and salesmen (${salesmenCount}) deleted successfully`);
                  loadStalkists();
                } catch (err: any) {
                  Alert.alert('Error', err.message || 'Failed to delete stalkist');
                }
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Delete Stalkist',
          `Are you sure you want to delete "${stalkist.name}"?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  await deleteStalkist(stalkist.id, false);
                  Alert.alert('Success', 'Stalkist deleted successfully');
                  loadStalkists();
                } catch (err: any) {
                  Alert.alert('Error', err.message || 'Failed to delete stalkist');
                }
              },
            },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to get stalkist information');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#60A5FA" />
          <Text style={styles.loadingText}>Loading stalkists...</Text>
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
        <Text style={styles.headerTitle}>Manage Stalkists</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.stalkistsContainer}>
          <Text style={styles.sectionTitle}>
            All Stalkists ({stalkists.length})
          </Text>

          {stalkists.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No stalkists found.
              </Text>
            </View>
          ) : (
            stalkists.map((stalkist) => (
              <View key={stalkist.id} style={styles.stalkistCard}>
                <View style={styles.stalkistInfo}>
                  <View style={styles.stalkistHeader}>
                    <Text style={styles.stalkistName}>{stalkist.name}</Text>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleText}>STALKIST</Text>
                    </View>
                  </View>
                  <Text style={styles.stalkistEmail}>{stalkist.email}</Text>
                  {stalkist.createdAt && (
                    <Text style={styles.stalkistDate}>
                      Created: {new Date(stalkist.createdAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>

                <View style={styles.stalkistActions}>
                  <TouchableOpacity
                    style={styles.viewDetailsButton}
                    onPress={() => router.push(`/stalkist-detail/${stalkist.id}`)}
                  >
                    <Text style={styles.viewDetailsButtonText}>View Details</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteStalkist(stalkist)}
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
  scrollView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    padding: 16,
  },
  stalkistsContainer: {
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
  stalkistCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#1D1D1D',
    borderColor: '#374151',
    marginBottom: 12,
  },
  stalkistInfo: {
    marginBottom: 12,
  },
  stalkistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stalkistName: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    flex: 1,
  },
  roleBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#059669',
  },
  roleText: {
    fontSize: 10,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  stalkistEmail: {
    fontSize: 14,
    fontFamily: 'Poppins-Light',
    color: '#D1D5DB',
    marginBottom: 4,
  },
  stalkistDate: {
    fontSize: 12,
    fontFamily: 'Poppins-Light',
    color: '#9CA3AF',
  },
  stalkistActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  viewDetailsButton: {
    flex: 1,
    paddingVertical: 12,
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

