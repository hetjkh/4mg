import { useState, useEffect } from 'react';
import * as React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getStalkists, Stalkist, getStalkistStats } from '@/services/stalkistService';
import { getUser, User } from '@/services/authService';
import { deleteStalkist } from '@/services/adminUserService';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, Fonts } from '@/constants/theme';

export default function ManageStalkistsScreen() {
  const [stalkists, setStalkists] = useState<Stalkist[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const { isDark, colorScheme } = useTheme();
  const colors = Colors[colorScheme];

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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryLight} />
          <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: Fonts.light }]}>Loading stalkists...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colors.primaryLight, fontFamily: Fonts.semiBold }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: Fonts.bold }]}>Manage Stalkists</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={[styles.scrollView, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
        <View style={styles.stalkistsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.bold }]}>
            All Stalkists ({stalkists.length})
          </Text>

          {stalkists.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textTertiary, fontFamily: Fonts.light }]}>
                No stalkists found.
              </Text>
            </View>
          ) : (
            stalkists.map((stalkist) => (
              <View key={stalkist.id} style={[styles.stalkistCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={styles.stalkistInfo}>
                  <View style={styles.stalkistHeader}>
                    <Text style={[styles.stalkistName, { color: colors.text, fontFamily: Fonts.bold }]}>{stalkist.name}</Text>
                    <View style={[styles.roleBadge, { backgroundColor: colors.roleStalkist }]}>
                      <Text style={[styles.roleText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>STALKIST</Text>
                    </View>
                  </View>
                  <Text style={[styles.stalkistEmail, { color: colors.textSecondary, fontFamily: Fonts.light }]}>{stalkist.email}</Text>
                  {stalkist.createdAt && (
                    <Text style={[styles.stalkistDate, { color: colors.textTertiary, fontFamily: Fonts.light }]}>
                      Created: {new Date(stalkist.createdAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>

                <View style={styles.stalkistActions}>
                  <TouchableOpacity
                    style={[styles.viewDetailsButton, { backgroundColor: colors.success }]}
                    onPress={() => router.push(`/stalkist-detail/${stalkist.id}`)}
                  >
                    <Text style={[styles.viewDetailsButtonText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>View Details</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.deleteButton, { backgroundColor: colors.error }]}
                    onPress={() => handleDeleteStalkist(stalkist)}
                  >
                    <Text style={[styles.deleteButtonText, { color: colors.textInverse, fontFamily: Fonts.semiBold }]}>Delete</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  stalkistsContainer: {
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
  stalkistCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
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
  stalkistEmail: {
    fontSize: Fonts.sizes.sm,
    marginBottom: 4,
  },
  stalkistDate: {
    fontSize: Fonts.sizes.xs,
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
    alignItems: 'center',
  },
  viewDetailsButtonText: {
    fontSize: Fonts.sizes.sm,
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: Fonts.sizes.sm,
  },
});

