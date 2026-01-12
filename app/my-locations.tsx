import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getMySalesmanAllocations, LocationAllocation } from '@/services/locationAllocationService';
import { getUser, User } from '@/services/authService';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, Fonts } from '@/constants/theme';
import { HeaderWithMenu } from '@/components/HeaderWithMenu';

export default function MyLocationsScreen() {
  const { isDark, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  
  const [allocations, setAllocations] = useState<LocationAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    loadUser();
    loadAllocations();
  }, []);

  const loadUser = async () => {
    try {
      const user = await getUser();
      setCurrentUser(user);
      if (user?.role !== 'salesman') {
        Alert.alert('Access Denied', 'Only salesmen can view this page.');
        router.back();
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadAllocations = async () => {
    try {
      setLoading(true);
      const data = await getMySalesmanAllocations();
      setAllocations(data);
    } catch (err: any) {
      console.error('Error loading allocations:', err);
      Alert.alert('Error', err.message || 'Failed to load allocations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryLight} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <HeaderWithMenu title="My Locations" />

      <ScrollView style={[styles.scrollView, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.infoCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.infoText, { color: colors.text }]}>
            {currentUser?.name || 'Salesman'}
          </Text>
          <Text style={[styles.infoSubtext, { color: colors.textSecondary }]}>
            View your allocated districts and talukas
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Allocated Locations ({allocations.length})
        </Text>

        {allocations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              No locations allocated yet. Contact your dealer to get locations allocated.
            </Text>
          </View>
        ) : (
          allocations.map((allocation) => (
            <View key={allocation.id} style={[styles.allocationCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={styles.allocationHeader}>
                <View style={[styles.districtBadge, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.districtCode, { color: colors.primary }]}>
                    {allocation.districtCode}
                  </Text>
                </View>
                <Text style={[styles.districtName, { color: colors.text }]}>{allocation.districtName}</Text>
              </View>
              
              <View style={[styles.scopeBadge, { backgroundColor: allocation.allocationScope === 'full-district' ? colors.success + '20' : colors.warning + '20' }]}>
                <Text style={[styles.scopeText, { color: allocation.allocationScope === 'full-district' ? colors.success : colors.warning }]}>
                  {allocation.allocationScope === 'full-district' ? 'Full District' : 'Specific Talukas'}
                </Text>
              </View>

              {allocation.allocationScope === 'specific-talukas' && (allocation as any).talukas && (allocation as any).talukas.length > 0 && (
                <View style={styles.talukasContainer}>
                  <Text style={[styles.talukasLabel, { color: colors.textSecondary }]}>Assigned Talukas:</Text>
                  <View style={styles.talukasList}>
                    {(allocation as any).talukas.map((taluka: string, idx: number) => (
                      <View key={idx} style={[styles.talukaBadge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.talukaText, { color: colors.primary }]}>{taluka}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {allocation.allocationScope === 'full-district' && (allocation as any).allTalukas && (allocation as any).allTalukas.length > 0 && (
                <View style={styles.talukasContainer}>
                  <Text style={[styles.talukasLabel, { color: colors.textSecondary }]}>All Talukas ({((allocation as any).allTalukas || []).length}):</Text>
                  <View style={styles.talukasList}>
                    {((allocation as any).allTalukas || []).map((taluka: string, idx: number) => (
                      <View key={idx} style={[styles.talukaBadge, { backgroundColor: colors.success + '20' }]}>
                        <Text style={[styles.talukaText, { color: colors.success }]}>{taluka}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {allocation.createdAt && (
                <Text style={[styles.dateText, { color: colors.textTertiary }]}>
                  Allocated: {new Date(allocation.createdAt).toLocaleDateString()}
                </Text>
              )}
            </View>
          ))
        )}
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
    fontFamily: Fonts.light,
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
    fontFamily: Fonts.semiBold,
  },
  headerTitle: {
    fontSize: Fonts.sizes.xl,
    flex: 1,
    textAlign: 'center',
    fontFamily: Fonts.bold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoText: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.light,
  },
  sectionTitle: {
    fontSize: Fonts.sizes.lg,
    marginBottom: 12,
    fontFamily: Fonts.bold,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Fonts.sizes.base,
    textAlign: 'center',
    fontFamily: Fonts.light,
  },
  allocationCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  allocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  districtBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  districtCode: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.bold,
  },
  districtName: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.bold,
    flex: 1,
  },
  scopeBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  scopeText: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.semiBold,
  },
  talukasContainer: {
    marginTop: 8,
  },
  talukasLabel: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.semiBold,
    marginBottom: 8,
  },
  talukasList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  talukaBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  talukaText: {
    fontSize: Fonts.sizes.xs,
    fontFamily: Fonts.semiBold,
  },
  dateText: {
    fontSize: Fonts.sizes.xs,
    fontFamily: Fonts.light,
    marginTop: 12,
  },
});

